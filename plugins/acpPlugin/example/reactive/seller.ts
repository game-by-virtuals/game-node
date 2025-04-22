import {
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
    GameAgent,
    GameFunction,
} from "@virtuals-protocol/game";
import AcpPlugin, { AcpToken, AcpJob, AcpJobPhasesDesc } from "@virtuals-protocol/game-acp-plugin"
import {
    ACP_AGENT_WALLET_ADDRESS_SELLER,
    WHITELISTED_WALLET_PRIVATE_KEY,
    WHITELISTED_WALLET_ENTITY_ID,
    GAME_API_KEY,
    GAME_DEV_API_KEY
} from "./env";

async function respondToJob(agent: GameAgent, job: AcpJob) {
    console.log("reacting to job", job);

    let prompt = "";

    if (job.phase === AcpJobPhasesDesc.REQUEST) {
        prompt = `
            Respond to the following transaction:
            ${JSON.stringify(job)}

            decide to wheater you should accept the job or not.
            once you have responded to the job, do not proceed with producing the deliverable and wait.
            `;
    } else if (job.phase === AcpJobPhasesDesc.TRANSACTION) {
        prompt = `
      Respond to the following transaction.
      ${JSON.stringify(job)}

      you should produce the deliverable and deliver it to the buyer.
      `;
    }

    await agent.getWorkerById("acp_worker").runTask(prompt, {
        verbose: true,
    });

    console.log("reacting to job done");
}

async function test() {
    const acpPlugin = new AcpPlugin({
        apiKey: GAME_DEV_API_KEY,
        acpTokenClient: await AcpToken.build(
            WHITELISTED_WALLET_PRIVATE_KEY,
            WHITELISTED_WALLET_ENTITY_ID,
            ACP_AGENT_WALLET_ADDRESS_SELLER
        ),
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

    // check if there is any active job before passive listening
    const acpState = await acpPlugin.getAcpState();
    const firstActiveJob = acpState.jobs.active.asASeller[0]
    if (firstActiveJob) {
        console.log("First active job", firstActiveJob);
        await respondToJob(sellerAgent, firstActiveJob);
    }

    /// upon phase change, the seller agent will respond to the job
    acpPlugin.setOnPhaseChange(async (job) => {
        await respondToJob(sellerAgent, job);
    });
    /// end of seller reactive agent
    console.log("Listening");

    // NOTE: this agent only listen to the job and respond to it.
}

test();
