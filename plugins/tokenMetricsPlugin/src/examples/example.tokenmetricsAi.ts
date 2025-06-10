import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to chat with TokenMetrics AI
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics AI Chat Agent",
  goal: "Chat with TokenMetrics AI to get insights about cryptocurrency markets, trading strategies, and investment advice.",
  description:
    "You are an AI agent that can interact with TokenMetrics AI to get expert cryptocurrency insights. You can ask questions about market trends, trading strategies, investment opportunities, and get AI-powered analysis of the crypto market.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getTokenMetricsAi],
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