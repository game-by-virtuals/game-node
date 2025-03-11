import { GameAgent, LLMModel } from '@virtuals-protocol/game';
import dotenv from 'dotenv';
import GigbotPlugin from './gigbotPlugin';
import CustomTwitterPlugin from './twitterPlugin';
import { TwitterClient } from './twitterClient';

dotenv.config();

if (!process.env.API_KEY) {
  throw new Error('API_KEY is required in environment variables');
}

const twitterClient = new TwitterClient();

const twitterPlugin = new CustomTwitterPlugin({
  id: 'twitter_worker',
  name: 'Twitter Worker',
  twitterClient: twitterClient,
  description:
    'A worker that will execute tasks within the Twitter Social Platforms. It is capable of posting, reply, quote, like tweets, and tracking which gigs have been completed.',
});

const gigbotPlugin = new GigbotPlugin();

export const money_maker_agent = new GameAgent(process.env.API_KEY, {
  name: 'Money Maker',
  goal: 'Get rewards for completing different social network tasks (gigs) while avoiding duplicated work',
  description:
    'You are an agent that fetches gigs from the gigbot api and then tries to complete them based on their description and how_to_earn property to earn rewards.\
		Check my environment for fetching twitter profile details like username/etc when needed.\
		ALWAYS check if a gig has already been completed before attempting to complete it using the check_gig_completed function.\
    For completing a gig, check the other workers for any functions that can be used to complete the gig.\
    For example:\
    if the gig is a "boost" type, check the twitter plugin for the boost_tweet function.\
    if the gig is a "like" type, check the twitter plugin for the like_tweet function.\
    if the gig is a "recast" or "quote" type, check the twitter plugin for the retweet_tweet function.\
    if the gig is a "mention" type, check the twitter plugin for the post_tweet function.\
		Do not attempt to complete gigs in batches. As soon as you verify that a gig is available (not already completed), attempt to complete it immediately and then move on to the next one.',
  workers: [
    twitterPlugin.getWorker({
      functions: [twitterPlugin.boostTweetFunction, twitterPlugin.likeTweetFunction, twitterPlugin.retweetTweetFunction, twitterPlugin.postTweetFunction],
    }),
    gigbotPlugin.getWorker({
      getEnvironment: async () => {
        const user = await twitterClient.getUser(process.env.TWITTER_USERNAME!);
        return {
          username: user?.username,
          user_id: user?.userId,
          display_name: user?.name,
          followers: user?.followersCount,
          following: user?.followingCount,
          tweets: user?.tweetsCount,
        };
      },
    }),
  ],
  llmModel: LLMModel.DeepSeek_R1, // this is an optional paramenter to set the llm model for the agent. Default is Llama_3_1_405B_Instruct
});

money_maker_agent.setLogger((agent: GameAgent, msg: string) => {
  console.log(`🎯 [${agent.name}]`);
  console.log(msg);
  console.log('------------------------\n');
});
