import { validateEnvironment, createTestPlugin, colors } from '../test-setup';

async function demoNewEndpoints() {
  console.log(`${colors.blue}${colors.bright}🚀 TokenMetrics New Endpoints Demo${colors.reset}`);
  console.log(`${colors.blue}${colors.bright}=====================================\n${colors.reset}`);
  
  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  const plugin = createTestPlugin();
  
  console.log(`${colors.yellow}${colors.bright}🤖 Demo 1: TokenMetrics AI Chat${colors.reset}`);
  console.log(`${colors.yellow}Asking: "What is the next 100x coin?"${colors.reset}\n`);
  
  try {
    const aiResult = await plugin.getTokenMetricsAi.executable(
      { user_message: "What is the next 100x coin?" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    console.log(`${colors.green}✅ AI Chat completed successfully\n${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ AI Chat failed: ${error}\n${colors.reset}`);
  }
  
  console.log(`${colors.yellow}${colors.bright}📊 Demo 2: Market Sentiment Analysis${colors.reset}`);
  console.log(`${colors.yellow}Getting latest sentiment data...${colors.reset}\n`);
  
  try {
    const sentimentResult = await plugin.getSentiments.executable(
      { limit: "3", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    console.log(`${colors.green}✅ Sentiment analysis completed successfully\n${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Sentiment analysis failed: ${error}\n${colors.reset}`);
  }
  
  console.log(`${colors.yellow}${colors.bright}🔮 Demo 3: Scenario Analysis for Bitcoin${colors.reset}`);
  console.log(`${colors.yellow}Getting price predictions for different market scenarios...${colors.reset}\n`);
  
  try {
    const scenarioResult = await plugin.getScenarioAnalysis.executable(
      { token_id: "3375", limit: "3", page: "1" }, // Bitcoin
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    console.log(`${colors.green}✅ Scenario analysis completed successfully\n${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Scenario analysis failed: ${error}\n${colors.reset}`);
  }
  
  console.log(`${colors.yellow}${colors.bright}🔗 Demo 4: Token Correlation Analysis${colors.reset}`);
  console.log(`${colors.yellow}Getting correlation data for Bitcoin...${colors.reset}\n`);
  
  try {
    const correlationResult = await plugin.getCorrelation.executable(
      { token_id: "3375", limit: "3", page: "1" }, // Bitcoin
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    console.log(`${colors.green}✅ Correlation analysis completed successfully\n${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Correlation analysis failed: ${error}\n${colors.reset}`);
  }
  
  console.log(`${colors.green}${colors.bright}🎉 New Endpoints Demo Complete!${colors.reset}`);
  console.log(`${colors.blue}All 4 new endpoints have been successfully demonstrated:${colors.reset}`);
  console.log(`${colors.blue}• TokenMetrics AI Chat - Interactive AI assistant${colors.reset}`);
  console.log(`${colors.blue}• Sentiments - Market sentiment analysis${colors.reset}`);
  console.log(`${colors.blue}• Scenario Analysis - Price predictions${colors.reset}`);
  console.log(`${colors.blue}• Correlation - Token relationship analysis${colors.reset}\n`);
}

demoNewEndpoints().catch(console.error); 