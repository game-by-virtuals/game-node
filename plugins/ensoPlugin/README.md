# Enso Plugin for Virtuals Game

The Enso action plugin allows your GAME agents to access 180+ protocols through Enso for onchain actions, such as swap, deposit, lend, borrow, etc

Chains supported:

- Ethereum
- Optimism
- BNB Chain
- Gnosis
- Polygon
- ZkSync
- Base
- Arbitrum
- Avalanche

Example operations:

- "Swap 15000 USDT to WETH"
- "Withdraw aEthWBTC from Aave V3 for USDC"
- "Deposit 10 ETH into stETH Curve pool"

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-enso-plugin
```

or

```bash
yarn add @virtuals-protocol/game-enso-plugin
```

## Usage

1. Make sure the .env variables are set

```
WALLET_PRIVATE_KEY=
RPC_PROVIDER_URL=
ENSO_API_KEY=1e02632d-6feb-4a75-a157-documentation
```

2. Import the `getOnChainActionsWorker` function from the plugin:

```typescript
import { getEnsoWorker } from "@virtuals-protocol/game-enso-plugin";
```

3. Setup up a wallet and public clients

Make sure to use the correct chain from `viem/chains`

Example for Base

```typescript
import { Address, createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as Address);

const publicClient = createPublicClient({
  transport: http(process.env.RPC_PROVIDER_URL),
  chain: base,
});

const walletClient = createWalletClient({
  account: account,
  transport: http(process.env.RPC_PROVIDER_URL),
  chain: base,
});
```

4. Create the worker adding the wallet, public client and Enso API key

```typescript
const ensoActionsWorker = await getEnsoWorker({
   wallet: walletClient,
   publicClient,
   apiKey: process.env.ENSO_API_KEY || "1e02632d-6feb-4a75-a157-documentation",
});
```

5. Create an agent and add Enso worker to it:

Swap example on Ethereum:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
   name: "Enso Actions Agent",
   goal: "Swap 100 0xdac17f958d2ee523a2206206994597c13d831ec7 (USDT) for 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599 (WBTC)",
   description:
    "An agent that finds the best route between tokens and executes it",
   workers: [ensoActionsWorker],
});
```

Withdraw from Aave example on Ethereum:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
   name: "Enso Actions Agent",
   goal: "Withdraw 1 0x5ee5bf7ae06d1be5997a1a72006fe6c607ec6de8 (aEthWBTC) for 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 (USDC)",
   description:
    "An agent that finds the best route between tokens and executes it",
   workers: [ensoActionsWorker],
});
```

6. Initialize and run the agent:

```typescript
(async () => {
  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });
  }
})();
```
