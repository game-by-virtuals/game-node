import AcpClient, { 
    AcpContractClient, 
    AcpJobPhases, 
    AcpJob
} from '@virtuals-protocol/acp-node';
import {
    SELLER_AGENT_WALLET_ADDRESS,
    SELLER_ENTITY_ID,
    WHITELISTED_WALLET_PRIVATE_KEY
} from "./env";
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

// Simple job queue for processing jobs sequentially
class JobQueue {
    private queue: AcpJob[] = [];
    private processing = false;
    private processingDelay = 2000; // 2 second delay between jobs

    async enqueue(job: AcpJob) {
        console.log(`[queue] Enqueuing job ${job.id} (Phase: ${job.phase})`);
        this.queue.push(job);
        console.log(`[queue] Queue status: ${this.queue.length} jobs waiting`);
        
        if (!this.processing) {
            this.processQueue();
        }
    }

    private async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;
        console.log(`[queue] Starting to process queue (${this.queue.length} jobs)`);

        while (this.queue.length > 0) {
            const job = this.queue.shift()!;
            console.log(`[queue] Processing job ${job.id} (${this.queue.length} remaining)`);
            
            try {
                await this.handleJob(job);
                console.log(`[queue] Job ${job.id} processed successfully`);
            } catch (error) {
                console.error(`[queue] Error processing job ${job.id}:`, error);
            }

            // Add delay between jobs if there are more in queue
            if (this.queue.length > 0) {
                console.log(`[queue] Waiting ${this.processingDelay}ms before next job...`);
                await new Promise(resolve => setTimeout(resolve, this.processingDelay));
            }
        }

        this.processing = false;
        console.log(`[queue] Queue processing complete`);
    }

    private async handleJob(job: AcpJob) {
        if (
            job.phase === AcpJobPhases.REQUEST &&
            job.memos.find((m) => m.nextPhase === AcpJobPhases.NEGOTIATION)
        ) {
            console.log("[queue] Responding to job", job.id);
            await job.respond(true);
            console.log(`[queue] Job ${job.id} responded`);
        } else if (
            job.phase === AcpJobPhases.TRANSACTION &&
            job.memos.find((m) => m.nextPhase === AcpJobPhases.EVALUATION)
        ) {
            console.log("[queue] Delivering job", job.id);
            await job.deliver(
                JSON.stringify({
                    type: "url",
                    value: "https://example.com",
                })
            );
            console.log(`[queue] Job ${job.id} delivered`);
        } else {
            console.log(`[queue] Job ${job.id} in phase ${job.phase} - no action needed`);
        }
    }

    getStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing
        };
    }
}

// Worker thread code
if (!isMainThread) {
    console.log("[worker] Worker thread started");
    
    const { useThreadLock } = workerData;
    console.log(`[worker] Thread lock enabled: ${useThreadLock}`);
    
    // Simulate worker thread processing
    setInterval(() => {
        parentPort?.postMessage({
            type: 'heartbeat',
            timestamp: Date.now(),
            useThreadLock
        });
    }, 5000);
    
    // Listen for messages from main thread
    parentPort?.on('message', (message) => {
        console.log(`[worker] Received message from main thread:`, message);
        
        if (message.type === 'processJob') {
            console.log(`[worker] Processing job in worker thread:`, message.jobId);
            // Simulate job processing
            setTimeout(() => {
                parentPort?.postMessage({
                    type: 'jobProcessed',
                    jobId: message.jobId,
                    result: 'success'
                });
            }, 2000);
        }
    });
}

async function seller() {
    const jobQueue = new JobQueue();

    new AcpClient({
        acpContractClient: await AcpContractClient.build(
            WHITELISTED_WALLET_PRIVATE_KEY,
            SELLER_ENTITY_ID,
            SELLER_AGENT_WALLET_ADDRESS
        ),
        onNewTask: async (job: AcpJob) => {
            console.log(`[onNewTask] New job received: ${job.id} (Phase: ${job.phase})`);
            // Enqueue the job for sequential processing
            await jobQueue.enqueue(job);
        },
    });

    console.log("=".repeat(40));
    console.log("Seller agent initialized and ready to receive jobs");
    console.log("Queue status:", jobQueue.getStatus());
    console.log("=".repeat(40));
    
    console.log("\nListening...\n");
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log("Shutting down seller...");
        process.exit(0);
    });
    
    // Keep the process alive indefinitely
    await new Promise(() => {});
}

// Only run the main function if this is the main thread
if (isMainThread) {
    seller();
}