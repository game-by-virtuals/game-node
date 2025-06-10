import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get token correlation analysis
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Correlation Analysis Agent",
  goal: "Get correlation analysis showing the top 10 and bottom 10 correlations of tokens with the top 100 market cap cryptocurrencies.",
  description:
    "You are an AI agent specialized in cryptocurrency correlation analysis. You can analyze how different tokens move in relation to each other, providing insights for portfolio diversification, risk management, and understanding market relationships between cryptocurrencies.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getCorrelation],
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