import { validateEnvironment, createTestPlugin, TestTracker, colors } from './test-setup';

async function testTokenMetricsEndpoints() {
  console.log(`${colors.bright}🚀 TokenMetrics Endpoint Testing Suite${colors.reset}`);
  console.log(`${colors.bright}=====================================\n${colors.reset}`);
  
  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  const plugin = createTestPlugin();
  const tracker = new TestTracker();
  
  // Test 1: Tokens Database
  await testEndpoint(tracker, 'Tokens Database', async () => {
    const worker = plugin.getWorker({
      functions: [plugin.getTokens]
    });
    
    // Simulate calling the function with test parameters
    const result = await plugin.getTokens.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved token database' : result.feedback
    };
  });
  
  // Test 2: Top Market Cap Tokens
  await testEndpoint(tracker, 'Top Market Cap Tokens', async () => {
    const result = await plugin.getTopMarketCapTokens.executable(
      { top_k: "10", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved top market cap tokens' : result.feedback
    };
  });
  
  // Test 3: Price Data (requires token_id, so we'll test with Bitcoin's ID)
  await testEndpoint(tracker, 'Price Data', async () => {
    const result = await plugin.getPriceData.executable(
      { token_id: '3375' }, // Bitcoin's token ID
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved price data for Bitcoin' : result.feedback
    };
  });
  
  // Test 4: Trader Grades
  await testEndpoint(tracker, 'Trader Grades', async () => {
    const result = await plugin.getTraderGrades.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved trader grades' : result.feedback
    };
  });
  
  // Test 5: Investor Grades
  await testEndpoint(tracker, 'Investor Grades', async () => {
    const result = await plugin.getInvestorGrades.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved investor grades' : result.feedback
    };
  });
  
  // Test 6: Trading Signals
  await testEndpoint(tracker, 'Trading Signals', async () => {
    const result = await plugin.getTradingSignals.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved trading signals' : result.feedback
    };
  });
  
  // Test 7: Market Metrics
  await testEndpoint(tracker, 'Market Metrics', async () => {
    const result = await plugin.getMarketMetrics.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved market metrics' : result.feedback
    };
  });
  
  // Test 8: Quantmetrics
  await testEndpoint(tracker, 'Quantmetrics', async () => {
    const result = await plugin.getQuantmetrics.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved quantmetrics' : result.feedback
    };
  });
  
  // Test 9: Hourly OHLCV
  await testEndpoint(tracker, 'Hourly OHLCV', async () => {
    const result = await plugin.getHourlyOhlcv.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved hourly OHLCV data' : result.feedback
    };
  });
  
  // Test 10: Daily OHLCV
  await testEndpoint(tracker, 'Daily OHLCV', async () => {
    const result = await plugin.getDailyOhlcv.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved daily OHLCV data' : result.feedback
    };
  });
  
  // Test 11: AI Reports
  await testEndpoint(tracker, 'AI Reports', async () => {
    const result = await plugin.getAiReports.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved AI reports' : result.feedback
    };
  });
  
  // Test 12: Crypto Investors
  await testEndpoint(tracker, 'Crypto Investors', async () => {
    const result = await plugin.getCryptoInvestors.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved crypto investors data' : result.feedback
    };
  });
  
  // Test 13: Resistance & Support
  await testEndpoint(tracker, 'Resistance & Support', async () => {
    const result = await plugin.getResistanceSupport.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved resistance & support levels' : result.feedback
    };
  });

  // Test 14: TokenMetrics AI
  await testEndpoint(tracker, 'TokenMetrics AI', async () => {
    const result = await plugin.getTokenMetricsAi.executable(
      { user_message: "What is the next 100x coin?" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully queried TokenMetrics AI' : result.feedback
    };
  });

  // Test 15: Sentiments
  await testEndpoint(tracker, 'Sentiments', async () => {
    const result = await plugin.getSentiments.executable(
      { limit: "5", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved sentiment data' : result.feedback
    };
  });

  // Test 16: Scenario Analysis
  await testEndpoint(tracker, 'Scenario Analysis', async () => {
    const result = await plugin.getScenarioAnalysis.executable(
      { token_id: "3375", limit: "5", page: "1" }, // Bitcoin's token ID
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved scenario analysis' : result.feedback
    };
  });

  // Test 17: Correlation
  await testEndpoint(tracker, 'Correlation', async () => {
    const result = await plugin.getCorrelation.executable(
      { token_id: "3375", limit: "5", page: "1" }, // Bitcoin's token ID
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    return {
      success: result.status === 'done',
      message: result.status === 'done' ? 'Successfully retrieved correlation data' : result.feedback
    };
  });
  
  // Print final summary
  tracker.printSummary();
}

async function testEndpoint(
  tracker: TestTracker, 
  name: string, 
  testFn: () => Promise<{ success: boolean; message: string }>
) {
  const startTime = tracker.startTest(name);
  
  try {
    const result = await testFn();
    tracker.endTest(name, startTime, result.success, result.message);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    tracker.endTest(name, startTime, false, `Error: ${errorMessage}`);
  }
}

// Run the tests
testTokenMetricsEndpoints().catch(console.error);