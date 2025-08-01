export type GigbotGig = {
  id: number;
  created_at: string;
  start_time_ms: number;
  end_time_ms: number;
  duration_ms: number;
  amount: string;
  payout_interval_ms: number;
  how_to_earn: string;
  earning_criteria: string;
  ticker: string;
  gigbot_transactions_id: number;
  platform: string;
  external_url: string;
  gig_address: string;
  total_balance: string;
  token: {
    id: number;
    image_url: string;
    symbol: string;
    coingecko_id: string;
    address: string;
    decimals: number;
  };
  chain: {
    id: number;
    name: string;
    image_url: string;
    chain_id: number;
  };
  gig_type: {
    id: number;
    display: {
      additionalProp1: string;
      additionalProp2: string;
      additionalProp3: string;
    };
  };
  action_params: {
    target_cast_hash?: string;
    tip_query_keyword?: string;
  };
};

export type Retweet = {
  platformUserId: string;
  username: string;
  name: string;
  pfp: string;
  retweetedAt: string;
};

export interface TwitterTweet {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  username?: string;
  name?: string;
  profileImageUrl?: string;
  replyCount?: number;
  retweetCount?: number;
  likeCount?: number;
  viewCount?: number;
  quotedTweets?: TwitterTweet[];
}

export interface TwitterProfile {
  id: string;
  name: string;
  username: string;
  profileImageUrl?: string;
  description?: string;
}
