# game-starter
### This is a starter project using the core components of the G.A.M.E SDK

To get an API KEY https://console.game.virtuals.io/

Available packages:
Python: https://github.com/game-by-virtuals/game-python
Typescript: https://github.com/game-by-virtuals/game-node
NPM: https://www.npmjs.com/package/@virtuals-protocol/game

## Prerequisites
- nvm
- git
- node

required environment variables:
- GAME_API_KEY : API key for the GAME framework, https://docs.game.virtuals.io/game-sdk
- WEATHER_API_KEY: API key for the weather API, get it from https://openweathermap.org/api
- OPENAI_API_KEY: API key for the OpenAI API, get it from https://platform.openai.com/api-keys

## To run project
1. Start from the game starter directory
   `cd game-starter`
2. Copy the environment file
    `cp .env.example .env`
3. Place your API key in the ".env" file
4. Start the project with `npm install && npm run build && npm start`
5. Or run with docker compose
    `docker compose up -d`
**Note** We recommend using nvm version 23 `nvm use 23`

## To run project in Phala TEE

1. Build the docker image and publish it to the docker hub
    `docker compose build -t <your-dockerhub-username>/virtuals-game-starter`
    `docker push <your-dockerhub-username>/virtuals-game-starter`
2. Deploy to Phala cloud using [tee-cloud-cli](https://github.com/Phala-Network/tee-cloud-cli) or manually with the [Cloud dashboard](https://cloud.phala.network/).
3. Check your agent's TEE proof and verify it on the [TEE Attestation Explorer](https://proof.t16z.com/).



