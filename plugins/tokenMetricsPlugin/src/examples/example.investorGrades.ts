import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get investor grades for long-term analysis
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Investor Grade Analyst", 
  goal: "Get the long-term investor grades including Technology and Fundamental metrics for comprehensive investment analysis.",
  description:
    "You are an AI agent specialized in long-term cryptocurrency investment analysis using TokenMetrics investor grades. You evaluate technology quality, fundamental strength, team assessment, and overall investment potential for making informed long-term investment decisions.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getInvestorGrades],
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