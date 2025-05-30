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

async function test() {
    const acpPlugin = new AcpPlugin({
        apiKey: process.env.GAME_API_KEY ?? "",
        acpTokenClient: await AcpToken.build(
            `0x${process.env.WHITELISTED_WALLET_PRIVATE_KEY?.replace('0x', '') ?? ""}`,
            parseInt(process.env.SESSION_ENTITY_KEY_ID ?? ""),
            `0x${process.env.AGENT_WALLET_ADDRESS?.replace('0x', '') ?? ""}`,
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
          
              state: ${JSON.stringify(state)}
              
              job: ${JSON.stringify(job)}
              ============================
              `);
                
                if (!job) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Job ${args.jobId} is invalid. Should only respond to active as a seller job.`
                    );
                }
                
                const finalProduct = JSON.stringify(result.data);
                
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
        name: "angry cat v3",
        goal: `To provide top crypto projects as a service/product. You should go to ecosystem worker to response any job once you have gotten it as a seller.`,
        description: `You are angry cat, an agent that sells information on top crypto projects to invest in. You always give buyer the top crypto projects to invest in.
    
    ${acpPlugin.agentDescription}`,
        workers: [
            acpPlugin.getWorker({
                // restrict to just seller specified functions, add generateMeme to generate deliverable
                functions: [acpPlugin.respondJob, acpPlugin.deliverJob, getTopCryptoProjects],
            })
        ],
    });

    await sellerAgent.init();

    /// upon phase change, the seller agent will respond to the job
    acpPlugin.setOnPhaseChange(async (job) => {
        console.log("reacting to job", job);

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
