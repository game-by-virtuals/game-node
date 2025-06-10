import { config } from "dotenv";
config({ path: "./.env" });
import TokenMetricsPlugin from "../src/index";

// Color coding for test results
export const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// Test configuration
export const testConfig = {
  tokenMetricsApiKey: process.env.TOKENMETRICS_API_KEY!,
  gameApiKey: process.env.GAME_API_KEY!,
  timeout: 30000, // 30 seconds timeout for API calls
};

// Validate environment setup
export function validateEnvironment(): boolean {
  console.log(`${colors.blue}${colors.bright}🔍 Validating Environment Setup...${colors.reset}\n`);
  
  let isValid = true;
  
  // Check TokenMetrics API Key
  if (!testConfig.tokenMetricsApiKey) {
    console.log(`${colors.red}❌ TOKENMETRICS_API_KEY is missing in .env file${colors.reset}`);
    isValid = false;
  } else if (!testConfig.tokenMetricsApiKey.startsWith('tm-')) {
    console.log(`${colors.yellow}⚠️  TokenMetrics API key should start with 'tm-'${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ TokenMetrics API Key found and properly formatted${colors.reset}`);
  }
  
  // Check GAME API Key  
  if (!testConfig.gameApiKey) {
    console.log(`${colors.red}❌ GAME_API_KEY is missing in .env file${colors.reset}`);
    isValid = false;
  } else {
    console.log(`${colors.green}✅ Virtuals Protocol GAME API Key found${colors.reset}`);
  }
  
  if (!isValid) {
    console.log(`\n${colors.red}${colors.bright}❌ Environment setup incomplete. Please check your .env file.${colors.reset}\n`);
    console.log(`${colors.yellow}Required .env format:${colors.reset}`);
    console.log(`GAME_API_KEY=your_game_api_key_here`);
    console.log(`TOKENMETRICS_API_KEY=tm-your-api-key-here\n`);
  } else {
    console.log(`\n${colors.green}${colors.bright}✅ Environment setup complete!${colors.reset}\n`);
  }
  
  return isValid;
}

// Create plugin instance for testing
export function createTestPlugin(): TokenMetricsPlugin {
  return new TokenMetricsPlugin({
    apiClientConfig: {
      apiKey: testConfig.tokenMetricsApiKey,
    },
  });
}

// Test result tracker
export class TestTracker {
  private passed = 0;
  private failed = 0;
  private results: { name: string; status: 'PASS' | 'FAIL'; message: string; duration: number }[] = [];
  
  startTest(name: string): number {
    console.log(`${colors.blue}🧪 Testing: ${name}${colors.reset}`);
    return Date.now();
  }
  
  endTest(name: string, startTime: number, success: boolean, message: string = '') {
    const duration = Date.now() - startTime;
    const status = success ? 'PASS' : 'FAIL';
    
    if (success) {
      this.passed++;
      console.log(`${colors.green}✅ PASS: ${name} (${duration}ms)${colors.reset}`);
      if (message) console.log(`   ${colors.green}${message}${colors.reset}`);
    } else {
      this.failed++;
      console.log(`${colors.red}❌ FAIL: ${name} (${duration}ms)${colors.reset}`);
      if (message) console.log(`   ${colors.red}${message}${colors.reset}`);
    }
    
    this.results.push({ name, status, message, duration });
    console.log(''); // Empty line for readability
  }
  
  printSummary() {
    console.log(`${colors.bright}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${colors.bright}===============${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.failed}${colors.reset}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    console.log(`🎯 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%\n`);
    
    if (this.failed > 0) {
      console.log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`${colors.red}• ${r.name}: ${r.message}${colors.reset}`));
    }
  }
}

// Main execution when run directly
if (require.main === module) {
  console.log(`${colors.blue}${colors.bright}🚀 TokenMetrics Virtuals Plugin - Test Setup${colors.reset}\n`);
  
  const isValid = validateEnvironment();
  
  if (isValid) {
    console.log(`${colors.green}${colors.bright}🎉 Ready to run tests!${colors.reset}`);
    console.log(`${colors.blue}Available commands:${colors.reset}`);
    console.log(`${colors.yellow}🚀 Interactive Chat:${colors.reset}`);
    console.log(`• npm run chat - Interactive TokenMetrics AI chat interface`);
    console.log(`${colors.blue}📋 Test Commands:${colors.reset}`);
    console.log(`• npm run test:individual - Run individual API tests`);
    console.log(`• npm run test:integration - Run integration tests`);
    console.log(`• npm run test:all - Run all tests`);
    console.log(`• npm run demo:trading-bot - Demo trading bot scenario`);
    console.log(`• npm run demo:research-agent - Demo research agent scenario`);
    console.log(`• npm run demo:new-endpoints - Demo new endpoints (AI, Sentiments, Scenario Analysis, Correlation)`);
    console.log(`• npm run demo:indices - Demo crypto indices endpoints (Indices, Holdings, Performance)`);
    console.log(`${colors.blue}📊 Individual Examples:${colors.reset}`);
    console.log(`• npm run example:indices - Crypto indices overview`);
    console.log(`• npm run example:indices-holdings - Index portfolio composition`);
    console.log(`• npm run example:indices-performance - Historical index performance\n`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}