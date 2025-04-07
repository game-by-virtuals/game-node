import { GameAgent } from "@virtuals-protocol/game";
import ZytronPlugin from "./zytronPlugin";
import ZytronWallet from "./zytronWallet";

const zytronWallet = new ZytronWallet("<YOUR_PRIVATE_KEY>");

const zytronPlugin = new ZytronPlugin({
  id: "zytron_worker",
  name: "Zytron Worker",
  description: "This Worker enables users to execute interactions on the Zytron mainnet.",
  wallet: zytronWallet,
});

const worker = zytronPlugin.getWorker([
  zytronPlugin.checkWalletFunction,
  zytronPlugin.sendTokenFunction,
]);

const agent = new GameAgent("<GAME_API_KEY>", {
  name: "Zytron Bot",
  goal: "Interact with Zytron Mainnet",
  description: "A bot that can check balances and send tokens on Zytron Mainnet",
  workers: [
    worker,
  ],
});

(async () => {
  agent.setLogger((zytronAgent, message) => {
    console.log(`-----[${zytronAgent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();
  const agentWorker = agent.getWorkerById(worker.id);

  const task = 'Check my wallet';
  await agentWorker.runTask(task, { verbose: true });

  // const task = 'Check 0x421E75Fe9Ad40baa99Ec1170957238A0Eba8d51C';
  // await agentWorker.runTask(task, { verbose: true });

  // const task = 'Send 0.0001 ETH to 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
  // await agentWorker.runTask(task, { verbose: true });
})();
