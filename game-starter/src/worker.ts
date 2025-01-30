import { GameWorker } from "@virtuals-protocol/game";
import { helloFunction, searchTweetsFunction, replyToTweetFunction, postTweetFunction, getKanyeQuote, getRonSwansonQuote } from "./functions";


export const quoteWorker = new GameWorker({
    id: "quote_worker",
    name: "Quote worker",
    description: "has the ability to retrieve quotes from different sources",
    functions: [getKanyeQuote, getRonSwansonQuote]
});

export const helloWorker = new GameWorker({
    id: "hello_worker",
    name: "hello worker",
    description: "has the ability to say hello",
    functions: [helloFunction],
    getEnvironment: async () => {
        return {
            status: 'friendly'
        };
    },
});

export const postTweetWorker = new GameWorker({
    id: "twitter_main_worker",
    name: "Twitter main worker",
    description: "Worker that posts tweets",
    functions: [replyToTweetFunction, postTweetFunction],
    // Optional: Provide environment to LLP
    getEnvironment: async () => {
        return {
            tweet_limit: 15,
        };
    },
});

