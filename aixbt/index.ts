import  aixbtAgent  from './agent';
import dotenv from 'dotenv';
dotenv.config();
import * as readline from "readline";

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    return new Promise((resolve) =>
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
      })
    );
  }
  

async function main() {
    try {
        // Initialize the agent
        const agent = await aixbtAgent();
        await agent.init();

        // Run the agent
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second pause
            await agent.step({ verbose: true });
            await askQuestion("\nPress any key to continue...\n");
        }
    } catch (error) {
        console.error("Error running agent:", error);
    }
}

main(); 