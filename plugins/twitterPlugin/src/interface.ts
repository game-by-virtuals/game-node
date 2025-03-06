import {
  TweetSearchRecentV2Paginator,
  TweetV2LikeResult,
  TweetV2PostTweetResult,
  UserV2Result,
  TweetUserMentionTimelineV2Paginator,
  UserV2TimelineResult,
} from "twitter-api-v2";

export type MediaIdsType =
  | [string]
  | [string, string]
  | [string, string, string]
  | [string, string, string, string];
export interface ITweetClient {
  post(tweet: string, mediaIds?: MediaIdsType): Promise<TweetV2PostTweetResult>;
  search(query: string): Promise<TweetSearchRecentV2Paginator["data"]>;
  reply(
    tweet_id: string,
    reply: string,
    mediaIds?: MediaIdsType
  ): Promise<TweetV2PostTweetResult>;
  like(tweet_id: string): Promise<TweetV2LikeResult>;
  quote(
    tweet_id: string,
    quote: string,
    mediaIds?: MediaIdsType
  ): Promise<TweetV2PostTweetResult>;
  me(): Promise<UserV2Result>;
  mentions(
    paginationToken?: string
  ): Promise<TweetUserMentionTimelineV2Paginator["data"]>;
  followers(paginationToken?: string): Promise<UserV2TimelineResult>;
  following(paginationToken?: string): Promise<UserV2TimelineResult>;
  uploadMedia(media: Blob): Promise<string>;
}
