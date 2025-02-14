import {
  ChatAgent,
  Function,
  FunctionResultStatus,
} from "@virtuals-protocol/game";

type FunctionResult = [FunctionResultStatus, string, Record<string, any>];

// Action Functions
const generatePicture = (data: Record<string, any>): FunctionResult => {
  return [
    FunctionResultStatus.DONE,
    "Picture generated and presented to the user",
    {},
  ];
};

const generateMusic = (data: Record<string, any>): FunctionResult => {
  return [
    FunctionResultStatus.DONE,
    "Music generated and presented to the user",
    {},
  ];
};

const checkCryptoPrice = (data: Record<string, any>): FunctionResult => {
  const prices: Record<string, number> = {
    bitcoin: 100000,
    ethereum: 20000,
  };

  const result = prices[data.currency.toLowerCase()];
  if (!result) {
    return [
      FunctionResultStatus.FAILED,
      "The price of the currency is not available",
      {},
    ];
  }
  return [
    FunctionResultStatus.DONE,
    `The price of ${data.currency} is ${result}`,
    {},
  ];
};

// Action Space
const actionSpace: Function[] = [
  new Function(
    "generate_picture",
    "Generate a picture",
    [{ name: "prompt", description: "The prompt for the picture" }],
    generatePicture
  ),
  new Function(
    "generate_music",
    "Generate a music",
    [{ name: "prompt", description: "The prompt for the music" }],
    generateMusic
  ),
  new Function(
    "check_crypto_price",
    "Check the price of a crypto currency",
    [{ name: "currency", description: "The currency to check the price of" }],
    checkCryptoPrice
  ),
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
