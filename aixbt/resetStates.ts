import AcpPlugin, { AcpToken, baseSepoliaConfig } from "@virtuals-protocol/game-acp-plugin";

async function resetAcpStates(): Promise<void> {
  // Reset plugin state for all configured ACP tokens
  const acpAgents: {
    privateKey: string;
    entityKey: string;
    agentWallet: string;
  }[] = [
    {
      privateKey: process.env.WHITELISTED_WALLET_PRIVATE_KEY!,
      entityKey: process.env.WHITELISTED_WALLET_ENTITY_ID!,
      agentWallet: process.env.ACP_AGENT_WALLET_ADDRESS_BUYER!
    }
  ];

  for (const agents of acpAgents) {
    if (!agents) continue; // Skip if token is undefined

    try {
      const acpPlugin = new AcpPlugin({
        apiKey: process.env.GAME_DEV_API_KEY!,
        acpTokenClient: await AcpToken.build(
          agents.privateKey as `0x${string}`,
          Number(agents.entityKey),
          agents.agentWallet as `0x${string}`,
          baseSepoliaConfig // or baseConfig based on your environment
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