# Apro Plugin for Virtuals Game

The Apro Plugin enables G.A.M.E agents to interact with the Apro Platform, providing capabilities for agent creation, data verification, and price querying functionalities.

### Features
- Create and register new agents on the Apro Platform
- Verify data with agent signatures
- Query price data from various feeds

### Available Functions
1. `createAndRegisterAgent`: Creates and registers a new agent with specified signers and settings
2. `verifyData`: Verifies data with provided signatures and metadata
3. `priceQuery`: Fetches price data for specific feeds and agents

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-apro-plugin
```

or

```bash
yarn add @virtuals-protocol/game-apro-plugin
```

## Usage

### Importing the Plugin

First, import the `AproPlugin` class from the plugin:

```typescript
import AproPlugin from "@virtuals-protocol/game-apro-plugin";
```

### Setup environment variables

Set the following environment variables:
  - `RPC_URL`: The RPC URL for the blockchain network
  - `PRIVATE_KEY`: Your private key for transaction signing
  - `PROXY_ADDRESS`: The proxy address for the Apro Platform

### Creating a Worker

Create a worker with the necessary credentials:

```typescript
const aproPlugin = new AproPlugin({
  credentials: {
    proxyAddress: process.env.PROXY_ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
    rpcUrl: process.env.RPC_URL,
  }
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("GAME_API_KEY", {
  name: "Apro Bot",
  goal: "Create agents, verify data, and query price data.",
  description: "A bot that can interact with the Apro Platform",
  workers: [aproPlugin.getWorker({})],
});
```

### Running the Agent

Initialize and run the agent:

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
