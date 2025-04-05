// Mock for DpsnClient
const mockDpsnClient = {
  init: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockImplementation((topic, handler) => {
    // Store the handler for later use in tests
    mockDpsnClient.subscriptionHandlers[topic] = handler;
    return Promise.resolve();
  }),
  unsubscribe: jest.fn().mockImplementation((topic) => {
    // Remove the handler for the topic
    delete mockDpsnClient.subscriptionHandlers[topic];
    return Promise.resolve();
  }),
  disconnect: jest.fn().mockResolvedValue(undefined),
  setBlockchainConfig: jest.fn(),

  // Helper properties for testing
  subscriptionHandlers: {} as Record<
    string,
    (topic: string, message: any) => void
  >,

  // Helper method to simulate receiving a message
  simulateMessage: (topic: string, message: any) => {
    const handler = mockDpsnClient.subscriptionHandlers[topic];
    if (handler) {
      // Call the handler with topic and message as separate parameters
      // The handler will emit an event with the combined object
      handler(topic, message);
    }
  },

  resetMocks: () => {
    mockDpsnClient.init.mockClear();
    mockDpsnClient.subscribe.mockClear();
    mockDpsnClient.unsubscribe.mockClear();
    mockDpsnClient.disconnect.mockClear();
    mockDpsnClient.subscriptionHandlers = {};
  },
};

export default mockDpsnClient;
