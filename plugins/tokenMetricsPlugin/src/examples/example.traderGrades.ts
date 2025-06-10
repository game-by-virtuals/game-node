import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get trader grades for short-term analysis
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Trader Grade Analyst",
  goal: "Get the short-term trader grades for cryptocurrencies to assess trading opportunities and momentum.",
  description:
    "You are an AI agent specialized in analyzing short-term trading opportunities using TokenMetrics AI-powered trader grades. You provide insights into technical analysis, momentum indicators, and on-chain metrics for making informed trading decisions.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getTraderGrades],
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