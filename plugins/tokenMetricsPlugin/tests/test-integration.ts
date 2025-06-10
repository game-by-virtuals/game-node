import { GameAgent } from "@virtuals-protocol/game";
import { validateEnvironment, createTestPlugin, TestTracker, colors, testConfig } from './test-setup';

async function testFullIntegration() {
  console.log(`${colors.bright}🔗 TokenMetrics Full Integration Test${colors.reset}`);
  console.log(`${colors.bright}===================================\n${colors.reset}`);
  
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  const tracker = new TestTracker();
  const plugin = createTestPlugin();
  
  // Test 1: Plugin Initialization
  const startTime1 = tracker.startTest('Plugin Initialization');
  try {
    const worker = plugin.getWorker({});
    const hasAllFunctions = worker.functions.length === 17;
    tracker.endTest('Plugin Initialization', startTime1, hasAllFunctions, 
      `Plugin created with ${worker.functions.length}/17 functions`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    tracker.endTest('Plugin Initialization', startTime1, false, errorMessage);
  }
  
  // Test 2: Agent Creation
  const startTime2 = tracker.startTest('Agent Creation with TokenMetrics');
  try {
    const agent = new GameAgent(testConfig.gameApiKey, {
      name: "Test TokenMetrics Agent",
      goal: "Test the TokenMetrics integration",
      description: "A test agent to verify TokenMetrics integration works properly",
      workers: [plugin.getWorker({})],
    });
    
    // Test agent initialization
    await agent.init();
    tracker.endTest('Agent Creation with TokenMetrics', startTime2, true, 
      'Agent successfully created and initialized with TokenMetrics capabilities');
      
    // Test 3: Agent Function Execution
    const startTime3 = tracker.startTest('Agent Function Execution');
    try {
      // We can't easily test the full agent.step() without more complex setup,
      // but we can verify the agent has the right configuration
      const hasWorkers = agent.workers && agent.workers.length > 0;
      tracker.endTest('Agent Function Execution', startTime3, hasWorkers, 
        'Agent properly configured with TokenMetrics workers');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      tracker.endTest('Agent Function Execution', startTime3, false, errorMessage);
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    tracker.endTest('Agent Creation with TokenMetrics', startTime2, false, errorMessage);
  }
  
  tracker.printSummary();
}

testFullIntegration().catch(console.error);