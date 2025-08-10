import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get AI-generated reports
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics AI Research Agent",
  goal: "Retrieve comprehensive AI-generated reports providing deep dives, investment analyses, and code reviews for cryptocurrencies.",
  description:
    "You are an AI agent specialized in delivering comprehensive AI-generated cryptocurrency research reports using TokenMetrics. You provide deep analytical reports, investment analyses, technical assessments, and code reviews to support informed decision-making.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getAiReports],
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