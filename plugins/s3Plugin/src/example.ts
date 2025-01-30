import { GameAgent } from "@virtuals-protocol/game";
import S3Plugin from "./s3Plugin";

import dotenv from "dotenv";
dotenv.config();

// Validate environment variables
const {
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_REGION,
  S3_BUCKET,
  S3_UPLOAD_PATH,
  S3_ENDPOINT,
  S3_SSL_ENABLED,
  S3_FORCE_PATH_STYLE,
  GAME_API_KEY,
} = process.env;

if (
  !S3_ACCESS_KEY_ID ||
  !S3_SECRET_ACCESS_KEY ||
  !S3_REGION ||
  !S3_BUCKET ||
  !GAME_API_KEY
) {
  throw new Error(
    "Missing required environment variables. Please check your .env file."
  );
}

// Create a worker with the functions
const s3Plugin = new S3Plugin({
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  region: S3_REGION ?? "us-east-1",
  bucket: S3_BUCKET,
  endpoint: S3_ENDPOINT ?? "",
  sslEnabled: S3_SSL_ENABLED === "true",
  forcePathStyle: S3_FORCE_PATH_STYLE === "true",
});

// Create an agent with the worker
const agent = new GameAgent(GAME_API_KEY, {
  name: "S3 Bot",
  goal: "upload and download files to S3",
  description: "A bot that can upload and download files to S3",
  workers: [
    s3Plugin.getWorker({
      // Define the functions that the worker can perform, (defaults to all functions defined in the plugin)
      functions: [s3Plugin.uploadFileFunction, s3Plugin.downloadFileFunction],
      // Define the environment variables that the worker can access
      getEnvironment: async () => ({
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
        region: S3_REGION,
        bucket: S3_BUCKET,
        uploadPath: S3_UPLOAD_PATH,
        endpoint: S3_ENDPOINT,
        sslEnabled: S3_SSL_ENABLED,
        forcePathStyle: S3_FORCE_PATH_STYLE,
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

  const agentS3Worker = agent.getWorkerById(agent.workers[0].id);

  // Explicitly define the tasks: uploading a file with default values, uploading a file with a key and a signed URL, and downloading a file
  const task1 = "Upload a file to the S3 bucket at the path `./package.json`";
  const task2 =
    "Upload a file to the S3 bucket at the path `./README.md` with key `hello/world` and use a signed URL with a TTL of 900 seconds";
  const task3 =
    "Download a file from the S3 bucket at key `hello/world` to the a file at `./test.txt`";

  // Run the tasks
  await agentS3Worker.runTask(task1, {
    verbose: true,
  });
  await agentS3Worker.runTask(task2, {
    verbose: true,
  });
  await agentS3Worker.runTask(task3, {
    verbose: true,
  });
})();
