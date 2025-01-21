import {
    GameWorker,
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import TelegramBot from 'node-telegram-bot-api';

interface ITelegramPluginOptions {
    id?: string;
    name?: string;
    description?: string;
    credentials: {
        botToken: string;
    };
}

class TelegramPlugin {
    private id: string;
    private name: string;
    private description: string;
    private telegramClient;

    constructor(options: ITelegramPluginOptions) {
        this.id = options.id || "telegram_worker";
        this.name = options.name || "Telegram Worker";
        this.description =
            options.description ||
            "A worker that executes tasks within Telegram. It can send messages, send media, create poll, pin messages, and delete messages.";

        this.telegramClient = new TelegramBot(options.credentials.botToken, { polling: true });
    }

    // Method to register a custom message handler
    public onMessage(handler: (msg: any) => void) {
        this.telegramClient.on('message', handler);
    }

    // Method to register a custom poll answer handler
    public onPollAnswer(handler: (pollAnswer: any) => void) {
        this.telegramClient.on('poll_answer', handler);
    }

    public getWorker(data?: {
        id?: string;
        functions?: GameFunction<any>[];
        getEnvironment?: () => Promise<Record<string, any>>;
    }): GameWorker {
        return new GameWorker({
            id: this.id,
            name: this.name,
            description: this.description,
            functions: data?.functions || [
                this.sendMessageFunction,
                this.sendMediaFunction,
                this.createPollFunction,
                this.pinnedMessageFunction,
                this.unPinnedMessageFunction,
                this.deleteMessageFunction
            ],
            getEnvironment: data?.getEnvironment,
        });
    }

    get sendMessageFunction() {
        return new GameFunction({
            name: "send_message",
            description: "Send a text message to a Discord channel.",
            args: [
                { name: "chat_id", description: "Unique identifier for the target chat or username of the target channel", type: "string" },
                { name: "text", description: "Message text to send. Should be contextually relevant and maintain conversation flow.", type: "string" },
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.chat_id || !args.text) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Both channel_id and content are required."
                        );
                    }

                    logger(`Sending message to channel: ${args.text}`);

                    // Get the channel using the Discord.js client
                    this.telegramClient.sendMessage(args.chat_id, args.text);
                    logger("Message sent successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Message sent successfully."
                    );
                } catch (e) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "An error occurred while sending the message."
                    );
                }
            },
        });
    }

    get sendMediaFunction() {
        return new GameFunction({
            name: "send_media",
            description: "Send a media message (photo, document, video, etc.) with an optional caption. Use when visual or document content adds value to the conversation.",
            args: [
                { name: "chat_id", description: "Target chat identifier where media will be sent.", type: "string" },
                { name: "media_type", description: "Type of media to send: 'photo', 'document', 'video', 'audio'. Choose appropriate type for content.", type: "string" },
                { name: "media", description: "File ID or URL of the media to send. Ensure content is appropriate and relevant.", type: "string" },
                { name: "caption", description: "Optional text caption accompanying the media. Should provide context or explanation when needed, or follows up the conversation.", type: "string" },
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.chat_id || !args.media_type || !args.media) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "chat_id, media_type, and media are required."
                        );
                    }

                    logger(`Sending ${args.media_type} media to chat: ${args.chat_id}`);

                    // Send the media message using the Telegram client
                    if (args.media_type === 'photo') {
                        await this.telegramClient.sendPhoto(args.chat_id, args.media, { caption: args.caption });
                    } else if (args.media_type === 'document') {
                        await this.telegramClient.sendDocument(args.chat_id, args.media, { caption: args.caption });
                    } else if (args.media_type === 'video') {
                        await this.telegramClient.sendVideo(args.chat_id, args.media, { caption: args.caption });
                    } else if (args.media_type === 'audio') {
                        await this.telegramClient.sendAudio(args.chat_id, args.media, { caption: args.caption });
                    }

                    logger(`${args.media_type} sent successfully.`);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        `${args.media_type} sent successfully.`
                    );
                } catch (e: any) {
                    logger(`Error: ${e.message}`);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to send media: ${e.message}`
                    );
                }
            },
        });
    }

    get createPollFunction() {
        return new GameFunction({
            name: "create_poll",
            description: "Create an interactive poll to gather user opinions or make group decisions. Useful for engagement and collecting feedback.",
            args: [
                { name: "chat_id", description: "Chat where the poll will be created", type: "string" },
                { name: "question", description: "Main poll question. Should be clear and specific.", type: "string" },
                { name: "options", description: "List of answer options. Make options clear and mutually exclusive.", type: "array" },
                { name: "is_anonymous", description: "Whether poll responses are anonymous. Consider privacy and group dynamics.", type: "boolean" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.chat_id || !args.question || !args.options) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "chat_id, question, and options are required."
                        );
                    }

                    logger(`Creating poll in chat: ${args.chat_id}`);

                    // Ensure options are in a correct format (an array of strings)
                    if (!Array.isArray(args.options) || args.options.length < 2) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Options must be an array with at least two items."
                        );
                    }

                    // Create the poll using the Telegram Bot API
                    const poll = await this.telegramClient.sendPoll(
                        args.chat_id,
                        args.question,
                        args.options,
                        {
                            is_anonymous: Boolean(args.is_anonymous),
                        }
                    );

                    logger(`Poll created successfully. Poll ID: ${poll.poll?.id}`);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        `Poll created successfully. Poll ID: ${poll.poll?.id}`
                    );
                } catch (e: any) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to create poll: ${e.message}`
                    );
                }
            },
        });
    }

    get pinnedMessageFunction() {
        return new GameFunction({
            name: "pinned_message",
            description: "Pin an important message in a chat. Use for announcements, important information, or group rules.",
            args: [
                { name: "chat_id", description: "Chat where the message will be pinned", type: "string" },
                { name: "message_id", description: "ID of the message to pin. Ensure message contains valuable information worth pinning.", type: "number" },
                { name: "disable_notification", description: "Whether to send notification about pinned message. Consider group size and message importance.", type: "boolean" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.chat_id || !args.message_id) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "chat_id and message_id are required."
                        );
                    }

                    logger(`Pinning message with ID: ${args.message_id} in chat: ${args.chat_id}`);

                    // Pin the message using the Telegram Bot API
                    await this.telegramClient.pinChatMessage(
                        args.chat_id,
                        Number(args.message_id),
                        {
                            disable_notification: Boolean(args.disable_notification) || false
                        }
                    );

                    logger("Message pinned successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Message pinned successfully."
                    );
                } catch (e: any) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to pin message: ${e.message}`
                    );
                }
            },
        });
    }

    get unPinnedMessageFunction() {
        return new GameFunction({
            name: "unpinned_message",
            description: "Unpin an important message in a chat. Use for announcements, important information, or group rules.",
            args: [
                { name: "chat_id", description: "Chat where the message will be unpinned", type: "string" },
                { name: "message_id", description: "ID of the message to unpin. Ensure message contains valuable information worth pinning.", type: "number" },
                { name: "disable_notification", description: "Whether to send notification about pinned message. Consider group size and message importance.", type: "boolean" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.chat_id || !args.message_id) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "chat_id and message_id are required."
                        );
                    }

                    logger(`Pinning message with ID: ${args.message_id} in chat: ${args.chat_id}`);

                    // Pin the message using the Telegram Bot API
                    await this.telegramClient.unpinChatMessage(
                        args.chat_id,
                        {
                            message_id: Number(args.message_id),
                        }
                    );

                    logger("Message pinned successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Message pinned successfully."
                    );
                } catch (e: any) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to pin message: ${e.message}`
                    );
                }
            },
        });
    }

    get deleteMessageFunction() {
        return new GameFunction({
            name: "delete_message",
            description: "Delete message from a chat. Use for moderation or cleaning up outdated information.",
            args: [
                { name: "chat_id", description: "Chat containing the messages to delete", type: "string" },
                { name: "message_id", description: "ID of the messages to delete. Consider impact before deletion.", type: "string" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.chat_id || !args.message_id) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Both chat_id and message_id are required."
                        );
                    }

                    logger(`Deleting messages from chat: ${args.chat_id}. Message IDs: ${args.message_id}`);

                    // Loop through the message IDs and delete each one
                    await this.telegramClient.deleteMessage(args.chat_id, Number(args.message_id));

                    logger("Messages deleted successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Messages deleted successfully."
                    );
                } catch (e: any) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to delete message(s): ${e.message}`
                    );
                }
            },
        });
    }
}

export default TelegramPlugin;