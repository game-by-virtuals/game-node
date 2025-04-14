export enum ExecutableGameFunctionStatus {
  Done = 'done',
  Failed = 'failed',
  InProgress = 'in_progress'
}

export interface ExecutableGameFunctionResponseJSON {
  action_id: string;
  action_status: ExecutableGameFunctionStatus;
  feedback_message: string;
}

export class ExecutableGameFunctionResponse {
  constructor(
    public status: ExecutableGameFunctionStatus,
    public feedback: string
  ) {}

  toJSON(id: string): ExecutableGameFunctionResponseJSON {
    return {
      action_id: id,
      action_status: this.status,
      feedback_message: this.feedback,
    };
  }
}

export interface GameFunctionArg {
  name: string;
  description: string;
  type?: string;
  optional?: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
}

export interface IGameFunction<T extends GameFunctionArg[]> {
  name: string;
  description: string;
  args: T;
  executable: (
    args: Partial<ExecutableArgs<T>>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  hint?: string;
}

export type ExecutableArgs<T extends GameFunctionArg[]> = {
  [K in T[number]['name']]: string;
};

class GameFunction<T extends GameFunctionArg[]> implements IGameFunction<T> {
  public readonly name: string;
  public readonly description: string;
  public readonly args: T;
  public readonly executable: (
    args: Partial<ExecutableArgs<T>>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  public readonly hint?: string;

  constructor(options: IGameFunction<T>) {
    this.name = options.name;
    this.description = options.description;
    this.args = options.args;
    this.executable = options.executable;
    this.hint = options.hint;

    // Validate the function configuration
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Function name is required');
    }

    if (!this.description || this.description.trim() === '') {
      throw new Error('Function description is required');
    }

    if (!Array.isArray(this.args)) {
      throw new Error('Function args must be an array');
    }

    this.args.forEach((arg, index) => {
      if (!arg.name || arg.name.trim() === '') {
        throw new Error(`Argument at index ${index} must have a name`);
      }

      if (!arg.description || arg.description.trim() === '') {
        throw new Error(`Argument ${arg.name} must have a description`);
      }
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      fn_name: this.name,
      fn_description: this.description,
      args: this.args,
      hint: this.hint,
    };
  }

  private validateArgs(args: Record<string, { value: string }>): void {
    this.args.forEach((arg) => {
      const value = args[arg.name]?.value;

      if (!arg.optional && (value === undefined || value === null || value === '')) {
        throw new Error(`Required argument ${arg.name} is missing`);
      }

      if (value && arg.validator && !arg.validator(value)) {
        throw new Error(`Invalid value for argument ${arg.name}`);
      }
    });
  }

  async execute(
    args: Record<string, { value: string }>,
    logger: (msg: string) => void
  ): Promise<ExecutableGameFunctionResponse> {
    // Validate input arguments
    this.validateArgs(args);

    // Convert args to expected format
    const argValues = Object.keys(args).reduce(
      (acc, key) => {
        acc[key as keyof ExecutableArgs<T>] = args[key]?.value;
        return acc;
      },
      {} as ExecutableArgs<T>
    );

    try {
      return await this.executable(argValues, logger);
    } catch (error) {
      logger(`Error executing function ${this.name}: ${error.message}`);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Function execution failed: ${error.message}`
      );
    }
  }
}

export default GameFunction;
