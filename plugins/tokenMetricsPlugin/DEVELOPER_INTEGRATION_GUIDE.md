# 🚀 Developer Integration Guide

## Quick Integration Test ✅

**VERIFIED**: Developers can successfully integrate this plugin into their AI agents in **5 simple steps**!

---

## 📋 Integration Steps

### 1️⃣ **Install the Plugin**

```bash
npm install tokenmetrics-virtuals-plugin
```

### 2️⃣ **Set Up Environment Variables**

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your API keys:
TOKENMETRICS_API_KEY=tm-your-tokenmetrics-api-key-here
GAME_API_KEY=your-game-api-key-here
```

### 3️⃣ **Import and Initialize**

```typescript
import { config } from "dotenv";
config({ path: "./.env" });
import TokenMetricsPlugin from "tokenmetrics-virtuals-plugin";
import { GameAgent } from "@virtuals-protocol/game";

// Initialize the plugin
const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});
```

### 4️⃣ **Create Your AI Agent**

```typescript
// Create AI agent with Token Metrics capabilities
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "🚀 Crypto Analysis Agent",
  goal: "Provide comprehensive cryptocurrency market analysis and trading insights",
  description: "You are an AI agent specialized in cryptocurrency analysis. Use Token Metrics API to help users make informed trading decisions! 📊",
  workers: [tokenMetricsPlugin.getWorker({})], // Include ALL 17 functions
});
```

### 5️⃣ **Initialize and Use**

```typescript
(async () => {
  // Optional: Set up logging
  agent.setLogger((agent, message) => {
    console.log(`🤖 [${agent.name}] ${message}`);
  });

  await agent.init();

  // Your agent now has 17 TokenMetrics functions!
  const result = await agent.run("Show me the available tokens");
  console.log(result);
})();
```

---

## 🎛️ Advanced Integration Options

### **Custom Function Selection**

```typescript
// Use only specific functions
const customWorker = tokenMetricsPlugin.getWorker({
  functions: [
    tokenMetricsPlugin.getTokens,
    tokenMetricsPlugin.getPriceData,
    tokenMetricsPlugin.getTradingSignals,
  ],
});

const focusedAgent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "Trading Signals Agent",
  goal: "Provide focused trading signals and price data",
  description: "Specialized agent for trading signals",
  workers: [customWorker],
});
```

### **Custom Configuration**

```typescript
// Advanced plugin configuration
const advancedPlugin = new TokenMetricsPlugin({
  id: "my_custom_tokenmetrics",
  name: "My Custom Token Metrics Worker",
  description: "Custom TokenMetrics integration for my specific use case",
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
    baseApiUrl: "https://api.tokenmetrics.com/v2", // Optional custom endpoint
  },
});
```

### **Environment Configuration**

```typescript
// Add custom environment variables
const workerWithEnv = tokenMetricsPlugin.getWorker({
  getEnvironment: async () => ({
    customSetting: "value",
    userPreferences: "advanced_analysis",
    riskTolerance: "moderate",
  }),
});
```

---

## 🎯 What Your Agent Can Do

Once integrated, your AI agent will have access to **17 powerful functions**:

### **📊 Core Data Functions**
- `getTokens` - Get supported cryptocurrencies and TOKEN_IDs
- `getTopMarketCapTokens` - Retrieve top cryptos by market cap
- `getPriceData` - Get current market prices

### **📈 Trading & Investment Analysis**
- `getTraderGrades` - AI-powered trader performance grades
- `getInvestorGrades` - Investor performance analysis
- `getTradingSignals` - Buy/sell/hold recommendations
- `getMarketMetrics` - Comprehensive market analysis

### **🔬 Advanced Analytics**
- `getQuantmetrics` - Quantitative trading metrics
- `getHourlyOhlcv` - Hourly OHLC data with volume
- `getDailyOhlcv` - Daily OHLC with technical indicators

### **🤖 AI & Research**
- `getAiReports` - AI-generated market reports
- `getTokenMetricsAi` - Custom AI analysis queries
- `getSentiments` - Market sentiment analysis
- `getCryptoInvestors` - Crypto investor performance

### **📈 Technical Analysis**
- `getResistanceSupport` - Resistance and support levels
- `getScenarioAnalysis` - Scenario-based projections
- `getCorrelation` - Crypto correlation analysis

---

## 💬 Example Queries Your Agent Can Handle

Once integrated, users can ask your agent:

- 💰 *"What's the price of Bitcoin?"*
- 📊 *"Show me trading signals for the top 10 cryptocurrencies"*
- 🏆 *"Get trader grades for Ethereum"*
- 😊 *"Analyze market sentiment for DeFi tokens"*
- 📝 *"Generate an AI report for Solana"*
- 🔗 *"Show me correlation analysis between Bitcoin and altcoins"*
- 🎯 *"What are the resistance and support levels for BTC?"*
- 🔮 *"Give me scenario analysis for the next bull market"*

---

## 🧪 Testing Your Integration

### **Quick Test**
```bash
npm run test:setup
```

### **Test Individual Functions**
```bash
npm run example:tokens
npm run example:price-data
npm run example:trading-signals
```

### **Interactive Testing**
```bash
npm run chat
```

---

## 🛡️ Built-in Features

Your integration automatically includes:

- ✅ **Error Handling**: Graceful API error management
- ✅ **Rate Limiting**: Automatic request throttling
- ✅ **Retry Logic**: Exponential backoff for failed requests
- ✅ **Input Validation**: Parameter validation for all functions
- ✅ **TypeScript Support**: Full type safety and IntelliSense
- ✅ **Logging**: Comprehensive request/response logging

---

## 🎉 Integration Success Checklist

- [ ] Plugin installed via npm
- [ ] Environment variables configured
- [ ] Plugin imported and initialized
- [ ] GameAgent created with plugin worker
- [ ] Agent initialized successfully
- [ ] All 17 functions available
- [ ] Agent responds to crypto queries

**✅ If all boxes are checked, your integration is complete!**

---

## 🆘 Troubleshooting

### **Common Issues:**

1. **Missing API Keys**
   ```bash
   # Ensure .env file has both keys:
   TOKENMETRICS_API_KEY=tm-your-key-here
   GAME_API_KEY=your-game-key-here
   ```

2. **Import Errors**
   ```typescript
   // Use correct import syntax:
   import TokenMetricsPlugin from "tokenmetrics-virtuals-plugin";
   ```

3. **Agent Initialization**
   ```typescript
   // Always await agent.init():
   await agent.init();
   ```

### **Need Help?**
- 📚 Check the comprehensive examples in `/src/examples/`
- 🧪 Run the test suite: `npm run test:all`
- 💬 Try the interactive chat: `npm run chat`

---

**🚀 Your AI agent is now powered by Token Metrics! Happy coding!** 