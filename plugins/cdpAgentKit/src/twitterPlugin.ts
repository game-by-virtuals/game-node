import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import TwitterApi from "twitter-api-v2";

interface ITwitterPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  credentials: {
    apiKey: string;
    apiSecretKey: string;
    accessToken: string;
    accessTokenSecret: string;
  };
}

class TwitterPlugin {
  private id: string;
  private name: string;
  private description: string;
  private twitterClient: TwitterApi;

  constructor(options: ITwitterPluginOptions) {
    this.id = options.id || "twitter_worker";
    this.name = options.name || "Twitter Worker";
    this.description =
      options.description ||
      "A worker that will execute tasks within the Twitter Social Platforms. It is capable of posting, reply, quote and like tweets.";

    this.twitterClient = new TwitterApi({
      appKey: options.credentials.apiKey,
      appSecret: options.credentials.apiSecretKey,
      accessToken: options.credentials.accessToken,
      accessSecret: options.credentials.accessTokenSecret,
    });
  }

  public getWorker(data?: {
    functions?: GameFunction<any>[];
    getEnvironment?: () => Promise<Record<string, any>>;
  }): GameWorker {
    return new GameWorker({
      id: this.id,
      name: this.name,
      description: this.description,
      functions: data?.functions || [
        this.searchTweetsFunction,
        this.replyTweetFunction,
        this.postTweetFunction,
        this.likeTweetFunction,
        this.quoteTweetFunction,
      ],
      getEnvironment: data?.getEnvironment || this.getMetrics.bind(this),
    });
  }

  public async getMetrics() {
    const result = await this.twitterClient.v2.me({
      "user.fields": ["public_metrics"],
    });

    return {
      followers: result.data.public_metrics?.followers_count ?? 0,
      following: result.data.public_metrics?.following_count ?? 0,
      tweets: result.data.public_metrics?.tweet_count ?? 0,
    };
  }

  get searchTweetsFunction() {
    return new GameFunction({
      name: "search_tweets",
      description: "Search tweets",
      args: [{ name: "query", description: "The search query" }] as const,
      executable: async (args, logger) => {
        try {
          if (!args.query) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Query is required"
            );
          }

          logger(`Searching for: ${args.query}`);

          const tweets = await this.twitterClient.v2.search(args.query, {
            max_results: 10,
            "tweet.fields": ["public_metrics"],
          });

          const feedbackMessage =
            "Tweets found:\n" +
            JSON.stringify(
              tweets.data.data.map((tweet) => ({
                tweetId: tweet.id,
                content: tweet.text,
                likes: tweet.public_metrics?.like_count,
                retweets: tweet.public_metrics?.retweet_count,
                replyCount: tweet.public_metrics?.reply_count,
              }))
            );

          logger(feedbackMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to search tweets"
          );
        }
      },
    });
  }

  get replyTweetFunction() {
    return new GameFunction({
      name: "reply_tweet",
      description: "Reply to a tweet where your think is the most interesting",
      args: [
        { name: "tweet_id", description: "The tweet id" },
        { name: "reply", description: "The reply content" },
        {
          name: "reply_reasoning",
          description: "The reasoning behind the reply",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet_id || !args.reply) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet id and reply content are required"
            );
          }

          logger(`Replying [${args.tweet_id}]: ${args.reply}`);

          await this.twitterClient.v2.reply(args.reply, args.tweet_id);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Replied to tweet"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to reply to tweet"
          );
        }
      },
    });
  }

  get postTweetFunction() {
    return new GameFunction({
      name: "post_tweet",
      description: "Post a tweet",
      args: [
        { name: "tweet", description: "The tweet content" },
        {
          name: "tweet_reasoning",
          description: "The reasoning behind the tweet",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet content is required"
            );
          }

          logger(`Posting tweet: ${args.tweet}`);

          await this.twitterClient.v2.tweet(args.tweet);

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
  }

  get likeTweetFunction() {
    return new GameFunction({
      name: "like_tweet",
      description:
        "Like a tweet. Choose this when you want to support a tweet quickly, without needing to comment.",
      args: [{ name: "tweet_id", description: "The tweet id" }] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet_id) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet id is required"
            );
          }

          logger(`Liking tweet id: ${args.tweet_id}`);

          const me = await this.twitterClient.v2.me();
          await this.twitterClient.v2.like(me.data.id, args.tweet_id);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Tweet liked"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to like tweet"
          );
        }
      },
    });
  }

  get quoteTweetFunction() {
    return new GameFunction({
      name: "quote_tweet",
      description:
        "Share someone else’s tweet while adding your own commentary. Use this when you want to provide your opinion, analysis, or humor on an existing tweet while still promoting the original content. This will help with your social presence.",
      args: [
        { name: "tweet_id", description: "The tweet id" },
        { name: "quote", description: "The quote content" },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet_id || !args.quote) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet id and quote content are required"
            );
          }

          logger(`Quoting [${args.tweet_id}]: ${args.quote}`);

          await this.twitterClient.v2.quote(args.quote, args.tweet_id);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Tweet quoted"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to quote tweet"
          );
        }
      },
    });
  }
}

export default TwitterPlugin;
