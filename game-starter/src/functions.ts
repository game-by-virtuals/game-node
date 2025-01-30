import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import axios from 'axios';

export const helloFunction = new GameFunction({
    name: "hello",
    description: "A verbose and creative greeting",
    args: [
        { name: "greeting", type: "string", description: "A verbose and creative greeting" },
    ] as const,
    executable: async (args, logger) => {
        try {
            logger?.(`Said Hello: ${args.greeting}`);
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                "Action completed successfully"
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Action failed"
            );
        }
    },
});

export const postTweetFunction = new GameFunction({
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
            // TODO: Implement posting tweet or use the twitter plugin!

            // // For now just simulate posting
            console.log("Would post tweet:", args.tweet);

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


export const searchTweetsFunction = new GameFunction({
    name: "search_tweets",
    description: "Search tweets and return results",
    args: [
        { name: "query", description: "The query to search for" },
        { name: "reasoning", description: "The reasoning behind the search" },
    ] as const,
    executable: async (args, logger) => {
        try {
            const query = args.query;
            // TODO: Implement searching of tweets based on query string
            logger(`Searching tweets for query: ${query}`);

            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
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

export const replyToTweetFunction = new GameFunction({
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

            // TODO: Implement reply tweet
            logger(`Replying to tweet ${tweetId}`);
            logger(`Replying with ${reply}`);

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

export const getKanyeQuote = new GameFunction({
    name: "get_kanye_west_quote",
    description: "get a quote from kanye west",
    args: [] as const,
    executable: async (args, logger) => {
        try {
            const response = await axios.get('https://api.kanye.rest/');
            const quote = response.data.quote;

            logger(`Retrieved Kanye quote: ${quote}`);

            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                quote
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to get Kanye quote"
            );
        }
    },
});

export const getRonSwansonQuote = new GameFunction({
    name: "get_ron_swanson_quote",
    description: "get a quote from Ron Swanson",
    args: [] as const,
    executable: async (args, logger) => {
        try {
            const response = await axios.get('https://ron-swanson-quotes.herokuapp.com/v2/quotes');
            const quote = response.data[0];

            logger(`Retrieved Ron Swanson quote: ${quote}`);

            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                quote
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to get Ron Swanson quote"
            );
        }
    },
});