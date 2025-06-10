import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get AI-generated trading signals
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Trading Signals Agent",
  goal: "Get AI-generated trading signals for long and short positions to identify optimal buy and sell opportunities.",
  description:
    "You are an AI agent specialized in providing AI-generated trading signals using TokenMetrics algorithms. You analyze market conditions to provide bullish (1), bearish (-1), or neutral (0) signals with strength indicators for cryptocurrencies.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getTradingSignals],
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