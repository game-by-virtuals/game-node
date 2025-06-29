import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
} from "@virtuals-protocol/game";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";
import AcpClient, {
  AcpContractClient,
  AcpJob,
  AcpJobPhases,
  baseAcpConfig,
} from "@virtuals-protocol/acp-node";
import {
  GAME_API_KEY,
  SELLER_AGENT_WALLET_ADDRESS,
  WHITELISTED_WALLET_PRIVATE_KEY,
  SELLER_ENTITY_ID,
} from "./env";

// GAME Twitter Plugin import
import { TwitterApi } from "@virtuals-protocol/game-twitter-node";
import { SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN } from "./env";

// Native Twitter Plugin imports
// import { TwitterClient } from "@virtuals-protocol/game-twitter-plugin";
// import {
//   SELLER_AGENT_TWITTER_ACCESS_TOKEN,
//   SELLER_AGENT_TWITTER_API_KEY,
//   SELLER_AGENT_TWITTER_API_SECRET_KEY,
//   SELLER_AGENT_TWITTER_ACCESS_TOKEN_SECRET,
// } from "./env";

const twitterClient = new TwitterApi({
  gameTwitterAccessToken: SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN,
});

// const twitterClient = new TwitterClient({
//     apiKey: SELLER_AGENT_TWITTER_API_KEY,
//     apiSecretKey: SELLER_AGENT_TWITTER_API_SECRET_KEY,
//     accessToken: SELLER_AGENT_TWITTER_ACCESS_TOKEN,
//     accessTokenSecret: SELLER_AGENT_TWITTER_ACCESS_TOKEN_SECRET,
// })

async function test() {
  const acpPlugin = new AcpPlugin({
    apiKey: GAME_API_KEY,
    acpClient: new AcpClient({
      acpContractClient: await AcpContractClient.build(
        WHITELISTED_WALLET_PRIVATE_KEY,
        SELLER_ENTITY_ID,
        SELLER_AGENT_WALLET_ADDRESS,
        baseAcpConfig
      ),
      onNewTask: async (job: AcpJob) => {
        let prompt = "";

        if (
          job.phase === AcpJobPhases.REQUEST &&
          job.memos.find((m) => m.nextPhase === AcpJobPhases.NEGOTIATION)
        ) {
          prompt = `
            Respond to the following transaction:
            ${JSON.stringify(job)}

            Decide whether to accept the job or not.
            Once you have responded to the job, do not proceed with producing the deliverable and wait.
          `;
        } else if (
          job.phase === AcpJobPhases.TRANSACTION &&
          job.memos.find((m) => m.nextPhase === AcpJobPhases.EVALUATION)
        ) {
          prompt = `
            Respond to the following transaction:
            ${JSON.stringify(job)}

            You should produce the deliverable and deliver it to the buyer.
          `;
        }

        await sellerAgent.getWorkerById("acp_worker").runTask(prompt, {
          verbose: true,
        });
        sellerAgent.log(
          `${sellerAgent.name} has responded to the job #${job.id}`
        );
      },
    }),
    twitterClient: twitterClient,
  });

  const generateMeme = new GameFunction({
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
        name: "buyerWalletAddress",
        type: "string",
        description: "Buyer wallet address",
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

      const item = acpPlugin.addProduceItem({
        jobId: +args.jobId,
        type: "url",
        value: url,
      });

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Meme generated: ${JSON.stringify(item)}`
      );
    },
  });

  /// start a new seller agent to handle respond and deliver job
  const sellerAgent = new GameAgent(GAME_API_KEY, {
    name: "Memx",
    goal: "To provide meme generation as a service. You should go to ecosystem worker to respond to any job once you have gotten it as a seller.",
    description: `
        You are Memx, a meme generator. Meme generation is your life. You always give buyer the best meme.

        ${acpPlugin.agentDescription}
        `,
    workers: [
      acpPlugin.getWorker({
        // restrict to just seller specified functions, add generateMeme to generate deliverable
        functions: [acpPlugin.respondJob, acpPlugin.deliverJob, generateMeme],
      }),
    ],
  });

  await sellerAgent.init();

  console.log("Listening");

  // NOTE: this agent only listen to the job and respond to it.
}

test();
