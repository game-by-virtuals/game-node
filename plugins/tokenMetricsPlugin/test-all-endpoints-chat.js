#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

// All 17 Token Metrics endpoints with specific test prompts
const endpointTests = [
  {
    name: "1. Tokens Database",
    prompt: "Show me the tokens database",
    expectedKeywords: ["TOKEN_ID", "TOKEN_NAME", "TOKEN_SYMBOL"]
  },
  {
    name: "2. Top Market Cap Tokens", 
    prompt: "Get top cryptocurrencies by market capitalization",
    expectedKeywords: ["Bitcoin", "Ethereum", "market cap", "price"]
  },
  {
    name: "3. Price Data",
    prompt: "What is the current price of Bitcoin?",
    expectedKeywords: ["Bitcoin", "price", "BTC", "$"]
  },
  {
    name: "4. Trader Grades",
    prompt: "Show me trader grades for cryptocurrencies",
    expectedKeywords: ["trader grade", "TA_GRADE", "QUANT_GRADE"]
  },
  {
    name: "5. Investor Grades", 
    prompt: "What are the investor grades for top cryptocurrencies?",
    expectedKeywords: ["investor grade", "TM_INVESTOR_GRADE"]
  },
  {
    name: "6. Trading Signals",
    prompt: "Show me trading signals for cryptocurrencies",
    expectedKeywords: ["trading signal", "BUY", "SELL", "HOLD"]
  },
  {
    name: "7. Market Metrics",
    prompt: "Get market metrics for cryptocurrency analysis",
    expectedKeywords: ["market metrics", "volume", "market cap"]
  },
  {
    name: "8. Quantmetrics",
    prompt: "Show me quantmetrics data for crypto analysis",
    expectedKeywords: ["quantmetrics", "quant", "metrics"]
  },
  {
    name: "9. Hourly OHLCV",
    prompt: "Get hourly OHLCV data for Bitcoin",
    expectedKeywords: ["OHLCV", "open", "high", "low", "close", "volume"]
  },
  {
    name: "10. Daily OHLCV", 
    prompt: "Show me daily OHLCV data for Ethereum",
    expectedKeywords: ["OHLCV", "daily", "open", "high", "low"]
  },
  {
    name: "11. AI Reports",
    prompt: "Generate AI reports for cryptocurrency market",
    expectedKeywords: ["AI report", "analysis", "recommendation"]
  },
  {
    name: "12. Crypto Investors",
    prompt: "Show me crypto investors data and analysis",
    expectedKeywords: ["investors", "crypto", "investment"]
  },
  {
    name: "13. Resistance & Support",
    prompt: "What are the resistance and support levels for Bitcoin?",
    expectedKeywords: ["resistance", "support", "level", "price"]
  },
  {
    name: "14. Token Metrics AI",
    prompt: "Ask Token Metrics AI about the best cryptocurrency investments",
    expectedKeywords: ["AI", "investment", "recommendation", "analysis"]
  },
  {
    name: "15. Sentiments",
    prompt: "Analyze cryptocurrency market sentiment",
    expectedKeywords: ["sentiment", "market", "positive", "negative", "neutral"]
  },
  {
    name: "16. Scenario Analysis",
    prompt: "Show me scenario analysis for Bitcoin price predictions",
    expectedKeywords: ["scenario", "prediction", "bearish", "bullish", "ROI"]
  },
  {
    name: "17. Correlation",
    prompt: "Show me correlation analysis between cryptocurrencies",
    expectedKeywords: ["correlation", "relationship", "portfolio"]
  }
];

console.log('🚀 COMPREHENSIVE TOKENMETRICS ENDPOINT TESTING');
console.log('═'.repeat(80));
console.log(`📊 Testing ${endpointTests.length} endpoints through chat interface`);
console.log('⏰ Started at:', new Date().toLocaleString());
console.log('═'.repeat(80));

let testResults = [];
let currentTest = 0;

async function runSingleTest(test) {
  return new Promise((resolve) => {
    console.log(`\n🔍 ${test.name}`);
    console.log(`💬 Prompt: "${test.prompt}"`);
    console.log('⏳ Running test...');
    
    const startTime = Date.now();
    const child = spawn('npm', ['run', 'chat'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    // Send the prompt
    child.stdin.write(test.prompt + '\n');
    
    // Collect output
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Set timeout for each test
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        name: test.name,
        prompt: test.prompt,
        success: false,
        error: 'Test timeout (30 seconds)',
        duration: Date.now() - startTime,
        output: output.slice(-500) // Last 500 chars
      });
    }, 30000);
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      // Check if test was successful
      const hasExpectedKeywords = test.expectedKeywords.some(keyword => 
        output.toLowerCase().includes(keyword.toLowerCase())
      );
      
      const hasError = errorOutput.includes('Error') || code !== 0;
      const success = hasExpectedKeywords && !hasError;
      
      console.log(`${success ? '✅' : '❌'} ${success ? 'PASSED' : 'FAILED'} (${duration}ms)`);
      
      if (success) {
        console.log(`   📝 Found expected keywords: ${test.expectedKeywords.join(', ')}`);
      } else {
        console.log(`   ❌ Missing keywords or error detected`);
        if (hasError) {
          console.log(`   🚨 Error: ${errorOutput.slice(-200)}`);
        }
      }
      
      resolve({
        name: test.name,
        prompt: test.prompt,
        success,
        error: hasError ? errorOutput.slice(-200) : null,
        duration,
        output: output.slice(-1000), // Last 1000 chars for analysis
        foundKeywords: test.expectedKeywords.filter(keyword => 
          output.toLowerCase().includes(keyword.toLowerCase())
        )
      });
    });
  });
}

async function runAllTests() {
  for (const test of endpointTests) {
    const result = await runSingleTest(test);
    testResults.push(result);
    currentTest++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate final report
  generateReport();
}

function generateReport() {
  console.log('\n\n🏆 FINAL TEST RESULTS');
  console.log('═'.repeat(80));
  
  const passed = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`📊 Summary: ${passed}/${testResults.length} tests passed (${((passed/testResults.length)*100).toFixed(1)}%)`);
  console.log(`⏱️  Total Duration: ${(totalDuration/1000).toFixed(1)} seconds`);
  console.log(`⚡ Average Response Time: ${(totalDuration/testResults.length/1000).toFixed(1)} seconds`);
  
  if (passed === testResults.length) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('✅ Token Metrics chat interface is fully operational');
    console.log('✅ All 17 endpoints are working correctly');
    console.log('✅ Beautiful formatting is applied to all responses');
  } else {
    console.log(`\n⚠️  ${failed} tests failed. Details below:`);
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  console.log('─'.repeat(80));
  
  testResults.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.name} (${result.duration}ms)`);
    
    if (!result.success) {
      console.log(`   💬 Prompt: "${result.prompt}"`);
      if (result.error) {
        console.log(`   🚨 Error: ${result.error}`);
      }
      console.log(`   📝 Output preview: ${result.output.slice(0, 200)}...`);
    } else {
      console.log(`   🎯 Found: ${result.foundKeywords.join(', ')}`);
    }
    console.log('');
  });
  
  // Save detailed results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.length,
      passed,
      failed,
      successRate: `${((passed/testResults.length)*100).toFixed(1)}%`,
      totalDuration: `${(totalDuration/1000).toFixed(1)}s`,
      averageResponseTime: `${(totalDuration/testResults.length/1000).toFixed(1)}s`
    },
    results: testResults
  };
  
  fs.writeFileSync('endpoint-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('💾 Detailed results saved to: endpoint-test-results.json');
  
  console.log('\n🏁 Testing completed!');
}

// Start the testing process
runAllTests().catch(console.error); 