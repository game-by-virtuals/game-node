import {
  ChatAgent,
  FunctionResultStatus,
} from "../../src/chatAgent";

import  GameFunction, { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "../../src/function";

type FunctionResult = [FunctionResultStatus, string, Record<string, any>];

// Action Functions
const generatePicture = async (): Promise<ExecutableGameFunctionResponse> => {
  return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "Picture generated and presented to the user");
};

const generateMusic = async (): Promise<ExecutableGameFunctionResponse> => {
  return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "Music generated and presented to the user");
}



// Action Space
const actionSpace: GameFunction<any>[] = [
  new GameFunction({
    name: "generate_picture",
    description: "Generate a picture",
    args: [{ name: "prompt", description: "The prompt for the picture" }],
    executable: generatePicture,
  }),
  new GameFunction({
    name: "generate_music",
    description: "Generate a music",
    args: [{ name: "prompt", description: "The prompt for the music" }],
    executable: generateMusic,
  }),
  new GameFunction({
    name: "check_crypto_price",
    description: "Check the price of a crypto currency",
    args: [{ name: "currency", description: "The currency to check the price of" }],
    executable: async (args, logger) => {
      const prices: Record<string, number> = {
        bitcoin: 100000,
        ethereum: 20000,
      };
    
      
      const result = prices[args.currency!.toLowerCase()];
    
      if (!result) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "The price of the currency is not available");
      }
    
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `The price of ${args.currency} is ${result}`);
    }
  }),
];

// Environment check
const apiKey = process.env.GAME_API_KEY;
if (!apiKey) {
  throw new Error("GAME_API_KEY is not set");
}
// Create agent
const agent = new ChatAgent(apiKey, "You are helpful assistant");

const main = async () => {
  const chat = await agent.createChat({
    partnerId: "tom",
    partnerName: "Tom",
    actionSpace: actionSpace,
  });
  let chatContinue = true;

  while (chatContinue) {
    const userMessage = await getUserInput("Enter a message: ");

    const response = await chat.next(userMessage);

    if (response.functionCall) {
      console.log(`Function call: ${response.functionCall.fn_name}`);
    }

    if (response.message) {
      console.log(`Response: ${response.message}`);
    }

    if (response.isFinished) {
      chatContinue = false;
      break;
    }
  }

  console.log("Chat ended");
};

const getUserInput = async (prompt: string): Promise<string> => {
  const readline = (await import("readline")).default.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question(prompt, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
};

main().catch(console.error);
