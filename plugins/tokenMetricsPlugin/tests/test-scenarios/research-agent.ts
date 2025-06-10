import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../../index";
import { colors } from '../test-setup';

// This demonstrates how a user would create a research agent
async function createResearchAgent() {
  console.log(`${colors.bright}🔬 Creating TokenMetrics Research Agent${colors.reset}`);
  console.log(`${colors.bright}=====================================\n${colors.reset}`);
  
  const tokenMetricsPlugin = new TokenMetricsPlugin({
    apiClientConfig: {
      apiKey: process.env.TOKENMETRICS_API_KEY!,
    },
  });

  // Create a comprehensive research agent
  const researchAgent = new GameAgent(process.env.GAME_API_KEY ?? "", {
    name: "TokenMetrics Crypto Research Agent",
    goal: "Conduct comprehensive cryptocurrency research using AI-powered analysis, investor grades, and detailed reports for long-term investment decisions.",
    description:
      "You are an advanced crypto research agent powered by TokenMetrics AI. You conduct deep fundamental analysis, evaluate long-term investment potential, generate comprehensive reports, and analyze institutional investor behavior. You focus on technology assessment, market positioning, and strategic investment opportunities.",
    workers: [
      tokenMetricsPlugin.getWorker({
        functions: [
          tokenMetricsPlugin.getInvestorGrades,   // Long-term analysis
          tokenMetricsPlugin.getAiReports,        // Comprehensive research
          tokenMetricsPlugin.getCryptoInvestors,  // Institutional insights
          tokenMetricsPlugin.getQuantmetrics,     // Advanced analytics
          tokenMetricsPlugin.getTokens,           // Token database
          tokenMetricsPlugin.getTopMarketCapTokens, // Market leaders
        ],
      }),
    ],
  });

  researchAgent.setLogger((agent, message) => {
    console.log(`${colors.blue}[${agent.name}]${colors.reset} ${message}\n`);
  });

  console.log(`${colors.green}✅ Research agent created successfully!${colors.reset}`);
  console.log(`${colors.yellow}📋 Agent capabilities:${colors.reset}`);
  console.log(`   • Long-term investor grade analysis`);
  console.log(`   • Comprehensive AI-generated research reports`);
  console.log(`   • Institutional investor behavior analysis`);
  console.log(`   • Advanced quantitative metrics`);
  console.log(`   • Complete token database access`);
  console.log(`   • Market capitalization rankings`);
  console.log(`\n${colors.bright}🚀 Starting research agent... (Press Ctrl+C to stop)${colors.reset}\n`);

  await researchAgent.init();
  
  while (true) {
    await researchAgent.step({
      verbose: true,
    });
  }
}

createResearchAgent().catch(console.error);