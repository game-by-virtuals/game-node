import {GameAgent, LLMModel} from "@virtuals-protocol/game";
import TwitterPrimusPlugin from "../../src";

import dotenv from "dotenv";

dotenv.config();

(async () => {
    // Create a worker with the functions
    const twitterPlugin = new TwitterPrimusPlugin();
    // Check env has set
    if (!process.env.APP_ID || !process.env.APP_SECRET || !process.env.TWITTER_USER_NAME || !process.env.TWITTER_PASSWORD || !process.env.TWITTER_EMAIL) {
        throw new Error("Missing environment variables");
    }
    await twitterPlugin.init({
        id: process.env.WORKER_ID || "",
        name: process.env.WORKER_NAME || "",
        description: process.env.WORKER_DESC || "",

        appId: process.env.APP_ID || "",
        appSecret: process.env.APP_SECRET || "",

        username: process.env.TWITTER_USER_NAME || "",
        password: process.env.TWITTER_PASSWORD || "",
        email: process.env.TWITTER_EMAIL || "",
        //NOT NECESSARY
        twitter2faSecret: process.env.TWITTER_2FA_SECRET || "",
    });

    const gameApiKey = process.env.GAME_API_KEY;

    if(!gameApiKey){
        throw new Error("Missing environment variables");
    }
    // Create an agent with the worker
    const agent = new GameAgent(gameApiKey, {
        name: "Twitter Primus Bot",
        goal: "Verify actions",
        description: "Get btc price and post tweet by zktls",
        workers: [
            twitterPlugin.getWorker({}),
        ],
        llmModel: LLMModel.DeepSeek_R1,
        getAgentState: async () => {
            return {
                username: "twitter_primus_bot"
            };
        },
    });

    agent.setLogger((agent, message) => {
        console.log(`-----[${agent.name}]-----`);
        console.log(message);
        console.log("\n");
    });

    await agent.init();

    while (true) {
        await agent.step({
            verbose: true,
        });
    }
})();
