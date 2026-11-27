import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
  GameWorker,
} from "@virtuals-protocol/game";
import type { Address, Chain, Hex, HttpTransport, PublicClient, WalletClient } from "viem";
import {
  HelmswapApi,
  HelmswapApiError,
  type SwapParams,
  fromBaseUnits,
  isLiveBuildChain,
  minOutAmount,
  netOutAmount,
  toBaseUnits,
} from "./helmswapApi";

export const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const ERC20_DECIMALS_ABI = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export interface IHelmswapPluginOptions {
  /** Wallet that signs and sends. The key never leaves the agent's process. */
  wallet: WalletClient<HttpTransport, Chain>;
  publicClient: PublicClient;
  /** Optional free API key from https://helmswap.com/developers. Never a wallet key. */
  apiKey?: string;
  /** Override the API origin (tests, self-hosting). */
  baseUrl?: string;
  /** Optional payout address (EVM). Address only, never a key. */
  referrer?: string;
  /** Default slippage in basis points (0-1000). */
  slippageBps?: number;
  /** Inject fetch for tests. */
  fetch?: typeof fetch;
}

function isNative(token: string): boolean {
  const t = token.trim().toLowerCase();
  return t === NATIVE_TOKEN || t === "eth" || t === "bnb" || t === "native";
}

async function tokenDecimals(publicClient: PublicClient, token: string): Promise<number> {
  if (isNative(token)) return 18;
  const decimals = await publicClient.readContract({
    address: token as Address,
    abi: ERC20_DECIMALS_ABI,
    functionName: "decimals",
  });
  return Number(decimals);
}

function apiToken(token: string): string {
  return isNative(token) ? "ETH" : token.trim();
}

function parseSlippage(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const bps = Number(raw);
  if (!Number.isInteger(bps) || bps < 0 || bps > 1000) {
    throw new Error("slippageBps must be an integer between 0 and 1000");
  }
  return bps;
}

const fail = (message: string) =>
  new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, message);
const done = (message: string) =>
  new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, message);

const SWAP_ARGS = [
  {
    name: "tokenIn" as const,
    type: "string" as const,
    description: `Token to sell: an ERC-20 address on the wallet's current chain, or ${NATIVE_TOKEN} for the native coin`,
  },
  {
    name: "tokenOut" as const,
    type: "string" as const,
    description: `Token to buy: an ERC-20 address on the wallet's current chain, or ${NATIVE_TOKEN} for the native coin`,
  },
  {
    name: "amountIn" as const,
    type: "string" as const,
    description: "Amount of tokenIn to sell, in normal units (for example 0.01)",
  },
  {
    name: "slippageBps" as const,
    type: "string" as const,
    description: "Optional slippage tolerance in basis points (0-1000). Default 50.",
    optional: true,
  },
];

export class HelmswapPlugin {
  readonly api: HelmswapApi;
  private readonly options: IHelmswapPluginOptions;
  private readonly defaultSlippageBps: number;

  constructor(options: IHelmswapPluginOptions) {
    this.options = options;
    this.defaultSlippageBps = options.slippageBps ?? 50;
    this.api = new HelmswapApi({ baseUrl: options.baseUrl, apiKey: options.apiKey, fetch: options.fetch });
  }

  private async prepare(tokenIn: string, tokenOut: string, amountIn: string, slippageBps?: string) {
    const chainId = await this.options.publicClient.getChainId();
    const [inDecimals, outDecimals] = await Promise.all([
      tokenDecimals(this.options.publicClient, tokenIn),
      tokenDecimals(this.options.publicClient, tokenOut),
    ]);
    const params: SwapParams = {
      chain: chainId,
      tokenIn: apiToken(tokenIn),
      tokenOut: apiToken(tokenOut),
      amountIn: toBaseUnits(amountIn, inDecimals),
      slippageBps: parseSlippage(slippageBps, this.defaultSlippageBps),
      referrer: this.options.referrer,
    };
    return { chainId, params, outDecimals };
  }

  get quoteFunction() {
    return new GameFunction({
      name: "helmswap_quote",
      description:
        "Get a HelmSwap quote for swapping tokenIn to tokenOut on the wallet's current EVM chain. Read-only: nothing is signed or sent.",
      args: SWAP_ARGS,
      executable: async ({ tokenIn, tokenOut, amountIn, slippageBps }, logger) => {
        if (!tokenIn || !tokenOut || !amountIn) return fail("tokenIn, tokenOut and amountIn are required");
        try {
          const { params, outDecimals } = await this.prepare(tokenIn, tokenOut, amountIn, slippageBps);
          logger(`Quoting ${amountIn} ${tokenIn} -> ${tokenOut} on chain ${params.chain}`);
          const quote = await this.api.quote(params);
          const out = fromBaseUnits(netOutAmount(quote), outDecimals);
          const min = fromBaseUnits(minOutAmount(quote), outDecimals);
          return done(
            JSON.stringify({ chainId: params.chain, tokenIn, tokenOut, amountIn, expectedOut: out, minimumOut: min }),
          );
        } catch (err) {
          return fail(`Quote failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    });
  }

  get swapFunction() {
    return new GameFunction({
      name: "helmswap_swap",
      description:
        "Swap tokenIn to tokenOut through HelmSwap on the wallet's current EVM chain. The agent's own wallet signs and sends the transaction.",
      args: SWAP_ARGS,
      executable: async ({ tokenIn, tokenOut, amountIn, slippageBps }, logger) => {
        if (!tokenIn || !tokenOut || !amountIn) return fail("tokenIn, tokenOut and amountIn are required");
        const account = this.options.wallet.account;
        if (!account) return fail("Wallet account is missing");
        try {
          const { chainId, params, outDecimals } = await this.prepare(tokenIn, tokenOut, amountIn, slippageBps);
          if (!isLiveBuildChain(chainId)) return fail(`Swaps are not available on chain ${chainId}`);
          logger(`Swapping ${amountIn} ${tokenIn} -> ${tokenOut} on chain ${chainId}`);
          const quote = await this.api.quote(params);
          const built = await this.api.buildTx(params, quote, account.address);

          const approvals = Array.isArray(built.approvals)
            ? (built.approvals as Array<{ to: string; data: string; value?: string }>)
            : [];
          for (const approval of approvals) {
            const hash = await this.options.wallet.sendTransaction({
              account,
              chain: this.options.wallet.chain,
              to: approval.to as Address,
              data: approval.data as Hex,
              value: BigInt(approval.value ?? 0),
            });
            await this.options.publicClient.waitForTransactionReceipt({ hash });
          }

          const tx = built.tx as { to?: string; data?: string; value?: string } | undefined;
          if (!tx?.to || !tx?.data) return fail("HelmSwap returned no unsigned transaction");
          const hash = await this.options.wallet.sendTransaction({
            account,
            chain: this.options.wallet.chain,
            to: tx.to as Address,
            data: tx.data as Hex,
            value: BigInt(tx.value ?? 0),
          });
          const receipt = await this.options.publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status !== "success") return fail(`Swap transaction reverted: ${hash}`);
          const expectedOut = fromBaseUnits(netOutAmount(quote), outDecimals);
          return done(JSON.stringify({ chainId, txHash: hash, tokenIn, tokenOut, amountIn, expectedOut }));
        } catch (err) {
          const message =
            err instanceof HelmswapApiError ? `${err.message} (${err.status})` : err instanceof Error ? err.message : String(err);
          return fail(`Swap failed: ${message}`);
        }
      },
    });
  }

  getWorker(overrides?: { id?: string; name?: string; description?: string; functions?: GameFunction<any>[] }) {
    return new GameWorker({
      id: overrides?.id ?? "helmswap_worker",
      name: overrides?.name ?? "HelmSwap worker",
      description:
        overrides?.description ??
        "Quotes and executes token swaps through HelmSwap on the wallet's EVM chain. Swaps are non-custodial: the wallet signs.",
      functions: overrides?.functions ?? [this.quoteFunction, this.swapFunction],
      getEnvironment: async () => ({
        chainId: await this.options.publicClient.getChainId(),
        walletAddress: this.options.wallet.account?.address,
      }),
    });
  }
}

export default HelmswapPlugin;
