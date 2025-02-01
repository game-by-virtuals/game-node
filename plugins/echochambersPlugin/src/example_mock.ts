import { GameAgent } from "@virtuals-protocol/game";
import EchochambersPlugin from "./echochambersPlugin";

// Create plugin instance
const echochambersPlugin = new EchochambersPlugin({
  credentials: {
    apiKey: "your-api-key-here",
  },
  sender: {
    username: "Virtuals_Agent",
    model: "VirtualsLLM"
  }
});

// Mock GameAgent for testing
class TestGameAgent {
  name: string;
  goal: string;
  description: string;
  workers: any[];
  logger: any;

  constructor(apiKey: string, config: any) {
    this.name = config.name;
    this.goal = config.goal;
    this.description = config.description;
    this.workers = config.workers;
  }

  setLogger(logger: any) {
    this.logger = logger;
  }

  async init() {
    // Mock initialization
    return Promise.resolve();
  }

  private async executeFunction(functionName: string, args: any) {
    const worker = this.workers[0];
    
    // Debug: List all available functions
    console.log("\nAvailable functions:", worker.functions.map((f: any) => f.name));
    
    const fn = worker.functions.find((f: any) => f.name === functionName);
    if (!fn) {
      throw new Error(`Function ${functionName} not found. Available functions: ${worker.functions.map((f: any) => f.name).join(", ")}`);
    }

    const result = await fn.executable(args, (msg: string) => 
      console.log(`[Worker Log] ${msg}`)
    );

    if (this.logger) {
      this.logger(this, `${functionName} result: ${JSON.stringify(result)}`);
    }

    return result;
  }

  async run(interval: number, options: any) {
    try {
      if (this.logger) {
        this.logger(this, "Starting test sequence...\n");
      }

      // 1. Get room history
      await this.executeFunction("get_room_history", {
        room: "general",
        limit: 5
      });

      // 2. Get room metrics
      await this.executeFunction("get_room_metrics", {
        room: "general"
      });

      // 3. Get agent metrics
      await this.executeFunction("get_agent_metrics", {
        room: "general"
      });

      // 4. Get metrics history
      await this.executeFunction("get_metrics_history", {
        room: "general"
      });

      // 5. Send a test message
      await this.executeFunction("send_message", {
        room: "general",
        content: "Hello! I've just checked all the metrics and history.",
        reasoning: "Testing all Echochambers plugin functions"
      });

      if (this.logger) {
        this.logger(this, "Test sequence completed successfully!\n");
      }
    } catch (error) {
      console.error("Error in test sequence:", error);
      throw error;
    }
  }
}

// Create an agent with the worker
const worker = echochambersPlugin.getWorker();
console.log("\nWorker functions:", worker.functions.map(f => f.name));

const agent = new TestGameAgent("API_KEY", {
  name: "Echochambers Bot",
  goal: "test all Echochambers plugin functions",
  description: "A bot that demonstrates all available Echochambers plugin functions",
  workers: [worker]
});

// Set up enhanced logging
agent.setLogger((agent: any, message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`\n-----[${timestamp}][${agent.name}]-----`);
  console.log(`Goal: ${agent.goal}`);
  console.log(`Message: ${message}`);
});

// Run the example
(async () => {
  try {
    // Initialize the agent
    await agent.init();

    // Run all test functions
    await agent.run(60, { verbose: true });

    console.log("\nExample completed successfully!");
  } catch (error) {
    console.error("\nExample failed:", error);
  }
})();
