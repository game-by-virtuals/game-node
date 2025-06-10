# Comprehensive Token Metrics Plugin Test Guide

## 🧪 **Complete Endpoint Testing - All 17 Endpoints**

### **📋 Core Data Endpoints (Direct API Access)**

#### **1. Tokens List** (`getTokens`)
```bash
npm run example:tokens
```
**What it does**: Get list of all supported cryptocurrencies with their TOKEN_IDs
**Use case**: Find token IDs for other API calls

#### **2. Top Market Cap Tokens** (`getTopMarketCapTokens`)
```bash
npm run example:top-market-cap
```
**What it does**: Get top cryptocurrencies by market capitalization
**Use case**: Identify market leaders and trending tokens

#### **3. Price Data** (`getPriceData`)
```bash
npm run example:price-data
```
**What it does**: Get current prices for specific token IDs
**Use case**: Real-time price monitoring

#### **4. Trader Grades** (`getTraderGrades`)
```bash
npm run example:trader-grades
```
**What it does**: AI-generated trading scores for tokens
**Use case**: Short-term trading decisions

#### **5. Investor Grades** (`getInvestorGrades`)
```bash
npm run example:investor-grades
```
**What it does**: Long-term investment ratings
**Use case**: Portfolio building and investment decisions

#### **6. Market Metrics** (`getMarketMetrics`)
```bash
npm run example:market-metrics
```
**What it does**: Overall market indicators and trends
**Use case**: Market timing and macro analysis

#### **7. Quantmetrics** (`getQuantmetrics`)
```bash
npm run example:quantmetrics
```
**What it does**: Quantitative analysis and metrics
**Use case**: Advanced technical analysis

#### **8. Hourly OHLCV** (`getHourlyOhlcv`)
```bash
npm run example:hourly-ohlcv
```
**What it does**: Hourly price data (Open, High, Low, Close, Volume)
**Use case**: Short-term technical analysis

#### **9. Daily OHLCV** (`getDailyOhlcv`)
```bash
npm run example:daily-ohlcv
```
**What it does**: Daily price data for longer-term analysis
**Use case**: Long-term trend analysis

#### **10. AI Reports** (`getAiReports`)
```bash
npm run example:ai-reports
```
**What it does**: Comprehensive AI-generated analysis reports
**Use case**: Deep fundamental analysis

#### **11. Crypto Investors** (`getCryptoInvestors`)
```bash
npm run example:crypto-investors
```
**What it does**: Institutional investor data and insights
**Use case**: Following smart money

#### **12. Resistance/Support** (`getResistanceSupport`)
```bash
npm run example:resistance-support
```
**What it does**: Technical analysis support and resistance levels
**Use case**: Entry/exit point identification

#### **13. Trading Signals** (`getTradingSignals`)
```bash
npm run example:trading-signals
```
**What it does**: AI-generated buy/sell recommendations
**Use case**: Automated trading decisions

---

### **🚀 New Advanced Endpoints (Chat Interface + Direct)**

#### **14. Token Metrics AI Chat** (`getTokenMetricsAi`)
```bash
npm run example:tokenmetrics-ai
```
**Chat prompts**:
- `"What is the next 100x coin?"`
- `"How does DeFi work?"`
- `"Should I invest in Bitcoin?"`
- `"AI explain blockchain technology"`

#### **15. Sentiment Analysis** (`getSentiments`)
```bash
npm run example:sentiments
```
**Chat prompts**:
- `"market sentiment"`
- `"sentiment analysis"`
- `"social media sentiment"`
- `"twitter sentiment"`

#### **16. Scenario Analysis** (`getScenarioAnalysis`)
```bash
npm run example:scenario-analysis
```
**Chat prompts**:
- `"price prediction"`
- `"scenario analysis"`
- `"bitcoin price scenarios"`
- `"price forecast"`

#### **17. Correlation Analysis** (`getCorrelation`)
```bash
npm run example:correlation
```
**Chat prompts**:
- `"correlations"`
- `"portfolio correlations"`
- `"diversification analysis"`
- `"token relationships"`

---

## 🎯 **Quick Test Sequence**

### **Method 1: Individual Examples (All 17)**
```bash
# Core data endpoints
npm run example:tokens
npm run example:top-market-cap
npm run example:price-data
npm run example:trader-grades
npm run example:investor-grades
npm run example:market-metrics
npm run example:quantmetrics
npm run example:hourly-ohlcv
npm run example:daily-ohlcv
npm run example:ai-reports
npm run example:crypto-investors
npm run example:resistance-support
npm run example:trading-signals

# New advanced endpoints
npm run example:tokenmetrics-ai
npm run example:sentiments
npm run example:scenario-analysis
npm run example:correlation
```

### **Method 2: Interactive Chat Interface**
```bash
npm run chat
```

**Then test these prompts in order:**

1. **Basic AI Chat**: `"What is Bitcoin?"`
2. **Trading Signals**: `"trading signals"`
3. **Sentiment**: `"market sentiment"`
4. **Price Prediction**: `"bitcoin price scenarios"`
5. **Correlations**: `"portfolio correlations"`
6. **Market Overview**: `"market overview"`

### **Method 3: Automated Test Suite**
```bash
# Run all tests
npm run test:all

# Individual test suites
npm run test:individual
npm run test:integration
```

### **Method 4: Demo Scenarios**
```bash
# Trading bot simulation
npm run demo:trading-bot

# Research agent simulation
npm run demo:research-agent

# New endpoints showcase
npm run demo:new-endpoints
```

---

## 📊 **Expected Results for Each Endpoint**

### **Tokens List**:
- List of 50+ cryptocurrencies
- TOKEN_ID, name, symbol, category
- Used to find IDs for other calls

### **Top Market Cap**:
- Top 10-100 tokens by market cap
- Current rankings and values
- Market leaders identification

### **Price Data**:
- Real-time prices for specified tokens
- Current market values
- Price change indicators

### **Trader/Investor Grades**:
- AI scores (0-100)
- Buy/sell/hold recommendations
- Risk assessments

### **Trading Signals**:
- Buy/sell signals with strength
- AI-generated recommendations
- Signal confidence levels

### **Sentiment Analysis**:
- Twitter, Reddit, News sentiment
- Sentiment scores and summaries
- Social media insights

### **Scenario Analysis**:
- Multiple timeframe predictions
- Bear/base/bull scenarios
- ROI calculations and insights

### **Correlations**:
- Token relationship analysis
- Portfolio diversification insights
- Risk management data

---

## ✅ **Success Indicators**

For each test, look for:
- ✅ **No errors** in API calls
- ✅ **Real-time data** with current timestamps
- ✅ **Proper formatting** (tables, charts, colors)
- ✅ **Correct endpoint URLs** in logs
- ✅ **Rate limiting** working (no 429 errors)
- ✅ **Data completeness** (all expected fields)

---

## 🚀 **Quick Start Testing**

**Start here for fastest comprehensive test:**

```bash
# 1. Test basic functionality
npm run example:tokens

# 2. Test price data
npm run example:price-data

# 3. Test trading features
npm run example:trading-signals

# 4. Test new advanced features
npm run chat
# Then type: "trading signals"
# Then type: "market sentiment"
# Then type: "bitcoin price scenarios"
```

This will verify all core functionality is working correctly! 