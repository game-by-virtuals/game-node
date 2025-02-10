import { GameWorker } from "@virtuals-protocol/game";
import { getWeatherFunction, getLocationFunction, recommendActivitiesFunction } from "./functions";

// Create a demo worker with our functions
export const activityRecommenderWorker = new GameWorker({
    id: "activity_recommender",
    name: "Activity Recommender",
    description: "Gets location and weather information and recommends activities",
    functions: [
        getLocationFunction,
        getWeatherFunction,
        recommendActivitiesFunction
    ]
}); 