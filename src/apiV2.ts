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
import { randomUUID } from "node:crypto";

class GameClientV2 implements IGameClient {
  public client: Axios;
  private baseUrl = "https://sdk.game.virtuals.io/v2";

  constructor(
    private apiKey: string,
    private llmModel: LLMModel | string,
    private v2Engine: boolean
  ) {
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
    try {
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
    } catch (error) {
      console.error("Error creating map:", error);
      throw error;
    }
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
    agentState: Record<string, any>,
    sessionId: string
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

    const headers = {
      ...this.client.defaults.headers.common,
      session_id: sessionId,
    };

    const result = await this.client.post<{ data: GameAction }>(
      `/agents/${agentId}/actions`,
      {
        data: { ...payload, v2_engine: this.v2Engine },
      },
      { headers }
    );

    return result.data.data;
  }
  async setTask(agentId: string, task: string): Promise<string> {
    const result = await this.client.post<{ data: { submission_id: string } }>(
      `/agents/${agentId}/tasks`,
      {
        data: { task, v2_engine: this.v2Engine },
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
        data: { ...payload, v2_engine: this.v2Engine },
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

  async createSession(agentId: string): Promise<string> {
    try {
      let sessionId: string;

      if (this.v2Engine) {
        const response = await this.client.post<{
          data: { session_id: string };
        }>(`/agents/${agentId}/actions/start`);

        sessionId = response.data.data.session_id;
      } else {
        // Generate UUID v4 for non-v2 engine
        sessionId = randomUUID();
      }

      if (!sessionId) {
        throw new Error("Failed to create session.");
      }

      return sessionId;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }
}

export default GameClientV2;
