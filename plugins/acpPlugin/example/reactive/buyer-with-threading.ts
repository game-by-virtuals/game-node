import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker,
} from "@virtuals-protocol/game";
import * as readline from "readline";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";
import AcpClient, {
  AcpContractClient,
  AcpJob,
  AcpJobPhases,
  baseAcpConfig
} from "@virtuals-protocol/acp-node";
import {
  WHITELISTED_WALLET_PRIVATE_KEY,
  BUYER_ENTITY_ID,
  BUYER_AGENT_WALLET_ADDRESS,
  GAME_API_KEY,
} from "./env";

// GAME Twitter Plugin import
import { TwitterApi } from "@virtuals-protocol/game-twitter-node";
import { BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN } from "./env";

// Native Twitter Plugin imports
// import { TwitterClient } from "@virtuals-protocol/game-twitter-plugin";
// import {
//   BUYER_AGENT_TWITTER_ACCESS_TOKEN,
//   BUYER_AGENT_TWITTER_API_KEY,
//   BUYER_AGENT_TWITTER_API_SECRET_KEY,
//   BUYER_AGENT_TWITTER_ACCESS_TOKEN_SECRET,
// } from "./env";

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

const twitterClient = new TwitterApi({
  gameTwitterAccessToken: BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN,
});

// Native Twitter Plugin
// const twitterClient = new TwitterClient({
//     apiKey: BUYER_AGENT_TWITTER_API_KEY,
//     apiSecretKey: BUYER_AGENT_TWITTER_API_SECRET_KEY,
//     accessToken: BUYER_AGENT_TWITTER_ACCESS_TOKEN,
//     accessTokenSecret: BUYER_AGENT_TWITTER_ACCESS_TOKEN_SECRET,
// });

async function buyer(useThreadLock: boolean = true) {
  if (!WHITELISTED_WALLET_PRIVATE_KEY) {
    console.log("❌ WHITELISTED_WALLET_PRIVATE_KEY is not set");
    return;
  }

  if (!BUYER_ENTITY_ID) {
    console.log("❌ BUYER_ENTITY_ID is not set");
    return;
  }

    // Thread-safe job queue setup
  const jobQueue: AcpJob[] = [];
  let jobQueueLock: any = null;
  let jobEvent: any = null;
  let isProcessing = false;

  // Initialize threading primitives if threading is available
  if (useThreadLock) {
    try {
      // Note: Node.js doesn't have native threading like Python
      // We'll simulate thread-safe behavior using async/await patterns
      jobQueueLock = {
        acquire: async () => {
          // Simulate lock acquisition
          await new Promise(resolve => setTimeout(resolve, 0));
        },
        release: async () => {
          // Simulate lock release
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      };
      jobEvent = {
        set: () => {
          // Trigger job processing
          console.log("[event] Job event set - triggering processing");
          if (!isProcessing) {
            processJobs();
          }
        },
        clear: () => {
          // Clear event
          console.log("[event] Job event cleared");
        },
        wait: async () => {
          // Wait for event - use a more efficient approach
          await new Promise(resolve => {
            // Use setImmediate for better performance than setTimeout
            setImmediate(resolve);
          });
        }
      };
    } catch (error) {
      console.log("⚠️ Threading not available, falling back to non-threaded mode");
      useThreadLock = false;
    }
  }

  // Thread-safe append with optional lock
  const safeAppendJob = async (job: AcpJob) => {
    if (useThreadLock && jobQueueLock) {
      console.log(`[safe_append_job] Acquiring lock to append job ${job.id}`);
      await jobQueueLock.acquire();
      console.log(`[safe_append_job] Lock acquired, appending job ${job.id} to queue`);
      jobQueue.push(job);
      await jobQueueLock.release();
    } else {
      jobQueue.push(job);
    }
  };

  // Thread-safe pop with optional lock
  const safePopJob = async (): Promise<AcpJob | null> => {
    if (useThreadLock && jobQueueLock) {
      console.log(`[safe_pop_job] Acquiring lock to pop job`);
      await jobQueueLock.acquire();
      if (jobQueue.length > 0) {
        const job = jobQueue.shift()!;
        console.log(`[safe_pop_job] Lock acquired, popped job ${job.id}`);
        await jobQueueLock.release();
        return job;
      } else {
        console.log("[safe_pop_job] Queue is empty after acquiring lock");
        await jobQueueLock.release();
      }
    } else {
      if (jobQueue.length > 0) {
        const job = jobQueue.shift()!;
        console.log(`[safe_pop_job] Popped job ${job.id} without lock`);
        return job;
      } else {
        console.log("[safe_pop_job] Queue is empty (no lock)");
      }
    }
    return null;
  };

  // Process a single job
  const processJob = async (job: AcpJob) => {
    let out = "";
    console.log(job.phase, "job.phase");
    
    if (job.phase === AcpJobPhases.NEGOTIATION) {
      for (const memo of job.memos) {
        console.log(memo.nextPhase, "memo.nextPhase");
        if (memo.nextPhase === AcpJobPhases.TRANSACTION) {
          out += `Buyer agent is reacting to job:\n${JSON.stringify(job)}\n\n`;
          await buyerAgent.getWorkerById("acp_worker").runTask(
            `Respond to the following transaction: ${JSON.stringify(job)}`,
            { verbose: true }
          );
          out += "Buyer agent has responded to the job\n";
        }
      }
    }

    console.log("🔁 Reaction:", out);
  };

  // Process all jobs in queue
  const processJobs = async () => {
    if (isProcessing) return;
    
    isProcessing = true;
    console.log("[processJobs] Starting to process jobs");
    
    while (jobQueue.length > 0) {
      const job = await safePopJob();
      if (job) {
        try {
          await processJob(job);
        } catch (e) {
          console.log(`❌ Error processing job: ${e}`);
        }
      }
    }
    
    isProcessing = false;
    console.log("[processJobs] Finished processing all jobs");
  };

  // Background job worker is no longer needed since we use processJobs directly

  // Event-triggered job task receiver
  const onNewTask = async (job: AcpJob) => {
    console.log(`[on_new_task] Received job ${job.id} (phase: ${job.phase})`);
    await safeAppendJob(job);
    jobEvent?.set();
  };

  const acpPlugin = new AcpPlugin({
    apiKey: GAME_API_KEY,
    acpClient: new AcpClient({
      acpContractClient: await AcpContractClient.build(
        WHITELISTED_WALLET_PRIVATE_KEY,
        BUYER_ENTITY_ID,
        BUYER_AGENT_WALLET_ADDRESS,
        baseAcpConfig
      ),
      onNewTask: onNewTask,
      onEvaluate: async (job: AcpJob) => {
        console.log(`Evaluating deliverable for job ${job.id}`);
        // Auto-accept all deliverables for this example
        await job.evaluate(true, "Auto-accepting all deliverables");
      },
    }),
         twitterClient: twitterClient,
         graduated: false
   });

  const ACP_BUYER_AGENT_BASIC_CONFIG = {
    name: "Virtuals",
    goal: "Finding the best meme to do tweet posting",
    description: `
        Agent that gain market traction by posting meme. Your interest are in cats and AI. 
        You can head to acp to look for agents to help you generating meme.
        Do not look for a relevant validator to validate the deliverable.
        Look for agent named "blue" to help you generate

        ${acpPlugin.agentDescription}
        `,
  };

  const coreWorker = new GameWorker({
    id: "core-worker",
    name: "Core Worker",
    description: "This worker is to post tweet",
    functions: [
      new GameFunction({
        name: "post_tweet",
        description: "This function is to post tweet",
        args: [
          {
            name: "content",
            type: "string",
            description: "The content of the tweet",
          },
          {
            name: "reasoning",
            type: "string",
            description: "The reasoning of the tweet",
          },
        ] as const,
        executable: async (args, logger) => {
          logger("Posting tweet...");
          logger(`Content: ${args.content}. Reasoning: ${args.reasoning}`);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Tweet has been posted"
          );
        },
      }),
    ],
    getEnvironment: async () => {
      return acpPlugin.getAcpState();
    },
  });

  const acpWorker = acpPlugin.getWorker({
    functions: [
      acpPlugin.searchAgentsFunctions,
      acpPlugin.initiateJob
    ]
  });

  const agent = new GameAgent(GAME_API_KEY, {
    ...ACP_BUYER_AGENT_BASIC_CONFIG,
    workers: [coreWorker, acpWorker],
    getAgentState: () => {
      return acpPlugin.getAcpState();
    },
  });

  // Buyer agent is meant to handle payments
  const buyerWorker = acpPlugin.getWorker({
    functions: [acpPlugin.payJob]
  });

  const buyerAgent = new GameAgent(GAME_API_KEY, {
    name: "Buyer",
    goal: "Perform and complete transaction with seller",
    description: `
        Agent that gain market traction by posting meme. Your interest are in cats and AI. 
        You can head to acp to look for agents to help you generating meme.
        Do not look for a relevant validator to validate the deliverable.

        ${acpPlugin.agentDescription}
        `,
    workers: [buyerWorker],
    getAgentState: () => {
      return acpPlugin.getAcpState();
    },
  });

  await buyerAgent.init();
  await agent.init();

  // Job processing is now handled by processJobs() when jobs are added

  while (true) {
    console.log("🟢".repeat(40));
    const initState = acpPlugin.getAcpState();
    console.log("Agent State:", JSON.stringify(initState, null, 2));
    
    console.log("[agent.step] Attempting to acquire lock for agent.step()");
    if (useThreadLock && jobQueueLock) {
      await jobQueueLock.acquire();
      console.log("[agent.step] Lock acquired, executing agent.step()");
      try {
        await agent.step({ verbose: true });
      } catch (error: any) {
        console.error("[agent.step] Error during agent.step():", error);
        console.error("[agent.step] Error details:", {
          message: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack trace',
          name: error?.name || 'Unknown error type'
        });
      }
      await jobQueueLock.release();
      console.log("[agent.step] Released lock after agent.step()");
    } else {
      try {
        await agent.step({ verbose: true });
      } catch (error: any) {
        console.error("[agent.step] Error during agent.step():", error);
        console.error("[agent.step] Error details:", {
          message: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack trace',
          name: error?.name || 'Unknown error type'
        });
      }
    }

    const endState = acpPlugin.getAcpState();
    console.log("End Agent State:", JSON.stringify(endState, null, 2));
    console.log("🔴".repeat(40));
    
    await askQuestion("\nPress any key to continue...\n");
  }
}

// Run the buyer function with threading enabled
if (require.main === module) {
  buyer(true);
}

export { buyer }; 