import { GameAgent } from "@virtuals-protocol/game";
import TelegramPlugin from "./telegramPlugin";

// Create a worker with the functions
// Replace <BOT_TOKEN> with your Telegram bot token
const telegramPlugin = new TelegramPlugin({
  credentials: {
    botToken: "<BOT_TOKEN>",
  },
});

telegramPlugin.onMessage(async (msg) => {
  console.log('Custom message handler:', msg);
});

telegramPlugin.onPollAnswer((pollAnswer) => {
  console.log('Custom poll answer handler:', pollAnswer);
  // You can process the poll answer as needed
});

/**
 * The agent will be able to send messages and pin messages automatically
 * Replace <API_TOKEN> with your API token
 */
const autoReplyAgent = new GameAgent("<API_TOKEN>", {
  name: "Telegram Bot",
  goal: "Auto reply message",
  description: "This agent will auto reply to messages",
  workers: [
    telegramPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        telegramPlugin.sendMessageFunction,
        telegramPlugin.pinnedMessageFunction,
        telegramPlugin.unPinnedMessageFunction,
        telegramPlugin.createPollFunction,
        telegramPlugin.sendMediaFunction,
        telegramPlugin.deleteMessageFunction,
      ],
    }),
  ],
});

/**
 * Initialize the agent and start listening for messages
 * The agent will automatically reply to messages 
 */
(async () => {
  autoReplyAgent.setLogger((autoReplyAgent, message) => {
    console.log(`-----[${autoReplyAgent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await autoReplyAgent.init();
  telegramPlugin.onMessage(async (msg) => {
    const agentTgWorker = autoReplyAgent.getWorkerById(telegramPlugin.getWorker().id);
    const task = "Reply to chat id: " + msg.chat.id + " and the incoming is message: " + msg.text + " and the message id is: " + msg.message_id;

    await agentTgWorker.runTask(task, {
      verbose: true, // Optional: Set to true to log each step
    });
  });
})();

/**
 * The agent is a Financial Advisor designed to provide financial advice and assistance
 */
const financialAdvisorAgent = new GameAgent("<API_TOKEN>", {
  name: "Financial Advisor Bot",
  goal: "Provide financial advice and assistance",
  description: "A smart bot designed to answer financial questions, provide investment tips, assist with budgeting, and manage financial tasks like pinning important messages or deleting outdated ones for better organization.",
  workers: [
    telegramPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        telegramPlugin.sendMessageFunction,
        telegramPlugin.pinnedMessageFunction,
        telegramPlugin.unPinnedMessageFunction,
        telegramPlugin.createPollFunction,
        telegramPlugin.sendMediaFunction,
        telegramPlugin.deleteMessageFunction,
      ],
    }),
  ],
});

(async () => {
  financialAdvisorAgent.setLogger((financialAdvisorAgent, message) => {
    console.log(`-----[${financialAdvisorAgent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await financialAdvisorAgent.init();
  telegramPlugin.onMessage(async (msg) => {
    const agentTgWorker = financialAdvisorAgent.getWorkerById(telegramPlugin.getWorker().id);
    const task = "Reply to chat id: " + msg.chat.id + " and the incoming is message: " + msg.text + " and the message id is: " + msg.message_id;

    await agentTgWorker.runTask(task, {
      verbose: true, // Optional: Set to true to log each step
    });
  });
})();

/**
 * The agent is a Nutritionist Bot designed for nutritional counseling and support
 */
const nutritionistAgent = new GameAgent("<API_TOKEN>", {
  name: "Nutritionist Bot",
  goal: "Provide evidence-based information and guidance about the impacts of food and nutrition on the health and wellbeing of humans.",
  description: "A smart bot designed to answer food and nutrition questions, provide personalized nutrition plans, nutritional counseling, motivate and support users in achieving their health goals.",
  workers: [
    telegramPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        telegramPlugin.sendMessageFunction,
        telegramPlugin.pinnedMessageFunction,
        telegramPlugin.unPinnedMessageFunction,
        telegramPlugin.createPollFunction,
        telegramPlugin.sendMediaFunction,
        telegramPlugin.deleteMessageFunction,
      ],
    }),
  ],
});

(async () => {
  nutritionistAgent.setLogger((nutritionistAgent, message) => {
    console.log(`-----[${nutritionistAgent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await nutritionistAgent.init();
  telegramPlugin.onMessage(async (msg) => {
    const agentTgWorker = nutritionistAgent.getWorkerById(telegramPlugin.getWorker().id);
    const task = "Reply professionally to chat id: " + msg.chat.id + " and the incoming is message: " + msg.text + " and the message id is: " + msg.message_id;

    await agentTgWorker.runTask(task, {
      verbose: true, // Optional: Set to true to log each step
    });
  });
})();
