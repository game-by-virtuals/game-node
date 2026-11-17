const { validTrade, independentRead } = require("./trade-fixture.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
} = require("@virtuals-protocol/game");
const { getQHooksWorker, QHooksError } = require("../dist/index.js");
const A = n => `0x${n.toString(16).padStart(40, "0")}`;
const H = n => `0x${n.toString(16).padStart(64, "0")}`;
const trade = {
  chain: "4663",
  token: A(1),
  trader: A(2),
  side: "buy",
  amountIn: "9007199254740993001",
};
// Any un-injected fetch is a test failure, never a real request.
globalThis.fetch = async () => {
  throw new Error("Unexpected real fetch");
};
const pick = (w, n) => {
  const f = w.functions.find(f => f.name === "qhooks_" + n);
  assert.ok(f);
  return f;
};
const invoke = (
  w,
  n,
  input,
  logger = () => {
    throw Error("unexpected logger");
  },
) => pick(w, n).execute({ input: { value: JSON.stringify(input) } }, logger);
const world = (options = {}) => {
  const calls = [];
  const state = {
    status: 200,
    data: {
      partial: true,
      costUsd: null,
      note: "Non-executable partial fixture",
    },
  };
  const worker = getQHooksWorker({
    enabled: true,
    ...options,
    fetchImpl: async (url, init = {}) => {
      const body = init.body ? JSON.parse(init.body) : undefined;
      calls.push({ url: String(url), init, body });
      if (state.status !== 200)
        return new Response("REMOTE SECRET TEXT", {
          status: state.status,
          headers: { "retry-after": "7" },
        });
      const route=new URL(String(url)).pathname.split("/").at(-1), name=body?.params?.name??({token:"token_info",quote:"quote"}[route]??route);
      if(name==="prepare_trade"||name==="prepare-trade") state.tradeInput=body?.params?.arguments??body;
      const data=state.data.integrity&&["token_info","quote"].includes(name)?independentRead(state.tradeInput)(name,body?.params?.arguments??Object.fromEntries([...new URL(String(url)).searchParams].map(([k,v])=>[k,k==="zeroForOne"?v==="true":v]))):state.data;
      return Response.json(
        options.transport === "rest"
          ? data
          : {
              jsonrpc: "2.0",
              id: body.id,
              result: {
                structuredContent: data,
                content: [{ type: "text", text: JSON.stringify(data) }],
              },
            },
      );
    },
  });
  return { worker, calls, state };
};

test("native worker and 31 functions are disabled by default, without construction requests", async () => {
  let calls = 0;
  const worker = getQHooksWorker({
    fetchImpl: async () => {
      calls++;
      throw Error("disabled fetch");
    },
  });
  assert.ok(worker instanceof GameWorker);
  assert.equal(worker.functions.length, 31);
  assert.ok(worker.functions.every(f => f instanceof GameFunction));
  assert.equal(
    worker.functions.some(f =>
      /agreement_jar|prepare_tpsl|prepare_limit_order|orders_status/.test(f.name),
    ),
    false,
  );
  assert.deepEqual(await worker.getEnvironment(), {
    enabled: false,
    mode: "read-and-prepare",
    walletSigning: "outside-this-worker",
    toolCount: 31,
    feedbackEnabled: false,
  });
  for (const f of worker.functions) {
    const result = await f.execute({ input: { value: "{}" } }, () => {
      throw Error("logger");
    });
    assert.ok(result instanceof ExecutableGameFunctionResponse);
    assert.equal(result.status, "failed");
    assert.equal(JSON.parse(result.feedback).error.code, "disabled");
  }
  assert.equal(calls, 0);
});
test("strict configuration rejects accidental credentials, arbitrary origins and non-boolean flags", () => {
  for (const options of [
    { enabled: "1" },
    { privateKey: "synthetic-disallowed" },
    { apiKey: "synthetic-disallowed" },
    { baseUrl: "https://example.org" },
    null,
    [],
  ])
    assert.throws(() => getQHooksWorker(options), QHooksError);
});
test("the original 25 functions preserve data, exact amounts and routes on MCP and REST", async () => {
  const when = Math.floor(Date.now() / 1000) + 3600;
  const agreement = {
    payer: A(1),
    payee: A(2),
    asset: "USDG",
    expiresInDays: 1,
    tranches: [{ amount: "9007199254740993.123456", conditions: [{ kind: 2, parties: [A(1)] }] }],
  };
  const cases = [
    ["list_launches", "launches", "GET", { chain: "4663", limit: 1 }],
    ["token_info", "token", "GET", { chain: "4663", token: A(1) }],
    [
      "quote",
      "quote",
      "GET",
      { chain: "4663", pool: H(1), zeroForOne: true, amountIn: "9007199254740993" },
    ],
    ["prepare_launch", "prepare-launch", "POST", { name: "Fixture", ticker: "FX" }],
    ["prepare_trade", "prepare-trade", "POST", trade],
    ["qproof_check", "qproof-check", "GET", { chain: "4663", token: A(1) }],
    ["wallet_portfolio", "wallet-portfolio", "GET", { address: A(1) }],
    ["hooks_catalog", "hooks-catalog", "GET", {}],
    ["agent_stats", "agent-stats", "GET", { referrer: A(1) }],
    ["list_callers", "list-callers", "GET", {}],
    ["caller_record", "caller-record", "GET", { address: A(1) }],
    [
      "otc_quote",
      "otc-quote",
      "POST",
      {
        buyer: A(1),
        seller: A(2),
        token: A(3),
        amount: "1.123456789012345678",
        payAsset: "USDG",
        payAmount: "2.123456",
        expiry: when,
      },
    ],
    [
      "otc_create",
      "otc-create",
      "POST",
      {
        actor: A(1),
        quote: { marker: "unchanged", sellAmount: "1234567890123456789" },
        fundNow: false,
      },
    ],
    [
      "otc_accept",
      "otc-accept",
      "POST",
      { actor: A(2), dealId: "9007199254740993", expectedTermsHash: H(1) },
    ],
    ["deal_status", "deal-status", "GET", { dealId: "9007199254740993" }],
    ["agreement_create", "agreement-create", "POST", agreement],
    ["agreement_fund", "agreement-fund", "POST", agreement],
    [
      "agreement_from_template",
      "agreement-from-template",
      "POST",
      {
        payer: A(1),
        payee: A(2),
        asset: "USDG",
        template: "milestones",
        params: { milestones: [{ amount: "1.123456" }] },
      },
    ],
    ["agreement_status", "agreement-status", "GET", { id: "9007199254740993" }],
    ["agreement_release", "agreement-release", "POST", { id: "1", actor: A(2), tranche: 0 }],
    ["agreement_refund", "agreement-refund", "POST", { id: "1", actor: A(1) }],
    ["agreement_attest", "agreement-attest", "POST", { id: "1", actor: A(1), tranche: 0 }],
    ["perps_markets", "perps-markets", "GET", { coin: "ETH" }],
    ["perps_positions", "perps-positions", "GET", { address: A(1) }],
    [
      "prepare_perps_order",
      "prepare-perps-order",
      "POST",
      {
        address: A(1),
        coin: "ETH",
        side: "buy",
        size: "0.1",
        limitPrice: "2500",
        timeInForce: "Ioc",
        nonce: 1794770000000,
      },
    ],
  ];

  for (const transport of ["mcp", "rest"])
    for (const [name, route, method, args] of cases) {
      const w = world({ transport });
      if(name === "prepare_trade") w.state.data=validTrade(args);
      const r = await invoke(w.worker, name, args);
      assert.equal(r.status, "done");
      assert.deepEqual(JSON.parse(r.feedback), w.state.data);
      assert.equal(w.calls.length, name === "prepare_trade" ? 3 : 1);
      const call = w.calls[0];
      if (transport === "mcp") {
        assert.equal(call.body.params.name, name);
        assert.deepEqual(call.body.params.arguments, args);
      } else {
        const u = new URL(call.url);
        assert.equal(u.origin, "https://qhooks.com");
        assert.equal(u.pathname, "/api/v1/agent/" + route);
        assert.equal(call.init.method, method);
        if (method === "POST") assert.deepEqual(call.body, args);
        else
          for (const [k, v] of Object.entries(args)) assert.equal(u.searchParams.get(k), String(v));
      }
    }
});
test("malformed, oversized, unknown or nested invalid input fails locally", async () => {
  const w = world();
  const f = pick(w.worker, "prepare_trade");
  for (const args of [
    {},
    { input: 17 },
    { input: "{" },
    { input: " ".repeat(65537) },
    { input: "{}", extra: "not allowed" },
    { input: "null" },
    { input: JSON.stringify({ ...trade, amountIn: 1 }) },
    { input: JSON.stringify({ ...trade, privateKey: "synthetic-disallowed" }) },
  ]) {
    const r = await f.executable(args, () => {
      throw Error("logger");
    });
    assert.equal(r.status, "failed");
    assert.equal(JSON.parse(r.feedback).error.code, "invalid_arguments");
  }
  const terms = {
    payer: A(1),
    payee: A(2),
    asset: "USDG",
    tranches: [{ amount: 12, conditions: [] }],
  };
  assert.equal((await invoke(w.worker, "agreement_create", terms)).status, "failed");
  assert.equal(w.calls.length, 0);
});
test("explicit referrer wins and option fills spot preparations only", async () => {
  const w = world({ referrer: A(4) });
  w.state.data=validTrade({...trade,referrer:A(4)});
  await invoke(w.worker, "prepare_trade", trade);
  assert.equal(w.calls[0].body.params.arguments.referrer, A(4));
  w.state.data=validTrade({...trade,referrer:A(5)});
  await invoke(w.worker, "prepare_trade", { ...trade, referrer: A(5) });
  assert.equal(w.calls[3].body.params.arguments.referrer, A(5));
  await invoke(w.worker, "list_launches", {});
  assert.equal(w.calls[6].body.params.arguments.referrer, undefined);
  const r = await invoke(w.worker, "prepare_trade", { ...trade, referrer: A(0) });
  assert.equal(r.status, "failed");
  assert.equal(w.calls.length, 7);
});
test("429/503 return bounded safe failure metadata, no retry, response body or logging", async () => {
  for (const status of [429, 503]) {
    const w = world();
    w.state.status = status;
    const r = await invoke(w.worker, "prepare_trade", trade);
    assert.equal(r.status, "failed");
    const e = JSON.parse(r.feedback).error;
    assert.equal(e.status, status);
    assert.equal(e.retryAfterSeconds, 7);
    assert.equal(r.feedback.includes("REMOTE SECRET TEXT"), false);
    assert.equal(w.calls.length, 1);
  }
});
test("transport exception cannot leak its message or credentials into GAME feedback", async () => {
  const w = getQHooksWorker({
    enabled: true,
    fetchImpl: async () => {
      throw Error("SYNTHETIC SECRET");
    },
  });
  const r = await invoke(w, "list_launches", {});
  assert.equal(r.status, "failed");
  assert.equal(r.feedback.includes("SYNTHETIC SECRET"), false);
});
test("MCP failures, conflicting data and refreshing payloads never become Done", async () => {
  for (const kind of ["isError", "rpcError", "conflict", "refreshing"]) {
    let calls = 0;
    const w = getQHooksWorker({
      enabled: true,
      fetchImpl: async (_url, init) => {
        calls++;
        const { id } = JSON.parse(init.body);
        let result = {
          structuredContent: { status: "ok" },
          content: [{ type: "text", text: '{"status":"ok"}' }],
        };
        if (kind === "isError") result.isError = true;
        if (kind === "conflict") result.content[0].text = '{"status":"different"}';
        if (kind === "refreshing")
          result = {
            structuredContent: { error: "refreshing" },
            content: [{ type: "text", text: '{"error":"refreshing"}' }],
          };
        return Response.json(
          kind === "rpcError"
            ? { jsonrpc: "2.0", id, error: { code: -32000, message: "SYNTHETIC SECRET" } }
            : { jsonrpc: "2.0", id, result },
        );
      },
    });
    const r = await invoke(w, "list_launches", {});
    assert.equal(r.status, "failed");
    assert.equal(r.feedback.includes("SYNTHETIC SECRET"), false);
    assert.equal(calls, 1);
  }
});
