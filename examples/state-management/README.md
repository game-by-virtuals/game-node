# Kitchen Manager Agent (to demonstrate state management)

A virtual kitchen management system powered by AI agents that simulate running a restaurant kitchen, managing inventory, and preparing dishes.

## Overview

This project implements a kitchen management system with two main workers supervised by a Kitchen Manager:

1. **Head Chef**: Responsible for preparing dishes using available ingredients from the inventory
2. **Ingredient Manager**: Manages the kitchen's budget and purchases ingredients

## System Components

### Kitchen Manager (Agent)
- Oversees the entire kitchen operation
- Coordinates between the Head Chef and Ingredient Manager
- Makes decisions based on available moves and kitchen state
- Aims to maximize food production quality within given constraints

### State Management
- **Move Counter**: Limits the number of actions that can be performed (Tracked by the agent)
- **Restaurant Budget**: Tracks available funds for purchasing ingredients (Tracked by worker)
- **Inventory System**: Maintains count of all available ingredients (Tracked by worker)
- Each worker action consumes one move from the total available moves

## Setup and Running

1. **Environment Setup**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd [repository-name]

   # Install dependencies
   npm install
   ```

2. **Configuration**
   Create a `.env` file in the project root:
   ```
   API_KEY=your_api_key_here
   ```

3. **Running the Agent**
   In the example directory, run the following command:
   ```bash
   npm run state-management
   # or
   ts-node examples/state-management/index.ts
   ```

## Available Functions

### Head Chef Functions
- `getIngredients()`: Check current inventory
- `makeFood()`: Prepare dishes using available ingredients

### Ingredient Manager Functions
- `buyIngredient()`: Purchase new ingredients
- `getBudget()`: Check current kitchen budget

## State Tracking

The system maintains two types of state:
1. **Agent State**: Used by the Task Generator(Agent) to determine what tasks to generate
2. **Worker State**: Represents what workers see when making decisions

Both states are typically synchronized but can be managed separately if needed.

## additional info
- Each action (function call) consumes one move
- Purchases are limited by available budget
- Food can only be prepared with available ingredients in inventory

The kitchen manages the following ingredients with their respective prices:
- Tomatoes ($2.99)
- Chicken ($5.99)
- Rice ($1.99)
- Onions ($1.49)
- Garlic ($0.99)
- Beef ($8.99)
- Pasta ($2.49)
- Cheese ($4.99)
- Bell Peppers ($1.79)
- Olive Oil ($6.99)