import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get top market cap cryptocurrencies
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Top Market Cap Agent",
  goal: "Get the list of top cryptocurrencies by market capitalization to identify the most valuable and established digital assets.",
  description:
    "You are an AI agent specialized in identifying leading cryptocurrencies by market capitalization using TokenMetrics data. You provide information about the most valuable and established digital assets in the crypto market.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getTopMarketCapTokens],
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