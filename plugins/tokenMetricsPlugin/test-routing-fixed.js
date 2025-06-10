// Comprehensive test to verify routing logic for all 17 endpoints
const testPrompts = [
  // 1. TOKEN LIST
  { prompt: "Get list of all supported cryptocurrencies with their TOKEN_IDs", expected: "TOKENS" },
  { prompt: "token list", expected: "TOKENS" },
  { prompt: "supported cryptocurrencies", expected: "TOKENS" },
  
  // 2. TOP MARKET CAP
  { prompt: "Get top cryptocurrencies by market capitalization", expected: "TOP_MARKET_CAP" },
  { prompt: "top market cap", expected: "TOP_MARKET_CAP" },
  { prompt: "market leaders", expected: "TOP_MARKET_CAP" },
  { prompt: "biggest crypto", expected: "TOP_MARKET_CAP" },
  
  // 3. PRICE DATA
  { prompt: "current price", expected: "PRICE_DATA" },
  { prompt: "get price", expected: "PRICE_DATA" },
  { prompt: "bitcoin price", expected: "PRICE_DATA" },
  
  // 4. TRADER GRADES
  { prompt: "trader grades", expected: "TRADER_GRADES" },
  { prompt: "trading scores", expected: "TRADER_GRADES" },
  
  // 5. INVESTOR GRADES
  { prompt: "investor grades", expected: "INVESTOR_GRADES" },
  { prompt: "investment ratings", expected: "INVESTOR_GRADES" },
  
  // 6. TRADING SIGNALS
  { prompt: "trading signals", expected: "TRADING_SIGNALS" },
  { prompt: "buy sell signals", expected: "TRADING_SIGNALS" },
  { prompt: "show me signals", expected: "TRADING_SIGNALS" },
  
  // 7. MARKET METRICS
  { prompt: "market metrics", expected: "MARKET_METRICS" },
  { prompt: "market indicators", expected: "MARKET_METRICS" },
  { prompt: "market data", expected: "MARKET_METRICS" },
  
  // 8. SENTIMENT ANALYSIS
  { prompt: "market sentiment", expected: "SENTIMENT" },
  { prompt: "sentiment analysis", expected: "SENTIMENT" },
  { prompt: "twitter sentiment", expected: "SENTIMENT" },
  
  // 9. SCENARIO ANALYSIS
  { prompt: "price prediction", expected: "SCENARIO_ANALYSIS" },
  { prompt: "scenario analysis", expected: "SCENARIO_ANALYSIS" },
  { prompt: "price forecast", expected: "SCENARIO_ANALYSIS" },
  
  // 10. CORRELATION ANALYSIS
  { prompt: "correlations", expected: "CORRELATION" },
  { prompt: "portfolio correlations", expected: "CORRELATION" },
  { prompt: "diversification analysis", expected: "CORRELATION" },
  
  // 11. QUANTMETRICS
  { prompt: "quantitative analysis", expected: "QUANTMETRICS" },
  { prompt: "quant metrics", expected: "QUANTMETRICS" },
  { prompt: "technical analysis", expected: "QUANTMETRICS" },
  
  // 12. HOURLY OHLCV
  { prompt: "hourly data", expected: "HOURLY_OHLCV" },
  { prompt: "hourly chart", expected: "HOURLY_OHLCV" },
  { prompt: "hourly ohlcv", expected: "HOURLY_OHLCV" },
  
  // 13. DAILY OHLCV
  { prompt: "daily data", expected: "DAILY_OHLCV" },
  { prompt: "daily chart", expected: "DAILY_OHLCV" },
  { prompt: "daily ohlcv", expected: "DAILY_OHLCV" },
  
  // 14. AI REPORTS
  { prompt: "ai report", expected: "AI_REPORTS" },
  { prompt: "analysis report", expected: "AI_REPORTS" },
  { prompt: "detailed analysis", expected: "AI_REPORTS" },
  
  // 15. CRYPTO INVESTORS
  { prompt: "institutional investors", expected: "CRYPTO_INVESTORS" },
  { prompt: "smart money", expected: "CRYPTO_INVESTORS" },
  { prompt: "crypto investors", expected: "CRYPTO_INVESTORS" },
  
  // 16. RESISTANCE/SUPPORT
  { prompt: "resistance support", expected: "RESISTANCE_SUPPORT" },
  { prompt: "technical levels", expected: "RESISTANCE_SUPPORT" },
  { prompt: "support levels", expected: "RESISTANCE_SUPPORT" },
  
  // 17. MARKET OVERVIEW
  { prompt: "market overview", expected: "MARKET_OVERVIEW" },
  { prompt: "general market overview", expected: "MARKET_OVERVIEW" },
  
  // 18. AI CHAT
  { prompt: "What is the next 100x coin?", expected: "AI_CHAT" },
  { prompt: "How does DeFi work?", expected: "AI_CHAT" },
  { prompt: "Why is crypto volatile?", expected: "AI_CHAT" },
  { prompt: "Should I invest in Bitcoin?", expected: "AI_CHAT" },
];

function analyzePrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // 1. TOKEN LIST - /tokens endpoint (more specific matching)
  if ((lowerPrompt.includes('token') && (lowerPrompt.includes('list') || lowerPrompt.includes('id'))) || 
      (lowerPrompt.includes('supported') && lowerPrompt.includes('cryptocurrencies')) ||
      (lowerPrompt.includes('all') && lowerPrompt.includes('cryptocurrencies'))) {
    return 'TOKENS';
    
  // 2. TOP MARKET CAP - /top-market-cap endpoint  
  } else if ((lowerPrompt.includes('top') && (lowerPrompt.includes('market') || lowerPrompt.includes('cap') || lowerPrompt.includes('crypto'))) ||
             (lowerPrompt.includes('market') && lowerPrompt.includes('cap')) ||
             (lowerPrompt.includes('biggest') && lowerPrompt.includes('crypto')) ||
             lowerPrompt.includes('market leaders')) {
    return 'TOP_MARKET_CAP';
    
  // 3. PRICE DATA - /price-data endpoint
  } else if ((lowerPrompt.includes('price') && !lowerPrompt.includes('prediction') && !lowerPrompt.includes('forecast') && !lowerPrompt.includes('scenario')) ||
             lowerPrompt.includes('current price') ||
             (lowerPrompt.includes('get') && lowerPrompt.includes('price'))) {
    return 'PRICE_DATA';
    
  // 4. TRADER GRADES - /trader-grades endpoint (more specific matching)
  } else if ((lowerPrompt.includes('trader') && (lowerPrompt.includes('grade') || lowerPrompt.includes('score') || lowerPrompt.includes('rating'))) ||
             (lowerPrompt.includes('trading') && lowerPrompt.includes('score'))) {
    return 'TRADER_GRADES';
    
  // 5. INVESTOR GRADES - /investor-grades endpoint (more specific matching)
  } else if ((lowerPrompt.includes('investor') && (lowerPrompt.includes('grade') || lowerPrompt.includes('score') || lowerPrompt.includes('rating'))) ||
             (lowerPrompt.includes('investment') && lowerPrompt.includes('rating'))) {
    return 'INVESTOR_GRADES';
    
  // 6. TRADING SIGNALS - /trading-signals endpoint
  } else if (lowerPrompt.includes('signal') || 
             (lowerPrompt.includes('trading') && !lowerPrompt.includes('score')) || 
             lowerPrompt.includes('buy') || 
             lowerPrompt.includes('sell') || 
             (lowerPrompt.includes('trade') && !lowerPrompt.includes('trader'))) {
    return 'TRADING_SIGNALS';
    
  // 7. MARKET METRICS - /market-metrics endpoint
  } else if ((lowerPrompt.includes('market') && lowerPrompt.includes('metric')) ||
             (lowerPrompt.includes('market') && lowerPrompt.includes('indicator')) ||
             lowerPrompt.includes('market data')) {
    return 'MARKET_METRICS';
    
  // 8. SENTIMENT ANALYSIS - /sentiments endpoint
  } else if (lowerPrompt.includes('sentiment') || lowerPrompt.includes('social') || 
      lowerPrompt.includes('twitter') || lowerPrompt.includes('reddit') || lowerPrompt.includes('news')) {
    return 'SENTIMENT';
    
  // 9. SCENARIO ANALYSIS - /scenario-analysis endpoint
  } else if (lowerPrompt.includes('price') && (lowerPrompt.includes('prediction') || lowerPrompt.includes('forecast') || lowerPrompt.includes('scenario')) ||
             lowerPrompt.includes('scenario') || lowerPrompt.includes('prediction')) {
    return 'SCENARIO_ANALYSIS';
    
  // 10. CORRELATION ANALYSIS - /correlation endpoint
  } else if (lowerPrompt.includes('correlation') || lowerPrompt.includes('relationship') || 
             lowerPrompt.includes('portfolio') || lowerPrompt.includes('diversif')) {
    return 'CORRELATION';
    
  // 11. QUANTMETRICS - /quantmetrics endpoint
  } else if (lowerPrompt.includes('quant') || lowerPrompt.includes('quantitative') || 
             (lowerPrompt.includes('technical') && lowerPrompt.includes('analysis'))) {
    return 'QUANTMETRICS';
    
  // 12. HOURLY OHLCV - /hourly-ohlcv endpoint
  } else if ((lowerPrompt.includes('hourly') && (lowerPrompt.includes('ohlcv') || lowerPrompt.includes('price'))) ||
             lowerPrompt.includes('hourly data') || lowerPrompt.includes('hourly chart')) {
    return 'HOURLY_OHLCV';
    
  // 13. DAILY OHLCV - /daily-ohlcv endpoint
  } else if ((lowerPrompt.includes('daily') && (lowerPrompt.includes('ohlcv') || lowerPrompt.includes('price'))) ||
             lowerPrompt.includes('daily data') || lowerPrompt.includes('daily chart')) {
    return 'DAILY_OHLCV';
    
  // 14. AI REPORTS - /ai-reports endpoint
  } else if ((lowerPrompt.includes('ai') && lowerPrompt.includes('report')) ||
             lowerPrompt.includes('analysis report') || lowerPrompt.includes('detailed analysis')) {
    return 'AI_REPORTS';
    
  // 15. CRYPTO INVESTORS - /crypto-investors endpoint
  } else if ((lowerPrompt.includes('investor') && !lowerPrompt.includes('grade') && !lowerPrompt.includes('rating')) ||
             lowerPrompt.includes('institutional') || lowerPrompt.includes('smart money')) {
    return 'CRYPTO_INVESTORS';
    
  // 16. RESISTANCE/SUPPORT - /resistance-support endpoint
  } else if (lowerPrompt.includes('resistance') || lowerPrompt.includes('support') ||
             (lowerPrompt.includes('technical') && (lowerPrompt.includes('level') || lowerPrompt.includes('analysis')))) {
    return 'RESISTANCE_SUPPORT';
    
  // 17. MARKET OVERVIEW - Multiple endpoints
  } else if (lowerPrompt.includes('market') && (lowerPrompt.includes('overview') || lowerPrompt.includes('general'))) {
    return 'MARKET_OVERVIEW';
    
  // 18. AI CHAT - /tmai endpoint (for general questions)
  } else if (lowerPrompt.includes('ai') || lowerPrompt.includes('chat') || lowerPrompt.includes('ask') || 
             lowerPrompt.includes('what') || lowerPrompt.includes('how') || lowerPrompt.includes('why') ||
             lowerPrompt.includes('100x') || lowerPrompt.includes('recommend') || lowerPrompt.includes('explain')) {
    return 'AI_CHAT';
    
  } else {
    return 'AI_CHAT'; // Default
  }
}

console.log('🧪 COMPREHENSIVE ROUTING TEST - All 17 Token Metrics Endpoints\n');

let passed = 0;
let failed = 0;

testPrompts.forEach((test, index) => {
  const result = analyzePrompt(test.prompt);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
    console.log(`${status} Test ${index + 1}: "${test.prompt}"`);
    console.log(`   Expected: ${test.expected}, Got: ${result}\n`);
  }
});

console.log(`\n📊 RESULTS:`);
console.log(`✅ Passed: ${passed}/${testPrompts.length}`);
console.log(`❌ Failed: ${failed}/${testPrompts.length}`);
console.log(`📈 Success Rate: ${((passed / testPrompts.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Routing logic is working correctly for all 17 endpoints.');
} else {
  console.log('\n⚠️  Some tests failed. Check the routing logic above.');
} 