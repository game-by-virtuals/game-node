import {
  Scraper,
  QueryTweetsResponse,
  SearchMode,
  Tweet,
} from 'agent-twitter-client';
import { Retweet } from './types';



// Custom implementation of the TwitterClient class. 
// Although TWITTER_TWO_FACTOR_SECRET is not required, it is recommended to set it for bypassing the 2FA login and twitter's regular arkose challenges.
// Although TWITTER_COOKIES is not required, it is recommended to set it for bypassing twitter's rate limiting.
export class TwitterClient {
//   private readonly logger = new Logger(TwitterClient.name);
  private readonly cache = new Map<string, any>();
//   private requestQueue: RequestQueue;
  private client: Scraper | null = null;
  private initializationPromise: Promise<void>;
  private isInitialized = false;

  constructor() {
    // this.requestQueue = new RequestQueue();
    console.log('TwitterClient: Initializing...');
    this.initializationPromise = this.initializeClient().catch((error) => {
        console.error('TwitterClient: Failed to initialize Twitter client:', error);
    //   this.logger.error('Failed to initialize Twitter client:', error);
      throw error;
    });
  }

  private async waitForInitialization() {
    if (this.isInitialized) {
      console.log('TwitterClient: Already initialized');
      return;
    }

    try {
      console.log('TwitterClient: Waiting for initialization to complete...');
      await this.initializationPromise;
      this.isInitialized = true;
      console.log('TwitterClient: Successfully initialized');
    } catch (error) {
      console.error('TwitterClient: Initialization failed:', error);
    //   this.logger.error('Client initialization failed:', error);
      
      // Try to reinitialize once if the initial attempt failed
      console.log('TwitterClient: Attempting to reinitialize...');
      try {
        this.initializationPromise = this.initializeClient();
        await this.initializationPromise;
        this.isInitialized = true;
        console.log('TwitterClient: Reinitialization successful');
      } catch (retryError) {
        console.error('TwitterClient: Reinitialization failed:', retryError);
        throw new Error(`Twitter client initialization failed: ${retryError}`);
      }
    }
  }

  async fetchConversationByTweetId(
    tweetId: string,
    since?: number,
    before?: number,
  ) {
    // await this.waitForInitialization();

    try {
      let query = `conversation_id:${tweetId}`;


      if (since) {
        query += ` since_time:${Math.floor(since / 1000)}`;
      }

      if (before) {
        query += ` until_time:${Math.floor(before / 1000)}`;
      }

      const conversation = await this.fetchSearchTweets(
        query,
        20,
        SearchMode.Latest,
      );

      return conversation.tweets;
    } catch (error) {
    //   this.logger.error('Error fetching conversation:', error);
      return [];
    }
  }

  async fetchSearchTweets(
    query: string,
    maxTweets: number,
    searchMode: SearchMode,
    cursor?: string,
  ): Promise<QueryTweetsResponse> {
    // await this.waitForInitialization();

    try {
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ tweets: [] }), 10000),
      );

      try {
        const result = await this.client?.fetchSearchTweets(
                query,
                maxTweets,
                searchMode, 
                cursor,
              )
        return (result ?? { tweets: [] }) as QueryTweetsResponse;
      } catch (error) {
        // this.logger.error('Error fetching search tweets:', error);
        return { tweets: [] };
      }
    } catch (error) {
    //   this.logger.error('Error fetching search tweets:', error);
      return { tweets: [] };
    }
  }

  private async initializeClient() {
    try {
      console.log('TwitterClient: Creating scraper instance...');
      this.client = new Scraper();
      
      // Check if Twitter credentials are available
      if (!process.env.TWITTER_USERNAME || !process.env.TWITTER_PASSWORD || !process.env.TWITTER_EMAIL) {
        console.warn('TwitterClient: Missing some Twitter credentials in environment variables');
      }

      try {
        console.log('TwitterClient: Checking if already logged in...');
        const isLoggedIn = await this.client.isLoggedIn();
        console.log('TwitterClient: Current login status:', isLoggedIn);
        
        if (!isLoggedIn) {
          console.log('TwitterClient: Not logged in, attempting to use cookies...');
          
          // Try cookies first if available
          if (process.env.TWITTER_COOKIES) {
            try {
              console.log('TwitterClient: Cookies found, attempting to use them...');
              const cookies = process.env.TWITTER_COOKIES;
              const parsedCookies = JSON.parse(cookies);
              
              if (!Array.isArray(parsedCookies)) {
                throw new Error('Cookies must be a JSON array');
              }
              
              await this.setCookiesFromArray(parsedCookies);
              
              // Verify login worked with cookies
              const cookieLoginSuccessful = await this.client.isLoggedIn();
              if (cookieLoginSuccessful) {
                console.log('TwitterClient: Successfully logged in using cookies');
                return;
              } else {
                throw new Error('Cookie login failed verification');
              }
            } catch (cookieError) {
              console.error('TwitterClient: Failed to login with cookies:', cookieError instanceof Error ? cookieError.message : String(cookieError));
              console.log('TwitterClient: Falling back to credential login...');
            }
          } else {
            console.log('TwitterClient: No cookies found, using credential login...');
          }
          
          // Fall back to credential login
          await this.login();
          console.log('TwitterClient: Successfully logged in using credentials');
        } else {
          console.log('TwitterClient: Already logged in');
        }
      } catch (loginError) {
        console.error('TwitterClient: Error during login check/attempt:', loginError instanceof Error ? loginError.message : String(loginError));
        await this.login();
        console.log('TwitterClient: Attempted login after error');
      }

      console.log('TwitterClient: Client successfully initialized');
    } catch (error) {
      console.error('TwitterClient: Failed to initialize client:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to initialize Twitter client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async login() {
    // Check if required environment variables are set
    if (!process.env.TWITTER_USERNAME) {
      throw new Error('TWITTER_USERNAME is required but not set in environment variables');
    }
    if (!process.env.TWITTER_PASSWORD) {
      throw new Error('TWITTER_PASSWORD is required but not set in environment variables');
    }
    if (!process.env.TWITTER_EMAIL) {
      throw new Error('TWITTER_EMAIL is required but not set in environment variables');
    }
    
    const username = process.env.TWITTER_USERNAME;
    const password = process.env.TWITTER_PASSWORD;
    const email = process.env.TWITTER_EMAIL;
    const twoFactorSecret = process.env.TWITTER_TWO_FACTOR_SECRET || '';

    try {
      console.log(`TwitterClient: Attempting to login with username: ${username}`);
      await this.client?.login(username, password, email, twoFactorSecret);
      
      // Verify login was successful
      const loginSuccessful = await this.client?.isLoggedIn();
      if (!loginSuccessful) {
        throw new Error('Login completed but verification failed');
      }
      
    //   console.log('TwitterClient: Successfully logged in with credentials');
    } catch (error) {
      console.error('TwitterClient: Failed to log in with credentials:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to log in to Twitter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setCookiesFromArray(cookiesArray: any[]) {
    try {
      console.log('TwitterClient: Setting cookies from array...');
      const cookieStrings = cookiesArray.map(
        (cookie) =>
          `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${
            cookie.secure ? 'Secure' : ''
          }; ${cookie.httpOnly ? 'HttpOnly' : ''}; SameSite=${
            cookie.sameSite || 'Lax'
          }`
      );
      
      await this.client?.setCookies(cookieStrings);
      console.log('TwitterClient: Cookies set successfully');
    } catch (error) {
      console.error('TwitterClient: Failed to set cookies:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to set cookies: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getRetweeters(tweetId: string, since = 1142974200): Promise<Retweet[]> {
    // await this.waitForInitialization();

    const tweet = await this.client?.getTweet(tweetId);

    if (!tweet) {
    //   this.logger.error(`Tweet ${tweetId} not found`);
      return [];
    }
    const _since = Math.floor(since / 1000); // Note: Twitter API uses seconds

    try {
      const results: Retweet[] = [];

      // Remove t.co link only if it's the last word
      const cleanText =
        tweet.text?.replace(/\s+https:\/\/t\.co\/\w+$/g, '') ?? '';
      const retweetsQuery = `"${cleanText}" filter:nativeretweets filter:retweets since:${_since}`;
      const quotedTweetsQuery = `quoted_tweet_id:${tweetId} since:${_since}`;

    //   this.logger.debug('Searching retweets with queries:', {
    //     retweetsQuery,
    //     quotedTweetsQuery,
    //   });

      const generators = [
        this.client?.searchTweets(retweetsQuery, 500, SearchMode.Latest),
        this.client?.searchTweets(quotedTweetsQuery, 500, SearchMode.Latest),
      ];

      for (const generator of generators) {
        if (!generator) continue;
        for await (const tweet of generator) {
          results.push({
            platformUserId: tweet.userId ?? '',
            username: tweet.username ?? '',
            name: tweet.name ?? '',
            pfp: '',
            retweetedAt:
              tweet.timeParsed?.toISOString() ?? new Date().toISOString(),
          });
        }
      }

    //   this.logger.log(`Found ${results.length} retweets for tweet ${tweetId}`);
      return results;
    } catch (error) {
    //   this.logger.error(`Error fetching retweets for tweet ${tweetId}:`, error);
      return [];
    }
  }

  async postTweet(tweet: string) {
    // await this.waitForInitialization();

    await this.client?.sendTweet(tweet);
    
  }

  async getUser(username: string) {
    // await this.waitForInitialization();

    try {
      const user = await this.client?.getProfile(username);
      return user;
    } catch (error) {
    //   this.logger.error(`Error fetching user ${username}:`, error);
      return null;
    }
  }

  async getUserTweets(
    username: string,
    maxTweets: number = 50,
  ): Promise<Tweet[]> {
    // await this.waitForInitialization();

    try {
      const user = await this.getUser(username);
      if (!user) {
        // this.logger.error(`User ${username} not found`);
        return [];
      }

      const query = `from:${username} -is:retweet -filter:replies`;
      const response = await this.fetchSearchTweets(
        query,
        maxTweets,
        SearchMode.Latest,
      );

      return response.tweets.map((tweet) => ({
        ...tweet,
        thread: [],
      }));
    } catch (error) {
    //   this.logger.error(`Error fetching tweets for user ${username}:`, error);
      return [];
    }
  }

  async getTweet(tweetId: string): Promise<Omit<Tweet, 'thread'> | null> {
    // await this.waitForInitialization();

    try {
      // Check cache first
      const cacheKey = `tweet/${tweetId}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey) as Omit<Tweet, 'thread'>;
      }

      const tweet = await this.client?.getTweet(tweetId);

      if (!tweet) {
        // this.logger.error(`Tweet ${tweetId} not found`);
        return null;
      }
      // Remove thread as it is causing circular dependency
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { inReplyToStatus, thread, ...rest } = tweet;

      // Cache the result
      this.cache.set(cacheKey, rest);
      return rest;
    } catch (error) {
    //   this.logger.error(`Error fetching tweet ${tweetId}:`, error);
      return null;
    }
  }

  async likeTweet(tweetId: string) {
    // await this.waitForInitialization();

    await this.client?.likeTweet(tweetId);
  }

  async retweetTweet(tweetId: string) {
    // await this.waitForInitialization();

    await this.client?.retweet(tweetId);
  }

  async boostTweet(tweetId: string) {
    // await this.waitForInitialization();

    await Promise.all([
      this.client?.likeTweet(tweetId),
      this.client?.retweet(tweetId),
    ]);
  }
  

  async getMentions({
    query,
    maxTweets = 100,
    since,
    excludeReplies = true,
    excludeRetweets = true,
  }: {
    query: string;
    maxTweets?: number;
    since?: number;
    excludeReplies?: boolean;
    excludeRetweets?: boolean;
  }): Promise<Tweet[]> {
    await this.waitForInitialization();

    try {
      let searchQuery = query;

      // Add filters based on parameters
      if (excludeReplies) searchQuery += ' -filter:replies';
      if (excludeRetweets) searchQuery += ' -is:retweet';
      if (since) searchQuery += ` since:${Math.floor(since / 1000)}`; // Note: Twitter API uses seconds

    //   this.logger.debug('Searching mentions with query:', searchQuery);

      const response = await this.fetchSearchTweets(
        searchQuery,
        maxTweets,
        SearchMode.Latest,
      );

      return response.tweets.map((tweet) => ({
        ...tweet,
        thread: [],
      }));
    } catch (error) {
    //   this.logger.error(`Error fetching mentions for query ${query}:`, error);
      return [];
    }
  }
}
