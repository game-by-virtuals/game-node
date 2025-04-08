import axios, { Axios } from "axios";
import { ExecutableGameFunctionResponseJSON } from "./function";
import {
  GameAction,
  GameAgent,
  IGameClient,
  LLMModel,
  Map,
} from "./interface/GameClient";
import GameWorker from "./worker";
import { GameChatResponse } from "./chatAgent";

class GameClientV2 implements IGameClient {
  public client: Axios;
  private baseUrl = "https://sdk.game.virtuals.io/v2";

  constructor(private apiKey: string, private llmModel: LLMModel | string) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        model_name: this.llmModel,
      },
    });
  }

  async createMap(workers: GameWorker[]): Promise<Map> {
    const result = await this.client.post<{ data: Map }>("/maps", {
      data: {
        locations: workers.map((worker) => ({
          id: worker.id,
          name: worker.name,
          description: worker.description,
        })),
      },
    });

    return result.data.data;
  }

  async createAgent(
    name: string,
    goal: string,
    description: string
  ): Promise<GameAgent> {
    const result = await this.client.post<{ data: GameAgent }>("/agents", {
      data: {
        name,
        goal,
        description,
      },
    });

    return result.data.data;
  }

  async getAction(
    agentId: string,
    mapId: string,
    worker: GameWorker,
    gameActionResult: ExecutableGameFunctionResponseJSON | null,
    environment: Record<string, any>,
    agentState: Record<string, any>
  ): Promise<GameAction> {
    const payload: { [key in string]: any } = {
      location: worker.id,
      map_id: mapId,
      environment: environment,
      functions: worker.functions.map((fn) => fn.toJSON()),
      agent_state: agentState,
      version: "v2",
    };

    if (gameActionResult) {
      payload.current_action = gameActionResult;
    }

    const result = await this.client.post<{ data: GameAction }>(
      `/agents/${agentId}/actions`,
      {
        data: payload,
      }
    );

    return result.data.data;
  }
  async setTask(agentId: string, task: string): Promise<string> {
    const result = await this.client.post<{ data: { submission_id: string } }>(
      `/agents/${agentId}/tasks`,
      {
        data: { task },
      }
    );

    return result.data.data.submission_id;
  }

  async getTaskAction(
    agentId: string,
    submissionId: string,
    worker: GameWorker,
    gameActionResult: ExecutableGameFunctionResponseJSON | null,
    environment: Record<string, any>
  ): Promise<GameAction> {
    const payload: Record<string, any> = {
      environment: environment,
      functions: worker.functions.map((fn) => fn.toJSON()),
    };

    if (gameActionResult) {
      payload.action_result = gameActionResult;
    }

    const result = await this.client.post<{ data: GameAction }>(
      `/agents/${agentId}/tasks/${submissionId}/next`,
      {
        data: payload,
      }
    );

    return result.data.data;
  }

  async createChat(data: Record<string, any>): Promise<string> {
    const response = await this.client.post<{
      data: { conversation_id: string };
    }>("/conversation", { data });

    const chatId = response.data.data.conversation_id;
    if (!chatId) {
      throw new Error("Agent did not return a conversation_id for the chat.");
    }
    return chatId;
  }

  async updateChat(
    conversationId: string,
    data: Record<string, any>
  ): Promise<GameChatResponse> {
    const response = await this.client.post<{ data: GameChatResponse }>(
      `/conversation/${conversationId}/next`,
      { data }
    );

    return response.data.data;
  }

  async reportFunction(
    conversationId: string,
    data: Record<string, any>
  ): Promise<GameChatResponse> {
    const response = await this.client.post<{ data: GameChatResponse }>(
      `/conversation/${conversationId}/function/result`,
      { data }
    );

    return response.data.data;
  }

  async endChat(
    conversationId: string,
    data: Record<string, any>
  ): Promise<GameChatResponse> {
    const response = await this.client.post<{ data: GameChatResponse }>(
      `/conversation/${conversationId}/end`,
      { data }
    );

    return response.data.data;
  }
}

export default GameClientV2;
