# HelmSwap Plugin for Virtuals GAME

Gives a GAME agent two functions for token swaps on EVM chains:

- `helmswap_quote`: read-only quote (expected and minimum output). Nothing is signed or sent.
- `helmswap_swap`: gets a quote, asks HelmSwap for an unsigned transaction, then signs and sends it with the agent's own wallet (approval first, if one is needed).

HelmSwap never receives a private key and never signs or broadcasts. The wallet you pass to the plugin stays in your process.

Swaps work on Base, BNB Chain, Ethereum, Ink, HyperEVM and other chains listed at https://helmswap.com/developers. The plugin uses whatever chain your `viem` clients are on.

## Installation

```bash
npm install @virtuals-protocol/game-helmswap-plugin
```

## Usage

1. Set your environment:

```
GAME_API_KEY=
WALLET_PRIVATE_KEY=
RPC_PROVIDER_URL=
HELMSWAP_API_KEY=   # optional, free at https://helmswap.com/developers
```

2. Create the plugin and add its worker to your agent:

```typescript
import { GameAgent } from "@virtuals-protocol/game";
import HelmswapPlugin from "@virtuals-protocol/game-helmswap-plugin";

const helmswap = new HelmswapPlugin({
  wallet,        // viem WalletClient with an account
  publicClient,  // viem PublicClient on the same chain
  apiKey: process.env.HELMSWAP_API_KEY,
});

const agent = new GameAgent(process.env.GAME_API_KEY!, {
  name: "Swap Agent",
  goal: "Quote and swap tokens when asked",
  description: "Quotes swaps and executes them with its own wallet",
  workers: [helmswap.getWorker()],
});

await agent.init();
```

Use `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee` for the chain's native coin. `amountIn` is in normal units (for example `0.01`). `slippageBps` is optional (default 50, max 1000).

To give the agent quotes only, pass just the quote function:

```typescript
helmswap.getWorker({ functions: [helmswap.quoteFunction] });
```

## Options

| Option | Required | Purpose |
| --- | --- | --- |
| `wallet` | Yes | viem `WalletClient` that signs and sends |
| `publicClient` | Yes | viem `PublicClient` for decimals and receipts |
| `apiKey` | No | Free HelmSwap API key, sent as `X-Helm-Key`. Never a wallet key. |
| `slippageBps` | No | Default slippage in basis points |
| `referrer` | No | Optional payout address (address only) |
| `baseUrl` | No | API origin. Defaults to `https://helmswap.com` |

## Example

See `src/example.ts`. Run it with `npx tsx src/example.ts` after setting the environment.

## Tests

```bash
npm install
npm test
```

The tests mock HTTP and the wallet, so they make no network calls.
