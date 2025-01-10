interface DiscordMessageArgs {
    channelId: string; // The ID of the channel containing the message
    messageId: string; // The ID of the message to retrieve, edit, or delete
}

interface DiscordPinMessageArgs {
    channelId: string; // The ID of the channel containing the message
    messageId: string; // The ID of the message to pin or unpin
}

interface DiscordReactionArgs {
    channelId: string; // ID of the channel containing the message
    messageId: string; // ID of the message to react to
    emoji: string; // The emoji for the reaction (URL-encoded if custom emoji)
}

interface DiscordSendMessageArgs {
    channelId: string; // The ID of the channel
    content: string; // The content of the message
    tts?: boolean; // Whether this is a text-to-speech message
    embed?: object; // Embed object (optional)
}