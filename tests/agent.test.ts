import { describe, expect, it, jest } from '@jest/globals';
import GameAgent from '../src/agent';
import GameWorker from '../src/worker';
import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from '../src/function';
import { ActionType } from '../src/api';
import { AgentNotInitializedError, WorkerNotFoundError } from '../src/errors';

describe('GameAgent', () => {
  const mockApiKey = 'test-api-key';
  const mockWorker = new GameWorker({
    id: 'worker1',
    name: 'Test Worker',
    description: 'Test worker description',
    functions: []
  });

  const mockAgentConfig = {
    name: 'Test Agent',
    goal: 'Test Goal',
    description: 'Test Description',
    workers: [mockWorker]
  };

  it('should create agent instance correctly', () => {
    const agent = new GameAgent(mockApiKey, mockAgentConfig);
    expect(agent).toBeInstanceOf(GameAgent);
  });

  it('should throw error when not initialized', async () => {
    const agent = new GameAgent(mockApiKey, mockAgentConfig);
    await expect(agent.step()).rejects.toThrow(AgentNotInitializedError);
  });

  it('should throw error for invalid worker', () => {
    const agent = new GameAgent(mockApiKey, mockAgentConfig);
    // @ts-ignore - Accessing private method for testing
    expect(() => agent.getWorkerById('invalid-id')).toThrow(WorkerNotFoundError);
  });

  it('should handle initialization correctly', async () => {
    const agent = new GameAgent(mockApiKey, mockAgentConfig);
    const mockMap = { id: 'map1' };
    const mockAgentResponse = { id: 'agent1' };

    // Mock the GameClient methods
    agent['gameClient'].createMap = jest.fn().mockResolvedValue(mockMap);
    agent['gameClient'].createAgent = jest.fn().mockResolvedValue(mockAgentResponse);

    await agent.init();

    expect(agent['state'].mapId).toBe(mockMap.id);
    expect(agent['state'].agentId).toBe(mockAgentResponse.id);
  });

  it('should handle cleanup correctly', async () => {
    const agent = new GameAgent(mockApiKey, mockAgentConfig);
    await agent.cleanup();

    expect(agent['state'].agentId).toBeNull();
    expect(agent['state'].mapId).toBeNull();
    expect(agent['state'].currentWorkerId).toBe(mockWorker.id);
    expect(agent['state'].lastActionResult).toBeNull();
  });
});
