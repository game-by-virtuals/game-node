## Usage

This is the github repo for our NPM package. Refer to usage examples here: https://www.npmjs.com/package/@virtuals-protocol/game

Get a GAME API key in the console https://console.game.virtuals.io/

If you have any trouble, contact Virtuals support or DevRel team members via Discord or Telegram.

## Installation

To install the package, run:

```bash
npm install @virtuals-protocol/game
```

## Game-starter

In the `game-starter` folder is a starter project that will get you up and running with a working agent in minutes.

Go into the folder's readme for instructions are on how to get started.

## Examples

In the `examples` folder, there are two self contained examples: a twitter agent and a telegram agent.

Just compile with `npm run build` and `npm start` to run! (make sure you have an API key first!)

## Plugins

In the `plugins` folder are various plugins that can give your agent more functionality.

Each plugin comes with an example file. Click into the plugin's src folder to run the `example.ts` file!

Plugins are always open source and we welcome contributions!

## Components and Architecture Overview

At a high level, this SDK allows you to develop your agents powered by the GAME architecture in its most full and flexible form. The SDK is made up of 3 main components (Agent, Worker, function), each with configurable arguments. Our docs expands in greater depth [G.A.M.E Docs](https://docs.game.virtuals.io/game-sdk).

![New SDK visual](docs/imgs/new_sdk_visual.png)

Agent (a.k.a. [high level planner](https://docs.game.virtuals.io/game-cloud#high-level-planner-context))

- Takes in a <b>Goal</b>
  - Drives the agent's behavior through the high-level plan which influences the thinking and creation of tasks that would contribute towards this goal
- Takes in a <b>Description</b>
  - Combination of what was previously known as World Info + Agent Description
  - This includes a description of the "world" the agent lives in, and the personality and background of the agent

Worker (a.k.a. [low-level planner](https://docs.game.virtuals.io/game-cloud#low-level-planner-context))

- Takes in a <b>Description</b>
  - Used to control which workers are called by the agent, based on the high-level plan and tasks created to contribute to the goal

Function

- Takes in a <b>Description</b>
  - Used to control which functions are called by the workers, based on each worker's low-level plan
  - This can be any executable

Chat Agents
-Chat Agents enable interactive conversations with AI agents that can execute functions. They are simpler to use than full Agents and are ideal for chatbot-like interactions where the agent can perform actions.

## License

This project is licensed under the MIT License.
