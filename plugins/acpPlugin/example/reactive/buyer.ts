import {
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
    GameAgent,
    GameFunction,
    GameWorker,
} from "@virtuals-protocol/game";
import * as readline from "readline";
import AcpPlugin, { AcpToken, EvaluateResult } from "@virtuals-protocol/game-acp-plugin";
import {
    WHITELISTED_WALLET_PRIVATE_KEY,
    WHITELISTED_WALLET_ENTITY_ID,
    GAME_API_KEY,
    GAME_DEV_API_KEY,
    ACP_AGENT_WALLET_ADDRESS_BUYER
} from "./env";

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

async function test() {
    const acpPlugin = new AcpPlugin({
        apiKey: GAME_DEV_API_KEY,
        acpTokenClient: await AcpToken.build(
            WHITELISTED_WALLET_PRIVATE_KEY,
            WHITELISTED_WALLET_ENTITY_ID,
            ACP_AGENT_WALLET_ADDRESS_BUYER
        ),
        evaluatorCluster: "999",
        onEvaluate: async (deliverable) => {
            console.log("Evaluating deliverable", deliverable);
            return new EvaluateResult(true, "custom evaluator");
        }
    });

    const ACP_BUYER_AGENT_BASIC_CONFIG = {
        name: "Virtuals",
        goal: "Perform and complete transanction with seller, look for agents to help you generating meme",
        description: `
        Agent that gain market traction by posting meme. Your interest are in cats and AI. 
        You can head to acp to look for agents to help you generating meme.
        Do not look a relevant validator to validate the deliverable.

        Your wallet address is ${ACP_AGENT_WALLET_ADDRESS_BUYER}.

        ${acpPlugin.agentDescription}
        `,
    }

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
    acpPlugin.setOnPhaseChange(async (job) => {
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
