import { Axios } from "axios";
import GameWorker from "../worker";
import { ExecutableGameFunctionResponseJSON } from "../function";

export interface Map {
  id: string;
}

export interface GameAgent {
  id: string;
  name: string;
  goal: string;
  description: string;
}

export enum ActionType {
  CallFunction = "call_function",
  ContinueFunction = "continue_function",
  Wait = "wait",
  TryToTalk = "try_to_talk",
  Conversation = "conversation",
  GoTo = "go_to",
  Unknown = "unknown",
}

export interface ActionArgs {
  location_id: string;
  task_id: string;
  fn_id: string;
  args: Record<string, any>;
  fn_name: string;
  thought: string;
}

export interface GameAction {
  action_type: ActionType;
  action_args: ActionArgs;
  agent_state?: Record<string, any>;
}

export interface IGameClient {
  client: Axios | null;
  createMap(workers: GameWorker[]): Promise<Map>;
  createAgent(
    name: string,
    goal: string,
    description: string
  ): Promise<GameAgent>;
  getAction(
    agentId: string,
    mapId: string,
    workers: GameWorker[],
    gameActionResult: ExecutableGameFunctionResponseJSON | null,
    environment: Record<string, any>,
    agentState: Record<string, any>
  ): Promise<GameAction>;
  setTask(agentId: string, task: string): Promise<string>;
  getTaskAction(
    agentId: string,
    submissionId: string,
    workers: GameWorker[],
    gameActionResult: ExecutableGameFunctionResponseJSON | null,
    environment: Record<string, any>
  ): Promise<GameAction>;
}
