import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import {
  RecallClient,
  walletClientFromPrivateKey,
} from "@recallnet/sdk/client";
import { type Address, type Hex } from "viem";
import { type ChainName, getChain, testnet } from "@recallnet/chains";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname } from "node:path";

/**
 * Options for the S3Plugin
 * @param id - The ID of the worker
 * @param name - The name of the worker
 * @param description - The description of the worker
 * @param credentials.accessKeyId - The S3 access key ID
 * @param credentials.secretAccessKey - The S3 secret access key
 * @param region - The region of the bucket
 * @param bucket - Name of the existing bucket
 * @param endpoint - Endpoint of the S3 client
 * @param forcePathStyle - Whether to force path style
 * @param sslEnabled - Whether to enable SSL
 */
interface IRecallStoragePluginOptions {
  id?: string;
  name?: string;
  description?: string;
  privateKey: string;
  bucketAlias: string;
  prefix?: string;
  network?: string;
}

/**
 * Result of an upload to Recall
 * @param success - Whether the upload was successful
 * @param tx - The transaction hash of the upload
 */
interface RecallExecuteResponse {
  success: boolean;
  tx?: string;
  data?: string;
}

/**
 * RecallStoragePlugin class
 */
class RecallStoragePlugin {
  private id: string;
  private name: string;
  private description: string;
  private client: RecallClient;
  private bucketAlias: string;
  private prefix: string;

  constructor(options: IRecallStoragePluginOptions) {
    this.id = options.id || "recall_storage_worker";
    this.name = options.name || "Recall Storage Worker";
    this.description =
      options.description ||
      "A worker that will execute tasks with Recall Storage. It is capable of uploading and downloading files.";

    const network = options.network
      ? getChain(options.network as ChainName)
      : testnet;
    this.client = new RecallClient({
      walletClient: walletClientFromPrivateKey(
        options.privateKey as Hex,
        network
      ),
    });
    this.bucketAlias = options.bucketAlias;
    this.prefix = options.prefix || "";
  }

  public getWorker(data?: {
    functions?: GameFunction<any>[];
    getEnvironment?: () => Promise<Record<string, any>>;
  }): GameWorker {
    return new GameWorker({
      id: this.id,
      name: this.name,
      description: this.description,
      functions: data?.functions || [
        this.uploadFileFunction,
        this.downloadFileFunction,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  async getOrCreateBucket(logger: (message: string) => void) {
    try {
      const { result: buckets } = await this.client.bucketManager().list();
      let bucket: Address | undefined;
      if (buckets) {
        const existingBucket = buckets.find(
          (b) => b.metadata?.alias === this.bucketAlias
        );
        if (existingBucket) {
          bucket = existingBucket.addr;
          logger(
            `Successfully found existing bucket "${this.bucketAlias}" at ${existingBucket.addr}`
          );
        } else {
          const {
            result: { bucket: bucketAddr },
          } = await this.client.bucketManager().create({
            metadata: { alias: this.bucketAlias },
          });
          bucket = bucketAddr;
          logger(`Created new bucket "${this.bucketAlias}" at ${bucketAddr}`);
        }
      }
      if (!bucket) {
        throw new Error("Failed to get or create bucket");
      }
      return bucket;
    } catch (error: any) {
      throw new Error(`Failed to get or create bucket: ${error}`);
    }
  }

  /**
   * Upload a file to Recall
   * @returns The upload file function
   */
  get uploadFileFunction() {
    return new GameFunction({
      name: "upload_file",
      description: "Upload a file to Recall storage",
      args: [
        {
          name: "file_path",
          description: "The file path to upload from or download to.",
        },
        {
          name: "object_key",
          description:
            "Optional: The object key to upload the file to. DO NOT provide a key unless explicitly provided.",
          optional: true,
        },
      ] as const,
      executable: async (args: any, logger) => {
        try {
          if (!args.file_path || !existsSync(args.file_path)) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "File path is required and must exist"
            );
          }

          const filePath = args.file_path;
          const fileContent = readFileSync(filePath);
          const objectKey = args.object_key
            ? args.object_key
            : `${Date.now()}-${basename(filePath)}`;
          const fullKey = `${this.prefix}${objectKey}`;
          logger(`Uploading file '${args.file_path}' at key '${fullKey}'`);
          const bucket = await this.getOrCreateBucket(logger);
          const { meta } = await this.client
            .bucketManager()
            .add(bucket as Hex, fullKey, fileContent);
          let result: RecallExecuteResponse = {
            success: true,
            tx: meta?.tx?.transactionHash,
          };
          const feedbackMessage = "File uploaded:\n" + JSON.stringify(result);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to upload file: ${e}`
          );
        }
      },
    });
  }

  /**
   * Download a file from Recall storage to a local file path
   * @returns The download file function
   */
  get downloadFileFunction() {
    return new GameFunction({
      name: "download_file",
      description: "Download a file from Recall storage",
      args: [
        {
          name: "object_key",
          description: "The object key to download the file from",
        },
        {
          name: "file_path",
          description: "File path to download the file to",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.object_key || !args.file_path) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Object key and file path are required"
            );
          }

          logger(`Downloading object at key '${args.object_key}'`);
          const bucket = await this.getOrCreateBucket(logger);

          const { result } = await this.client
            .bucketManager()
            .get(bucket as Hex, args.object_key);

          if (!result) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Failed to download file"
            );
          }

          writeFileSync(args.file_path, result);
          const feedbackMessage = `File downloaded to: ${args.file_path}`;
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to download file: ${e}`
          );
        }
      },
    });
  }
}

export default RecallStoragePlugin;
