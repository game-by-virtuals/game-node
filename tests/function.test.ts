import { describe, expect, it, jest } from '@jest/globals';
import GameFunction, {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunctionArg
} from '../src/function';

describe('GameFunction', () => {
  const mockArgs: GameFunctionArg[] = [
    {
      name: 'arg1',
      description: 'Test argument 1',
      optional: false
    }
  ];

  const mockExecutable = async (args: any, logger: any) => {
    return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, 'Success');
  };

  const createMockFunction = () => {
    return new GameFunction({
      name: 'testFunction',
      description: 'Test function description',
      args: mockArgs,
      executable: mockExecutable
    });
  };

  it('should create function instance correctly', () => {
    const fn = createMockFunction();
    expect(fn).toBeInstanceOf(GameFunction);
  });

  it('should validate configuration on creation', () => {
    expect(() => {
      new GameFunction({
        name: '',
        description: 'Test',
        args: mockArgs,
        executable: mockExecutable
      });
    }).toThrow('Function name is required');
  });

  it('should validate required arguments', async () => {
    const fn = createMockFunction();
    const mockLogger = jest.fn();

    await expect(
      fn.execute({}, mockLogger)
    ).rejects.toThrow('Required argument arg1 is missing');
  });

  it('should execute successfully with valid arguments', async () => {
    const fn = createMockFunction();
    const mockLogger = jest.fn();

    const result = await fn.execute(
      { arg1: { value: 'test' } },
      mockLogger
    );

    expect(result).toBeInstanceOf(ExecutableGameFunctionResponse);
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
  });

  it('should handle execution errors gracefully', async () => {
    const errorFn = new GameFunction({
      name: 'errorFunction',
      description: 'Test error function',
      args: mockArgs,
      executable: async () => {
        throw new Error('Test error');
      }
    });

    const mockLogger = jest.fn();
    const result = await errorFn.execute(
      { arg1: { value: 'test' } },
      mockLogger
    );

    expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
    expect(result.feedback).toContain('Test error');
    expect(mockLogger).toHaveBeenCalled();
  });
});
