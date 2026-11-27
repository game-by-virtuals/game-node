import { GameAgent } from "@virtuals-protocol/game";
import * as dotenv from "dotenv";
import { createPublicClient, createWalletClient, http, type Address, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

import HelmswapPlugin from "./helmswapPlugin";

dotenv.config();

// The wallet key stays in this process. HelmSwap only returns unsigned transactions.
const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as Address);
const publicClient = createPublicClient({ chain: base, transport: http(process.env.RPC_PROVIDER_URL) }) as PublicClient;
const wallet = createWalletClient({ account, chain: base, transport: http(process.env.RPC_PROVIDER_URL) });

(async () => {
  const helmswap = new HelmswapPlugin({ wallet, publicClient, apiKey: process.env.HELMSWAP_API_KEY });

  const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
    name: "HelmSwap Agent",
    goal: "Quote and swap tokens on Base when asked",
    description: "An agent that quotes swaps and, when told to, executes them with its own wallet.",
    workers: [helmswap.getWorker()],
  });

  agent.setLogger((a, message) => {
    console.log(`-----[${a.name}]-----`);
    console.log(`${message}\n`);
  });

  await agent.init();
  const worker = agent.getWorkerById(helmswap.getWorker().id);
  await worker.runTask(
    "Quote a swap of 0.001 ETH (0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee) for USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)",
    { verbose: true },
  );
})();
