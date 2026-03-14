import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

interface ITwitterPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  twitterClient: TwitterClient;
}

import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from '@virtuals-protocol/game';
import { TwitterClient } from './twitterClient';

class CustomTwitterPlugin {
  private id: string;
  private name: string;
  private description: string;
  private twitterClient: TwitterClient;

  constructor(options: ITwitterPluginOptions) {
    if (!options.twitterClient) {
      throw new Error('Twitter client is required');
    }
    this.twitterClient = options.twitterClient;
    this.id = options.id || 'twitter_worker';
    this.name = options.name || 'Twitter Worker';
    this.description =
      options.description ||
      'A worker that interacts with Twitter API to perform various Twitter-related operations.';
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
        this.likeTweetFunction,
        this.retweetTweetFunction,
        this.postTweetFunction,
        this.getUserFunction,
        this.getTweetFunction,
        this.getRetweetersFunction,
        this.searchTweetsFunction,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  get boostTweetFunction() {
    return new GameFunction({
      name: 'boost_tweet',
      description:
        "Boost a specific tweet. Use this when it's needed to complete a gig that requires liking and reposting a tweet. ('boost' gig type)",
      args: [
        {
          name: 'tweetId',
          description: 'The ID of the tweet to boost',
          type: 'string',
        },
      ],
      executable: async (args, logger) => {
        try {
          if (!args.tweetId) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Tweet ID is required',
            );
          }
          await this.twitterClient.boostTweet(args.tweetId);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            'Tweet boosted successfully',
          );
        } catch (e) {
          logger?.(`Error boosting tweet: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to boost tweet: ${e}`,
          );
        }
      },
    });
  }

  get likeTweetFunction() {
    return new GameFunction({
      name: 'like_tweet',
      description: 'Like a specific tweet',
      args: [
        {
          name: 'tweetId',
          description: 'The ID of the tweet to like',
          type: 'string',
        },
      ],
      executable: async (args, logger) => {
        try {
          if (!args.tweetId) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Tweet ID is required',
            );
          }
          await this.twitterClient.likeTweet(args.tweetId);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            'Tweet liked successfully',
          );
        } catch (e) {
          logger?.(`Error liking tweet: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to like tweet: ${e}`,
          );
        }
      },
    });
  }

  get retweetTweetFunction() {
    return new GameFunction({
      name: 'retweet_tweet',
      description: 'Retweet a specific tweet',
      args: [
        {
          name: 'tweetId',
          description: 'The ID of the tweet to retweet',
          type: 'string',
        },
      ],
      executable: async (args, logger) => {
        try {
          if (!args.tweetId) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Tweet ID is required',
            );
          }
          await this.twitterClient.retweetTweet(args.tweetId);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            'Tweet retweeted successfully',
          );
        } catch (e) {
          logger?.(`Error retweeting tweet: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to retweet tweet: ${e}`,
          );
        }
      },
    });
  }

  get postTweetFunction() {
    return new GameFunction({
      name: 'post_tweet',
      description: 'Post a new tweet',
      args: [
        {
          name: 'text',
          description: 'The content of the tweet to post',
          type: 'string',
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.text) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Text is required',
            );
          }
          await this.twitterClient.postTweet(args.text);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            'Tweet posted successfully',
          );
        } catch (e) {
          logger?.(`Error posting tweet: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to post tweet: ${e}`,
          );
        }
      },
    });
  }

  get getUserFunction() {
    return new GameFunction({
      name: 'get_user',
      description: "Get a Twitter user's profile information by username. Can be used to retrieve my own profile information by providing my username.",
      args: [
        {
          name: 'username',
          description: 'The Twitter username',
          type: 'string',
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.username) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Username is required',
            );
          }
          const user = await this.twitterClient.getUser(args.username);
          if (!user) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `User ${args.username} not found`,
            );
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(user),
          );
        } catch (e) {
          logger?.(`Error getting user: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get user: ${e}`,
          );
        }
      },
    });
  }

  get getTweetFunction() {
    return new GameFunction({
      name: 'get_tweet',
      description: 'Get a specific tweet by its ID',
      args: [
        {
          name: 'tweetId',
          description: 'The ID of the tweet to retrieve',
          type: 'string',
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweetId) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Tweet ID is required',
            );
          }
          const tweet = await this.twitterClient.getTweet(args.tweetId);
          if (!tweet) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Tweet with ID ${args.tweetId} not found`,
            );
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(tweet),
          );
        } catch (e) {
          logger?.(`Error getting tweet: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get tweet: ${e}`,
          );
        }
      },
    });
  }

  get getRetweetersFunction() {
    return new GameFunction({
      name: 'get_retweeters',
      description: 'Get users who retweeted a specific tweet',
      args: [
        { name: 'tweetId', description: 'The ID of the tweet', type: 'string' },
        {
          name: 'since',
          description: 'Timestamp in milliseconds to start search from',
          type: 'number',
          optional: true,
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweetId) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Tweet ID is required',
            );
          }
          const since = args.since ? parseInt(args.since) : undefined;
          const retweeters = await this.twitterClient.getRetweeters(
            args.tweetId,
            since,
          );

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(retweeters),
          );
        } catch (e) {
          logger?.(`Error getting retweeters: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get retweeters: ${e}`,
          );
        }
      },
    });
  }

  get searchTweetsFunction() {
    return new GameFunction({
      name: 'search_tweets',
      description: 'Search for tweets matching a specific query',
      args: [
        {
          name: 'query',
          description: 'The search query string',
          type: 'string',
        },
        {
          name: 'maxTweets',
          description: 'Maximum number of tweets to retrieve',
          type: 'number',
          optional: true,
        },
        {
          name: 'searchMode',
          description: 'Search mode (Latest, Popular, or All)',
          type: 'string',
          optional: true,
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Convert searchMode string to enum value
          const searchMode =
            args.searchMode?.toLowerCase() === 'popular'
              ? 1
              : args.searchMode?.toLowerCase() === 'all'
              ? 2
              : 0; // Default to Latest (0)

          if (!args.query) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              'Query is required',
            );
          }
          const maxTweets = args.maxTweets
            ? parseInt(args.maxTweets)
            : undefined;
          const results = await this.twitterClient.fetchSearchTweets(
            args.query,
            maxTweets || 20,
            searchMode,
          );

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(results),
          );
        } catch (e) {
          logger?.(`Error searching tweets: ${e}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to search tweets: ${e}`,
          );
        }
      },
    });
  }
}

export default CustomTwitterPlugin;
