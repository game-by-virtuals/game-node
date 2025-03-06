import TwitterApi, {
  TweetV2PostTweetResult,
  TweetSearchRecentV2Paginator,
  TweetV2LikeResult,
  UserV2Result,
  TweetUserMentionTimelineV2Paginator,
  TweetV2PaginableTimelineParams,
  UserV2TimelineResult,
  FollowersV2ParamsWithoutPaginator,
  EUploadMimeType,
} from "twitter-api-v2";
import { ITweetClient } from "./interface";

interface ICredential {
  apiKey: string;
  apiSecretKey: string;
  accessToken: string;
  accessTokenSecret: string;
}

export class TwitterClient implements ITweetClient {
  private twitterClient: TwitterApi;

  constructor(credential: ICredential) {
    this.twitterClient = new TwitterApi({
      appKey: credential.apiKey,
      appSecret: credential.apiSecretKey,
      accessToken: credential.accessToken,
      accessSecret: credential.accessTokenSecret,
    });
  }

  get client() {
    return this.twitterClient;
  }

  post(tweet: string): Promise<TweetV2PostTweetResult> {
    return this.twitterClient.v2.tweet(tweet);
  }

  async search(query: string): Promise<TweetSearchRecentV2Paginator["data"]> {
    const response = await this.twitterClient.v2.search(query, {
      max_results: 10,
      "tweet.fields": ["public_metrics"],
    });

    return response.data;
  }

  reply(tweetId: string, reply: string): Promise<TweetV2PostTweetResult> {
    return this.twitterClient.v2.reply(reply, tweetId);
  }

  async like(tweetId: string): Promise<TweetV2LikeResult> {
    const me = await this.twitterClient.v2.me();
    return this.twitterClient.v2.like(me.data.id, tweetId);
  }

  quote(tweetId: string, quote: string): Promise<TweetV2PostTweetResult> {
    return this.twitterClient.v2.quote(quote, tweetId);
  }

  me(): Promise<UserV2Result> {
    return this.twitterClient.v2.me({
      "user.fields": ["public_metrics"],
    });
  }

  async mentions(
    paginationToken?: string
  ): Promise<TweetUserMentionTimelineV2Paginator["data"]> {
    const me = await this.twitterClient.v2.me();

    const options: Partial<TweetV2PaginableTimelineParams> = {};

    if (paginationToken) {
      options.pagination_token = paginationToken;
    }

    const response = await this.twitterClient.v2.userMentionTimeline(
      me.data.id,
      options
    );

    return response.data;
  }

  async followers(paginationToken?: string): Promise<UserV2TimelineResult> {
    const me = await this.twitterClient.v2.me();

    const options: Partial<FollowersV2ParamsWithoutPaginator> = {};

    if (paginationToken) {
      options.pagination_token = paginationToken;
    }

    const response = await this.twitterClient.v2.followers(me.data.id, options);

    return response;
  }

  async following(paginationToken?: string): Promise<UserV2TimelineResult> {
    const me = await this.twitterClient.v2.me();

    const options: Partial<FollowersV2ParamsWithoutPaginator> = {};

    if (paginationToken) {
      options.pagination_token = paginationToken;
    }

    const response = await this.twitterClient.v2.following(me.data.id, options);

    return response;
  }

  async uploadMedia(media: Blob): Promise<string> {
    const mediaBuffer = Buffer.from(await media.arrayBuffer());

    const response = await this.twitterClient.v2.uploadMedia(mediaBuffer, {
      media_type: media.type as EUploadMimeType,
    });

    return response;
  }
}
