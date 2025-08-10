import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get market analytics and indicators
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Market Analytics Agent",
  goal: "Get comprehensive market analytics including bullish/bearish indicators to understand overall crypto market conditions.",
  description:
    "You are an AI agent specialized in analyzing overall cryptocurrency market conditions using TokenMetrics market analytics. You provide insights into market sentiment, trend analysis, and macro indicators to help understand the broader crypto market environment.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getMarketMetrics],
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