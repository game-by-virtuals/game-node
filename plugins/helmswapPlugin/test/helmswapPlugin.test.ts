import assert from "node:assert/strict";
import { test } from "node:test";

import { ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

import { HelmswapPlugin, NATIVE_TOKEN } from "../src";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ACCOUNT = { address: "0x1234567890123456789012345678901234567890" };
const QUOTE = {
  ok: true,
  quote: { netOutAmount: "3000000", minOutNet: "2985000" },
  quoteTicket: { id: "t", expiresAt: 1800000000 },
};

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

function setup(opts: { build?: unknown; receiptStatus?: string; quoteStatus?: number; quoteBody?: unknown } = {}) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchMock = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.includes("/api/v1/quote")) return json(opts.quoteStatus ?? 200, opts.quoteBody ?? QUOTE);
    return json(200, opts.build ?? { ok: true, tx: { to: "0xrouter", data: "0xswap", value: "1000000000000000" } });
  }) as unknown as typeof fetch;
  const sent: unknown[] = [];
  const wallet = {
    account: ACCOUNT,
    chain: { id: 8453 },
    sendTransaction: async (tx: unknown) => {
      sent.push(tx);
      return `0xhash${sent.length}`;
    },
  };
  const publicClient = {
    getChainId: async () => 8453,
    readContract: async () => 6,
    waitForTransactionReceipt: async () => ({ status: opts.receiptStatus ?? "success" }),
  };
  const plugin = new HelmswapPlugin({ wallet: wallet as any, publicClient: publicClient as any, fetch: fetchMock });
  return { plugin, calls, sent };
}

const logger = () => {};

test("quote is read-only and returns expected and minimum output", async () => {
  const { plugin, calls, sent } = setup();
  const res = await plugin.quoteFunction.executable({ tokenIn: NATIVE_TOKEN, tokenOut: USDC, amountIn: "0.001" }, logger);
  assert.equal(res.status, ExecutableGameFunctionStatus.Done);
  assert.deepEqual(JSON.parse(res.feedback), {
    chainId: 8453,
    tokenIn: NATIVE_TOKEN,
    tokenOut: USDC,
    amountIn: "0.001",
    expectedOut: 3,
    minimumOut: 2.985,
  });
  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(url.pathname, "/api/v1/quote");
  assert.equal(url.searchParams.get("chainId"), "8453");
  assert.equal(url.searchParams.get("tokenIn"), "ETH");
  assert.equal(url.searchParams.get("amountIn"), "1000000000000000");
  assert.equal(url.searchParams.get("slippageBps"), "50");
  assert.equal(sent.length, 0);
});

test("swap builds, sends approvals then the swap from the agent wallet", async () => {
  const { plugin, calls, sent } = setup({
    build: { ok: true, approvals: [{ to: USDC, data: "0xapprove" }], tx: { to: "0xrouter", data: "0xswap" } },
  });
  const res = await plugin.swapFunction.executable(
    { tokenIn: USDC, tokenOut: NATIVE_TOKEN, amountIn: "2.5", slippageBps: "100" },
    logger,
  );
  assert.equal(res.status, ExecutableGameFunctionStatus.Done, res.feedback);
  assert.equal(JSON.parse(res.feedback).txHash, "0xhash2");
  assert.equal(calls.length, 2);
  const body = JSON.parse(String(calls[1].init.body));
  assert.equal(body.recipient, ACCOUNT.address);
  assert.equal(new URL(calls[0].url).searchParams.get("amountIn"), "2500000");
  assert.equal(new URL(calls[0].url).searchParams.get("slippageBps"), "100");
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0], { account: ACCOUNT, chain: { id: 8453 }, to: USDC, data: "0xapprove", value: 0n });
  assert.deepEqual(sent[1], { account: ACCOUNT, chain: { id: 8453 }, to: "0xrouter", data: "0xswap", value: 0n });
});

test("swap reports reverts, API errors, bad input and empty builds", async () => {
  let r = await setup({ receiptStatus: "reverted" }).plugin.swapFunction.executable(
    { tokenIn: NATIVE_TOKEN, tokenOut: USDC, amountIn: "0.001" },
    logger,
  );
  assert.equal(r.status, ExecutableGameFunctionStatus.Failed);
  assert.match(r.feedback, /reverted/);

  r = await setup({ quoteStatus: 400, quoteBody: { ok: false, error: "Unsupported token" } }).plugin.swapFunction.executable(
    { tokenIn: NATIVE_TOKEN, tokenOut: USDC, amountIn: "0.001" },
    logger,
  );
  assert.equal(r.status, ExecutableGameFunctionStatus.Failed);
  assert.match(r.feedback, /Unsupported token \(400\)/);

  r = await setup({ build: { ok: true } }).plugin.swapFunction.executable(
    { tokenIn: NATIVE_TOKEN, tokenOut: USDC, amountIn: "0.001" },
    logger,
  );
  assert.match(r.feedback, /no unsigned transaction/);

  r = await setup().plugin.swapFunction.executable({ tokenIn: NATIVE_TOKEN, tokenOut: USDC }, logger);
  assert.match(r.feedback, /required/);

  r = await setup().plugin.quoteFunction.executable(
    { tokenIn: NATIVE_TOKEN, tokenOut: USDC, amountIn: "1", slippageBps: "5000" },
    logger,
  );
  assert.equal(r.status, ExecutableGameFunctionStatus.Failed);
  assert.match(r.feedback, /slippageBps/);
});

test("worker exposes both functions and the wallet environment", async () => {
  const { plugin } = setup();
  const worker = plugin.getWorker();
  assert.equal(worker.id, "helmswap_worker");
  assert.deepEqual(
    worker.functions.map((f) => f.name),
    ["helmswap_quote", "helmswap_swap"],
  );
  assert.deepEqual(await worker.getEnvironment!(), { chainId: 8453, walletAddress: ACCOUNT.address });
});
