import {
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
    GameAgent,
    GameFunction,
    GameWorker,
} from "@virtuals-protocol/game";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";
import AcpClient, {
  AcpContractClient,
  AcpJob,
  AcpJobPhases,
  baseAcpConfig
} from "@virtuals-protocol/acp-node";
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
        const apiUrl = `https://api.aixbt.tech/v1/projects?limit=20&page=${page}&excludeStables=true`;
        
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

// Function to clean up inventory data to reduce payload size
async function cleanupInventoryData(acpPlugin: any) {
    try {
        const state = await acpPlugin.getAcpState();
        const stateString = JSON.stringify(state);
        
        // If state is getting large (>200KB), clean up inventory data
        if (stateString.length > 200000) {
            console.log("State getting large, cleaning up inventory data...");
            
            // Keep only the 5 most recent produced items
            if (state.inventory?.produced && state.inventory.produced.length > 5) {
                console.log(`Cleaning up produced inventory: keeping only 5 most recent items (was ${state.inventory.produced.length})`);
                
                // Sort by jobId (assuming higher jobId = more recent) and keep only the 5 most recent
                const sortedProduced = state.inventory.produced.sort((a: any, b: any) => b.jobId - a.jobId);
                const recentProduced = sortedProduced.slice(0, 5);
                
                // Reset state with cleaned inventory
                const cleanedState = {
                    ...state,
                    inventory: {
                        ...state.inventory,
                        produced: recentProduced
                    }
                };
                
                // Reset the state with cleaned data
                await acpPlugin.resetState();
                
                // Restore the cleaned state
                for (const item of cleanedState.inventory.produced) {
                    try {
                        await acpPlugin.addProduceItem({
                            jobId: item.jobId,
                            type: item.type,
                            value: item.value,
                        });
                    } catch (error) {
                        console.log(`Skipping restore of produced item ${item.jobId}: ${error}`);
                    }
                }
                
                console.log("✅ Inventory cleanup completed");
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error cleaning up inventory data:", error);
        return false;
    }
}

// Function to aggressively clean up state to prevent 524 timeouts
async function aggressiveStateCleanup(acpPlugin: any) {
    try {
        const state = await acpPlugin.getAcpState();
        const stateString = JSON.stringify(state);
        
        console.log(`Current state size: ${(stateString.length / 1024).toFixed(2)}KB`);
        
        // If state is very large (>300KB), do aggressive cleanup
        if (stateString.length > 300000) {
            console.log("⚠️  State very large, performing aggressive cleanup...");
            
            // Keep only the 3 most recent completed jobs
            if (state.jobs?.completed && state.jobs.completed.length > 3) {
                console.log(`Cleaning up completed jobs: keeping only 3 most recent (was ${state.jobs.completed.length})`);
                const sortedCompleted = state.jobs.completed.sort((a: any, b: any) => b.jobId - a.jobId);
                state.jobs.completed = sortedCompleted.slice(0, 3);
            }
            
            // Keep only the 3 most recent produced items
            if (state.inventory?.produced && state.inventory.produced.length > 3) {
                console.log(`Cleaning up produced inventory: keeping only 3 most recent (was ${state.inventory.produced.length})`);
                const sortedProduced = state.inventory.produced.sort((a: any, b: any) => b.jobId - a.jobId);
                state.inventory.produced = sortedProduced.slice(0, 3);
            }
            
            // Reset and restore cleaned state
            await acpPlugin.resetState();
            
            // Restore cleaned state
            for (const item of state.inventory.produced) {
                try {
                    await acpPlugin.addProduceItem({
                        jobId: item.jobId,
                        type: item.type,
                        value: item.value,
                    });
                } catch (error) {
                    console.log(`Skipping restore of produced item ${item.jobId}: ${error}`);
                }
            }
            
            console.log("✅ Aggressive cleanup completed");
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error in aggressive state cleanup:", error);
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
        acpClient: new AcpClient({
          acpContractClient: await AcpContractClient.build(
            `0x${process.env.WHITELISTED_WALLET_PRIVATE_KEY!.replace('0x', '')}`,
            parseInt(process.env.SESSION_ENTITY_KEY_ID!),
            `0x${process.env.AGENT_WALLET_ADDRESS!.replace('0x', '')}`,
          ),
          onNewTask: async (job: AcpJob) => {
            console.log("reacting to job", job);

            // Clean up completed jobs and keep only the 3 newest ones
            // await deleteCompletedJobsKeepNewest(acpPlugin, 3);
            
            // Clean up inventory data to prevent large payloads
            await cleanupInventoryData(acpPlugin);
            
            // Aggressive cleanup if state is very large
            await aggressiveStateCleanup(acpPlugin);
            
            // Safely reset state if it's very large and no active jobs exist
            await safeResetStateIfNeeded(acpPlugin);
    
            let prompt = "";
    
            if (job.phase === AcpJobPhases.REQUEST) {
                prompt = `
          Respond to the following transaction:
          ${JSON.stringify(job)}
    
          decide to wheater you should accept the job or not.
          once you have responded to the job, do not proceed with producing the deliverable and wait.
          `;
            } else if (job.phase === AcpJobPhases.TRANSACTION) {
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
          },
        }),
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
                    // Return minimal data to prevent 413 error and 524 timeouts
                    const fullState = await acpPlugin.getAcpState();
                    
                    // Only include the most recent active seller job
                    const recentJobs = fullState.jobs?.active?.asASeller || [];
                    const mostRecentJob = recentJobs.length > 0 ? recentJobs[recentJobs.length - 1] : null;
                    
                    return {
                        jobs: {
                            active: {
                                asASeller: mostRecentJob ? [mostRecentJob] : []
                            }
                        }
                        // No inventory at all to prevent large payloads
                    };
                }
            })
        ]
    });

    await sellerAgent.init();

    // Clean up completed jobs and keep only the 3 newest ones BEFORE setting up phase change
    // await deleteCompletedJobsKeepNewest(acpPlugin, 3);
    
    // Clean up inventory data to prevent large payloads
    await cleanupInventoryData(acpPlugin);
    
    // Aggressive cleanup if state is very large
    await aggressiveStateCleanup(acpPlugin);
    
    // Safely reset state if it's very large and no active jobs exist
    await safeResetStateIfNeeded(acpPlugin);

    // Set up periodic cleanup every 5 minutes to prevent state bloat
    setInterval(async () => {
        try {
            console.log("🔄 Running periodic state cleanup...");
            await cleanupInventoryData(acpPlugin);
            await aggressiveStateCleanup(acpPlugin);
        } catch (error) {
            console.error("Error in periodic cleanup:", error);
        }
    }, 5 * 60 * 1000); // 5 minutes

    /// upon phase change, the seller agent will respond to the job
    // acpPlugin.setOnPhaseChange(async (job) => {
    //     console.log("reacting to job", job);

    //     // Clean up completed jobs and keep only the 3 newest ones
    //     await deleteCompletedJobsKeepNewest(acpPlugin, 3);
        
    //     // Safely reset state if it's very large and no active jobs exist
    //     await safeResetStateIfNeeded(acpPlugin);

    //     let prompt = "";

    //     if (job.phase === AcpJobPhases.REQUEST) {
    //         prompt = `
    //   Respond to the following transaction:
    //   ${JSON.stringify(job)}

    //   decide to wheater you should accept the job or not.
    //   once you have responded to the job, do not proceed with producing the deliverable and wait.
    //   `;
    //     } else if (job.phase === AcpJobPhases.TRANSACTION) {
    //         prompt = `
    //   Respond to the following transaction.
    //   ${JSON.stringify(job)}

    //   you should produce the deliverable and deliver it to the buyer.
    //   `;
    //     }

    //     await sellerAgent.getWorkerById("acp_worker").runTask(prompt, {
    //         verbose: true,
    //     });

    //     console.log("reacting to job done");
    // });
    /// end of seller reactive agent
    console.log("Listerning");

    // NOTE: this agent only listen to the job and respond to it.
}

test();
