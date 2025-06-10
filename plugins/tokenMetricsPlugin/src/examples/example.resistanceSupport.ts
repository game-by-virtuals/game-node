import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// Create an agent to get resistance and support levels
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "TokenMetrics Technical Levels Agent",
  goal: "Get historical resistance and support levels for cryptocurrencies to identify key technical price levels for trading decisions.",
  description:
    "You are an AI agent specialized in technical analysis using TokenMetrics resistance and support level data. You identify critical price levels where cryptocurrencies historically find support or face resistance, essential for technical trading strategies.",
  workers: [
    tokenMetricsPlugin.getWorker({
      functions: [tokenMetricsPlugin.getResistanceSupport],
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