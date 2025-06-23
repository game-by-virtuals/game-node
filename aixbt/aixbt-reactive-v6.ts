import {
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
    GameAgent,
    GameFunction,
    GameWorker,
} from "@virtuals-protocol/game";
import AcpPlugin, { AcpToken, AcpJobPhasesDesc, baseConfig } from "@virtuals-protocol/game-acp-plugin"
import dotenv from "dotenv";

dotenv.config();

const originalLog = console.log;

console.log = function (message: any) {
    if (typeof message === 'string') {
        // Handle State logs
        if (message.includes('State:')) {
            const label = message.split(':')[0];
            try {
                const jsonStr = message.substring(message.indexOf(':') + 1);
                const data = JSON.parse(jsonStr);

                console.log(`\n${label}:`);
                console.log('-'.repeat(50));
                console.dir(data, {
                    depth: null,
                    colors: true,
                    compact: false,
                    sorted: true
                });
            } catch (e) {
                originalLog.call(console, message);
            }
            // Handle function status logs
        } else if (message.includes('Function status')) {
            console.log('\nFunction Status:');
            console.log('-'.repeat(50));
            try {
                const jsonStr = message.substring(message.indexOf(']:') + 2);
                const data = JSON.parse(jsonStr);
                console.dir(data, { depth: null, colors: true, compact: false, sorted: true });
            } catch (e) {
                originalLog.call(console, message);
            }
        } else {
            originalLog.call(console, ...Array.from(arguments));
        }
    } else {
        originalLog.call(console, ...Array.from(arguments));
    }
};

async function fetchProjectsWithNonEmptyFields(limit = 3, chainFilter?: string) {
    let allProjects: any[] = [];
    let page = 1;
    let foundEnough = false;
    const maxAttempts = 5; // Limit how many pages we'll try
    
    while (!foundEnough && page <= maxAttempts) {
        // Fetch a batch of projects (20 per page)
        const apiUrl = `https://api.aixbt.tech/v1/projects?limit=20&page=${page}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'x-api-key': process.env.AIXBT_API_KEY || '',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch crypto projects');
        }
        
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            break; // No more data available
        }
        
        // Filter for non-empty tokens and tickers
        const validProjects = data.data.filter((item: any) => {
            // Check if tokens exist and have at least one valid key-value pair
            const hasValidTokens = item.tokens && 
                Object.entries(item.tokens).some(([key, value]) => 
                    key.trim() !== '' && 
                    value !== null && 
                    value !== undefined && 
                    String(value).trim() !== ''
                );
            
            // Check if ticker exists and is not empty
            const hasValidTicker = item.ticker && item.ticker.trim() !== '';
            
            return hasValidTokens && hasValidTicker;
        });
        
        // Add to our collection
        allProjects = [...allProjects, ...validProjects];
        
        // Check if we have enough
        if (allProjects.length >= limit) {
            foundEnough = true;
        } else {
            page++;
        }
    }
    
    // Sort by score and take the requested number
    const topProjects = allProjects
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    
    // If we still don't have enough projects with non-empty fields,
    // return empty array
    if (topProjects.length === 0) {
        return {
            status: 200,
            error: "No alpha",
            data: []
        };
    }
    
    return {
        status: 200,
        error: "",
        data: topProjects
    };
}

// Function to delete completed jobs and keep only the 3 newest ones
async function deleteCompletedJobsKeepNewest(acpPlugin: any, keepCount: number = 3) {
    try {
        const state = await acpPlugin.getAcpState();
        const completedJobs = state.jobs?.completed || [];
        
        if (completedJobs.length <= keepCount) {
            console.log(`Only ${completedJobs.length} completed jobs found, no deletion needed.`);
            return;
        }
        
        // Sort jobs by lastUpdated (newest first)
        const sortedJobs = [...completedJobs].sort((a, b) => 
            (b.lastUpdated || 0) - (a.lastUpdated || 0)
        );
        
        // Keep the newest N jobs, delete the rest
        const jobsToDelete = sortedJobs.slice(keepCount);
        console.log(`Keeping the ${keepCount} newest jobs, deleting ${jobsToDelete.length} older jobs.`);
        
        for (const job of jobsToDelete) {
            await acpPlugin.deleteCompletedJob(job.jobId.toString());
            console.log(`Deleted job ID: ${job.jobId}`);
        }
        
        console.log(`Completed job cleanup: deleted ${jobsToDelete.length} old jobs, kept ${keepCount} newest.`);
    } catch (error) {
        console.error("Error deleting completed jobs:", error);
    }
}

// Function to safely reset state only when appropriate
async function safeResetStateIfNeeded(acpPlugin: any) {
    try {
        const state = await acpPlugin.getAcpState();
        const stateString = JSON.stringify(state);
        
        // Only reset if state is very large (>100KB) and we're safe to do so
        if (stateString.length > 100000) {
            console.log("State very large, checking if safe to reset...");
            
            // Check if there are any active buyer jobs that we shouldn't delete
            const activeBuyerJobs = state.jobs?.active?.asABuyer || [];
            const activeSellerJobs = state.jobs?.active?.asASeller || [];
            
            if (activeBuyerJobs.length > 0) {
                console.log(`⚠️  Cannot reset state: ${activeBuyerJobs.length} active buyer jobs found. Skipping reset to protect buyer jobs.`);
                return false;
            }
            
            if (activeSellerJobs.length > 0) {
                console.log(`⚠️  Cannot reset state: ${activeSellerJobs.length} active seller jobs found. Skipping reset to protect seller jobs.`);
                return false;
            }
            
            // Only reset if no active jobs exist
            console.log("✅ Safe to reset state - no active jobs found. Resetting...");
            await acpPlugin.resetState();
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking if safe to reset state:", error);
        return false;
    }
}

async function test() {
    // Validate required environment variables
    const requiredEnvVars = {
        GAME_API_KEY: process.env.GAME_API_KEY,
        WHITELISTED_WALLET_PRIVATE_KEY: process.env.WHITELISTED_WALLET_PRIVATE_KEY,
        SESSION_ENTITY_KEY_ID: process.env.SESSION_ENTITY_KEY_ID,
        AGENT_WALLET_ADDRESS: process.env.AGENT_WALLET_ADDRESS
    };

    const missingVars = Object.entries(requiredEnvVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        console.error('Please create a .env file with these variables or set them in your environment.');
        process.exit(1);
    }

    // Validate private key format
    const privateKey = process.env.WHITELISTED_WALLET_PRIVATE_KEY!;
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        console.error('Invalid private key format. Expected 0x followed by 64 hex characters.');
        console.error(`Current length: ${privateKey.length}, starts with 0x: ${privateKey.startsWith('0x')}`);
        process.exit(1);
    }

    console.log('Environment variables loaded successfully');
    console.log(`Private key length: ${privateKey.length}`);
    console.log(`Session entity key ID: ${process.env.SESSION_ENTITY_KEY_ID}`);
    console.log(`Agent wallet address: ${process.env.AGENT_WALLET_ADDRESS}`);

    const acpPlugin = new AcpPlugin({
        apiKey: process.env.GAME_API_KEY!,
        acpTokenClient: await AcpToken.build(
            `0x${process.env.WHITELISTED_WALLET_PRIVATE_KEY!.replace('0x', '')}`,
            parseInt(process.env.SESSION_ENTITY_KEY_ID!),
            `0x${process.env.AGENT_WALLET_ADDRESS!.replace('0x', '')}`,
            baseConfig
        ),
    });

    //function version to test
    const getTopCryptoProjects = new GameFunction({
        name: "get_top_crypto_projects",
        description: "a function to get and return top crypto projects in the market. Use this when producing service ",
        args: [
            {
                name: "description",
                type: "string",
                description: "A description of the top crypto projects",
            },
            {
                name: "jobId",
                type: "string",
                description: "Job that your are responding to.",
                hint: "look into jobId field in the state to find the job you are responding to"
            },
            {
                name: "reasoning",
                type: "string",
                description: "The reasoning of the tweet",
            }
        ] as const,
        executable: async (args) => {

            try {
                // Use the fetchProjectsWithNonEmptyFields function instead of direct API call
                const result = await fetchProjectsWithNonEmptyFields(3);
                
                if (result.status !== 200) {
                    throw new Error(`Failed to fetch crypto projects: ${result.error}`);
                }
                
                // deliver job 
                const state = await acpPlugin.getAcpState();
                
                const job = state.jobs.active.asASeller.find(
                    (j) => j.jobId === +args.jobId!
                );
                
                console.log(`
              ============================
              data: ${JSON.stringify(result)}
              
              job: ${JSON.stringify(job)}
              ============================
              `);
                
                if (!job) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Job ${args.jobId} is invalid. Should only respond to active as a seller job.`
                    );
                }
                
                // Format the data as a clean string without double stringification
                const finalProduct = JSON.stringify(result.data, null, 2);
                
                try {
                    acpPlugin.addProduceItem({
                        jobId: +args.jobId!,
                        type: "text",
                        value: finalProduct,
                    });
                    console.log("finalProduct: ", finalProduct)
                    console.log(`Successfully produced item for job ${args.jobId}`);
                } catch (error) {
                    console.error(`Failed to produce item for job ${args.jobId}:`, error);
                    throw error;  // or handle the error appropriately
                }
                
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    JSON.stringify(result)
                );
            }  catch (error) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Error fetching top crypto projects: ${error}`
                );
            }

        }
    })

    /// start a new seller agent to handle respond and deliver job
    const sellerAgent = new GameAgent(process.env.GAME_API_KEY || "", {
        name: "aixbt",
        goal: `To provide top crypto projects as a service/product. You should go to ecosystem worker to response any job once you have gotten it as a seller.`,
        description: `You are aixbt, an agent that sells information on top crypto projects to invest in. You always give buyer the top crypto projects to invest in.
    
    ${acpPlugin.agentDescription}`,
        workers: [
            acpPlugin.getWorker({
                // restrict to just seller specified functions, add generateMeme to generate deliverable
                functions: [acpPlugin.respondJob, acpPlugin.deliverJob, getTopCryptoProjects],
                getEnvironment: async () => {
                    // Return only essential environment data, not the full inventory
                    const fullState = await acpPlugin.getAcpState();
                    return {
                        jobs: {
                            active: {
                                asASeller: fullState.jobs.active.asASeller.slice(-3) // Only the 3 most recent jobs
                            }
                        },
                        inventory: {
                            produced: fullState.inventory?.produced?.slice(-1) || [] // Only the 1 most recent produced items
                        }
                    };
                }
            })
        ],
    });

    await sellerAgent.init();

    /// upon phase change, the seller agent will respond to the job
    acpPlugin.setOnPhaseChange(async (job) => {
        console.log("reacting to job", job);

        // Clean up completed jobs and keep only the 3 newest ones
        await deleteCompletedJobsKeepNewest(acpPlugin, 3);
        
        // Safely reset state if it's very large and no active jobs exist
        await safeResetStateIfNeeded(acpPlugin);

        let prompt = "";

        if (job.phase === AcpJobPhasesDesc.REQUEST) {
            prompt = `
      Respond to the following transaction:
      ${JSON.stringify(job)}

      decide to wheater you should accept the job or not.
      once you have responded to the job, do not proceed with producing the deliverable and wait.
      `;
        } else if (job.phase === AcpJobPhasesDesc.TRANSACTION) {
            prompt = `
      Respond to the following transaction.
      ${JSON.stringify(job)}

      you should produce the deliverable and deliver it to the buyer.
      `;
        }

        await sellerAgent.getWorkerById("acp_worker").runTask(prompt, {
            verbose: true,
        });

        console.log("reacting to job done");
    });
    /// end of seller reactive agent
    console.log("Listerning");

    // NOTE: this agent only listen to the job and respond to it.
}

test();
