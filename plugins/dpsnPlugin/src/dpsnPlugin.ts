import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from '@virtuals-protocol/game';
import DpsnClient, {
  ChainOptions,
  ConnectionOptions,
  InitOptions,
} from 'dpsn-client';
import { EventEmitter } from 'events';

interface IDpsnPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  credentials: {
    privateKey: string;
    dpsnUrl: string;
    chainOptions: ChainOptions;
    connectionOptions?: ConnectionOptions;
    initOptions?: InitOptions;
    contractAddress?: string;
  };
}

class DpsnPlugin extends EventEmitter {
  private id: string;
  private name: string;
  private description: string;
  private dpsnClient: InstanceType<typeof DpsnClient>;
  private initialized: boolean = false;

  constructor(options: IDpsnPluginOptions) {
    super();

    this.id = options.id || 'dpsn_worker';
    this.name = options.name || 'DPSN Worker';
    this.description =
      options.description ||
      'A worker that executes tasks within DPSN (Decentralized Publish Subscribe Network). It can publish messages, subscribe to topics, and manage topic ownership.';

    // Initialize the DPSN client
    this.dpsnClient = new DpsnClient(
      options.credentials.dpsnUrl,
      options.credentials.privateKey,
      options.credentials.chainOptions,
      options.credentials.connectionOptions
    );

    // If contractAddress is provided, set blockchain config
    if (options.credentials.contractAddress) {
      this.dpsnClient.setBlockchainConfig(
        options.credentials.chainOptions.rpcUrl,
        options.credentials.contractAddress
      );
    }
  }

  /**
   * Initialize the DPSN client
   */
  public async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
        await this.dpsnClient.init();
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize DPSN client:', error);
        throw error;
      }
    }
  }

  /**
   * Register a message handler for messages from subscribed topics
   * @param handler The handler function to call when a message is received
   * @returns A promise that resolves when the subscription is complete
   */
  public async onMessage(
    handler: (data: { topic: string; message: any }) => void
  ): Promise<void> {
    await this.ensureInitialized();
    this.on('message', handler);
  }

  /**
   * Remove a message handler for a specific topic
   * @param handler The handler function to remove
   */
  public offMessage(
    handler: (data: { topic: string; message: any }) => void
  ): void {
    this.off('message', handler);
  }

  /**
   * Ensure the DPSN client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the GameWorker instance with DPSN functions
   */
  public getWorker(data?: {
    id?: string;
    functions?: GameFunction<any>[];
    getEnvironment?: () => Promise<Record<string, any>>;
  }): GameWorker {
    return new GameWorker({
      id: this.id,
      name: this.name,
      description: this.description,
      functions: data?.functions || [
        this.subscribeToTopicFunction,
        this.unsubscribeToTopicFunction,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  /**
   * Function to subscribe to a DPSN topic
   * Requires the topic to subscribe to
   */
  get subscribeToTopicFunction() {
    return new GameFunction({
      name: 'subscribe_to_topic',
      description:
        'Subscribe to a DPSN topic to receive messages. Returns the received message directly.',
      args: [
        {
          name: 'topic',
          description: 'The DPSN topic to subscribe to',
          type: 'string',
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          await this.ensureInitialized();

          if (!args.topic) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Topic is required.'
            );
          }

          logger(`Subscribing to DPSN topic: ${args.topic}`);
          // Create a promise that will resolve when a message is received
          return new Promise((resolve) => {
            const topic = args.topic as string;

            this.dpsnClient
              .subscribe(topic, (receivedTopic, message) => {
                // Emit the message on the appropriate topic event
                this.emit('message', {
                  topic: receivedTopic,
                  message: message,
                });

                // Convert message to string before returning
                const messageString = JSON.stringify(message);

                // Resolve the promise with the stringified message
                resolve(
                  new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    messageString
                  )
                );
              })
              .then(() => {
                logger(`Successfully subscribed to topic: ${topic}`);
              })
              .catch((error) => {
                resolve(
                  new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to subscribe to topic: ${error.message}`
                  )
                );
              });
          });
        } catch (e: any) {
          logger(`Error: ${e.message}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `could not interpret the dpsn function to call ${e.message}`
          );
        }
      },
    });
  }

  get unsubscribeToTopicFunction() {
    return new GameFunction({
      name: 'unsubscribe_to_topic',
      description: 'unsubscribe to a DPSN topic to stop receive messages.',
      args: [
        {
          name: 'topic',
          description: 'The DPSN topic to unsubscribe to',
          type: 'string',
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          await this.ensureInitialized();

          if (!args.topic) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Topic is required.'
            );
          }

          logger(`Unsubscribing from DPSN topic: ${args.topic}`);
          // Create a promise that will resolve when unsubscription is complete
          return new Promise((resolve) => {
            const topic = args.topic as string;

            this.dpsnClient
              .unsubscribe(topic)
              .then(() => {
                logger(`Successfully unsubscribed from topic: ${topic}`);
                resolve(
                  new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully unsubscribed from topic: ${topic}`
                  )
                );
              })
              .catch((error) => {
                resolve(
                  new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to unsubscribe from topic: ${error.message}`
                  )
                );
              });
          });
        } catch (e: any) {
          logger(`Error: ${e.message}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `could not interpret the dpsn function to call ${e.message}`
          );
        }
      },
    });
  }

  public async disconnect(): Promise<void> {
    if (this.initialized && this.dpsnClient) {
      await this.dpsnClient.disconnect();
      this.initialized = false;
    }
  }
}

export default DpsnPlugin;
