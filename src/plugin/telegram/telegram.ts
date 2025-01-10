import { apiRequest } from "../../util/api";

class TelegramClient {
    private botToken: string;
    private baseURL: string;

    constructor(botToken: string) {
        this.botToken = botToken;
        this.baseURL = `https://api.telegram.org/bot${botToken}`;
    }

    /**
  * Send a message to a chat or channel.
  * @param args Parameters for the sendMessage method
  * @returns The API response with the message details
  */
    public async sendMessage(args: SendMessageArgs): Promise<SendMessageResponse> {
        const url = `${this.baseURL}/sendMessage`;
        return apiRequest<SendMessageResponse>({
            method: "post",
            url,
            data: args,
        });
    }


    /**
     * Send a media message to a chat.
     * @param args Parameters for sending media
     * @returns The API response with message details
     */
    public async sendMedia(args: SendMediaArgs): Promise<SendMediaResponse> {
        const url = `${this.baseURL}/send${args.media_type.charAt(0).toUpperCase() + args.media_type.slice(1)}`;
        const payload = {
            chat_id: args.chat_id,
            caption: args.caption,
            parse_mode: args.parse_mode,
            disable_notification: args.disable_notification,
            reply_to_message_id: args.reply_to_message_id,
            [args.media_type]: args.media, // Dynamic media field
        };
        return apiRequest<SendMediaResponse>({
            method: "post",
            url,
            data: payload,
        });
    }

    /**
     * Create a poll in a chat or channel.
     * @param args Parameters for the createPoll method
     * @returns The API response with poll details
     */
    public async createPoll(args: CreatePollArgs): Promise<CreatePollResponse> {
        const url = `${this.baseURL}/sendPoll`;
        return apiRequest<CreatePollResponse>({
            method: "post",
            url,
            data: args,
        });
    }

    /**
     * Update the pinned message in a chat.
     * This can pin a new message or unpin the current one.
     * @param args Parameters for updating the pinned message
     * @returns API response indicating success or failure
     */
    public async updatePinnedMessage(args: UpdatePinnedMessageArgs): Promise<any> {
        // Pin a new message
        const url = `${this.baseURL}/pinChatMessage`;
        return apiRequest({
            method: "post",
            url,
            data: {
                chat_id: args.chat_id,
                message_id: args.message_id,
                disable_notification: args.disable_notification,
            },
        });
    }

    /**
   * Delete multiple messages from a chat.
   * @param args Parameters for deleting messages
   * @returns Promise resolving with results for each message
   */
    public async deleteMessages(args: DeleteMessagesArgs): Promise<{ [messageId: number]: boolean }> {
        const url = `${this.baseURL}/deleteMessage`;
        const results: { [messageId: number]: boolean } = {};

        for (const messageId of args.message_ids) {
            try {
                const response = await apiRequest({
                    method: "post",
                    url,
                    data: {
                        chat_id: args.chat_id,
                        message_id: messageId,
                    },
                });
                // results[messageId] = response.ok;
            } catch (error) {
                // results[messageId] = false;
                console.error(`Failed to delete message ${messageId}:`, error);
            }
        }

        return results;
    }
}

export default TelegramClient;