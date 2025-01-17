# RSS3 Plugin for Virtuals Game

This plugin allows you to integrate decentralized activities into your Virtuals Game. With this plugin, you can easily retrieve activities of anyone, in a format that is structured to be easily interpreted by AI Agents.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-rss3-plugin
```

or

```bash
yarn add @virtuals-protocol/game-rss3-plugin
```

## Usage

### Importing the Plugin

First, import the `RSS3Plugin` class from the plugin:

```typescript
import RSS3Plugin from "@virtuals-protocol/game-rss3-plugin";
```

### Creating a Worker

Create a worker with the necessary RSS3 credentials:

```typescript
const rss3Plugin = new RSS3Plugin({
  credentials: {
    apiKey: "your_api_key", // this is currently optional, you may leave it empty
  },
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("API_KEY", {
  name: "RSS3 Bot",
  goal: "Monitor decentralized activities for sentiment analysis",
  description: "A bot that can monitor anyone's decentralized activities",
  workers: [rss3Plugin.getWorker()],
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

## Available Functions

The `RSS3Plugin` provides 1 function that can be used by the agent:

- `getActivitiesFunction`: Retrieve activities of anyone based on a query.

## License

This project is licensed under the MIT License.
