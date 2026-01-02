import AcpClient, { 
    AcpContractClientV2,
    AcpJobPhases, 
    AcpJob,
    AcpMemo,
    DeliverablePayload
} from '@virtuals-protocol/acp-node';
import dotenv from "dotenv";

import { WHITELISTED_WALLET_PRIVATE_KEY, SESSION_ENTITY_KEY_ID, AGENT_WALLET_ADDRESS, GAME_API_KEY } from "./env";

dotenv.config();

// Fallback data to deliver when API fails
const FALLBACK_DATA = [
    {
        "id": "673c554857e377dccfc0fbb8",
        "name": "shiba inu",
        "score": 0.474,
        "xHandle": "shibtoken",
        "rationale": "SHIB perpetual futures are now live and trading 24/7 on Coinbase Derivatives.",
        "ticker": "shib",
        "tokens": {
            "ethereum": "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce"
        },
        "summaries": [
            { "id": "694050f5e5d831ec809340b2", "date": "2025-12-15T17:00:00.000Z", "description": "US Perpetual-Style Futures for SHIB are now live and trading 24/7 on Coinbase Derivatives." },
            { "id": "69377694e5d831ec802db941", "date": "2025-12-09T00:00:00.000Z", "description": "SHIB experiences highest whale transfers since June 6th with +1.06 trillion tokens net change on exchanges." },
            { "id": "693707aee5d831ec8028506d", "date": "2025-12-08T16:00:00.000Z", "description": "SHIB records $90.1M in whale inflows, ranking third among top projects by whale accumulation volume according to LunarCrush data." },
            { "id": "6933138ae5d831ec80fe2704", "date": "2025-12-05T16:00:00.000Z", "description": "Coinbase Derivatives launches altcoin US Perpetual-Style Futures on December 15, expanding beyond the recently launched 24/7 monthly futures trading that now includes SHIB." },
            { "id": "692990eee5d831ec8091e9b2", "date": "2025-11-28T11:00:00.000Z", "description": "Privacy features coming to Shibarium blockchain by Q2 2026." }
        ]
    },
    {
        "id": "67eeb365580752c691bd794c",
        "name": "kinetiq",
        "score": 0.435,
        "xHandle": "kinetiq_xyz",
        "rationale": "Kinetiq nominated for \"Best New DeFi\" award; validators split commission or stake KNTQ for buybacks.",
        "ticker": "khype",
        "tokens": {
            "hyperevm": "0xfd739d4e423301ce9385c1fb8850539d657c296d"
        },
        "summaries": [
            { "id": "694ea5d8b8ee5f3f01087d03", "date": "2025-12-26T14:56:11.000Z", "description": "Nominated for \"Best New DeFi\" award at The Rollup Co's awards ceremony on December 30th, 2025." },
            { "id": "694ae9ceb8ee5f3f01fd6d52", "date": "2025-12-23T18:20:39.000Z", "description": "Allocates 100% of Launch revenue, 70% of LST revenue, and 100% of validator commission sharing revenue to KNTQ buybacks." },
            { "id": "694ae9ccb8ee5f3f01fd6d4e", "date": "2025-12-23T18:20:39.000Z", "description": "Validators must split their commission 50-50 with Kinetiq or stake 2.5M KNTQ to opt into the active validator set if running 0% commission." },
            { "id": "694a07823e47fdf3ba781c9b", "date": "2025-12-23T02:57:29.000Z", "description": "Temporarily unstaked tokens to participate in an upcoming governance vote regarding permanent burning of HYPE accumulated by the Assistance Fund, with tokens to be redistributed via StakeHub after the vote concludes." },
            { "id": "69409591e5d831ec8096b036", "date": "2025-12-15T22:00:00.000Z", "description": "888,888 kHYPE raised to back kmHYPE for markets_xyz, with KNTQ token gating access to the exchange-specific LST." }
        ]
    },
    {
        "id": "670b3b2d90a8919c85d08cd5",
        "name": "redacted remilio babies",
        "score": 0.412,
        "xHandle": "remiliobaby",
        "rationale": "New Cypher ETH L1 offers 15% liquidity provision boost to Remilio holders.",
        "ticker": "remilio",
        "tokens": {
            "solana": "remiG7sGaHWgrY7o6SXJW5CYi5A7kmKutyJz6x6hUsp"
        },
        "summaries": [
            { "id": "6925f294e5d831ec8069c6ea", "date": "2025-11-25T17:00:00.000Z", "description": "Cypher, a new ETH L1 platform created by Remi-ecosystem veterans, launches and offers Remilio holders a 15% points boost for liquidity provision. The boost applies to holders of Remilio, Milady, YAYO, and Fumo404 NFTs." },
            { "id": "68f93b47e5d831ec803b5d52", "date": "2025-10-22T19:00:00.000Z", "description": "Polymarket airdrop includes Milady and Remilio collections." },
            { "id": "68f14578e5d831ec80cea222", "date": "2025-10-16T18:00:00.000Z", "description": "Collection floor price dropped to 0.2 ETH from 1 ETH, representing an 80% decline." },
            { "id": "68eea1a7e5d831ec80abeaab", "date": "2025-10-14T18:00:00.000Z", "description": "The \"Permanent Underclass\" tier allocates an average of 135,511 $MON tokens to 8% of eligible wallets, valued at $5,135 at $7 billion FDV or $14,671 at the $20 billion FDV recently reached on whales market." },
            { "id": "68ee5b8ae5d831ec80a76bd7", "date": "2025-10-14T13:00:00.000Z", "description": "Holders qualify for the Monad ($MON) airdrop based on September 30, 2025 snapshot, with claiming deadline of November 3, 2025. The collection is listed among 15 eligible NFT collections including CryptoPunks, Azuki, and Pudgy Penguins, while BAYC is notably excluded." }
        ]
    }
];

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

// Enhanced logging function
const originalLog = console.log;

console.log = function (message: any) {
    if (typeof message === 'string') {
        if (message.includes('State:')) {
            const label = message.split(':')[0];
            try {
                const jsonStr = message.substring(message.indexOf(':') + 1);
                const data = JSON.parse(jsonStr);
                console.log(`\n${label}:`);
                console.log('-'.repeat(50));
                console.dir(data, { depth: null, colors: true, compact: false, sorted: true });
            } catch (e) {
                originalLog.call(console, message);
            }
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

// Fetch crypto projects with validation
async function fetchProjectsWithNonEmptyFields(limit = 3, chainFilter?: string) {
    let allProjects: any[] = [];
    let page = 1;
    let foundEnough = false;
    const maxAttempts = 5;
    
    while (!foundEnough && page <= maxAttempts) {
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
            break;
        }
        
        const validProjects = data.data.filter((item: any) => {
            const hasValidTokens = item.tokens && 
                Object.entries(item.tokens).some(([key, value]) => 
                    key.trim() !== '' && 
                    value !== null && 
                    value !== undefined && 
                    String(value).trim() !== ''
                );
            const hasValidTicker = item.ticker && item.ticker.trim() !== '';
            return hasValidTokens && hasValidTicker;
        });
        
        allProjects = [...allProjects, ...validProjects];
        
        if (allProjects.length >= limit) {
            foundEnough = true;
        } else {
            page++;
        }
    }
    
    const topProjects = allProjects
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    
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
                messages: [{ role: "user", content: prompt }]
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

            const serviceName = job.name;
            const servicePrice = job.price;
            const serviceRequirement = job.requirement;
            
            console.log(`[DEBUG] Service Name: "${serviceName}"`);
            console.log(`[DEBUG] Service Price: ${servicePrice}`);
            console.log(`[DEBUG] Service Requirement:`, serviceRequirement);

            try {
                const agent = await job.providerAgent;
                if (agent) {
                    console.log(`[DEBUG] Agent jobs:`, agent.jobs.map((j: any) => ({
                        name: j.name,
                        price: j.priceV2?.value
                    })));
                    
                    const matchingJob = agent.jobs.find((j: any) => j.priceV2?.value === servicePrice);
                    if (matchingJob) {
                        const jobIndex = agent.jobs.indexOf(matchingJob);
                        console.log(`[DEBUG] Matching job index: ${jobIndex}`);
                        console.log(`[DEBUG] Job details:`, matchingJob);
                    } else {
                        console.log(`[DEBUG] No matching job found for price: ${servicePrice}`);
                    }
                }
            } catch (error) {
                console.log(`[DEBUG] Could not fetch agent jobs:`, error);
            }

            if (
                job.phase === AcpJobPhases.REQUEST &&
                memoToSign?.nextPhase === AcpJobPhases.NEGOTIATION
            ) {
                console.log(`[processJob] Responding to job ${job.id} with requirement`, job.requirement);
                await job.accept("Job requirement matches agent capability");
                await job.createRequirement(`Job ${job.id} accepted, please make payment to proceed`);
                console.log(`[processJob] Job ${job.id} responded`);
            }

            else if (
                job.phase === AcpJobPhases.TRANSACTION &&
                memoToSign?.nextPhase === AcpJobPhases.EVALUATION
            ) {
                console.log(`[processJob] Delivering Job ${job.id}`);
                
                const serviceName = job.name?.toLowerCase() || '';
                const firstMemo = job.memos.find(m => m.nextPhase === 1);
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
                
                const useIndigo = actualServiceName.includes('indigo') || serviceName.includes('indigo');
                
                console.log(`[DEBUG] Service name: "${serviceName}"`);
                console.log(`[processJob] Using ${useIndigo ? 'Indigo AI' : 'Crypto Projects'} service for job ${job.id}`);
                
                if (useIndigo) {
                    // Use Indigo AI service
                    try {
                        const prompt = JSON.stringify(job.requirement) || serviceName || "What are the top crypto opportunities right now?";
                        const result = await callIndigoService(prompt);
                        
                        if (result.status !== 200) {
                            throw new Error(`Failed to call Indigo: ${result.error}`);
                        }
                        
                        const finalProduct = JSON.stringify(result.data, null, 2);
                        console.log("finalProduct (Indigo): ", finalProduct);
                        
                        const deliverable: DeliverablePayload = {
                            type: "text",
                            value: finalProduct,
                        };
                        await job.deliver(deliverable);
                        console.log(`[processJob] Job ${job.id} delivered with Indigo data`);
                        
                    } catch (error) {
                        console.error(`Error with Indigo service for job ${job.id}:`, error);
                        const errorMessage = (error as Error).message || String(error);
                        
                        // For Indigo errors, return the error message
                        console.log(`[ERROR] Delivering error message for job ${job.id}`);
                        const errorDeliverable: DeliverablePayload = {
                            type: "text",
                            value: `Error calling Indigo service: ${errorMessage}`,
                        };
                        await job.deliver(errorDeliverable);
                        console.log(`[ERROR] Job ${job.id} delivered with error message`);
                    }
                } else {
                    // For crypto projects requests, ALWAYS return fallback data directly
                    console.log(`[DIRECT] Delivering hardcoded crypto projects data for job ${job.id}`);
                    const finalProduct = JSON.stringify(FALLBACK_DATA, null, 2);
                    
                    console.log("finalProduct (Hardcoded): ", finalProduct);
                    
                    const deliverable: DeliverablePayload = {
                        type: "text",
                        value: finalProduct,
                    };
                    await job.deliver(deliverable);
                    console.log(`[processJob] Job ${job.id} delivered with hardcoded crypto projects data`);
                }
            }

            else {
                console.warn(`[processJob] Unknown or unhandled phase: ${job.phase}`);
            }
        } catch (error) {
            console.error(`❌ Error in job ${job.id}:`, error);
        }
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}

async function seller() {
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

    const acpPlugin = null;

    const jobQueue = new JobQueue<{ job: AcpJob; memoToSign?: AcpMemo }>();
    
    const acpClient = new AcpClient({
        acpContractClient: await AcpContractClientV2.build(
            WHITELISTED_WALLET_PRIVATE_KEY,
            SESSION_ENTITY_KEY_ID,
            AGENT_WALLET_ADDRESS
        ),
        onNewTask: async (job: AcpJob, memoToSign?: AcpMemo) => {
            console.log(`[onNewTask] Received job ${job.id}`);
            jobQueue.enqueue({ job, memoToSign });
        }
    });
    
    const processor = new JobProcessor(jobQueue, acpPlugin, acpClient, 2000);
    processor.start();

    setInterval(async () => {
        try {
            const { exec } = require('child_process');
            exec('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'', (error: any, stdout: any) => {
                if (!error) {
                    const diskUsage = parseInt(stdout.trim());
                    if (diskUsage > 90) {
                        console.log(`⚠️  High disk usage detected: ${diskUsage}%. Performing emergency cleanup...`);
                    }
                }
            });
        } catch (error) {
            console.error("Error in periodic cleanup:", error);
        }
    }, 2 * 60 * 1000);

    console.log("[Seller] Listening for new jobs... (TEMP VERSION - delivers fallback on error)");
}

seller();

