import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import { baseSepolia } from "viem/chains";

async function resetAcpStates(): Promise<void> {
  // Reset plugin state for all configured ACP tokens
  const acpTokens: (string | undefined)[] = [
    "<Buyer_token>",
    "<Seller_token>"
  ];

  for (const token of acpTokens) {
    if (!token) continue; // Skip if token is undefined

    try {
      const acpPlugin = new AcpPlugin({
        apiKey: "<Game_DEV_API_KEY>",
        acpTokenClient: new AcpToken(
          token as `0x${string}`,
          baseSepolia
        )
      });

      await acpPlugin.resetState();
      console.log(`Successfully reset state for token: ${token}`);
    } catch (e) {
      console.log(`Failed to reset state for token ${token}: ${e}`);
    }
  }
}

resetAcpStates();