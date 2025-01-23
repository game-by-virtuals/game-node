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
 * Create a new agent with the Telegram plugin
 * The agent will be able to send messages and pin messages
 * Replace <API_TOKEN> with your API token
 */
const agent = new GameAgent("<API_TOKEN>", {
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
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();
  telegramPlugin.onMessage(async (msg) => {
    const agentTgWorker = agent.getWorkerById(telegramPlugin.getWorker().id);
    const task = "Reply to chat id: " + msg.chat.id + " and the incoming is message: " + msg.text + " and the message id is: " + msg.message_id;

    await agentTgWorker.runTask(task, {
      verbose: true, // Optional: Set to true to log each step
    });
  });
})();
