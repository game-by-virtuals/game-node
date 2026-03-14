import { GameAgent } from "@virtuals-protocol/game";
import TwitterPlugin, {
  GameTwitterClient,
  TwitterClient,
} from "@virtuals-protocol/game-twitter-plugin";

const gameTwitterClient = new GameTwitterClient({
  accessToken: "xxxxxxxxxx",
});

const nativeTwitterClient = new TwitterClient({
  apiKey: "xxxxxxx",
  apiSecretKey: "xxxxxxx",
  accessToken: "xxxxxxx",
  accessTokenSecret: "xxxxxxxxx",
});

// Create a worker with the functions
const twitterPlugin = new TwitterPlugin({
  id: "twitter_worker",
  name: "Twitter Worker",
  description:
    "A worker that will execute tasks within the Twitter Social Platforms. It is capable of posting, reply, quote and like tweets.",
  // twitterClient: nativeTwitterClient,
  twitterClient: gameTwitterClient, // Use this if you want to use the game client
});

// Create an agent with the worker
const agent = new GameAgent(process.env.GAME_API_KEY || "", {
  name: "Twitter Bot",
  goal: "increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [
    twitterPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      // functions: [
      //   twitterPlugin.searchTweetsFunction,
      //   twitterPlugin.replyTweetFunction,
      //   twitterPlugin.postTweetFunction,
      // ],
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
