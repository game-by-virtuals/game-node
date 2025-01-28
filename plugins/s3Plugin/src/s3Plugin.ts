import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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
interface IS3PluginOptions {
  id?: string;
  name?: string;
  description?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  sslEnabled?: boolean;
}

/**
 * Result of an S3 upload
 * @param success - Whether the upload was successful
 * @param url - The URL of the uploaded file
 */
interface S3UploadResult {
  success: boolean;
  url?: string;
}

/**
 * S3Plugin class
 */
class S3Plugin {
  private id: string;
  private name: string;
  private description: string;
  private s3Client: S3Client;
  private bucket: string;

  constructor(options: IS3PluginOptions) {
    this.id = options.id || "s3_worker";
    this.name = options.name || "S3 Worker";
    this.description =
      options.description ||
      "A worker that will execute tasks with S3-compatible bucket storage. It is capable of uploading and downloading files.";

    this.s3Client = new S3Client({
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      ...(options.sslEnabled ? { sslEnabled: options.sslEnabled } : {}),
      ...(options.forcePathStyle
        ? { forcePathStyle: Boolean(options.forcePathStyle) }
        : {}),
      region: options.region,
      credentials: {
        accessKeyId: options.credentials.accessKeyId,
        secretAccessKey: options.credentials.secretAccessKey,
      },
    });
    this.bucket = options.bucket;
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

  /**
   * Upload a file to S3
   * @returns The upload file function
   */
  get uploadFileFunction() {
    return new GameFunction({
      name: "upload_file",
      description: "Upload a file to S3",
      args: [
        {
          name: "file_path",
          description: "The file path to upload from or download to.",
        },
        {
          name: "object_key",
          description:
            "Optional: The object key to upload the file to. If not provided, internal logic will generate a unique key. DO NOT define a key if it is not explicitly provided (default: `timestamp-file_name`)",
        },
        {
          name: "use_signed_url",
          description:
            "Optional: Whether to use a signed URL or default the standard access URL (default: false)",
        },
        {
          name: "ttl",
          description:
            "Optional: If using a signed URL, the expiration time for the signed URL in seconds (default: 3600 seconds)",
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

          logger(`Uploading file '${args.file_path}' at key '${objectKey}'`);
          await this.s3Client.send(
            new PutObjectCommand({
              Bucket: this.bucket,
              Key: objectKey,
              Body: fileContent,
              ContentType: this.getContentType(filePath),
            })
          );

          let result: S3UploadResult = {
            success: true,
          };
          if (!args.use_signed_url) {
            if (this.s3Client.config.endpoint) {
              const endpoint = await this.s3Client.config.endpoint();
              const port = endpoint.port ? `:${endpoint.port}` : "";
              result.url = `${endpoint.protocol}//${endpoint.hostname}${port}${endpoint.path}${this.bucket}/${objectKey}`;
            } else {
              result.url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;
            }
          } else {
            const expiresIn = args.ttl || 3600; // 1 hour
            const getObjectCommand = new GetObjectCommand({
              Bucket: this.bucket,
              Key: objectKey,
            });
            result.url = await getSignedUrl(this.s3Client, getObjectCommand, {
              expiresIn,
            });
          }

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
   * Download a file from S3 to a local file path
   * @returns The download file function
   */
  get downloadFileFunction() {
    return new GameFunction({
      name: "download_file",
      description: "Download a file from S3",
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

          const response = await this.s3Client.send(
            new GetObjectCommand({
              Bucket: this.bucket,
              Key: args.object_key,
            })
          );

          const fileContent = await response.Body?.transformToByteArray();
          if (!fileContent) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Failed to download file"
            );
          }

          writeFileSync(args.file_path, fileContent);
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

  /**
   * Helper function to get the content type of a file
   * @param filePath - The file path to get the content type of
   * @returns The content type of the file
   */
  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    return contentTypes[ext] || "application/octet-stream";
  }
}

export default S3Plugin;
