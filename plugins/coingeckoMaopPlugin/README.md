# Coingecko Plugin for Virtuals Game

The Coingecko plugin seamlessly empowers G.A.M.E agents with cryptocurrency data fetching capabilities using the Coingecko API, enabling the retrieval of current market data without introducing any additional complexity.

### Features

- Fetch current cryptocurrency prices
- Retrieve market data for various cryptocurrencies
- Built-in error handling and status tracking

### Available Functions

1. `fetchPrice`: Retrieves the current price of a specified cryptocurrency

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-coingecko-maop-plugin
```

or

```bash
yarn add @virtuals-protocol/game-coingecko-maop-plugin
```

## Usage

### Importing the Plugin

First, import the `CoingeckoMAOPPlugin` class from the plugin:

```typescript
import CoingeckoMAOPPlugin from "@virtuals-protocol/game-coingecko-maop-plugin";
```

### Setup environment variables

Set the following environment variables:

- `COINGECKO_MAOP_API_KEY`: Create an API key by contact [questflow](mailto:contact@questflow.ai).

### Creating a Worker

Create a worker with the necessary questflow maop API client config:

```typescript
const coingeckoMAOPPlugin = new CoingeckoMAOPPlugin({
  apiClientConfig: {
    apiKey: process.env.MAOP_GAME_PLUGIN_API_KEY,
  },
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("GAME_API_KEY", {
  name: "Cryptocurrency Data Worker",
  goal: "Fetch the current price of Bitcoin.",
  description:
    "You are an AI agent specialized in fetching cryptocurrency data. You can retrieve current market data using the Coingecko API.",
  workers: [coingeckoMAOPPlugin.getWorker({})],
});
```

### Running the Agent

Initialize and run the agent:

```typescript
(async () => {
  // Optional: Set up logging
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });
  }
})();
```

### Example Worker Usage

Here's a simple example of using the worker directly:

```typescript
const worker = coingeckoMAOPPlugin.getWorker({});

// The worker will automatically use the fetch_price function
// to retrieve the current price of Bitcoin
worker.run("retrieve the current price of Bitcoin");
```

### Configuration Options

The plugin accepts the following configuration options when initializing:

```typescript
interface ICoingeckoMAOPPluginOptions {
  id?: string; // Custom worker ID
  name?: string; // Custom worker name
  description?: string; // Custom worker description
  apiClientConfig: {
    apiKey?: string; // Questflow maop API key
    baseApiUrl?: string; // Custom API endpoint (optional)
  };
}
```

## Development

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
export GAME_API_KEY="your-game-api-key"
export MAOP_GAME_PLUGIN_API_KEY="your-maop-game-plugin-api-key"
```

4. Build the plugin:

```bash
npm run tsup
```

5. Run the example:

```bash
ts-node examples/example.ts
```

or

```bash
npm run example
```

5. Run special function example:

```bash
npm run coinDataByID
```
