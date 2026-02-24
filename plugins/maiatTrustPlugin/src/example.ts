/**
 * @maiat/game-maiat-plugin — Example usage
 *
 * Before running:
 *   1. npm install
 *   2. Get a GAME API key from https://console.game.virtuals.io
 *   3. Set GAME_API_KEY in your environment (optional: MAIAT_API_KEY)
 */
import { GameAgent } from "@virtuals-protocol/game";
import MaiatTrustPlugin from "./maiatTrustPlugin";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // 1. Init plugin
  const maiatPlugin = new MaiatTrustPlugin({
    minScore: 3.0,      // reject anything below 3.0/10
    chain: "base",
    // apiKey: process.env.MAIAT_API_KEY,   // optional — for higher rate limits
  });

  // 2. Create worker
  const worker = maiatPlugin.getWorker();

  // 3. Attach to a GAME agent
  const agent = new GameAgent(process.env.GAME_API_KEY!, {
    name: "TrustGated Trading Agent",
    goal: "Execute token swaps only after verifying trust scores via Maiat Protocol. Reject any swap involving tokens with trust score below 3.0/10.",
    description: "A DeFi trading agent that uses Maiat trust scoring to avoid rugs and scams.",
    workers: [worker],
  });

  await agent.init();

  // 4. Run examples
  console.log("\n=== Example 1: Check trust score ===");
  await agent.step({ verbose: true });

  console.log("\n=== Example 2: Gate a swap ===");
  // The agent will call gate_swap before executing
  await agent.step({ verbose: true });
}

main().catch(console.error);
