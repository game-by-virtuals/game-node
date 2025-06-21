import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import { activityRecommenderWorker } from "./worker";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.API_KEY) {
    throw new Error('API_KEY is required in environment variables');
}

export const activity_agent = new GameAgent(process.env.API_KEY, {
    name: "Activity Recommender",
    goal: "Help users find the perfect activities based on their location and current weather conditions",
    description: "You are an agent that gets location of the user and then uses that to get weather information and then uses that to recommend activities",
    workers: [activityRecommenderWorker],
    llmModel: LLMModel.DeepSeek_R1 // this is an optional parameter to set the llm model for the agent. Default is Llama_3_1_405B_Instruct
});

activity_agent.setLogger((agent: GameAgent, msg: string) => {
    console.log(`🎯 [${agent.name}]`);
    console.log(msg);
    console.log("------------------------\n");
}); 