# State of Mika Plugin for Virtuals Game

State of Mika is a natural language routing service that processes queries and directs them to appropriate tools. This plugin provides seamless integration with the State of Mika API in your Virtuals Game environment.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-state-mika-plugin
```

or

```bash
yarn add @virtuals-protocol/game-state-mika-plugin
```

## Configuration

First, you'll need to get an API key from [gmika.ai](https://gmika.ai). Then, you can either:

1. Set it in your environment variables:
```bash
STATE_OF_MIKA_API_KEY=your_api_key_here
```

2. Or pass it directly when creating the plugin (not recommended for production):
```typescript
const stateMikaPlugin = new StateMikaPlugin({
    credentials: {
        apiKey: process.env.STATE_OF_MIKA_API_KEY
    }
});
```

## Usage

### Creating a Worker

Create a worker with the State of Mika plugin:

```typescript
import StateMikaPlugin from "@virtuals-protocol/game-state-mika-plugin";

const stateMikaPlugin = new StateMikaPlugin({
    credentials: {
        apiKey: process.env.STATE_OF_MIKA_API_KEY
    },
    id: "custom_worker_id",  // optional
    name: "Custom Worker Name",  // optional
    description: "Custom worker description"  // optional
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("<GAME_API_TOKEN>", {
    name: "State of Mika Agent",
    goal: "Process natural language queries using State of Mika",
    description: "An agent that uses State of Mika's universal router to process queries.",
    workers: [stateMikaPlugin.getWorker()],
});
```

### Example Usage

```typescript
// Initialize and run the agent
(async () => {
    await agent.init();
    await agent.run(30, { verbose: true }); // Runs with 30-second heartbeat
})();

// Or for single steps:
await agent.step({ verbose: true });
```

## Error Handling

The plugin includes robust error handling with automatic retries:

```typescript
try {
    const response = await worker.functions[0].execute({
        query: { value: "What is BTC price?" }
    }, console.log);
} catch (error) {
    // Structured error messages with status codes
    // e.g., "Bad Request: Invalid query (400)"
    // or "Server Error: Failed to process query (500)"
    console.error(error.feedback);
}
```

### Error Types
- 400 Bad Request: Invalid query format or parameters
- 401 Unauthorized: Invalid API key
- 500 Server Error: Internal processing errors

### Retry Logic
- Maximum 3 retry attempts
- Exponential backoff (2^attempt * 1000ms)
- Detailed logging of retry attempts when logger is provided

## Query Examples

The State of Mika router supports natural language queries:

### News Queries
```typescript
// Get latest crypto news
"What are the top crypto headlines today?"
"Show me recent news about Bitcoin"
"What's the latest news about ETH ETFs?"

// News about specific projects
"Latest Cardano news"
"Show me news about Binance"
```

### Market Data Queries
```typescript
// Basic price queries
"What's the price of Bitcoin?"
"Show me ETH price"
"Get DOGE price"

// Market information
"What's happening with crypto markets today?"
"Show me trending cryptocurrencies"
```

## API Response Format

The API returns structured data:

```typescript
{
  "original_query": "Latest crypto news",
  "route": {
    "tool": "news",
    "confidence": 0.9,
    "parameters": {
      "kind": "news",
      "regions": "en",
      "filter": "important",
      "currencies": "",
      "public": "true"
    }
  },
  "response": {
    // Tool-specific response data
  }
}
```

## Available Functions

### query
Processes natural language queries through State of Mika's routing system.

Parameters:
- `query` (required): The natural language query to process
- `instructions` (optional): Post-processing instructions for the response

Example:
```typescript
const response = await worker.functions[0].execute({
    query: { value: "What is the current price of Bitcoin?" },
    instructions: { value: "Only return the price in USD" }
}, console.log);
```

## Development

### Running Tests
```bash
npm test
```

The test suite includes:
- Unit tests for core functionality
- Integration tests with live API
- Error handling test cases
- High test coverage (89.28% branch coverage, remainder being testing for ultra edge cases)

## License

This project is licensed under the MIT License.