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

## To run project in TEE

### Phala

1. Build the docker image and publish it to the docker hub
   
    `docker compose build -t <your-dockerhub-username>/virtuals-game-starter .`

    `docker push <your-dockerhub-username>/virtuals-game-starter`

2. Deploy to Phala cloud using [tee-cloud-cli](https://github.com/Phala-Network/tee-cloud-cli) or manually with the [Cloud dashboard](https://cloud.phala.network/).

3. Check your agent's TEE proof and verify it on the [TEE Attestation Explorer](https://proof.t16z.com/).

### Oasis ROFL

1. To ROFLize your agent, get the [Oasis CLI](https://github.com/oasisprotocol/cli/releases)
   for your OS of choice.

2. Register a new ROFL app and encrypt the secrets inside the `rofl.yaml`
   manifest file:
   
     ```shell
     oasis rofl create
     echo -n "your_game_api_key_here" | oasis rofl secret set API_KEY -
     echo -n "your_openai_api_key_here" | oasis rofl secret set OPENAI_API_KEY -
     echo -n "your_weather_api_key_here" | oasis rofl secret set WEATHER_API_KEY -
     ```

3. Build the docker image and publish it, for example:
   
   ```shell
   docker build -t docker.io/<your-dockerhub-username>/virtuals-game-starter .
   docker push docker.io/<your-dockerhub-username>/virtuals-game-starter
   ```
   
   In `rofl-compose.yml` replace `<your-dockerhub-username>` with your actual
   one. To ensure integrity, we strongly suggest to hardcode the image hash reported
   when you pushed the image. For example:
   
   ```yaml
   services:
     game-starter:
       image: docker.io/rosy/virtuals-game-starter@sha256:25263747e8f9ebc193e403ac009b696ea49459d9d642b86d890de432dae4469f
   ```
   
4. Build the bundle, submit the obtained Enclave ID and the secrets to
   the chain and deploy it:
   
   ```shell
   oasis rofl build
   oasis rofl update
   oasis rofl deploy
   ```
   
5. To check that your ROFL instance is up running and review the TEE proof run:
   
   `oasis rofl show`
   
   To independently verify whether the source in front of you matches the
   deployed version of ROFL on-chain invoke:
   
   `oasis rofl build --verify`

Visit https://docs.oasis.io/build/rofl/ for documentation. Should you have
any questions reach out to us on #dev-central Discord channel at
https://oasis.io/discord.
