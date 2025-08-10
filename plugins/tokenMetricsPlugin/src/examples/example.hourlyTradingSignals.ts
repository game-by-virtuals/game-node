import TokenMetricsPlugin from "../index";

async function main() {
  const plugin = new TokenMetricsPlugin({
    apiClientConfig: {
      apiKey: process.env.TOKENMETRICS_API_KEY!,
      baseApiUrl: "https://api.tokenmetrics.com/v2",
    },
  });

  const worker = plugin.getWorker();

  console.log("🚀 Testing Hourly Trading Signals endpoint...\n");

  try {
    // Test hourly trading signals with default parameters
    console.log("📊 Getting hourly trading signals...");
    const result = await worker.functions
      .find(f => f.name === "get_hourly_trading_signals")
      ?.executable(
        { 
          limit: "10", 
          page: "1" 
        },
        console.log
      );

    if (result?.status === 'done') {
      console.log("\n✅ Hourly trading signals retrieved successfully!");
    } else {
      console.log("\n❌ Failed to get hourly trading signals:", result?.feedback);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error); 