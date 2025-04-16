# Zytron Plugin for Virtuals Game

This plugin enables interaction with the Zytron Mainnet, providing functionality to query wallet balances and send tokens.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-zytron-plugin
```

or

```bash
yarn add @virtuals-protocol/game-zytron-plugin
```

## Usage

### Wallet Setup

Before using the plugin, you need to have a Zytron wallet with some native tokens(ETH). Make sure you have:
- A Zytron wallet address
- Private key for transactions
- Sufficient native tokens for transactions

### Importing the Plugin

First, import the `ZytronPlugin` and `ZytronWallet` classes from the plugin:

```typescript
import { ZytronPlugin, ZytronWallet } from "@virtuals-protocol/game-zytron-plugin";
```

### Creating a Worker

Create a worker with your Zytron credentials:

```typescript
const zytronWallet = new ZytronWallet(ZYTRON_PRIVATE_KEY);
const zytronPlugin = new ZytronPlugin({
  id: "zytron_worker",
  name: "Zytron Worker",
  description: "This Worker enables users to execute interactions on the Zytron mainnet.",
  wallet: zytronWallet,
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent(GAME_API_KEY, {
  name: "Zytron Bot",
  goal: "Interact with Zytron Mainnet",
  description: "A bot that can check balances and send tokens on Zytron Mainnet",
  workers: [
    zytronPlugin.getWorker([
        zytronPlugin.checkWalletFunction,
        zytronPlugin.sendTokenFunction,
    ]),
  ],
});
```

### Running the Agent

Initialize and run the agent:

```typescript
(async () => {
  await agent.init();

  const task1 = "Check my wallet";
  const task2 = "Send 0.0001 ETH to 0x456...";

  while (true) {
    await agent.step({
      verbose: true,
    });
    await agent.runTask(task1, {
      verbose: true,
    });
    await agent.runTask(task2, {
      verbose: true,
    });
  }
})();
```

## Available Functions

The `ZytronPlugin` provides several functions that can be used by the agent:

- `checkWalletFunction`: Query a wallet's balance. Arguments: `wallet_address`
- `sendTokenFunction`: Send tokens to another wallet. Arguments: `recipient`, `amount`, `symbol`

