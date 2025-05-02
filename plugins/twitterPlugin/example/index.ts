import { GameAgent, GameWorker } from "@virtuals-protocol/game";
import TwitterPlugin from "@virtuals-protocol/game-twitter-plugin";
import { TwitterApi } from "@virtuals-protocol/game-twitter-node";

const gameTwitterClient = new TwitterApi({
  gameTwitterAccessToken: "xxxx",
});

// const nativeTwitterClient = new TwitterApi({
//   appKey: "xxxxxxx",
//   appSecret: "xxxxxxx",
//   accessToken: "xxxxxxx",
//   accessSecret: "xxxxxxxxx",
// });

// Create a worker with the functions
const twitterPlugin = new TwitterPlugin({
  id: "twitter_worker",
  name: "Twitter Worker",
  description:
    "A worker that will execute tasks within the Twitter Social Platforms. It is capable of posting, reply, quote and like tweets.",
  twitterClient: gameTwitterClient,
});

// Create an agent with the worker
const agent = new GameAgent("xxxx", {
  name: "Twitter Bot",
  goal: "increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [
    // Use local GameWorker that's compatible with local GameAgent
    new GameWorker({
      id: "twitter_worker",
      name: "Twitter Worker",
      description: "Twitter integration worker",
      functions: [
        twitterPlugin.searchTweetsFunction,
        //twitterPlugin.replyTweetFunction,
        twitterPlugin.postTweetFunction,
      ],
      getEnvironment: async () => {
        return {
          ...(await twitterPlugin.getMetrics()),
          username: "virtualsprotocol",
          token_price: "$100.00",
        };
      },
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
