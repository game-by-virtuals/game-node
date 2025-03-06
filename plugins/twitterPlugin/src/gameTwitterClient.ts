import {
  TweetV2PostTweetResult,
  TweetSearchRecentV2Paginator,
  TweetV2LikeResult,
  UserV2Result,
  TweetUserMentionTimelineV2Paginator,
  UserV2TimelineResult,
} from "twitter-api-v2";
import { ITweetClient, MediaIdsType } from "./interface";

interface ICredential {
  accessToken: string;
}

export class GameTwitterClient implements ITweetClient {
  private baseURL: string;
  private headers: HeadersInit;

  constructor(credential: ICredential) {
    this.baseURL = "https://twitter.game.virtuals.io/tweets";
    this.headers = {
      "x-api-key": `${credential.accessToken}`,
    };
  }

  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchFormData<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return response.json();
  }

  async post(
    tweet: string,
    mediaIds?: MediaIdsType
  ): Promise<TweetV2PostTweetResult> {
    return this.fetchAPI<TweetV2PostTweetResult>("/post", {
      method: "POST",
      body: JSON.stringify({ content: tweet, mediaIds }),
    });
  }

  async search(query: string): Promise<TweetSearchRecentV2Paginator["data"]> {
    return this.fetchAPI<TweetSearchRecentV2Paginator["data"]>(
      `/search?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
      }
    );
  }

  async reply(
    tweetId: string,
    reply: string,
    mediaIds?: MediaIdsType
  ): Promise<TweetV2PostTweetResult> {
    return this.fetchAPI<TweetV2PostTweetResult>(`/reply/${tweetId}`, {
      method: "POST",
      body: JSON.stringify({ content: reply, mediaIds }),
    });
  }

  async like(tweetId: string): Promise<TweetV2LikeResult> {
    return this.fetchAPI<TweetV2LikeResult>(`/like/${tweetId}`, {
      method: "POST",
    });
  }

  async quote(tweetId: string, quote: string): Promise<TweetV2PostTweetResult> {
    return this.fetchAPI<TweetV2PostTweetResult>(`/quote/${tweetId}`, {
      method: "POST",
      body: JSON.stringify({ content: quote }),
    });
  }

  async me(): Promise<UserV2Result> {
    return this.fetchAPI<UserV2Result>("/me", {
      method: "GET",
    });
  }

  async mentions(
    paginationToken?: string
  ): Promise<TweetUserMentionTimelineV2Paginator["data"]> {
    let url = "/mentions";

    if (paginationToken) {
      url += `?paginationToken=${paginationToken}`;
    }

    return this.fetchAPI<TweetUserMentionTimelineV2Paginator["data"]>(url, {
      method: "GET",
    });
  }

  async followers(paginationToken?: string): Promise<UserV2TimelineResult> {
    let url = "/followers";

    if (paginationToken) {
      url += `?paginationToken=${paginationToken}`;
    }

    return this.fetchAPI<UserV2TimelineResult>(url, {
      method: "GET",
    });
  }

  async following(paginationToken?: string): Promise<UserV2TimelineResult> {
    let url = "/following";

    if (paginationToken) {
      url += `?paginationToken=${paginationToken}`;
    }

    return this.fetchAPI<UserV2TimelineResult>(url, {
      method: "GET",
    });
  }

  async uploadMedia(media: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("file", media);

    const result = await this.fetchFormData<{
      mediaId: string;
    }>(`/media`, {
      method: "POST",
      body: formData,
    });

    return result.mediaId;
  }
}
