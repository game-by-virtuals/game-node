import { config } from "dotenv";
config({ path: "./.env" });
import * as readline from 'readline';
import TokenMetricsPlugin from "./index";

// Color coding for beautiful UX
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m'
};

class TokenMetricsChatInterface {
  private plugin: TokenMetricsPlugin;
  private rl: readline.Interface;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // 2 seconds between requests
  private tokenCache: { [key: string]: string } = {}; // Cache for dynamic token mappings
  private tokenCacheExpiry: number = 0; // Cache expiry timestamp
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

  constructor() {
    this.plugin = new TokenMetricsPlugin({
      apiClientConfig: {
        apiKey: process.env.TOKENMETRICS_API_KEY!,
      },
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`${colors.yellow}⏳ Rate limiting: waiting ${Math.ceil(waitTime/1000)} seconds...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 5000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.rateLimitDelay();
        return await operation();
      } catch (error) {
        const errorStr = error?.toString() || '';
        
        if (errorStr.includes('429') || errorStr.includes('Too Many Requests')) {
          if (attempt === maxRetries) {
            throw new Error(`Rate limit exceeded. Please try again in a few minutes. The TokenMetrics API has usage limits to ensure fair access for all users.`);
          }
          
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`${colors.yellow}⚠️  Rate limit hit (attempt ${attempt}/${maxRetries}). Retrying in ${delay/1000} seconds...${colors.reset}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  private formatHeader() {
    console.clear();
    console.log(`${colors.cyan}${colors.bright}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}║                    🚀 Token Metrics AI Chat                  ║${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}║              Powered by Virtuals Protocol GAME              ║${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log();
    console.log(`${colors.yellow}💡 Ask me anything about cryptocurrency markets, trading, or investments!${colors.reset}`);
    console.log(`${colors.dim}Examples: "What's the next 100x coin?", "Analyze Bitcoin sentiment", "Show me trading signals"${colors.reset}`);
    console.log(`${colors.dim}Type 'help' for available commands, 'quit' to exit${colors.reset}`);
    console.log();
  }

  private formatResponse(response: string, type: 'ai' | 'data' | 'error' = 'ai') {
    const timestamp = new Date().toLocaleTimeString();
    
    switch (type) {
      case 'ai':
        console.log(`${colors.green}${colors.bright}🤖 Token Metrics AI Response [${timestamp}]${colors.reset}`);
        console.log(`${colors.green}${'═'.repeat(60)}${colors.reset}`);
        break;
      case 'data':
        console.log(`${colors.blue}${colors.bright}📊 Data Analysis [${timestamp}]${colors.reset}`);
        console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
        break;
      case 'error':
        console.log(`${colors.red}${colors.bright}❌ Error [${timestamp}]${colors.reset}`);
        console.log(`${colors.red}${'═'.repeat(60)}${colors.reset}`);
        break;
    }
    
    // Format the response with proper line breaks and indentation
    const formattedResponse = response
      .replace(/\n/g, '\n  ')
      .replace(/\*\*(.*?)\*\*/g, `${colors.bright}$1${colors.reset}`)
      .replace(/\*(.*?)\*/g, `${colors.yellow}$1${colors.reset}`);
    
    console.log(`  ${formattedResponse}`);
    console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
    console.log();
  }

  private async analyzePrompt(prompt: string): Promise<void> {
    const lowerPrompt = prompt.toLowerCase();
    
    try {
      // Determine the best endpoint(s) to use based on the prompt
      // Order matters - more specific matches first!
      
      // 1. TOKEN LIST - /tokens endpoint (more specific matching)
      if ((lowerPrompt.includes('token') && (lowerPrompt.includes('list') || lowerPrompt.includes('id') || lowerPrompt.includes('database') || lowerPrompt.includes('show'))) || 
          (lowerPrompt.includes('supported') && lowerPrompt.includes('cryptocurrencies')) ||
          (lowerPrompt.includes('all') && lowerPrompt.includes('cryptocurrencies')) ||
          (lowerPrompt.includes('tokens') && (lowerPrompt.includes('database') || lowerPrompt.includes('available') || lowerPrompt.includes('show'))) ||
          lowerPrompt.includes('token database') ||
          lowerPrompt.includes('tokens database')) {
        
        console.log(`${colors.yellow}🔍 Getting supported tokens list...${colors.reset}`);
        await this.getTokensList();
        
      // 2. TRADER GRADES - /trader-grades endpoint (more specific matching - moved up)
      } else if ((lowerPrompt.includes('trader') && (lowerPrompt.includes('grade') || lowerPrompt.includes('score') || lowerPrompt.includes('rating'))) ||
                 (lowerPrompt.includes('trading') && lowerPrompt.includes('score'))) {
        
        console.log(`${colors.yellow}🔍 Getting trader grades...${colors.reset}`);
        await this.getTraderGrades();
        
      // 3. INVESTOR GRADES - /investor-grades endpoint (more specific matching - moved up)
      } else if ((lowerPrompt.includes('investor') && (lowerPrompt.includes('grade') || lowerPrompt.includes('score') || lowerPrompt.includes('rating'))) ||
                 (lowerPrompt.includes('investment') && lowerPrompt.includes('rating'))) {
        
        console.log(`${colors.yellow}🔍 Getting investor grades...${colors.reset}`);
        await this.getInvestorGrades();
        
      // 4. TOP MARKET CAP - /top-market-cap endpoint (moved down to avoid conflicts)
      } else if ((lowerPrompt.includes('top') && (lowerPrompt.includes('market') || lowerPrompt.includes('cap') || lowerPrompt.includes('crypto')) && !lowerPrompt.includes('grade') && !lowerPrompt.includes('score') && !lowerPrompt.includes('rating')) ||
                 (lowerPrompt.includes('market') && lowerPrompt.includes('cap') && !lowerPrompt.includes('grade')) ||
                 (lowerPrompt.includes('biggest') && lowerPrompt.includes('crypto')) ||
                 lowerPrompt.includes('market leaders')) {
        
        console.log(`${colors.yellow}🔍 Getting top market cap tokens...${colors.reset}`);
        await this.getTopMarketCapTokens();
        
      // 5. PRICE DATA - /price-data endpoint
      } else if ((lowerPrompt.includes('price') && !lowerPrompt.includes('prediction') && !lowerPrompt.includes('forecast') && !lowerPrompt.includes('scenario')) ||
                 lowerPrompt.includes('current price') ||
                 (lowerPrompt.includes('get') && lowerPrompt.includes('price'))) {
        
        console.log(`${colors.yellow}🔍 Getting current price data...${colors.reset}`);
        await this.getPriceData(prompt);
        
      // 6. HOURLY TRADING SIGNALS - /hourly-trading-signals endpoint (more specific first)
      } else if ((lowerPrompt.includes('hourly') && lowerPrompt.includes('signal')) ||
                 (lowerPrompt.includes('hourly') && lowerPrompt.includes('trading')) ||
                 lowerPrompt.includes('hourly trading signals')) {
        
        console.log(`${colors.yellow}🔍 Getting hourly trading signals...${colors.reset}`);
        await this.getHourlyTradingSignals(prompt);
        
      // 7. TRADING SIGNALS - /trading-signals endpoint
      } else if (lowerPrompt.includes('signal') || 
                 (lowerPrompt.includes('trading') && !lowerPrompt.includes('score') && !lowerPrompt.includes('hourly')) || 
                 lowerPrompt.includes('buy') || 
                 lowerPrompt.includes('sell') || 
                 (lowerPrompt.includes('trade') && !lowerPrompt.includes('trader'))) {
        
        console.log(`${colors.yellow}🔍 Getting trading signals...${colors.reset}`);
        await this.getTradingSignals();
        
      // 8. MARKET METRICS - /market-metrics endpoint
      } else if ((lowerPrompt.includes('market') && lowerPrompt.includes('metric')) ||
                 (lowerPrompt.includes('market') && lowerPrompt.includes('indicator')) ||
                 lowerPrompt.includes('market data')) {
        
        console.log(`${colors.yellow}🔍 Getting market metrics...${colors.reset}`);
        await this.getMarketMetrics(prompt);
        
      // 9. SENTIMENT ANALYSIS - /sentiments endpoint
      } else if (lowerPrompt.includes('sentiment') || lowerPrompt.includes('social') || 
          lowerPrompt.includes('twitter') || lowerPrompt.includes('reddit') || lowerPrompt.includes('news')) {
        
        console.log(`${colors.yellow}🔍 Analyzing market sentiment...${colors.reset}`);
        await this.getSentimentAnalysis();
        
      // 10. SCENARIO ANALYSIS - /scenario-analysis endpoint
      } else if (lowerPrompt.includes('price') && (lowerPrompt.includes('prediction') || lowerPrompt.includes('forecast') || lowerPrompt.includes('scenario')) ||
                 lowerPrompt.includes('scenario') || lowerPrompt.includes('prediction')) {
        
        console.log(`${colors.yellow}🔍 Analyzing price scenarios...${colors.reset}`);
        await this.getScenarioAnalysis(prompt);
        
      // 11. CORRELATION ANALYSIS - /correlation endpoint
      } else if (lowerPrompt.includes('correlation') || lowerPrompt.includes('relationship') || 
                 lowerPrompt.includes('portfolio') || lowerPrompt.includes('diversif')) {
        
        console.log(`${colors.yellow}🔍 Analyzing token correlations...${colors.reset}`);
        await this.getCorrelationAnalysis(prompt);
        
      // 12. INDICES - /indices endpoint
      } else if ((lowerPrompt.includes('indices') || lowerPrompt.includes('index')) && 
                 !lowerPrompt.includes('holding') && !lowerPrompt.includes('performance')) {
        
        console.log(`${colors.yellow}🔍 Getting crypto indices...${colors.reset}`);
        await this.getIndices(prompt);
        
      // 13. INDICES HOLDINGS - /indices-holdings endpoint
      } else if ((lowerPrompt.includes('indices') || lowerPrompt.includes('index')) && 
                 (lowerPrompt.includes('holding') || lowerPrompt.includes('composition') || lowerPrompt.includes('weight'))) {
        
        console.log(`${colors.yellow}🔍 Getting index holdings...${colors.reset}`);
        await this.getIndicesHoldings(prompt);
        
      // 14. INDICES PERFORMANCE - /indices-performance endpoint
      } else if ((lowerPrompt.includes('indices') || lowerPrompt.includes('index')) && 
                 (lowerPrompt.includes('performance') || lowerPrompt.includes('return') || lowerPrompt.includes('roi'))) {
        
        console.log(`${colors.yellow}🔍 Getting index performance...${colors.reset}`);
        await this.getIndicesPerformance(prompt);
        
      // 15. QUANTMETRICS - /quantmetrics endpoint
      } else if (lowerPrompt.includes('quant') || lowerPrompt.includes('quantitative') || 
                 (lowerPrompt.includes('technical') && lowerPrompt.includes('analysis'))) {
        
        console.log(`${colors.yellow}🔍 Getting quantitative metrics...${colors.reset}`);
        await this.getQuantmetrics(prompt);
        
      // 16. HOURLY OHLCV - /hourly-ohlcv endpoint
      } else if ((lowerPrompt.includes('hourly') && (lowerPrompt.includes('ohlcv') || lowerPrompt.includes('price'))) ||
                 lowerPrompt.includes('hourly data') || lowerPrompt.includes('hourly chart')) {
        
        console.log(`${colors.yellow}🔍 Getting hourly OHLCV data...${colors.reset}`);
        await this.getHourlyOhlcv(prompt);
        
      // 17. DAILY OHLCV - /daily-ohlcv endpoint
      } else if ((lowerPrompt.includes('daily') && (lowerPrompt.includes('ohlcv') || lowerPrompt.includes('price'))) ||
                 lowerPrompt.includes('daily data') || lowerPrompt.includes('daily chart')) {
        
        console.log(`${colors.yellow}🔍 Getting daily OHLCV data...${colors.reset}`);
        await this.getDailyOhlcv(prompt);
        
      // 18. AI REPORTS - /ai-reports endpoint
      } else if ((lowerPrompt.includes('ai') && lowerPrompt.includes('report')) ||
                 lowerPrompt.includes('analysis report') || lowerPrompt.includes('detailed analysis')) {
        
        console.log(`${colors.yellow}🔍 Getting AI reports...${colors.reset}`);
        await this.getAiReports(prompt);
        
      // 19. CRYPTO INVESTORS - /crypto-investors endpoint
      } else if ((lowerPrompt.includes('investor') && !lowerPrompt.includes('grade') && !lowerPrompt.includes('rating')) ||
                 lowerPrompt.includes('institutional') || lowerPrompt.includes('smart money')) {
        
        console.log(`${colors.yellow}🔍 Getting crypto investors data...${colors.reset}`);
        await this.getCryptoInvestors();
        
      // 20. RESISTANCE/SUPPORT - /resistance-support endpoint
      } else if (lowerPrompt.includes('resistance') || lowerPrompt.includes('support') ||
                 (lowerPrompt.includes('technical') && (lowerPrompt.includes('level') || lowerPrompt.includes('analysis')))) {
        
        console.log(`${colors.yellow}🔍 Getting resistance/support levels...${colors.reset}`);
        await this.getResistanceSupport(prompt);
        
      // 21. MARKET OVERVIEW - Multiple endpoints
      // 20. MARKET OVERVIEW - Multiple endpoints
      } else if (lowerPrompt.includes('market') && (lowerPrompt.includes('overview') || lowerPrompt.includes('general'))) {
        
        console.log(`${colors.yellow}🔍 Getting market overview...${colors.reset}`);
        await this.getMarketOverview();
        
      // 21. AI CHAT - /tmai endpoint (for general questions)
      } else if (lowerPrompt.includes('ai') || lowerPrompt.includes('chat') || lowerPrompt.includes('ask') || 
                 lowerPrompt.includes('what') || lowerPrompt.includes('how') || lowerPrompt.includes('why') ||
                 lowerPrompt.includes('100x') || lowerPrompt.includes('recommend') || lowerPrompt.includes('explain')) {
        
        console.log(`${colors.yellow}🔍 Consulting TokenMetrics AI...${colors.reset}`);
        await this.queryTokenMetricsAI(prompt);
        
      } else {
        // Default to AI chat for general questions
        console.log(`${colors.yellow}🔍 Consulting TokenMetrics AI...${colors.reset}`);
        await this.queryTokenMetricsAI(prompt);
      }
      
    } catch (error) {
      this.formatResponse(`Failed to process your request: ${error}`, 'error');
    }
  }

  private async queryTokenMetricsAI(prompt: string): Promise<void> {
    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getTokenMetricsAi.executable(
          { user_message: prompt },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Extract the actual AI response from the JSON
        const responseMatch = result.feedback.match(/Response: ({.*})/);
        if (responseMatch) {
          const responseData = JSON.parse(responseMatch[1]);
          this.formatResponse(responseData.answer || responseData.message || result.feedback, 'ai');
        } else {
          this.formatResponse(result.feedback, 'ai');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`AI query failed: ${error}`, 'error');
    }
  }

  private async getSentimentAnalysis(): Promise<void> {
    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getSentiments.executable(
          { limit: "5", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the sentiment data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              const sentimentData = responseData.data[0];
              this.formatSentimentResponse(sentimentData);
            } else {
              this.formatResponse("No sentiment data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("Latest market sentiment analysis retrieved successfully. Check the detailed data above for sentiment scores from Twitter, Reddit, and news sources.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Latest market sentiment analysis retrieved successfully. Check the detailed data above for sentiment scores from Twitter, Reddit, and news sources.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Sentiment analysis failed: ${error}`, 'error');
    }
  }

  private formatSentimentResponse(data: any): void {
    const timestamp = new Date(data.DATETIME).toLocaleString();
    
    console.log(`${colors.blue}${colors.bright}😊 Market Sentiment Analysis [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}📅 Data Time: ${timestamp}${colors.reset}\n`);
    
    // Overall Market Sentiment
    const marketGrade = data.MARKET_SENTIMENT_GRADE;
    const marketLabel = data.MARKET_SENTIMENT_LABEL;
    const marketColor = this.getSentimentColor(marketLabel);
    const marketEmoji = this.getSentimentEmoji(marketLabel);
    
    console.log(`${colors.bright}🌍 OVERALL MARKET SENTIMENT${colors.reset}`);
    console.log(`${marketColor}${marketEmoji} ${marketLabel.toUpperCase()} (${marketGrade}/100)${colors.reset}`);
    console.log(`${this.getSentimentBar(marketGrade)}\n`);
    
    // Twitter Sentiment
    const twitterGrade = data.TWITTER_SENTIMENT_GRADE;
    const twitterLabel = data.TWITTER_SENTIMENT_LABEL;
    const twitterColor = this.getSentimentColor(twitterLabel);
    const twitterEmoji = this.getSentimentEmoji(twitterLabel);
    
    console.log(`${colors.bright}🐦 TWITTER SENTIMENT${colors.reset}`);
    console.log(`${twitterColor}${twitterEmoji} ${twitterLabel.toUpperCase()} (${twitterGrade}/100)${colors.reset}`);
    console.log(`${this.getSentimentBar(twitterGrade)}`);
    if (data.TWITTER_SUMMARY) {
      console.log(`${colors.dim}📝 ${this.truncateText(data.TWITTER_SUMMARY, 200)}${colors.reset}\n`);
    }
    
    // Reddit Sentiment
    const redditGrade = data.REDDIT_SENTIMENT_GRADE;
    const redditLabel = data.REDDIT_SENTIMENT_LABEL;
    const redditColor = this.getSentimentColor(redditLabel);
    const redditEmoji = this.getSentimentEmoji(redditLabel);
    
    console.log(`${colors.bright}📱 REDDIT SENTIMENT${colors.reset}`);
    console.log(`${redditColor}${redditEmoji} ${redditLabel.toUpperCase()} (${redditGrade}/100)${colors.reset}`);
    console.log(`${this.getSentimentBar(redditGrade)}`);
    if (data.REDDIT_SUMMARY) {
      console.log(`${colors.dim}📝 ${this.truncateText(data.REDDIT_SUMMARY, 200)}${colors.reset}\n`);
    }
    
    // News Sentiment
    const newsGrade = data.NEWS_SENTIMENT_GRADE;
    const newsLabel = data.NEWS_SENTIMENT_LABEL;
    const newsColor = this.getSentimentColor(newsLabel);
    const newsEmoji = this.getSentimentEmoji(newsLabel);
    
    console.log(`${colors.bright}📰 NEWS SENTIMENT${colors.reset}`);
    console.log(`${newsColor}${newsEmoji} ${newsLabel.toUpperCase()} (${newsGrade}/100)${colors.reset}`);
    console.log(`${this.getSentimentBar(newsGrade)}`);
    if (data.NEWS_SUMMARY) {
      console.log(`${colors.dim}📝 ${this.truncateText(data.NEWS_SUMMARY, 200)}${colors.reset}\n`);
    }
    
    console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    console.log();
  }

  private getSentimentColor(label: string): string {
    switch (label.toLowerCase()) {
      case 'very positive':
      case 'positive':
        return colors.green;
      case 'neutral':
        return colors.yellow;
      case 'negative':
      case 'very negative':
        return colors.red;
      default:
        return colors.reset;
    }
  }

  private getSentimentEmoji(label: string): string {
    switch (label.toLowerCase()) {
      case 'very positive':
        return '🚀';
      case 'positive':
        return '😊';
      case 'neutral':
        return '😐';
      case 'negative':
        return '😟';
      case 'very negative':
        return '😰';
      default:
        return '❓';
    }
  }

  private getSentimentBar(grade: number): string {
    const barLength = 30;
    const filledLength = Math.round((grade / 100) * barLength);
    const emptyLength = barLength - filledLength;
    
    let color = colors.red;
    if (grade >= 60) color = colors.green;
    else if (grade >= 40) color = colors.yellow;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    
    return `${color}${filled}${colors.dim}${empty}${colors.reset} ${grade}%`;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private async getTraderGrades(): Promise<void> {
    try {
      console.log(`${colors.dim}  🎯 Getting trader grades with date range parameters${colors.reset}`);
      
      // Calculate date range (30 days ago to today)
      const endDate = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD format
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getTraderGrades.executable(
          { 
            startDate: startDate,
            endDate: endDate,
            limit: "10", 
            page: "1" 
          },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the response to extract trader grades data
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatTraderGradesResponse(responseData.data);
            } else {
              this.formatResponse("No trader grades data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("AI trader grades retrieved successfully! Check the detailed data above for short-term trading scores and recommendations.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("AI trader grades retrieved successfully! Check the detailed data above for short-term trading scores and recommendations.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Failed to get trader grades: ${error}`, 'error');
    }
  }

  private formatTraderGradesResponse(grades: any[]): void {
    console.log(`${colors.yellow}${colors.bright}📊 AI TRADER GRADES [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.yellow}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}🤖 Short-term Trading Scores & Recommendations${colors.reset}\n`);
    
    grades.slice(0, 10).forEach((grade, index) => {
      const tokenName = grade.TOKEN_NAME || grade.name || 'Unknown';
      const tokenSymbol = grade.TOKEN_SYMBOL || grade.symbol || 'N/A';
      const traderGrade = grade.TM_TRADER_GRADE || grade.trader_grade || 0;
      const traderLabel = grade.TM_TRADER_LABEL || grade.trader_label || 'N/A';
      const change24h = grade.TM_TRADER_GRADE_24H_PCT_CHANGE || grade.trader_grade_24h_change || 0;
      const timestamp = grade.DATE || grade.date || new Date().toISOString();
      
      // Color coding for grades
      let gradeColor = colors.red;
      let gradeEmoji = '🔴';
      if (traderGrade >= 80) {
        gradeColor = colors.green;
        gradeEmoji = '🟢';
      } else if (traderGrade >= 60) {
        gradeColor = colors.yellow;
        gradeEmoji = '🟡';
      }
      
      // Color coding for grade change
      const changeColor = change24h >= 0 ? colors.green : colors.red;
      const changeEmoji = change24h >= 0 ? '📈' : '📉';
      const changeSign = change24h >= 0 ? '+' : '';
      
      console.log(`${colors.bright}${index + 1}. ${tokenName} (${tokenSymbol})${colors.reset}`);
      console.log(`   ${gradeEmoji} Trader Grade: ${gradeColor}${traderGrade.toFixed(1)}/100 (${traderLabel})${colors.reset}`);
      console.log(`   ${this.getGradeBar(traderGrade)}`);
      console.log(`   ${changeEmoji} Grade Change (24h): ${changeColor}${changeSign}${change24h.toFixed(2)}%${colors.reset}`);
      console.log(`   ⏰ ${new Date(timestamp).toLocaleDateString()}`);
      console.log();
    });
    
    console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}💡 Trader grades focus on short-term (1-30 days) trading opportunities${colors.reset}`);
    console.log(`${colors.dim}🎯 Grades: 80+ Excellent, 60+ Good, 40+ Fair, <40 Poor${colors.reset}`);
    console.log(`${colors.dim}💰 Use 'bitcoin price' or 'ethereum price' to get current prices${colors.reset}`);
    console.log();
  }

  private getGradeBar(grade: number): string {
    const barLength = 15;
    const filledLength = Math.round((grade / 100) * barLength);
    const emptyLength = barLength - filledLength;
    
    let color = colors.red;
    if (grade >= 70) color = colors.green;
    else if (grade >= 50) color = colors.yellow;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    
    return `${color}${filled}${colors.dim}${empty}${colors.reset}`;
  }

  private async getInvestorGrades(): Promise<void> {
    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getInvestorGrades.executable(
          { limit: "10", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the response to extract investor grades data
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatInvestorGradesResponse(responseData.data);
            } else {
              this.formatResponse("No investor grades data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("AI investor grades retrieved successfully! Check the detailed data above for long-term investment ratings and analysis.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("AI investor grades retrieved successfully! Check the detailed data above for long-term investment ratings and analysis.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Failed to get investor grades: ${error}`, 'error');
    }
  }

  private formatInvestorGradesResponse(grades: any[]): void {
    console.log(`${colors.magenta}${colors.bright}💎 AI INVESTOR GRADES [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.magenta}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}🤖 Long-term Investment Ratings & Analysis${colors.reset}\n`);
    
    grades.slice(0, 10).forEach((grade, index) => {
      const tokenName = grade.TOKEN_NAME || grade.name || 'Unknown';
      const tokenSymbol = grade.TOKEN_SYMBOL || grade.symbol || 'N/A';
      const investorGrade = grade.TM_INVESTOR_GRADE || grade.investor_grade || 0;
      const investorLabel = grade.TM_INVESTOR_LABEL || grade.investor_label || 'N/A';
      const change7d = grade.TM_INVESTOR_GRADE_7D_PCT_CHANGE || grade.investor_grade_7d_change || 0;
      const fundamentalGrade = grade.FUNDAMENTAL_GRADE || grade.fundamental_grade || 0;
      const valuationGrade = grade.VALUATION_GRADE || grade.valuation_grade || 0;
      const timestamp = grade.DATE || grade.date || new Date().toISOString();
      
      // Color coding for grades
      let gradeColor = colors.red;
      let gradeEmoji = '🔴';
      if (investorGrade >= 80) {
        gradeColor = colors.green;
        gradeEmoji = '🟢';
      } else if (investorGrade >= 60) {
        gradeColor = colors.yellow;
        gradeEmoji = '🟡';
      }
      
      // Color coding for grade change
      const changeColor = change7d >= 0 ? colors.green : colors.red;
      const changeEmoji = change7d >= 0 ? '📈' : '📉';
      const changeSign = change7d >= 0 ? '+' : '';
      
      console.log(`${colors.bright}${index + 1}. ${tokenName} (${tokenSymbol})${colors.reset}`);
      console.log(`   ${gradeEmoji} Investor Grade: ${gradeColor}${investorGrade.toFixed(1)}/100 (${investorLabel})${colors.reset}`);
      console.log(`   ${this.getGradeBar(investorGrade)}`);
      console.log(`   📊 Fundamental: ${colors.cyan}${fundamentalGrade.toFixed(1)}/100${colors.reset} | Valuation: ${colors.cyan}${valuationGrade.toFixed(1)}/100${colors.reset}`);
      console.log(`   ${changeEmoji} Grade Change (7d): ${changeColor}${changeSign}${change7d.toFixed(2)}%${colors.reset}`);
      console.log(`   ⏰ ${new Date(timestamp).toLocaleDateString()}`);
      console.log();
    });
    
    console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}💡 Investor grades focus on long-term (6+ months) investment potential${colors.reset}`);
    console.log(`${colors.dim}🎯 Grades: 80+ Excellent, 60+ Good, 40+ Fair, <40 Poor${colors.reset}`);
    console.log(`${colors.dim}💰 Use 'bitcoin price' or 'ethereum price' to get current prices${colors.reset}`);
    console.log();
  }

  private async getMarketMetrics(prompt: string): Promise<void> {
    try {
      console.log(`${colors.dim}  🎯 Getting general market metrics and analytics${colors.reset}`);
      
      // Calculate date range (30 days ago to today)
      const endDate = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD format
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getMarketMetrics.executable(
          { 
            startDate: startDate,
            endDate: endDate,
            limit: "10", 
            page: "1" 
          },
          (msg: string) => {
            console.log(`${colors.dim}  📝 ${msg}${colors.reset}`);
          }
        );
      });
      
      if (result.status === 'done') {
        // Try to parse the full response from result.feedback
        try {
          const responseIndex = result.feedback.lastIndexOf('Response: ');
          if (responseIndex !== -1) {
            const jsonString = result.feedback.substring(responseIndex + 10).trim();
            const responseData = JSON.parse(jsonString);
                  if (responseData.data && responseData.data.length > 0) {
                    this.formatMarketMetricsResponse(responseData.data);
              return; // Exit early since we've formatted the data
                  }
                }
              } catch (e) {
                // If parsing fails, continue with default behavior
              }
      
        // Fallback to generic message if parsing fails
        this.formatResponse("Successfully retrieved market metrics data", 'data');
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Market metrics query failed: ${error}`, 'error');
    }
  }

  private formatMarketMetricsResponse(data: any[]): void {
    if (!data || data.length === 0) return;
    
    const latest = data[0];
    const previous = data[1] || latest;
    
    console.log(`${colors.cyan}🌍 Crypto Market Overview [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log('═'.repeat(80));
    
    // Market Cap Analysis
    const currentMcap = latest.TOTAL_CRYPTO_MCAP;
    const previousMcap = previous.TOTAL_CRYPTO_MCAP;
    const mcapChange = ((currentMcap - previousMcap) / previousMcap * 100);
    const mcapChangeColor = mcapChange >= 0 ? colors.green : colors.red;
    const mcapChangeIcon = mcapChange >= 0 ? '📈' : '📉';
    
    console.log(`${colors.yellow}💰 MARKET CAPITALIZATION${colors.reset}`);
    console.log('─'.repeat(50));
    console.log(`🌐 Total Crypto Market Cap: ${colors.bright}$${this.formatLargeNumber(currentMcap)}${colors.reset}`);
    console.log(`${mcapChangeIcon} 24h Change: ${mcapChangeColor}${mcapChange >= 0 ? '+' : ''}${mcapChange.toFixed(2)}%${colors.reset}`);
    console.log(`📅 Date: ${new Date(latest.DATE).toLocaleDateString()}`);
    console.log();
    
    // Market Sentiment Analysis
    const highGradePerc = latest.TM_GRADE_PERC_HIGH_COINS;
    const signal = latest.TM_GRADE_SIGNAL;
    const lastSignal = latest.LAST_TM_GRADE_SIGNAL;
    
    console.log(`${colors.blue}📊 MARKET SENTIMENT ANALYSIS${colors.reset}`);
    console.log('─'.repeat(50));
    
    // High Grade Coins Percentage
    const gradeBar = this.getMarketGradeBar(highGradePerc);
    const gradeRating = this.getMarketGradeRating(highGradePerc);
    console.log(`⭐ High-Grade Coins: ${highGradePerc.toFixed(1)}% ${gradeBar}`);
    console.log(`   ${gradeRating}`);
    
    // Market Signal
    const signalInfo = this.getMarketSignalInfo(signal);
    const lastSignalInfo = this.getMarketSignalInfo(lastSignal);
    console.log(`🎯 Current Signal: ${signalInfo.icon} ${signalInfo.text} ${signalInfo.color}${signalInfo.description}${colors.reset}`);
    console.log(`📈 Previous Signal: ${lastSignalInfo.icon} ${lastSignalInfo.text}`);
    
    // Signal Change Analysis
    if (signal !== lastSignal) {
      const changeType = signal > lastSignal ? 'improved' : 'deteriorated';
      const changeColor = signal > lastSignal ? colors.green : colors.red;
      console.log(`🔄 Signal Change: ${changeColor}Market sentiment has ${changeType}${colors.reset}`);
    } else {
      console.log(`🔄 Signal Change: ${colors.dim}No change from previous signal${colors.reset}`);
    }
    
    console.log();
    
    // Historical Trend Analysis
    console.log(`${colors.magenta}📈 TREND ANALYSIS${colors.reset}`);
    console.log('─'.repeat(50));
    
    if (data.length >= 5) {
      const trendAnalysis = this.analyzeMarketTrend(data.slice(0, 5));
      console.log(`📊 Market Cap Trend (5 days): ${trendAnalysis.mcapTrend.color}${trendAnalysis.mcapTrend.direction} ${trendAnalysis.mcapTrend.strength}${colors.reset}`);
      console.log(`⭐ Grade Trend (5 days): ${trendAnalysis.gradeTrend.color}${trendAnalysis.gradeTrend.direction} ${trendAnalysis.gradeTrend.strength}${colors.reset}`);
      console.log(`🎯 Signal Consistency: ${trendAnalysis.signalConsistency.color}${trendAnalysis.signalConsistency.description}${colors.reset}`);
    }
    
    // Market Health Score
    const healthScore = this.calculateMarketHealthScore(latest);
    const healthBar = this.getHealthScoreBar(healthScore);
    const healthRating = this.getHealthScoreRating(healthScore);
    console.log(`🏥 Market Health Score: ${healthScore}/100 ${healthBar}`);
    console.log(`   ${healthRating}`);
    
    console.log();
    
    // Recent Market Data Table
    console.log(`${colors.cyan}📋 RECENT MARKET DATA${colors.reset}`);
    console.log('─'.repeat(80));
    console.log(`${'Date'.padEnd(12)} ${'Market Cap'.padEnd(15)} ${'High Grade %'.padEnd(12)} ${'Signal'.padEnd(8)} ${'Trend'.padEnd(8)}`);
    console.log('─'.repeat(80));
    
    data.slice(0, 5).forEach((item, index) => {
      const date = new Date(item.DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const mcap = this.formatLargeNumber(item.TOTAL_CRYPTO_MCAP);
      const grade = item.TM_GRADE_PERC_HIGH_COINS.toFixed(1) + '%';
      const signalIcon = this.getMarketSignalInfo(item.TM_GRADE_SIGNAL).icon;
      
      // Calculate trend from previous day
      let trendIcon = '─';
      if (index < data.length - 1) {
        const prevMcap = data[index + 1].TOTAL_CRYPTO_MCAP;
        const change = ((item.TOTAL_CRYPTO_MCAP - prevMcap) / prevMcap * 100);
        trendIcon = change > 0.5 ? '📈' : change < -0.5 ? '📉' : '─';
      }
      
      console.log(`${date.padEnd(12)} ${mcap.padEnd(15)} ${grade.padEnd(12)} ${signalIcon.padEnd(8)} ${trendIcon.padEnd(8)}`);
    });
    
    console.log();
    console.log('═'.repeat(80));
    console.log(`💡 ${colors.bright}Market Insights:${colors.reset}`);
    
    // Generate market insights
    const insights = this.generateMarketInsights(data, latest);
    insights.forEach(insight => console.log(`   ${insight}`));
    
    console.log('─'.repeat(80));
    console.log(`🔍 Analysis powered by TokenMetrics market intelligence`);
    console.log();
  }

  private getMarketGradeBar(percentage: number): string {
    const filled = Math.round(percentage / 4);
    const empty = 25 - filled;
    
    if (percentage < 20) return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (percentage < 40) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (percentage < 60) return `${colors.blue}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getMarketGradeRating(percentage: number): string {
    if (percentage < 10) return `${colors.red}Very Bearish - Extremely low quality coins${colors.reset}`;
    if (percentage < 20) return `${colors.red}Bearish - Low quality dominance${colors.reset}`;
    if (percentage < 30) return `${colors.yellow}Cautious - Below average quality${colors.reset}`;
    if (percentage < 50) return `${colors.blue}Neutral - Moderate quality distribution${colors.reset}`;
    if (percentage < 70) return `${colors.green}Bullish - Good quality coins prevalent${colors.reset}`;
    return `${colors.green}Very Bullish - High quality coins dominating${colors.reset}`;
  }

  private getMarketSignalInfo(signal: number): { icon: string; text: string; color: string; description: string } {
    switch (signal) {
      case 1:
        return {
          icon: '🟢',
          text: 'BULLISH',
          color: colors.green,
          description: 'Strong buy signal - Market conditions favorable'
        };
      case 0:
        return {
          icon: '🟡',
          text: 'NEUTRAL',
          color: colors.yellow,
          description: 'Hold signal - Market in consolidation'
        };
      case -1:
        return {
          icon: '🔴',
          text: 'BEARISH',
          color: colors.red,
          description: 'Caution signal - Market showing weakness'
        };
      default:
        return {
          icon: '⚪',
          text: 'UNKNOWN',
          color: colors.dim,
          description: 'Signal not available'
        };
    }
  }

  private analyzeMarketTrend(data: any[]): {
    mcapTrend: { direction: string; strength: string; color: string };
    gradeTrend: { direction: string; strength: string; color: string };
    signalConsistency: { description: string; color: string };
  } {
    // Market Cap Trend
    const mcaps = data.map(d => d.TOTAL_CRYPTO_MCAP);
    const mcapChanges = mcaps.slice(0, -1).map((mcap, i) => (mcap - mcaps[i + 1]) / mcaps[i + 1] * 100);
    const avgMcapChange = mcapChanges.reduce((a, b) => a + b, 0) / mcapChanges.length;
    
    let mcapTrend;
    if (avgMcapChange > 2) mcapTrend = { direction: '📈 Strong Uptrend', strength: '(+' + avgMcapChange.toFixed(1) + '%)', color: colors.green };
    else if (avgMcapChange > 0.5) mcapTrend = { direction: '📈 Uptrend', strength: '(+' + avgMcapChange.toFixed(1) + '%)', color: colors.green };
    else if (avgMcapChange > -0.5) mcapTrend = { direction: '➡️ Sideways', strength: '(' + avgMcapChange.toFixed(1) + '%)', color: colors.yellow };
    else if (avgMcapChange > -2) mcapTrend = { direction: '📉 Downtrend', strength: '(' + avgMcapChange.toFixed(1) + '%)', color: colors.red };
    else mcapTrend = { direction: '📉 Strong Downtrend', strength: '(' + avgMcapChange.toFixed(1) + '%)', color: colors.red };
    
    // Grade Trend
    const grades = data.map(d => d.TM_GRADE_PERC_HIGH_COINS);
    const gradeChanges = grades.slice(0, -1).map((grade, i) => grade - grades[i + 1]);
    const avgGradeChange = gradeChanges.reduce((a, b) => a + b, 0) / gradeChanges.length;
    
    let gradeTrend;
    if (avgGradeChange > 5) gradeTrend = { direction: '⭐ Improving', strength: '(+' + avgGradeChange.toFixed(1) + '%)', color: colors.green };
    else if (avgGradeChange > 1) gradeTrend = { direction: '⭐ Slight Improvement', strength: '(+' + avgGradeChange.toFixed(1) + '%)', color: colors.green };
    else if (avgGradeChange > -1) gradeTrend = { direction: '➡️ Stable', strength: '(' + avgGradeChange.toFixed(1) + '%)', color: colors.yellow };
    else if (avgGradeChange > -5) gradeTrend = { direction: '⭐ Declining', strength: '(' + avgGradeChange.toFixed(1) + '%)', color: colors.red };
    else gradeTrend = { direction: '⭐ Sharp Decline', strength: '(' + avgGradeChange.toFixed(1) + '%)', color: colors.red };
    
    // Signal Consistency
    const signals = data.map(d => d.TM_GRADE_SIGNAL);
    const uniqueSignals = [...new Set(signals)].length;
    
    let signalConsistency;
    if (uniqueSignals === 1) {
      const signal = signals[0];
      const signalText = signal === 1 ? 'Bullish' : signal === 0 ? 'Neutral' : 'Bearish';
      signalConsistency = { description: `Consistent ${signalText}`, color: colors.green };
    } else if (uniqueSignals === 2) {
      signalConsistency = { description: 'Moderate Volatility', color: colors.yellow };
    } else {
      signalConsistency = { description: 'High Volatility', color: colors.red };
    }
    
    return { mcapTrend, gradeTrend, signalConsistency };
  }

  private calculateMarketHealthScore(data: any): number {
    let score = 50; // Base score
    
    // High grade percentage contribution (0-30 points)
    const gradeScore = Math.min(data.TM_GRADE_PERC_HIGH_COINS * 0.6, 30);
    score += gradeScore;
    
    // Signal contribution (0-20 points)
    if (data.TM_GRADE_SIGNAL === 1) score += 20;
    else if (data.TM_GRADE_SIGNAL === 0) score += 10;
    // Bearish signal adds 0 points
    
    return Math.round(Math.min(score, 100));
  }

  private getHealthScoreBar(score: number): string {
    const filled = Math.round(score / 4);
    const empty = 25 - filled;
    
    if (score < 30) return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (score < 50) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (score < 70) return `${colors.blue}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getHealthScoreRating(score: number): string {
    if (score < 30) return `${colors.red}Poor - High risk market conditions${colors.reset}`;
    if (score < 50) return `${colors.yellow}Fair - Cautious approach recommended${colors.reset}`;
    if (score < 70) return `${colors.blue}Good - Moderate market conditions${colors.reset}`;
    if (score < 85) return `${colors.green}Excellent - Favorable market environment${colors.reset}`;
    return `${colors.green}Outstanding - Optimal market conditions${colors.reset}`;
  }

  private generateMarketInsights(data: any[], latest: any): string[] {
    const insights: string[] = [];
    
    // Market cap insight
    if (data.length >= 2) {
      const change = ((latest.TOTAL_CRYPTO_MCAP - data[1].TOTAL_CRYPTO_MCAP) / data[1].TOTAL_CRYPTO_MCAP * 100);
      if (Math.abs(change) > 5) {
        const direction = change > 0 ? 'surged' : 'declined';
        insights.push(`📊 Market cap has ${direction} by ${Math.abs(change).toFixed(1)}% in the last day`);
      }
    }
    
    // High grade coins insight
    if (latest.TM_GRADE_PERC_HIGH_COINS > 60) {
      insights.push(`⭐ Strong market quality with ${latest.TM_GRADE_PERC_HIGH_COINS.toFixed(1)}% high-grade coins`);
    } else if (latest.TM_GRADE_PERC_HIGH_COINS < 20) {
      insights.push(`⚠️ Market quality concerns with only ${latest.TM_GRADE_PERC_HIGH_COINS.toFixed(1)}% high-grade coins`);
    }
    
    // Signal insight
    if (latest.TM_GRADE_SIGNAL !== latest.LAST_TM_GRADE_SIGNAL) {
      const change = latest.TM_GRADE_SIGNAL > latest.LAST_TM_GRADE_SIGNAL ? 'improved' : 'deteriorated';
      insights.push(`🎯 Market signal has ${change} from previous reading`);
    }
    
    // Trend insight
    if (data.length >= 5) {
      const recentMcaps = data.slice(0, 3).map(d => d.TOTAL_CRYPTO_MCAP);
      const isUptrend = recentMcaps[0] > recentMcaps[1] && recentMcaps[1] > recentMcaps[2];
      const isDowntrend = recentMcaps[0] < recentMcaps[1] && recentMcaps[1] < recentMcaps[2];
      
      if (isUptrend) {
        insights.push(`📈 Market showing consistent upward momentum over 3 days`);
      } else if (isDowntrend) {
        insights.push(`📉 Market experiencing downward pressure over 3 days`);
      }
    }
    
    // Health score insight
    const healthScore = this.calculateMarketHealthScore(latest);
    if (healthScore > 80) {
      insights.push(`🏥 Market health is excellent (${healthScore}/100) - favorable for investments`);
    } else if (healthScore < 40) {
      insights.push(`🏥 Market health is concerning (${healthScore}/100) - exercise caution`);
    }
    
    return insights.length > 0 ? insights : ['📊 Market data analysis complete - monitor for changes'];
  }

  private async getQuantmetrics(prompt: string): Promise<void> {
    try {
      console.log(`${colors.dim}  🔍 Getting quantitative metrics...${colors.reset}`);
      
      // Try to extract token information from prompt, but don't require it
      const lowerPrompt = prompt.toLowerCase();
      let searchParams: any = {
        limit: "10",
        page: "1"
      };
      
      // Check if user specified a particular token
      const tokenIds = await this.extractTokensFromPrompt(prompt);
      if (tokenIds.length > 0) {
        searchParams.token_id = tokenIds[0];
        console.log(`${colors.dim}  🎯 Analyzing quantmetrics for token ID: ${tokenIds[0]}${colors.reset}`);
      } else {
        console.log(`${colors.dim}  📊 Getting general quantmetrics data...${colors.reset}`);
      }
      
      // Check for specific symbols in the prompt
      if (lowerPrompt.includes('bitcoin') || lowerPrompt.includes('btc')) {
        searchParams.symbol = 'BTC';
      } else if (lowerPrompt.includes('ethereum') || lowerPrompt.includes('eth')) {
        searchParams.symbol = 'ETH';
      }
      
      // Check for category filters
      if (lowerPrompt.includes('defi')) {
        searchParams.category = 'defi';
      } else if (lowerPrompt.includes('layer-1') || lowerPrompt.includes('layer1')) {
        searchParams.category = 'layer-1';
      }
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getQuantmetrics.executable(
          searchParams,
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Extract and format the data properly using the same pattern as other functions
        console.log(`${colors.dim}  ✅ Quantmetrics data retrieved successfully${colors.reset}`);
        
        // Parse the response to extract quantmetrics data
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatQuantmetricsResponse(responseData.data);
            } else {
              this.formatResponse("No quantmetrics data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("Quantmetrics data retrieved successfully! Check the detailed data above for advanced risk and performance analytics.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Quantmetrics data retrieved successfully! Check the detailed data above for advanced risk and performance analytics.", 'data');
        }
      } else {
        this.formatResponse(result.feedback || "Unable to retrieve quantmetrics data", 'error');
      }
    } catch (error: any) {
      console.error(`${colors.dim}  ❌ Quantmetrics error:${colors.reset}`, error);
      
      if (error.response?.status === 413) {
        this.formatResponse("❌ Request too large. Try being more specific with your query (e.g., 'Bitcoin quantmetrics' or 'DeFi quantmetrics')", 'error');
      } else if (error.response?.status === 400) {
        this.formatResponse("❌ Invalid request parameters. Try: 'quantmetrics', 'Bitcoin quantmetrics', or 'DeFi quantmetrics'", 'error');
      } else {
        this.formatResponse(`❌ Failed to get quantmetrics: ${error.message || error}`, 'error');
      }
    }
  }

  private formatQuantmetricsResponse(data: any[]): void {
    if (!data || data.length === 0) return;
    
    console.log(`${colors.cyan}${colors.bright}📊 QUANTITATIVE METRICS ANALYSIS [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}🔬 Advanced Risk & Performance Analytics for ${data.length} Tokens${colors.reset}\n`);
    
    // Show summary table first
    console.log(`${colors.bright}📋 SUMMARY OVERVIEW${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}${'Token'.padEnd(20)} ${'Sharpe'.padEnd(8)} ${'Return'.padEnd(10)} ${'Risk'.padEnd(12)} ${'Grade'.padEnd(8)}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    
    data.slice(0, 10).forEach((metrics, index) => {
      const tokenName = (metrics.TOKEN_NAME || 'Unknown').substring(0, 18);
      const tokenSymbol = metrics.TOKEN_SYMBOL || 'N/A';
      const sharpe = metrics.SHARPE || 0;
      const allTimeReturn = ((metrics.ALL_TIME_RETURN || 0) * 100);
      const volatility = ((metrics.VOLATILITY || 0) * 100);
      
      // Calculate overall grade
      let grade = 'F';
      let gradeColor = colors.red;
      if (sharpe > 2) { grade = 'A+'; gradeColor = colors.green; }
      else if (sharpe > 1.5) { grade = 'A'; gradeColor = colors.green; }
      else if (sharpe > 1) { grade = 'B+'; gradeColor = colors.yellow; }
      else if (sharpe > 0.5) { grade = 'B'; gradeColor = colors.yellow; }
      else if (sharpe > 0) { grade = 'C'; gradeColor = colors.yellow; }
      else { grade = 'D'; gradeColor = colors.red; }
      
      const sharpeColor = sharpe > 1 ? colors.green : sharpe > 0 ? colors.yellow : colors.red;
      const returnColor = allTimeReturn > 0 ? colors.green : colors.red;
      const riskColor = volatility > 150 ? colors.red : volatility > 100 ? colors.yellow : colors.green;
      
      const displayName = `${tokenName} (${tokenSymbol})`.padEnd(20);
      const displaySharpe = `${sharpeColor}${sharpe.toFixed(2)}${colors.reset}`.padEnd(15);
      const displayReturn = `${returnColor}${allTimeReturn.toFixed(1)}%${colors.reset}`.padEnd(17);
      const displayRisk = `${riskColor}${volatility.toFixed(0)}%${colors.reset}`.padEnd(19);
      const displayGrade = `${gradeColor}${grade}${colors.reset}`;
      
      console.log(`${displayName} ${displaySharpe} ${displayReturn} ${displayRisk} ${displayGrade}`);
    });
    
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}\n`);
    
    // Show detailed analysis for top 3 tokens by Sharpe ratio
    console.log(`${colors.bright}🔍 DETAILED ANALYSIS - TOP 3 PERFORMERS${colors.reset}`);
    console.log(`${colors.dim}${'═'.repeat(80)}${colors.reset}\n`);
    
    // Sort by Sharpe ratio for top performers
    const sortedData = [...data].sort((a, b) => (b.SHARPE || -999) - (a.SHARPE || -999));
    
    sortedData.slice(0, 3).forEach((metrics, index) => {
      const tokenName = metrics.TOKEN_NAME || 'Unknown';
      const tokenSymbol = metrics.TOKEN_SYMBOL || 'N/A';
      const date = metrics.DATE || new Date().toISOString();
      const volatility = (metrics.VOLATILITY || 0) * 100;
      const allTimeReturn = (metrics.ALL_TIME_RETURN || 0) * 100;
      const cagr = (metrics.CAGR || 0) * 100;
      const sharpe = metrics.SHARPE || 0;
      const sortino = metrics.SORTINO || 0;
      const maxDrawdown = Math.abs((metrics.MAX_DRAWDOWN || 0) * 100);
      const skew = metrics.SKEW || 0;
      const kurtosis = metrics.KURTOSIS || 0;
      const profitFactor = metrics.PROFIT_FACTOR || 0;
      const dailyVar = Math.abs((metrics.DAILY_VALUE_AT_RISK || 0) * 100);
      
      console.log(`${colors.bright}${index + 1}. ${tokenName} (${tokenSymbol})${colors.reset}`);
      console.log(`${colors.dim}📅 Analysis Date: ${new Date(date).toLocaleDateString()}${colors.reset}\n`);
      
      // Risk Metrics
      console.log(`${colors.red}⚠️  RISK METRICS${colors.reset}`);
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
      console.log(`📈 Volatility: ${volatility.toFixed(2)}% ${this.getVolatilityBar(volatility/100)}`);
      console.log(`   ${this.getVolatilityDescription(volatility/100)}`);
      console.log(`📉 Max Drawdown: -${maxDrawdown.toFixed(2)}% ${this.getDrawdownBar(-maxDrawdown/100)}`);
      console.log(`   ${this.getDrawdownDescription(-maxDrawdown/100)}`);
      console.log(`⚡ Daily VaR (95%): -${dailyVar.toFixed(2)}%`);
      console.log(`   Expected maximum daily loss in 95% of cases\n`);
      
      // Performance Metrics
      console.log(`${colors.green}📈 PERFORMANCE METRICS${colors.reset}`);
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
      console.log(`🚀 All-Time Return: ${allTimeReturn.toFixed(2)}% ${this.getReturnBar(allTimeReturn)}`);
      console.log(`📊 CAGR: ${cagr.toFixed(2)}% ${this.getCAGRBar(cagr/100)}`);
      console.log(`   Compound Annual Growth Rate - average yearly return\n`);
      
      // Risk-Adjusted Returns
      console.log(`${colors.yellow}⚖️  RISK-ADJUSTED RETURNS${colors.reset}`);
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
      console.log(`📐 Sharpe Ratio: ${sharpe.toFixed(2)} ${this.getSharpeBar(sharpe)} ${this.getSharpeRating(sharpe)}`);
      console.log(`   Risk-adjusted return (>1.0 is good, >2.0 is excellent)`);
      console.log(`📊 Sortino Ratio: ${sortino.toFixed(2)} ${this.getSortinoBar(sortino)} ${this.getSortinoRating(sortino)}`);
      console.log(`   Downside risk-adjusted return (focuses on negative volatility)\n`);
      
      // Advanced Statistics
      console.log(`${colors.magenta}🔬 ADVANCED STATISTICS${colors.reset}`);
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
      console.log(`📊 Skewness: ${skew.toFixed(3)} - ${this.getSkewDescription(skew)}`);
      console.log(`📈 Kurtosis: ${kurtosis.toFixed(2)} - ${this.getKurtosisDescription(kurtosis)}`);
      if (metrics.TAIL_RATIO) {
        console.log(`🎯 Tail Ratio: ${metrics.TAIL_RATIO.toFixed(2)}`);
        console.log(`   Ratio of upside to downside tail risks`);
      }
      console.log();
      
      // Trading Performance
      console.log(`${colors.cyan}💰 TRADING PERFORMANCE${colors.reset}`);
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
      console.log(`💎 Profit Factor: ${profitFactor.toFixed(2)} ${this.getProfitFactorBar(profitFactor)} ${this.getProfitFactorRating(profitFactor)}`);
      console.log(`   Ratio of gross profit to gross loss (>1.0 means profitable)`);
      
      // Generate insights
      const insights = this.generateQuantmetricsInsights(metrics);
      if (insights.length > 0) {
        console.log(`\n${colors.bright}💡 KEY INSIGHTS${colors.reset}`);
        console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
        insights.forEach(insight => {
          console.log(`   ${insight}`);
        });
      }
      
      if (index < 2) console.log(`\n${colors.dim}${'═'.repeat(80)}${colors.reset}\n`);
    });
    
    // Summary insights
    console.log(`\n${colors.bright}📊 PORTFOLIO INSIGHTS${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    
    const avgSharpe = data.reduce((sum, d) => sum + (d.SHARPE || 0), 0) / data.length;
    const avgReturn = data.reduce((sum, d) => sum + ((d.ALL_TIME_RETURN || 0) * 100), 0) / data.length;
    const avgVolatility = data.reduce((sum, d) => sum + ((d.VOLATILITY || 0) * 100), 0) / data.length;
    const profitableTokens = data.filter(d => (d.PROFIT_FACTOR || 0) > 1).length;
    
    console.log(`🎯 Average Sharpe Ratio: ${colors.cyan}${avgSharpe.toFixed(2)}${colors.reset} (${avgSharpe > 1 ? 'Good' : avgSharpe > 0 ? 'Fair' : 'Poor'})`);
    console.log(`📈 Average Return: ${avgReturn >= 0 ? colors.green : colors.red}${avgReturn.toFixed(2)}%${colors.reset}`);
    console.log(`⚡ Average Volatility: ${colors.yellow}${avgVolatility.toFixed(1)}%${colors.reset}`);
    console.log(`💰 Profitable Tokens: ${colors.green}${profitableTokens}/${data.length}${colors.reset} (${((profitableTokens/data.length)*100).toFixed(1)}%)`);
    
    console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}💡 Quantmetrics provide advanced risk and performance analytics${colors.reset}`);
    console.log(`${colors.dim}🎯 Focus on tokens with Sharpe > 1.0 and positive returns${colors.reset}`);
    console.log(`${colors.dim}⚠️  High volatility tokens require careful risk management${colors.reset}`);
    console.log();
  }

  private getVolatilityBar(volatility: number): string {
    const percentage = Math.min(volatility * 100, 100);
    const filled = Math.round(percentage / 4);
    const empty = 25 - filled;
    
    if (volatility < 0.3) return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (volatility < 0.6) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getVolatilityDescription(volatility: number): string {
    if (volatility < 0.2) return "Low volatility - Stable price movements";
    if (volatility < 0.4) return "Moderate volatility - Normal crypto fluctuations";
    if (volatility < 0.8) return "High volatility - Significant price swings";
    return "Extreme volatility - Very risky asset";
  }

  private getDrawdownBar(drawdown: number): string {
    const percentage = Math.abs(drawdown * 100);
    const filled = Math.min(Math.round(percentage / 4), 25);
    const empty = 25 - filled;
    
    if (percentage < 20) return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (percentage < 50) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getDrawdownDescription(drawdown: number): string {
    const percentage = Math.abs(drawdown * 100);
    if (percentage < 20) return "Low drawdown - Good downside protection";
    if (percentage < 50) return "Moderate drawdown - Typical crypto risk";
    if (percentage < 80) return "High drawdown - Significant losses possible";
    return "Extreme drawdown - Very high risk of large losses";
  }

  private getReturnBar(returnValue: number): string {
    const percentage = Math.min(Math.max(returnValue, 0), 10000);
    const filled = Math.min(Math.round(percentage / 400), 25);
    const empty = 25 - filled;
    
    if (returnValue > 1000) return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (returnValue > 100) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getCAGRBar(cagr: number): string {
    const percentage = Math.max(cagr * 100, 0);
    const filled = Math.min(Math.round(percentage / 4), 25);
    const empty = 25 - filled;
    
    if (cagr > 0.5) return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (cagr > 0.2) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getSharpeBar(sharpe: number): string {
    const filled = Math.min(Math.max(Math.round(sharpe * 8), 0), 25);
    const empty = 25 - filled;
    
    if (sharpe > 2) return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (sharpe > 1) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getSharpeRating(sharpe: number): string {
    if (sharpe > 3) return `${colors.green}🌟 EXCELLENT${colors.reset}`;
    if (sharpe > 2) return `${colors.green}✅ VERY GOOD${colors.reset}`;
    if (sharpe > 1) return `${colors.yellow}👍 GOOD${colors.reset}`;
    if (sharpe > 0) return `${colors.yellow}⚠️  FAIR${colors.reset}`;
    return `${colors.red}❌ POOR${colors.reset}`;
  }

  private getSortinoBar(sortino: number): string {
    const filled = Math.min(Math.max(Math.round(sortino * 6), 0), 25);
    const empty = 25 - filled;
    
    if (sortino > 2) return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (sortino > 1) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getSortinoRating(sortino: number): string {
    if (sortino > 3) return `${colors.green}🌟 EXCELLENT${colors.reset}`;
    if (sortino > 2) return `${colors.green}✅ VERY GOOD${colors.reset}`;
    if (sortino > 1) return `${colors.yellow}👍 GOOD${colors.reset}`;
    if (sortino > 0) return `${colors.yellow}⚠️  FAIR${colors.reset}`;
    return `${colors.red}❌ POOR${colors.reset}`;
  }

  private getProfitFactorBar(profitFactor: number): string {
    const filled = Math.min(Math.max(Math.round(profitFactor * 10), 0), 25);
    const empty = 25 - filled;
    
    if (profitFactor > 2) return `${colors.green}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    if (profitFactor > 1) return `${colors.yellow}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
    return `${colors.red}${'█'.repeat(filled)}${'░'.repeat(empty)}${colors.reset}`;
  }

  private getProfitFactorRating(profitFactor: number): string {
    if (profitFactor > 2) return `${colors.green}🌟 EXCELLENT${colors.reset}`;
    if (profitFactor > 1.5) return `${colors.green}✅ VERY GOOD${colors.reset}`;
    if (profitFactor > 1) return `${colors.yellow}👍 PROFITABLE${colors.reset}`;
    return `${colors.red}❌ UNPROFITABLE${colors.reset}`;
  }

  private getSkewDescription(skew: number): string {
    if (skew > 0.5) return "Positive skew - More upside potential";
    if (skew > -0.5) return "Normal distribution - Balanced risk";
    return "Negative skew - More downside risk";
  }

  private getKurtosisDescription(kurtosis: number): string {
    if (kurtosis > 10) return "Very high kurtosis - Extreme price movements common";
    if (kurtosis > 3) return "High kurtosis - Fat tails, more extreme events";
    return "Normal kurtosis - Standard distribution";
  }

  private generateQuantmetricsInsights(metrics: any): string[] {
    const insights: string[] = [];
    
    // Sharpe ratio insights
    if (metrics.SHARPE > 2) {
      insights.push(`🌟 Excellent risk-adjusted returns (Sharpe: ${metrics.SHARPE.toFixed(2)})`);
    } else if (metrics.SHARPE < 0) {
      insights.push(`⚠️  Poor risk-adjusted performance - consider risk management`);
    }
    
    // Volatility insights
    if (metrics.VOLATILITY > 0.8) {
      insights.push(`⚡ Extremely volatile asset - suitable for risk-tolerant traders only`);
    } else if (metrics.VOLATILITY < 0.3) {
      insights.push(`🛡️  Relatively stable for crypto - good for conservative portfolios`);
    }
    
    // Drawdown insights
    if (Math.abs(metrics.MAX_DRAWDOWN) > 0.8) {
      insights.push(`📉 High maximum drawdown - prepare for significant potential losses`);
    }
    
    // Profit factor insights
    if (metrics.PROFIT_FACTOR > 1.5) {
      insights.push(`💰 Strong profit factor indicates good trading profitability`);
    } else if (metrics.PROFIT_FACTOR < 1) {
      insights.push(`❌ Profit factor below 1.0 - losses exceed profits historically`);
    }
    
    // CAGR insights
    if (metrics.CAGR > 1) {
      insights.push(`🚀 Exceptional compound annual growth rate of ${(metrics.CAGR * 100).toFixed(1)}%`);
    }
    
    // Skew insights
    if (metrics.SKEW < -0.5) {
      insights.push(`⚠️  Negative skew suggests higher probability of large losses`);
    } else if (metrics.SKEW > 0.5) {
      insights.push(`📈 Positive skew indicates potential for large gains`);
    }
    
    if (insights.length === 0) {
      insights.push(`📊 Mixed performance metrics - analyze individual ratios for investment decisions`);
    }
    
    return insights;
  }

  private async getHourlyOhlcv(prompt: string): Promise<void> {
    try {
      // Extract token IDs from the user's prompt
      const tokenIds = await this.extractTokensFromPrompt(prompt);
      const primaryTokenId = tokenIds[0]; // Use the first detected token for OHLCV data
      
      console.log(`${colors.dim}  🎯 Getting hourly OHLCV data for token ID: ${primaryTokenId}${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getHourlyOhlcv.executable(
          { token_id: primaryTokenId, limit: "24", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the OHLCV data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatOhlcvResponse(responseData.data, 'hourly');
            } else {
              this.formatResponse("No hourly OHLCV data available for the requested token.", 'error');
            }
          } else {
            this.formatResponse("Hourly OHLCV data retrieved successfully! Check the detailed analysis above for price and volume insights.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Hourly OHLCV data retrieved successfully! Check the detailed analysis above for price and volume insights.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Hourly OHLCV query failed: ${error}`, 'error');
    }
  }

  private async getDailyOhlcv(prompt: string): Promise<void> {
    try {
      // Extract token IDs from the user's prompt
      const tokenIds = await this.extractTokensFromPrompt(prompt);
      const primaryTokenId = tokenIds[0]; // Use the first detected token for OHLCV data
      
      console.log(`${colors.dim}  🎯 Getting daily OHLCV data for token ID: ${primaryTokenId}${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getDailyOhlcv.executable(
          { token_id: primaryTokenId, limit: "30", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the OHLCV data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              const data = responseData.data;
              const dataLength = data.length;
              const tokenName = data[0].TOKEN_NAME || 'Unknown';
              
              if (dataLength < 30) {
                console.log(`${colors.yellow}⚠️  Data Availability Notice:${colors.reset}`);
                console.log(`${colors.yellow}   Only ${dataLength} day(s) of daily OHLCV data available for ${tokenName}${colors.reset}`);
                console.log(`${colors.yellow}   Requested 30 days but TokenMetrics API returned ${dataLength} day(s)${colors.reset}`);
                console.log(`${colors.dim}   This may be due to limited historical data availability for this token${colors.reset}`);
                console.log();
              }
              
              this.formatOhlcvResponse(data, 'daily');
            } else {
              this.formatResponse("No daily OHLCV data available for the requested token.", 'error');
            }
          } else {
            this.formatResponse("Daily OHLCV data retrieved successfully! Check the detailed analysis above for price and volume insights.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Daily OHLCV data retrieved successfully! Check the detailed analysis above for price and volume insights.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Daily OHLCV query failed: ${error}`, 'error');
    }
  }

  private formatOhlcvResponse(data: any[], timeframe: 'hourly' | 'daily'): void {
    if (!data || data.length === 0) return;
    
    const tokenName = data[0].TOKEN_NAME || 'Unknown';
    const tokenSymbol = data[0].TOKEN_SYMBOL || 'N/A';
    const timeframeName = timeframe === 'hourly' ? 'Hourly' : 'Daily';
    const period = timeframe === 'hourly' ? '24 Hours' : '30 Days';
    
    console.log(`${colors.cyan}${colors.bright}📊 ${timeframeName} OHLCV Analysis [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(85)}${colors.reset}`);
    console.log(`${colors.bright}📈 ${tokenName} (${tokenSymbol}) - ${period} Price & Volume Data${colors.reset}`);
    console.log(`${colors.dim}📅 Data Points: ${data.length} ${timeframe} candles | 🔄 Last Updated: ${new Date().toLocaleString()}${colors.reset}`);
    console.log();
    
    // Sort data by date (most recent first)
    const sortedData = data.sort((a: any, b: any) => new Date(b.TIMESTAMP || b.DATE).getTime() - new Date(a.TIMESTAMP || a.DATE).getTime());
    
    // Calculate key metrics
    const prices = sortedData.map((d: any) => d.CLOSE);
    const volumes = sortedData.map((d: any) => d.VOLUME);
    const highs = sortedData.map((d: any) => d.HIGH);
    const lows = sortedData.map((d: any) => d.LOW);
    const opens = sortedData.map((d: any) => d.OPEN);
    
    const currentPrice = prices[0];
    const oldestPrice = prices[prices.length - 1];
    const highestPrice = Math.max(...highs);
    const lowestPrice = Math.min(...lows);
    const avgVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length;
    const totalVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0);
    
    const priceChange = currentPrice - oldestPrice;
    const priceChangePercent = (priceChange / oldestPrice) * 100;
    
    // Calculate moving averages
    const ma5 = this.calculateMovingAverage(prices, 5);
    const ma10 = this.calculateMovingAverage(prices, 10);
    const ma20 = this.calculateMovingAverage(prices, 20);
    
    // Calculate support and resistance levels
    const supportResistance = this.calculateSupportResistance(highs, lows);
    
    // Show enhanced price summary with visual indicators
    console.log(`${colors.green}${colors.bright}💰 PRICE OVERVIEW${colors.reset}`);
    console.log(`${colors.green}${'─'.repeat(60)}${colors.reset}`);
    
    const priceBar = this.getPricePositionBar(currentPrice, lowestPrice, highestPrice);
    console.log(`📊 Current Price: ${colors.bright}$${this.formatPrice(currentPrice)}${colors.reset}`);
    console.log(`📈 ${period} Range: ${priceBar}`);
    console.log(`   ${colors.dim}Low: $${this.formatPrice(lowestPrice)} ←→ High: $${this.formatPrice(highestPrice)}${colors.reset}`);
    
    const changeColor = priceChange >= 0 ? colors.green : colors.red;
    const changeSymbol = priceChange >= 0 ? '📈' : '📉';
    const changeBar = this.getChangeBar(priceChangePercent);
    console.log(`${changeSymbol} ${period} Change: ${changeColor}${priceChange >= 0 ? '+' : ''}$${this.formatPrice(priceChange)} (${priceChangePercent.toFixed(2)}%)${colors.reset}`);
    console.log(`   ${changeBar}`);
    
    const volatility = ((highestPrice - lowestPrice) / lowestPrice * 100);
    const volatilityBar = this.getVolatilityBar(volatility);
    console.log(`⚡ Volatility: ${volatility.toFixed(2)}% ${volatilityBar}`);
    console.log();
    
    // Enhanced moving averages section
    console.log(`${colors.yellow}${colors.bright}📈 MOVING AVERAGES & TREND${colors.reset}`);
    console.log(`${colors.yellow}${'─'.repeat(60)}${colors.reset}`);
    console.log(`📊 MA5:  $${this.formatPrice(ma5)} ${this.getTrendIndicator(currentPrice, ma5)}`);
    console.log(`📊 MA10: $${this.formatPrice(ma10)} ${this.getTrendIndicator(currentPrice, ma10)}`);
    console.log(`📊 MA20: $${this.formatPrice(ma20)} ${this.getTrendIndicator(currentPrice, ma20)}`);
    
    const trendSignal = this.getTrendSignal(currentPrice, ma5, ma10, ma20);
    console.log(`🎯 Trend Signal: ${trendSignal}`);
    console.log();
    
    // Enhanced volume analysis with visual bars
    console.log(`${colors.blue}${colors.bright}📦 VOLUME ANALYSIS${colors.reset}`);
    console.log(`${colors.blue}${'─'.repeat(60)}${colors.reset}`);
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);
    const currentVolume = volumes[0];
    
    console.log(`📦 Current Volume: ${this.formatLargeNumber(currentVolume)}`);
    console.log(`📊 Volume Range: ${this.getVolumeBar(currentVolume, minVolume, maxVolume)}`);
    console.log(`   ${colors.dim}Min: ${this.formatLargeNumber(minVolume)} ←→ Max: ${this.formatLargeNumber(maxVolume)}${colors.reset}`);
    console.log(`📈 Total Volume: ${this.formatLargeNumber(totalVolume)}`);
    console.log(`📊 Average Volume: ${this.formatLargeNumber(avgVolume)}`);
    
    const volumeTrend = this.getVolumeTrend(volumes.slice(0, 5), avgVolume);
    console.log(`🔥 Volume Trend: ${volumeTrend}`);
    console.log();
    
    // Support and Resistance levels
    console.log(`${colors.magenta}${colors.bright}🎯 SUPPORT & RESISTANCE${colors.reset}`);
    console.log(`${colors.magenta}${'─'.repeat(60)}${colors.reset}`);
    console.log(`🛡️  Support Level: ${colors.green}$${this.formatPrice(supportResistance.support)}${colors.reset} ${this.getLevelDistance(currentPrice, supportResistance.support, 'support')}`);
    console.log(`⚡ Resistance Level: ${colors.red}$${this.formatPrice(supportResistance.resistance)}${colors.reset} ${this.getLevelDistance(currentPrice, supportResistance.resistance, 'resistance')}`);
    console.log();
    
    // Enhanced recent candles with better formatting
    const recentCount = timeframe === 'hourly' ? 8 : 7;
    const recentData = sortedData.slice(0, recentCount);
    
    console.log(`${colors.cyan}${colors.bright}📅 RECENT ${timeframeName.toUpperCase()} CANDLES${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(85)}${colors.reset}`);
    console.log(`${'Time'.padEnd(14)} │ ${'Open'.padStart(10)} │ ${'High'.padStart(10)} │ ${'Low'.padStart(10)} │ ${'Close'.padStart(10)} │ ${'Volume'.padStart(10)} │ ${'Change'.padStart(8)}`);
    console.log(`${'─'.repeat(85)}`);
    
    recentData.forEach((candle: any, index: number) => {
      const date = new Date(candle.TIMESTAMP || candle.DATE);
      const dateStr = timeframe === 'hourly' 
        ? `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`
        : `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
      
      const open = this.formatPrice(candle.OPEN);
      const high = this.formatPrice(candle.HIGH);
      const low = this.formatPrice(candle.LOW);
      const close = this.formatPrice(candle.CLOSE);
      const volume = this.formatLargeNumber(candle.VOLUME);
      
      const candleChange = ((candle.CLOSE - candle.OPEN) / candle.OPEN * 100);
      const changeStr = `${candleChange >= 0 ? '+' : ''}${candleChange.toFixed(1)}%`;
      
      // Enhanced color coding and symbols
      const candleColor = candle.CLOSE >= candle.OPEN ? colors.green : colors.red;
      const candleSymbol = candle.CLOSE >= candle.OPEN ? '🟢' : '🔴';
      const isCurrentCandle = index === 0 ? '⭐' : '  ';
      
      console.log(`${isCurrentCandle}${candleSymbol} ${dateStr.padEnd(12)} │ ${candleColor}$${open.padStart(9)}${colors.reset} │ ${candleColor}$${high.padStart(9)}${colors.reset} │ ${candleColor}$${low.padStart(9)}${colors.reset} │ ${candleColor}$${close.padStart(9)}${colors.reset} │ ${volume.padStart(10)} │ ${candleColor}${changeStr.padStart(7)}${colors.reset}`);
    });
    
    console.log();
    
    // Enhanced trading insights with actionable recommendations
    console.log(`${colors.cyan}${colors.bright}💡 TRADING INSIGHTS & ANALYSIS${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
    
    const insights = this.generateOhlcvInsights(sortedData, timeframe);
    insights.forEach(insight => console.log(`   ${insight}`));
    console.log();
    
    // Trading recommendations
    const recommendation = this.generateTradingRecommendation(currentPrice, ma5, ma10, ma20, supportResistance, priceChangePercent, volatility);
    console.log(`${colors.yellow}${colors.bright}🎯 TRADING RECOMMENDATION${colors.reset}`);
    console.log(`${colors.yellow}${'─'.repeat(60)}${colors.reset}`);
    console.log(`   ${recommendation.signal}`);
    console.log(`   ${recommendation.reasoning}`);
    console.log(`   ${recommendation.riskLevel}`);
    console.log();
    
    // Enhanced trend analysis with visual indicators
    console.log(`${colors.magenta}${colors.bright}📈 COMPREHENSIVE TREND ANALYSIS${colors.reset}`);
    console.log(`${colors.magenta}${'─'.repeat(60)}${colors.reset}`);
    
    const trendAnalysis = this.analyzePriceTrend(sortedData);
    console.log(`📊 Overall Trend: ${trendAnalysis.trend}`);
    console.log(`🎯 Trend Strength: ${trendAnalysis.strength}`);
    console.log(`📈 Bullish Candles: ${trendAnalysis.bullishCount}/${data.length} ${this.getCandleBar(trendAnalysis.bullishCount, data.length, 'bullish')}`);
    console.log(`📉 Bearish Candles: ${trendAnalysis.bearishCount}/${data.length} ${this.getCandleBar(trendAnalysis.bearishCount, data.length, 'bearish')}`);
    
    // Market sentiment based on technical indicators
    const marketSentiment = this.calculateMarketSentiment(trendAnalysis, priceChangePercent, volatility, currentPrice, ma5, ma10);
    console.log(`🎭 Market Sentiment: ${marketSentiment}`);
    
    console.log();
    console.log(`${colors.cyan}${'═'.repeat(85)}${colors.reset}`);
    console.log(`${colors.dim}📊 Analysis powered by TokenMetrics OHLCV data | 🔄 Auto-refresh available${colors.reset}`);
    console.log(`${colors.dim}💡 Tip: Try "Bitcoin daily data" or "Ethereum hourly data" for different timeframes${colors.reset}`);
    console.log();
  }

  // Helper methods for enhanced OHLCV formatting
  private calculateMovingAverage(prices: number[], period: number): number {
    if (prices.length < period) return prices[0] || 0;
    const slice = prices.slice(0, period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  }

  private calculateSupportResistance(highs: number[], lows: number[]): { support: number; resistance: number } {
    // Simple support/resistance calculation based on recent highs and lows
    const recentHighs = highs.slice(0, Math.min(10, highs.length));
    const recentLows = lows.slice(0, Math.min(10, lows.length));
    
    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);
    
    return { support, resistance };
  }

  private getPricePositionBar(current: number, low: number, high: number): string {
    const range = high - low;
    const position = (current - low) / range;
    const barLength = 30;
    const filledLength = Math.round(position * barLength);
    
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    const percentage = (position * 100).toFixed(1);
    
    return `${colors.dim}[${colors.reset}${colors.cyan}${bar}${colors.reset}${colors.dim}] ${percentage}%${colors.reset}`;
  }

  private getChangeBar(changePercent: number): string {
    const isPositive = changePercent >= 0;
    const absChange = Math.abs(changePercent);
    const barLength = Math.min(Math.round(absChange / 2), 20); // Scale bar length
    
    const color = isPositive ? colors.green : colors.red;
    const symbol = isPositive ? '▲' : '▼';
    const bar = symbol.repeat(Math.max(1, barLength));
    
    return `${colors.dim}[${color}${bar}${colors.reset}${colors.dim}]${colors.reset}`;
  }

  private getTrendIndicator(currentPrice: number, ma: number): string {
    const diff = ((currentPrice - ma) / ma * 100);
    if (diff > 2) return `${colors.green}📈 +${diff.toFixed(1)}%${colors.reset}`;
    if (diff < -2) return `${colors.red}📉 ${diff.toFixed(1)}%${colors.reset}`;
    return `${colors.yellow}➡️  ${diff.toFixed(1)}%${colors.reset}`;
  }

  private getTrendSignal(current: number, ma5: number, ma10: number, ma20: number): string {
    const above5 = current > ma5;
    const above10 = current > ma10;
    const above20 = current > ma20;
    const ma5Above10 = ma5 > ma10;
    const ma10Above20 = ma10 > ma20;
    
    if (above5 && above10 && above20 && ma5Above10 && ma10Above20) {
      return `${colors.green}🚀 STRONG BULLISH - All MAs aligned upward${colors.reset}`;
    } else if (!above5 && !above10 && !above20 && !ma5Above10 && !ma10Above20) {
      return `${colors.red}🔻 STRONG BEARISH - All MAs aligned downward${colors.reset}`;
    } else if (above5 && above10) {
      return `${colors.green}📈 BULLISH - Above short-term MAs${colors.reset}`;
    } else if (!above5 && !above10) {
      return `${colors.red}📉 BEARISH - Below short-term MAs${colors.reset}`;
    } else {
      return `${colors.yellow}🔄 NEUTRAL - Mixed signals${colors.reset}`;
    }
  }

  private getVolumeBar(current: number, min: number, max: number): string {
    const range = max - min;
    const position = range > 0 ? (current - min) / range : 0.5;
    const barLength = 25;
    const filledLength = Math.round(position * barLength);
    
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    const percentage = (position * 100).toFixed(1);
    
    return `${colors.dim}[${colors.reset}${colors.blue}${bar}${colors.reset}${colors.dim}] ${percentage}%${colors.reset}`;
  }

  private getVolumeTrend(recentVolumes: number[], avgVolume: number): string {
    const recentAvg = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const change = ((recentAvg - avgVolume) / avgVolume * 100);
    
    if (change > 50) return `${colors.green}🔥 SURGING (+${change.toFixed(0)}%)${colors.reset}`;
    if (change > 20) return `${colors.green}📈 INCREASING (+${change.toFixed(0)}%)${colors.reset}`;
    if (change < -50) return `${colors.red}💧 DECLINING (${change.toFixed(0)}%)${colors.reset}`;
    if (change < -20) return `${colors.red}📉 DECREASING (${change.toFixed(0)}%)${colors.reset}`;
    return `${colors.yellow}➡️  STABLE (${change.toFixed(0)}%)${colors.reset}`;
  }

  private getLevelDistance(currentPrice: number, level: number, type: 'support' | 'resistance'): string {
    const distance = Math.abs(currentPrice - level);
    const percentage = (distance / currentPrice * 100);
    const direction = type === 'support' ? 'below' : 'above';
    
    if (percentage < 2) return `${colors.yellow}⚠️  Very close (${percentage.toFixed(1)}% ${direction})${colors.reset}`;
    if (percentage < 5) return `${colors.dim}📍 Close (${percentage.toFixed(1)}% ${direction})${colors.reset}`;
    return `${colors.dim}📏 ${percentage.toFixed(1)}% ${direction}${colors.reset}`;
  }

  private getCandleBar(count: number, total: number, type: 'bullish' | 'bearish'): string {
    const percentage = (count / total * 100);
    const barLength = Math.round(percentage / 5); // Scale to 20 max length
    const color = type === 'bullish' ? colors.green : colors.red;
    const symbol = type === 'bullish' ? '▲' : '▼';
    
    return `${color}${symbol.repeat(Math.max(1, barLength))}${colors.reset} ${colors.dim}(${percentage.toFixed(1)}%)${colors.reset}`;
  }

  private generateTradingRecommendation(
    currentPrice: number, 
    ma5: number, 
    ma10: number, 
    ma20: number, 
    levels: { support: number; resistance: number },
    priceChange: number,
    volatility: number
  ): { signal: string; reasoning: string; riskLevel: string } {
    
    const nearSupport = Math.abs(currentPrice - levels.support) / currentPrice < 0.02;
    const nearResistance = Math.abs(currentPrice - levels.resistance) / currentPrice < 0.02;
    const aboveMA5 = currentPrice > ma5;
    const aboveMA10 = currentPrice > ma10;
    const strongUptrend = priceChange > 5;
    const strongDowntrend = priceChange < -5;
    const highVolatility = volatility > 30;
    
    let signal: string;
    let reasoning: string;
    let riskLevel: string;
    
    if (nearSupport && aboveMA5 && !strongDowntrend) {
      signal = `${colors.green}🟢 BUY SIGNAL - Bouncing off support${colors.reset}`;
      reasoning = `${colors.dim}💡 Price near support level with MA5 holding. Good entry opportunity.${colors.reset}`;
      riskLevel = `${colors.yellow}⚠️  Medium Risk - Set stop loss below support${colors.reset}`;
    } else if (nearResistance && !aboveMA10 && !strongUptrend) {
      signal = `${colors.red}🔴 SELL SIGNAL - Approaching resistance${colors.reset}`;
      reasoning = `${colors.dim}💡 Price near resistance with weak momentum. Consider taking profits.${colors.reset}`;
      riskLevel = `${colors.yellow}⚠️  Medium Risk - Watch for breakout above resistance${colors.reset}`;
    } else if (strongUptrend && aboveMA5 && aboveMA10) {
      signal = `${colors.green}🚀 STRONG BUY - Momentum breakout${colors.reset}`;
      reasoning = `${colors.dim}💡 Strong upward momentum with MA support. Trend continuation likely.${colors.reset}`;
      riskLevel = highVolatility ? `${colors.red}🔥 High Risk - High volatility${colors.reset}` : `${colors.green}✅ Low Risk - Strong trend${colors.reset}`;
    } else if (strongDowntrend && !aboveMA5 && !aboveMA10) {
      signal = `${colors.red}🔻 STRONG SELL - Momentum breakdown${colors.reset}`;
      reasoning = `${colors.dim}💡 Strong downward momentum below MAs. Further decline expected.${colors.reset}`;
      riskLevel = `${colors.red}🔥 High Risk - Strong bearish momentum${colors.reset}`;
    } else if (highVolatility) {
      signal = `${colors.yellow}⏸️  HOLD - High volatility period${colors.reset}`;
      reasoning = `${colors.dim}💡 High volatility makes direction unclear. Wait for clearer signals.${colors.reset}`;
      riskLevel = `${colors.red}🔥 High Risk - Unpredictable price action${colors.reset}`;
    } else {
      signal = `${colors.yellow}🔄 NEUTRAL - Mixed signals${colors.reset}`;
      reasoning = `${colors.dim}💡 No clear directional bias. Consider range trading or wait for breakout.${colors.reset}`;
      riskLevel = `${colors.yellow}⚠️  Medium Risk - Sideways market${colors.reset}`;
    }
    
    return { signal, reasoning, riskLevel };
  }

  private calculateMarketSentiment(
    trendAnalysis: any, 
    priceChange: number, 
    volatility: number, 
    currentPrice: number, 
    ma5: number, 
    ma10: number
  ): string {
    const bullishPercent = (trendAnalysis.bullishCount / (trendAnalysis.bullishCount + trendAnalysis.bearishCount)) * 100;
    const aboveMA = currentPrice > ma5 && currentPrice > ma10;
    const strongMove = Math.abs(priceChange) > 10;
    const lowVolatility = volatility < 15;
    
    if (bullishPercent > 70 && aboveMA && priceChange > 0) {
      return `${colors.green}😊 VERY BULLISH - Strong positive sentiment${colors.reset}`;
    } else if (bullishPercent < 30 && !aboveMA && priceChange < 0) {
      return `${colors.red}😰 VERY BEARISH - Strong negative sentiment${colors.reset}`;
    } else if (bullishPercent > 60 && priceChange > 0) {
      return `${colors.green}🙂 BULLISH - Positive sentiment${colors.reset}`;
    } else if (bullishPercent < 40 && priceChange < 0) {
      return `${colors.red}🙁 BEARISH - Negative sentiment${colors.reset}`;
    } else if (lowVolatility && Math.abs(priceChange) < 5) {
      return `${colors.blue}😐 CALM - Low volatility, stable sentiment${colors.reset}`;
    } else if (strongMove) {
      return `${colors.yellow}🤔 UNCERTAIN - High volatility, mixed signals${colors.reset}`;
    } else {
      return `${colors.yellow}😑 NEUTRAL - Balanced sentiment${colors.reset}`;
    }
  }

  private generateOhlcvInsights(data: any[], timeframe: 'hourly' | 'daily'): string[] {
    const insights: string[] = [];
    const period = timeframe === 'hourly' ? '24-hour' : '30-day';
    
    // Price movement analysis
    const prices = data.map((d: any) => d.CLOSE);
    const currentPrice = prices[0];
    const oldestPrice = prices[prices.length - 1];
    const priceChangePercent = ((currentPrice - oldestPrice) / oldestPrice) * 100;
    
    if (Math.abs(priceChangePercent) > 20) {
      const direction = priceChangePercent > 0 ? 'surge' : 'decline';
      insights.push(`⚡ Significant ${period} ${direction} of ${Math.abs(priceChangePercent).toFixed(1)}%`);
    } else if (Math.abs(priceChangePercent) > 10) {
      const direction = priceChangePercent > 0 ? 'gain' : 'loss';
      insights.push(`📈 Notable ${period} ${direction} of ${Math.abs(priceChangePercent).toFixed(1)}%`);
    }
    
    // Volume analysis
    const volumes = data.map((d: any) => d.VOLUME);
    const avgVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length;
    const recentVolume = volumes.slice(0, Math.min(5, volumes.length));
    const recentAvgVolume = recentVolume.reduce((sum: number, vol: number) => sum + vol, 0) / recentVolume.length;
    
    if (recentAvgVolume > avgVolume * 1.5) {
      insights.push(`🔥 Above-average volume activity - ${((recentAvgVolume/avgVolume - 1) * 100).toFixed(0)}% higher than usual`);
    } else if (recentAvgVolume < avgVolume * 0.5) {
      insights.push(`💧 Below-average volume activity - ${((1 - recentAvgVolume/avgVolume) * 100).toFixed(0)}% lower than usual`);
    }
    
    // Volatility analysis
    const highs = data.map((d: any) => d.HIGH);
    const lows = data.map((d: any) => d.LOW);
    const volatility = ((Math.max(...highs) - Math.min(...lows)) / Math.min(...lows)) * 100;
    
    if (volatility > 50) {
      insights.push(`⚡ High volatility period with ${volatility.toFixed(0)}% price range`);
    } else if (volatility < 10) {
      insights.push(`🛡️ Low volatility period with only ${volatility.toFixed(1)}% price range`);
    }
    
    // Candle pattern analysis
    const bullishCandles = data.filter((d: any) => d.CLOSE > d.OPEN).length;
    const bearishCandles = data.filter((d: any) => d.CLOSE < d.OPEN).length;
    const bullishPercent = (bullishCandles / data.length) * 100;
    
    if (bullishPercent > 70) {
      insights.push(`🟢 Strong bullish sentiment - ${bullishPercent.toFixed(0)}% green candles`);
    } else if (bullishPercent < 30) {
      insights.push(`🔴 Strong bearish sentiment - ${(100-bullishPercent).toFixed(0)}% red candles`);
    }
    
    // Recent momentum
    const recentPrices = prices.slice(0, Math.min(5, prices.length));
    const isUptrend = recentPrices.every((price, index) => 
      index === 0 || price >= recentPrices[index - 1] * 0.98 // Allow 2% tolerance
    );
    const isDowntrend = recentPrices.every((price, index) => 
      index === 0 || price <= recentPrices[index - 1] * 1.02 // Allow 2% tolerance
    );
    
    if (isUptrend) {
      insights.push(`📈 Recent upward momentum - consistent price increases`);
    } else if (isDowntrend) {
      insights.push(`📉 Recent downward momentum - consistent price decreases`);
    }
    
    if (insights.length === 0) {
      insights.push(`📊 Mixed ${period} performance with balanced price and volume activity`);
    }
    
    return insights;
  }

  private analyzePriceTrend(data: any[]): { trend: string; strength: string; bullishCount: number; bearishCount: number } {
    const prices = data.map((d: any) => d.CLOSE);
    const currentPrice = prices[0];
    const oldestPrice = prices[prices.length - 1];
    const priceChangePercent = ((currentPrice - oldestPrice) / oldestPrice) * 100;
    
    const bullishCandles = data.filter((d: any) => d.CLOSE > d.OPEN).length;
    const bearishCandles = data.filter((d: any) => d.CLOSE < d.OPEN).length;
    
    // Determine trend
    let trend: string;
    
    if (priceChangePercent > 5) {
      trend = `${colors.green}🚀 STRONG BULLISH${colors.reset}`;
    } else if (priceChangePercent > 1) {
      trend = `${colors.green}📈 BULLISH${colors.reset}`;
    } else if (priceChangePercent > -1) {
      trend = `${colors.yellow}➡️  SIDEWAYS${colors.reset}`;
    } else if (priceChangePercent > -5) {
      trend = `${colors.red}📉 BEARISH${colors.reset}`;
    } else {
      trend = `${colors.red}💥 STRONG BEARISH${colors.reset}`;
    }
    
    // Determine strength based on consistency
    const bullishPercent = (bullishCandles / data.length) * 100;
    let strength: string;
    
    if (bullishPercent > 80 || bullishPercent < 20) {
      strength = `${colors.bright}🔥 VERY STRONG${colors.reset}`;
    } else if (bullishPercent > 65 || bullishPercent < 35) {
      strength = `${colors.yellow}💪 STRONG${colors.reset}`;
    } else if (bullishPercent > 55 || bullishPercent < 45) {
      strength = `${colors.blue}📊 MODERATE${colors.reset}`;
    } else {
      strength = `${colors.dim}⚪ WEAK${colors.reset}`;
    }
    
    return {
      trend,
      strength,
      bullishCount: bullishCandles,
      bearishCount: bearishCandles
    };
  }

  private async getAiReports(prompt: string): Promise<void> {
    try {
      console.log(`${colors.dim}  🎯 Getting general AI reports from TokenMetrics${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getAiReports.executable(
          { limit: "5", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Don't show generic message since we've already formatted the data
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`AI reports query failed: ${error}`, 'error');
    }
  }

  private formatAiReportsResponse(data: any[]): void {
    if (!data || data.length === 0) return;
    
    console.log(`${colors.cyan}🤖 AI Reports Analysis [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log('═'.repeat(80));
    
    data.forEach((report: any, index: number) => {
      const tokenName = report.TOKEN_NAME || 'Unknown';
      const tokenSymbol = report.TOKEN_SYMBOL || 'N/A';
      
      console.log(`📊 ${tokenName} (${tokenSymbol}) - Comprehensive AI Analysis`);
      console.log();
      
      // Process different report types
      const reportTypes = [
        { key: 'INVESTMENT_ANALYSIS_POINTER', title: '📋 INVESTMENT OVERVIEW', icon: '💰' },
        { key: 'INVESTMENT_ANALYSIS', title: '📈 INVESTMENT ANALYSIS', icon: '📊' },
        { key: 'DEEP_DIVE', title: '🔍 DEEP DIVE ANALYSIS', icon: '🎯' },
        { key: 'CODE_REVIEW', title: '💻 TECHNICAL CODE REVIEW', icon: '⚙️' }
      ];
      
      reportTypes.forEach((reportType, typeIndex) => {
        const reportText = report[reportType.key];
        if (reportText && reportText.trim()) {
          console.log(`${colors.bright}${reportType.icon} ${reportType.title}${colors.reset}`);
          console.log('═'.repeat(60));
          
          // Parse the markdown-style report
          const sections = this.parseMarkdownReport(reportText);
          
          // Display executive summary first if available
          if (sections.executiveSummary) {
            console.log(`${colors.green}📋 EXECUTIVE SUMMARY${colors.reset}`);
            console.log('─'.repeat(40));
            console.log(this.formatTextBlock(sections.executiveSummary, 70));
            console.log();
          }
          
          // Display key insights
          if (sections.keyPoints && sections.keyPoints.length > 0) {
            console.log(`${colors.blue}💡 KEY INSIGHTS${colors.reset}`);
            console.log('─'.repeat(40));
            sections.keyPoints.slice(0, 5).forEach((point: string, i: number) => {
              console.log(`${i + 1}. ${point.trim()}`);
            });
            console.log();
          }
          
          // Display market analysis
          if (sections.marketAnalysis) {
            console.log(`${colors.yellow}📊 MARKET ANALYSIS${colors.reset}`);
            console.log('─'.repeat(40));
            console.log(this.formatTextBlock(sections.marketAnalysis, 70));
            console.log();
          }
          
          // Display features/technology
          if (sections.features && sections.features.length > 0) {
            console.log(`${colors.cyan}⚡ KEY FEATURES${colors.reset}`);
            console.log('─'.repeat(40));
            sections.features.slice(0, 6).forEach((feature: string) => {
              console.log(`🔹 ${feature.trim()}`);
            });
            console.log();
          }
          
          // Display conclusion
          if (sections.conclusion) {
            console.log(`${colors.magenta}🎯 CONCLUSION${colors.reset}`);
            console.log('─'.repeat(40));
            console.log(this.formatTextBlock(sections.conclusion, 70));
            console.log();
          }
          
          // If this isn't the last report type, add separator
          if (typeIndex < reportTypes.length - 1 && reportTypes.slice(typeIndex + 1).some(rt => report[rt.key])) {
            console.log('─'.repeat(80));
            console.log();
          }
        }
      });
      
      if (index < data.length - 1) {
        console.log('═'.repeat(80));
        console.log();
      }
    });
    
    console.log('═'.repeat(80));
    console.log(`🤖 Analysis powered by TokenMetrics AI research models`);
    console.log();
  }

  private parseMarkdownReport(reportText: string): {
    executiveSummary?: string;
    keyPoints: string[];
    marketAnalysis?: string;
    features: string[];
    conclusion?: string;
  } {
    const sections = {
      executiveSummary: undefined as string | undefined,
      keyPoints: [] as string[],
      marketAnalysis: undefined as string | undefined,
      features: [] as string[],
      conclusion: undefined as string | undefined
    };
    
    // Split by markdown headers
    const headerRegex = /^#+\s+(.+)$/gm;
    const parts = reportText.split(headerRegex);
    
    for (let i = 0; i < parts.length; i += 2) {
      const header = parts[i]?.toLowerCase() || '';
      const content = parts[i + 1]?.trim() || '';
      
      if (!content) continue;
      
      if (header.includes('executive summary') || header.includes('summary')) {
        sections.executiveSummary = content;
      } else if (header.includes('market analysis') || header.includes('market')) {
        sections.marketAnalysis = content;
      } else if (header.includes('conclusion')) {
        sections.conclusion = content;
      } else if (header.includes('features') || header.includes('technology')) {
        // Extract bullet points
        const bullets = content.match(/^[-*]\s+(.+)$/gm);
        if (bullets) {
          sections.features.push(...bullets.map(b => b.replace(/^[-*]\s+/, '')));
        }
      }
    }
    
    // Extract key points from bullet lists throughout the document
    const allBullets = reportText.match(/^[-*]\s+(.+)$/gm);
    if (allBullets) {
      sections.keyPoints = allBullets
        .map(b => b.replace(/^[-*]\s+/, ''))
        .filter(point => point.length > 20 && point.length < 200)
        .slice(0, 8);
    }
    
    // If no executive summary found, extract first meaningful paragraph
    if (!sections.executiveSummary) {
      const paragraphs = reportText.split(/\n\s*\n/).filter(p => p.trim().length > 100);
      if (paragraphs.length > 0) {
        sections.executiveSummary = paragraphs[0].replace(/^#+\s+.+$/gm, '').trim();
      }
    }
    
    // If no conclusion found, extract last meaningful paragraph
    if (!sections.conclusion) {
      const paragraphs = reportText.split(/\n\s*\n/).filter(p => p.trim().length > 100);
      if (paragraphs.length > 1) {
        sections.conclusion = paragraphs[paragraphs.length - 1].replace(/^#+\s+.+$/gm, '').trim();
      }
    }
    
    return sections;
  }

  private formatTextBlock(text: string, maxWidth: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
  }

  private async getCryptoInvestors(): Promise<void> {
    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getCryptoInvestors.executable(
          { limit: "50", page: "1" },
          (msg: string) => {
            console.log(`${colors.dim}  📝 ${msg}${colors.reset}`);
          }
        );
      });
      
      if (result.status === 'done') {
        // Try to parse the full response from result.feedback
        try {
          const responseIndex = result.feedback.lastIndexOf('Response: ');
          if (responseIndex !== -1) {
            const jsonString = result.feedback.substring(responseIndex + 10).trim();
            const responseData = JSON.parse(jsonString);
                  if (responseData.data && responseData.data.length > 0) {
                    this.formatCryptoInvestorsResponse(responseData.data);
              return; // Exit early since we've formatted the data
                  }
                }
              } catch (e) {
                // If parsing fails, continue with default behavior
              }
      
        // Fallback to generic message if parsing fails
        this.formatResponse("Successfully retrieved crypto investors data", 'data');
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Crypto investors query failed: ${error}`, 'error');
    }
  }

  private formatCryptoInvestorsResponse(data: any[]): void {
    if (!data || data.length === 0) return;
    
    console.log(`${colors.cyan}💼 Institutional Investor Intelligence [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log('═'.repeat(80));
    console.log(`🏛️  Smart Money Analysis - ${data.length} Institutional Investors`);
    console.log(`📊 Investment Performance & Activity Tracking`);
    console.log();
    
    // Calculate overall statistics
    const totalInvestors = data.length;
    const avgROI = data.reduce((sum, inv) => sum + (inv.ROI_AVERAGE || 0), 0) / totalInvestors;
    const medianROI = data.reduce((sum, inv) => sum + (inv.ROI_MEDIAN || 0), 0) / totalInvestors;
    const totalRounds = data.reduce((sum, inv) => sum + parseInt(inv.ROUND_COUNT || '0'), 0);
    
    // Categorize investors by performance
    const topPerformers = data.filter(inv => (inv.ROI_AVERAGE || 0) > 0).sort((a, b) => (b.ROI_AVERAGE || 0) - (a.ROI_AVERAGE || 0));
    const activeInvestors = data.filter(inv => parseInt(inv.ROUND_COUNT || '0') >= 5).sort((a, b) => parseInt(b.ROUND_COUNT || '0') - parseInt(a.ROUND_COUNT || '0'));
    const strugglingInvestors = data.filter(inv => (inv.ROI_AVERAGE || 0) < -0.8).sort((a, b) => (a.ROI_AVERAGE || 0) - (b.ROI_AVERAGE || 0));
    
    // Market Overview
    console.log(`${colors.green}📈 MARKET OVERVIEW${colors.reset}`);
    console.log('─'.repeat(50));
    console.log(`📊 Total Investors Analyzed: ${colors.bright}${totalInvestors}${colors.reset}`);
    console.log(`💰 Average ROI: ${this.getROIColor(avgROI)}${(avgROI * 100).toFixed(2)}%${colors.reset}`);
    console.log(`📊 Median ROI: ${this.getROIColor(medianROI)}${(medianROI * 100).toFixed(2)}%${colors.reset}`);
    console.log(`🎯 Total Investment Rounds: ${colors.bright}${totalRounds}${colors.reset}`);
    console.log(`🏆 Profitable Investors: ${colors.green}${topPerformers.length}${colors.reset} (${((topPerformers.length / totalInvestors) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Underperforming: ${colors.red}${strugglingInvestors.length}${colors.reset} (${((strugglingInvestors.length / totalInvestors) * 100).toFixed(1)}%)`);
    console.log();
    
    // Top Performers Section
    if (topPerformers.length > 0) {
      console.log(`${colors.green}🏆 TOP PERFORMING INVESTORS${colors.reset}`);
      console.log('─'.repeat(50));
      
      const topToShow = topPerformers.slice(0, 8);
      topToShow.forEach((investor, index) => {
        const roi = (investor.ROI_AVERAGE * 100).toFixed(2);
        const rounds = investor.ROUND_COUNT || '0';
        const name = investor.INVESTOR_NAME || 'Unknown';
        const roiBar = this.getInvestorROIBar(investor.ROI_AVERAGE);
        
        console.log(`${colors.green}${(index + 1).toString().padStart(2)}. ${name.padEnd(25)}${colors.reset} │ ${roiBar} ${colors.green}+${roi}%${colors.reset} │ ${rounds} rounds`);
      });
      
      if (topPerformers.length > 8) {
        console.log(`${colors.dim}    ... and ${topPerformers.length - 8} more profitable investors${colors.reset}`);
      }
      console.log();
    }
    
    // Most Active Investors
    if (activeInvestors.length > 0) {
      console.log(`${colors.blue}🎯 MOST ACTIVE INVESTORS${colors.reset}`);
      console.log('─'.repeat(50));
      
      const activeToShow = activeInvestors.slice(0, 8);
      activeToShow.forEach((investor, index) => {
        const roi = (investor.ROI_AVERAGE * 100).toFixed(2);
        const rounds = investor.ROUND_COUNT || '0';
        const name = investor.INVESTOR_NAME || 'Unknown';
        const activityLevel = this.getActivityLevel(parseInt(rounds));
        const roiColor = this.getROIColor(investor.ROI_AVERAGE);
        
        console.log(`${colors.blue}${(index + 1).toString().padStart(2)}. ${name.padEnd(25)}${colors.reset} │ ${activityLevel} ${rounds} rounds │ ${roiColor}${roi}%${colors.reset}`);
      });
      
      if (activeInvestors.length > 8) {
        console.log(`${colors.dim}    ... and ${activeInvestors.length - 8} more active investors${colors.reset}`);
      }
      console.log();
    }
    
    // Notable Investors with Social Presence
    const socialInvestors = data.filter(inv => inv.INVESTOR_TWITTER || inv.INVESTOR_WEBSITE).slice(0, 6);
    if (socialInvestors.length > 0) {
      console.log(`${colors.magenta}🌐 NOTABLE INVESTORS (Social Presence)${colors.reset}`);
      console.log('─'.repeat(50));
      
      socialInvestors.forEach((investor, index) => {
        const roi = (investor.ROI_AVERAGE * 100).toFixed(2);
        const rounds = investor.ROUND_COUNT || '0';
        const name = investor.INVESTOR_NAME || 'Unknown';
        const roiColor = this.getROIColor(investor.ROI_AVERAGE);
        const hasTwitter = investor.INVESTOR_TWITTER ? '🐦' : '';
        const hasWebsite = investor.INVESTOR_WEBSITE ? '🌐' : '';
        
        console.log(`${colors.magenta}${(index + 1).toString().padStart(2)}. ${name.padEnd(25)}${colors.reset} │ ${roiColor}${roi}%${colors.reset} │ ${rounds} rounds ${hasTwitter}${hasWebsite}`);
      });
      console.log();
    }
    
    // Market Insights
    console.log(`${colors.cyan}💡 MARKET INSIGHTS${colors.reset}`);
    console.log('─'.repeat(50));
    
    const insights = this.generateInvestorInsights(data, topPerformers, activeInvestors, strugglingInvestors);
    insights.forEach(insight => console.log(`   ${insight}`));
    
    console.log();
    
    // Performance Distribution
    console.log(`${colors.yellow}📊 PERFORMANCE DISTRIBUTION${colors.reset}`);
    console.log('─'.repeat(50));
    
    const performanceRanges = this.categorizeInvestorPerformance(data);
    Object.entries(performanceRanges).forEach(([range, count]) => {
      const percentage = ((count / totalInvestors) * 100).toFixed(1);
      const bar = this.getPerformanceBar(count, totalInvestors);
      console.log(`${range.padEnd(20)} │ ${bar} ${count} investors (${percentage}%)`);
    });
    
    console.log();
    console.log('═'.repeat(80));
    console.log(`💼 ${colors.bright}Institutional Intelligence Summary:${colors.reset}`);
    console.log(`   • Smart money is ${avgROI > 0 ? 'generally profitable' : 'facing challenges'} with ${(Math.abs(avgROI) * 100).toFixed(1)}% average ${avgROI > 0 ? 'gains' : 'losses'}`);
    console.log(`   • ${activeInvestors.length} highly active investors (5+ rounds) driving market activity`);
    console.log(`   • ${topPerformers.length} profitable investors vs ${strugglingInvestors.length} underperforming`);
    console.log(`   • Total market exposure: ${totalRounds} investment rounds tracked`);
    console.log('─'.repeat(80));
    console.log(`📈 Analysis powered by TokenMetrics institutional intelligence`);
    console.log();
  }

  private getROIColor(roi: number): string {
    if (roi > 0.5) return colors.green;
    if (roi > 0) return colors.yellow;
    if (roi > -0.5) return colors.red;
    return colors.dim;
  }

  private getInvestorROIBar(roi: number): string {
    const percentage = Math.min(Math.max(roi * 100, -100), 500); // Cap at 500% for display
    const barLength = Math.floor(Math.abs(percentage) / 20); // Each bar represents 20%
    const maxBars = 10;
    const bars = Math.min(barLength, maxBars);
    
    if (roi > 0) {
      return `${colors.green}${'█'.repeat(bars)}${'░'.repeat(maxBars - bars)}${colors.reset}`;
    } else {
      return `${colors.red}${'█'.repeat(bars)}${'░'.repeat(maxBars - bars)}${colors.reset}`;
    }
  }

  private getActivityLevel(rounds: number): string {
    if (rounds >= 20) return `${colors.red}🔥 VERY HIGH${colors.reset}`;
    if (rounds >= 10) return `${colors.yellow}⚡ HIGH${colors.reset}`;
    if (rounds >= 5) return `${colors.blue}📈 ACTIVE${colors.reset}`;
    if (rounds >= 2) return `${colors.dim}📊 MODERATE${colors.reset}`;
    return `${colors.dim}📉 LOW${colors.reset}`;
  }

  private generateInvestorInsights(data: any[], topPerformers: any[], activeInvestors: any[], strugglingInvestors: any[]): string[] {
    const insights: string[] = [];
    const totalInvestors = data.length;
    const avgROI = data.reduce((sum, inv) => sum + (inv.ROI_AVERAGE || 0), 0) / totalInvestors;
    
    // Market sentiment insight
    if (avgROI > 0.1) {
      insights.push(`🟢 ${colors.green}Bullish institutional sentiment${colors.reset} - Average ROI of ${(avgROI * 100).toFixed(1)}% indicates strong market confidence`);
    } else if (avgROI > -0.1) {
      insights.push(`🟡 ${colors.yellow}Neutral institutional sentiment${colors.reset} - Mixed performance with ${(avgROI * 100).toFixed(1)}% average ROI`);
    } else {
      insights.push(`🔴 ${colors.red}Bearish institutional sentiment${colors.reset} - Average losses of ${(Math.abs(avgROI) * 100).toFixed(1)}% suggest market caution`);
    }
    
    // Activity insight
    const highActivityCount = activeInvestors.length;
    if (highActivityCount > totalInvestors * 0.3) {
      insights.push(`⚡ ${colors.blue}High market activity${colors.reset} - ${highActivityCount} investors with 5+ rounds indicate strong institutional engagement`);
    } else if (highActivityCount > totalInvestors * 0.1) {
      insights.push(`📊 ${colors.yellow}Moderate market activity${colors.reset} - ${highActivityCount} active investors showing selective engagement`);
    } else {
      insights.push(`📉 ${colors.dim}Low market activity${colors.reset} - Only ${highActivityCount} highly active investors suggest cautious approach`);
    }
    
    // Performance distribution insight
    const profitableRatio = topPerformers.length / totalInvestors;
    if (profitableRatio > 0.4) {
      insights.push(`🏆 ${colors.green}Strong institutional performance${colors.reset} - ${(profitableRatio * 100).toFixed(1)}% of investors are profitable`);
    } else if (profitableRatio > 0.2) {
      insights.push(`⚖️ ${colors.yellow}Mixed institutional results${colors.reset} - ${(profitableRatio * 100).toFixed(1)}% profitable vs ${((strugglingInvestors.length / totalInvestors) * 100).toFixed(1)}% struggling`);
    } else {
      insights.push(`⚠️ ${colors.red}Challenging market conditions${colors.reset} - Only ${(profitableRatio * 100).toFixed(1)}% of investors showing profits`);
    }
    
    // Top performer insight
    if (topPerformers.length > 0) {
      const bestROI = topPerformers[0].ROI_AVERAGE * 100;
      const bestInvestor = topPerformers[0].INVESTOR_NAME;
      insights.push(`🥇 ${colors.green}Top performer: ${bestInvestor}${colors.reset} with ${bestROI.toFixed(1)}% ROI leading institutional returns`);
    }
    
    // Risk insight
    const highRiskCount = strugglingInvestors.length;
    if (highRiskCount > totalInvestors * 0.3) {
      insights.push(`⚠️ ${colors.red}High market risk${colors.reset} - ${highRiskCount} investors with significant losses (>80%) indicate volatile conditions`);
    }
    
    return insights;
  }

  private categorizeInvestorPerformance(data: any[]): Record<string, number> {
    const ranges = {
      'Exceptional (>100%)': 0,
      'Strong (50-100%)': 0,
      'Profitable (0-50%)': 0,
      'Break-even (-10-0%)': 0,
      'Moderate Loss (-50--10%)': 0,
      'Heavy Loss (<-50%)': 0
    };
    
    data.forEach(investor => {
      const roi = investor.ROI_AVERAGE || 0;
      const roiPercent = roi * 100;
      
      if (roiPercent > 100) ranges['Exceptional (>100%)']++;
      else if (roiPercent > 50) ranges['Strong (50-100%)']++;
      else if (roiPercent > 0) ranges['Profitable (0-50%)']++;
      else if (roiPercent > -10) ranges['Break-even (-10-0%)']++;
      else if (roiPercent > -50) ranges['Moderate Loss (-50--10%)']++;
      else ranges['Heavy Loss (<-50%)']++;
    });
    
    return ranges;
  }

  private getPerformanceBar(count: number, total: number): string {
    const percentage = count / total;
    const barLength = Math.floor(percentage * 20); // 20 character bar
    const filledBars = '█'.repeat(barLength);
    const emptyBars = '░'.repeat(20 - barLength);
    
    if (percentage > 0.3) return `${colors.green}${filledBars}${emptyBars}${colors.reset}`;
    if (percentage > 0.15) return `${colors.yellow}${filledBars}${emptyBars}${colors.reset}`;
    return `${colors.red}${filledBars}${emptyBars}${colors.reset}`;
  }

  private async getResistanceSupport(prompt: string): Promise<void> {
    try {
      // Extract token IDs from the user's prompt
      const tokenIds = await this.extractTokensFromPrompt(prompt);
      const primaryTokenId = tokenIds[0]; // Use the first detected token for resistance/support analysis
      
      console.log(`${colors.dim}  🎯 Getting resistance/support levels for token ID: ${primaryTokenId}${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getResistanceSupport.executable(
          { token_id: primaryTokenId, limit: "50", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the resistance/support data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatResistanceSupportResponse(responseData.data);
            } else {
              this.formatResponse("No resistance/support data available for this token.", 'data');
            }
          } else {
            this.formatResponse("Resistance/support analysis completed successfully. Check the detailed data above for historical levels and trading insights.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Resistance/support analysis completed successfully. Check the detailed data above for historical levels and trading insights.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Resistance/support analysis failed: ${error}`, 'error');
    }
  }

  private formatResistanceSupportResponse(data: any[]): void {
    if (!data || data.length === 0) return;
    
    const analysis = data[0];
    const tokenName = analysis.TOKEN_NAME || 'Unknown';
    const tokenSymbol = analysis.TOKEN_SYMBOL || 'N/A';
    const date = new Date(analysis.DATE).toLocaleDateString();
    const levels = analysis.HISTORICAL_RESISTANCE_SUPPORT_LEVELS || [];
    
    console.log(`${colors.cyan}📊 Technical Analysis [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log('═'.repeat(80));
    console.log(`🎯 ${tokenName} (${tokenSymbol}) - Resistance & Support Levels`);
    console.log(`📅 Analysis Date: ${date}`);
    console.log(`📈 Total Historical Levels: ${levels.length}`);
    console.log();
    
    if (levels.length === 0) {
      console.log(`${colors.yellow}⚠️  No historical resistance/support levels found${colors.reset}`);
      return;
    }
    
    // Sort levels by date (most recent first) and price
    const sortedLevels = levels
      .map((level: any) => ({
        ...level,
        dateObj: new Date(level.date),
        year: new Date(level.date).getFullYear()
      }))
      .sort((a: any, b: any) => b.dateObj.getTime() - a.dateObj.getTime());
    
    // Group levels by time periods
    const currentYear = new Date().getFullYear();
    const recentLevels = sortedLevels.filter((level: any) => level.year >= currentYear - 1);
    const historicalLevels = sortedLevels.filter((level: any) => level.year < currentYear - 1);
    
    // Get key levels (highest and lowest)
    const allLevels = sortedLevels.map((level: any) => level.level).sort((a: number, b: number) => b - a);
    const highestLevel = allLevels[0];
    const lowestLevel = allLevels[allLevels.length - 1];
    const medianLevel = allLevels[Math.floor(allLevels.length / 2)];
    
    // Show key levels summary
    console.log(`${colors.green}🔑 KEY LEVELS SUMMARY${colors.reset}`);
    console.log('─'.repeat(50));
    console.log(`🔴 All-Time High: ${colors.red}$${this.formatPrice(highestLevel)}${colors.reset}`);
    console.log(`🟢 All-Time Low:  ${colors.green}$${this.formatPrice(lowestLevel)}${colors.reset}`);
    console.log(`🟡 Median Level:  ${colors.yellow}$${this.formatPrice(medianLevel)}${colors.reset}`);
    console.log(`📊 Price Range:   ${this.formatPrice(((highestLevel - lowestLevel) / lowestLevel * 100).toFixed(2))}% spread`);
    console.log();
    
    // Show recent levels (last 2 years)
    if (recentLevels.length > 0) {
      console.log(`${colors.blue}📅 RECENT LEVELS (${currentYear - 1}-${currentYear})${colors.reset}`);
      console.log('─'.repeat(50));
      
      const recentToShow = recentLevels.slice(0, 10); // Show top 10 recent levels
      recentToShow.forEach((level: any, index: number) => {
        const price = this.formatPrice(level.level);
        const date = level.dateObj.toLocaleDateString();
        const levelType = this.getLevelType(level.level, highestLevel, lowestLevel, medianLevel);
        const indicator = this.getLevelIndicator(level.level, highestLevel, lowestLevel, medianLevel);
        
        console.log(`${indicator} $${price.padStart(12)} │ ${date} ${levelType}`);
      });
      
      if (recentLevels.length > 10) {
        console.log(`${colors.dim}   ... and ${recentLevels.length - 10} more recent levels${colors.reset}`);
      }
      console.log();
    }
    
    // Show historical significant levels
    if (historicalLevels.length > 0) {
      console.log(`${colors.magenta}📜 HISTORICAL SIGNIFICANT LEVELS${colors.reset}`);
      console.log('─'.repeat(50));
      
      // Get the most significant historical levels (extreme highs and lows)
      const significantLevels = historicalLevels
        .filter((level: any) => 
          level.level >= highestLevel * 0.8 || // Top 20% levels
          level.level <= lowestLevel * 1.2    // Bottom 20% levels
        )
        .slice(0, 8); // Show top 8 significant levels
      
      significantLevels.forEach((level: any) => {
        const price = this.formatPrice(level.level);
        const date = level.dateObj.toLocaleDateString();
        const levelType = this.getLevelType(level.level, highestLevel, lowestLevel, medianLevel);
        const indicator = this.getLevelIndicator(level.level, highestLevel, lowestLevel, medianLevel);
        
        console.log(`${indicator} $${price.padStart(12)} │ ${date} ${levelType}`);
      });
      
      console.log();
    }
    
    // Trading insights
    console.log(`${colors.cyan}💡 TRADING INSIGHTS${colors.reset}`);
    console.log('─'.repeat(50));
    
    const insights = this.generateResistanceSupportInsights(sortedLevels, highestLevel, lowestLevel, medianLevel);
    insights.forEach(insight => console.log(`   ${insight}`));
    
    console.log();
    console.log('═'.repeat(80));
    console.log(`🎯 ${colors.bright}Key Support/Resistance Zones:${colors.reset}`);
    
    // Calculate key zones
    const zones = this.calculateKeyZones(allLevels);
    zones.forEach((zone, index) => {
      const strength = this.getZoneStrength(zone.count);
      console.log(`   ${strength} $${this.formatPrice(zone.min)} - $${this.formatPrice(zone.max)} (${zone.count} touches)`);
    });
    
    console.log('─'.repeat(80));
    console.log(`📈 Analysis powered by TokenMetrics technical analysis models`);
    console.log();
  }

  private getLevelType(level: number, highest: number, lowest: number, median: number): string {
    if (level >= highest * 0.95) return `${colors.red}🔴 MAJOR RESISTANCE${colors.reset}`;
    if (level <= lowest * 1.05) return `${colors.green}🟢 MAJOR SUPPORT${colors.reset}`;
    if (level >= median * 1.1) return `${colors.yellow}🟡 Resistance${colors.reset}`;
    if (level <= median * 0.9) return `${colors.blue}🔵 Support${colors.reset}`;
    return `${colors.dim}⚪ Neutral${colors.reset}`;
  }

  private getLevelIndicator(level: number, highest: number, lowest: number, median: number): string {
    if (level >= highest * 0.95) return '🔴';
    if (level <= lowest * 1.05) return '🟢';
    if (level >= median * 1.1) return '🟡';
    if (level <= median * 0.9) return '🔵';
    return '⚪';
  }

  private generateResistanceSupportInsights(levels: any[], highest: number, lowest: number, median: number): string[] {
    const insights: string[] = [];
    const currentYear = new Date().getFullYear();
    
    // Recent activity analysis
    const recentLevels = levels.filter((level: any) => level.year >= currentYear - 1);
    if (recentLevels.length > 0) {
      const recentHigh = Math.max(...recentLevels.map((l: any) => l.level));
      const recentLow = Math.min(...recentLevels.map((l: any) => l.level));
      
      if (recentHigh >= highest * 0.9) {
        insights.push(`🚀 Recent price action near all-time highs - strong bullish momentum`);
      }
      
      if (recentLow <= lowest * 1.1) {
        insights.push(`📉 Recent price tested major support levels - watch for bounce or breakdown`);
      }
    }
    
    // Level density analysis
    const priceRanges = this.analyzePriceDensity(levels.map((l: any) => l.level));
    if (priceRanges.highDensityZone) {
      insights.push(`🎯 High activity zone around $${this.formatPrice(priceRanges.highDensityZone)} - key level to watch`);
    }
    
    // Historical pattern analysis
    const oldestLevel = levels[levels.length - 1];
    const newestLevel = levels[0];
    if (oldestLevel && newestLevel) {
      const yearSpan = newestLevel.year - oldestLevel.year;
      if (yearSpan >= 5) {
        insights.push(`📊 ${yearSpan}-year price history shows ${levels.length} significant levels`);
      }
    }
    
    // Volatility insights
    const priceSpread = ((highest - lowest) / lowest * 100);
    if (priceSpread > 1000) {
      insights.push(`⚡ Extremely volatile asset with ${priceSpread.toFixed(0)}% historical range`);
    } else if (priceSpread > 500) {
      insights.push(`📈 High volatility asset with ${priceSpread.toFixed(0)}% historical range`);
    }
    
    if (insights.length === 0) {
      insights.push(`📊 Multiple support and resistance levels identified across different timeframes`);
    }
    
    return insights;
  }

  private analyzePriceDensity(levels: number[]): { highDensityZone?: number } {
    // Group levels into price ranges and find the most dense area
    const sortedLevels = levels.sort((a, b) => a - b);
    const ranges: { [key: string]: number[] } = {};
    
    // Create 10% price ranges
    const min = sortedLevels[0];
    const max = sortedLevels[sortedLevels.length - 1];
    const rangeSize = (max - min) / 10;
    
    sortedLevels.forEach(level => {
      const rangeIndex = Math.floor((level - min) / rangeSize);
      const rangeKey = `range_${rangeIndex}`;
      if (!ranges[rangeKey]) ranges[rangeKey] = [];
      ranges[rangeKey].push(level);
    });
    
    // Find the range with most levels
    let maxCount = 0;
    let highDensityZone: number | undefined;
    
    Object.values(ranges).forEach(rangeLevels => {
      if (rangeLevels.length > maxCount) {
        maxCount = rangeLevels.length;
        highDensityZone = rangeLevels.reduce((sum, level) => sum + level, 0) / rangeLevels.length;
      }
    });
    
    return { highDensityZone };
  }

  private calculateKeyZones(levels: number[]): Array<{ min: number; max: number; count: number }> {
    const sortedLevels = levels.sort((a, b) => a - b);
    const zones: Array<{ min: number; max: number; count: number }> = [];
    
    // Group levels within 5% of each other
    let currentZone: number[] = [];
    
    for (let i = 0; i < sortedLevels.length; i++) {
      const level = sortedLevels[i];
      
      if (currentZone.length === 0) {
        currentZone.push(level);
      } else {
        const zoneAvg = currentZone.reduce((sum, l) => sum + l, 0) / currentZone.length;
        if (Math.abs(level - zoneAvg) / zoneAvg <= 0.05) { // Within 5%
          currentZone.push(level);
        } else {
          // Finish current zone and start new one
          if (currentZone.length >= 2) { // Only zones with multiple touches
            zones.push({
              min: Math.min(...currentZone),
              max: Math.max(...currentZone),
              count: currentZone.length
            });
          }
          currentZone = [level];
        }
      }
    }
    
    // Add the last zone
    if (currentZone.length >= 2) {
      zones.push({
        min: Math.min(...currentZone),
        max: Math.max(...currentZone),
        count: currentZone.length
      });
    }
    
    // Sort by count (most touches first) and return top 5
    return zones.sort((a, b) => b.count - a.count).slice(0, 5);
  }

  private getZoneStrength(count: number): string {
    if (count >= 5) return `${colors.red}🔥 VERY STRONG${colors.reset}`;
    if (count >= 3) return `${colors.yellow}💪 STRONG${colors.reset}`;
    return `${colors.blue}📊 MODERATE${colors.reset}`;
  }

  private async getMarketOverview(): Promise<void> {
    try {
      console.log(`${colors.yellow}🔍 Getting comprehensive market overview...${colors.reset}`);
      
      // Calculate date range (30 days ago to today)
      const endDate = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD format
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
      
      // Get multiple data points for a comprehensive overview with rate limiting
      const marketMetrics = await this.retryWithBackoff(async () => {
        return await this.plugin.getMarketMetrics.executable(
          { 
            startDate: startDate,
            endDate: endDate,
            limit: "3", 
            page: "1" 
          },
          (msg: string) => console.log(`${colors.dim}  📊 Market: ${msg}${colors.reset}`)
        );
      });
      
      await this.rateLimitDelay(); // Add delay between requests
      
      const topTokens = await this.retryWithBackoff(async () => {
        return await this.plugin.getTopMarketCapTokens.executable(
          { top_k: "10", page: "1" },
          (msg: string) => console.log(`${colors.dim}  🏆 Top Tokens: ${msg}${colors.reset}`)
        );
      });
      
      await this.rateLimitDelay(); // Add delay between requests
      
      const sentiments = await this.retryWithBackoff(async () => {
        return await this.plugin.getSentiments.executable(
          { limit: "3", page: "1" },
          (msg: string) => console.log(`${colors.dim}  😊 Sentiment: ${msg}${colors.reset}`)
        );
      });
      
      this.formatResponse("Comprehensive market overview retrieved successfully! This includes:\n• Market metrics and bullish/bearish indicators\n• Top 10 cryptocurrencies by market cap\n• Latest sentiment analysis from social media and news\n\nCheck the detailed data above for complete analysis.", 'data');
      
    } catch (error) {
      this.formatResponse(`Market overview failed: ${error}`, 'error');
    }
  }

  private showHelp(): void {
    console.log(`${colors.cyan}${colors.bright}📚 Available Commands${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(50)}${colors.reset}`);
    console.log(`${colors.bright}🔍 Data & Analysis:${colors.reset}`);
    console.log(`  • ${colors.green}sentiment${colors.reset} - Get market sentiment analysis`);
    console.log(`  • ${colors.green}trader grades${colors.reset} - View trader performance grades`);
    console.log(`  • ${colors.green}investor grades${colors.reset} - View investor performance grades`);
    console.log(`  • ${colors.green}market metrics [token]${colors.reset} - Get comprehensive market data`);
    console.log(`  • ${colors.green}quantmetrics [token]${colors.reset} - Get quantitative analysis metrics`);
    console.log(`  • ${colors.green}hourly [token]${colors.reset} - Get hourly OHLCV data`);
    console.log(`  • ${colors.green}daily [token]${colors.reset} - Get daily OHLCV data`);
    console.log(`  • ${colors.green}ai reports [token]${colors.reset} - Get AI-generated analysis reports`);
    console.log(`  • ${colors.green}crypto investors${colors.reset} - View top crypto investors`);
    console.log(`  • ${colors.green}resistance support [token]${colors.reset} - Get support/resistance levels`);
    console.log(`  • ${colors.green}price [token]${colors.reset} - Get current token prices`);
    console.log(`  • ${colors.green}trading signals${colors.reset} - Get AI trading signals`);
    console.log(`  • ${colors.green}hourly trading signals${colors.reset} - Get hourly AI trading signals`);
    console.log(`  • ${colors.green}scenario analysis [token]${colors.reset} - Get scenario-based analysis`);
    console.log(`  • ${colors.green}correlation [token]${colors.reset} - Get correlation analysis`);
    
    console.log(`\n${colors.bright}📊 Market Overview:${colors.reset}`);
    console.log(`  • ${colors.green}market overview${colors.reset} - Get comprehensive market overview`);
    console.log(`  • ${colors.green}top tokens${colors.reset} - View top market cap tokens`);
    console.log(`  • ${colors.green}tokens${colors.reset} - List available tokens`);
    
    console.log(`\n${colors.bright}🛠️ Utilities:${colors.reset}`);
    console.log(`  • ${colors.green}help${colors.reset} - Show this help menu`);
    console.log(`  • ${colors.green}test${colors.reset} - Test token detection logic (debug)`);
    console.log(`  • ${colors.green}quit${colors.reset} - Exit the application`);
    
    console.log(`\n${colors.dim}💡 You can also ask natural language questions like:${colors.reset}`);
    console.log(`${colors.dim}   "What's the price of Bitcoin?", "Analyze Ethereum sentiment", etc.${colors.reset}`);
    console.log();
  }

  public async start(): Promise<void> {
    this.formatHeader();
    let isActive = true;
    
    const askQuestion = () => {
      // Check if the interface is still active
      if (!isActive) {
        return;
      }
      
      // Wrap the question in a try-catch to handle readline errors gracefully
      try {
        this.rl.question(`${colors.cyan}${colors.bright}💬 Your prompt: ${colors.reset}`, async (input) => {
          const trimmedInput = input.trim();
          
          if (!trimmedInput) {
            askQuestion();
            return;
          }
          
          const lowerInput = trimmedInput.toLowerCase();
          
          if (lowerInput === 'quit' || lowerInput === 'exit') {
            console.log(`${colors.green}${colors.bright}👋 Thanks for using Token Metrics AI Chat! Happy trading! 🚀${colors.reset}`);
            isActive = false;
            this.rl.close();
            return;
          }
          
          if (lowerInput === 'help') {
            this.showHelp();
            askQuestion();
            return;
          }
          
          if (lowerInput === 'test') {
            await this.testTokenDetection();
            askQuestion();
            return;
          }
          
          if (lowerInput === 'clear') {
            this.formatHeader();
            askQuestion();
            return;
          }
          
          console.log();
          try {
            await this.analyzePrompt(trimmedInput);
          } catch (error) {
            console.log(`${colors.red}❌ Error processing request: ${error}${colors.reset}`);
          }
          
          // Only ask next question if interface is still active
          if (isActive) {
            askQuestion();
          }
        });
      } catch (error: any) {
        // Silently handle readline errors to prevent the ERR_USE_AFTER_CLOSE error
        if (error?.code === 'ERR_USE_AFTER_CLOSE') {
          // Interface was closed, don't continue
          return;
        }
        // For other errors, log them but don't crash
        console.log(`${colors.red}❌ Interface error: ${error?.message || error}${colors.reset}`);
      }
    };

    // Add error handlers for the readline interface
    this.rl.on('error', (error: any) => {
      // Silently handle readline errors to prevent crashes
      if (error?.code !== 'ERR_USE_AFTER_CLOSE') {
        console.log(`${colors.red}❌ Readline error: ${error?.message || error}${colors.reset}`);
      }
    });

    this.rl.on('close', () => {
      isActive = false;
    });

    askQuestion();
  }

  private formatLargeNumber(num: any): string {
    const number = parseFloat(num);
    if (isNaN(number)) return num.toString();
    
    if (number >= 1e12) {
      return (number / 1e12).toFixed(2) + 'T';
    } else if (number >= 1e9) {
      return (number / 1e9).toFixed(2) + 'B';
    } else if (number >= 1e6) {
      return (number / 1e6).toFixed(2) + 'M';
    } else if (number >= 1e3) {
      return (number / 1e3).toFixed(2) + 'K';
    } else {
      return number.toFixed(2);
    }
  }

  private async getTopMarketCapTokens(): Promise<void> {
    try {
      console.log(`${colors.yellow}🔍 Getting top market cap tokens with price data...${colors.reset}`);
      
      // Step 1: Get the list of top market cap tokens (this gives us token names and IDs)
      const topTokensResult = await this.retryWithBackoff(async () => {
        return await this.plugin.getTopMarketCapTokens.executable(
          { top_k: "20", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 Getting token list: ${msg}${colors.reset}`)
        );
      });
      
      if (topTokensResult.status !== 'done') {
        this.formatResponse(topTokensResult.feedback, 'error');
        return;
      }
      
      // Parse the top tokens response
      let topTokens: any[] = [];
      try {
        const responseMatch = topTokensResult.feedback.match(/Response: ({.*})/);
        if (responseMatch) {
          const responseData = JSON.parse(responseMatch[1]);
          if (responseData.success && responseData.data && responseData.data.length > 0) {
            topTokens = responseData.data;
          }
        }
      } catch (parseError) {
        console.log(`${colors.dim}  ⚠️  Could not parse token list response${colors.reset}`);
      }
      
      if (topTokens.length === 0) {
        this.formatResponse("No top market cap tokens found.", 'error');
        return;
      }
      
      // Step 2: Get price data for the top tokens
      // Extract token IDs from the top tokens list
      const tokenIds = topTokens.slice(0, 15).map(token => token.TOKEN_ID).filter(id => id).join(',');
      
      if (!tokenIds) {
        // If no token IDs found, show basic info without prices
        this.formatTopMarketCapResponseBasic(topTokens);
        return;
      }
      
      console.log(`${colors.dim}  🔍 Fetching price data for ${tokenIds.split(',').length} tokens...${colors.reset}`);
      
      // Add delay between requests for rate limiting
      await this.rateLimitDelay();
      
      // Get price data for these tokens
      const priceResult = await this.retryWithBackoff(async () => {
        return await this.plugin.getPriceData.executable(
          { token_id: tokenIds },
          (msg: string) => console.log(`${colors.dim}  📝 Getting prices: ${msg}${colors.reset}`)
        );
      });
      
      let priceData: any[] = [];
      if (priceResult.status === 'done') {
        try {
          const priceResponseMatch = priceResult.feedback.match(/Response: ({.*})/);
          if (priceResponseMatch) {
            const priceResponseData = JSON.parse(priceResponseMatch[1]);
            if (priceResponseData.success && priceResponseData.data) {
              priceData = priceResponseData.data;
            }
          }
        } catch (parseError) {
          console.log(`${colors.dim}  ⚠️  Could not parse price data response${colors.reset}`);
        }
      }
      
      // Step 3: Combine the data and format the response
      this.formatTopMarketCapResponseWithPrices(topTokens, priceData);
      
    } catch (error) {
      this.formatResponse(`Failed to get top market cap tokens: ${error}`, 'error');
    }
  }

  private formatTopMarketCapResponseBasic(tokens: any[]): void {
    console.log(`${colors.cyan}${colors.bright}🏆 TOP CRYPTOCURRENCIES BY MARKET CAP [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}📊 Current Market Leaders (Token Names & IDs)${colors.reset}\n`);
    
    tokens.slice(0, 15).forEach((token, index) => {
      const rank = index + 1;
        const name = token.TOKEN_NAME || 'Unknown';
        const symbol = token.TOKEN_SYMBOL || 'N/A';
      const tokenId = token.TOKEN_ID || 'N/A';
      
      // Rank emoji
      let rankEmoji = '🔸';
      if (rank <= 3) rankEmoji = '🥇';
      else if (rank <= 10) rankEmoji = '🥈';
      else if (rank <= 20) rankEmoji = '🥉';
      
      console.log(`${colors.bright}${rankEmoji} #${rank} ${name} (${symbol})${colors.reset}`);
      console.log(`   🆔 Token ID: ${colors.yellow}${tokenId}${colors.reset}`);
      console.log(`   ℹ️  Price data temporarily unavailable`);
      console.log();
    });
    
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}💡 Showing top ${Math.min(15, tokens.length)} cryptocurrencies by market cap${colors.reset}`);
    console.log(`${colors.dim}⚠️  Price data could not be retrieved at this time${colors.reset}`);
      console.log();
    }
    
  private formatTopMarketCapResponseWithPrices(tokens: any[], priceData: any[]): void {
    console.log(`${colors.cyan}${colors.bright}🏆 TOP CRYPTOCURRENCIES BY MARKET CAP [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}📊 Current Market Leaders with Live Prices${colors.reset}\n`);
    
    // Create a map of token ID to price data for quick lookup
    const priceMap = new Map();
    priceData.forEach(price => {
      const tokenId = price.TOKEN_ID || price.token_id;
      if (tokenId) {
        priceMap.set(tokenId.toString(), price);
      }
    });
    
    tokens.slice(0, 15).forEach((token, index) => {
      const rank = index + 1;
      const name = token.TOKEN_NAME || 'Unknown';
      const symbol = token.TOKEN_SYMBOL || 'N/A';
      const tokenId = token.TOKEN_ID;
      
      // Get price data for this token
      const priceInfo = priceMap.get(tokenId?.toString());
      
      let price = 0;
      let change24h = 0;
      let volume24h = 0;
      let marketCap = 0;
      
      if (priceInfo) {
        price = priceInfo.CURRENT_PRICE || priceInfo.PRICE || priceInfo.price || 0;
        change24h = priceInfo.PERCENT_CHANGE_24H || priceInfo.percent_change_24h || 0;
        volume24h = priceInfo.VOLUME_24H || priceInfo.volume_24h || 0;
        marketCap = priceInfo.MARKET_CAP || priceInfo.market_cap || 0;
      }
      
      // Format values
      const formattedPrice = this.formatPrice(price);
      const formattedMarketCap = this.formatLargeNumber(marketCap);
      const formattedVolume = this.formatLargeNumber(volume24h);
      
      // Color coding for price change
      const changeColor = change24h >= 0 ? colors.green : colors.red;
      const changeEmoji = change24h >= 0 ? '📈' : '📉';
      const changeSign = change24h >= 0 ? '+' : '';
      
      // Rank emoji
      let rankEmoji = '🔸';
      if (rank <= 3) rankEmoji = '🥇';
      else if (rank <= 10) rankEmoji = '🥈';
      else if (rank <= 20) rankEmoji = '🥉';
      
      console.log(`${colors.bright}${rankEmoji} #${rank} ${name} (${symbol})${colors.reset}`);
      
      if (priceInfo) {
        console.log(`   💰 Price: ${colors.bright}$${formattedPrice}${colors.reset}`);
        if (marketCap > 0) {
          console.log(`   📊 Market Cap: ${colors.cyan}$${formattedMarketCap}${colors.reset}`);
        }
        console.log(`   ${changeEmoji} 24h Change: ${changeColor}${changeSign}${change24h.toFixed(2)}%${colors.reset}`);
        if (volume24h > 0) {
          console.log(`   📈 24h Volume: ${colors.dim}$${formattedVolume}${colors.reset}`);
        }
      } else {
        console.log(`   💰 Price: ${colors.dim}Data unavailable${colors.reset}`);
        console.log(`   🆔 Token ID: ${colors.yellow}${tokenId}${colors.reset}`);
      }
      console.log();
    });
    
    const tokensWithPrices = tokens.slice(0, 15).filter(token => priceMap.has(token.TOKEN_ID?.toString())).length;
    
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}💡 Showing top ${Math.min(15, tokens.length)} cryptocurrencies by market cap${colors.reset}`);
    console.log(`${colors.dim}📊 Price data available for ${tokensWithPrices}/${Math.min(15, tokens.length)} tokens${colors.reset}`);
    console.log(`${colors.dim}🔍 Market cap = Price × Circulating Supply${colors.reset}`);
    console.log();
  }

  private async getTokensList(): Promise<void> {
    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getTokens.executable(
          { limit: "50", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the response to extract token data
        const responseMatch = result.feedback.match(/Response: ({.*})/);
        if (responseMatch) {
          const responseData = JSON.parse(responseMatch[1]);
          if (responseData.success && responseData.data) {
            this.formatTokensResponse(responseData.data);
          } else {
            this.formatResponse("No token data found in response", 'error');
          }
        } else {
          this.formatResponse(result.feedback, 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Failed to get tokens list: ${error}`, 'error');
    }
  }

  private formatTokensResponse(tokens: any[]): void {
    console.log(`${colors.blue}${colors.bright}📋 SUPPORTED CRYPTOCURRENCIES WITH TOKEN_IDs${colors.reset}`);
    console.log(`${colors.dim}Total tokens found: ${tokens.length}${colors.reset}\n`);
    
    // Group tokens by category if available
    const categorized: { [key: string]: any[] } = {};
    
    tokens.forEach(token => {
      const category = token.CATEGORY || token.category || 'Other';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(token);
    });
    
    // Display tokens by category
    Object.keys(categorized).sort().forEach(category => {
      if (categorized[category].length > 0) {
        console.log(`${colors.cyan}${colors.bright}📂 ${category.toUpperCase()}${colors.reset}`);
        console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
        
        categorized[category].forEach((token, index) => {
          const tokenId = token.TOKEN_ID || token.token_id || 'N/A';
          const name = token.TOKEN_NAME || token.name || 'Unknown';
          const symbol = token.TOKEN_SYMBOL || token.symbol || 'N/A';
          const rank = token.RANK || token.rank || 'N/A';
          
          console.log(`${colors.bright}${index + 1}. ${name} (${symbol})${colors.reset}`);
          console.log(`   ${colors.yellow}TOKEN_ID:${colors.reset} ${tokenId}`);
          if (rank !== 'N/A') {
            console.log(`   ${colors.dim}Rank: #${rank}${colors.reset}`);
          }
          console.log();
        });
      }
    });
    
    console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}💡 Use these TOKEN_IDs for other API calls like price data, trading signals, etc.${colors.reset}`);
    console.log(`${colors.dim}🎯 Example: Use TOKEN_ID "1" for Bitcoin in other queries${colors.reset}`);
    console.log();
  }

  /**
   * Dynamically fetch and cache token mappings from the API
   */
  private async fetchTokenMappings(): Promise<{ [key: string]: string }> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (Object.keys(this.tokenCache).length > 0 && now < this.tokenCacheExpiry) {
      return this.tokenCache;
    }
    
    try {
      console.log(`${colors.dim}  🔄 Fetching token mappings from TokenMetrics API...${colors.reset}`);
      
      // Get a comprehensive list of tokens from the API
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getTokens.executable(
          { limit: "500", page: "1" }, // Get more tokens for better mapping
          (msg: string) => console.log(`${colors.dim}    📝 ${msg}${colors.reset}`)
        );
      });

      if (result.status === 'done') {
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              const mappings: { [key: string]: string } = {};
              
              for (const token of responseData.data) {
                const tokenId = token.TOKEN_ID || token.id;
                const tokenName = token.TOKEN_NAME || token.name;
                const tokenSymbol = token.TOKEN_SYMBOL || token.symbol;
                
                if (tokenId && tokenName) {
                  // Add name mapping
                  mappings[tokenName.toLowerCase()] = tokenId.toString();
                  
                  // Add symbol mapping if available
                  if (tokenSymbol) {
                    mappings[tokenSymbol.toLowerCase()] = tokenId.toString();
                  }
                }
              }
              
              this.tokenCache = mappings;
              this.tokenCacheExpiry = now + this.CACHE_DURATION;
              
              console.log(`${colors.green}  ✅ Loaded ${Object.keys(mappings).length} token mappings${colors.reset}`);
              return mappings;
            }
          }
        } catch (parseError) {
          console.log(`${colors.yellow}  ⚠️  Could not parse token mappings response${colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`${colors.yellow}  ⚠️  Failed to fetch token mappings: ${error}${colors.reset}`);
    }
    
    // Return empty object if failed
    return {};
  }

  private async extractTokensFromPrompt(prompt: string): Promise<string[]> {
    const lowerPrompt = prompt.toLowerCase();
    const detectedTokens: string[] = [];
    
    console.log(`${colors.dim}  🔍 Analyzing prompt for cryptocurrency mentions: "${prompt}"${colors.reset}`);
    
    // Common cryptocurrency names and symbols to search for
    const commonCryptos = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'binance coin', 'bnb', 'cardano', 'ada',
      'solana', 'sol', 'polkadot', 'dot', 'chainlink', 'link', 'litecoin', 'ltc',
      'bitcoin cash', 'bch', 'stellar', 'xlm', 'ripple', 'xrp', 'dogecoin', 'doge',
      'polygon', 'matic', 'avalanche', 'avax', 'uniswap', 'uni', 'tron', 'trx',
      'cosmos', 'atom', 'algorand', 'algo', 'vechain', 'vet', 'filecoin', 'fil'
    ];
    
    // Check if any common cryptocurrencies are mentioned in the prompt
    const mentionedCryptos = commonCryptos.filter(crypto => {
      const regex = new RegExp(`\\b${crypto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerPrompt);
    });
    
    if (mentionedCryptos.length > 0) {
      console.log(`${colors.dim}  🎯 Found cryptocurrency mentions: ${mentionedCryptos.join(', ')}${colors.reset}`);
      
      // Use the API's native search capability for each mentioned crypto
      for (const cryptoName of mentionedCryptos) {
        try {
          console.log(`${colors.dim}  🔍 Searching API for: ${cryptoName}${colors.reset}`);
          
          const result = await this.retryWithBackoff(async () => {
            return await this.plugin.getTokens.executable(
              { 
                limit: "5", 
                page: "1", 
                token_name: cryptoName // Use the API's native search
              },
              (msg: string) => console.log(`${colors.dim}    📝 ${msg}${colors.reset}`)
            );
          });

          if (result.status === 'done') {
            try {
              const responseMatch = result.feedback.match(/Response: ({.*})/);
              if (responseMatch) {
                const responseData = JSON.parse(responseMatch[1]);
                if (responseData.success && responseData.data && responseData.data.length > 0) {
                  for (const token of responseData.data) {
                    const tokenId = token.TOKEN_ID || token.id;
                    const tokenName = token.TOKEN_NAME || token.name;
                    const tokenSymbol = token.TOKEN_SYMBOL || token.symbol;
                    
                    if (tokenId) {
                      detectedTokens.push(tokenId.toString());
                      console.log(`${colors.green}    ✅ Found: ${tokenName} (${tokenSymbol}) - ID: ${tokenId}${colors.reset}`);
                    }
                  }
                }
              }
            } catch (parseError) {
              console.log(`${colors.yellow}    ⚠️  Could not parse response for ${cryptoName}${colors.reset}`);
            }
          }
          
          // Small delay between searches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.log(`${colors.yellow}    ⚠️  Error searching for ${cryptoName}: ${error}${colors.reset}`);
        }
      }
    }

    // If we found tokens through API search, return them
    if (detectedTokens.length > 0) {
      const uniqueTokens = [...new Set(detectedTokens)];
      console.log(`${colors.green}  ✅ Found ${uniqueTokens.length} token(s): ${uniqueTokens.join(', ')}${colors.reset}`);
      return uniqueTokens;
    }

    // Check if this is a generic request that doesn't contain specific token names
    const genericTerms = [
      'hourly', 'daily', 'price', 'data', 'ohlcv', 'open', 'high', 'low', 'close', 'volume',
      'trading', 'signals', 'analysis', 'market', 'overview', 'sentiment', 'grades',
      'metrics', 'quantmetrics', 'correlation', 'scenario', 'resistance', 'support',
      'investors', 'reports', 'top', 'list', 'show', 'get', 'fetch', 'current'
    ];
    
    const promptWords = lowerPrompt.split(/\s+/);
    const isGenericRequest = promptWords.every(word => 
      genericTerms.includes(word) || 
      word.length <= 2 || 
      /^[0-9]+$/.test(word) ||
      ['the', 'and', 'or', 'for', 'of', 'in', 'on', 'at', 'to', 'from', 'with', 'by'].includes(word)
    );

    if (isGenericRequest) {
      console.log(`${colors.dim}  💡 Generic request detected - no specific tokens mentioned.${colors.reset}`);
      return [];
    }

    // Fallback: try to search for any other potential token names in the prompt
    console.log(`${colors.dim}  🔍 Trying fallback search for other potential tokens...${colors.reset}`);
    
    // Extract potential token names (words that might be cryptocurrency names)
    const words = lowerPrompt.split(/\s+/).filter(word => 
      word.length > 2 && 
      !genericTerms.includes(word) &&
      !/^[0-9]+$/.test(word) &&
      !['the', 'and', 'or', 'for', 'of', 'in', 'on', 'at', 'to', 'from', 'with', 'by'].includes(word)
    );
    
    // Try searching for each potential token name
    for (const word of words.slice(0, 3)) { // Limit to first 3 words to avoid too many API calls
      try {
        const result = await this.retryWithBackoff(async () => {
          return await this.plugin.getTokens.executable(
            { 
              limit: "3", 
              page: "1", 
              token_name: word
            },
            () => {} // Silent for fallback search
          );
        });

        if (result.status === 'done') {
          try {
            const responseMatch = result.feedback.match(/Response: ({.*})/);
            if (responseMatch) {
              const responseData = JSON.parse(responseMatch[1]);
              if (responseData.success && responseData.data && responseData.data.length > 0) {
                for (const token of responseData.data) {
                  const tokenId = token.TOKEN_ID || token.id;
                  if (tokenId) {
                    detectedTokens.push(tokenId.toString());
                    console.log(`${colors.green}  ✅ Fallback found: ${token.TOKEN_NAME || token.name} - ID: ${tokenId}${colors.reset}`);
                  }
                }
              }
            }
          } catch (parseError) {
            // Silent fail for fallback search
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        // Silent fail for fallback search
      }
    }
    
    if (detectedTokens.length === 0) {
      console.log(`${colors.dim}  💡 No matching tokens found. Use 'tokens' command to see available cryptocurrencies.${colors.reset}`);
      return [];
    }
    
    // Remove duplicates and return
    const uniqueTokens = [...new Set(detectedTokens)];
    console.log(`${colors.green}  ✅ Final detected token IDs: ${uniqueTokens.join(', ')}${colors.reset}`);
    return uniqueTokens;
  }

  private async getPriceData(prompt: string): Promise<void> {
    try {
      // Extract token IDs from the user's prompt
      const tokenIds = await this.extractTokensFromPrompt(prompt);
      
      // Handle case when no tokens are available
      if (tokenIds.length === 0) {
        this.formatResponse("❌ Unable to process price data request.\n\n🔍 Possible reasons:\n• The requested cryptocurrency was not recognized in your query\n• Please be more specific with cryptocurrency names\n• Use exact names like 'Bitcoin', 'Ethereum', 'BTC', 'ETH', etc.\n\n💡 Solutions:\n• Try: 'Bitcoin price', 'Ethereum price', 'BTC price'\n• Use 'tokens' command to see all available cryptocurrencies\n• Be more specific with token names from the available list\n\n🎯 Supported major cryptocurrencies: Bitcoin, Ethereum, BNB, Cardano, Solana, Polkadot, Chainlink, Litecoin, and many more!", 'error');
        return;
      }
      
      const tokenIdString = tokenIds.join(',');
      
      console.log(`${colors.dim}  🎯 Detected tokens from prompt: ${tokenIds.length} token(s)${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getPriceData.executable(
          { token_id: tokenIdString },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the response to extract price data
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatPriceDataResponse(responseData.data);
            } else {
              this.formatResponse("No price data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("Current price data retrieved successfully! Check the detailed data above for real-time prices.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Current price data retrieved successfully! Check the detailed data above for real-time prices.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Failed to get price data: ${error}`, 'error');
    }
  }

  private formatPriceDataResponse(data: any[]): void {
    console.log(`${colors.blue}${colors.bright}📊 Current Price Data [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.dim}Total prices found: ${data.length}${colors.reset}\n`);
    
    data.forEach((item, index) => {
      const tokenName = item.TOKEN_NAME || item.name || 'Unknown';
      const tokenSymbol = item.TOKEN_SYMBOL || item.symbol || 'N/A';
      const price = item.CURRENT_PRICE || item.PRICE || item.price || 0;
      const formattedPrice = this.formatPrice(price);
      
      console.log(`${colors.bright}${index + 1}. ${tokenName} (${tokenSymbol})${colors.reset}`);
      console.log(`   💰 Price: ${colors.bright}$${formattedPrice}${colors.reset}`);
      console.log();
    });
    
    console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}💡 Use these prices for other API calls like trading signals, etc.${colors.reset}`);
    console.log(`${colors.dim}🎯 Example: Use price data for Bitcoin in other queries${colors.reset}`);
    console.log();
  }

  private async getTradingSignals(): Promise<void> {
    try {
      // Get current date and 30 days ago for date range
      const endDate = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD format
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getTradingSignals.executable(
          { 
            limit: "10", 
            page: "1",
            startDate: startDate,
            endDate: endDate
          },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the trading signals data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatTradingSignalsResponse(responseData.data);
            } else {
              this.formatResponse("No trading signals available for the specified date range. Try checking for a different time period.", 'data');
            }
          } else {
            this.formatResponse("Latest AI-generated trading signals retrieved successfully. Check the detailed data above for buy/sell recommendations with signal strength.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Latest AI-generated trading signals retrieved successfully. Check the detailed data above for buy/sell recommendations with signal strength.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Trading signals query failed: ${error}`, 'error');
    }
  }

  private formatTradingSignalsResponse(signals: any[]): void {
    console.log(`${colors.green}${colors.bright}📈 AI Trading Signals [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.green}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}🤖 AI-Generated Trading Signals & Analysis${colors.reset}\n`);
    
    signals.slice(0, 5).forEach((signal, index) => {
      const tokenName = signal.TOKEN_NAME || 'Unknown Token';
      const tokenSymbol = signal.TOKEN_SYMBOL || 'N/A';
      const tradingSignal = signal.TRADING_SIGNAL || 0;
      const tokenTrend = signal.TOKEN_TREND || 0;
      const traderGrade = signal.TM_TRADER_GRADE || 0;
      const investorGrade = signal.TM_INVESTOR_GRADE || 0;
      const tradingReturns = signal.TRADING_SIGNALS_RETURNS || 0;
      const holdingReturns = signal.HOLDING_RETURNS || 0;
      const timestamp = signal.DATE || new Date().toISOString();
      
      // Determine signal type based on TRADING_SIGNAL value
      let signalType = 'HOLD';
      let signalColor = colors.yellow;
      let signalEmoji = '🟡';
      
      if (tradingSignal === 1) {
        signalType = 'BUY';
        signalColor = colors.green;
        signalEmoji = '🟢';
      } else if (tradingSignal === -1) {
        signalType = 'SELL';
        signalColor = colors.red;
        signalEmoji = '🔴';
      }
      
      // Determine trend
      let trendEmoji = '➡️';
      let trendText = 'NEUTRAL';
      let trendColor = colors.yellow;
      
      if (tokenTrend === 1) {
        trendEmoji = '📈';
        trendText = 'BULLISH';
        trendColor = colors.green;
      } else if (tokenTrend === -1) {
        trendEmoji = '📉';
        trendText = 'BEARISH';
        trendColor = colors.red;
      }
      
      console.log(`${colors.bright}${index + 1}. ${tokenName} (${tokenSymbol})${colors.reset}`);
      console.log(`${signalColor}${signalEmoji} ${signalType} SIGNAL${colors.reset}`);
      console.log(`${trendColor}${trendEmoji} Trend: ${trendText}${colors.reset}`);
      console.log(`📊 Trader Grade: ${this.getGradeBar(traderGrade)} ${traderGrade.toFixed(1)}/100`);
      console.log(`💎 Investor Grade: ${this.getGradeBar(investorGrade)} ${investorGrade.toFixed(1)}/100`);
      
      // Show returns comparison
      const tradingReturnsPercent = (tradingReturns * 100).toFixed(2);
      const holdingReturnsPercent = (holdingReturns * 100).toFixed(2);
      const tradingColor = tradingReturns >= 0 ? colors.green : colors.red;
      const holdingColor = holdingReturns >= 0 ? colors.green : colors.red;
      
      console.log(`${tradingColor}📈 Trading Returns: ${tradingReturnsPercent}%${colors.reset}`);
      console.log(`${holdingColor}🏦 Holding Returns: ${holdingReturnsPercent}%${colors.reset}`);
      console.log(`⏰ ${new Date(timestamp).toLocaleDateString()}\n`);
    });
    
    console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}💡 Showing top ${Math.min(5, signals.length)} signals. Total available: ${signals.length}${colors.reset}`);
    console.log(`${colors.dim}🔍 Signal Values: 1=BUY, 0=HOLD, -1=SELL | Trend: 1=Bullish, 0=Neutral, -1=Bearish${colors.reset}`);
    console.log();
  }

  private async getScenarioAnalysis(prompt: string): Promise<void> {
    try {
      // Extract token IDs from the user's prompt
      const tokenIds = await this.extractTokensFromPrompt(prompt);
      const primaryTokenId = tokenIds[0]; // Use the first detected token for scenario analysis
      
      console.log(`${colors.dim}  🎯 Analyzing scenarios for token ID: ${primaryTokenId}${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getScenarioAnalysis.executable(
          { token_id: primaryTokenId, limit: "5", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the scenario analysis data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatScenarioAnalysisResponse(responseData.data);
            } else {
              this.formatResponse("No scenario analysis data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("Price scenario analysis retrieved successfully. Check the detailed data above for predictions under different market conditions (bullish, bearish, neutral).", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Price scenario analysis retrieved successfully. Check the detailed data above for predictions under different market conditions (bullish, bearish, neutral).", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Scenario analysis failed: ${error}`, 'error');
    }
  }

  private formatScenarioAnalysisResponse(scenarios: any[]): void {
    console.log(`${colors.cyan}${colors.bright}🔮 Price Scenario Analysis [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}📊 AI-Powered Price Predictions Under Different Market Conditions${colors.reset}\n`);
    
    scenarios.slice(0, 1).forEach((scenario) => {
      const tokenName = scenario.TOKEN_NAME || 'Bitcoin';
      const tokenSymbol = scenario.TOKEN_SYMBOL || 'BTC';
      const currentPrice = scenario.SCENARIO_PREDICTION?.current_price || 105534;
      const predictionDate = scenario.SCENARIO_PREDICTION?.predicted_date || '2027-06-03';
      const scenarioPredictions = scenario.SCENARIO_PREDICTION?.scenario_prediction || [];
      
      console.log(`${colors.bright}📈 ${tokenName} (${tokenSymbol}) Price Scenarios${colors.reset}`);
      console.log(`⏰ Prediction Target: ${new Date(predictionDate).toLocaleDateString()}`);
      console.log(`💰 Current Price: ${colors.bright}$${this.formatPrice(currentPrice)}${colors.reset}\n`);
      
      // Process different time scenarios (0.5, 2, 4, 6, 8 years)
      scenarioPredictions.forEach((pred: any, index: number) => {
        const timeframe = pred.scenario;
        const basePrice = pred.predicted_price_base;
        const bearPrice = pred.predicted_price_bear;
        const moonPrice = pred.predicted_price_moon;
        const baseROI = pred.predicted_roi_base * 100;
        const bearROI = pred.predicted_roi_bear * 100;
        const moonROI = pred.predicted_roi_moon * 100;
        
        let timeLabel = '';
        if (timeframe === 0.5) timeLabel = '6 Months';
        else if (timeframe === 2) timeLabel = '2 Years';
        else if (timeframe === 4) timeLabel = '4 Years';
        else if (timeframe === 6) timeLabel = '6 Years';
        else if (timeframe === 8) timeLabel = '8 Years';
        else timeLabel = `${timeframe} Years`;
        
        console.log(`${colors.bright}⏳ ${timeLabel} Predictions:${colors.reset}`);
        console.log(`${'─'.repeat(60)}`);
        
        // Bearish Scenario
        console.log(`${colors.red}📉 BEARISH SCENARIO${colors.reset}`);
        console.log(`   Price: ${colors.red}$${this.formatPrice(bearPrice)}${colors.reset}`);
        console.log(`   ROI: ${colors.red}${bearROI > 0 ? '+' : ''}${bearROI.toFixed(1)}%${colors.reset}`);
        console.log(`   ${this.getROIBar(bearROI, 'bearish')}\n`);
        
        // Base/Neutral Scenario
        console.log(`${colors.yellow}😐 BASE SCENARIO${colors.reset}`);
        console.log(`   Price: ${colors.yellow}$${this.formatPrice(basePrice)}${colors.reset}`);
        console.log(`   ROI: ${colors.yellow}${baseROI > 0 ? '+' : ''}${baseROI.toFixed(1)}%${colors.reset}`);
        console.log(`   ${this.getROIBar(baseROI, 'neutral')}\n`);
        
        // Bullish/Moon Scenario
        console.log(`${colors.green}🚀 BULLISH SCENARIO${colors.reset}`);
        console.log(`   Price: ${colors.green}$${this.formatPrice(moonPrice)}${colors.reset}`);
        console.log(`   ROI: ${colors.green}${moonROI > 0 ? '+' : ''}${moonROI.toFixed(1)}%${colors.reset}`);
        console.log(`   ${this.getROIBar(moonROI, 'bullish')}\n`);
        
        // Summary for this timeframe
        const avgROI = (bearROI + baseROI + moonROI) / 3;
        const riskRange = moonROI - bearROI;
        console.log(`${colors.dim}📊 Summary: Avg ROI ${avgROI.toFixed(1)}% | Risk Range ${riskRange.toFixed(1)}%${colors.reset}`);
        
        if (index < scenarioPredictions.length - 1) {
          console.log(`\n${colors.dim}${'═'.repeat(60)}${colors.reset}\n`);
        }
      });
      
      // Overall insights
      console.log(`\n${colors.bright}💡 Key Insights:${colors.reset}`);
      const bestTimeframe = scenarioPredictions.reduce((best: any, current: any) => 
        (current.predicted_roi_base > best.predicted_roi_base) ? current : best
      );
      const worstTimeframe = scenarioPredictions.reduce((worst: any, current: any) => 
        (current.predicted_roi_bear < worst.predicted_roi_bear) ? current : worst
      );
      
      console.log(`${colors.green}🎯 Best Base Case: ${bestTimeframe.scenario} years with ${(bestTimeframe.predicted_roi_base * 100).toFixed(1)}% ROI${colors.reset}`);
      console.log(`${colors.red}⚠️  Highest Risk: ${worstTimeframe.scenario} years with ${(worstTimeframe.predicted_roi_bear * 100).toFixed(1)}% potential loss${colors.reset}`);
      
      // Investment recommendation
      const avgPositiveROI = scenarioPredictions.filter((p: any) => p.predicted_roi_base > 0).length;
      const totalScenarios = scenarioPredictions.length;
      const positiveRatio = avgPositiveROI / totalScenarios;
      
      if (positiveRatio >= 0.8) {
        console.log(`${colors.green}✅ Strong Buy Signal: ${(positiveRatio * 100).toFixed(0)}% of scenarios show positive returns${colors.reset}`);
      } else if (positiveRatio >= 0.6) {
        console.log(`${colors.yellow}⚖️  Moderate Buy: ${(positiveRatio * 100).toFixed(0)}% of scenarios show positive returns${colors.reset}`);
      } else {
        console.log(`${colors.red}⚠️  High Risk: Only ${(positiveRatio * 100).toFixed(0)}% of scenarios show positive returns${colors.reset}`);
      }
    });
    
    console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    console.log(`${colors.dim}🔬 Analysis powered by TokenMetrics AI prediction models${colors.reset}`);
    console.log(`${colors.dim}📈 Scenarios: Bear (worst case), Base (expected), Bull (best case)${colors.reset}`);
    console.log();
  }

  private async getCorrelationAnalysis(prompt: string): Promise<void> {
    try {
      // Extract token IDs from the user's prompt
      const tokenIds = await this.extractTokensFromPrompt(prompt);
      const primaryTokenId = tokenIds[0]; // Use the first detected token
      
      console.log(`${colors.dim}  🎯 Getting correlation analysis for token ID: ${primaryTokenId}${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getCorrelation.executable(
          { token_id: primaryTokenId, limit: "10", page: "1" },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the correlation data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatCorrelationResponse(responseData.data);
            } else {
              this.formatResponse("No correlation data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("Token correlation analysis retrieved successfully! This shows how the token correlates with other cryptocurrencies for portfolio diversification insights.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Token correlation analysis retrieved successfully! This shows how the token correlates with other cryptocurrencies for portfolio diversification insights.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Correlation analysis failed: ${error}`, 'error');
    }
  }

  private formatCorrelationResponse(correlations: any[]): void {
    console.log(`${colors.magenta}${colors.bright}🔗 Token Correlation Analysis [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.magenta}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}📊 Portfolio Diversification Insights${colors.reset}\n`);
    
    if (!correlations || correlations.length === 0) {
      console.log(`${colors.yellow}No correlation data available.${colors.reset}`);
      return;
    }

    // Process each token's correlation data
    correlations.forEach((tokenData, tokenIndex) => {
      const tokenName = tokenData.TOKEN_NAME || 'Unknown Token';
      const tokenSymbol = tokenData.TOKEN_SYMBOL || 'N/A';
      const date = tokenData.DATE ? new Date(tokenData.DATE).toLocaleDateString() : 'N/A';
      
      console.log(`${colors.cyan}${colors.bright}📈 ${tokenName} (${tokenSymbol})${colors.reset}`);
      console.log(`${colors.dim}Analysis Date: ${date}${colors.reset}`);
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
      
      if (tokenData.TOP_CORRELATION && Array.isArray(tokenData.TOP_CORRELATION)) {
        const correlations = tokenData.TOP_CORRELATION;
        
        // Sort correlations by value (highest to lowest)
        const sortedCorrelations = correlations.sort((a: any, b: any) => b.correlation - a.correlation);
        
        // Get top 5 positive correlations
        const topPositive = sortedCorrelations.filter((c: any) => c.correlation > 0).slice(0, 5);
        // Get top 5 negative correlations (best for diversification)
        const topNegative = sortedCorrelations.filter((c: any) => c.correlation < 0).slice(-5).reverse();
        
        if (topPositive.length > 0) {
          console.log(`${colors.green}${colors.bright}📈 STRONGEST POSITIVE CORRELATIONS${colors.reset}`);
          console.log(`${colors.dim}(These tokens move in the same direction as ${tokenSymbol})${colors.reset}\n`);
          
          topPositive.forEach((corr: any, index: number) => {
            const correlation = corr.correlation;
            const correlationPercent = (correlation * 100).toFixed(1);
            
            console.log(`${colors.bright}${index + 1}. ${corr.token}${colors.reset}`);
            console.log(`   ${this.getCorrelationBar(correlation)} ${correlationPercent}%`);
            console.log(`   ${this.getCorrelationDescription(correlation)}`);
            console.log();
          });
        }
        
        if (topNegative.length > 0) {
          console.log(`${colors.red}${colors.bright}📉 STRONGEST NEGATIVE CORRELATIONS${colors.reset}`);
          console.log(`${colors.dim}(Best for diversification - move opposite to ${tokenSymbol})${colors.reset}\n`);
          
          topNegative.forEach((corr: any, index: number) => {
            const correlation = corr.correlation;
            const correlationPercent = (correlation * 100).toFixed(1);
            
            console.log(`${colors.bright}${index + 1}. ${corr.token}${colors.reset}`);
            console.log(`   ${this.getCorrelationBar(correlation)} ${correlationPercent}%`);
            console.log(`   ${this.getCorrelationDescription(correlation)}`);
            console.log();
          });
        }
        
        // Portfolio diversification recommendations
        console.log(`${colors.yellow}${colors.bright}💡 DIVERSIFICATION RECOMMENDATIONS${colors.reset}`);
        console.log(`${colors.dim}Based on ${tokenSymbol} correlation analysis:${colors.reset}\n`);
        
        const lowCorrelationTokens = correlations.filter((c: any) => Math.abs(c.correlation) < 0.3);
        const negativeCorrelationTokens = correlations.filter((c: any) => c.correlation < -0.5);
        
        if (negativeCorrelationTokens.length > 0) {
          console.log(`${colors.green}🎯 Excellent Diversification Options:${colors.reset}`);
          negativeCorrelationTokens.slice(0, 3).forEach((token: any) => {
            console.log(`   • ${token.token} (${(token.correlation * 100).toFixed(1)}% correlation)`);
          });
          console.log();
        }
        
        if (lowCorrelationTokens.length > 0) {
          console.log(`${colors.blue}🔄 Good Diversification Options:${colors.reset}`);
          lowCorrelationTokens.slice(0, 3).forEach((token: any) => {
            console.log(`   • ${token.token} (${(token.correlation * 100).toFixed(1)}% correlation)`);
          });
          console.log();
        }
        
        // Risk warning for high correlations
        const highCorrelationTokens = correlations.filter((c: any) => c.correlation > 0.7);
        if (highCorrelationTokens.length > 0) {
          console.log(`${colors.red}⚠️  High Risk - Similar Movement Patterns:${colors.reset}`);
          console.log(`${colors.dim}   Avoid these for diversification:${colors.reset}`);
          highCorrelationTokens.slice(0, 3).forEach((token: any) => {
            console.log(`   • ${token.token} (${(token.correlation * 100).toFixed(1)}% correlation)`);
          });
          console.log();
        }
        
      } else {
        console.log(`${colors.yellow}No correlation data available for this token.${colors.reset}\n`);
      }
      
      // Add separator between tokens if there are multiple
      if (tokenIndex < correlations.length - 1) {
        console.log(`${colors.dim}${'═'.repeat(70)}${colors.reset}\n`);
      }
    });
    
    console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}💡 Correlation Guide:${colors.reset}`);
    console.log(`${colors.dim}   • +80% to +100%: Very Strong Positive (avoid for diversification)${colors.reset}`);
    console.log(`${colors.dim}   • +60% to +79%: Strong Positive (risky for diversification)${colors.reset}`);
    console.log(`${colors.dim}   • +30% to +59%: Moderate Positive${colors.reset}`);
    console.log(`${colors.dim}   • -30% to +30%: Low/No Correlation (good for diversification)${colors.reset}`);
    console.log(`${colors.dim}   • -30% to -59%: Moderate Negative (good for diversification)${colors.reset}`);
    console.log(`${colors.dim}   • -60% to -100%: Strong Negative (excellent for diversification)${colors.reset}`);
    console.log(`${colors.dim}🎯 For optimal portfolio diversification, choose tokens with negative or low correlations${colors.reset}`);
    console.log();
  }

  private getROIBar(roi: number, type: 'bearish' | 'neutral' | 'bullish'): string {
    const maxROI = 500; // Max ROI for bar scaling
    const barLength = 25;
    const absROI = Math.abs(roi);
    const filledLength = Math.min(Math.round((absROI / maxROI) * barLength), barLength);
    const emptyLength = barLength - filledLength;
    
    let color = colors.yellow;
    if (type === 'bullish') color = colors.green;
    else if (type === 'bearish') color = colors.red;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    
    return `${color}${filled}${colors.dim}${empty}${colors.reset}`;
  }

  private getCorrelationBar(correlation: number): string {
    const barLength = 20;
    const absCorr = Math.abs(correlation);
    const filledLength = Math.round(absCorr * barLength);
    const emptyLength = barLength - filledLength;
    
    let color = correlation > 0 ? colors.green : colors.red;
    if (absCorr < 0.3) color = colors.yellow; // Low correlation
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    
    return `${color}${filled}${colors.dim}${empty}${colors.reset}`;
  }

  private getCorrelationDescription(correlation: number): string {
    const absCorr = Math.abs(correlation);
    
    if (absCorr >= 0.8) {
      return correlation > 0 ? 
        `${colors.green}Very Strong Positive Correlation${colors.reset}` : 
        `${colors.red}Very Strong Negative Correlation${colors.reset}`;
    } else if (absCorr >= 0.6) {
      return correlation > 0 ? 
        `${colors.green}Strong Positive Correlation${colors.reset}` : 
        `${colors.red}Strong Negative Correlation${colors.reset}`;
    } else if (absCorr >= 0.4) {
      return correlation > 0 ? 
        `${colors.yellow}Moderate Positive Correlation${colors.reset}` : 
        `${colors.yellow}Moderate Negative Correlation${colors.reset}`;
    } else if (absCorr >= 0.2) {
      return `${colors.dim}Weak Correlation${colors.reset}`;
    } else {
      return `${colors.dim}Very Weak/No Correlation${colors.reset}`;
    }
  }

  private formatPrice(price: any): string {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price.toString();
    
    if (numPrice >= 1000000) {
      return (numPrice / 1000000).toFixed(2) + 'M';
    } else if (numPrice >= 1000) {
      return (numPrice / 1000).toFixed(2) + 'K';
    } else if (numPrice >= 1) {
      return numPrice.toFixed(2);
    } else {
      return numPrice.toFixed(6);
    }
  }

  private async testTokenDetection(): Promise<void> {
    console.log(`${colors.cyan}🧪 Testing token detection...${colors.reset}`);
    
    const testPrompts = [
      "What is the price of Bitcoin?",
      "Show me Ethereum data",
      "Get BTC and ETH prices",
      "Analyze Solana and Cardano",
      "Bitcoin, Ethereum, and Dogecoin analysis"
    ];
    
    for (const prompt of testPrompts) {
      console.log(`\n${colors.yellow}Testing: "${prompt}"${colors.reset}`);
      const tokens = await this.extractTokensFromPrompt(prompt);
      console.log(`${colors.green}Detected tokens: ${tokens.join(', ')}${colors.reset}`);
    }
  }

  private async getIndices(prompt: string): Promise<void> {
    try {
      // Extract indices type from prompt if specified
      const lowerPrompt = prompt.toLowerCase();
      let indicesType = '';
      
      if (lowerPrompt.includes('active')) {
        indicesType = 'active';
      } else if (lowerPrompt.includes('passive')) {
        indicesType = 'passive';
      }
      
      console.log(`${colors.dim}  🎯 Getting crypto indices${indicesType ? ` (${indicesType})` : ''}...${colors.reset}`);
      
      const args: any = { limit: "50", page: "1" };
      if (indicesType) {
        args.indicesType = indicesType;
      }
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getIndices.executable(
          args,
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the indices data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatIndicesResponse(responseData.data);
            } else {
              this.formatResponse("No indices data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("Crypto indices data retrieved successfully! This shows available indices for portfolio tracking and analysis.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Crypto indices data retrieved successfully! This shows available indices for portfolio tracking and analysis.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Indices data retrieval failed: ${error}`, 'error');
    }
  }

  private async getIndicesHoldings(prompt: string): Promise<void> {
    try {
      // Extract index ID from prompt (default to 1 if not specified)
      const lowerPrompt = prompt.toLowerCase();
      let indexId = '1'; // Default index ID
      
      // Try to extract index ID from prompt
      const idMatch = prompt.match(/index\s+(\d+)|id\s+(\d+)/i);
      if (idMatch) {
        indexId = idMatch[1] || idMatch[2];
      }
      
      console.log(`${colors.dim}  🎯 Getting holdings for index ${indexId}...${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getIndicesHoldings.executable(
          { id: indexId },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the holdings data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatIndicesHoldingsResponse(responseData.data, indexId);
            } else {
              this.formatResponse(`No holdings data available for index ${indexId}.`, 'data');
            }
          } else {
            this.formatResponse(`Index holdings data retrieved successfully for index ${indexId}! This shows the portfolio composition and weights.`, 'data');
          }
        } catch (parseError) {
          this.formatResponse(`Index holdings data retrieved successfully for index ${indexId}! This shows the portfolio composition and weights.`, 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Index holdings retrieval failed: ${error}`, 'error');
    }
  }

  private async getIndicesPerformance(prompt: string): Promise<void> {
    try {
      // Extract index ID and date range from prompt
      const lowerPrompt = prompt.toLowerCase();
      let indexId = '1'; // Default index ID
      
      // Try to extract index ID from prompt
      const idMatch = prompt.match(/index\s+(\d+)|id\s+(\d+)/i);
      if (idMatch) {
        indexId = idMatch[1] || idMatch[2];
      }
      
      // Set default date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`${colors.dim}  🎯 Getting performance for index ${indexId} (${startDateStr} to ${endDateStr})...${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getIndicesPerformance.executable(
          { 
            id: indexId,
            startDate: startDateStr,
            endDate: endDateStr,
            limit: "50",
            page: "1"
          },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the performance data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatIndicesPerformanceResponse(responseData.data, indexId);
            } else {
              this.formatResponse(`No performance data available for index ${indexId} in the specified period.`, 'data');
            }
          } else {
            this.formatResponse(`Index performance data retrieved successfully for index ${indexId}! This shows historical ROI and performance trends.`, 'data');
          }
        } catch (parseError) {
          this.formatResponse(`Index performance data retrieved successfully for index ${indexId}! This shows historical ROI and performance trends.`, 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Index performance retrieval failed: ${error}`, 'error');
    }
  }

  private formatIndicesResponse(indices: any[]): void {
    console.log(`${colors.cyan}${colors.bright}📊 TokenMetrics Crypto Indices [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}🎯 Portfolio Tracking & Investment Indices${colors.reset}\n`);
    
    if (!indices || indices.length === 0) {
      console.log(`${colors.yellow}No indices data available.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}Found ${indices.length} crypto indices:${colors.reset}\n`);
    
    // Table header
    console.log(`${colors.bright}${'ID'.padEnd(6)} ${'Name'.padEnd(25)} ${'Ticker'.padEnd(15)} ${'24H Change'.padEnd(12)} ${'1M Change'.padEnd(12)}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(6)} ${'─'.repeat(25)} ${'─'.repeat(15)} ${'─'.repeat(12)} ${'─'.repeat(12)}${colors.reset}`);
    
    indices.forEach(index => {
      // Use the actual field names from API response
      const id = (index.ID || 'N/A').toString().padEnd(6);
      const name = (index.NAME || 'N/A').substring(0, 24).padEnd(25);
      const ticker = (index.TICKER || 'N/A').substring(0, 14).padEnd(15);
      
      // Format 24H change with color
      const change24h = index['24H'] !== undefined ? 
        (index['24H'] >= 0 ? 
          `${colors.green}+${index['24H'].toFixed(2)}%${colors.reset}` : 
          `${colors.red}${index['24H'].toFixed(2)}%${colors.reset}`
        ).padEnd(20) : 'N/A'.padEnd(12);
      
      // Format 1M change with color
      const change1m = index['1M'] !== undefined ? 
        (index['1M'] >= 0 ? 
          `${colors.green}+${index['1M'].toFixed(2)}%${colors.reset}` : 
          `${colors.red}${index['1M'].toFixed(2)}%${colors.reset}`
        ).padEnd(20) : 'N/A'.padEnd(12);
      
      console.log(`${colors.white}${id} ${colors.yellow}${name} ${colors.blue}${ticker} ${change24h} ${change1m}${colors.reset}`);
    });
    
    console.log(`\n${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.green}✅ Total indices available: ${indices.length}${colors.reset}`);
    console.log(`${colors.dim}💡 Use "index holdings" or "index performance" for detailed analysis${colors.reset}`);
    console.log();
  }

  private formatIndicesHoldingsResponse(holdings: any[], indexId: string): void {
    console.log(`${colors.magenta}${colors.bright}🏦 Index ${indexId} Holdings Breakdown [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.magenta}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}📊 Portfolio Composition & Asset Weights${colors.reset}\n`);
    
    if (!holdings || holdings.length === 0) {
      console.log(`${colors.yellow}No holdings data available for index ${indexId}.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}Found ${holdings.length} holdings in index ${indexId}:${colors.reset}\n`);
    
    // Table header
    console.log(`${colors.bright}${'Symbol'.padEnd(12)} ${'Name'.padEnd(20)} ${'Weight'.padEnd(10)} ${'Price'.padEnd(15)} ${'ROI'.padEnd(12)}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(12)} ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(15)} ${'─'.repeat(12)}${colors.reset}`);
    
    let totalWeight = 0;
    holdings.forEach(holding => {
      // Use the actual field names from API response
      const symbol = (holding.TOKEN_SYMBOL || 'N/A').padEnd(12);
      const name = (holding.TOKEN_NAME || 'N/A').substring(0, 19).padEnd(20);
      
      // Format weight
      const weightValue = holding.WEIGHT;
      const weight = weightValue ? `${(weightValue * 100).toFixed(2)}%` : 'N/A';
      const weightPadded = weight.padEnd(10);
      
      // Format price
      const priceValue = holding.PRICE || 0;
      const price = this.formatPrice(priceValue).padEnd(15);
      
      // Format ROI with color
      const roiValue = holding.CURRENT_ROI;
      const roi = roiValue !== undefined ? 
        (roiValue >= 0 ? 
          `${colors.green}+${roiValue.toFixed(2)}%${colors.reset}` : 
          `${colors.red}${roiValue.toFixed(2)}%${colors.reset}`
        ).padEnd(20) : 'N/A'.padEnd(12);
      
      if (weightValue) totalWeight += weightValue;
      
      console.log(`${colors.yellow}${symbol} ${colors.green}${name} ${colors.white}${weightPadded} ${colors.cyan}${price} ${roi}${colors.reset}`);
    });
    
    console.log(`\n${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.green}✅ Total holdings: ${holdings.length}${colors.reset}`);
    console.log(`${colors.green}✅ Total weight: ${(totalWeight * 100).toFixed(2)}%${colors.reset}`);
    console.log(`${colors.dim}💡 Use "index performance" to see historical returns${colors.reset}`);
    console.log();
  }

  private formatIndicesPerformanceResponse(performance: any[], indexId: string): void {
    console.log(`${colors.blue}${colors.bright}📈 Index ${indexId} Performance Analysis [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.dim}📊 Historical ROI & Investment Returns${colors.reset}\n`);
    
    if (!performance || performance.length === 0) {
      console.log(`${colors.yellow}No performance data available for index ${indexId}.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}Found ${performance.length} performance data points:${colors.reset}\n`);
    
    // Calculate performance metrics
    const firstPoint = performance[0];
    const lastPoint = performance[performance.length - 1];
    
    // Use the actual field names from API response
    const firstROI = firstPoint.INDEX_CUMULATIVE_ROI;
    const lastROI = lastPoint.INDEX_CUMULATIVE_ROI;
    
    const totalReturn = lastROI && firstROI ? 
      ((lastROI - firstROI) / Math.abs(firstROI) * 100) : 0;
    
    // Use the actual field names for date
    const firstDate = firstPoint.DATE;
    const lastDate = lastPoint.DATE;
    
    // Summary metrics
    console.log(`${colors.bright}Performance Summary:${colors.reset}`);
    console.log(`${colors.white}• Period: ${firstDate || 'N/A'} to ${lastDate || 'N/A'}${colors.reset}`);
    console.log(`${colors.white}• Total Return: ${totalReturn >= 0 ? 
      `${colors.green}+${totalReturn.toFixed(2)}%${colors.reset}` : 
      `${colors.red}${totalReturn.toFixed(2)}%${colors.reset}`}${colors.reset}`);
    console.log(`${colors.white}• Data Points: ${performance.length}${colors.reset}\n`);
    
    // Table header for recent performance
    console.log(`${colors.bright}Recent Performance (Last 10 points):${colors.reset}`);
    console.log(`${colors.bright}${'Date'.padEnd(12)} ${'ROI'.padEnd(15)} ${'Change'.padEnd(12)} ${'Trend'.padEnd(8)}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(12)} ${'─'.repeat(15)} ${'─'.repeat(12)} ${'─'.repeat(8)}${colors.reset}`);
    
    // Show last 10 data points
    const recentData = performance.slice(-10);
    recentData.forEach((point, index) => {
      // Use the actual field names from API response
      const dateValue = point.DATE;
      const date = dateValue ? dateValue.toString().substring(0, 10).padEnd(12) : 'N/A'.padEnd(12);
      
      // Use the actual field name for ROI
      const roiValue = point.INDEX_CUMULATIVE_ROI;
      const roi = roiValue ? `${roiValue.toFixed(4)}%` : 'N/A';
      const roiPadded = roi.padEnd(15);
      
      let change = 'N/A';
      let trend = '';
      if (index > 0 && roiValue && recentData[index - 1].INDEX_CUMULATIVE_ROI) {
        const prevROI = recentData[index - 1].INDEX_CUMULATIVE_ROI;
        const changeValue = roiValue - prevROI;
        change = changeValue >= 0 ? 
          `${colors.green}+${changeValue.toFixed(4)}%${colors.reset}` : 
          `${colors.red}${changeValue.toFixed(4)}%${colors.reset}`;
        trend = changeValue >= 0 ? `${colors.green}↗${colors.reset}` : `${colors.red}↘${colors.reset}`;
      }
      const changePadded = change.padEnd(20);
      
      console.log(`${colors.white}${date} ${colors.cyan}${roiPadded} ${changePadded} ${trend}${colors.reset}`);
    });
    
    console.log(`\n${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.green}✅ Performance tracking period: ${performance.length} data points${colors.reset}`);
    console.log(`${colors.dim}💡 Use "index holdings" to see current portfolio composition${colors.reset}`);
    console.log();
  }

  private async getHourlyTradingSignals(prompt?: string): Promise<void> {
    try {
      // Extract token IDs from the user's prompt - default to Bitcoin if none specified
      const tokenIds = await this.extractTokensFromPrompt(prompt || "Bitcoin"); // Use actual prompt or default to Bitcoin
      const primaryTokenId = tokenIds[0] || "3375"; // Default to Bitcoin ID
      
      console.log(`${colors.dim}  🎯 Getting hourly trading signals for token ID: ${primaryTokenId}${colors.reset}`);
      
      const result = await this.retryWithBackoff(async () => {
        return await this.plugin.getHourlyTradingSignals.executable(
          { 
            token_id: primaryTokenId,
            limit: "10", 
            page: "1"
          },
          (msg: string) => console.log(`${colors.dim}  📝 ${msg}${colors.reset}`)
        );
      });
      
      if (result.status === 'done') {
        // Parse the hourly trading signals data from the response
        try {
          const responseMatch = result.feedback.match(/Response: ({.*})/);
          if (responseMatch) {
            const responseData = JSON.parse(responseMatch[1]);
            if (responseData.success && responseData.data && responseData.data.length > 0) {
              this.formatHourlyTradingSignalsResponse(responseData.data);
            } else {
              this.formatResponse("No hourly trading signals data available at the moment.", 'data');
            }
          } else {
            this.formatResponse("Hourly trading signals retrieved successfully. Check the detailed data above for AI-generated buy/sell recommendations.", 'data');
          }
        } catch (parseError) {
          this.formatResponse("Hourly trading signals retrieved successfully. Check the detailed data above for AI-generated buy/sell recommendations.", 'data');
        }
      } else {
        this.formatResponse(result.feedback, 'error');
      }
    } catch (error) {
      this.formatResponse(`Hourly trading signals failed: ${error}`, 'error');
    }
  }

  private formatHourlyTradingSignalsResponse(signals: any[]): void {
    console.log(`${colors.magenta}${colors.bright}⏰ Hourly AI Trading Signals [${new Date().toLocaleTimeString()}]${colors.reset}`);
    console.log(`${colors.magenta}${'═'.repeat(75)}${colors.reset}`);
    console.log(`${colors.dim}🤖 Real-time AI Trading Signals Updated Hourly${colors.reset}\n`);
    
    signals.slice(0, 8).forEach((signal, index) => {
      const tokenName = signal.TOKEN_NAME || 'Unknown Token';
      const tokenSymbol = signal.TOKEN_SYMBOL || 'N/A';
      const tradingSignal = parseInt(signal.SIGNAL) || 0;
      const position = parseInt(signal.POSITION) || 0;
      const closePrice = signal.CLOSE || 0;
      const timestamp = signal.TIMESTAMP || new Date().toISOString();
      
      // Determine signal type and styling based on SIGNAL field.
      let signalType = 'HOLD';
      let signalColor = colors.yellow;
      let signalEmoji = '🟡';
      let actionEmoji = '⏸️';
      
      if (tradingSignal === 1) {
        signalType = 'BUY';
        signalColor = colors.green;
        signalEmoji = '🟢';
        actionEmoji = '📈';
      } else if (tradingSignal === -1) {
        signalType = 'SELL';
        signalColor = colors.red;
        signalEmoji = '🔴';
        actionEmoji = '📉';
      }
      
      // Position interpretation
      let positionText = 'NEUTRAL';
      let positionColor = colors.yellow;
      if (position === 1) {
        positionText = 'LONG';
        positionColor = colors.green;
      } else if (position === -1) {
        positionText = 'SHORT';
        positionColor = colors.red;
      }
      
      console.log(`${colors.bright}${index + 1}. ${tokenName} (${tokenSymbol})${colors.reset}`);
      console.log(`${signalColor}${signalEmoji} ${actionEmoji} ${signalType} SIGNAL${colors.reset}`);
      console.log(`📍 Position: ${positionColor}${positionText}${colors.reset}`);
      console.log(`💰 Close Price: $${this.formatPrice(closePrice)}`);
      console.log(`⏰ Time: ${new Date(timestamp).toLocaleString()}\n`);
    });
    
    // Summary statistics
    const buySignals = signals.filter(s => parseInt(s.SIGNAL) === 1).length;
    const sellSignals = signals.filter(s => parseInt(s.SIGNAL) === -1).length;
    const holdSignals = signals.filter(s => parseInt(s.SIGNAL) === 0).length;
    
    const longPositions = signals.filter(s => parseInt(s.POSITION) === 1).length;
    const shortPositions = signals.filter(s => parseInt(s.POSITION) === -1).length;
    const neutralPositions = signals.filter(s => parseInt(s.POSITION) === 0).length;
    
    console.log(`${colors.dim}${'─'.repeat(75)}${colors.reset}`);
    console.log(`${colors.bright}📊 Signal Summary:${colors.reset}`);
    console.log(`${colors.green}📈 BUY: ${buySignals}${colors.reset} | ${colors.red}📉 SELL: ${sellSignals}${colors.reset} | ${colors.yellow}⏸️  HOLD: ${holdSignals}${colors.reset}`);
    console.log(`${colors.bright}📍 Position Summary:${colors.reset}`);
    console.log(`${colors.green}📈 LONG: ${longPositions}${colors.reset} | ${colors.red}📉 SHORT: ${shortPositions}${colors.reset} | ${colors.yellow}⚖️  NEUTRAL: ${neutralPositions}${colors.reset}`);
    console.log(`${colors.dim}💡 Showing ${Math.min(8, signals.length)} signals. Total available: ${signals.length}${colors.reset}`);
    console.log(`${colors.dim}⏰ Signals are updated hourly with real-time market data${colors.reset}`);
    console.log();
  }

  private getSignalStrengthBar(strength: number): string {
    const maxStrength = 1.0;
    const normalizedStrength = Math.min(strength / maxStrength, 1);
    const barLength = 20;
    const filledLength = Math.round(normalizedStrength * barLength);
    
    let color = colors.yellow;
    if (normalizedStrength >= 0.7) color = colors.green;
    else if (normalizedStrength >= 0.4) color = colors.yellow;
    else color = colors.red;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(barLength - filledLength);
    
    return `${color}${filled}${colors.dim}${empty}${colors.reset}`;
  }

  private getConfidenceBar(confidence: number): string {
    const barLength = 15;
    const filledLength = Math.round(confidence * barLength);
    
    let color = colors.red;
    if (confidence >= 0.8) color = colors.green;
    else if (confidence >= 0.6) color = colors.yellow;
    else if (confidence >= 0.4) color = colors.yellow;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(barLength - filledLength);
    
    return `${color}${filled}${colors.dim}${empty}${colors.reset}`;
  }
}

function validateEnvironment(): boolean {
  if (!process.env.TOKENMETRICS_API_KEY) {
    console.log(`${colors.red}❌ TOKENMETRICS_API_KEY is missing in .env file${colors.reset}`);
    console.log(`${colors.yellow}Please add your TokenMetrics API key to the .env file:${colors.reset}`);
    console.log(`TOKENMETRICS_API_KEY=tm-your-api-key-here`);
    return false;
  }
  return true;
}

// Start the chat interface
(async () => {
  if (validateEnvironment()) {
    const chat = new TokenMetricsChatInterface();
    await chat.start();
  } else {
    process.exit(1);
  }
})(); 