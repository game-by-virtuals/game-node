# Elfa AI Plugin for Virtuals Game

[Elfa AI](https://elfa.ai) is an AI x social product designed for crypto traders who struggle to keep up with rapidly changing trading opportunities. By cutting through the noise, Elfa curates actionable insights and signals from thousands of industry insiders, influencers, and smart traders. This plugin seamlessly integrates the Elfa AI API into your Virtuals Game environment, allowing your agents to access real‑time data and intelligence on crypto tokens, projects, and smart accounts.

## Available Functions

The `ElfaAiPlugin` provides several functions that can be used by the agent:

- `pingFunction`: Pings the Elfa AI API to check connectivity and health.
- `keyStatusFunction`: Retrieves the current status, usage, and limits for your API key.
- `mentionsFunction`: Fetches mentions with smart engagement, providing insights into trending discussions.
- `topMentionsFunction`: Retrieves top mentions for a specified ticker symbol, ranked by engagement.
- `trendingTokensFunction`: Retrieves tokens that are most discussed over a particular time window.
- `accountSmartStatsFunction`: Retrieves social metrics and smart stats for a given username.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-elfa-ai-plugin
```

or

```bash
yarn add @virtuals-protocol/game-elfa-ai-plugin
```

## Usage

### Prerequisites

Generate an API key from the Elfa AI dashboard.  

- API Dashboard: [https://dev.elfa.ai](https://dev.elfa.ai)
- API Documentation: [https://api-docs.elfa.ai/](https://api-docs.elfa.ai/)

### Importing the Plugin

First, import the `ElfaAiPlugin` class from the plugin:

```typescript
import ElfaAiPlugin from "@virtuals-protocol/game-elfa-ai-plugin";
```

### Creating a Worker

Create a worker with the necessary Elfa AI credentials:

```typescript
const elfaAiPlugin = new ElfaAiPlugin({
    credentials: {
        apiKey: "<ELFA_AI_API_KEY>",
    },
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const elfaAgent = new GameAgent("<AGENT_API_TOKEN>", {
    name: "Elfa AI Agent",
    goal: "Demonstrate integration with the Elfa AI API",
    description:
        "An agent that interacts with the Elfa AI API to discover alpha from industry insiders, influencers & traders.",
    workers: [elfaWorker],
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

## License

This project is licensed under the MIT License.
