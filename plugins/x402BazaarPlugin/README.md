# x402 Bazaar Plugin for G.A.M.E.

Give a [G.A.M.E.](https://docs.game.virtuals.io/) agent onchain intelligence on
Base — token risk, wallet net worth, OFAC sanctions, an AI token verdict and a
market brief — each **paid per call in USDC over the [x402](https://x402.org)
protocol**, with no API keys.

> G.A.M.E. decides & acts · **x402 Bazaar tells the agent what to act on** —
> risk, intelligence and AI verdicts — before it commits.

Backed by [x402 Bazaar](https://402.com.tr), a marketplace of 118 pay-per-call
services on Base — the live list is always at
<https://402.com.tr/.well-known/x402>. The agent's wallet key is used locally to
sign x402 payments and is **never sent anywhere**.

## Installation

```bash
npm install @virtuals-protocol/game-x402-bazaar-plugin
```

## Usage

```ts
import { GameAgent } from "@virtuals-protocol/game";
import X402BazaarPlugin from "@virtuals-protocol/game-x402-bazaar-plugin";

const plugin = new X402BazaarPlugin({
  credentials: { privateKey: process.env.AGENT_PRIVATE_KEY }, // Base wallet w/ USDC
});

const agent = new GameAgent(process.env.GAME_API_KEY, {
  name: "Base Safety Agent",
  goal: "Vet Base tokens before acting",
  description: "...",
  workers: [plugin.getWorker()],
});

await agent.init();
await agent.run(60);
```

## Functions

| Function | What it does |
|---|---|
| `get_ai_token_report` | AI buy/avoid verdict for a token (safety score, risks, positives) |
| `get_token_risk` | Fast token safety scan (honeypot, taxes, ownership, holders) |
| `get_wallet_networth` | Wallet token portfolio + USD net worth |
| `check_sanctions` | OFAC sanctions screening for an address |
| `get_market_brief` | AI situational brief of the Base token market |

## Credentials

| Option / Env | Purpose |
|---|---|
| `credentials.privateKey` / `AGENT_PRIVATE_KEY` | Base wallet (holds USDC) used to pay x402 calls. Local only. |
| `origin` / `X402_BAZAAR_ORIGIN` | optional — defaults to `https://402.com.tr` |

Discover all services: <https://402.com.tr/.well-known/x402> ·
docs: <https://402.com.tr/agents> · MCP: `npx x402-bazaar-mcp`
