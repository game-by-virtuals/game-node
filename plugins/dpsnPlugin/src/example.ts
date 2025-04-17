import { GameAgent } from '@virtuals-protocol/game';
import DpsnPlugin from './dpsnPlugin';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define the topic you want to subscribe to
const TOPIC =
  '0xe14768a6d8798e4390ec4cb8a4c991202c2115a5cd7a6c0a7ababcaf93b4d2d4/BTCUSDT/ticker';

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

const agent = new GameAgent(process.env.VIRTUALS_API_KEY || '', {
  name: 'DPSN Bot',
  goal: 'A bot that consumes realtime data from dpsn',
  description: 'A bot that consumes realtime data from dpsn',
  workers: [
    dpsnPlugin.getWorker({
      functions: [
        dpsnPlugin.subscribeToTopicFunction,
        dpsnPlugin.unsubscribeToTopicFunction,
      ],
    }),
  ],
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`---------[${agent.name}]--------`);
    console.log(message);
    console.log('\n');
  });

  await agent.init();
  const agentDpsnWorker = agent.getWorkerById(agent.workers[0].id);

  dpsnPlugin.onMessage(({ topic, message }) => {
    console.log('Topic: ', topic);
    console.log('Message', message);
  });

  try {
    await agentDpsnWorker.runTask(`subscribe to topic ${TOPIC}`, {
      verbose: true,
    });
    await agentDpsnWorker.runTask(`unsubscribe to topic ${TOPIC}`, {
      verbose: true,
    });
    await agentDpsnWorker.runTask(`disconnect`, { verbose: true });

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('Disconnecting from DPSN...');
      await dpsnPlugin.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    await dpsnPlugin.disconnect();
    process.exit(1);
  }
})();
