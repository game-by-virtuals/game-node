# @virtuals-protocol/game-maiat-plugin

> Trust score verification for GAME agents — powered by [Maiat Protocol](https://maiat-protocol.vercel.app)

Give your Virtuals agent the ability to **check trust before it acts**. Maiat Protocol provides on-chain verified trust scores for tokens, DeFi protocols, and AI agents on Base.

## Why

AI agents executing swaps autonomously can be exploited by:
- Rug-pull tokens with no history
- Honeypot contracts
- Low-liquidity traps
- Unverified counterparties

Maiat trust scores are computed from verified reviews, on-chain activity, and AI analysis — stored in a `TrustScoreOracle` contract on Base.

## Install

```bash
npm install @virtuals-protocol/game-maiat-plugin
```

## Quick Start

```typescript
import { GameAgent, GameWorkerService } from "@virtuals-protocol/game";
import MaiatTrustPlugin from "@virtuals-protocol/game-maiat-plugin";

const maiatPlugin = new MaiatTrustPlugin({
  minScore: 3.0,   // reject tokens with score < 3.0/10
  chain: "base",
});

const agent = new GameAgent(process.env.GAME_API_KEY!, {
  name: "Trust-Gated Agent",
  goal: "Execute swaps only for tokens with Maiat trust score ≥ 3.0",
  workers: [new GameWorkerService(maiatPlugin.getWorker())],
});

await agent.init();
await agent.step({ verbose: true });
```

## Functions

### `check_trust_score`

Query the trust score for any address or project name.

| Arg | Type | Description |
|-----|------|-------------|
| `identifier` | `string` | `0x...` address or project name (e.g. `"Uniswap"`, `"AIXBT"`) |
| `chain` | `string` | Blockchain (default: `"base"`) |

**Returns:**
```json
{
  "address": "0x...",
  "score": 8.7,
  "risk": "low",
  "type": "DeFi",
  "flags": [],
  "safe": true,
  "summary": "Trust score for Uniswap: 8.7/10 | Risk: LOW | Safe: YES"
}
```

---

### `gate_swap`

Check whether a swap is safe before executing. Checks both sides.

| Arg | Type | Description |
|-----|------|-------------|
| `token_in` | `string` | Token being sold |
| `token_out` | `string` | Token being bought |
| `min_score` | `number` | Minimum score to pass (default: `3.0`) |

**Returns:** `APPROVED` or `REJECTED` with reasons.

---

### `batch_check_trust`

Score multiple addresses at once, sorted by trust.

| Arg | Type | Description |
|-----|------|-------------|
| `identifiers` | `string` | Comma-separated addresses or names (max 10) |

## Configuration

```typescript
new MaiatTrustPlugin({
  apiUrl: "https://maiat-protocol.vercel.app",  // default
  apiKey: "your-api-key",                        // optional
  minScore: 3.0,                                 // 0–10 scale
  chain: "base",                                 // base | bnb | solana
})
```

## Score Scale

| Score | Risk | Meaning |
|-------|------|---------|
| 7–10 | 🟢 Low | Trusted, well-reviewed |
| 4–6.9 | 🟡 Medium | Use with caution |
| 0–3.9 | 🔴 High | Risky, avoid |

## Links

- 🌐 [maiat-protocol.vercel.app](https://maiat-protocol.vercel.app)
- 📦 [GitHub](https://github.com/JhiNResH/maiat-protocol)
- 🔗 Oracle contract (Base Sepolia): `0xF662902ca227BabA3a4d11A1Bc58073e0B0d1139`
- 📖 [API docs](https://maiat-protocol.vercel.app/docs)

## License

MIT
