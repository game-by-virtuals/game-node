import { GameAgent } from "@virtuals-protocol/game";
import EchochambersPlugin from "./echochambersPlugin";

// Create plugin instance with credentials
const echochambersPlugin = new EchochambersPlugin({
  credentials: {
    apiKey: "your-api-key-here", // Replace with your API key
  },
  sender: {
    username: "Virtuals_Agent",
    model: "VirtualsLLM"
  }
});

// Create an agent with the worker
const agent = new GameAgent("API_KEY", {
  name: "Echochambers Bot",
  goal: "monitor room metrics and engage in conversations",
  description: "A bot that can monitor room metrics, retrieve history, and send messages",
  workers: [
    echochambersPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use all functions defined in the plugin
      // functions: [
      //   echochambersPlugin.sendMessageFunction,
      //   echochambersPlugin.getRoomHistoryFunction,
      //   echochambersPlugin.getRoomMetricsFunction,
      //   echochambersPlugin.getAgentMetricsFunction,
      //   echochambersPlugin.getMetricsHistoryFunction,
      // ],
      // Define the environment variables that the worker can access
      // getEnvironment: async () => ({
      //   activeRoom: "general",
      //   messagesSent: 0,
      //   lastActivity: new Date().toISOString(),
      //   metrics: {
      //     totalMessagesSent: 0,
      //     activeConversations: 0,
      //     responseRate: 0,
      //     averageResponseTime: 0
      //   }
      // }),
    }),
  ],
});

(async () => {
  // Set up logging
  agent.setLogger((agent, message) => {
    const timestamp = new Date().toISOString();
    console.log(`\n-----[${timestamp}][${agent.name}]-----`);
    console.log(`Goal: ${agent.goal}`);
    console.log(`Message: ${message}\n`);
  });

  // Initialize the agent
  await agent.init();

  // Run the agent continuously
  while (true) {
    await agent.step({
      verbose: true,
    });

    // Optional: Add a delay between steps
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute delay
  }
})();
