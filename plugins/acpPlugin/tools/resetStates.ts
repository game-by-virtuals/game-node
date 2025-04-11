import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import { baseSepolia } from "viem/chains";

async function resetAcpStates(): Promise<void> {
  // Reset plugin state for all configured ACP tokens
  const acpAgents: {
    privateKey: string;
    entityKey: string;
    agentWallet: string;
  }[] = [
    {
      privateKey: "0x<your-buyer-whitelisted-wallet-private-key>",
      entityKey: "<your-buyer-session-entity-key-id>",
      agentWallet: "<your-buyer-agent-wallet-address>"
    },
    {
      privateKey: "0x<your-seller-whitelisted-wallet-private-key>",
      entityKey: "<your-seller-session-entity-key-id>",
      agentWallet: "<your-seller-agent-wallet-address>"
    }
  ];

  for (const agents of acpAgents) {
    if (!agents) continue; // Skip if token is undefined

    try {
      const acpPlugin = new AcpPlugin({
        apiKey: "<Game_DEV_API_KEY>",
        acpTokenClient: await AcpToken.build(
          agents.privateKey as `0x${string}`,
          Number(agents.entityKey),
          agents.agentWallet as `0x${string}`
        )
      });

      await acpPlugin.resetState();
      console.log(`Successfully reset state for token: ${agents.privateKey}`);
    } catch (e) {
      console.log(`Failed to reset state for token ${agents.privateKey}: ${e}`);
    }
  }
}

resetAcpStates();