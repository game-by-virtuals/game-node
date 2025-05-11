import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
} from "@virtuals-protocol/game";
import { AcpClient } from "./acpClient";
import { AcpToken } from "./acpToken";
import {
  AcpJob,
  AcpJobPhasesDesc,
  IDeliverable,
  IInventory,
} from "./interface";
import { ITweetClient } from "@virtuals-protocol/game-twitter-plugin";
import { io, Socket } from "socket.io-client";
import { Address } from "viem";

const SocketEvents = {
  JOIN_EVALUATOR_ROOM: "joinEvaluatorRoom",
  LEAVE_EVALUATOR_ROOM: "leaveEvaluatorRoom",
  ON_EVALUATE: "onEvaluate",
  ROOM_JOINED: "roomJoined",
  ON_PHASE_CHANGE: "onPhaseChange",
};

interface IAcpPluginOptions {
  apiKey: string;
  acpTokenClient: AcpToken;
  twitterClient?: ITweetClient;
  cluster?: string;
  evaluatorCluster?: string;
  onEvaluate?: (
    deliverable: IDeliverable,
    description?: string
  ) => Promise<EvaluateResult>;
  agentRepoUrl?: string;
  jobExpiryDurationMins?: number;
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
  private onEvaluate: (
    deliverable: IDeliverable,
    description?: string
  ) => Promise<EvaluateResult>;
  private onPhaseChange?: (job: AcpJob) => Promise<void>;
  private jobExpiryDurationMins: number;
  private jobMessages: Record<number, Array<{
    fromAgentId: string;
    message: string;
    intention?: string;
    timestamp: string;
    read: Record<string, boolean>;
  }>> = {};

  constructor(options: IAcpPluginOptions) {
      console.log("*************************************");
    console.log("* LOCAL VERSION OF AcpPlugin CONSTRUCTOR CALLED *");
    console.log("* BUILD TIME: " + new Date().toISOString() + " *");
    console.log("*************************************");
    this.acpClient = new AcpClient(
      options.apiKey,
      options.acpTokenClient,
      options.agentRepoUrl
    );
    this.cluster = options.cluster;
    this.evaluatorCluster = options.evaluatorCluster;
    this.onEvaluate = options.onEvaluate || this.defaultOnEvaluate;
    this.jobExpiryDurationMins = options.jobExpiryDurationMins || 1440;

    this.id = "acp_worker";
    this.name = "ACP Worker";
    this.description = `
    Handles trading transactions and jobs between agents. This worker ONLY manages:

    1. RESPONDING to Buy/Sell Needs
      - Find sellers when YOU need to buy something
      - negotiate with the seller if you think the price is too high
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

  setOnPhaseChange(onPhaseChange: (job: AcpJob) => Promise<void>) {
    this.onPhaseChange = onPhaseChange;
  }

  private async defaultOnEvaluate(_: IDeliverable, __?: string) {
    return new EvaluateResult(true, "Evaluated by default");
  }

  private initializeSocket() {
    this.socket = io("https://sdk-dev.game.virtuals.io", {
      auth: {
        walletAddress: this.acpClient.walletAddress,
      },
    });

    this.socket.on(
      SocketEvents.ON_EVALUATE,
      async (data: {
        memoId: number;
        deliverable: IDeliverable;
        description: string;
      }) => {
        if (this.onEvaluate) {
          console.log("in evaluate");
          const { isApproved, reasoning } = await this.onEvaluate(
            data.deliverable,
            data.description
          );
          if (isApproved) {
            await this.acpClient.acpTokenClient.signMemo(
              data.memoId,
              true,
              reasoning
            );
            console.log("signed memo");
          } else {
            await this.acpClient.acpTokenClient.signMemo(
              data.memoId,
              false,
              reasoning
            );
            console.log("signed memo 2");
          }
        }
      }
    );

    this.socket.on(SocketEvents.ON_PHASE_CHANGE, async (data: AcpJob) => {
      await this.onPhaseChange?.(data);
    });

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
    return item;
  }

  public async resetState() {
    await this.acpClient.resetState(this.acpClient.walletAddress);
  }

  public async deleteCompletedJob(jobId: string) {
    await this.acpClient.deleteCompletedJob(jobId);
  }

  public async getAcpState() {
    const serverState = await this.acpClient.getState();

    serverState.inventory.produced = this.producedInventory;

    return serverState;
  }

  public async sendJobMessage(jobId: number, message: string, intention?: string) {
    const agentId = this.acpClient.walletAddress;
    
    // Initialize message array if it doesn't exist
    if (!this.jobMessages[jobId]) {
      this.jobMessages[jobId] = [];
    }
    
    // Add the new message
    const newMessage = {
      fromAgentId: agentId,
      message,
      intention,
      timestamp: new Date().toISOString(),
      read: { [agentId]: true } // sender has read their own message
    };
    
    this.jobMessages[jobId].push(newMessage);
    
    // Also create a memo to persist the message
    const memoContent = JSON.stringify({
      type: "JOB_MESSAGE",
      ...newMessage
    });
    await this.acpClient.negotiateJobOngoing(
      jobId,
      0, // Price not relevant for general message
      memoContent
    );
    return newMessage;
  }

  public getJobMessages(jobId: number) {
    return this.jobMessages[jobId] || [];
  }

  public hasUnreadMessages(jobId: number) {
    const agentId = this.acpClient.walletAddress;
    const messages = this.jobMessages[jobId] || [];
    
    return messages.some(msg => 
      msg.fromAgentId !== agentId && // not from this agent
      (!msg.read[agentId]) // not marked as read by this agent
    );
  }

  public markMessagesAsRead(jobId: number) {
    const agentId = this.acpClient.walletAddress;
    const messages = this.jobMessages[jobId] || [];
    
    messages.forEach(msg => {
      msg.read[agentId] = true;
    });
    
    // Also update memos if needed
    // This would depend on your memo system implementation
  }

  private async loadJobMessages() {
    try {
      const state = await this.getAcpState();
      
      // Process all active jobs
      const allJobs = [
        ...state.jobs.active.asABuyer,
        ...state.jobs.active.asASeller
      ];
      
      for (const job of allJobs) {
        // Get all memos for this job
        const memos = await this.acpClient.acpTokenClient.getMemos(job.jobId);
        
        // Filter and parse message memos
        const messages = memos
          .filter((memo: {content: string}) => {
            try {
              const content = JSON.parse(memo.content);
              return content.type === "JOB_MESSAGE";
            } catch {
              return false;
            }
          })
          .map((memo: any) => {
            const content = JSON.parse(memo.content);
            return {
              fromAgentId: content.fromAgentId,
              message: content.message,
              intention: content.intention,
              timestamp: content.timestamp,
              read: content.read || { [this.acpClient.walletAddress]: false }
            };
          })
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        if (messages.length > 0) {
          this.jobMessages[job.jobId] = messages;
        }
      }
    } catch (error) {
      console.error("Error loading job messages:", error);
    }
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
        this.negotiateJob
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
      - inventory.acquired: Deliverable that your have bought and can be use to achived your objective
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
          hint: "Address must be a hex value of 20 bytes (40 hex characters)"
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
            "Decide if your job request is complex enough to spend money for evaluator agent to assess the relevancy of the output. For simple job request like generate image, insights, facts does not require evaluation. For complex and high level job like generating a promotion video, a marketing narrative, a trading signal should require evaluator to assess result relevancy.",
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

          const existingJob = state.jobs.active.asABuyer.find(
            (c) => c.providerAddress === args.sellerWalletAddress
          );

          if (existingJob) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `You already have an active job as a buyer with ${existingJob.providerAddress} - complete the current job before initiating a new one`
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

          const requireValidator = args.requireEvaluator?.toString() === "true";
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

            if (validators.length === 0) {
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

          const expiredAt = new Date();
          expiredAt.setMinutes(
            expiredAt.getMinutes() + this.jobExpiryDurationMins
          );

          const jobId = await this.acpClient.createJob(
            args.sellerWalletAddress,
            evaluatorAddress,
            price,
            args.serviceRequirements,
            expiredAt
          );

          if (this.twitterClient) {
            console.log("posting tweet");
            const tweet = await this.twitterClient?.post(args.tweetContent);
            await this.acpClient.addTweet(
              jobId,
              tweet.data?.id,
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

  get negotiateJob() {
    return new GameFunction({
      name: 'negotiate_job',
      description: 'Send a message during job negotiation',
      args: [
        {
          name: 'jobId',
          type: 'string',
          description: 'The ID of the job being negotiated'
        },
        {
          name: 'intention',
          type: 'string',
          description: `Your intention for this negotiation (COUNTER, AGREE, CANCEL, GENERAL)`
        },
        {
          name: 'quantity',
          type: 'number',
          description: 'Quantity being proposed',
          optional: true,
        },
        {
          name: 'pricePerUnit',
          type: 'string',
          description: 'Price per unit being proposed',
          optional: true,
        },
        {
          name: 'requirements',
          type: 'string',
          description: 'Requirements being proposed',
          optional: true,
        },
        {
          name: 'message',
          type: 'string',
          description: 'Your negotiation message',
        }
      ] as const,
      executable: async (args, _) => {
        if (!args.jobId) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing job ID - specify which job you're negotiating"
          );
        }
        
        if (!args.message) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing message - provide content for your negotiation"
          );
        }
        
        if (!args.intention || !['COUNTER', 'AGREE', 'CANCEL', 'GENERAL'].includes(args.intention)) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Invalid intention - must be one of: COUNTER, AGREE, CANCEL, GENERAL"
          );
        }
        
        try {
          const state = await this.getAcpState();
          
          // Find the job in either buyer or seller active jobs
          const buyerJob = state.jobs.active.asABuyer.find(c => c.jobId === +(args.jobId || 0));
          const sellerJob = state.jobs.active.asASeller.find(c => c.jobId === +(args.jobId || 0));
          const job = buyerJob || sellerJob;
          
          if (!job) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Job not found - check the ID and verify you're involved in this job"
            );
          }
          
          // Check if job is in negotiation phase
          if (job.phase !== AcpJobPhasesDesc.NEGOTIOATION) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Cannot negotiate - job is in '${job.phase}' phase, must be in 'negotiation' phase`
            );
          }
          
          // Handle different intentions
          if (args.intention === 'COUNTER' || args.intention === 'AGREE') {
            // These intentions require terms
            if (!args.quantity || !args.pricePerUnit || !args.requirements) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `${args.intention} requires all terms (quantity, pricePerUnit, requirements) to be specified`
              );
            }
          }
          
          // Handle the negotiation based on intention
          switch (args.intention) {
            case 'CANCEL':
              // End negotiation with rejection
              await this.acpClient.negotiateJobDone(
                +args.jobId,
                false, // reject
                args.message
              );
              
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify({
                  jobId: args.jobId,
                  intention: args.intention,
                  status: 'Negotiation cancelled',
                  timestamp: Date.now()
                })
              );
              
            case 'AGREE':
              // End negotiation with acceptance
              await this.acpClient.negotiateJobDone(
                +args.jobId,
                true, // accept
                args.message
              );
              
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify({
                  jobId: args.jobId,
                  intention: args.intention,
                  status: 'Terms accepted, proceeding to transaction',
                  timestamp: Date.now()
                })
              );
              
            case 'COUNTER':
              // Continue negotiation with new price proposal
              const proposedPrice = parseFloat(args.pricePerUnit!) * parseFloat(args.quantity!);
              
              await this.acpClient.negotiateJobOngoing(
                +args.jobId,
                proposedPrice,
                `${args.message}\n\nProposed terms: ${args.quantity} units at ${args.pricePerUnit} each. Requirements: ${args.requirements}`
              );
              
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify({
                  jobId: args.jobId,
                  intention: args.intention,
                  status: 'Counter-offer sent',
                  proposedTerms: {
                    quantity: args.quantity,
                    pricePerUnit: args.pricePerUnit,
                    requirements: args.requirements
                  },
                  timestamp: Date.now()
                })
              );
              
            case 'GENERAL':
            default:
              // Just send a message without changing terms
              await this.acpClient.negotiateJobOngoing(
                +args.jobId,
                parseFloat(job.price), // convert price string to number
                args.message
              );
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify({
                  jobId: args.jobId,
                  intention: args.intention,
                  status: 'Negotiation message sent successfully',
                  timestamp: Date.now()
                })
              );
          }
        } catch (e) {
          console.error(e);
          
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `System error while negotiating job - try again after a short delay. ${e}`
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

        console.log("ARGS===>: ", args);
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

        console.log("HERE");

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

          console.log("Job:", job);
          console.log("Job memo:", job.memo);

          if (job.memo && job.memo.length > 0) {
            console.log("job memo id: ", job.memo[0].id);
            await this.acpClient.responseJob(
              +args.jobId,
              args.decision === "ACCEPT",
              job.memo[0].id,
              args.reasoning
            );
          } else {
            console.log("No memo found for job");
          }

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
              `Cannot pay - job is in '${job.phase}' phase, must be in 'pending_payment' phase`
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

          if (job.expiredAt && new Date(job.expiredAt) < new Date()) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Cannot deliver - this job has expired on ${new Date(job.expiredAt).toLocaleString()}. The buyer may need to create a new job request.`
            );
          }

          if (job.phase !== AcpJobPhasesDesc.TRANSACTION) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Cannot deliver - job is in '${job.phase}' phase, must be in 'in_progress' phase`
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
