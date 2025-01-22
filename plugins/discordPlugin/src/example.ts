import { GameAgent } from "@virtuals-protocol/game";
import DiscordPlugin from "./discordPlugin";

// Create a worker with the functions
const discordPlugin = new DiscordPlugin({
  credentials: {
    botToken: "<BOT TOKEN>"
  },
});

const agent = new GameAgent("<API_KEY>", {
  name: "Discord Bot",
  goal: "increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [
    discordPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        discordPlugin.sendMessageFunction,
        discordPlugin.addReactionFunction,
        discordPlugin.pinMessageFunction,
        discordPlugin.deleteMessageFunction,
      ],
      // Define the environment variables that the worker can access, by default it will use the metrics defined in the plugin
      // getEnvironment: async () => ({
      //   ...(await twitterPlugin.getMetrics()),
      //   username: "virtualsprotocol",
      //   token_price: "$100.00",
      // }),
    }),
  ],
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();
  discordPlugin.onMessage(async (msg) => {
    if (msg.guild) {
      console.log(msg);
      console.log(`Guild Name: ${msg.guild.name}, Guild ID: ${msg.guild.id}`);
    } else {
      console.log('This message is not from a guild (e.g., DM).');
    }
    if (msg.author.bot) {
      console.log('This message is from a bot.');
      return;
    }
    const agentTgWorker = agent.getWorkerById(discordPlugin.getWorker().id);
    const task = "Reply to chat id: " + msg.channelId + " and the incoming is message: " + msg.content + " and the message id is: " + msg.id;

    await agentTgWorker.runTask(task, {
      verbose: true, // Optional: Set to true to log each step
    });
  });
})();

