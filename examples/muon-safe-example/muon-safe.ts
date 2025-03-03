import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker,
  LLMModel,
} from "@virtuals-protocol/game";
import { MuonSafeClient } from "muon-ai-safe";
import dotenv from "dotenv";
import path from "path";
import Web3 from "web3";

// Load environment variables from the correct location
dotenv.config({ path: path.join(__dirname, ".env") });

const muonClient = new MuonSafeClient(
  process.env.AGENT_ADDRESS!,
  process.env.MUON_APP_NAME!
);

const transferTokenFunction = new GameFunction({
  name: "transfer_token",
  description: "Transfer a token from the safe wallet to the recipient",
  args: [
    { name: "wallet", description: "Address of the recipient" },
    { name: "amount", description: "Amoun to transfer considering token decimals. e.g. the decimals of USDC is 18, so 10 USDC is 1000000000000000000" },
    { name: "token", description: "Address of token on the network. e.g. the address of USDC on BSC is 0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" },
    { name: "chain", description: "The chainId of the network. e.g. BSC=56" }
  ] as const,
  executable: async (args, logger) => {
    try {
      logger(`Transfer ${args.amount} token ${args.token} to ${args.wallet}`);

      const web3 = new Web3();
      const privateKey = `0x${process.env.AGENT_PRIVATE_KEY}`;

      const messageHash = web3.utils.soliditySha3( "transfer",
        args.wallet?.toString() || "",
        args.amount?.toString() || "",
        args.token?.toString() || "",
        args.chain?.toString() || "");
      
      const { signature: agentSign } = web3.eth.accounts.sign(
          messageHash || "",
          privateKey
      );

      const response = await muonClient.performAction(
        "transfer",
        {
          recipient: args.wallet?.toString(),
          amount: args.amount?.toString(),
          token: args.token?.toString(),
          chain: args.chain?.toString()
        },
        agentSign
      );

      console.log(response);

      if (response.success) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Token transferring has been submitted to MUON safe wallet with id ${response.data?.id}`
        );
      }
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Failed to transfer token ${response.message}`
      );
    } catch (e) {
      console.log(e);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Failed to transfer token"
      );
    }
  },
});

// Create a worker with the functions
const muonSafeExampleWorker = new GameWorker({
  id: "muon_safe_main_worker",
  name: "MuonSafeExample main worker",
  description:
    "Worker that interacts with MUON AI-Safe wallet to execute onchain actions based on users' commands",
  functions: [transferTokenFunction],
  // Optional: Get the environment
  getEnvironment: async () => {
    return {};
  },
});

// Create an agent with the worker
const agent = new GameAgent(process.env.API_KEY!, {
  name: "MuonSafe Example Agent",
  goal: "Do onchain transactions",
  description: `You are an AI agent with the ability to perform onchain actions like the transferring a token.
   You get users' commands and parse them, if the user wants to perform an onchain action, you send the action with the parameters to MUON safe executor to be executed`,
  workers: [muonSafeExampleWorker],
  llmModel: LLMModel.DeepSeek_R1, // Optional: Set the LLM model default (LLMModel.Llama_3_1_405B_Instruct)
  // Optional: Get the agent state
  getAgentState: async () => {
    return {};
  },
});

(async () => {
  // define custom logger
  agent.setLogger((agent, msg) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(msg);
    console.log("\n");
  });

  await agent.init();

  const agentWorker = agent.getWorkerById(muonSafeExampleWorker.id);

  const task = "Send 10 usdt to 0x87412962Ce31914D008aF43F6528cB5d31D20Fd6 on polygon";

  await agentWorker.runTask(task, {
    verbose: true, // Optional: Set to true to log each step
  });
})();
