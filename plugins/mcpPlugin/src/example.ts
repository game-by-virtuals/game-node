import { GameAgent } from "@virtuals-protocol/game";
import McpPlugin from "./mcpPlugin";

// Create a worker with the functions
const braveMcpPlugin = new McpPlugin({
    id: "brave_mcp_worker",
    name: "Brave MCP Worker",
    description: "A worker that acts as a MCP client for Brave Browser. It can executes perform a web search using the Brave Search API.",
    mcpClientConfiguration: {
       "command": "/usr/local/bin/docker",
        "args": [
            "run",
            "-i",
            "--rm",
            "-e",
            "BRAVE_API_KEY",
            "mcp/brave-search"
        ],
        "env": {
            "BRAVE_API_KEY": "<BRAVE_API_KEY>"
        }
    },
});

const createAgent = async () => {
  const agent = new GameAgent("<GAME_API_KEY>", {
    name: "Web Search Bot",
    goal: "A bot that will search the web for information.",
    description: "This agent will constantly search the web for information.",
    workers: [
      await braveMcpPlugin.getWorker(),
    ],
  });

  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();
  // Run the agent for with 60 seconds interval
  // this will stop when agent decides to wait
  await agent.run(20, { verbose: true });
};

createAgent();

