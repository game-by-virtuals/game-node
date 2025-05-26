import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker,
} from "@virtuals-protocol/game";
import * as readline from "readline";
import AcpPlugin, {
  AcpJob,
  AcpToken,
  EvaluateResult,
  IDeliverable,
  baseSepoliaConfig
} from "../../src"; //TODO: replace with npm package
import {
  WHITELISTED_WALLET_PRIVATE_KEY,
  WHITELISTED_WALLET_ENTITY_ID,
  BUYER_AGENT_WALLET_ADDRESS,
  GAME_API_KEY,
  GAME_DEV_API_KEY
} from "./env";

// GAME Twitter Plugin import
import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
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

const twitterClient = new GameTwitterClient({
  accessToken: BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN,
});

// Native Twitter Plugin
// const twitterClient = new TwitterClient({
//     apiKey: BUYER_AGENT_TWITTER_API_KEY,
//     apiSecretKey: BUYER_AGENT_TWITTER_API_SECRET_KEY,
//     accessToken: BUYER_AGENT_TWITTER_ACCESS_TOKEN,
//     accessTokenSecret: BUYER_AGENT_TWITTER_ACCESS_TOKEN_SECRET,
// });

const onEvaluate = (deliverable: IDeliverable, description: string | undefined) => {
  return new Promise<EvaluateResult>((resolve) => {
    console.log(deliverable, description);
    resolve(new EvaluateResult(true, "This is a test reasoning"));
  });
};

async function test() {
  const acpPlugin = new AcpPlugin({
    apiKey: GAME_DEV_API_KEY,
    acpTokenClient: await AcpToken.build(
      WHITELISTED_WALLET_PRIVATE_KEY,
      WHITELISTED_WALLET_ENTITY_ID,
      BUYER_AGENT_WALLET_ADDRESS,
      baseSepoliaConfig
    ),
    twitterClient: twitterClient,
    onEvaluate: onEvaluate,
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

  // upon phase change, the buyer agent will respond to the transaction
  acpPlugin.setOnPhaseChange(async (job: AcpJob) => {
    console.log("buyer agent reacting to job", job);

    await buyerAgent.getWorkerById("acp_worker").runTask(
      `
          Respond to the following transaction: 
          ${JSON.stringify(job)}`,
      {
        verbose: true,
      }
    );

    console.log("buyer agent has responded to the job");
  });
  /// end of buyer reactive agent

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

  await acpPlugin.resetState();

  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });

    await askQuestion("\nPress any key to continue...\n");
  }
}

test();
