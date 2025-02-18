import { GameAgent } from "@virtuals-protocol/game"
import dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });

import { HeadChef, IngredientManager } from "./worker"

let moves = 10;
const getAgentState = async () => {
    return {
        moves_left: moves
    }
}

export const setAgentState = (state: any) => {
    moves = state.moves_left;
}

export const updateMoves = (amount: number) => {
    moves = amount;
}

export const getMoves = () => {
    return moves;
}

if (!process.env.API_KEY) {
    throw new Error('API_KEY is required in environment variables');
}

export const agent = new GameAgent(process.env.API_KEY, {
    name: "kitchen_manager",
    description: `You are a responsible kitchen manager that maximizes the efficiency of the workers under you and the kitchen.
    You are a great problem solver and also nice to work with. 
    You are also in charge of making sure the kitchen produces as much high quality food in the moves_left constraint, 
    keep in mind that the moves_left constraint is the number of moves you have left to make, and each call to a worker reduces the moves_left constraint by 1`,
    goal: "Manage the kitchen efficiently to produce high-quality food within the time constraint",
    workers: [
        IngredientManager,
        HeadChef
    ] ,
    getAgentState: getAgentState
})