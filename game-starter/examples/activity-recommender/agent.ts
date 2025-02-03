import { GameAgent } from "@virtuals-protocol/game";
import { activityRecommenderWorker } from "./worker";
import dotenv from "dotenv";
dotenv.config();

// State management for activity recommender
const getRecommenderState = async (): Promise<Record<string, any>> => {
    return {
        lastLocation: null,
        lastWeather: null,
        recommendationCount: 0,
        lastUpdateTime: new Date().toISOString()
    };
};

if (!process.env.API_KEY) {
    throw new Error('API_KEY is required in environment variables');
}

export const activity_agent = new GameAgent(process.env.API_KEY, {
    name: "Activity Recommender",
    goal: "Help users find the perfect activities based on their location and current weather conditions",
    description: "You are an agent that gets location of the user and then uses that to get weather information and then uses that to recommend activities",
    getAgentState: getRecommenderState,
    workers: [activityRecommenderWorker],
});

activity_agent.setLogger((agent: GameAgent, msg: string) => {
    console.log(`🎯 [${agent.name}]`);
    console.log(msg);
    console.log("------------------------\n");
}); 