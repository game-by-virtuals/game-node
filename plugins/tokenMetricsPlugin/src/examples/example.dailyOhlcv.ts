import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get daily OHLCV data
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Daily OHLCV Analyst",
  goal: "Get daily OHLCV (Open, High, Low, Close, Volume) data for long-term technical analysis and trend identification.",
  description:
    "You are an AI agent specialized in providing daily cryptocurrency price and volume data using TokenMetrics. You deliver OHLCV data perfect for longer-term technical analysis, trend identification, and swing trading strategies.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getDailyOhlcv],
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