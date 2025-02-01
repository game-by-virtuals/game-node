import { GameAgent } from "@virtuals-protocol/game";
import TwitterPlugin from "./twitterPlugin";

// Create a worker with the functions
const twitterPlugin = new TwitterPlugin({
  credentials: {
    apiKey: "p6hvwTP0rI0VyEjYvTWXt7Uzn",
    apiSecretKey: "Vdnz2AxjUDHkyFLxwGDp5c5TmTx0typmorh0j65LTU8qdOGSI3",
    accessToken: "1294477764074979328-pp8Ao3G92ySkuLcBDOgnl3PyvH103P",
    accessTokenSecret: "9bRqbJGMYD7uAw70DUsoeQvqbuxFW4GRvcpldINZXpcYt",
  },
});

// Create an agent with the worker
const agent = new GameAgent("apt-8d15c19aef39ba0618ea4dec1c8bc28b", {
  name: "Twitter Bot",
  goal: "increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [
    twitterPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        twitterPlugin.searchTweetsFunction,
        twitterPlugin.replyTweetFunction,
        twitterPlugin.postTweetFunction,
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
