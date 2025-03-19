import TelegramPlugin from "../../plugins/telegramPlugin/src/telegramPlugin";
import { ChatAgent } from "../../src/chatAgent";

const telegramBot = new TelegramPlugin({
    credentials: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || ""
    }
})

const chatAgent = new ChatAgent(process.env.GAME_API_KEY || "", "You are a helpful assistant")

const main = async () => {
    // Track active chats using a Map
    const activeChats = new Map();

    // Set up Telegram message handler
    telegramBot.onMessage(async (message) => {
        // Get or create chat for this user
        let chat = activeChats.get(message.from.id);
        if (!chat) {
            chat = await chatAgent.createChat({
                partnerId: message.from.id.toString(),
                partnerName: message.from.first_name,
                actionSpace: [
                    telegramBot.sendMessageFunction,
                    telegramBot.sendMediaFunction,
                    telegramBot.createPollFunction,
                    telegramBot.pinnedMessageFunction,
                    telegramBot.unPinnedMessageFunction,
                    telegramBot.deleteMessageFunction
                ],
            });
            activeChats.set(message.from.id, chat);
        }

        const userMessage = message.text;
        const response = await chat.next(userMessage);

        if (response.functionCall) {
            console.log(`Function call: ${response.functionCall.fn_name}`);
            // The function will be automatically executed by the agent
        }

        if (response.message) {
            await telegramBot.sendMessageFunction.executable({
                chat_id: message.chat.id,
                text: response.message
            }, console.log);
        }

        if (response.isFinished) {
            await telegramBot.sendMessageFunction.executable({
                chat_id: message.chat.id,
                text: "Chat ended"
            }, console.log);
        }
    });

    // Start the bot
};

main().catch(console.error);