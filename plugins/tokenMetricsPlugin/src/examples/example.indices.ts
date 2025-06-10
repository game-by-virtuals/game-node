import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../index";

const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

(async () => {
  console.log("\n🚀 Starting TokenMetrics Crypto Indices Example...\n");
  
  console.log("=".repeat(80));
  console.log("📊 APPROACH 1: Direct Function Call (for testing/debugging)");
  console.log("=".repeat(80));
  
  try {
    console.log("🔧 Testing direct API call...");
    console.log("📈 Fetching crypto indices with performance data...\n");
    
    // Direct function call approach
    const result = await tokenMetricsPlugin.getIndices.executable(
      { limit: "20", page: "1" },
      (message: string) => {
        console.log(`${message}`);
      }
    );
    
    if (result.status === 'done') {
      console.log("\n✅ Direct function call completed successfully!");
    } else {
      console.log("\n❌ Direct function call failed:");
      console.log(result.feedback);
    }
  } catch (error) {
    console.log("\n❌ Error in direct function call:");
    console.log(error);
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("🤖 APPROACH 2: GameAgent Integration (for AI agents)");
  console.log("=".repeat(80));
  
  // Create an agent to get crypto indices
  const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
    name: "TokenMetrics Crypto Indices Agent",
    goal: "Call the get_indices function with limit 20 and page 1 to retrieve crypto indices performance data from TokenMetrics.",
    description:
      "You are an AI agent that retrieves crypto indices data. Call the get_indices function with limit=20 and page=1 parameters only.",
    workers: [
      tokenMetricsPlugin.getWorker({
        functions: [tokenMetricsPlugin.getIndices],
      }),
    ],
  });

  try {
    agent.setLogger((agent, message) => {
      console.log(`🤖 Agent: ${message}`);
    });

    await agent.init();
    
    console.log("🤖 GameAgent initialized successfully!");
    console.log("📊 Agent fetching crypto indices performance data...\n");
    
    // Run multiple steps to ensure the agent completes the task
    for (let i = 0; i < 3; i++) {
      console.log(`\n--- Agent Step ${i + 1} ---`);
      const stepResult = await agent.step({
        verbose: true,
      });
      
      console.log(`Step ${i + 1} completed`);
    }
    
    console.log("\n✅ GameAgent integration example completed!");
    
  } catch (error) {
    console.log("\n❌ Error in GameAgent integration:");
    console.log(error);
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("🎯 SUMMARY");
  console.log("=".repeat(80));
  console.log("✅ Both approaches are available for developers:");
  console.log("   1. Direct function calls - for simple integrations");
  console.log("   2. GameAgent integration - for AI agent frameworks");
  console.log("💡 Use index IDs from this data with getIndicesHoldings and getIndicesPerformance functions.");
  console.log("=".repeat(80));
  
  process.exit(0);
})(); 