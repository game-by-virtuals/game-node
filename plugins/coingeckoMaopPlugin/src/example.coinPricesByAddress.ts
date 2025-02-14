import { config } from "dotenv";
config({ path: "./.env" });

import { GameAgent } from "@virtuals-protocol/game";
import CoingeckoMAOPPlugin from ".";

const coingeckoMAOPPlugin = new CoingeckoMAOPPlugin({
  apiClientConfig: {
    apiKey: process.env.MAOP_GAME_PLUGIN_API_KEY,
    baseApiUrl: process.env.MAOP_ENDPOINT,
  },
});

// Create an agent with the worker
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "Cryptocurrency Data Worker",
  goal: "Fetch the coin price by address: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599 on ethereum platform.",
  description:
    "You are an AI agent specialized in fetching cryptocurrency data. You can retrieve current market data using the Coingecko API.",
  workers: [
    coingeckoMAOPPlugin.getWorker({
      functions: [coingeckoMAOPPlugin.coinPricesByAddress],
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
