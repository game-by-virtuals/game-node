import { EnsoClient, RouteParams } from "@ensofinance/sdk";
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
  GameWorker,
} from "@virtuals-protocol/game";
import {
  Address,
  Chain,
  Client,
  HttpTransport,
  parseUnits,
  WalletClient,
} from "viem";
import { ENSO_ETH, ENSO_SUPPORTED_CHAINS, ERC20_ABI_MIN } from "./constants";
import { buildRoutePath } from "./utils";

interface IEnsoWorkerParams {
  apiKey: string;
  wallet: WalletClient<HttpTransport, Chain>;
  publicClient: Client;
}

interface IEnsoFunctionParams<> {
  wallet: WalletClient<HttpTransport, Chain>;
  publicClient: Client;
  ensoClient: EnsoClient;
}

export async function getEnsoWorker(params: IEnsoWorkerParams) {
  const ensoClient = new EnsoClient({ apiKey: params.apiKey });
  return new GameWorker({
    id: "enso_worker",
    name: "Enso worker",
    description:
      "Worker that finds the best route from token to token and executes it",
    functions: [
      ensoRoute({
        ensoClient,
        wallet: params.wallet,
        publicClient: params.publicClient,
      }),
    ],
  });
}

function ensoRoute(params: IEnsoFunctionParams) {
  return new GameFunction({
    name: "enso_route",
    description:
      "Find the best route from a token to another token and execute it",
    args: [
      {
        name: "tokenIn",
        type: "string",
        description:
          "Token to swap from. Use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token",
      },
      {
        name: "tokenOut",
        type: "string",
        description:
          "Token to swap to. Use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token",
      },
      {
        name: "amountIn",
        type: "string",
        description: "Amount of tokenIn in precision of token",
      },
    ] as const,
    executable: async ({ tokenIn, tokenOut, amountIn }, logger) => {
      if (!tokenIn) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "Token in is required",
        );
      }
      if (!tokenOut) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "Token out is required",
        );
      }

      if (!amountIn) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "Amount in is required",
        );
      }

      const chainId = await params.wallet.getChainId();

      if (!ENSO_SUPPORTED_CHAINS.has(chainId)) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Chain ${chainId} is not supported`,
        );
      }

      const [sender] = await params.wallet.getAddresses();

      try {
        const tokenInRes = await params.ensoClient.getTokenData({
          chainId,
          address: tokenIn as Address,
        });
        if (
          tokenInRes.data.length === 0 ||
          typeof tokenInRes.data[0].decimals !== "number"
        ) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Token ${tokenIn} is not supported`,
          );
        }
        const tokenInData = tokenInRes.data[0];

        const amountInWei = parseUnits(amountIn, tokenInData.decimals);

        const routeParams: RouteParams = {
          chainId,
          tokenIn: tokenIn as Address,
          tokenOut: tokenOut as Address,
          amountIn,
          fromAddress: sender,
          receiver: sender,
          spender: sender,
        };

        logger(`Fetching the best route...`);
        const routeData = await params.ensoClient.getRouterData(routeParams);
        logger(
          `Successfully found the best route:\n  ${buildRoutePath(routeData.route)}`,
        );

        if (tokenIn.toLowerCase() !== ENSO_ETH) {
          logger(`Approving ${tokenInData.symbol}...`);
          const { request } = await params.publicClient.simulateContract({
            address: tokenIn as Address,
            abi: ERC20_ABI_MIN,
            functionName: "approve",
            args: [routeData.tx.to as Address, BigInt(amountIn)],
            account: sender,
          });

          const txHash = await params.wallet.writeContract(request);
          logger(`Approve transaction submitted: ${txHash}`);

          await params.publicClient.waitForTransactionReceipt({
            hash: txHash,
          });
          logger(`Approve successful`);
        }

        logger(`Executing route...`);
        const txHash = await params.wallet.sendTransaction({
          account: sender,
          data: routeData.tx.data as Address,
          to: routeData.tx.to,
          value: BigInt(routeData.tx.value),
        });

        logger(`Route execution submitted: ${txHash}`);

        await params.publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        // NOTE : Execute trade
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Route executed succesfully, hash: ${txHash}`,
        );
      } catch (err) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed execute route from Enso API: ${err}`,
        );
      }
    },
  });
}
