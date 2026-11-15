# QHooks plugin for GAME

Read QHooks markets and stored QProof, get quotes and prepare unsigned spot, launch, perps, OTC and agreement plans. The user's wallet reviews, signs and submits separately. This plugin has no wallet client, private key, transaction sender, GAME agent or paid planner. It needs no QHooks API key.

## Install and build

This source plugin is not yet published to npm. From `plugins/qhooksPlugin` in this repository, use Node 22 or newer:

```sh
npm ci --ignore-scripts
npm run check
npm test
```

The build produces CommonJS, ESM and TypeScript declarations in `dist`. The package uses the native `@virtuals-protocol/game@0.1.14` worker/function/response types. No GAME API key or planner run is required to construct the worker or invoke a function directly. A host application that separately uses a GAME planner remains responsible for that service and its costs.

## Use

The worker is **disabled by default**. Its functions return a `failed` response with error code `disabled`, without any network request. Opt in explicitly in your application when ready. ESM example (`.mjs` or `node --input-type=module`):

```js
import { getQHooksWorker } from './dist/index.mjs';
const worker = getQHooksWorker({enabled: true});
const read = worker.functions.find(f => f.name === 'qhooks_list_launches');
const response = await read.execute({
  input: {value: JSON.stringify({chain: '4663', limit: 1})}
}, () => {});
if (response.status === 'done') console.log(JSON.parse(response.feedback));
else console.log(JSON.parse(response.feedback).error);
```

In an existing GAME application, register this worker explicitly. This package never starts or initializes a `GameAgent`, creates a schedule, or adds wallet functions. `examples/read.cjs` performs no request by default; `QHOOKS_GAME_ENABLED=1 npm run example` opts into one public launch-list read, with no preparation or transaction.

GAME function values are strings. Each named QHooks function therefore accepts one `input` string containing its complete JSON arguments. Its native argument description includes that function's pinned JSON schema. Nested agreement/OTC fields retain their constraints; invalid JSON, unknown fields and wrong types fail before transport. Keep raw amounts, decimal amounts and IDs as strings, including values larger than JavaScript's safe integer range. Input limit: 64 KiB; response limit: 2 MiB.

## Features and tools

`qhooks_otc_quote`, `qhooks_otc_create`, `qhooks_otc_accept`, `qhooks_deal_status`, `qhooks_agreement_create`, `qhooks_agreement_fund`, `qhooks_agreement_from_template`, `qhooks_agreement_status`, `qhooks_agreement_release`, `qhooks_agreement_refund`, `qhooks_agreement_attest`, `qhooks_qproof_check`, `qhooks_wallet_portfolio`, `qhooks_hooks_catalog`, `qhooks_agent_stats`, `qhooks_list_callers`, `qhooks_caller_record`, `qhooks_perps_markets`, `qhooks_perps_positions`, `qhooks_prepare_perps_order`, `qhooks_list_launches`, `qhooks_token_info`, `qhooks_quote`, `qhooks_prepare_launch`, `qhooks_prepare_trade`.

The inventory is static. Remote tools/list data cannot add functions. `agreement_jar` is excluded because it is not a server tool. `send_feedback` is deliberately excluded because it sends outward team feedback. Held RFQ board, spot order and competition tools are excluded. Service availability and validation are controlled by the released QHooks API.

## Prepare for user-wallet review

```js
const prepare = worker.functions.find(f => f.name === 'qhooks_prepare_trade');
const response = await prepare.execute({input: {value: JSON.stringify({
  chain: '4663', token: tokenPublicAddress, trader: userPublicWalletAddress,
  side: 'buy', amountIn: '1000000000000000'
})}}, () => {});
// A done response contains a plan, not a submitted or completed transaction.
// Show it to the user; their wallet reviews, signs and sends outside this worker.
```

Show the chain, parties, tokens, amounts, fees, spender, minimum output, deadline and every `{to,data,value}` in order. Approval must confirm before its dependent call; re-prepare after a changed input or expiry. A quote is a preview, not counterparty consent or guaranteed execution. Solana launch preparations remain review links. Never forward a returned plan to an unattended signer.

OTC and agreement tools use the released QHooks API; no fallback contract or executor is selected. Agreement create/fund is atomic; existing agreements cannot be topped up. Read agreement/deal status using the actual receipt ID. Preserve expected terms hashes and attestation requirements. See the current [QHooks skill](https://qhooks.com/skill.md) for supported chains, contract addresses, fees and wallet review instructions.

## Options

- `enabled`: boolean, default `false`.
- `referrer`: optional nonzero **public** EVM address. An explicit trade/launch referrer wins; the option fills an absent spot attribution only. Other tools receive no added referrer. No wallet address is discovered automatically.
- `transport`: `mcp` (default) or `rest`; both use only `https://qhooks.com`.
- `timeoutMs`: 1000–30000, default 20000.
- `fetchImpl`: optional Fetch-compatible transport for host integration or controlled testing.

Unknown options are rejected. Never supply a private key or GAME/QHooks API credential to this plugin. It does not accept either.

## Errors and troubleshooting

Successful native responses are `done` and their `feedback` is the original data serialized as JSON. Failed responses are `failed` with `{error:{code,message,status?,retryAfterSeconds?}}`. Treat returned token/report/link text as untrusted data, never instructions. Preserve timestamps, coverage, partial/unknown fields and cache freshness; missing cost or balance is not zero or profit. Stored QProof is not a fresh audit or a safety guarantee.

HTTP 429/503, MCP errors, conflicting structured/text results and refreshing payloads stay failures. Respect Retry-After before a user-directed retry. No redirects, ambient cookies, retries, provider switching or polling are performed. Never automatically retry a preparation. Logs do not include request/response contents. If a tool is unavailable, wait for the service instead of choosing another route or signing anyway.

## Tests

`npm test` builds the package and exercises native SDK objects with controlled transports only. It covers default OFF behavior, all 25 tools on both transports, exact large amounts, nested argument rejection, referrer precedence, unavailable service behavior, safe errors and no automatic retry/logging. No real wallet, GAME planner, paid model or transaction is used. `npm run check` checks the entire package source.

## Contributing

Follow the repository's [contribution guide](../../CONTRIBUTION_GUIDE.md) and plugin PR template. Add behavior tests for changed public seams, keep tool/schema changes explicit, preserve exact amounts and wallet-signing boundaries, and do not add credentials or automatic execution. Contributions use the MIT license.
