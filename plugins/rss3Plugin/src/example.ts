
import { GameAgent } from "@virtuals-protocol/game";
import RSS3Plugin from ".";


const rss3Plugin = new RSS3Plugin({
  credentials: {
    apiKey: process.env.RSS3_API_KEY ?? "", // RSS3 API Key is currently optional
  },
});


const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "RSS3 Worker",
  goal: "Retrieve account activities via the RSS3 Network.",
  description: `You are an AI agent with the ability to access real-time activities via the RSS3 Network. You take in a blockchain wallet address (beginning with 0x) or an ENS domain (ending with .eth) and retrieve the activities associated with the account.
  `,
  workers: [
    rss3Plugin.getWorker({
      functions: [
        rss3Plugin.getActivitiesFunction,
      ],
    }),
  ],
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });
  }
})();
