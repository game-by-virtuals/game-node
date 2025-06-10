import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create a comprehensive crypto analysis agent with ALL TokenMetrics functions
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Comprehensive AI Crypto Analyst",
  goal: "Provide complete cryptocurrency analysis using all TokenMetrics AI capabilities including trader grades, investor grades, trading signals, market metrics, price data, technical analysis, AI reports, and investor intelligence.",
  description:
    "You are the most advanced AI cryptocurrency analyst powered by the complete TokenMetrics suite. You can perform short-term trading analysis, long-term investment evaluation, market condition assessment, technical analysis, quantitative modeling, AI research, and investor intelligence. You help users make informed decisions across all aspects of cryptocurrency trading and investment using comprehensive data-driven analysis from TokenMetrics' AI platform.",
  workers: [tokenMetricsPlugin.getWorker({})], // Include ALL 13 functions
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