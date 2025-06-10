import { config } from "dotenv";
config({ path: "./.env" });
import { GameAgent } from "@virtuals-protocol/game";
import TokenMetricsPlugin from "../../index";
import { colors } from '../test-setup';

// This demonstrates how a user would create a trading bot using TokenMetrics
async function createTradingBot() {
  console.log(`${colors.bright}🤖 Creating TokenMetrics Trading Bot${colors.reset}`);
  console.log(`${colors.bright}==================================\n${colors.reset}`);
  
  const tokenMetricsPlugin = new TokenMetricsPlugin({
    apiClientConfig: {
      apiKey: process.env.TOKENMETRICS_API_KEY!,
    },
  });

  // Create a focused trading bot with specific functions
  const tradingBot = new GameAgent(process.env.GAME_API_KEY ?? "", {
    name: "TokenMetrics Trading Bot",
    goal: "Analyze cryptocurrencies for short-term trading opportunities using AI-powered grades and signals.",
    description:
      "You are a specialized crypto trading bot powered by TokenMetrics AI. You analyze trader grades, trading signals, and market metrics to identify optimal entry and exit points for short-term trades. You focus on technical analysis and momentum indicators.",
    workers: [
      tokenMetricsPlugin.getWorker({
        functions: [
          tokenMetricsPlugin.getTraderGrades,    // Short-term analysis
          tokenMetricsPlugin.getTradingSignals,  // Buy/sell signals  
          tokenMetricsPlugin.getMarketMetrics,   // Market conditions
          tokenMetricsPlugin.getPriceData,       // Current prices
          tokenMetricsPlugin.getResistanceSupport, // Technical levels
        ],
      }),
    ],
  });

  // Set up detailed logging to see what the bot is thinking
  tradingBot.setLogger((agent, message) => {
    console.log(`${colors.blue}[${agent.name}]${colors.reset} ${message}\n`);
  });

  console.log(`${colors.green}✅ Trading bot created successfully!${colors.reset}`);
  console.log(`${colors.yellow}📋 Bot capabilities:${colors.reset}`);
  console.log(`   • Trader grade analysis for short-term opportunities`);
  console.log(`   • AI-generated trading signals (buy/sell recommendations)`);
  console.log(`   • Market condition assessment`);
  console.log(`   • Real-time price data`);
  console.log(`   • Technical support and resistance levels`);
  console.log(`\n${colors.bright}🚀 Starting bot... (Press Ctrl+C to stop)${colors.reset}\n`);

  await tradingBot.init();
  
  // Run the bot - it will continuously analyze and provide trading insights
  while (true) {
    await tradingBot.step({
      verbose: true,
    });
  }
}

createTradingBot().catch(console.error);