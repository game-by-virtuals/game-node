# Telegram Plugin for Virtuals Game

This plugin allows you to integrate Telegram functionalities into your Virtuals Game.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-telegram-plugin
```

or

```bash
yarn add @virtuals-protocol/game-telegram-plugin
```

## Usage

### Importing the Plugin

First, import the `TelegramPlugin` class from the plugin:

```typescript
import TelegramPlugin from "@virtuals-protocol/game-telegram-plugin";
```

### Creating a Worker

Create a worker with the necessary Telegram credentials:

```typescript
const telegramPlugin = new TelegramPlugin({
  credentials: {
    botToken: "<BOT_TOKEN>",
  },
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("<API_TOKEN>", {
  name: "Telegram Bot",
  goal: "Auto reply message",
  description: "A bot that can post send message and pinned message",
  workers: [
    telegramPlugin.getWorker(),
  ],
});
```

### Running the Agent

Initialize and run the agent:

```typescript
(async () => {
  await agent.init();

  const agentTgWorker = agent.getWorkerById(telegramPlugin.getWorker().id);
  const task = "PROMPT";

  await agentTgWorker.runTask(task, {
    verbose: true, // Optional: Set to true to log each step
  });
})();
```

## Available Functions

The `TelegramPlugin` provides several functions that can be used by the agent:

- `sendMessageFunction`: Send message.
- `sendMediaFunction`: Send media.
- `createPollFunction`: Create poll.
- `pinnedMessageFunction`: Pinned message.
- `unPinnedMessageFunction`: Unpinned message.
- `deleteMessageFunction`: Delete message.

## Event Handlers
The plugin also supports custom handlers for the following Telegram events:
### Handling Incoming Messages
To handle incoming messages, use the `onMessage` method to listen on:
```typescript
telegramPlugin.onMessage((msg) => {
  console.log("Received message:", msg);
});
```
### Handling Poll Answers
To handle poll answers, use the `onPollAnswer` method:
```typescript
telegramPlugin.onPollAnswer((pollAnswer) => {
  console.log("Received poll answer:", pollAnswer);
});
```

## License

This project is licensed under the MIT License.
