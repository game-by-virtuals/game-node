import  GameWorker  from "../../../src/worker";
import { getWeatherFunction, getLocationFunction, recommendActivitiesFunction } from "./functions";

const setEnvironment = async (functionResult: any, currentState: Record<string, any> | undefined) => {

    console.log("functionResult", functionResult);
    console.log("currentState", currentState);
    
    if (!currentState) {
        return {
            count: 5,
            state: currentState || {},
            timestamp: new Date().toISOString()
        };
    }
    if (functionResult) {
        return {
            count: currentState.count -1,
            state: currentState || {},
            timestamp: new Date().toISOString()
        };
    }

    return currentState;
}
// Create a demo worker with our functions
export const activityRecommenderWorker = new GameWorker({
    id: "activity_recommender",
    name: "Activity Recommender",
    description: "Gets location and weather information and recommends activities",
    functions: [
        getLocationFunction,
        getWeatherFunction,
        recommendActivitiesFunction
    ],
    getEnvironment: setEnvironment
}); 

export const getLocationWorker = new GameWorker({
    id: "get_location",
    name: "Get Location",
    description: "Gets the location of the user",
    functions: [getLocationFunction]
});

export const getWeatherWorker = new GameWorker({
    id: "get_weather",
    name: "Get Weather",
    description: "Gets the weather of the user",
    functions: [getWeatherFunction]
});

export const recommendActivitiesWorker = new GameWorker({
    id: "recommend_activities",
    name: "Recommend Activities",
    description: "Recommends activities to the user",
    functions: [recommendActivitiesFunction]
}); 