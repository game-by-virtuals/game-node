module.exports = {
  apps: [{
    name: "aixbt-reactive-agent",
    script: "/home/ubuntu/.nvm/versions/node/v23.11.0/bin/ts-node",  // Use the full path to ts-node
    args: "aixbt-reactive-v6.ts",
    cwd: "/home/ubuntu/game-node/aixbt",  // Make sure this is your correct working directory
    env: {
      NODE_ENV: "production",
      GAME_DEV_API_KEY: process.env.GAME_DEV_API_KEY,
      AIXBT_API_KEY: process.env.AIXBT_API_KEY,
      WHITELISTED_WALLET_PRIVATE_KEY: process.env.WHITELISTED_WALLET_PRIVATE_KEY,
      SESSION_ENTITY_KEY_ID: process.env.SESSION_ENTITY_KEY_ID,
      AGENT_WALLET_ADDRESS: process.env.AGENT_WALLET_ADDRESS,
      GAME_API_KEY: process.env.GAME_API_KEY
    }
  }]
}
