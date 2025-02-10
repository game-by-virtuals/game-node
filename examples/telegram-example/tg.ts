import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker,
} from "@virtuals-protocol/game";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct location
dotenv.config({ path: path.join(__dirname, '.env') });

const generateImageFunction = new GameFunction({
  name: "generate_image",
  description: "Generate an image",
  args: [
    {
      name: "image_description",
      description: "The description of the image to generate",
    },
  ] as const,
  executable: async (args, logger) => {
    try {
      // TODO: Implement generate image with url
      logger(`Generating image with description: ${args.image_description}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        "Image generated with URL: https://example.com/image.png"
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Failed to generate image"
      );
    }
  },
});

const replyMessageFunction = new GameFunction({
  name: "reply_message",
  description: "Reply to a message",
  args: [
    { name: "message", description: "The message to reply" },
    {
      name: "media_url",
      description: "The media url to attach to the message",
      optional: true,
    },
  ] as const,

  executable: async (args, logger) => {
    try {
      // TODO: Implement replying to message with image
      if (args.media_url) {
        logger(`Reply with media: ${args.media_url}`);
      }

      // TODO: Implement replying to message
      logger(`Replying to message: ${args.message}`);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Replied with message: ${args.message}`
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Failed to reply to message"
      );
    }
  },
});

const telegramWorker = new GameWorker({
  id: "telegram",
  name: "telegram",
  description: "Telegram worker",
  functions: [generateImageFunction, replyMessageFunction],
});

const agent = new GameAgent(process.env.API_KEY!, {
  name: "Telegram Bot",
  goal: "Interact with Telegram",
  description: "Telegram agent",
  workers: [telegramWorker],
});

(async () => {
  // define custom logger
  agent.setLogger((agent, msg) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(msg);
    console.log("\n");
  });

  await agent.init();

  const agentTgWorker = agent.getWorkerById(telegramWorker.id);

  const task =
    "Gotten a message from user. Message content: hey! i will need help with my project, i need an image of a cat hugging AI. Can you help me with that? Give me something that cool and cute!";

  await agentTgWorker.runTask(task, {
    verbose: true, // Optional: Set to true to log each step
  });
})();
