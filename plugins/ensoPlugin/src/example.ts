import { GameAgent } from "@virtuals-protocol/game";
import { getEnsoWorker } from ".";
import { base } from "viem/chains";
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as Address);

const publicClient = createPublicClient({
  transport: http(process.env.RPC_PROVIDER_URL),
  chain: base,
}) as PublicClient;

const walletClient = createWalletClient({
  account: account,
  transport: http(process.env.RPC_PROVIDER_URL),
  chain: base,
});

(async () => {
  const ensoActionsWorker = await getEnsoWorker({
    wallet: walletClient,
    publicClient,
    apiKey: process.env.ENSO_API_KEY || "1e02632d-6feb-4a75-a157-documentation",
  });

  const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
    name: "Enso Actions Agent",
    goal: "Find the best route between two tokens and execute it",
    description:
      "An agent that finds the best route between tokens and executes it",
    workers: [ensoActionsWorker],
  });

  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(`${message}\n`);
  });

  await agent.init();
  const agentWorker = agent.getWorkerById(ensoActionsWorker.id);
  const task = `Swap 0.0002 WETH (address 0x4200000000000000000000000000000000000006) for USDC (address 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913)`;

  await agentWorker.runTask(task, { verbose: true });
})();
