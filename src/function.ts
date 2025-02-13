export enum ExecutableGameFunctionStatus {
  Done = "done",
  Failed = "failed",
}

export type ExecutableGameFunctionResponseJSON = ReturnType<
  ExecutableGameFunctionResponse["toJSON"]
>;

export class ExecutableGameFunctionResponse {
  constructor(
    public status: ExecutableGameFunctionStatus,
    public feedback: string,
    public data?: any
  ) {}

  toJSON(id: string) {
    return {
      action_id: id,
      action_status: this.status,
      feedback_message: this.feedback,
      data: this.data,
    };
  }
}

interface IGameFunction<T extends GameFunctionArg[]> {
  name: string;
  description: string;
  args: T;
  executable: (
    args: Partial<ExecutableArgs<T>>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  hint?: string;
}

export interface GameFunctionArg {
  name: string;
  description: string;
  type?: string;
  optional?: boolean;
}

export type GameFunctionBase = {
  name: string;
  description: string;
  args: GameFunctionArg[];
  executable: (
    args: Record<string, string>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  hint?: string;
  execute: (
    args: Record<string, { value: string }>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  toJSON(): Object;
};

type ExecutableArgs<T extends GameFunctionArg[]> = {
  [K in T[number]["name"]]: string;
};

class GameFunction<T extends GameFunctionArg[]> implements IGameFunction<T> {
  public name: string;
  public description: string;
  public args: T;
  public executable: (
    args: Partial<ExecutableArgs<T>>,
    logger: (msg: string) => void
  ) => Promise<ExecutableGameFunctionResponse>;
  public hint?: string;

  constructor(options: IGameFunction<T>) {
    this.name = options.name;
    this.description = options.description;
    this.args = options.args;
    this.executable = options.executable;
    this.hint = options.hint;
  }

  toJSON() {
    return {
      fn_name: this.name,
      fn_description: this.description,
      args: this.args,
      hint: this.hint,
    };
  }

  async execute(
    args: {
      [key in GameFunctionArg["name"]]: { value: string };
    },
    logger: (msg: string) => void
  ) {
    const argValues: ExecutableArgs<T> = Object.keys(args).reduce(
      (acc, key) => {
        acc[key as keyof ExecutableArgs<T>] = args[key]?.value;
        return acc;
      },
      {} as ExecutableArgs<T>
    );

    return await this.executable(argValues, logger);
  }
}

export default GameFunction;
