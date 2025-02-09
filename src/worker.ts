import {
  ExecutableGameFunctionResponseJSON,
  GameFunctionBase,
} from "./function";
import { ActionType, IGameClient } from "./interface/GameClient";

interface IGameWorker {
  id: string;
  name: string;
  description: string;
  functions: GameFunctionBase[];
  getEnvironment?: (functionResult?: any, currentState?: Record<string, any>) => Promise<Record<string, any>>;
}

class GameWorker implements IGameWorker {
  public id: string;
  public name: string;
  public description: string;
  public functions: GameFunctionBase[];

  private instructions?: string;
  private getStateFn?: (functionResult?: any, currentState?: Record<string, any>) => Promise<Record<string, any>>;

  private agentId: string | null = null;
  private logger: ((msg: string) => void) | null = null;
  private gameClient: IGameClient | null = null;

  private gameActionResult: ExecutableGameFunctionResponseJSON | null = null;

  constructor(options: IGameWorker) {
    this.id = options.id;
    this.name = options.name;
    this.description = options.description;
    this.functions = options.functions;
    this.getStateFn = options.getEnvironment;
  }

  setAgentId(agentId: string) {
    this.agentId = agentId;
  }

  setLogger(logger: (msg: string) => void) {
    this.logger = logger;
  }

  setGameClient(gameClient: IGameClient) {
    this.gameClient = gameClient;
  }

  async step(submissionId: string, options?: { verbose: boolean }) {
    if (!this.agentId) {
      throw new Error("Agent not initialized");
    }

    if (!this.gameClient) {
      throw new Error("Game client not initialized");
    }

    const environment = this.getEnvironment ? await this.getEnvironment() : {};

    if (options?.verbose) {
      this.logger?.(`Environment State: ${JSON.stringify(environment)}`);
    }

    const action = await this.gameClient.getTaskAction(
      this.agentId,
      submissionId,
      this,
      this.gameActionResult,
      environment
    );

    this.gameActionResult = null;

    if (
      ![ActionType.CallFunction, ActionType.ContinueFunction].includes(
        action.action_type
      )
    ) {
      return false;
    }

    const fn = this.functions.find(
      (fn) => fn.name === action.action_args.fn_name
    );

    if (!fn) {
      throw new Error("Function not found");
    }

    options?.verbose &&
      this.logger?.(
        `Performing function ${
          action.action_args.fn_name
        } with args ${JSON.stringify(action.action_args.args)}.`
      );

    const args = action.action_args.args;
    const result = await fn.execute(args, (msg: string) => this.logger?.(msg));

    options?.verbose &&
      this.logger?.(`Function status: ${result.status} - ${result.feedback}.`);

    this.gameActionResult = result.toJSON(action.action_args.fn_id);

    return true;
  }

  async runTask(task: string, options?: { verbose: boolean }) {
    if (!this.agentId) {
      throw new Error("Agent not initialized");
    }

    if (!this.gameClient) {
      throw new Error("Game client not initialized");
    }

    const submissionId = await this.gameClient.setTask(this.agentId, task);

    while (true) {
      const result = await this.step(submissionId, options);
      if (!result) {
        break;
      }
    }
  }

  public async getEnvironment(functionResult?: any, currentState?: Record<string, any>) {
    return {
      instructions: this.instructions,
      ...(this.getStateFn ? await this.getStateFn(functionResult, currentState) : {})
    };
  }
}

export default GameWorker;
