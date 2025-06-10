import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get quantitative metrics
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Quantitative Analyst",
  goal: "Get advanced quantitative metrics and statistical analysis for cryptocurrency tokens to support data-driven investment decisions.",
  description:
    "You are an AI agent specialized in quantitative cryptocurrency analysis using TokenMetrics advanced mathematical models. You provide statistical metrics, quantitative indicators, and mathematical analysis to support sophisticated trading and investment strategies.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getQuantmetrics],
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