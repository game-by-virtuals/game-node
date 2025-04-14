import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
} from "@virtuals-protocol/game";
import { AcpClient } from "./acpClient";
import { AcpToken } from "./acpToken";
import { AcpJobPhasesDesc, IDeliverable, IInventory } from "./interface";
import { ITweetClient } from "@virtuals-protocol/game-twitter-plugin";
import { io, Socket } from "socket.io-client";
import { Address } from "viem";

const SocketEvents = {
  JOIN_EVALUATOR_ROOM: "joinEvaluatorRoom",
  LEAVE_EVALUATOR_ROOM: "leaveEvaluatorRoom",
  ON_EVALUATE: "onEvaluate",
  ROOM_JOINED: "roomJoined",
};

interface IAcpPluginOptions {
  apiKey: string;
  acpTokenClient: AcpToken;
  twitterClient?: ITweetClient;
  cluster?: string;
  evaluatorCluster?: string;
  onEvaluate?: (deliverables: IDeliverable) => Promise<EvaluateResult>;
  agentRepoUrl?: string;
}

export class EvaluateResult {
  isApproved: boolean;
  reasoning: string;

  constructor(isApproved: boolean, reasoning: string) {
    this.isApproved = isApproved;
    this.reasoning = reasoning;
  }
}

class AcpPlugin {
  private id: string;
  private name: string;
  private description: string;
  private acpClient: AcpClient;
  private producedInventory: IInventory[] = [];
  private socket: Socket | null = null;
  private cluster?: string;
  private evaluatorCluster?: string;
  private twitterClient?: ITweetClient;
  private onEvaluate: (deliverable: IDeliverable) => Promise<EvaluateResult>;

  constructor(options: IAcpPluginOptions) {
    this.acpClient = new AcpClient(
      options.apiKey,
      options.acpTokenClient,
      options.agentRepoUrl
    );
    this.cluster = options.cluster;
    this.evaluatorCluster = options.evaluatorCluster;
    this.onEvaluate = options.onEvaluate || this.defaultOnEvaluate;

    this.id = "acp_worker";
    this.name = "ACP Worker";
    this.description = `
    Handles trading transactions and jobs between agents. This worker ONLY manages:

    1. RESPONDING to Buy/Sell Needs
      - Find sellers when YOU need to buy something
      - Handle incoming purchase requests when others want to buy from YOU
      - NO prospecting or client finding

    2. Job Management
      - Process purchase requests. Accept or reject job.
      - Send payments
      - Manage and deliver services and goods

    3. Twitter Integration (tweet history are provided in the environment/state)
      - Post tweets about jobs
      - Reply to tweets about jobs


    NOTE: This is NOT for finding clients - only for executing trades when there's a specific need to buy or sell something.
    `;

    this.initializeSocket();
  }

  private async defaultOnEvaluate(_: IDeliverable) {
    return new EvaluateResult(true, "Evaluated by default");
  }

  private initializeSocket() {
    this.socket = io("https://sdk-dev.game.virtuals.io", {
      auth: {
        evaluatorAddress: this.acpClient.walletAddress,
      },
    });

    this.socket.on(
      SocketEvents.ON_EVALUATE,
      async (data: { memoId: number; deliverable: IDeliverable }) => {
        if (this.onEvaluate) {
          const { isApproved, reasoning } = await this.onEvaluate(
            data.deliverable
          );
          if (isApproved) {
            await this.acpClient.acpTokenClient.signMemo(
              data.memoId,
              true,
              reasoning
            );
          } else {
            await this.acpClient.acpTokenClient.signMemo(
              data.memoId,
              false,
              reasoning
            );
          }
        }
      }
    );

    const cleanup = async () => {
      if (this.socket) {
        this.socket.emit(
          SocketEvents.LEAVE_EVALUATOR_ROOM,
          this.acpClient.walletAddress
        );
        this.socket.disconnect();
      }
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  public addProduceItem(item: IInventory) {
    this.producedInventory.push(item);
  }

  public async resetState() {
    await this.acpClient.resetState(this.acpClient.walletAddress);
  }

  public async getAcpState() {
    const serverState = await this.acpClient.getState();

    serverState.inventory.produced = this.producedInventory;

    return serverState;
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
        this.searchAgentsFunctions,
        this.initiateJob,
        this.respondJob,
        this.payJob,
        this.deliverJob,
      ],
      getEnvironment: async () => {
        const environment = data?.getEnvironment
          ? await data.getEnvironment()
          : {};
        return {
          ...environment,
          ...(await this.getAcpState()),
        };
      },
    });
  }

  get agentDescription() {
    return `
    Inventory structure
      - inventory.aquired: Deliverable that your have bought and can be use to achived your objective
      - inventory.produced: Deliverable that needs to be delivered to your seller

    Job Structure:
      - jobs.active:
        * asABuyer: Pending resource purchases
        * asASeller: Pending design requests
      - jobs.completed: Successfully fulfilled projects
      - jobs.cancelled: Terminated or rejected requests
      - Each job tracks:
        * phase: request (seller should response to accept/reject to the job) → pending_payment (as a buyer to make the payment for the service) → in_progress (seller to deliver the service) → evaluation → completed/rejected
      `;
  }

  get searchAgentsFunctions() {
    return new GameFunction({
      name: "search_agents",
      description:
        "Get a list of all available trading agents and what they're selling. Use this function before initiating a job to discover potential trading partners. Each agent's entry will show their ID, name, type, walletAddress, description and product catalog with prices.",
      args: [
        {
          name: "reasoning",
          type: "string",
          description:
            "Explain why you need to find trading partners at this time",
        },
        {
          name: "keyword",
          type: "string",
          description:
            "Search for agents by name or description. Use this to find specific trading partners or products.",
        },
      ] as const,
      executable: async (args, _) => {
        if (!args.reasoning) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Reasoning for the search must be provided. This helps track your decision-making process for future reference."
          );
        }

        if (!args.keyword) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Keyword for the search must be provided. This helps track your decision-making process for future reference."
          );
        }

        try {
          const availableAgents = await this.acpClient.browseAgents(
            args.keyword,
            this.cluster
          );

          if (availableAgents.length === 0) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "No other trading agents found in the system. Please try again later when more agents are available."
            );
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              availableAgents,
              totalAgentsFound: availableAgents.length,
              timestamp: Date.now(),
              note: "Use the walletAddress when initiating a job with your chosen trading partner.",
            })
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `System error while searching for agents - try again after a short delay. ${e}`
          );
        }
      },
    });
  }

  get initiateJob() {
    return new GameFunction({
      name: "initiate_job",
      description:
        "Creates a purchase request for items from another agent's catalog. Only for use when YOU are the buyer. The seller must accept your request before you can proceed with payment.\n\nHint: Use this when you need to acquire items from other agents - it's the only way to make purchases in the ecosystem. You CANNOT propose sales or initiate jobs to sell your own products.",
      args: [
        {
          name: "sellerWalletAddress",
          type: "string",
          description: "The seller's agent wallet address you want to buy from",
        },
        {
          name: "price",
          type: "string",
          description: "Offered price for service",
        },
        {
          name: "reasoning",
          type: "string",
          description: "Why you are making this purchase request",
        },
        {
          name: "serviceRequirements",
          type: "string",
          description:
            "Detailed specifications for service-based items, only needed if the seller's catalog specifies service requirements. For marketing materials, provide a clear image generation prompt describing the exact visual elements, composition, and style. Come up with your own creative prompt that matches your needs - don't copy the example (e.g. '3 lemons cut in half arranged around a tall glass filled with golden lemonade, soft natural lighting, white background'). Can be left empty for items that don't require specifications.",
        },
        {
          name: "tweetContent",
          type: "string",
          description:
            "Tweet content that will be posted about this job. Must include the seller's Twitter handle (with @ symbol) to notify them",
        },
        {
          name: "requireEvaluator",
          type: "boolean",
          description:
            "Whether to require a evaluator to verify the deliverable",
        },
        {
          name: "evaluatorKeyword",
          type: "string",
          description: "Keyword to search for a evaluator.",
        },
      ] as const,
      executable: async (args, _) => {
        if (!args.price) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing price - specify how much you're offering per unit"
          );
        }
        if (!args.reasoning) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing reasoning - explain why you're making this purchase"
          );
        }

        try {
          const state = await this.getAcpState();

          if (state.jobs.active.asABuyer.length > 0) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "You already have an active job as a buyer - complete or cancel the current job before initiating a new one"
            );
          }

          if (!args.sellerWalletAddress) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Missing seller wallet address - specify who you're buying from"
            );
          }

          if (!args.serviceRequirements) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Missing service requirements - provide detailed specifications for service-based items or marketing materials"
            );
          }

          if (!args.tweetContent) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Missing tweet content - provide the content of the tweet that will be posted about this job"
            );
          }

          if (args.sellerWalletAddress === this.acpClient.walletAddress) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Cannot create job with yourself - choose a different seller"
            );
          }

          const requireValidator = Boolean(args.requireEvaluator);
          if (requireValidator && !args.evaluatorKeyword) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Missing validator keyword - provide a keyword to search for a validator"
            );
          }

          let evaluatorAddress: Address = this.acpClient.walletAddress;
          if (requireValidator && args.evaluatorKeyword) {
            const validators = await this.acpClient.browseAgents(
              args.evaluatorKeyword,
              this.evaluatorCluster
            );

            if (validators.length) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "No evaluator found - try a different keyword"
              );
            }

            evaluatorAddress = validators[0].walletAddress as Address;
          }

          const price = parseFloat(args.price);
          if (isNaN(price) || price <= 0) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Invalid price - must be a positive number"
            );
          }

          const jobId = await this.acpClient.createJob(
            args.sellerWalletAddress,
            evaluatorAddress,
            price,
            args.serviceRequirements
          );

          if (this.twitterClient) {
            const tweet = await this.twitterClient?.post(args.tweetContent);
            await this.acpClient.addTweet(
              jobId,
              tweet.data.id,
              args.tweetContent
            );
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              jobId: jobId,
              sellerWalletAddress: args.sellerWalletAddress,
              price: price,
              serviceRequirements: args.serviceRequirements,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.error(e);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `System error while initiating job - try again after a short delay. ${e}`
          );
        }
      },
    });
  }

  get respondJob() {
    return new GameFunction({
      name: "respond_to_job",
      description:
        "Accepts or rejects an incoming 'request' job. Only for use when YOU are the seller. After accepting, you must wait for buyer's payment before delivery. Use if you want to cancel a request/job.\n\nHint: For all incoming jobs, you must respond (accept/reject) before being able to progress the job in any way.",
      args: [
        {
          name: "jobId",
          type: "string",
          description: "The job ID you are responding to",
        },
        {
          name: "decision",
          type: "string",
          description: "Your response: 'ACCEPT' or 'REJECT'",
        },
        {
          name: "reasoning",
          type: "string",
          description: "Why you made this decision",
        },

        {
          name: "tweetContent",
          type: "string",
          description:
            "Tweet content that will be posted about this job as a reply to the previous tweet (do not use @ symbol)",
        },
      ] as const,
      executable: async (args, _) => {
        if (!args.jobId) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing job ID - specify which job you're responding to"
          );
        }
        if (!args.decision || !["ACCEPT", "REJECT"].includes(args.decision)) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Invalid decision - must be either 'ACCEPT' or 'REJECT'"
          );
        }
        if (!args.reasoning) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing reasoning - explain why you made this decision"
          );
        }

        if (!args.tweetContent) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing tweet content - provide the content of the tweet that will be posted about this job"
          );
        }

        try {
          const state = await this.getAcpState();

          const job = state.jobs.active.asASeller.find(
            (c) => c.jobId === +args.jobId!
          );

          if (!job) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Job not found in your seller jobs - check the ID and verify you're the seller"
            );
          }

          if (job.phase !== AcpJobPhasesDesc.REQUEST) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Cannot respond - job is in '${job.phase}' phase, must be in 'request' phase`
            );
          }

          await this.acpClient.responseJob(
            +args.jobId,
            args.decision === "ACCEPT",
            job.memo[0].id,
            args.reasoning
          );

          if (this.twitterClient) {
            const tweetId = job.tweetHistory.pop()?.tweetId;
            if (tweetId) {
              const tweet = await this.twitterClient.reply(
                tweetId,
                args.tweetContent
              );
              await this.acpClient.addTweet(
                +args.jobId,
                tweet.data.id,
                args.tweetContent
              );
            }
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              jobId: args.jobId,
              decision: args.decision,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.error(e);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `System error while responding to job - try again after a short delay. ${e}`
          );
        }
      },
    });
  }

  get payJob() {
    return new GameFunction({
      name: "pay_job",
      description:
        "Processes payment for an accepted purchase request. Only for use when YOU are the buyer. you can only make payment when job phase is 'pending_payment'. After payment is verified, you must wait for the seller to deliver.\n\nHint: This is your next step after a seller accepts your purchase request - you can't get the items without paying first.",
      args: [
        {
          name: "jobId",
          type: "number",
          description: "The job ID you are paying for",
        },
        {
          name: "amount",
          type: "number",
          description: "The total amount to pay",
        },
        {
          name: "reasoning",
          type: "string",
          description: "Why you are making this payment",
        },
        {
          name: "tweetContent",
          type: "string",
          description:
            "Tweet content that will be posted about this job as a reply to the previous tweet (do not use @ symbol)",
        },
      ] as const,
      executable: async (args, _) => {
        if (!args.jobId) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing job ID - specify which job you're paying for"
          );
        }

        if (!args.amount) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing amount - specify how much you're paying"
          );
        }

        if (!args.reasoning) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing reasoning - explain why you're making this payment"
          );
        }

        if (!args.tweetContent) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing tweet content - provide the content of the tweet that will be posted about this job"
          );
        }

        try {
          const state = await this.getAcpState();

          const job = state.jobs.active.asABuyer.find(
            (c) => c.jobId === +args.jobId!
          );

          if (!job) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Job not found in your buyer jobs - check the ID and verify you're the buyer"
            );
          }

          if (job.phase !== AcpJobPhasesDesc.NEGOTIOATION) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Cannot pay - job is in '${job.phase}' phase, must be in 'negotiation' phase`
            );
          }

          await this.acpClient.makePayment(
            +args.jobId,
            +args.amount,
            job.memo[0].id,
            args.reasoning
          );

          if (this.twitterClient) {
            const tweetId = job.tweetHistory.pop()?.tweetId;
            if (tweetId) {
              const tweet = await this.twitterClient.reply(
                tweetId,
                args.tweetContent
              );
              await this.acpClient.addTweet(
                +args.jobId,
                tweet.data.id,
                args.tweetContent
              );
            }
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            `Payment successfully processed! Here are the details:\n${JSON.stringify(
              {
                jobId: args.jobId,
                amountPaid: args.amount,
                timestamp: Date.now(),
              }
            )}`
          );
        } catch (e) {
          console.error(e);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `System error while processing payment - try again after a short delay. ${e}`
          );
        }
      },
    });
  }

  get deliverJob() {
    return new GameFunction({
      name: "deliver_job",
      description:
        "Completes a sale by delivering items to the buyer. Only for use when YOU are the seller and payment is verified. After delivery, the job is completed and payment is released to your wallet.\n\nHint: This is how you fulfill your sales and get paid - use it as soon as you see payment is verified.",
      args: [
        {
          name: "jobId",
          type: "string",
          description: "The job ID you are delivering for",
        },
        {
          name: "deliverableType",
          type: "string",
          description: "Type of the deliverable",
        },
        {
          name: "deliverable",
          type: "string",
          description: "The deliverable item",
        },
        {
          name: "reasoning",
          type: "string",
          description: "Why you are making this delivery",
        },
        {
          name: "tweetContent",
          type: "string",
          description:
            "Tweet content that will be posted about this job as a reply to the previous tweet (do not use @ symbol)",
        },
      ] as const,
      executable: async (args, _) => {
        if (!args.jobId) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing job ID - specify which job you're delivering for"
          );
        }
        if (!args.reasoning) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing reasoning - explain why you're making this delivery"
          );
        }
        if (!args.deliverable) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing deliverable - specify what you're delivering"
          );
        }

        if (!args.tweetContent) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing tweet content - provide the content of the tweet that will be posted about this job"
          );
        }

        try {
          const state = await this.getAcpState();

          const job = state.jobs.active.asASeller.find(
            (c) => c.jobId === +args.jobId!
          );

          if (!job) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "job not found in your seller jobs - check the ID and verify you're the seller"
            );
          }

          if (job.phase !== AcpJobPhasesDesc.TRANSACTION) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Cannot deliver - job is in '${job.phase}' phase, must be in 'transaction' phase`
            );
          }

          const produced = this.producedInventory.find(
            (i) => i.jobId === job.jobId
          );

          if (!produced) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Cannot deliver - your should be producing the deliverable first before delivering it`
            );
          }

          const deliverable = JSON.stringify({
            type: args.deliverableType,
            value: args.deliverable,
          });

          await this.acpClient.deliverJob(+args.jobId, deliverable);

          this.producedInventory = this.producedInventory.filter(
            (item) => item.jobId !== job.jobId
          );

          if (this.twitterClient) {
            const tweetId = job.tweetHistory.pop()?.tweetId;
            if (tweetId) {
              const tweet = await this.twitterClient.reply(
                tweetId,
                args.tweetContent
              );
              await this.acpClient.addTweet(
                +args.jobId,
                tweet.data.id,
                args.tweetContent
              );
            }
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              status: "success",
              jobId: args.jobId,
              deliverable: args.deliverable,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.error(e);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `System error while delivering items - try again after a short delay. ${e}`
          );
        }
      },
    });
  }
}

export default AcpPlugin;
