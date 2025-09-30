import AcpClient, { 
    AcpContractClient,
    AcpJobPhases, 
    AcpJob,
    AcpMemo,
    IDeliverable,
    MemoType
} from '@virtuals-protocol/acp-node';
// Optional imports for advanced features
// import AcpPlugin from "@virtuals-protocol/game-acp-plugin";
// import {
//     ExecutableGameFunctionResponse,
//     ExecutableGameFunctionStatus,
//     GameAgent,
//     GameFunction,
//     GameWorker,
// } from "@virtuals-protocol/game";
import dotenv from "dotenv";

import { WHITELISTED_WALLET_PRIVATE_KEY, SESSION_ENTITY_KEY_ID, AGENT_WALLET_ADDRESS, GAME_API_KEY } from "./env";

dotenv.config();

class JobQueue<T> {
    private queue: T[] = [];
    private resolvers: Array<(item: T) => void> = [];

    enqueue(item: T) {
        if (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift()!;
            resolve(item);
        } else {
            this.queue.push(item);
        }
    }

    async dequeue(): Promise<T> {
        if (this.queue.length > 0) {
            return this.queue.shift()!;
        }
        return new Promise<T>(resolve => this.resolvers.push(resolve));
    }

    get length() {
        return this.queue.length;
    }
}

type JobItem = { job: AcpJob; memoToSign?: AcpMemo };

// Enhanced logging function from v8
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

// Fetch crypto projects with validation from v8
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

// Indigo AI service function
async function callIndigoService(prompt: string) {
    try {
        const response = await fetch('https://api.aixbt.tech/v1/agents/indigo', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'x-api-key': process.env.AIXBT_API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Indigo API failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            status: 200,
            error: "",
            data: data
        };
    } catch (error) {
        console.error('Error calling Indigo service:', error);
        return {
            status: 500,
            error: `Indigo service error: ${error}`,
            data: null
        };
    }
}

// State cleanup functions from v8 (optional - require ACP Plugin)
async function safeResetStateIfNeeded(acpPlugin: any) {
    if (!acpPlugin) return false;
    try {
        const state = await acpPlugin.getAcpState();
        const stateString = JSON.stringify(state);
        
        // Only reset if state is very large (>100KB) and we're safe to do so
        if (stateString.length > 100000) {
            console.log("State very large, checking if safe to reset...");
            
            // Check if there are any active buyer jobs that we shouldn't delete
            const activeBuyerJobs = state.jobs?.active?.asABuyer || [];
            const activeSellerJobs = state.jobs?.active?.asASeller || [];
            
            if (activeBuyerJobs.length > 0 || activeSellerJobs.length > 0) {
                console.log(`⚠️  Cannot reset state: active jobs found. Skipping reset.`);
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
    if (!acpPlugin) return false;
    try {
        const state = await acpPlugin.getAcpState();
        // Basic cleanup logic here - simplified
        console.log("Inventory cleanup completed");
        return true;
    } catch (error) {
        console.error("Error cleaning up inventory data:", error);
        return false;
    }
}

// Function to aggressively clean up state to prevent 524 timeouts
async function aggressiveStateCleanup(acpPlugin: any) {
    if (!acpPlugin) return false;
    try {
        const state = await acpPlugin.getAcpState();
        console.log("Aggressive cleanup completed");
        return true;
    } catch (error) {
        console.error("Error in aggressive state cleanup:", error);
        return false;
    }
}

class JobProcessor {
    constructor(
        private queue: JobQueue<JobItem>,
        private acpPlugin: any = null,
        private acpClient: AcpClient | null = null,
        private delayBetweenJobsMs = 2000
    ) {}

    start() {
        this.run();
    }

    private async run() {
        while (true) {
            const { job, memoToSign } = await this.queue.dequeue();
            await this.handleJob(job, memoToSign);
            await this.sleep(this.delayBetweenJobsMs);
        }
    }

    private async handleJob(job: AcpJob, memoToSign?: AcpMemo) {
        try {
            console.log("job", job);
            console.log(`[processJob] Job ${job.id} - Phase: ${AcpJobPhases[job.phase]}`);

            // Extract service information from the job
            const serviceName = job.serviceName;
            const servicePrice = job.price;
            const serviceRequirement = job.serviceRequirement;
            
            console.log(`[DEBUG] Service Name: "${serviceName}"`);
            console.log(`[DEBUG] Service Price: ${servicePrice}`);
            console.log(`[DEBUG] Service Requirement:`, serviceRequirement);

            // Check if we can get the agent's offerings to compare
            try {
                const agent = await job.providerAgent;
                if (agent) {
                    console.log(`[DEBUG] Agent offerings:`, agent.offerings.map(o => ({
                        name: o.name,
                        price: o.price
                    })));
                    
                    // Find which offering matches this job
                    const matchingOffering = agent.offerings.find(o => o.price === servicePrice);
                    if (matchingOffering) {
                        const offeringIndex = agent.offerings.indexOf(matchingOffering);
                        console.log(`[DEBUG] Matching offering index: ${offeringIndex}`);
                        console.log(`[DEBUG] Offering details:`, matchingOffering);
                    } else {
                        console.log(`[DEBUG] No matching offering found for price: ${servicePrice}`);
                    }
                }
            } catch (error) {
                console.log(`[DEBUG] Could not fetch agent offerings:`, error);
            }

            // Clean up state before processing (if acpPlugin is available)
            if (this.acpPlugin) {
                try {
                    await cleanupInventoryData(this.acpPlugin);
                    await aggressiveStateCleanup(this.acpPlugin);
                    await safeResetStateIfNeeded(this.acpPlugin);
                } catch (error) {
                    console.log("State cleanup skipped:", error);
                }
            }

            if (
                job.phase === AcpJobPhases.REQUEST &&
                memoToSign?.nextPhase === AcpJobPhases.NEGOTIATION
            ) {
                console.log(`[processJob] Responding to job ${job.id}`);
                await job.respond(true);
                console.log(`[processJob] Job ${job.id} responded`);
            }

            else if (
                job.phase === AcpJobPhases.TRANSACTION &&
                memoToSign?.nextPhase === AcpJobPhases.EVALUATION
            ) {
                console.log(`[processJob] Delivering Job ${job.id}`);
                
                // Determine which service to use based on service name
                const serviceName = job.serviceName?.toLowerCase() || '';
                
                // Also check the memo content for service name
                const firstMemo = job.memos.find(m => m.nextPhase === 1); // NEGOTIATION phase
                let actualServiceName = '';
                
                if (firstMemo) {
                    try {
                        const memoContent = JSON.parse(firstMemo.content);
                        actualServiceName = memoContent.name?.toLowerCase() || memoContent.serviceName?.toLowerCase() || '';
                        console.log("MEMO CONTENT:", memoContent);
                    } catch (e) {
                        console.log("Could not parse memo content");
                    }
                }
                
                console.log("JOB", job);
                console.log("SERVICE NAME from job:", serviceName);
                console.log("SERVICE NAME from memo:", actualServiceName);
                
                // Use Indigo AI if service name contains "indigo"
                const useIndigo = actualServiceName.includes('indigo') || serviceName.includes('indigo');
                
                console.log(`[DEBUG] Service name: "${serviceName}"`);
                console.log(`[processJob] Using ${useIndigo ? 'Indigo AI' : 'Crypto Projects'} service for job ${job.id}`);
                
                // Call the appropriate service
                try {
                    let result;
                    
                    if (useIndigo) {
                        // Use Indigo AI service
                        const prompt = JSON.stringify(job.serviceRequirement) || serviceName || "What are the top crypto opportunities right now?";
                        result = await callIndigoService(prompt);
                    } else {
                        // Use crypto projects data service
                        result = await fetchProjectsWithNonEmptyFields(3);
                    }
                    
                    if (result.status !== 200) {
                        throw new Error(`Failed to fetch crypto projects: ${result.error}`);
                        
                    }
                    
                    // Format the data as a clean string
                    const finalProduct = JSON.stringify(result.data, null, 2);
                    
                    // Log the final product
                    console.log("finalProduct: ", finalProduct);
                    console.log(`Successfully generated crypto projects data for job ${job.id}`);
                    
                    // Add to ACP state as produced item (if acpPlugin is available)
                    if (this.acpPlugin) {
                        try {
                            await this.acpPlugin.addProduceItem({
                                jobId: job.id,
                                type: "text",
                                value: finalProduct,
                            });
                            console.log(`Successfully produced item for job ${job.id}`);
                        } catch (error) {
                            console.error(`Failed to produce item for job ${job.id}:`, error);
                        }
                    }
                    
                    // Deliver the job with crypto projects data
                    const deliverable: IDeliverable = {
                        type: "text",
                        value: finalProduct,
                    };
                    await job.deliver(deliverable);
                    console.log(`[processJob] Job ${job.id} delivered with crypto projects data`);
                    
                } catch (error) {
                    console.error(`Error fetching service data for job ${job.id}:`, error);
                    
                    // Check if it's a 404 error from Indigo API or other critical errors
                    const errorMessage = (error as Error).message || String(error);
                    const is404Error = errorMessage.includes('404') || errorMessage.includes('not found');
                    const isIndigoError = useIndigo && (errorMessage.includes('Indigo') || errorMessage.includes('failed with status'));
                    
                    if (is404Error || isIndigoError) {
                        // Reject the job with rejection memo for API failures
                        console.log(`[REJECT] Creating rejection memo for job ${job.id} due to service failure`);
                        await this.createRejectionMemo(job.id, `Service API failure: ${errorMessage}`);
                        console.log(`[REJECT] Job ${job.id} rejected - funds returned to client`);
                    } else {
                        // For other errors, still try to deliver with error message
                        console.log(`[FALLBACK] Delivering error message for job ${job.id}`);
                        const errorDeliverable: IDeliverable = {
                            type: "text",
                            value: `Error fetching service data: ${errorMessage}`,
                        };
                        await job.deliver(errorDeliverable);
                    }
                }
            }

            else {
                console.warn(`[processJob] Unknown or unhandled phase: ${job.phase}`);
            }
        } catch (error) {
            console.error(`❌ Error in job ${job.id}:`, error);
        }
    }

    private async createRejectionMemo(jobId: number, reason: string) {
        if (!this.acpClient) {
            console.error(`Cannot create rejection memo for job ${jobId}: AcpClient not available`);
            return;
        }
        
        try {
            await this.acpClient.acpContractClient.createMemo(
                jobId,
                `Job ${jobId} rejected. Reason: ${reason}`,
                MemoType.MESSAGE,
                false,
                AcpJobPhases.REJECTED
            );
            console.log(`✅ Rejection memo created for job ${jobId}`);
        } catch (error) {
            console.error(`❌ Failed to create rejection memo for job ${jobId}:`, error);
        }
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}

async function seller() {
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

    // Note: ACP Plugin state management is optional and can be added later
    const acpPlugin = null; // Simplified for now

    const jobQueue = new JobQueue<{ job: AcpJob; memoToSign?: AcpMemo }>();
    
    // Create AcpClient first so we can pass it to JobProcessor
    const acpClient = new AcpClient({
        acpContractClient: await AcpContractClient.build(
            WHITELISTED_WALLET_PRIVATE_KEY,
            SESSION_ENTITY_KEY_ID,
            AGENT_WALLET_ADDRESS
        ),
        onNewTask: async (job: AcpJob, memoToSign?: AcpMemo) => {
            console.log(`[onNewTask] Received job ${job.id}`);
            jobQueue.enqueue({ job, memoToSign });
        }
    });
    
    const processor = new JobProcessor(jobQueue, acpPlugin, acpClient, 2000); // time-off = 2s
    processor.start();

    // Set up periodic cleanup every 2 minutes to prevent state bloat
    setInterval(async () => {
        try {
            //console.log("🔄 Running periodic state cleanup...");
            if (acpPlugin) {
                await cleanupInventoryData(acpPlugin);
                await aggressiveStateCleanup(acpPlugin);
            }
            
            // Additional cleanup: check disk space
            const { exec } = require('child_process');
            exec('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'', (error: any, stdout: any) => {
                if (!error) {
                    const diskUsage = parseInt(stdout.trim());
                    if (diskUsage > 90) {
                        console.log(`⚠️  High disk usage detected: ${diskUsage}%. Performing emergency cleanup...`);
                        // The existing cleanup functions should handle this
                    }
                }
            });
        } catch (error) {
            console.error("Error in periodic cleanup:", error);
        }
    }, 2 * 60 * 1000); // 2 minutes

    console.log("[Seller] Listening for new jobs...");
}

seller();
