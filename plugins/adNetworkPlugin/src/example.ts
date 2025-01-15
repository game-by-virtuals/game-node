import { GameAgent } from "@virtuals-protocol/game";
import AdNetworkPlugin from "./adNetworkPlugin";
import TwitterPlugin from "@virtuals-protocol/game-twitter-plugin";

const twitterPlugin = new TwitterPlugin({
  credentials: {
    apiKey: "your_api_key",
    apiSecretKey: "your_api_secret_key",
    accessToken: "your_access_token",
    accessTokenSecret: "your_access_token_secret",
  },
});

// Create a worker with the functions
const adNetworkPlugin = new AdNetworkPlugin({
    apiKey: "monitize_api_key",
});

// Create an agent with the worker
const agent = new GameAgent("API_KEY", {
  name: "Ad Network Bot",
  goal: "Increase revenue by effectively utilizing the ad network to promote campaigns about a random airdrop token in your portfolio",
  description: "A bot designed to promote tokens in its portfolio in social media platforms to get revenue from airdrops by leveraging the ad network",
  workers: [
    adNetworkPlugin.getWorker({
    }),
    twitterPlugin.getWorker()
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
