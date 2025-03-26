// Mock for GameAgent and related classes
import { GameWorker, GameFunction } from '@virtuals-protocol/game';

// Mock for GameAgent
export const mockGameAgent = {
  init: jest.fn().mockResolvedValue(undefined),
  step: jest.fn().mockResolvedValue(undefined),
  setLogger: jest.fn(),
  name: 'Mock Agent',
};

// Helper to create a mock GameWorker
export const createMockGameWorker = (id: string, functions: GameFunction<any>[]) => {
  const mockWorker = new GameWorker({
    id,
    name: `Mock Worker ${id}`,
    description: 'Mock worker for testing',
    functions,
  });
  
  // Spy on methods
  jest.spyOn(mockWorker, 'getEnvironment');
  
  return mockWorker;
};

// Reset all mocks
export const resetGameAgentMocks = () => {
  mockGameAgent.init.mockClear();
  mockGameAgent.step.mockClear();
  mockGameAgent.setLogger.mockClear();
};
