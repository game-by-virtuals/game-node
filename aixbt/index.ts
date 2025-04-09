import  aixbtAgent  from './agent';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        // Initialize the agent
        const agent = await aixbtAgent();
        await agent.init();

        // Run the agent
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second pause
            await agent.step({ verbose: true });
        }
    } catch (error) {
        console.error("Error running agent:", error);
    }
}

main(); 