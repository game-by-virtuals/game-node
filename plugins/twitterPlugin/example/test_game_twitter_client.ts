import { TwitterApi } from "@virtuals-protocol/game-twitter-node";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const GAME_TWITTER_ACCESS_TOKEN = process.env.GAME_TWITTER_ACCESS_TOKEN!;
const gameTwitterClient = new TwitterApi({
  gameTwitterAccessToken: GAME_TWITTER_ACCESS_TOKEN,
});

/* const twitterClient = new TwitterApi({
  appKey: "xxxx",
  appSecret: "xxxx",
  accessToken: "xxxx",
  accessSecret: "xxxx",
});
 */
async function runTwitterActions() {
  try {
    // Fetch current user info
    const user = await gameTwitterClient.v2.me();
    console.log(`🙋 Logged in as: @${user.data.username} (${user.data.name})`);

    const readOnlyClient = gameTwitterClient.readOnly;
    const user1 = await readOnlyClient.v2.userByUsername("plhery");
    console.log(user1);

    // Fetch latest mentions
    const mentionResults = await gameTwitterClient.v2.userMentionTimeline(
      user.data.id
    );
    const mentionTweets = mentionResults?.data?.data || [];
    console.log(`🔔 You have ${mentionTweets.length} recent mentions:`);

    mentionTweets.forEach((tweet, idx) => {
      console.log(`  ${idx + 1}. https://x.com/i/web/status/${tweet.id}`);
    });

    console.log("--------------------------------");
    console.log(user.data);
    // Get followers
    const followersResult = await gameTwitterClient.v2.followers(user.data.id);
    console.log("--------------------------------");
    console.log(followersResult);
    const followers = followersResult?.data || [];
    console.log(`👥 You have ${followers.length} followers`);

    followers.forEach((user, idx) => {
      console.log(`  ${idx + 1}. @${user.username} (${user.name})`);
    });

    // Get following list
    const followingResult = await gameTwitterClient.v2.following(user.data.id);
    const following = followingResult?.data || [];
    console.log(`➡️ You are following ${following.length} users`);

    following.forEach((user, idx) => {
      console.log(`  ${idx + 1}. @${user.username} (${user.name})`);
    });

    // Post a new tweet
    const postResult = await gameTwitterClient.v2.tweet(
      "Hello Web3 🧵 #GameByVirtuals"
    );
    console.log("✅ Tweet posted successfully!");
    console.log(
      `🔗 View Tweet: https://x.com/i/web/status/${postResult.data.id}`
    );

    // Like the tweet
    const likeResult = await gameTwitterClient.v2.like(
      user.data.id,
      postResult.data.id
    );
    console.log("❤️ Tweet liked!", likeResult);

    // Reply to the first posted tweet
    const replyText = "Replying to my own tweet 😎";
    const replyResult = await gameTwitterClient.v2.reply(
      replyText,
      postResult.data.id
    );
    console.log(
      `💬 Replied successfully: https://x.com/i/web/status/${replyResult.data.id}`
    );

    // Quote the tweet
    const quoteText = "Excited to be testing the new Game Twitter Plugin!";
    const quoteResult = await gameTwitterClient.v2.quote(
      quoteText,
      postResult.data.id
    );
    console.log("🔁 Tweet quoted successfully!");
    console.log(
      `🔗 View Quoted Tweet: https://x.com/i/web/status/${quoteResult.data.id}`
    );

    // Search tweets
    const searchQuery = "#GameByVirtuals";
    const searchResults = await gameTwitterClient.v2.search(searchQuery);

    const tweets = searchResults?.data?.data || [];
    console.log(`🔍 Found ${tweets.length} tweets for "${searchQuery}"`);

    tweets.forEach((tweet, idx) => {
      console.log(`  ${idx + 1}. https://x.com/i/web/status/${tweet.id}`);
    });

    if (searchResults?.meta?.next_token) {
      console.log(
        `📌 More results available. Use next_token: ${searchResults.meta.next_token}`
      );
    }

    // Upload and post with local media
    const filePath = path.resolve(__dirname, "virtuals-logo.png");
    const buffer = fs.readFileSync(filePath);
    console.log("--------------------------------");
    console.log(buffer);
    const localMediaId = await gameTwitterClient.v2.uploadMedia(buffer, {
      media_type: "image/png",
    });
    const localMediaTweet = await gameTwitterClient.v2.tweet(
      "Check this out! Uploaded with local media!",
      { media: { media_ids: [localMediaId] } }
    );
    console.log(
      `🖼️ Local Media Tweet: https://x.com/i/web/status/${localMediaTweet.data.id}`
    );

    // Upload and post with URL media
    const imageUrl =
      "https://assets.coingecko.com/coins/images/51063/large/Gaming_Agent_1fe70d54ba.jpg";
    const downStream = await axios({
      method: "GET",
      responseType: "arraybuffer",
      url: imageUrl,
    });
    const urlMediaId = await gameTwitterClient.v2.uploadMedia(downStream.data, {
      media_type: "image/jpeg",
    });
    const urlMediaTweet = await gameTwitterClient.v2.tweet(
      "Check this out! Uploaded with url media!",
      { media: { media_ids: [urlMediaId] } }
    );
    console.log(
      `🖼️ Url Media Tweet: https://x.com/i/web/status/${urlMediaTweet.data.id}`
    );
  } catch (err: any) {
    console.error("❌ Error during Twitter action:", err.message);
  }
}

runTwitterActions();
