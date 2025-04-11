import { GameAgent } from "@virtuals-protocol/game";
import AlchemyPlugin from "./alchemyPlugin";
import dotenv from "dotenv";
dotenv.config();

// Add your Alchemy API key to the .env file
const alchemyPlugin = new AlchemyPlugin({
    credentials: {
        apiKey: process.env.ALCHEMY_API_KEY || "",
    },
});

/**
 * Create an agent to fetch on-chain data using the Alchemy API
 * In this example, the agent fetches the nfts owned by 0xe5cB067E90D5Cd1F8052B83562Ae670bA4A211a8 on eth mainnet
 * Add your Virtuals Protocol API token to the .env file
 */
const alchemyAgent = new GameAgent(process.env.VIRTUALS_API_TOKEN || "", {
    name: "Alchemy Agent",
    goal: "Fetch the nfts owned by 0xe5cB067E90D5Cd1F8052B83562Ae670bA4A211a8 on eth mainnet",
    description: "An agent that can fetch on-chain data using the Alchemy API including transaction history, tokens held (with metadata/prices), token balances, NFTs by wallet, and NFT contracts by wallet.",
    workers: [
        alchemyPlugin.getWorker(),
    ],
});

(async () => {
    // Initialize the agent
    await alchemyAgent.init();
    await alchemyAgent.run(10, {verbose: true});
})();