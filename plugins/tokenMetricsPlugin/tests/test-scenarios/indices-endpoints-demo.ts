import { validateEnvironment, createTestPlugin, colors } from '../test-setup';

// Add cyan color for better formatting
const extendedColors = {
  ...colors,
  cyan: '\x1b[36m'
};

async function demoIndicesEndpoints() {
  console.log(`${extendedColors.blue}${extendedColors.bright}🚀 TokenMetrics Indices Endpoints Demo${extendedColors.reset}`);
  console.log(`${extendedColors.blue}${extendedColors.bright}======================================\n${extendedColors.reset}`);
  
  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  const plugin = createTestPlugin();
  
  console.log(`${extendedColors.yellow}${extendedColors.bright}📊 Demo 1: Crypto Indices Overview${extendedColors.reset}`);
  console.log(`${extendedColors.yellow}Getting all available crypto indices with performance data...${extendedColors.reset}\n`);
  
  try {
    const indicesResult = await plugin.getIndices.executable(
      { limit: "20", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    console.log(`${extendedColors.green}✅ Indices overview completed successfully\n${extendedColors.reset}`);
  } catch (error) {
    console.log(`${extendedColors.red}❌ Indices overview failed: ${error}\n${extendedColors.reset}`);
  }
  
  console.log(`${extendedColors.yellow}${extendedColors.bright}💼 Demo 2: Index Holdings Analysis${extendedColors.reset}`);
  console.log(`${extendedColors.yellow}Getting detailed holdings for crypto index 1 (GLOBAL)...${extendedColors.reset}\n`);
  
  try {
    const holdingsResult = await plugin.getIndicesHoldings.executable(
      { id: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    console.log(`${extendedColors.green}✅ Index holdings analysis completed successfully\n${extendedColors.reset}`);
  } catch (error) {
    console.log(`${extendedColors.red}❌ Index holdings analysis failed: ${error}\n${extendedColors.reset}`);
  }
  
  console.log(`${extendedColors.yellow}${extendedColors.bright}📈 Demo 3: Index Performance Tracking${extendedColors.reset}`);
  console.log(`${extendedColors.yellow}Getting historical performance data for crypto index 1...${extendedColors.reset}\n`);
  
  try {
    const performanceResult = await plugin.getIndicesPerformance.executable(
      { id: "1", limit: "30", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    console.log(`${extendedColors.green}✅ Index performance tracking completed successfully\n${extendedColors.reset}`);
  } catch (error) {
    console.log(`${extendedColors.red}❌ Index performance tracking failed: ${error}\n${extendedColors.reset}`);
  }
  
  console.log(`${extendedColors.yellow}${extendedColors.bright}🔍 Demo 4: DeFi Index Deep Dive${extendedColors.reset}`);
  console.log(`${extendedColors.yellow}Analyzing DeFi index (ID: 3) holdings and performance...${extendedColors.reset}\n`);
  
  try {
    // Get DeFi index holdings
    const defiHoldingsResult = await plugin.getIndicesHoldings.executable(
      { id: "3" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    // Get DeFi index performance
    const defiPerformanceResult = await plugin.getIndicesPerformance.executable(
      { id: "3", limit: "15", page: "1" },
      (msg: string) => console.log(`   📝 ${msg}`)
    );
    
    console.log(`${extendedColors.green}✅ DeFi index deep dive completed successfully\n${extendedColors.reset}`);
  } catch (error) {
    console.log(`${extendedColors.red}❌ DeFi index deep dive failed: ${error}\n${extendedColors.reset}`);
  }
  
  console.log(`${extendedColors.green}${extendedColors.bright}🎉 Indices Endpoints Demo Complete!${extendedColors.reset}`);
  console.log(`${extendedColors.blue}All 3 new indices endpoints have been successfully demonstrated:${extendedColors.reset}`);
  console.log(`${extendedColors.blue}• GET /indices - Overview of all crypto indices with performance${extendedColors.reset}`);
  console.log(`${extendedColors.blue}• GET /indices-holdings - Detailed holdings breakdown by index${extendedColors.reset}`);
  console.log(`${extendedColors.blue}• GET /indices-performance - Historical ROI tracking${extendedColors.reset}\n`);
  
  console.log(`${extendedColors.cyan}${extendedColors.bright}💡 Integration Benefits:${extendedColors.reset}`);
  console.log(`${extendedColors.cyan}• Portfolio diversification insights through index analysis${extendedColors.reset}`);
  console.log(`${extendedColors.cyan}• Real-time holdings tracking with weights and prices${extendedColors.reset}`);
  console.log(`${extendedColors.cyan}• Historical performance analysis for trend identification${extendedColors.reset}`);
  console.log(`${extendedColors.cyan}• Cross-index comparison capabilities${extendedColors.reset}\n`);
}

demoIndicesEndpoints().catch(console.error); 