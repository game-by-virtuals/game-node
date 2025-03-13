# Recall Storage Plugin for Virtuals Game

This plugin allows you to integrate [Recall agent storage](https://recall.network/) functionality
into your Virtuals Game, allowing you to upload or download files from Recall.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-recall-storage-plugin
```

or

```bash
yarn add @virtuals-protocol/game-recall-storage-plugin
```

## Usage

### Importing the Plugin

First, import the `RecallStoragePlugin` class from the plugin:

```typescript
import RecallStoragePlugin from "@virtuals-protocol/game-recall-storage-plugin";
```

### Creating a Worker

Create a worker with the necessary Twitter credentials:

```typescript
const { RECALL_PRIVATE_KEY, RECALL_BUCKET_ALIAS, RECALL_PREFIX, RECALL_NETWORK } = process.env;

const recallStoragePlugin = new RecallStoragePlugin({
  privateKey: RECALL_PRIVATE_KEY,
  bucketAlias: RECALL_BUCKET_ALIAS,
  prefix: RECALL_PREFIX,
  network: RECALL_NETWORK,
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent(GAME_API_KEY, {
  name: "Recall Storage Bot",
  goal: "Upload and download files to Recall storage",
  description: "A bot that can upload and download files to Recall storage",
  workers: [
    recallStoragePlugin.getWorker({
      functions: [recallStoragePlugin.uploadFileFunction, recallStoragePlugin.downloadFileFunction],
      getEnvironment: async () => ({
        privateKey: RECALL_PRIVATE_KEY,
        bucketAlias: RECALL_BUCKET_ALIAS,
        prefix: RECALL_PREFIX,
        network: RECALL_NETWORK,
      }),
    }),
  ],
});
```

### Running the Agent

Initialize and run the agent:

```typescript
(async () => {
  await agent.init();

  const task1 = "Upload a file to the Recall storage at the path `./package.json`";
  const task2 =
    "Upload a file to the Recall storage at the path `./package.json` with key `hello/world`";
  const task3 =
    "Download a file from the Recall storage at key `hello/world` to the a file at `./test.txt`";

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
    await agent.runTask(task3, {
      verbose: true,
    });
  }
})();
```

## Available Functions

The `RecallStoragePlugin` provides several functions that can be used by the agent:

- `uploadFileFunction`: Upload a file to Recall Storage. Possible arguments: `file_path`,
  `object_key`.
- `downloadFileFunction`: Download a file from Recall Storage. Possible arguments: `object_key`,
  `file_path`.

## License

This project is licensed under the MIT License.
