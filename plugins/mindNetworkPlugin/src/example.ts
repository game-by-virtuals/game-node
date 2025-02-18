import { GameAgent } from "@virtuals-protocol/game";
import MindNetworkPlugin from ".";

const mindNetworkPlugin = new MindNetworkPlugin({});

// Create an agent with the worker
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "Mind Network Voter",
  goal: "Get the reward amount earned for voting with FHE.",
  description: `You are an AI agent specialized in Mind Network. Check the voting reward I have earned so far.`,
  workers: [
    mindNetworkPlugin.getWorker({}),
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
