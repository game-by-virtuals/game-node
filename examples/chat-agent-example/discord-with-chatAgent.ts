import { GameAgent } from "@virtuals-protocol/game";
import DiscordPlugin from "../../plugins/discordPlugin/src/discordPlugin";
import { ChatAgent } from "../../src/chatAgent";

const discordPlugin = new DiscordPlugin({
  credentials: {
    botToken: process.env.DISCORD_BOT_TOKEN || ""
  },
});

const chatAgent = new ChatAgent(process.env.GAME_API_KEY || "", "You are a helpful assistant");


  (async () => {
    // Track active chats using a Map
    const activeChats = new Map();

    discordPlugin.onMessage(async (msg) => {
        // Skip messages from bots
        if (msg.author.bot) {
            console.log('This message is from a bot.');
            return;
        }

        // Log guild information if available
        if (msg.guild) {
            console.log(`Guild Name: ${msg.guild.name}, Guild ID: ${msg.guild.id}`);
        } else {
            console.log('This message is not from a guild (e.g., DM).');
        }

        // Get or create chat for this user
        let chat = activeChats.get(msg.author.id);
        if (!chat) {
            chat = await chatAgent.createChat({
                partnerId: msg.author.id,
                partnerName: msg.author.username,
                actionSpace: [
                    discordPlugin.sendMessageFunction,
                    discordPlugin.addReactionFunction,
                    discordPlugin.pinMessageFunction,
                    discordPlugin.deleteMessageFunction,
                    // Add other Discord-specific functions here
                ],
            });
            activeChats.set(msg.author.id, chat);
        }

        const userMessage = msg.content;
        const response = await chat.next(userMessage);

        if (response.functionCall) {
            console.log(`Function call: ${response.functionCall.fn_name}`);
            // The function will be automatically executed by the agent
        }

        if (response.message) {
            await discordPlugin.sendMessageFunction.executable({
                channel_id: msg.channelId,
                content: response.message
            }, console.log);
        }

        if (response.isFinished) {
            await discordPlugin.sendMessageFunction.executable({
                channel_id: msg.channelId,
                content: "Chat ended"
            }, console.log);
        }
    });
  })();