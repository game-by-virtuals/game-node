import { GameWorker } from "@virtuals-protocol/game"
import { getIngredients, makeFood, buyIngredient, getBudget } from "./functions"

export let restaurantBudget: number = 100;
export const updateRestaurantBudget = (newBudget: number) => {
    restaurantBudget = newBudget
}
export const ingredientPrices: Record<string, number> = {
  'tomatoes': 2.99,
  'chicken': 5.99,
  'rice': 1.99,
  'onions': 1.49,
  'garlic': 0.99,
  'beef': 8.99,
  'pasta': 2.49,
  'cheese': 4.99,
  'bell_peppers': 1.79,
  'olive_oil': 6.99
};

export const restaurantInventory: Record<string, number> = {
  'tomatoes': 0,
  'chicken': 0,
  'rice': 0,
  'onions': 0,
  'garlic': 0,
  'beef': 0,
  'pasta': 0,
  'cheese': 0,
  'bell_peppers': 0,
  'olive_oil': 0
};

export const HeadChef = new GameWorker({
    id: "head_chef",
    name: "HeadChef",
    description: `The head chef of the kitchen, your goal is to utilize the available inventory to make the best food. Available inventory is based on the amount behind the inventory object. 
    For example, if the inventory object has 2 tomatoes, it will show like 'tomatoes': 2, and you can make 10 dishes with tomatoes.`,
    functions: [getIngredients , makeFood],
    getEnvironment: async () => {
        return {
            inventory: restaurantInventory
        }
    }
})

export const IngredientManager = new GameWorker({
    id: "ingredient_manager",
    name: "IngredientManager",
    description: `The ingredient manager of the kitchen, your goal is to maximize the use of budget to buy ingredients that can be used to make the best food based on the current inventory. 
    only buy ingredients that are listed in the inventory. When making a purchase of the ingredient, refer to the prices with the ingredientPrices object`,
    functions: [buyIngredient, getBudget],
    getEnvironment: async () => {
        return {
            budget: restaurantBudget,
            inventory: restaurantInventory
        }
    }
})