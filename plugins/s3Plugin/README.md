# S3 Plugin for Virtuals Game

This plugin allows you to integrate S3 functionalities into your Virtuals Game. With this plugin,
you can upload files to S3, download files from S3, and more.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-s3-plugin
```

or

```bash
yarn add @virtuals-protocol/game-s3-plugin
```

## Usage

### Importing the Plugin

First, import the `S3Plugin` class from the plugin:

```typescript
import S3Plugin from "@virtuals-protocol/game-s3-plugin";
```

### Creating a Worker

Create a worker with the necessary Twitter credentials:

```typescript
const s3Plugin = new S3Plugin({
  credentials: {
    accessKeyId: "AKEXAMPLES3S",
    secretAccessKey: "SKEXAMPLES3S,
  },
  region: "us-east-1",
  bucket: "virtuals-game-bucket",
  endpoint: "http://localhost:8014",
  sslEnabled: false,
  forcePathStyle: true,
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("GAME_API_KEY", {
  name: "S3 Agent",
  goal: "Upload and download files to S3",
  description: "An agent that can upload and download files to S3",
  workers: [s3Plugin.getWorker()],
});
```

### Running the Agent

Initialize and run the agent:

```typescript
(async () => {
  await agent.init();

  const task1 =
    "Upload a file to the S3 bucket at the path `./package.json` and key `hello/world`, and use a signed URL with a TTL of 900 seconds";
  const task2 =
    "Download a file from the S3 bucket at key `hello/world` to the a file at `./test.txt`";

  while (true) {
    await agent.step({
      verbose: true,
    });

    await agentS3Worker.runTask(task1, {
      verbose: true,
    });
    await agentS3Worker.runTask(task2, {
      verbose: true,
    });
  }
})();
```

## Available Functions

The `S3Plugin` provides several functions that can be used by the agent:

- `uploadFileFunction`: Upload a file to S3. Possible arguments: `file_path`, `object_key`,
  `use_signed_url`, `ttl`.
- `downloadFileFunction`: Download a file from S3. Possible arguments: `file_path`, `object_key`.

## License

This project is licensed under the MIT License.
