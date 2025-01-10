import { apiRequest } from "../../util/api";

class DiscordClient {
    private botToken: string;
    private baseURL: string;

    constructor(botToken: string) {
        this.botToken = botToken;
        this.baseURL = "https://discord.com/api/v10";
    }


    /**
     * Send a message to a specific channel.
     * @param args Parameters for sending the message
     * @returns Promise resolving to the sent message object
     */
    async sendMessage(args: DiscordSendMessageArgs): Promise<any> {
        const url = `${this.baseURL}/channels/${args.channelId}/messages`;
        try {
            const response = await apiRequest({
                method: "POST",
                url,
                headers: {
                    Authorization: `Bot ${this.botToken}`,
                    "Content-Type": "application/json",
                },
                data: {
                    content: args.content,
                    tts: args.tts || false,
                    embed: args.embed,
                },
            });
            console.log("Message sent successfully:", response);
            return response;
        } catch (error: any) {
            console.error("Failed to send message:", error.response?.data || error.message);
            throw error;
        }
    }


    /**
     * Add a reaction to a message.
     * @param args Parameters for the reaction
     * @returns Promise resolving to true if successful
     */
    async addReaction(args: DiscordReactionArgs): Promise<boolean> {
        const url = `${this.baseURL}/channels/${args.channelId}/messages/${args.messageId}/reactions/${encodeURIComponent(args.emoji)}/@me`;
        try {
            await apiRequest({
                method: "PUT",
                url,
                headers: {
                    Authorization: `Bot ${this.botToken}`,
                },
            });
            console.log(`Reaction "${args.emoji}" added to message ${args.messageId}.`);
            return true;
        } catch (error: any) {
            console.error(`Failed to add reaction "${args.emoji}" to message ${args.messageId}:`, error.response?.data || error.message);
            return false;
        }
    }

    /**
     * Pin a message in a channel.
     * @param args Parameters for pinning the message
     * @returns Promise resolving to true if successful
     */
    async pinMessage(args: DiscordPinMessageArgs): Promise<boolean> {
        const url = `${this.baseURL}/channels/${args.channelId}/pins/${args.messageId}`;
        try {
            await apiRequest({
                method: "PUT",
                url,
                headers: {
                    Authorization: `Bot ${this.botToken}`,
                },
            });
            console.log(`Message ${args.messageId} pinned successfully in channel ${args.channelId}.`);
            return true;
        } catch (error: any) {
            console.error(`Failed to pin message ${args.messageId}:`, error.response?.data || error.message);
            return false;
        }
    }

    /**
     * Delete a specific message.
     * @param args Parameters for deleting the message
     * @returns Promise resolving to true if successful
     */
    async deleteMessage(args: DiscordMessageArgs): Promise<boolean> {
        const url = `${this.baseURL}/channels/${args.channelId}/messages/${args.messageId}`;
        try {
            await apiRequest({
                method: "DELETE",
                url,
                headers: {
                    Authorization: `Bot ${this.botToken}`,
                },
            });
            console.log(`Message ${args.messageId} deleted successfully in channel ${args.channelId}.`);
            return true;
        } catch (error: any) {
            console.error(`Failed to delete message ${args.messageId}:`, error.response?.data || error.message);
            return false;
        }
    }
}

export default DiscordClient;