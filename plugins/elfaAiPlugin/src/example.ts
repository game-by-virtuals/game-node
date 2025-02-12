import { GameAgent } from "@virtuals-protocol/game";
import ElfaAiPlugin from "./elfaAiPlugin";

// Replace "<ELFA_AI_API_KEY>" with your actual Elfa API key or load it from process.env.
const elfaAiPlugin = new ElfaAiPlugin({
    credentials: {
        apiKey: "<ELFA_AI_API_KEY>",
    },
});

// Create a worker from the plugin that includes all available functions.
const elfaWorker = elfaAiPlugin.getWorker({
    functions: [
        elfaAiPlugin.pingFunction,
        elfaAiPlugin.keyStatusFunction,
        elfaAiPlugin.mentionsFunction,
        elfaAiPlugin.topMentionsFunction,
        elfaAiPlugin.searchMentionsFunction,
        elfaAiPlugin.trendingTokensFunction,
        elfaAiPlugin.accountSmartStatsFunction,
    ],
});

// Create a GameAgent that uses the above worker.
// Replace "<AGENT_API_TOKEN>" with your actual agent API token.
const elfaAgent = new GameAgent("<AGENT_API_TOKEN>", {
    name: "Elfa AI Agent",
    goal: "Demonstrate integration with the Elfa AI API",
    description:
        "An agent that interacts with the Elfa AI API to discover alpha from industry insiders, influencers & traders.",
    workers: [elfaWorker],
});

(async () => {
    elfaAgent.setLogger((agent, message) => {
        console.log(`-----[${agent.name}]-----`);
        console.log(message);
        console.log("\n");
    });
    await elfaAgent.init();
    const worker = elfaAgent.getWorkerById(elfaWorker.id);
    if (!worker) {
        throw new Error("Worker not found in the agent");
    }
    const taskDescription = "get my api key status from the Elfa AI API";
    console.log("Executing task:", taskDescription);
    await worker.runTask(taskDescription, { verbose: true });
})();
