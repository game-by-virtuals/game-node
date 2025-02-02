import { GameAgent } from "@virtuals-protocol/game";
import BountyPlugin from "./bountyPlugin";
// Create a worker with the functions
// AlS
const bountyPlugin = new BountyPlugin({
  credentials: {
    apiKey: "dUAmkQKDC2r5TLnB66h1c78J4",
    apiSecretKey: "VBhvqAOTnlNO6C01NpZa6lOa1WZ5vGAYfKdrKyyNRCxzFdsAcf",
    accessToken: "1565717307397050368-SdgCqgrhli6Zgomu4IUS7HyB5ciRlB",
    accessTokenSecret: "KdYawwdrUCTDYt3tFyv4cE1P6UkqXR96uTA0j5f2Aqw2V",
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
      // Define the environment variables that the worker can access, by default it will use the metrics defined in the plugin
      // getEnvironment: async () => ({
      //   ...(await twitterPlugin.getMetrics()),
      //   username: "virtualsprotocol",
      //   token_price: "$100.00",
      // }),
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
