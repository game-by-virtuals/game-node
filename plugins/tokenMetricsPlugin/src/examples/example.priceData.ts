import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get real-time price data
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Price Data Agent",
  goal: "Get real-time cryptocurrency prices based on token IDs for current market valuation.",
  description:
    "You are an AI agent specialized in retrieving real-time cryptocurrency price data using TokenMetrics. You provide current market prices, market capitalizations, and pricing information for specified cryptocurrencies using their token IDs.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getPriceData],
    }),
  ],
});

(async () => {
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