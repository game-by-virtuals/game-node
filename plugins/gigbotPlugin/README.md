# Gigbot Plugin

A powerful automation plugin for completing social media gigs on the Gigbot platform. This plugin enables automatic interaction with Twitter/X to earn rewards by completing various social tasks such as liking, retweeting, and replying to posts.

## Features

- Automatically fetches available gigs from Gigbot
- Checks if gigs are already completed before attempting them
- Handles Twitter interactions (like, retweet, reply, etc.)
- Caches gig data to reduce API calls
- Detailed logging of agent activities

## Prerequisites

- Node.js (v23 or higher)
- pnpm package manager
- Twitter/X account
- GAME API key ([Get one here](https://console.game.virtuals.io/))

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd game-node/game-starter
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual credentials:

```
API_KEY=apt-***                    # Your Gigbot API key from console.game.virtuals.io
TWITTER_EMAIL=your-email@example.com      # Twitter account email
TWITTER_PASSWORD=your-password            # Twitter account password
TWITTER_USERNAME=your-twitter-username    # Twitter username without @
TWITTER_TWO_FACTOR_SECRET=YOUR_2FA_SECRET # Twitter 2FA secret (if enabled)
TWITTER_COOKIES='[...]'                   # Twitter authentication cookies
```

### 4. Build the project

```bash
pnpm build
```

## Usage

### Running the plugin

To start the agent that will fetch and complete gigs:

```bash
pnpm start
```

The agent will:
1. Initialize the Twitter client and Gigbot connections
2. Fetch available gigs from the Gigbot API
3. Check if each gig has already been completed
4. Attempt to complete available gigs through Twitter interactions
5. Mark completed gigs as done

## Environment Variables Explained

- `API_KEY`: Your GAME API key (required) - Get one from [Gigbot Console](https://console.game.virtuals.io/)
- `TWITTER_EMAIL`: Email address associated with your Twitter account
- `TWITTER_PASSWORD`: Password for your Twitter account
- `TWITTER_USERNAME`: Your Twitter username (without the @ symbol)
- `TWITTER_TWO_FACTOR_SECRET`: If you have 2FA enabled, provide your 2FA secret
- `TWITTER_COOKIES`: JSON string with Twitter authentication cookies

## Development

For development, you can run the plugin in watch mode:

```bash
pnpm watch
```

And in another terminal:

```bash
pnpm dev
```

This will transpile TypeScript files on save and run the development version.

## Plugin Structure

- `src/index.ts`: Entry point that initializes and runs the agent
- `src/agent.ts`: Defines the agent with its goals and workers
- `src/gigbotPlugin.ts`: Handles interactions with the Gigbot API
- `src/twitterPlugin.ts`: Provides Twitter functionality
- `src/twitterClient.ts`: Twitter API client implementation
- `src/types.ts`: TypeScript type definitions

## Troubleshooting

If you encounter issues:

1. Ensure your API key is valid and correctly set in the `.env` file
2. Check that your Twitter credentials are correct
3. Make sure you have proper internet connectivity
4. Verify that you've built the project after making changes (`pnpm build`)

## Getting Help

For additional help or to report issues, please contact Gigbot support or create an issue in the repository.

## License

MIT License



