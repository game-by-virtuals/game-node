import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get scenario-based price predictions
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Scenario Analysis Agent",
  goal: "Get price predictions based on different cryptocurrency market scenarios including bullish, bearish, and neutral conditions.",
  description:
    "You are an AI agent specialized in cryptocurrency scenario analysis and price forecasting. You can provide price predictions for different market scenarios, helping users understand potential price movements under various market conditions and make informed investment decisions.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getScenarioAnalysis],
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