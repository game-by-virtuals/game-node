// import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { baseSepolia } from "viem/chains";
import AcpPlugin from "../src/acpPlugin";
import { AcpToken } from "../src/acpToken";
// Load environment variables
dotenv.config();

/**
 * Delete completed job for all configured ACP tokens.
 */
async function deleteCompletedJob(): Promise<void> {
  try {
    const privateKey = process.env.WHITELISTED_WALLET_PRIVATE_KEY as `0x${string}`;
    const entityKey = Number(process.env.SESSION_ENTITY_KEY_ID);
    const agentWallet = process.env.AGENT_WALLET_ADDRESS as `0x${string}`;
    
    console.log(`Deleting completed job for entity key: ${entityKey}, wallet address: ${agentWallet}`);
    
    const acpPlugin = new AcpPlugin({
      apiKey: process.env.GAME_DEV_API_KEY || '',
      acpTokenClient: await AcpToken.build(
        privateKey,
        entityKey,
        agentWallet
      )
    });
    
    const state = await acpPlugin.getAcpState();
    console.log("Completed jobs:");
    state.jobs?.completed.forEach((job: any) => {
      console.log(`ID: ${job.jobId} - Description: ${job.desc.substring(0, 50)}... - Price: ${job.price}`);
    });
    
    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Prompt user for job ID
    rl.question('Enter the job ID you want to delete or "all" to delete all: ', async (jobId) => {
      if (jobId === "all") {
        state.jobs?.completed.forEach(async (job: any) => {
          await acpPlugin.deleteCompletedJob(job.jobId);
        });
      } else {
        await acpPlugin.deleteCompletedJob(jobId);
      }
      console.log(`Successfully deleted completed job for entity key: ${entityKey}`);
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error(`Failed to delete completed job: ${error}`);
    process.exit(1);
  }
}

// Run the function
deleteCompletedJob();
