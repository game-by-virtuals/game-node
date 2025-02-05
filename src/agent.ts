import GameClient from "./api";
import GameClientV2 from "./apiV2";
import { ExecutableGameFunctionResponseJSON } from "./function";
import { ActionType, GameAction, IGameClient } from "./interface/GameClient";
import GameWorker from "./worker";

interface IGameAgent {
  name: string;
  goal: string;
  description: string;
  workers: GameWorker[];
  getAgentState?: () => Promise<Record<string, any>>;
}

class GameAgent implements IGameAgent {
  public name: string;
  public goal: string;
  public description: string;
  public workers: GameWorker[];
  public getAgentState?: () => Promise<Record<string, any>>;

  private currentWorkerId: string;
  private gameClient: IGameClient;

  private agentId: string | null = null;
  private mapId: string | null = null;
  private gameActionResult: ExecutableGameFunctionResponseJSON | null = null;

  log(msg: string) {
    console.log(`[${this.name}] ${msg}`);
  }

  constructor(apiKey: string, options: IGameAgent) {
    this.gameClient = apiKey.startsWith("apt-")
      ? new GameClientV2(apiKey)
      : new GameClient(apiKey);
    this.currentWorkerId = options.workers[0].id;

    this.name = options.name;
    this.goal = options.goal;
    this.description = options.description;
    this.workers = options.workers;
    this.getAgentState = options.getAgentState;
  }

  async init() {
    const map = await this.gameClient.createMap(this.workers);
    const agent = await this.gameClient.createAgent(
      this.name,
      this.goal,
      this.description
    );

    this.workers.forEach((worker) => {
      worker.setAgentId(agent.id);
      worker.setLogger(this.log.bind(this));
      worker.setGameClient(this.gameClient);
    });

    this.mapId = map.id;
    this.agentId = agent.id;
  }

  setLogger(logger: (agent: GameAgent, msg: string) => void) {
    this.log = (msg: string) => logger(this, msg);
  }

  getWorkerById(workerId: string) {
    const worker = this.workers.find((worker) => worker.id === workerId);
    if (!worker) {
      throw new Error("Worker not found");
    }

    return worker;
  }

  async runTask(task: string, options?: { verbose: boolean }) {
    if (!this.agentId || !this.mapId) {
      throw new Error("Agent not initialized");
    }

    const submissionId = await this.gameClient.setTask(this.agentId, task);

    while (true) {
      const result = await this.step(submissionId, options);
      if (!result) break;
    }
  }

  async step(submissionId?: string, options?: { verbose: boolean }) {
    if (!this.agentId || !this.mapId) {
      throw new Error("Agent not initialized");
    }

    const { verbose } = options || {};
    const worker = this.getWorkerById(this.currentWorkerId);
    const environment = worker.getEnvironment ? await worker.getEnvironment() : {};
    const agentState = await this.getAgentState?.() || {};

    this.logStateIfVerbose(verbose, environment, agentState);

    const action = await this.getNextAction(submissionId, environment, agentState);
    this.logActionStateIfVerbose(verbose, action);

    this.gameActionResult = null;
    return await this.handleAction(action, this.workers, verbose);
  }

  private logStateIfVerbose(
    verbose: boolean | undefined, 
    environment: Record<string, any>,
    agentState: Record<string, any>
  ) {
    if (verbose) {
      this.log(`Environment State: ${JSON.stringify(environment)}`);
      this.log(`Agent State: ${JSON.stringify(agentState)}`);
    }
  }

  private async getNextAction(
    submissionId: string | undefined,
    environment: Record<string, any>,
    agentState: Record<string, any>
  ): Promise<GameAction> {
    if (submissionId) {
      return await this.gameClient.getTaskAction(
        this.agentId!,
        submissionId,
        this.workers,
        this.gameActionResult,
        environment
      );
    }
    
    return await this.gameClient.getAction(
      this.agentId!,
      this.mapId!,
      this.workers,
      this.gameActionResult,
      environment,
      agentState
    );
  }

  private logActionStateIfVerbose(verbose: boolean | undefined, action: GameAction) {
    if (verbose) {
      this.log(`Action State: ${JSON.stringify(action.agent_state || {})}.`);
    }
  }

  private async handleAction(
    action: GameAction, 
    workers: GameWorker[],
    verbose?: boolean
  ): Promise<boolean> {
    switch (action.action_type) {
      case ActionType.CallFunction:
      case ActionType.ContinueFunction:
        return await this.handleFunctionAction(action, workers, verbose);
      case ActionType.GoTo:
        return this.handleGoToAction(action, verbose);
      case ActionType.Wait:
        return this.handleWaitAction(verbose);
      default:
        return false;
    }
  }

  private async handleFunctionAction(
    action: GameAction,
    workers: GameWorker[], 
    verbose?: boolean
  ): Promise<boolean> {
    if (verbose) {
      this.log(
        `Performing function ${
          action.action_args.fn_name
        } with args ${JSON.stringify(action.action_args.args)}.`
      );
    }

    const functions = workers.flatMap(worker => worker.functions);
    const fn = functions.find(fn => fn.name === action.action_args.fn_name);
    if (!fn) throw new Error("Function not found");

    const result = await fn.execute(
      action.action_args.args,
      (msg: string) => this.log(msg)
    );

    if (verbose) {
      this.log(`Function status [${result.status}]: ${result.feedback}.`);
    }

    this.gameActionResult = result.toJSON(action.action_args.fn_id);
    return true;
  }

  private handleGoToAction(action: GameAction, verbose?: boolean): boolean {
    this.currentWorkerId = action.action_args.location_id;
    verbose && this.log(`Going to ${action.action_args.location_id}.`);
    return true;
  }

  private handleWaitAction(verbose?: boolean): boolean {
    verbose && this.log(`No actions to perform.`);
    return false;
  }

  async run(heartbeatSeconds: number, options?: { verbose: boolean }) {
    if (!this.agentId || !this.mapId) {
      throw new Error("Agent not initialized");
    }

    while (true) {
      await this.step(undefined, {
        verbose: options?.verbose || false,
      });

      await new Promise((resolve) =>
        setTimeout(resolve, heartbeatSeconds * 1000)
      );
    }
  }

  save(): Record<string, any> {
		return {
			agentId: this.agentId,
			mapId: this.mapId,
			gameActionResult: this.gameActionResult,
		}
	}

	async initWorkers() {
		this.workers.forEach((worker) => {
			worker.setAgentId(this.agentId || '')
			worker.setLogger(this.log.bind(this))
			worker.setGameClient(this.gameClient)
		})
	}

	static async load(
		apiKey: string,
		name: string,
		goal: string,
		description: string,
		savedState: Record<string, any>,
		workers: GameWorker[]
	): Promise<GameAgent> {
		const agent = new GameAgent(apiKey, {
			name: name,
			goal: goal,
			description: description,
			workers,
		})

		agent.agentId = savedState.agentId
		agent.mapId = savedState.mapId
		agent.gameActionResult = savedState.gameActionResult


		return agent
	}

}

export default GameAgent;