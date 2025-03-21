import { GameAgent } from "@virtuals-protocol/game";
import RecallStoragePlugin from "./recallStoragePlugin.js";
import { temporaryWrite, temporaryFile } from "tempy";

import dotenv from "dotenv";
dotenv.config();

// Validate environment variables
const {
  RECALL_PRIVATE_KEY,
  RECALL_BUCKET_ALIAS,
  RECALL_PREFIX,
  RECALL_NETWORK,
  GAME_API_KEY,
} = process.env;

if (!RECALL_PRIVATE_KEY || !RECALL_BUCKET_ALIAS || !GAME_API_KEY) {
  throw new Error(
    "Missing required environment variables. Please check your .env file."
  );
}

// Create a worker with the functions
const recallStoragePlugin = new RecallStoragePlugin({
  privateKey: RECALL_PRIVATE_KEY,
  bucketAlias: RECALL_BUCKET_ALIAS,
  prefix: RECALL_PREFIX,
  network: RECALL_NETWORK,
});

// Create an agent with the worker
const agent = new GameAgent(GAME_API_KEY, {
  name: "Recall Storage Bot",
  goal: "upload and download files to Recall storage",
  description: "A bot that can upload and download files to Recall storage",
  workers: [
    recallStoragePlugin.getWorker({
      // Define the functions that the worker can perform, (defaults to all functions defined in the plugin)
      functions: [
        recallStoragePlugin.uploadFileFunction,
        recallStoragePlugin.downloadFileFunction,
      ],
      // Define the environment variables that the worker can access
      getEnvironment: async () => ({
        privateKey: RECALL_PRIVATE_KEY,
        bucketAlias: RECALL_BUCKET_ALIAS,
        prefix: RECALL_PREFIX,
        network: RECALL_NETWORK,
      }),
    }),
  ],
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();

  const agentRecallStorageWorker = agent.getWorkerById(agent.workers[0].id);
  const uploadFilePath1 = await temporaryWrite("hello world");
  const uploadFilePath2 = await temporaryWrite("hello again");
  const downloadFilePath = temporaryFile();

  // Explicitly define the tasks: uploading a file with default values, uploading a file with a key, and downloading a file
  const task1 = `Upload a file to the Recall storage at the path ${uploadFilePath1}`;
  const task2 = `Upload a file to the Recall storage at the path ${uploadFilePath2} with key hello/world`;
  const task3 = `Download a file from the Recall storage at key ${RECALL_PREFIX}hello/world to the a file at ${downloadFilePath}`;

  // Run the tasks
  await agentRecallStorageWorker.runTask(task1, {
    verbose: true,
  });
  await agentRecallStorageWorker.runTask(task2, {
    verbose: true,
  });
  await agentRecallStorageWorker.runTask(task3, {
    verbose: true,
  });
})();
