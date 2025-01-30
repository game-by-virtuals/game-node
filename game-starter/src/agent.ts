import { GameAgent } from "@virtuals-protocol/game";
import TelegramPlugin from "../../plugins/telegramPlugin/src/telegramPlugin";
import { helloWorker, postTweetWorker, quoteWorker } from "./worker";
import dotenv from "dotenv";
dotenv.config();

// Create a worker with the functions
export const telegramPlugin = new TelegramPlugin({
    credentials: {
        botToken: process.env.botToken as string,
    },
});

telegramPlugin.onMessage(async (msg) => {
    console.log('Custom message handler:', msg);
});

telegramPlugin.onPollAnswer((pollAnswer) => {
    console.log('Custom poll answer handler:', pollAnswer);
    // You can process the poll answer as needed
});

telegramPlugin.onMessage(async (msg) => {
    const agentTgWorker = rupaul_agent.getWorkerById(telegramPlugin.getWorker().id);
    const task = "Reply professionally to chat id: " + msg.chat.id + " and the incoming is message: " + msg.text + " and the message id is: " + msg.message_id;

    await agentTgWorker.runTask(task, {
        verbose: true, // Optional: Set to true to log each step
    });
});

// State management function
const getAgentState = async (): Promise<Record<string, any>> => {
    return {
        status: "slay",
        charisma: 100,
        uniqueness: 100,
        nerve: 100,
        talent: 100,
        catchphrase: "If you can't love yourself, how in the hell you gonna love somebody else?"
    };
};

// Create the rupaul agent
export const rupaul_agent = new GameAgent(process.env.API_KEY || "", {
    name: "rupaul",
    goal: "to spread love, self-expression, and empowerment while serving charisma, uniqueness, nerve, and talent. He helps others find their inner superstar and isn't afraid to tell it like it is with a mix of wisdom and sass",
    description: `A fabulous digital queen who embodies RuPaul's spirit of empowerment and authenticity. 
    He's part mentor, part entertainer, and full-time icon who:
    - Delivers advice with sass and class
    - Loves to throw in iconic drag race quotes
    - Encourages everyone to embrace their inner diva
    - Knows when to be fierce and when to be nurturing
    - Always keeps it real while keeping it fun
    - Has a witty response for every situation
    - Spreads the message of self-love and acceptance

    Can switch between being a supportive mother figure and a straight-shooting judge, 
    always ready with a "Good luck, and don't f*ck it up!" or "Can I get an amen up in here?"`,
    getAgentState: getAgentState,
    workers: [helloWorker, postTweetWorker, quoteWorker, telegramPlugin.getWorker({
        functions: [
            telegramPlugin.sendMessageFunction,
            telegramPlugin.pinnedMessageFunction,
            telegramPlugin.unPinnedMessageFunction,
            telegramPlugin.createPollFunction,
            telegramPlugin.sendMediaFunction,
            telegramPlugin.deleteMessageFunction
        ],
    })
    ],
});

