
interface SendMessageArgs {
    chat_id: string;
    text: string;
    parse_mode?: "Markdown" | "HTML";
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
    reply_to_message_id?: number;
}

interface SendMessageResponse {
    ok: boolean;
    result: {
        message_id: number;
        chat: {
            id: number;
            type: string;
            title?: string;
            username?: string;
        };
        date: number;
        text: string;
    };
}

interface SendMediaArgs {
    chat_id: string;
    media_type: "photo" | "video" | "document" | "audio";
    media: string; // File ID or URL
    caption?: string; // Optional caption
    parse_mode?: "Markdown" | "HTML";
    disable_notification?: boolean;
    reply_to_message_id?: number;
}

interface SendMediaResponse {
    ok: boolean;
    result: {
        message_id: number;
        chat: {
            id: number;
            type: string;
            title?: string;
            username?: string;
        };
        date: number;
        media?: any; // Media-specific data (e.g., photo, video, etc.)
        caption?: string;
    };
}

interface CreatePollArgs {
    chat_id: string; // Target chat or channel ID
    question: string; // Poll question
    options: string[]; // Array of answer options (2-10)
    is_anonymous?: boolean; // Whether the poll is anonymous
    type?: "regular" | "quiz"; // Poll type
    allows_multiple_answers?: boolean; // Allow multiple answers
    correct_option_id?: number; // For quiz polls: index of the correct answer
    explanation?: string; // For quiz polls: explanation for the correct answer
    explanation_parse_mode?: "Markdown" | "HTML"; // Format for explanation
    open_period?: number; // Duration in seconds for which the poll will be active
    close_date?: number; // Unix time when the poll will close
    disable_notification?: boolean; // Send silently
    reply_to_message_id?: number; // ID of the message to reply to
}

interface CreatePollResponse {
    ok: boolean;
    result: {
        message_id: number;
        chat: {
            id: number;
            type: string;
            title?: string;
            username?: string;
        };
        date: number;
        poll: {
            id: string;
            question: string;
            options: { text: string; voter_count: number }[];
            total_voter_count: number;
            is_anonymous: boolean;
            type: string;
            allows_multiple_answers: boolean;
        };
    };
}

interface UpdatePinnedMessageArgs {
    chat_id: string; // Target chat or channel ID
    message_id?: number; // ID of the message to pin (optional if unpinning only)
    disable_notification?: boolean; // If true, no notification is sent to the chat
}


interface DeleteMessagesArgs {
    chat_id: string; // Target chat or channel ID
    message_ids: number[]; // Array of message IDs to delete
}