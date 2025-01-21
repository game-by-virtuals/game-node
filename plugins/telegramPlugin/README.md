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

### Creating a Worker

Create a worker with the necessary Twitter credentials:

```typescript
const twitterPlugin = new TwitterPlugin({
  credentials: {
    apiKey: "your_api_key",
    apiSecretKey: "your_api_secret_key",
    accessToken: "your_access_token",
    accessTokenSecret: "your_access_token_secret",
  },
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
