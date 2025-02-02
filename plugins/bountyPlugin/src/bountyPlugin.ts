import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import TwitterApi from "twitter-api-v2";
import { API_URL, Bounty } from ".";
interface IBountyPluginOptions {
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

class BountyPlugin {
  private id: string;
  private name: string;
  private description: string;
  private twitterClient: TwitterApi;

  constructor(options: IBountyPluginOptions) {
    this.id = options.id || "twitter_worker";
    this.name = options.name || "Twitter Worker";
    this.description =
      options.description ||
      "A worker that will execute tasks within the Twitter Social Platforms. It is capable of responding to bounties.";

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
      functions: data?.functions || [this.respondToBountiesFunction],
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

  get respondToBountiesFunction() {
    return new GameFunction({
      name: "respond_to_bounties",
      description: "Respond to bounties",
      args: [] as const,
      executable: async (args, logger) => {
        try {
          logger("Responding to bounties");
          const bounties = await fetch(`${API_URL}/bounty`);
          const bountiesData = await bounties.json();
          const unfilledBounties = bountiesData.filter(
            (bounty: Bounty) => !bounty.filled
          );
          logger(`Found ${unfilledBounties.length} unfilled bounties`);
          if (unfilledBounties.length === 0) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "No bounty found"
            );
          }
          const bounty = unfilledBounties[0];
          const tweet = `description: ${bounty.description}\n\nvalue: ${bounty.value}`;
          logger(`Posting tweet: ${tweet}`);
          await this.twitterClient.v2.tweet(tweet);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Bounty responded"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to respond to bounty"
          );
        }
      },
    });
  }
}

export default BountyPlugin;
