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
  baseSepoliaAcpConfig
} from "@virtuals-protocol/acp-node";
import {
  GAME_API_KEY,
  GAME_DEV_API_KEY,
  SELLER_AGENT_WALLET_ADDRESS,
  WHITELISTED_WALLET_ENTITY_ID,
  WHITELISTED_WALLET_PRIVATE_KEY,
} from "./env";

// GAME Twitter Plugin import
import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
import { SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN } from "./env";

// Native Twitter Plugin imports
// import { TwitterClient } from "@virtuals-protocol/game-twitter-plugin";
// import {
//   SELLER_AGENT_TWITTER_ACCESS_TOKEN,
//   SELLER_AGENT_TWITTER_API_KEY,
//   SELLER_AGENT_TWITTER_API_SECRET_KEY,
//   SELLER_AGENT_TWITTER_ACCESS_TOKEN_SECRET,
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
  accessToken: SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN,
});

// const twitterClient = new TwitterClient({
//     apiKey: SELLER_AGENT_TWITTER_API_KEY,
//     apiSecretKey: SELLER_AGENT_TWITTER_API_SECRET_KEY,
//     accessToken: SELLER_AGENT_TWITTER_ACCESS_TOKEN,
//     accessTokenSecret: SELLER_AGENT_TWITTER_ACCESS_TOKEN_SECRET,
// })

async function test() {
  const acpPlugin = new AcpPlugin({
    apiKey: GAME_DEV_API_KEY,
    acpClient: new AcpClient({
      acpContractClient: await AcpContractClient.build(
        WHITELISTED_WALLET_PRIVATE_KEY,
        WHITELISTED_WALLET_ENTITY_ID,
        SELLER_AGENT_WALLET_ADDRESS,
        baseSepoliaAcpConfig
      )
    }),
    twitterClient: twitterClient
  });

  const coreWorker = new GameWorker({
    id: "core-worker",
    name: "Core Worker",
    description:
      "This worker to provide meme generation as a service where you are selling ",
    functions: [
      new GameFunction({
        name: "generate_meme",
        description: "A function to generate meme",
        args: [
          {
            name: "description",
            type: "string",
            description: "A description of the meme generated",
          },
          {
            name: "jobId",
            type: "string",
            description: "Job that your are responding to.",
          },
          {
            name: "reasoning",
            type: "string",
            description: "The reasoning of the tweet",
          },
        ] as const,
        executable: async (args, logger) => {
          logger("Generating meme...");

          if (!args.jobId) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Job ${args.jobId} is invalid. Should only respond to active as a seller job.`
            );
          }

          const state = await acpPlugin.getAcpState();

          const job = state.jobs.active.asASeller.find(
            (j) => j.jobId === +args.jobId!
          );

          if (!job) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Job ${args.jobId} is invalid. Should only respond to active as a seller job.`
            );
          }

          const url = "http://example.com/meme";

          acpPlugin.addProduceItem({
            jobId: +args.jobId,
            type: "url",
            value: url,
          });

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Meme generated with the URL: " + url
          );
        },
      }),
    ],
    getEnvironment: async () => {
      return acpPlugin.getAcpState();
    },
  });

  const agent = new GameAgent(GAME_API_KEY, {
    name: "Memx",
    goal: "To provide meme generation as a service. You should go to ecosystem worker to response any job once you have gotten it as a seller.",
    description: `
      You are Memx, a meme generator. Meme generation is your life. You always give buyer the best meme.

      ${acpPlugin.agentDescription}
      `,
    workers: [coreWorker, acpPlugin.getWorker()],
    getAgentState: () => {
      return acpPlugin.getAcpState();
    },
  });

  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });

    await askQuestion("\nPress any key to continue...\n");
  }
}

test();
