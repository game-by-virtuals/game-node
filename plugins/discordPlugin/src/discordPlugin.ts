import {
    GameWorker,
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Example usage
interface IDiscordPluginOptions {
    id?: string;
    name?: string;
    description?: string;
    credentials: {
        botToken: string;
    };
}

class DiscordPlugin {
    private id: string;
    private name: string;
    private description: string;
    private discordClient;

    constructor(options: IDiscordPluginOptions) {
        this.id = options.id || "discord_worker";
        this.name = options.name || "Discord Worker";
        this.description =
            options.description ||
            "A worker that executes tasks within Discord. It can send messages, react to messages, pin messages, and delete messages.";

        this.discordClient = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping,
            ]
        });

        // Login the Discord client
        console.log(`Discord client logging in as ${this.name}...`);
        this.discordClient.login(options.credentials.botToken).then(() => {
            console.log(`Discord client logged in successfully as ${this.name}.`);
        }).catch((error: unknown) => {
            console.error("Failed to log in Discord client:", error);
        });
    }

    // Method to register a custom message handler
    public onMessage(handler: (msg: any) => void) {
        this.discordClient.on('messageCreate', handler);
    }


    public getWorker(data?: {
        functions?: GameFunction<any>[];
        getEnvironment?: () => Promise<Record<string, any>>;
    }): GameWorker {
        return new GameWorker({
            id: this.id,
            name: this.name,
            description: this.description,
            functions: data?.functions || [
                this.sendMessageFunction,
                this.addReactionFunction,
                this.pinMessageFunction,
                this.deleteMessageFunction
            ],
            getEnvironment: data?.getEnvironment,
        });
    }

    /**
     * Function to send a message to a Discord channel.
     * Required args: channel_id, content
     * @returns ExecutableGameFunctionResponse with status Done if the message was sent successfully.
     * @returns ExecutableGameFunctionResponse with status Failed if an error occurred while sending the message.
     */
    get sendMessageFunction() {
        return new GameFunction({
            name: "send_message",
            description: "Send a text message to a Discord channel.",
            args: [
                { name: "channel_id", description: "ID of the Discord channel to send the message to.", type: "string" },
                { name: "content", description: "Content of the message to send.", type: "string" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.channel_id || !args.content) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Both channel_id and content are required."
                        );
                    }

                    logger(`Sending message to channel: ${args.channel_id}`);

                    // Get the channel using the Discord.js client
                    const channel = await this.discordClient.channels.fetch(args.channel_id);

                    if (!channel || !channel.isTextBased()) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Invalid channel ID or the channel is not text-based."
                        );
                    }

                    // Send the message to the channel
                    await channel.send(args.content);

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

    /**
     * Function to add a reaction to a message in a Discord channel.
     * First fetch the channel using the channel_id. Then fetch the message using the message_id from the channel.
     * Eventually, react to the message using the emoji.
     * Required args: channel_id, message_id, emoji
     * @returns ExecutableGameFunctionResponse with status Done if the reaction was added successfully.
     * @returns ExecutableGameFunctionResponse with status Failed if an error occurred while adding the reaction.
     */
    get addReactionFunction() {
        return new GameFunction({
            name: "add_reaction",
            description: "Add a reaction emoji to a message.",
            args: [
                { name: "channel_id", description: "ID of the Discord channel containing the message.", type: "string" },
                { name: "message_id", description: "ID of the message to add a reaction to.", type: "string" },
                { name: "emoji", description: "Emoji to add as a reaction (Unicode or custom emoji).", type: "string" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.channel_id || !args.message_id || !args.emoji) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "channel_id, message_id, and emoji are required."
                        );
                    }

                    logger(
                        `Adding reaction: ${args.emoji} to message ${args.message_id} in channel ${args.channel_id}`
                    );

                    // Fetch the channel using Discord.js client
                    const channel = await this.discordClient.channels.fetch(args.channel_id);

                    if (!channel || !channel.isTextBased()) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Invalid channel ID or the channel is not text-based."
                        );
                    }

                    // Fetch the message within the channel
                    const message = await channel.messages.fetch(args.message_id);

                    if (!message) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Message not found."
                        );
                    }

                    // React to the message
                    await message.react(args.emoji);

                    logger("Reaction added successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Reaction added successfully."
                    );
                } catch (e) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "An error occurred while adding the reaction."
                    );
                }
            },
        });
    }

    /**
     * Function to pin a message in a Discord channel.
     * Required args: channel_id, message_id
     * First fetch the channel using the channel_id. Then fetch the message using the message_id from the channel.
     * Eventually, pin the message.
     * @returns ExecutableGameFunctionResponse with status Done if the message was pinned successfully.
     * @returns ExecutableGameFunctionResponse with status Failed if an error occurred while pinning the message.
     */
    get pinMessageFunction() {
        return new GameFunction({
            name: "pin_message",
            description: "Pin a message in a Discord channel.",
            args: [
                { name: "channel_id", description: "ID of the Discord channel containing the message.", type: "string" },
                { name: "message_id", description: "ID of the message to pin.", type: "string" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.channel_id || !args.message_id) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Both channel_id and message_id are required."
                        );
                    }

                    logger(`Pinning message ${args.message_id} in channel ${args.channel_id}`);

                    // Fetch the channel using Discord.js client
                    const channel = await this.discordClient.channels.fetch(args.channel_id);

                    if (!channel || !channel.isTextBased()) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Invalid channel ID or the channel is not text-based."
                        );
                    }

                    // Fetch the message within the channel
                    const message = await channel.messages.fetch(args.message_id);

                    if (!message) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Message not found."
                        );
                    }

                    // Pin the message
                    await message.pin();

                    logger("Message pinned successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Message pinned successfully."
                    );
                } catch (e) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "An error occurred while pinning the message."
                    );
                }
            },
        });
    }

    /**
     * Function to delete a message in a Discord channel.
     * Required args: channel_id, message_id
     * First fetch the channel using the channel_id. Then fetch the message using the message_id from the channel.
     * Eventually, delete the message.
     * @returns ExecutableGameFunctionResponse with status Done if the message was deleted successfully.
     * @returns ExecutableGameFunctionResponse with status Failed if an error occurred while deleting the message.
     */
    get deleteMessageFunction() {
        return new GameFunction({
            name: "delete_message",
            description: "Delete a message from a Discord channel.",
            args: [
                { name: "channel_id", description: "ID of the Discord channel containing the message.", type: "string" },
                { name: "message_id", description: "ID of the message to delete.", type: "string" }
            ] as const,
            executable: async (args, logger) => {
                try {
                    if (!args.channel_id || !args.message_id) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Both channel_id and message_id are required."
                        );
                    }

                    logger(`Deleting message ${args.message_id} in channel ${args.channel_id}`);

                    // Fetch the channel using Discord.js client
                    const channel = await this.discordClient.channels.fetch(args.channel_id);

                    if (!channel || !channel.isTextBased()) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Invalid channel ID or the channel is not text-based."
                        );
                    }

                    // Fetch the message within the channel
                    const message = await channel.messages.fetch(args.message_id);

                    if (!message) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Message not found."
                        );
                    }

                    // Delete the message
                    await message.delete();

                    logger("Message deleted successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Message deleted successfully."
                    );
                } catch (e) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "An error occurred while deleting the message."
                    );
                }
            },
        });
    }
}

export default DiscordPlugin;