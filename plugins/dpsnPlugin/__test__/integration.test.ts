import DpsnPlugin from '../src/dpsnPlugin';
import mockDpsnClient from './mocks/dpsnClient.mock';
import { GameAgent } from '@virtuals-protocol/game';

// Mock the GameAgent
jest.mock('@virtuals-protocol/game', () => {
  const original = jest.requireActual('@virtuals-protocol/game');
  return {
    ...original,
    GameAgent: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockResolvedValue(undefined),
      step: jest.fn().mockResolvedValue(undefined),
      setLogger: jest.fn(),
      name: 'Mock Agent'
    }))
  };
});

// Mock the DPSN client module
jest.mock('dpsn-client', () => {
  return jest.fn().mockImplementation(() => {
    return mockDpsnClient;
  });
});

describe('DPSN Plugin Integration', () => {
  // Test topic
  const TEST_TOPIC = '0xe14768a6d8798e4390ec4cb8a4c991202c2115a5cd7a6c0a7ababcaf93b4d2d4/BTCUSDT/ticker';
  
  // Sample credentials
  const sampleCredentials = {
    privateKey: 'mock-private-key',
    dpsnUrl: 'mock-dpsn-url',
    chainOptions: {
      network: 'testnet',
      wallet_chain_type: 'ethereum',
      rpcUrl: 'https://ethereum-goerli.publicnode.com'
    }
  };

  // Plugin instance
  let dpsnPlugin: DpsnPlugin;
  // Agent instance
  let agent: GameAgent;
  // Message store
  const messageStore: Record<string, any> = {};

  beforeEach(async () => {
    // Reset all mocks
    mockDpsnClient.resetMocks();
    Object.keys(messageStore).forEach(key => delete messageStore[key]);
    
    // Create a new plugin instance
    dpsnPlugin = new DpsnPlugin({
    credentials:{
        privateKey:'mock-private-key',
        dpsnUrl:'mock-dpsn-url',
        chainOptions:{
          network:'testnet',
          wallet_chain_type:'ethreum'
        }
      }
    });

    // Initialize the plugin
    await dpsnPlugin.initialize();
    
    // Create a message handler
    const processMessage = (data: {topic: string, message: any}) => {
      messageStore[data.topic] = data.message;
    };
    
    // Register the message handler
    await dpsnPlugin.onMessage(processMessage);
    
    // Create the agent
    agent = new GameAgent('mock-api-key', {
      name: 'DPSN Test Agent',
      goal: 'Test DPSN integration',
      description: 'Agent for testing DPSN plugin integration',
      workers: [
        dpsnPlugin.getWorker({
          functions: [
            dpsnPlugin.subscribeToTopicFunction
          ],
          getEnvironment: async () => ({
            network: 'testnet',
            availableTopics: [TEST_TOPIC],
            latestMessages: messageStore
          })
        })
      ]
    });
    
    // Set up logger
    agent.setLogger((agent, message) => {
      console.log(`[${agent.name}] ${message}`);
    });
    
    // Initialize the agent
    await agent.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Agent Integration', () => {
    it('should initialize the agent with the DPSN plugin worker', () => {
      expect(agent.init).toHaveBeenCalled();
    });
    
    it('should allow the agent to step and access the environment', async () => {
      await agent.step();
      expect(agent.step).toHaveBeenCalled();
    });
    
    it('should update the message store when a message is received', async () => {
      // Simulate receiving a message
      const testMessage = { price: '50000.00', symbol: 'BTCUSDT' };
      
      // Directly emit the message event on the plugin
      dpsnPlugin.emit('message', { topic: TEST_TOPIC, message: testMessage });
      
      // Verify the message was stored
      expect(messageStore[TEST_TOPIC]).toEqual(testMessage);
      
      // Step the agent to ensure it has access to the updated message
      await agent.step();
      
      // The agent should have been able to access the message through its environment
      expect(agent.step).toHaveBeenCalled();
    });
  });
  
  describe('Cleanup', () => {
    it('should disconnect the DPSN client when done', async () => {
      await dpsnPlugin.disconnect();
      expect(mockDpsnClient.disconnect).toHaveBeenCalled();
    });
  });
});
