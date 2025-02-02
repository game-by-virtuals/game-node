import { GameAgent } from "@virtuals-protocol/game";
import BountyPlugin from "./bountyPlugin";
// Create a worker with the functions
// Also make sure to set the environment variables in your .env file
const bountyPlugin = new BountyPlugin({
  credentials: {
    apiKey: "TWITTER_API_KEY",
    apiSecretKey: "TWITTER_API_SECRET_KEY",
    accessToken: "TWITTER_ACCESS_TOKEN",
    accessTokenSecret: "TWITTER_ACCESS_TOKEN_SECRET",
  },
});

// Create an agent with the worker
const agent = new GameAgent("apt-8d15c19aef39ba0618ea4dec1c8bc28b", {
  name: "Bounty Bot",
  goal: "respond to bounties",
  description: "A bot that can respond to bounties",
  workers: [
    bountyPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        bountyPlugin.respondToBountiesFunction,
        bountyPlugin.checkMyTweetsForScoreFunction,
      ],
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
