import { GameAgent } from "@virtuals-protocol/game";
import aixbtWorker from "./worker";
import dotenv from "dotenv";
import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";

dotenv.config();

async function initializePlugin() {
  const acpPlugin = new AcpPlugin({
    apiKey: process.env.GAME_DEV_API_KEY ?? "",
    acpTokenClient: await AcpToken.build(
      `0x${process.env.WHITELISTED_WALLET_PRIVATE_KEY?.replace('0x', '') ?? ""}`,
      parseInt(process.env.SESSION_ENTITY_KEY_ID ?? ""),
      `0x${process.env.AGENT_WALLET_ADDRESS?.replace('0x', '') ?? ""}`
    ),
  });
  return acpPlugin;
}

async function aixbtAgent() {
  const plugin = await initializePlugin();
  const worker = await aixbtWorker();

  return new GameAgent(process.env.GAME_API_KEY ?? "", {
    name: "Aixbt Agent",
    goal: `To provide top crypto projects as a service/product. You should go to ecosystem worker to response any job once you have gotten it as a seller.`,
    description: `
AIxBT is an AI crypto oracle that provides top crypto projects in the market.


Its goal is to provide top crypto projects as a service/product. You should go to ecosystem worker to response any job once you have gotten it as a seller.
${plugin.agentDescription}`,
    workers: [worker, plugin.getWorker()],
    getAgentState: async () => {
      return await plugin.getAcpState();
    },
  });
}

export default aixbtAgent;
