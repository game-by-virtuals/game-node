# twitterPrimusPlugin Demo
## Overview
This is a demo project that demonstrates how to use the `twitterPrimusPlugin` to generate a zkTlS attestation for you function(action).

## How to run

### Install
####  Install dependencies in twitterPrimusPlugin
```shell
npm install
```
#### Install dependencies in example
run `npm install` to install dependencies.
```shell
cd example
npm install
```

### Configuration
1. Create a `.env` file in the root directory using the `.env.example` as template.
```shell
cp .env.example .env
```

2. Set the environment variables in the `.env` file.
```dotenv
# Get from https://console.game.virtuals.io/
GAME_API_KEY=

# Worker information
WORKER_ID=<worker id>
WORKER_NAME=<worker name>
WORKER_DESC=<worker desc>

# Primus SDK 
# APP_ID and APP_SECRET get from https://dev.primuslabs.xyz/myDevelopment/myProjects . Create a new Backend project and save your 'Application ID(APP_ID)' and 'Secret Key(APP_SECRET)'
# Docs for Primus SDK : https://docs.primuslabs.xyz/data-verification/core-sdk/overview
APP_ID=
APP_SECRET=

# Twitter account
TWITTER_USER_NAME=
TWITTER_PASSWORD=
TWITTER_EMAIL=
TWITTER_2FA_SECRET=#NOT NECESSARY, Only need for twitter 2FA
```

### Run
```shell
npm run start
```