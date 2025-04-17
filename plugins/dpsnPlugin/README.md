# 🌐 DPSN Plugin for Virtuals Protocol

> Decentralized Publish-Subscribe Network (DPSN) plugin for Virtuals Protocol agents

[![Virtuals Protocol](https://img.shields.io/badge/Virtuals%20Protocol-plugin-blue)](https://virtuals.io/)
[![Version](https://img.shields.io/badge/version-1.0.0--beta.1-brightgreen)](https://github.com/virtuals-protocol)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Overview


This plugin enables Virtuals Protocol agents to connect to, subscribe to, and interact with data streams available on the [DPSN Data Streams Store](https://streams.dpsn.org/).

Agents can leverage this plugin to consume real-time data for decision-making, reacting to events, or integrating external information feeds.

To provide personalized data streams for your agents, you can create and publish data into your own DPSN topics using the [dpsn-client for game-node](https://github.com/DPSN-org/virtuals-game-node/tree/feature/dpsn-plugin).

For more information, visit:
-   [DPSN Official Website](https://dpsn.org)

## ✨ Features

- **Seamless Integration**: Connect your Virtuals Protocol agents to DPSN's decentralized pub/sub network
- **Real-time Data Processing**: Subscribe to and process real-time data streams in your agents
- **Topic Management**: Subscribe and unsubscribe to DPSN topics programmatically
- **Event-based Architecture**: Use event emitters to handle incoming messages efficiently

## 🚀 Installation

```bash
# From within your Virtuals Protocol project
npm install @virtuals-protocol/plugin-dpsn
```

## ⚙️ Configuration

Add the following environment variables to your `.env` file:
>**Note**: The EVM private key is used only for signing authentication messages, this process do not execute any kind of onchain transaction nor incurs any txn fees.

- **Setup env**:
```bash
  cd /plugins/dpsnPlugin/
  cp .env.example .env
```

```
EVM_WALLET_PRIVATE_KEY=your_evm_wallet_private_key_here
DPSN_URL=betanet.dpsn.org
VIRTUALS_API_KEY=your_virtuals_api_key_here
```

## 📚 Usage

### Basic Setup

```typescript
import DpsnPlugin from '@virtuals-protocol/plugin-dpsn';
import { GameAgent } from '@virtuals-protocol/game';

// Initialize the DPSN Plugin
const dpsnPlugin = new DpsnPlugin({
  credentials: {
    privateKey: process.env.EVM_WALLET_PRIVATE_KEY || '<YOUR_PRIVATE_KEY>',
    dpsnUrl: process.env.DPSN_URL || '<YOUR_DPSN_URL>',
    chainOptions: {
      network: 'testnet',
      wallet_chain_type: 'ethereum',
    },
  },
});

// Create a Virtuals Protocol agent with the DPSN plugin
const agent = new GameAgent(process.env.VIRTUALS_API_KEY || '', {
  name: 'DPSN Bot',
  goal: 'A bot that consumes realtime data from DPSN',
  description: 'A bot that processes real-time data streams from DPSN',
  workers: [
    dpsnPlugin.getWorker(),
  ],
});

// Initialize the agent
await agent.init();
```

### Subscribing to a Topic

```typescript
// Define the topic you want to subscribe to
const TOPIC = '0xe14768a6d8798e4390ec4cb8a4c991202c2115a5cd7a6c0a7ababcaf93b4d2d4/BTCUSDT/ticker';

// Get the DPSN worker from the agent
const dpsnWorker = agent.getWorkerById(agent.workers[0].id);

// Register a message handler for incoming DPSN messages
dpsnPlugin.onMessage(({ topic, message }) => {
  console.log('Topic:', topic);
  console.log('Message:', message);
  // Process your message here
});

// Subscribe to a DPSN topic
await dpsnWorker.runTask(`subscribe to topic ${TOPIC}`, {
  verbose: true,
});
```

### Unsubscribing and Cleanup

```typescript
// Unsubscribe from a topic
await dpsnWorker.runTask(`unsubscribe to topic ${TOPIC}`, {
  verbose: true,
});

// Disconnect from DPSN when done
await dpsnPlugin.disconnect();
```

## 📖 API Reference

### DpsnPlugin

The main plugin class that provides DPSN functionality.

#### Constructor

```typescript
constructor(options: IDpsnPluginOptions)
```

Options:
- `id` (optional): The worker ID
- `name` (optional): The worker name
- `description` (optional): The worker description
- `credentials`: Required connection credentials
  - `privateKey`: Your DPSN private key
  - `dpsnUrl`: The DPSN server URL
  - `chainOptions`: Blockchain configuration
  - `connectionOptions` (optional): Additional connection options
  - `initOptions` (optional): Additional initialization options
  - `contractAddress` (optional): DPSN contract address

#### Methods

- `async initialize(): Promise<void>` - Initialize the DPSN client
- `async onMessage(handler: (data: { topic: string; message: any }) => void): Promise<void>` - Register a message handler
- `offMessage(handler: (data: { topic: string; message: any }) => void): void` - Remove a message handler
- `getWorker(data?: {...}): GameWorker` - Get the GameWorker instance with DPSN functions
- `async disconnect(): Promise<void>` - Disconnect from DPSN and cleanup resources

### Game Functions

The plugin provides these built-in functions for use in Virtuals Protocol agents:

- `subscribe_to_topic` - Subscribe to a DPSN topic to receive messages
- `unsubscribe_to_topic` - Unsubscribe from a DPSN topic to stop receiving messages

## 📢 Publishing Data using DPSN

To learn about creating topics, managing ownership, and publishing data to DPSN:

[**→ Visit the DPSN Publishing Guide**](https://github.com/DPSN-org/dpsn-client-nodejs?tab=readme-ov-file#understanding-dpsn-topics)

## 🔗 Related Projects

- [Virtuals Protocol](https://github.com/virtuals-protocol) - The main Virtuals Protocol framework
- [DPSN Client](https://www.npmjs.com/package/dpsn-client) - The underlying client library for DPSN

## 📝 Example

Check out a complete example of using the DPSN Plugin with Virtuals Protocol:

```typescript
import { GameAgent } from '@virtuals-protocol/game';
import DpsnPlugin from '@virtuals-protocol/plugin-dpsn';
import dotenv from 'dotenv';

dotenv.config();

// Define the topic you want to subscribe to
const TOPIC = '0xe14768a6d8798e4390ec4cb8a4c991202c2115a5cd7a6c0a7ababcaf93b4d2d4/BTCUSDT/ticker';

// Initialize the DPSN plugin
const dpsnPlugin = new DpsnPlugin({
  credentials: {
    privateKey: process.env.EVM_WALLET_PRIVATE_KEY || '<YOUR_PRIVATE_KEY>',
    dpsnUrl: process.env.DPSN_URL || '<YOUR_DPSN_URL>',
    chainOptions: {
      network: 'testnet',
      wallet_chain_type: 'ethereum',
    },
  },
});

// Create a Virtuals Protocol agent
const agent = new GameAgent(process.env.VIRTUALS_API_KEY || '', {
  name: 'DPSN Bot',
  goal: 'A bot that consumes realtime data from DPSN',
  description: 'A bot that consumes realtime data from DPSN',
  workers: [
    dpsnPlugin.getWorker(),
  ],
});

(async () => {
  // Set up logging
  agent.setLogger((agent, message) => {
    console.log(`---------[${agent.name}]--------`);
    console.log(message);
    console.log('\n');
  });

  // Initialize the agent
  await agent.init();
  const dpsnWorker = agent.getWorkerById(agent.workers[0].id);

  // Register a message handler
  dpsnPlugin.onMessage(({ topic, message }) => {
    console.log('Topic:', topic);
    console.log('Message:', message);
  });

  try {
    // Subscribe to a topic
    await dpsnWorker.runTask(`subscribe to topic ${TOPIC}`, {
      verbose: true,
    });

    // Handle cleanup on SIGINT
    process.on('SIGINT', async () => {
      console.log('Unsubscribing and disconnecting from DPSN...');
      await dpsnWorker.runTask(`unsubscribe to topic ${TOPIC}`, {
        verbose: true,
      });
      await dpsnPlugin.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    await dpsnPlugin.disconnect();
    process.exit(1);
  }
})();
```

> In case of any queries, please reach out to the DPSN team on [Telegram](https://t.me/dpsn_dev) 📥.


