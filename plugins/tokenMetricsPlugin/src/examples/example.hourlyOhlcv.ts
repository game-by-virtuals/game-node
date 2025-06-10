import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get hourly OHLCV data
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Hourly OHLCV Analyst",
  goal: "Get hourly OHLCV (Open, High, Low, Close, Volume) data for detailed technical analysis and short-term trading patterns.",
  description:
    "You are an AI agent specialized in providing hourly cryptocurrency price and volume data using TokenMetrics. You deliver OHLCV data essential for technical analysis, chart patterns, and intraday trading strategies.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getHourlyOhlcv],
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