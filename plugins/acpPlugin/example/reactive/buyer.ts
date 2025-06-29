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
 import  { TwitterApi }  from "@virtuals-protocol/game-twitter-node";
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

async function test() {
  const acpPlugin = new AcpPlugin({
    apiKey: GAME_API_KEY,
    acpClient: new AcpClient({
      acpContractClient: await AcpContractClient.build(
        WHITELISTED_WALLET_PRIVATE_KEY,
        BUYER_ENTITY_ID,
        BUYER_AGENT_WALLET_ADDRESS,
        baseAcpConfig
      ),
      onNewTask: async (job: AcpJob) => {
        if (
          job.phase === AcpJobPhases.NEGOTIATION &&
          job.memos.find((m) => m.nextPhase === AcpJobPhases.TRANSACTION)
        ) {
          const prompt = `Pay for the following job: ${JSON.stringify(job)}`;
          await buyerAgent.getWorkerById("acp_worker").runTask(prompt, {
            verbose: true,
          });
          buyerAgent.log(`${buyerAgent.name} has responded to the job #${job.id}`);
        }
      },
      onEvaluate: async (job: AcpJob) => {
        console.log(job.deliverable, job.serviceRequirement);
        await job.evaluate(true, "This is a test reasoning");
      },
    }),
   twitterClient: twitterClient,
  });

  const ACP_BUYER_AGENT_BASIC_CONFIG = {
    name: "Virtuals",
    goal: "Perform and complete transanction with seller, look for agents to help you generating meme",
    description: `
        Agent that gain market traction by posting meme. Your interest are in cats and AI.
        You can head to acp to look for agents to help you generating meme.
        Do not look a relevant validator to validate the deliverable.

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

  /// start a new buyer agent to handle payments
  const buyerAgent = new GameAgent(GAME_API_KEY, {
    ...ACP_BUYER_AGENT_BASIC_CONFIG,
    workers: [
      acpPlugin.getWorker({
        functions: [acpPlugin.payJob],
      }),
    ],
  });

  await buyerAgent.init();


  const agent = new GameAgent(GAME_API_KEY, {
    ...ACP_BUYER_AGENT_BASIC_CONFIG,
    workers: [
      coreWorker,
      acpPlugin.getWorker({
        // buyer to have only both search and initiate job, once job is initiated, it will be handled by the buyer reactive agent
        functions: [acpPlugin.searchAgentsFunctions, acpPlugin.initiateJob],
      }),
    ],
    getAgentState: () => {
      return acpPlugin.getAcpState();
    },
  });

  //await acpPlugin.resetState();

  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });

    await askQuestion("\nPress any key to continue...\n");
  }
}

test();
