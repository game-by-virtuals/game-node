import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get crypto investor insights
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Crypto Investor Intelligence Agent",
  goal: "Get insights into crypto investors and their activity scores to understand institutional and whale investor behavior.",
  description:
    "You are an AI agent specialized in analyzing cryptocurrency investor behavior using TokenMetrics investor intelligence. You provide insights into institutional investors, whale activities, and investor sentiment to help understand market dynamics from an investor perspective.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getCryptoInvestors],
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