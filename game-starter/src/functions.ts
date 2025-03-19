import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

// Verify environment variables before imports
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in .env file');
}

import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1' // Default to OpenAI's standard URL
});

// Function to get location data
export const getLocationFunction = new GameFunction({
    name: "get_location",
    description: "Get current location from IP",
    args: [] as const,
    executable: async (args, logger) => {
        try {
            // Using ipinfo.io for geolocation (free tier, no API key needed)
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Failed to get location');
            }

            // Split timezone into region/city
            const [region, city] = (data.timezone || '').split('/');
            
            logger(`Location detected: ${data.city}, ${data.country}`);
            
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify({
                    city: data.city,
                    country: data.country,
                    country_name: data.country,
                    region: data.region,
                    lat: data.loc?.split(',')[0],
                    lon: data.loc?.split(',')[1],
                    timezone: data.timezone,
                    current_time: new Date().toLocaleString('en-US', { timeZone: data.timezone })
                })
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to fetch location data: ${e instanceof Error ? e.message : 'Unknown error'}`
            );
        }
    }
});

// Function to get weather data
export const getWeatherFunction = new GameFunction({
    name: "get_weather",
    description: "Get current weather for a location",
    args: [
        { name: "city", description: "City name" },
        { name: "country", description: "Country code (e.g., US)" }
    ] as const,
    executable: async (args, logger) => {
        try {
            const API_KEY = process.env.WEATHER_API_KEY;
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${args.city},${args.country}&units=metric&appid=${API_KEY}`
            );
            const data = await response.json();
            
            if (data.cod !== 200) {
                throw new Error(data.message || 'Failed to fetch weather data');
            }
            
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                JSON.stringify({
                    temp: data.main.temp,
                    feels_like: data.main.feels_like,
                    humidity: data.main.humidity,
                    conditions: data.weather[0].main,
                    description: data.weather[0].description,
                    wind_speed: data.wind.speed
                })
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to fetch weather data: ${e instanceof Error ? e.message : 'Unknown error'}`
            );
        }
    }
});

// Function to recommend activities using OpenAI
export const recommendActivitiesFunction = new GameFunction({
    name: "recommend_activities",
    description: "Recommend activities based on weather and location",
    args: [
        { name: "weather", description: "Weather in temrms of tempearture only" },
        { name: "location", description: "the city and country" }
    ] as const,
    executable: async (args, logger) => {
        
            // console.log("ARGS", args);
            
            // Create prompt for OpenAI
            const prompt = `Given the following weather:${args.weather} in ${args.location}:

            Please recommend 5 suitable activities for this weather and location...`;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-3.5-turbo",
                temperature: 0.7,
                max_tokens: 500
            });

            const recommendations = completion.choices[0].message.content;

            // console.log("RECOMMENDATIONS", recommendations);
            
            logger("Generated activity recommendations using AI");

            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Based on the current conditions in ${args.location}, here are some recommended activities:\n\n${recommendations}`
            );
        
    }
});

