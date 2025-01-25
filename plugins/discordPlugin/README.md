# Discord Plugin for Virtuals Game

This plugin allows you to integrate Discord functionalities into your Virtuals Game. With this plugin, you can send message, pin message, add reaction and delete message in Discord.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-discord-plugin
```

or

```bash
yarn add @virtuals-protocol/game-discord-plugin
```

## Usage

### Importing the Plugin

First, import the `DiscordPlugin` class from the plugin:

```typescript
import DiscordPlugin from "@virtuals-protocol/game-discord-plugin";
```

### Creating a Worker

Create a worker with the necessary DiscordPlugin credentials:

```typescript
const discordPlugin = new DiscordPlugin({
  credentials: {
    botToken: "<BOT TOKEN>"
  },
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("<API_KEY>", {
  name: "Discord Bot",
  goal: "increase engagement and grow follower count",
  description: "A bot that can reply message, add reaction, pin message and delete message in Discord.",
  workers: [
    discordPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        discordPlugin.sendMessageFunction,
        discordPlugin.addReactionFunction,
        discordPlugin.pinMessageFunction,
        discordPlugin.deleteMessageFunction,
      ],
    }),
  ],
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

The `DiscordPlugin` provides several functions that can be used by the agent:

- `sendMessageFunction`: Send a message in discord
- `addReactionFunction`: Add a reaction in discord message.
- `pinMessageFunction`: Pin a message in discord message.
- `deleteMessageFunction`: Delete a message in discord.

## Event Handlers
The plugin also supports custom handlers for the following Discord events:
### Handling Incoming Messages
To handle incoming messages, use the `onMessage` method to listen on:
```typescript
discordPlugin.onMessage((msg) => {
  console.log("Received message:", msg);
});
```

## License

This project is licensed under the MIT License.
