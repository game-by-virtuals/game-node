# Twitter Plugin for Virtuals Game

This plugin allows you to integrate Twitter functionalities into your Virtuals Game. With this plugin, you can post tweets, reply to tweets, like tweets, and more.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-twitter-plugin
```

or

```bash
yarn add @virtuals-protocol/game-twitter-plugin
```

## Usage

### Importing the Plugin

First, import the `TwitterPlugin` class from the plugin:

```typescript
import TwitterPlugin from "@virtuals-protocol/game-twitter-plugin";
```

### Selection a twitter plugin

### Selecting a Twitter Plugin

There are two options for selecting a Twitter plugin based on your needs:

1. **Game Twitter Client**: This client is designed specifically for integration with the Virtuals Game environment. It provides seamless interaction with the game and allows for enhanced functionalities tailored to game-specific requirements.

```typescript
import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";

const gameTwitterClient = new GameTwitterClient({
  accessToken: "your_game_access_token",
});
```

To get the access token, run the following command:

```bash
npx @virtuals-protocol/game-twitter-plugin auth -k <GAME_API_KEY>
```

Here is an example run:

```bash
npx @virtuals-protocol/game-twitter-plugin auth -k apt-xxxxxxxxxx
```

You will see the following output:

```
Waiting for authentication...

Visit the following URL to authenticate:
https://x.com/i/oauth2/authorize?response_type=code&client_id=VVdyZ0t4WFFRMjBlMzVaczZyMzU6MTpjaQ&redirect_uri=http%3A%2F%2Flocalhost%3A8714%2Fcallback&state=866c82c0-e3f6-444e-a2de-e58bcc95f08b&code_challenge=K47t-0Mcl8B99ufyqmwJYZFB56fiXiZf7f3euQ4H2_0&code_challenge_method=s256&scope=tweet.read%20tweet.write%20users.read%20offline.access
```

After authenticating, you will receive the following message:

```
Authenticated! Here's your access token:
apx-613f64069424d88c6fbf2e75c0c80a34
```

2. **Native Twitter Client**: This client is a more general-purpose Twitter client that can be used outside of the game context. It provides standard Twitter functionalities and can be used in various applications.

```typescript
import { TwitterClient } from "@virtuals-protocol/game-twitter-plugin";

const nativeTwitterClient = new TwitterClient({
  apiKey: "your_api_key",
  apiSecretKey: "your_api_secret_key",
  accessToken: "your_access_token",
  accessTokenSecret: "your_access_token_secret",
});
```

### Creating a Worker

Create a worker with the necessary Twitter credentials:

```typescript
const twitterPlugin = new TwitterPlugin({
  twitterClient: gameTwitterClient || nativeTwitterClient, // choose either 1 client
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("API_KEY", {
  name: "Twitter Bot",
  goal: "Increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [twitterPlugin.getWorker()],
});
```

### Running the Agent

Initialize and run the agent:

```typescript
(async () => {
  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });
  }
})();
```

## Available Functions

The `TwitterPlugin` provides several functions that can be used by the agent:

- `searchTweetsFunction`: Search for tweets based on a query.
- `replyTweetFunction`: Reply to a tweet.
- `postTweetFunction`: Post a new tweet.
- `likeTweetFunction`: Like a tweet.
- `quoteTweetFunction`: Quote a tweet with your own commentary.

## License

This project is licensed under the MIT License.
