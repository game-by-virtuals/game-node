import { GameAgent } from "@virtuals-protocol/game";
import TelegramPlugin from "./telegramPlugin";

// Create a worker with the functions
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

//Create an agent with the worker
const agent = new GameAgent("<API_TOKEN>", {
  name: "Telegram Bot",
  goal: "Auto reply message",
  description: "A bot that can post send message and pinned message",
  workers: [
    telegramPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        telegramPlugin.sendMessageFunction,
        telegramPlugin.pinnedMessageFunction,
      ],
    }),
  ],
});

// const test = telegramPlugin.sendMessageFunction;
// const log = test.executable({
//   chat_id: "811200161",
//   text: "hi, bot what your name",
// }, (msg) => {
// console.log(msg)
// });
// console.log(log)
(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();
  const agentTgWorker = agent.getWorkerById(telegramPlugin.getWorker().id);
  const task = "PROMPT";

  await agentTgWorker.runTask(task, {
    verbose: true, // Optional: Set to true to log each step
  });
  // You can process the message as needed
})();
