import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker,
} from "@virtuals-protocol/game";

const postTweetFunction = new GameFunction({
  name: "post_tweet",
  description: "Post a tweet",
  args: [
    { name: "tweet", description: "The tweet content" },
    { name: "tweet_reasoning", description: "The reasoning behind the tweet" },
  ] as const,
  executable: async (args, logger) => {
    try {
      // TODO: Implement posting tweet
      logger(`Posting tweet: ${args.tweet}`);
      logger(`Reasoning: ${args.tweet_reasoning}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        "Tweet posted"
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Failed to post tweet"
      );
    }
  },
});

const searchTweetsFunction = new GameFunction({
  name: "search_tweets",
  description: "Search tweets and return results",
  args: [
    { name: "query", description: "The query to search for" },
    { name: "reasoning", description: "The reasoning behind the search" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const query = args.query;

      //TODO: Implement searching tweets
      logger(`Searching tweets for query: ${query}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        // Return the search results as a string
        "Tweets searched here are the results: [{tweetId: 1, content: 'Hello World'}, {tweetId: 2, content: 'Goodbye World'}]"
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Failed to search tweets"
      );
    }
  },
});

const replyToTweetFunction = new GameFunction({
  name: "reply_to_tweet",
  description: "Reply to a tweet",
  args: [
    { name: "tweet_id", description: "The tweet id to reply to" },
    { name: "reply", description: "The reply content" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const tweetId = args.tweet_id;
      const reply = args.reply;

      //TODO: Implement replying to tweet
      logger(`Replying to tweet ${tweetId} with ${reply}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Replied to tweet ${tweetId} with ${reply}`
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Failed to reply to tweet"
      );
    }
  },
});

// Create a worker with the functions
const postTweetWorker = new GameWorker({
  id: "twitter_main_worker",
  name: "Twitter main worker",
  description: "Worker that posts tweets",
  functions: [searchTweetsFunction, replyToTweetFunction, postTweetFunction],
  // Optional: Get the environment
  getEnvironment: async () => {
    return {
      tweet_limit: 15,
    };
  },
});

// Create an agent with the worker
const agent = new GameAgent("API_KEY", {
  name: "Twitter Bot",
  goal: "Search and reply to tweets",
  description: "A bot that searches for tweets and replies to them",
  workers: [postTweetWorker],
  // Optional: Get the agent state
  getAgentState: async () => {
    return {
      username: "twitter_bot",
      follower_count: 1000,
      tweet_count: 10,
    };
  },
});

(async () => {
  // define custom logger
  agent.setLogger((agent, msg) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(msg);
    console.log("\n");
  });

  // Initialize the agent
  await agent.init();

  // Run the agent for with 60 seconds interval
  // this will stop when agent decides to wait
  await agent.run(60, { verbose: true }); // verbose will give you more information about the agent's actions

  // if you need more control over the agent, you can use the step method
  // await agent.step();
})();
