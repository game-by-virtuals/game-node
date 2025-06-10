import {
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
  } from "@virtuals-protocol/game";
  
  // Color coding for beautiful console output
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

  // Format large numbers with commas
  function formatNumber(num: any): string {
    if (num === null || num === undefined) return 'N/A';
    const number = parseFloat(num);
    if (isNaN(number)) return 'N/A';
    return number.toLocaleString();
  }

  // Format price with appropriate decimal places
  function formatPrice(price: any): string {
    if (price === null || price === undefined) return 'N/A';
    const num = parseFloat(price);
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1) {
      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (num >= 0.01) {
      return `$${num.toFixed(4)}`;
    } else {
      return `$${num.toFixed(8)}`;
    }
  }

  // Format tokens response for better readability
  function formatTokensResponse(tokens: any[]): string {
    if (!tokens || tokens.length === 0) {
      return `${colors.yellow}No tokens found.${colors.reset}`;
    }

    let output = `${colors.cyan}${colors.bright}🪙 TokenMetrics Supported Cryptocurrencies${colors.reset}\n`;
    output += `${colors.cyan}${'═'.repeat(60)}${colors.reset}\n\n`;
    
    output += `${colors.green}Found ${tokens.length} cryptocurrencies:${colors.reset}\n\n`;
    
    // Table header
    output += `${colors.bright}${'ID'.padEnd(8)} ${'Symbol'.padEnd(12)} ${'Name'.padEnd(25)} ${'Category'.padEnd(15)}${colors.reset}\n`;
    output += `${colors.dim}${'─'.repeat(8)} ${'─'.repeat(12)} ${'─'.repeat(25)} ${'─'.repeat(15)}${colors.reset}\n`;
    
    // Show first 20 tokens with better formatting
    const displayTokens = tokens.slice(0, 20);
    displayTokens.forEach(token => {
      const id = (token.TOKEN_ID || token.id || 'N/A').toString().padEnd(8);
      const symbol = (token.TOKEN_SYMBOL || token.symbol || 'N/A').padEnd(12);
      const name = (token.TOKEN_NAME || token.name || 'N/A').substring(0, 24).padEnd(25);
      const category = (token.CATEGORY || token.category || 'N/A').substring(0, 14).padEnd(15);
      
      output += `${colors.white}${id} ${colors.yellow}${symbol} ${colors.green}${name} ${colors.blue}${category}${colors.reset}\n`;
    });
    
    if (tokens.length > 20) {
      output += `\n${colors.dim}... and ${tokens.length - 20} more tokens${colors.reset}\n`;
    }
    
    output += `\n${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`;
    output += `${colors.green}✅ Total tokens available: ${formatNumber(tokens.length)}${colors.reset}\n`;
    
    return output;
  }

  // Format price data response
  function formatPriceResponse(priceData: any[]): string {
    if (!priceData || priceData.length === 0) {
      return `${colors.yellow}No price data found.${colors.reset}`;
    }

    let output = `${colors.cyan}${colors.bright}💰 Current Cryptocurrency Prices${colors.reset}\n`;
    output += `${colors.cyan}${'═'.repeat(60)}${colors.reset}\n\n`;
    
    // Table header
    output += `${colors.bright}${'Symbol'.padEnd(12)} ${'Name'.padEnd(20)} ${'Price'.padEnd(15)} ${'Change 24h'.padEnd(12)}${colors.reset}\n`;
    output += `${colors.dim}${'─'.repeat(12)} ${'─'.repeat(20)} ${'─'.repeat(15)} ${'─'.repeat(12)}${colors.reset}\n`;
    
    priceData.forEach(token => {
      const symbol = (token.TOKEN_SYMBOL || token.symbol || 'N/A').padEnd(12);
      const name = (token.TOKEN_NAME || token.name || 'N/A').substring(0, 19).padEnd(20);
      const price = formatPrice(token.CURRENT_PRICE || token.PRICE || token.price).padEnd(15);
      const change = token.change_24h ? 
        (token.change_24h >= 0 ? 
          `${colors.green}+${token.change_24h.toFixed(2)}%${colors.reset}` : 
          `${colors.red}${token.change_24h.toFixed(2)}%${colors.reset}`
        ).padEnd(20) : 'N/A'.padEnd(12);
      
      output += `${colors.yellow}${symbol} ${colors.green}${name} ${colors.white}${price} ${change}\n`;
    });
    
    output += `\n${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`;
    
    return output;
  }

  // Format indices response
  function formatIndicesResponse(indices: any[]): string {
    if (!indices || indices.length === 0) {
      return `${colors.yellow}No indices found.${colors.reset}`;
    }

    let output = `${colors.cyan}${colors.bright}📊 TokenMetrics Crypto Indices${colors.reset}\n`;
    output += `${colors.cyan}${'═'.repeat(70)}${colors.reset}\n\n`;
    
    output += `${colors.green}Found ${indices.length} crypto indices:${colors.reset}\n\n`;
    
    // Table header
    output += `${colors.bright}${'ID'.padEnd(6)} ${'Name'.padEnd(25)} ${'Ticker'.padEnd(15)} ${'24H Change'.padEnd(12)} ${'1M Change'.padEnd(12)}${colors.reset}\n`;
    output += `${colors.dim}${'─'.repeat(6)} ${'─'.repeat(25)} ${'─'.repeat(15)} ${'─'.repeat(12)} ${'─'.repeat(12)}${colors.reset}\n`;
    
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
      
      output += `${colors.white}${id} ${colors.yellow}${name} ${colors.blue}${ticker} ${change24h} ${change1m}${colors.reset}\n`;
    });
    
    output += `\n${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`;
    output += `${colors.green}✅ Total indices available: ${formatNumber(indices.length)}${colors.reset}\n`;
    
    return output;
  }

  // Format indices holdings response
  function formatIndicesHoldingsResponse(holdings: any[]): string {
    if (!holdings || holdings.length === 0) {
      return `${colors.yellow}No holdings found for this index.${colors.reset}`;
    }

    let output = `${colors.cyan}${colors.bright}🏦 Index Holdings Breakdown${colors.reset}\n`;
    output += `${colors.cyan}${'═'.repeat(70)}${colors.reset}\n\n`;
    
    output += `${colors.green}Found ${holdings.length} holdings in this index:${colors.reset}\n\n`;
    
    // Table header
    output += `${colors.bright}${'Symbol'.padEnd(12)} ${'Name'.padEnd(20)} ${'Weight'.padEnd(10)} ${'Price'.padEnd(15)} ${'Value'.padEnd(12)}${colors.reset}\n`;
    output += `${colors.dim}${'─'.repeat(12)} ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(15)} ${'─'.repeat(12)}${colors.reset}\n`;
    
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
      const price = formatPrice(priceValue).padEnd(15);
      
      // Format value (calculated from weight and price if needed)
      const valueValue = holding.VALUE || (weightValue && priceValue ? weightValue * priceValue : null);
      const value = valueValue ? formatPrice(valueValue) : 'N/A';
      const valuePadded = value.padEnd(12);
      
      if (weightValue) totalWeight += weightValue;
      
      output += `${colors.yellow}${symbol} ${colors.green}${name} ${colors.white}${weightPadded} ${colors.cyan}${price} ${colors.magenta}${valuePadded}${colors.reset}\n`;
    });
    
    output += `\n${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`;
    output += `${colors.green}✅ Total holdings: ${formatNumber(holdings.length)}${colors.reset}\n`;
    output += `${colors.green}✅ Total weight: ${(totalWeight * 100).toFixed(2)}%${colors.reset}\n`;
    
    return output;
  }

  // Format indices performance response
  function formatIndicesPerformanceResponse(performance: any[]): string {
    if (!performance || performance.length === 0) {
      return `${colors.yellow}No performance data found for this index.${colors.reset}`;
    }

    let output = `${colors.cyan}${colors.bright}📈 Index Performance Analysis${colors.reset}\n`;
    output += `${colors.cyan}${'═'.repeat(70)}${colors.reset}\n\n`;
    
    output += `${colors.green}Found ${performance.length} performance data points:${colors.reset}\n\n`;
    
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
    output += `${colors.bright}Performance Summary:${colors.reset}\n`;
    output += `${colors.white}• Period: ${firstDate || 'N/A'} to ${lastDate || 'N/A'}${colors.reset}\n`;
    output += `${colors.white}• Total Return: ${totalReturn >= 0 ? 
      `${colors.green}+${totalReturn.toFixed(2)}%${colors.reset}` : 
      `${colors.red}${totalReturn.toFixed(2)}%${colors.reset}`}${colors.reset}\n`;
    output += `${colors.white}• Data Points: ${performance.length}${colors.reset}\n\n`;
    
    // Table header for recent performance
    output += `${colors.bright}Recent Performance (Last 10 points):${colors.reset}\n`;
    output += `${colors.bright}${'Date'.padEnd(12)} ${'ROI'.padEnd(15)} ${'Change'.padEnd(12)} ${'Trend'.padEnd(8)}${colors.reset}\n`;
    output += `${colors.dim}${'─'.repeat(12)} ${'─'.repeat(15)} ${'─'.repeat(12)} ${'─'.repeat(8)}${colors.reset}\n`;
    
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
      
      output += `${colors.white}${date} ${colors.cyan}${roiPadded} ${changePadded} ${trend}${colors.reset}\n`;
    });
    
    output += `\n${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`;
    output += `${colors.green}✅ Performance tracking period: ${performance.length} data points${colors.reset}\n`;
    
    return output;
  }

  // Format hourly trading signals response
  function formatHourlyTradingSignalsResponse(signals: any[]): string {
    if (!signals || signals.length === 0) {
      return `${colors.yellow}No hourly trading signals found.${colors.reset}`;
    }

    let output = `${colors.magenta}${colors.bright}⏰ Hourly AI Trading Signals${colors.reset}\n`;
    output += `${colors.magenta}${'═'.repeat(75)}${colors.reset}\n\n`;
    
    output += `${colors.green}Found ${signals.length} hourly trading signals:${colors.reset}\n\n`;
    
    // Table header
    output += `${colors.bright}${'Symbol'.padEnd(12)} ${'Name'.padEnd(20)} ${'Signal'.padEnd(8)} ${'Strength'.padEnd(12)} ${'Confidence'.padEnd(12)} ${'Price'.padEnd(15)}${colors.reset}\n`;
    output += `${colors.dim}${'─'.repeat(12)} ${'─'.repeat(20)} ${'─'.repeat(8)} ${'─'.repeat(12)} ${'─'.repeat(12)} ${'─'.repeat(15)}${colors.reset}\n`;
    
    signals.slice(0, 10).forEach(signal => {
      const symbol = (signal.TOKEN_SYMBOL || 'N/A').padEnd(12);
      const name = (signal.TOKEN_NAME || 'N/A').substring(0, 19).padEnd(20);
      
      // Format signal
      const tradingSignal = signal.TRADING_SIGNAL || 0;
      let signalText = 'HOLD';
      let signalColor = colors.yellow;
      
      if (tradingSignal === 1) {
        signalText = 'BUY';
        signalColor = colors.green;
      } else if (tradingSignal === -1) {
        signalText = 'SELL';
        signalColor = colors.red;
      }
      const signalPadded = signalText.padEnd(8);
      
      // Format strength
      const strength = signal.SIGNAL_STRENGTH || 0;
      const strengthText = Math.abs(strength).toFixed(2);
      const strengthPadded = strengthText.padEnd(12);
      
      // Format confidence
      const confidence = signal.CONFIDENCE || 0;
      const confidenceText = `${(confidence * 100).toFixed(1)}%`;
      const confidencePadded = confidenceText.padEnd(12);
      
      // Format price
      const price = formatPrice(signal.CURRENT_PRICE || 0).padEnd(15);
      
      output += `${colors.yellow}${symbol} ${colors.green}${name} ${signalColor}${signalPadded}${colors.reset} ${colors.white}${strengthPadded} ${colors.cyan}${confidencePadded} ${colors.white}${price}${colors.reset}\n`;
    });
    
    if (signals.length > 10) {
      output += `\n${colors.dim}... and ${signals.length - 10} more signals${colors.reset}\n`;
    }
    
    // Summary statistics
    const buySignals = signals.filter(s => s.TRADING_SIGNAL === 1).length;
    const sellSignals = signals.filter(s => s.TRADING_SIGNAL === -1).length;
    const holdSignals = signals.filter(s => s.TRADING_SIGNAL === 0).length;
    const avgConfidence = signals.reduce((sum, s) => sum + (s.CONFIDENCE || 0), 0) / signals.length;
    
    output += `\n${colors.magenta}${'═'.repeat(75)}${colors.reset}\n`;
    output += `${colors.bright}📊 Signal Summary:${colors.reset}\n`;
    output += `${colors.green}📈 BUY: ${buySignals}${colors.reset} | ${colors.red}📉 SELL: ${sellSignals}${colors.reset} | ${colors.yellow}⏸️  HOLD: ${holdSignals}${colors.reset}\n`;
    output += `${colors.bright}🎯 Average Confidence: ${(avgConfidence * 100).toFixed(1)}%${colors.reset}\n`;
    output += `${colors.dim}⏰ Signals are updated hourly with real-time market data${colors.reset}\n`;
    
    return output;
  }

  // Enhanced API call function with better formatting
  export async function tokenMetricsApiCall(
    apiKey: string,
    baseApiUrl: string,
    endpoint: string,
    args: any,
    logger: any
  ) {
    // Prepare headers for the request
    const headers = {
      "accept": "application/json",
      "x-api-key": apiKey,
    };
  
    // Build query parameters
    const queryParams = new URLSearchParams();
    Object.keys(args).forEach(key => {
      if (args[key] !== undefined && args[key] !== null) {
        queryParams.append(key, args[key].toString());
      }
    });
  
    // Prepare request URL
    const url = `${baseApiUrl}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    logger(`${colors.blue}🔍 Making API request to: ${endpoint}${colors.reset}`);
    logger(`${colors.dim}📋 Full URL: ${url}${colors.reset}`);
    logger(`${colors.dim}📋 Parameters: ${JSON.stringify(args)}${colors.reset}`);
    logger(`${colors.dim}📋 Query string: ${queryParams.toString()}${colors.reset}`);
  
    // Make the API request
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
  
    const jsonResponse: any = await response.json();
  
    // Format response based on endpoint
    let formattedMessage = '';
    
    if (endpoint === '/tokens' && jsonResponse.data) {
      formattedMessage = formatTokensResponse(jsonResponse.data);
    } else if (endpoint === '/price' && jsonResponse.data) {
      formattedMessage = formatPriceResponse(jsonResponse.data);
    } else if (endpoint === '/indices' && jsonResponse.data) {
      formattedMessage = formatIndicesResponse(jsonResponse.data);
    } else if (endpoint === '/indices-holdings' && jsonResponse.data) {
      formattedMessage = formatIndicesHoldingsResponse(jsonResponse.data);
    } else if (endpoint === '/indices-performance' && jsonResponse.data) {
      formattedMessage = formatIndicesPerformanceResponse(jsonResponse.data);
    } else if (endpoint === '/hourly-trading-signals' && jsonResponse.data) {
      formattedMessage = formatHourlyTradingSignalsResponse(jsonResponse.data);
    } else {
      // Default formatting for other endpoints
      formattedMessage = `${colors.green}✅ Successfully retrieved data from ${endpoint}${colors.reset}\n\n`;
      formattedMessage += `${colors.cyan}Response Summary:${colors.reset}\n`;
      
      if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
        formattedMessage += `${colors.white}• Found ${jsonResponse.data.length} items${colors.reset}\n`;
        if (jsonResponse.data.length > 0) {
          formattedMessage += `${colors.white}• Sample data: ${JSON.stringify(jsonResponse.data[0], null, 2)}${colors.reset}\n`;
        }
      } else {
        formattedMessage += `${colors.white}${JSON.stringify(jsonResponse, null, 2)}${colors.reset}\n`;
      }
    }
    
    logger(formattedMessage);
  
    // Include raw JSON data for programmatic access (used by chat interface)
    const responseWithData = formattedMessage + `\n\nResponse: ${JSON.stringify(jsonResponse)}`;
  
    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      responseWithData
    );
  }

  export async function tokenMetricsApiPostCall(
    apiKey: string,
    baseApiUrl: string,
    endpoint: string,
    body: any,
    logger: any
  ) {
    // Prepare headers for the POST request
    const headers = {
      "accept": "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    };
  
    // Prepare request URL
    const url = `${baseApiUrl}${endpoint}`;
    
    logger(`${colors.blue}🔍 Making POST API request to: ${endpoint}${colors.reset}`);
    logger(`Request body: ${JSON.stringify(body)}`);
  
    // Make the API request
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
  
    const jsonResponse: any = await response.json();
  
    const formattedMessage = `${colors.green}✅ Successfully queried TokenMetrics AI${colors.reset}\n\n${colors.cyan}AI Response:${colors.reset}\n${colors.white}${JSON.stringify(jsonResponse, null, 2)}${colors.reset}`;
    logger(formattedMessage);
  
    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Done,
      formattedMessage
    );
  }
  
  export function exceptionHandler(e: any, logger: any) {
    const errorMessage = `${colors.red}❌ An error occurred while querying TokenMetrics data:${colors.reset}\n${colors.yellow}${e.message || "Unknown error"}${colors.reset}`;
    logger(errorMessage);
    return new ExecutableGameFunctionResponse(
      ExecutableGameFunctionStatus.Failed,
      errorMessage
    );
  }