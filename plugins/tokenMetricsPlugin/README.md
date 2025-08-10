# 🚀 Token Metrics Plugin for Virtuals Game

> 🎯 **Supercharge your G.A.M.E agents with AI-powered cryptocurrency analysis!**

The Token Metrics plugin seamlessly empowers G.A.M.E agents with comprehensive cryptocurrency analysis capabilities using the Token Metrics API, enabling the retrieval of AI-powered market data, trading signals, and investment insights without introducing any additional complexity.

---

## ✨ Features

- 📊 **Comprehensive Token Data**: Access to 21 Token Metrics API endpoints
- 🤖 **AI-Powered Analysis**: Get AI reports, sentiment analysis, and market insights
- 📈 **Trading Intelligence**: Retrieve trader grades, investor grades, and trading signals
- 📉 **Market Analytics**: Access quantmetrics, OHLCV data, and correlation analysis
- 📊 **Crypto Indices**: Track crypto indices, holdings, and performance data
- ⚡ **Real-time Data**: Current prices, market metrics, and resistance/support levels
- 💬 **Interactive Chat Interface**: Built-in chat system for testing and exploration
- 🛡️ **Robust Error Handling**: Built-in error handling and rate limiting

---

## 🔧 Available Functions

### 📋 Core Data Functions
| Function | Description | 🎯 Purpose |
|----------|-------------|-----------|
| `getTokens` | Get supported cryptocurrencies and TOKEN_IDs | 🪙 Token Discovery |
| `getTopMarketCapTokens` | Retrieve top cryptos by market cap | 👑 Market Leaders |
| `getPriceData` | Get current market prices | 💰 Price Tracking |

### 📊 Trading & Investment Analysis
| Function | Description | 🎯 Purpose |
|----------|-------------|-----------|
| `getTraderGrades` | AI-powered trader performance grades | 🏆 Performance Analysis |
| `getInvestorGrades` | Investor performance analysis | 🎯 Investment Insights |
| `getTradingSignals` | Buy/sell/hold recommendations | 📡 Trading Signals |
| `getHourlyTradingSignals` | Hourly AI trading signals with confidence | ⏰ Real-time Signals |
| `getMarketMetrics` | Comprehensive market analysis | 📊 Market Overview |

### 🔬 Advanced Analytics
| Function | Description | 🎯 Purpose |
|----------|-------------|-----------|
| `getQuantmetrics` | Quantitative trading metrics | 🧮 Quant Analysis |
| `getHourlyOhlcv` | Hourly OHLC data with volume | ⏰ Short-term Data |
| `getDailyOhlcv` | Daily OHLC with technical indicators | 📅 Long-term Data |

### 🤖 AI & Research
| Function | Description | 🎯 Purpose |
|----------|-------------|-----------|
| `getAiReports` | AI-generated market reports | 📝 Research Reports |
| `getTokenMetricsAi` | Custom AI analysis queries | 🧠 Custom Analysis |
| `getSentiments` | Market sentiment analysis | 😊 Sentiment Tracking |
| `getCryptoInvestors` | Crypto investor performance | 💼 Investor Data |

### 📈 Technical Analysis
| Function | Description | 🎯 Purpose |
|----------|-------------|-----------|
| `getResistanceSupport` | Resistance and support levels | 🎯 Key Levels |
| `getScenarioAnalysis` | Scenario-based projections | 🔮 Future Scenarios |
| `getCorrelation` | Crypto correlation analysis | 🔗 Relationship Analysis |

### 📊 Crypto Indices (NEW!)
| Function | Description | 🎯 Purpose |
|----------|-------------|-----------|
| `getIndices` | Get crypto indices with performance data | 📊 Index Overview |
| `getIndicesHoldings` | Get index portfolio composition and weights | 🏦 Portfolio Analysis |
| `getIndicesPerformance` | Get historical index performance and ROI | 📈 Performance Tracking |

---

## 🚀 Quick Start

### 📦 Installation

```bash
# Using npm
npm install tokenmetrics-virtuals-plugin

# Using yarn
yarn add tokenmetrics-virtuals-plugin
```

### 🔑 Environment Setup

Set up your environment variables:

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your API keys
export TOKENMETRICS_API_KEY="your-tokenmetrics-api-key"
export GAME_API_KEY="your-game-api-key"
```

**Required Environment Variables:**
- `TOKENMETRICS_API_KEY`: Your Token Metrics API key (get one from [Token Metrics](https://tokenmetrics.com/api))
- `GAME_API_KEY`: Your Virtuals Protocol GAME API key

> 💡 **How to Get API Keys:** 
> 
> **🔑 Token Metrics API Key:**
> 1. Visit [Token Metrics.com](https://tokenmetrics.com/api)
> 2. Sign up for an account or log in
> 3. Navigate to API section in your dashboard
> 4. Generate your API key (starts with `tm-`)
> 
> **🎮 GAME API Key:**
> 1. Visit [Virtuals Protocol](https://virtuals.io)
> 2. Create an account and access the developer portal
> 3. Generate your GAME framework API key
> 
> **📧 Need Help?** Contact Token Metrics support for API access assistance.

### ✅ Installation Verification

Verify your installation works correctly:

```bash
# Test the plugin setup
npm run test:setup

# Run a quick example
npm run example:tokens
```

### 💻 Basic Usage

```typescript
import { config } from "dotenv";
config({ path: "./.env" });
import TokenMetricsPlugin from "tokenmetrics-virtuals-plugin";
import { GameAgent } from "@virtuals-protocol/game";

// 🔧 Initialize the plugin
const tokenMetricsPlugin = new TokenMetricsPlugin({
  apiClientConfig: {
    apiKey: process.env.TOKENMETRICS_API_KEY!,
  },
});

// 🤖 Create your crypto analysis agent
const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
  name: "🚀 Crypto Analysis Agent",
  goal: "Provide comprehensive cryptocurrency market analysis and trading insights",
  description: "You are an AI agent specialized in cryptocurrency analysis. Use Token Metrics API to help users make informed trading decisions! 📊",
  workers: [tokenMetricsPlugin.getWorker({})], // Include ALL 21 functions
});

// 🎯 Run your agent
(async () => {
  // 📝 Optional: Set up logging
  agent.setLogger((agent, message) => {
    console.log(`🤖 [${agent.name}] 📢`);
    console.log(message);
  });

  await agent.init();

  // 🚀 Example: Get token list
  const result = await agent.run("Show me the available tokens");
  console.log(result);
})();
```

### ⚙️ Custom Configuration

```typescript
// 🎛️ Customize your worker
const customWorker = tokenMetricsPlugin.getWorker({
  functions: [
    tokenMetricsPlugin.getTokens,
    tokenMetricsPlugin.getPriceData,
    tokenMetricsPlugin.getTradingSignals,
    tokenMetricsPlugin.getIndices,
    tokenMetricsPlugin.getIndicesHoldings,
  ],
  getEnvironment: async () => ({
    customSetting: "value",
  }),
});
```

### 📋 Configuration Options

```typescript
interface ITokenMetricsPluginOptions {
  id?: string;           // 🆔 Custom worker ID
  name?: string;         // 📛 Custom worker name  
  description?: string;  // 📝 Custom worker description
  apiClientConfig: {
    apiKey: string;      // 🔑 Token Metrics API key
    baseApiUrl?: string; // 🌐 Custom API endpoint (optional)
  };
}
```

---

## 🛠️ Development

### 🏗️ Setup

```bash
# 1️⃣ Clone the repository
git clone <repository-url>

# 2️⃣ Install dependencies
npm install

# 3️⃣ Set up environment variables
cp env.example .env
# Edit .env file with your API keys:
# TOKENMETRICS_API_KEY=tm-your-tokenmetrics-api-key-here
# GAME_API_KEY=your-game-api-key-here

# 4️⃣ Build the plugin
npm run build

# 5️⃣ Run the example
npm run example:full-agent
# or
npm run dev
```

---

## 💬 Interactive Chat Interface

Launch the interactive terminal for testing:

```bash
npm run chat
```

### 🎮 Example Chat Commands

- 💰 `"What's the price of Bitcoin?"`
- 📊 `"Show me trading signals"`
- ⏰ `"Show me hourly trading signals"` (NEW!)
- 🏆 `"Get trader grades for top tokens"`
- 😊 `"Analyze market sentiment"`
- 📝 `"Show me AI reports"`
- 🔗 `"Get correlation analysis"`
- 📊 `"Show me crypto indices data"` (NEW!)
- 🏦 `"What are the holdings of crypto index 1?"` (NEW!)
- 📈 `"Show me performance data for crypto index 1"` (NEW!)

---

## 🎯 Examples & Testing

### 📊 Basic Token Data
```bash
npm run example:tokens          # 🪙 Get token list
npm run example:price-data      # 💰 Get price data
npm run example:top-market-cap  # 👑 Get top market cap tokens
```

### 📈 Trading Analysis
```bash
npm run example:trader-grades         # 🏆 Get trader performance grades
npm run example:investor-grades       # 🎯 Get investor analysis
npm run example:trading-signals       # 📡 Get trading recommendations
npm run example:hourly-trading-signals # ⏰ Get hourly AI trading signals (NEW!)
```

### 📉 Market Analytics
```bash
npm run example:market-metrics   # 📊 Get market analysis
npm run example:quantmetrics     # 🧮 Get quantitative metrics
npm run example:hourly-ohlcv     # ⏰ Get hourly price data
npm run example:daily-ohlcv      # 📅 Get daily price data
```

### 🤖 AI & Research
```bash
npm run example:ai-reports       # 📝 Get AI-generated reports
npm run example:tokenmetrics-ai  # 🧠 Query Token Metrics AI
npm run example:sentiments       # 😊 Get sentiment analysis
npm run example:crypto-investors # 💼 Get crypto investor data
```

### 📈 Technical Analysis
```bash
npm run example:resistance-support  # 🎯 Get support/resistance levels
npm run example:scenario-analysis   # 🔮 Get scenario projections
npm run example:correlation         # 🔗 Get correlation analysis
```

### 📊 Crypto Indices (NEW!)
```bash
npm run example:indices             # 📊 Get crypto indices overview
npm run example:indices-holdings    # 🏦 Get index portfolio composition
npm run example:indices-performance # 📈 Get historical index performance
```

### 🧪 Testing Suite

```bash
npm run test:all                 # 🧪 Run all tests
npm run test:individual          # 🔍 Test individual functions
npm run test:integration         # 🔄 Test integration scenarios
```

### 🎮 Demo Scenarios

```bash
npm run demo:trading-bot         # 🤖 Trading bot simulation
npm run demo:research-agent      # 🔬 Research agent demo
npm run demo:new-endpoints       # ✨ New endpoints demonstration
npm run demo:indices             # 📊 Crypto indices demo (NEW!)
```

---

## 📚 API Reference

### 🔧 Core Functions

#### 🪙 getTokens(args)
Get the list of supported cryptocurrencies.

**Parameters:**
- `limit` (number): Number of items to return (default: 50)
- `page` (number): Page number for pagination (default: 1)
- `token_name` (string): Comma-separated crypto asset names
- `symbol` (string): Comma-separated token symbols
- `category` (string): Comma-separated category names

#### 💰 getPriceData(args)
Get current market prices for specified tokens.

**Parameters:**
- `token_id` (string): Comma-separated Token IDs (required)

#### 📡 getTradingSignals(args)
Get AI-powered trading recommendations.

**Parameters:**
- `token_id` (string): Comma-separated Token IDs
- `limit` (number): Number of signals to return
- `page` (number): Page number for pagination

### 🔬 Advanced Functions

#### 🧮 getQuantmetrics(args)
Get comprehensive quantitative trading metrics.

**Parameters:**
- `token_id` (string): Comma-separated Token IDs
- `limit` (number): Number of results to return
- `page` (number): Page number for pagination

#### 📝 getAiReports(args)
Get AI-generated comprehensive market reports.

**Parameters:**
- `token_id` (string): Comma-separated Token IDs
- `limit` (number): Number of reports to return
- `page` (number): Page number for pagination

### 📊 Crypto Indices Functions (NEW!)

#### 📊 getIndices(args)
Get crypto indices with performance data.

**Parameters:**
- `limit` (number): Number of indices to return (default: 50)
- `page` (number): Page number for pagination (default: 1)

#### 🏦 getIndicesHoldings(args)
Get current holdings of a given index with weights.

**Parameters:**
- `id` (string): Index ID (required)
- `limit` (number): Number of holdings to return (default: 50)
- `page` (number): Page number for pagination (default: 1)

#### 📈 getIndicesPerformance(args)
Get historical performance data for an index with ROI over time.

**Parameters:**
- `id` (string): Index ID (required)
- `limit` (number): Number of performance records to return (default: 50)
- `page` (number): Page number for pagination (default: 1)

> 📖 **Complete Documentation**: [Token Metrics API Documentation](https://developers.tokenmetrics.com/)

---

## 🛡️ Error Handling

The plugin includes comprehensive error handling:

- ⏱️ **Rate Limiting**: Automatic rate limiting with configurable delays
- 🔄 **Retry Logic**: Exponential backoff for failed requests
- ✅ **Validation**: Input validation for all parameters
- 🎯 **Graceful Degradation**: Fallback responses for API failures

---

## 🔧 Troubleshooting

### **🚨 Common Issues & Solutions**

#### **1. API Key Issues**
```bash
# ❌ Error: "Invalid API key" or "Unauthorized"
# ✅ Solution:
# 1. Verify your Token Metrics API key is correct
# 2. Check that your API key starts with 'tm-'
# 3. Ensure no extra spaces in your .env file
export TOKENMETRICS_API_KEY="tm-your-actual-key-here"
```

#### **2. Environment Variables Not Loading**
```bash
# ❌ Error: "API key is undefined"
# ✅ Solution:
# 1. Ensure .env file is in the correct location
# 2. Check that dotenv is properly configured
import { config } from "dotenv";
config({ path: "./.env" }); // Must be before other imports
```

#### **3. Network/Connection Issues**
```bash
# ❌ Error: "Network timeout" or "Connection refused"
# ✅ Solutions:
# 1. Check your internet connection
# 2. Verify Token Metrics API is accessible
curl -H "x-api-key: your-key" https://api.tokenmetrics.com/v2/tokens

# 3. Check for firewall/proxy issues
# 4. Try with a different network
```

#### **4. Rate Limiting**
```bash
# ❌ Error: "Rate limit exceeded" or "Too many requests"
# ✅ Solutions:
# 1. Reduce request frequency
# 2. Implement delays between calls
# 3. Use pagination with smaller limits
# 4. Contact Token Metrics for higher rate limits
```

#### **5. Invalid Token IDs**
```bash
# ❌ Error: "Token not found" or "Invalid token_id"
# ✅ Solution:
# 1. First get valid token IDs:
npm run example:tokens

# 2. Use the TOKEN_ID from the response (e.g., 3375 for BTC)
# 3. Ensure comma-separated format: "3375,3306"
```

#### **6. Build/TypeScript Issues**
```bash
# ❌ Error: TypeScript compilation errors
# ✅ Solutions:
# 1. Ensure TypeScript is installed
npm install -g typescript

# 2. Check Node.js version (requires 16+)
node --version

# 3. Clear and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

#### **7. GAME Framework Integration Issues**
```bash
# ❌ Error: "GameAgent not found" or GAME-related errors
# ✅ Solutions:
# 1. Verify GAME API key is set
export GAME_API_KEY="your-game-api-key"

# 2. Check @virtuals-protocol/game version
npm list @virtuals-protocol/game

# 3. Ensure proper initialization order
await agent.init(); // Must be called before agent.run()
```

### **🔍 Debug Mode**

Enable detailed logging for troubleshooting:

```typescript
// Enable debug logging
const agent = new GameAgent(process.env.GAME_API_KEY!, {
  // ... config
});

agent.setLogger((agent, message) => {
  console.log(`🐛 [DEBUG] ${agent.name}:`);
  console.log(message);
});
```

### **📊 Testing Your Setup**

Run these commands to verify everything works:

```bash
# 1. Test environment setup
npm run test:setup

# 2. Test individual functions
npm run test:individual

# 3. Test integration
npm run test:integration

# 4. Interactive testing
npm run chat
```

### **🆘 Getting Help**

If you're still having issues:

1. **📋 Check Examples**: Review our 22+ example files
2. **🧪 Run Tests**: Use our comprehensive test suite
3. **💬 Interactive Mode**: Try `npm run chat` for hands-on testing
4. **📖 Documentation**: Check [Token Metrics API Docs](https://developers.tokenmetrics.com/)
5. **🐛 Report Issues**: Create a GitHub issue with:
   - Error message
   - Your environment (Node.js version, OS)
   - Steps to reproduce
   - Relevant code snippets

### **⚡ Performance Tips**

- **Batch Requests**: Use comma-separated token IDs instead of multiple calls
- **Pagination**: Use appropriate `limit` and `page` parameters
- **Caching**: Cache responses for frequently requested data
- **Error Handling**: Always wrap API calls in try-catch blocks

---

## 🧪 Dev Testing

### **📸 Screenshots & Visual Demonstrations**

#### **🚀 Plugin Installation & Setup**
*Visual demonstration of successful plugin installation and initial setup process*

![Plugin Installation Setup - Step 1](screenshots/Setup-1.png)
> **Initial Setup**: Shows the plugin installation process, dependency setup, and environment configuration.

![Plugin Installation Setup - Step 2](screenshots/Setup-2.png)
> **Setup Verification**: Complete setup verification showing successful build, test execution, and plugin readiness confirmation.

#### **💬 Interactive Chat Interface**
*Screenshots of the interactive terminal chat interface in action*

![Interactive Chat Interface - Main](screenshots/Chat-1.png)
> **Chat Interface**: The main Token Metrics AI chat interface showing the welcome screen, available commands, and user interaction prompts.

![Interactive Chat Interface - Responses](screenshots/Chat-2.png)
> **AI Responses**: Example of comprehensive AI responses with color-coded output, data visualization, and detailed analysis results from Token Metrics API.

#### **📊 Crypto Market Sentiment Analysis**
*Visual examples of sentiment analysis output and market data visualization*

![Market Sentiment Analysis](screenshots/Market%20Sentiment%20Example.png)
> **Sentiment Dashboard**: Real-time market sentiment analysis with color-coded indicators, sentiment scores, confidence levels, and comprehensive market mood visualization.

#### **🏦 Quantitative Metrics Analysis**
*Advanced quantitative analysis visualization and performance metrics*

![Quantitative Metrics Dashboard](screenshots/Quantmetics%20Example.png)
> **Quant Analysis**: Advanced quantitative metrics including Sharpe ratios, volatility analysis, drawdown calculations, risk-adjusted returns with visual progress bars, and color-coded performance indicators.

### **🧪 Testing Steps**

#### **1. Basic Setup Testing**
```bash
npm install tokenmetrics-virtuals-plugin
npm run test:setup
# Expected: All checks pass ✅
```

#### **2. Function Testing**
```bash
npm run test:individual
# Expected: All 21 functions execute successfully
```

#### **3. Integration Testing**
```bash
npm run test:integration
# Expected: GAME framework integration works
```

#### **4. Interactive Testing**
```bash
npm run chat
# Test various queries and verify responses
```

### **📊 Performance Benchmarks**

```
Function Performance (Average Response Time):
• getTokens(): ~245ms
• getPriceData(): ~180ms  
• getTradingSignals(): ~320ms
• getTokenMetricsAi(): ~850ms
• getIndices(): ~210ms

Memory Usage: ~45MB (typical)
Rate Limiting: 60 requests/minute (within limits)
```

### **🐛 Error Handling Examples**

#### **Invalid API Key**
```bash
❌ Invalid API key provided
🔧 Solution: Verify API key format and permissions
```

#### **Network Issues**
```bash
❌ Network timeout
🔄 Automatic retry with exponential backoff
✅ Connection restored
```

### **🖥️ Cross-Platform Testing**

- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu 20.04+)  
- ✅ **Windows** (10/11)
- ✅ **Node.js** versions: 16.x, 18.x, 20.x

---

## 🤝 Contributing

We welcome contributions to the Token Metrics Virtuals Plugin! Here's how to contribute effectively:

### **🚀 Quick Start for Contributors**

1. **🍴 Fork & Clone**
   ```bash
   git clone https://github.com/your-username/tokenmetrics-virtuals-plugin.git
   cd tokenmetrics-virtuals-plugin
   ```

2. **📦 Install Dependencies**
   ```bash
   npm install
   ```

3. **🔑 Setup Environment**
   ```bash
   cp env.example .env
   # Add your API keys to .env file
   ```

4. **✅ Verify Setup**
   ```bash
   npm run test:setup
   npm run build
   ```

### **🎯 Contribution Types**

#### **🔧 Bug Fixes**
- Fix API integration issues
- Resolve TypeScript compilation errors
- Improve error handling
- Fix documentation inconsistencies

#### **✨ New Features**
- Add new Token Metrics API endpoints
- Enhance response formatting
- Improve chat interface functionality
- Add new testing scenarios

#### **📚 Documentation**
- Improve README sections
- Add more usage examples
- Enhance API documentation
- Create tutorial content

#### **🧪 Testing**
- Add test cases for new functions
- Improve test coverage
- Create integration test scenarios
- Add performance benchmarks

### **📋 Development Guidelines**

#### **🏗️ Code Standards**
- **TypeScript**: All code must be properly typed
- **ESLint**: Follow existing linting rules
- **Formatting**: Use consistent code formatting
- **Comments**: Document complex logic and API integrations

#### **🎯 Plugin-Specific Requirements**
- **GAME Integration**: All new functions must use `GameFunction` pattern
- **Error Handling**: Implement proper `ExecutableGameFunctionResponse` handling
- **API Consistency**: Follow existing Token Metrics API patterns
- **Response Formatting**: Use color-coded console output for user-friendly responses

#### **🧪 Testing Requirements**
- **Unit Tests**: Test individual functions
- **Integration Tests**: Test GAME framework integration
- **Example Files**: Create example usage files
- **Documentation**: Update README with new features

### **📝 Pull Request Process**

#### **Before Submitting:**
1. **🔍 Test Your Changes**
   ```bash
   npm run test:all
   npm run build
   npm run example:your-new-feature
   ```

2. **📖 Update Documentation**
   - Update README.md if adding new features
   - Add example files for new functions
   - Update API reference section
   - Update CHANGELOG.md

3. **✅ Code Quality Checks**
   ```bash
   # Ensure TypeScript compiles
   npm run build
   
   # Run all tests
   npm run test:all
   
   # Test examples work
   npm run example:tokens
   ```

#### **PR Requirements:**
- **📋 Clear Description**: Explain what your PR adds/fixes
- **🧪 Testing Evidence**: Include screenshots, logs, or test results
- **📚 Documentation**: Update relevant documentation
- **🔗 Issue Reference**: Link to related issues if applicable

### **🎯 Specific Areas for Contribution**

#### **🔥 High Priority**
- **New API Endpoints**: Add missing Token Metrics endpoints
- **Enhanced Error Handling**: Improve error messages and recovery
- **Performance Optimization**: Optimize API calls and response processing
- **Testing Coverage**: Expand test scenarios

#### **💡 Enhancement Ideas**
- **Real-time Updates**: WebSocket integration for live data
- **Data Visualization**: Add chart/graph generation capabilities
- **Caching Layer**: Implement intelligent response caching
- **Batch Processing**: Optimize multiple token requests

#### **📖 Documentation Needs**
- **Video Tutorials**: Create setup and usage videos
- **Advanced Examples**: Complex trading bot scenarios
- **API Migration Guides**: Help users migrate from other APIs
- **Best Practices**: Performance and usage optimization guides

### **🛠️ Development Workflow**

1. **🌟 Create Feature Branch**
   ```bash
   git checkout -b feature/new-endpoint-integration
   ```

2. **💻 Develop & Test**
   ```bash
   # Make your changes
   # Test thoroughly
   npm run test:individual
   npm run example:your-feature
   ```

3. **📝 Document Changes**
   ```bash
   # Update README.md
   # Add example files
   # Update CHANGELOG.md
   ```

4. **🔄 Submit PR**
   ```bash
   git add .
   git commit -m "feat: add new Token Metrics endpoint integration"
   git push origin feature/new-endpoint-integration
   ```

### **🎖️ Recognition**

Contributors will be:
- **📜 Listed in CHANGELOG.md**
- **🌟 Credited in README.md**
- **🏆 Recognized in release notes**
- **💬 Mentioned in community channels**

### **📞 Getting Help**

Need help contributing?
- **💬 Discussions**: Use GitHub Discussions for questions
- **🐛 Issues**: Create issues for bugs or feature requests
- **📧 Direct Contact**: Reach out to maintainers
- **📖 Documentation**: Check our comprehensive guides

### **🔄 Review Process**

1. 🍴 Fork the repository
2. 🌟 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔁 Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

Need help? We've got you covered:

- 🐛 **Bug Reports**: Create an issue on GitHub
- 🔧 **API Questions**: Contact Token Metrics support
- 📚 **Documentation**: Check our comprehensive examples and tests
- 💬 **Community**: Join our discussions

---

## 📈 Changelog

### 🎉 v1.0.0
- ✨ Initial release with 21 Token Metrics API endpoints
- 🆕 **NEW: Hourly Trading Signals** - Real-time AI trading recommendations updated hourly
- 💬 Interactive chat interface
- 📚 Comprehensive examples and tests
- 🛡️ Built-in error handling and rate limiting
- 🔷 Full TypeScript support
- 📊 Crypto indices tracking with holdings and performance data

---

## 📋 Quick Reference

### **🚀 Essential Commands**
```bash
# Installation
npm install tokenmetrics-virtuals-plugin

# Setup
cp env.example .env

# Test installation
npm run test:setup

# Interactive testing
npm run chat

# Build for production
npm run build
```

### **⚡ Quick Integration Template**
```typescript
import { config } from "dotenv";
config({ path: "./.env" });
import TokenMetricsPlugin from "tokenmetrics-virtuals-plugin";
import { GameAgent } from "@virtuals-protocol/game";

const plugin = new TokenMetricsPlugin({
  apiClientConfig: { apiKey: process.env.TOKENMETRICS_API_KEY! }
});

const agent = new GameAgent(process.env.GAME_API_KEY!, {
  name: "Crypto AI Agent",
  goal: "Provide crypto analysis",
  workers: [plugin.getWorker({})]
});

await agent.init();
```

### **🎯 Most Used Functions**
- `getTokens()` - Get all supported cryptocurrencies
- `getPriceData(token_id)` - Get current prices
- `getTradingSignals()` - Get buy/sell recommendations
- `getTokenMetricsAi(message)` - Chat with Token Metrics AI
- `getMarketMetrics()` - Get market overview
- `getIndices()` - Get crypto indices data (NEW!)
- `getIndicesHoldings(id)` - Get index portfolio composition (NEW!)

---

<div align="center">

**🚀 Ready to revolutionize your crypto analysis?**

[📖 Documentation](https://developers.tokenmetrics.com/)

---

*Made with ❤️ by the Token Metrics team*

</div>
