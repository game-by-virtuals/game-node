import GameClient, { ActionType } from "./api";
import { ExecutableGameFunctionResponseJSON } from "./function";
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

  private workerId: string;
  private gameClient: GameClient;

  private agentId: string | null = null;
  private mapId: string | null = null;
  private gameActionResult: ExecutableGameFunctionResponseJSON | null = null;

  log(msg: string) {
    console.log(`[${this.name}] ${msg}`);
  }

  constructor(apiKey: string, options: IGameAgent) {
    this.gameClient = new GameClient(apiKey);
    this.workerId = options.workers[0].id;

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

  async step(options?: { verbose: boolean }) {
    if (!this.agentId || !this.mapId) {
      throw new Error("Agent not initialized");
    }

    const { verbose } = options || {};

    const worker = this.workers.find((worker) => worker.id === this.workerId);

    if (!worker) {
      throw new Error("Worker not found");
    }

    const environment = worker.getEnvironment
      ? await worker.getEnvironment()
      : {};
    const agentState = this.getAgentState ? await this.getAgentState() : {};

    if (verbose) {
      this.log(`Environment State: ${JSON.stringify(environment)}`);
      this.log(`Agent State: ${JSON.stringify(agentState)}`);
    }

    const action = await this.gameClient.getAction(
      this.agentId,
      this.mapId,
      worker,
      this.gameActionResult,
      environment,
      agentState
    );

    options?.verbose &&
      this.log(`Action State: ${JSON.stringify(action.agent_state || {})}.`);

    this.gameActionResult = null;

    switch (action.action_type) {
      case ActionType.CallFunction:
      case ActionType.ContinueFunction:
        verbose &&
          this.log(
            `Performing function ${
              action.action_args.fn_name
            } with args ${JSON.stringify(action.action_args.args)}.`
          );

        const fn = worker.functions.find(
          (fn) => fn.name === action.action_args.fn_name
        );

        if (!fn) {
          throw new Error("Function not found");
        }

        const result = await fn.execute(
          action.action_args.args,
          (msg: string) => this.log(msg)
        );

        verbose &&
          this.log(`Function status [${result.status}]: ${result.feedback}.`);

        this.gameActionResult = result.toJSON(action.action_args.fn_id);

        break;
      case ActionType.GoTo:
        this.workerId = action.action_args.location_id;

        verbose && this.log(`Going to ${action.action_args.location_id}.`);
        break;
      case ActionType.Wait:
        verbose && this.log(`No actions to perform.`);
        return action.action_type;
      default:
        return ActionType.Unknown;
    }

    return action.action_type;
  }

  async run(heartbeatSeconds: number, options?: { verbose: boolean }) {
    if (!this.agentId || !this.mapId) {
      throw new Error("Agent not initialized");
    }

    while (true) {
      const action = await this.step({
        verbose: options?.verbose || false,
      });

      if (action === ActionType.Wait || action === ActionType.Unknown) {
        break;
      }

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