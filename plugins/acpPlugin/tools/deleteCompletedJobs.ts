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
    
    // Display options to the user
    console.log("\nOptions:");
    console.log("1. Delete a specific job");
    console.log("2. Delete ALL completed jobs");
    console.log("3. Keep N newest jobs and delete the rest\n");

    // Prompt user for choice
    rl.question('Enter your choice (1-3): ', async (choice) => {
      switch (choice) {
        case "1":
          // Option 1: Delete specific job
          rl.question('Enter the job ID you want to delete: ', async (jobId) => {
            await acpPlugin.deleteCompletedJob(jobId);
            console.log(`Job ID ${jobId} has been deleted.`);
            console.log(`Operation completed for entity key: ${entityKey}`);
            rl.close();
            process.exit(0);
          });
          break;
          
        case "2":
          // Option 2: Delete all jobs
          rl.question('Are you sure you want to delete ALL completed jobs? (y/n): ', async (confirm) => {
            if (confirm.toLowerCase() === 'y') {
              for (const job of state.jobs?.completed || []) {
                await acpPlugin.deleteCompletedJob(job.jobId.toString());
              }
              console.log("All completed jobs have been deleted.");
            } else {
              console.log("Operation cancelled.");
            }
            console.log(`Operation completed for entity key: ${entityKey}`);
            rl.close();
            process.exit(0);
          });
          break;
          
        case "3":
          // Option 3: Keep N newest jobs
          rl.question('How many newest jobs do you want to keep? ', async (numStr) => {
            const keepCount = parseInt(numStr);
            if (isNaN(keepCount) || keepCount < 0) {
              console.log("Invalid number. Please enter a positive number.");
            } else {
              // Sort jobs by lastUpdated (newest first)
              const sortedJobs = [...(state.jobs?.completed || [])].sort((a, b) => 
                (b.lastUpdated || 0) - (a.lastUpdated || 0)
              );
              
              // Keep the newest N jobs, delete the rest
              const jobsToDelete = sortedJobs.slice(keepCount);
              console.log(`Keeping the ${keepCount} newest jobs, deleting ${jobsToDelete.length} older jobs.`);
              
              for (const job of jobsToDelete) {
                await acpPlugin.deleteCompletedJob(job.jobId.toString());
              }
            }
            console.log(`Operation completed for entity key: ${entityKey}`);
            rl.close();
            process.exit(0);
          });
          break;
          
        default:
          console.log("Invalid choice. Please run the script again and select a valid option (1-3).");
          rl.close();
          process.exit(1);
      }
    });
  } catch (error) {
    console.error(`Failed to delete completed job: ${error}`);
    process.exit(1);
  }
}

// Run the function
deleteCompletedJob();
