import DpsnPlugin from '../src/dpsnPlugin';
import mockDpsnClient from './mocks/dpsnClient.mock';
import { ExecutableGameFunctionStatus } from '@virtuals-protocol/game';

// Mock the DPSN client module
jest.mock('dpsn-client', () => {
  return jest.fn().mockImplementation(() => {
    return mockDpsnClient;
  });
});

describe('DpsnPlugin', () => {
  // Test topic
  const TEST_TOPIC =
    '0xe14768a6d8798e4390ec4cb8a4c991202c2115a5cd7a6c0a7ababcaf93b4d2d4/BTCUSDT/ticker';

  // Plugin instance
  let dpsnPlugin: DpsnPlugin;

  beforeEach(() => {
    // Reset all mocks
    mockDpsnClient.resetMocks();

    // Create a new plugin instance
    dpsnPlugin = new DpsnPlugin({
      credentials: {
        privateKey: process.env.EVM_WALLET_PRIVATE_KEY || '',
        dpsnUrl: process.env.DPSN_URL || '',
        chainOptions: {
          network: 'testnet' as any, // Use type assertion to satisfy NetworkType requirement
          wallet_chain_type: 'ethereum',
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default values when minimal options are provided', () => {
      const plugin = new DpsnPlugin({
        credentials: {
          privateKey: process.env.EVM_WALLET_PRIVATE_KEY || '',
          dpsnUrl: process.env.DPSN_URL || '',
          chainOptions: {
            network: 'testnet',
            wallet_chain_type: 'ethereum',
            rpcUrl: 'test-rpc',
          },
        },
      });

      expect(plugin).toBeDefined();
      // @ts-ignore - Accessing private property for testing
      expect(plugin.id).toBe('dpsn_worker');
      // @ts-ignore - Accessing private property for testing
      expect(plugin.name).toBe('DPSN Worker');
    });

    it('should use provided id, name, and description', () => {
      const plugin = new DpsnPlugin({
        id: 'custom-id',
        name: 'Custom Name',
        description: 'Custom Description',
        credentials: {
          privateKey: process.env.EVM_WALLET_PRIVATE_KEY || '',
          dpsnUrl: process.env.DPSN_URL || '',
          chainOptions: {
            network: 'testnet',
            wallet_chain_type: 'ethreum',
          },
        },
      });

      // @ts-ignore - Accessing private property for testing
      expect(plugin.id).toBe('custom-id');
      // @ts-ignore - Accessing private property for testing
      expect(plugin.name).toBe('Custom Name');
      // @ts-ignore - Accessing private property for testing
      expect(plugin.description).toBe('Custom Description');
    });
  });

  describe('initialize', () => {
    it('should initialize the DPSN client', async () => {
      await dpsnPlugin.initialize();
      expect(mockDpsnClient.init).toHaveBeenCalledTimes(1);
      // @ts-ignore - Accessing private property for testing
      expect(dpsnPlugin.initialized).toBe(true);
    });

    it('should not initialize twice', async () => {
      await dpsnPlugin.initialize();
      await dpsnPlugin.initialize();
      expect(mockDpsnClient.init).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      mockDpsnClient.init.mockRejectedValueOnce(new Error('Init error'));
      await expect(dpsnPlugin.initialize()).rejects.toThrow('Init error');
      // @ts-ignore - Accessing private property for testing
      expect(dpsnPlugin.initialized).toBe(false);
    });
  });

  describe('onMessage', () => {
    it('should subscribe to a topic with a handler', async () => {
      const handler = jest.fn();
      await dpsnPlugin.initialize();
      await dpsnPlugin.onMessage(handler);

      // Verify that the plugin is listening for the 'message' event
      expect(dpsnPlugin.listenerCount('message')).toBe(1);
    });

    it('should initialize if not already initialized', async () => {
      const handler = jest.fn();
      await dpsnPlugin.onMessage(handler);

      expect(mockDpsnClient.init).toHaveBeenCalledTimes(1);
      // Verify that the plugin is listening for the 'message' event
      expect(dpsnPlugin.listenerCount('message')).toBe(1);
    });

    it('should call the handler when a message is received', async () => {
      const handler = jest.fn();
      await dpsnPlugin.onMessage(handler);

      // Simulate receiving a message directly through the EventEmitter
      const testMessage = { price: '50000.00', symbol: 'BTCUSDT' };

      // Directly emit the message event on the plugin
      dpsnPlugin.emit('message', { topic: TEST_TOPIC, message: testMessage });

      // The handler should be called with the message object containing topic and message
      expect(handler).toHaveBeenCalledWith({
        topic: TEST_TOPIC,
        message: testMessage,
      });
    });
  });

  describe('disconnect', () => {
    it('should disconnect the DPSN client if initialized', async () => {
      await dpsnPlugin.initialize();
      await dpsnPlugin.disconnect();

      expect(mockDpsnClient.disconnect).toHaveBeenCalledTimes(1);
      // @ts-ignore - Accessing private property for testing
      expect(dpsnPlugin.initialized).toBe(false);
    });

    it('should not attempt to disconnect if not initialized', async () => {
      await dpsnPlugin.disconnect();
      expect(mockDpsnClient.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('getWorker', () => {
    it('should return a GameWorker instance', () => {
      const worker = dpsnPlugin.getWorker();
      expect(worker).toBeDefined();
      expect(worker.id).toBe('dpsn_worker');
      expect(worker.name).toBe('DPSN Worker');
    });

    it('should use custom id, functions, and environment if provided', async () => {
      const customEnv = async () => ({ customKey: 'customValue' });
      const worker = dpsnPlugin.getWorker({
        id: 'dpsn_worker',
        functions: [],
        getEnvironment: customEnv,
      });

      expect(worker.id).toBe('dpsn_worker');
      expect(await worker.getEnvironment!()).toEqual({
        customKey: 'customValue',
      });
    });
  });

  describe('subscribeToTopicFunction', () => {
    it('should have the correct name and description', () => {
      const func = dpsnPlugin.subscribeToTopicFunction;
      expect(func.name).toBe('subscribe_to_topic');
      expect(func.description).toContain('Subscribe to a DPSN topic');
    });

    it('should fail if topic is not provided', async () => {
      const func = dpsnPlugin.subscribeToTopicFunction;
      const logger = jest.fn();

      const result = await func.executable({}, logger);

      expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
      expect(result.feedback).toContain('Topic is required');
    });

    it('should subscribe and resolve when a message is received', async () => {
      await dpsnPlugin.initialize();
      const func = dpsnPlugin.subscribeToTopicFunction;
      const logger = jest.fn();

      const handler = jest.fn();
      await dpsnPlugin.onMessage(handler);

      // Mock the subscribe method properly
      mockDpsnClient.subscribe.mockImplementation((topic, callback) => {
        // Simulate async message receipt
        setTimeout(() => {
          callback(topic, { price: '50000.00', symbol: 'BTCUSDT' });
        }, 0);
        return Promise.resolve();
      });

      const result = await func.executable({ topic: TEST_TOPIC }, logger);

      const testMessage = { price: '50000.00', symbol: 'BTCUSDT' };

      // Verify the result - now expecting a stringified JSON
      expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
      expect(result.feedback).toEqual(JSON.stringify(testMessage));

      // Verify that the handler was called with the correct data
      expect(handler).toHaveBeenCalledWith({
        topic: TEST_TOPIC,
        message: testMessage,
      });
    });

    it('should handle subscription errors', async () => {
      await dpsnPlugin.initialize();
      mockDpsnClient.subscribe.mockRejectedValueOnce(
        new Error('Subscription error')
      );

      const func = dpsnPlugin.subscribeToTopicFunction;
      const logger = jest.fn();

      const result = await func.executable({ topic: TEST_TOPIC }, logger);

      expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
      expect(result.feedback).toContain(
        'Failed to subscribe to topic: Subscription error'
      );
    });
  });

  describe('unsubscribeToTopicFunction', () => {
    it('should have the correct name and description', () => {
      const func = dpsnPlugin.unsubscribeToTopicFunction;
      expect(func.name).toBe('unsubscribe_to_topic');
      expect(func.description).toContain('unsubscribe to a DPSN topic');
    });

    it('should fail if topic is not provided', async () => {
      const func = dpsnPlugin.unsubscribeToTopicFunction;
      const logger = jest.fn();

      const result = await func.executable({}, logger);

      expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
      expect(result.feedback).toContain('Topic is required');
    });

    it('should unsubscribe successfully', async () => {
      await dpsnPlugin.initialize();
      const func = dpsnPlugin.unsubscribeToTopicFunction;
      const logger = jest.fn();

      // Mock the unsubscribe method to resolve successfully
      mockDpsnClient.unsubscribe = jest.fn().mockResolvedValue(undefined);

      const result = await func.executable({ topic: TEST_TOPIC }, logger);

      // Verify the unsubscribe was called with the correct topic
      expect(mockDpsnClient.unsubscribe).toHaveBeenCalledWith(TEST_TOPIC);

      // Verify the result contains a success message
      expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
      expect(result.feedback).toBe(
        `Successfully unsubscribed from topic: ${TEST_TOPIC}`
      );

      // Verify logger was called with the correct messages
      expect(logger).toHaveBeenCalledWith(
        `Unsubscribing from DPSN topic: ${TEST_TOPIC}`
      );
    });

    it('should handle unsubscription errors', async () => {
      await dpsnPlugin.initialize();

      // Mock the unsubscribe method to reject with an error
      mockDpsnClient.unsubscribe = jest
        .fn()
        .mockRejectedValue(new Error('Unsubscription error'));

      const func = dpsnPlugin.unsubscribeToTopicFunction;
      const logger = jest.fn();

      const result = await func.executable({ topic: TEST_TOPIC }, logger);

      expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
      expect(result.feedback).toContain(
        'Failed to unsubscribe from topic: Unsubscription error'
      );
    });
  });
});
