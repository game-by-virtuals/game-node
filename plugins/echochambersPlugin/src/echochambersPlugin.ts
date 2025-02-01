import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import axios from "axios";
import { AgentMetrics, RoomHistory, RoomMetrics, MetricsHistory } from "./types";

interface IEchochambersPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  credentials: {
    apiKey: string;
  };
  sender?: {
    username: string;
    model: string;
  };
}

interface IWorkerOptions {
  functions?: GameFunction<any>[];
  getEnvironment?: () => Promise<Record<string, any>>;
}

class EchochambersPlugin {
  private id: string;
  private name: string;
  private description: string;
  private apiKey: string;
  private sender: { username: string; model: string };
  private baseUrl = "https://echochambers.ai/api";

  constructor(options: IEchochambersPluginOptions) {
    this.id = options.id || "echochambers_worker";
    this.name = options.name || "Echochambers Worker";
    this.description = options.description || 
      "A worker that can send messages to Echochambers rooms";
    this.apiKey = options.credentials.apiKey;
    this.sender = options.sender || {
      username: "Agent",
      model: "VirtualsLLM"
    };
  }

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> {
    const config: {
      method: 'GET' | 'POST';
      url: string;
      headers: Record<string, string>;
      data?: any;
    } = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Only add API key for endpoints that require it
    if (method === 'POST') {
      config.headers['x-api-key'] = this.apiKey;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  }

  // Send Message Function (Requires API Key)
  get sendMessageFunction() {
    return new GameFunction({
      name: "send_message",
      description: "Send a message to an Echochambers room",
      args: [
        { name: "room", description: "The room to send the message to" },
        { name: "content", description: "The message content" },
        { name: "reasoning", description: "The reasoning behind sending this message" }
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.room || !args.content) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Room and content are required"
            );
          }

          logger(`Sending message to room ${args.room}`);
          logger(`Message content: ${args.content}`);
          logger(`Reasoning: ${args.reasoning}`);

          const response = await this.makeRequest<any>(
            `/rooms/${args.room}/message`,
            'POST',
            {
              content: args.content,
              sender: this.sender
            }
          );

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            `Message sent successfully: ${JSON.stringify(response)}`
          );
        } catch (error) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to send message: ${error}`
          );
        }
      }
    });
  }

  // Get Room History Function (No API Key Required)
  get getRoomHistoryFunction() {
    return new GameFunction({
      name: "get_room_history",
      description: "Get message history from a specific room",
      args: [
        { name: "room", description: "The room to get history from" },
        { name: "limit", description: "Maximum number of messages to retrieve (default: 30)" }
      ] as const,
      executable: async (args, logger) => {
        try {
          const limit = args.limit || 30;
          logger(`Getting history for room ${args.room} (limit: ${limit})`);

          const history = await this.makeRequest<RoomHistory>(
            `/rooms/${args.room}/history?limit=${limit}`
          );

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(history)
          );
        } catch (error) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get room history: ${error}`
          );
        }
      }
    });
  }

  // Get Room Metrics Function (No API Key Required)
  get getRoomMetricsFunction() {
    return new GameFunction({
      name: "get_room_metrics",
      description: "Get metrics for a specific room",
      args: [
        { name: "room", description: "The room to get metrics for" }
      ] as const,
      executable: async (args, logger) => {
        try {
          logger(`Getting metrics for room ${args.room}`);

          const metrics = await this.makeRequest<RoomMetrics>(
            `/metrics/rooms/${args.room}`
          );

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(metrics)
          );
        } catch (error) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get room metrics: ${error}`
          );
        }
      }
    });
  }

  // Get Agent Metrics Function (No API Key Required)
  get getAgentMetricsFunction() {
    return new GameFunction({
      name: "get_agent_metrics",
      description: "Get metrics for all agents in a room",
      args: [
        { name: "room", description: "The room to get agent metrics for" }
      ] as const,
      executable: async (args, logger) => {
        try {
          logger(`Getting agent metrics for room ${args.room}`);

          const metrics = await this.makeRequest<{ agentMetrics: AgentMetrics[] }>(
            `/metrics/agents/${args.room}`
          );

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(metrics)
          );
        } catch (error) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get agent metrics: ${error}`
          );
        }
      }
    });
  }

  // Get Metrics History Function (No API Key Required)
  get getMetricsHistoryFunction() {
    return new GameFunction({
      name: "get_metrics_history",
      description: "Get metrics history for a room",
      args: [
        { name: "room", description: "The room to get metrics history for" }
      ] as const,
      executable: async (args, logger) => {
        try {
          logger(`Getting metrics history for room ${args.room}`);

          const history = await this.makeRequest<MetricsHistory>(
            `/metrics/history/${args.room}`
          );

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(history)
          );
        } catch (error) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to get metrics history: ${error}`
          );
        }
      }
    });
  }

  public getWorker(options?: IWorkerOptions): GameWorker {
    // Create worker configuration
    const workerConfig = {
      id: this.id,
      name: this.name,
      description: this.description,
      functions: [
        this.sendMessageFunction,
        this.getRoomHistoryFunction,
        this.getRoomMetricsFunction,
        this.getAgentMetricsFunction,
        this.getMetricsHistoryFunction
      ],
      getEnvironment: options?.getEnvironment || (async () => ({
        activeRoom: "general",
        messagesSent: 0,
        lastActivity: new Date().toISOString(),
        metrics: {
          totalMessagesSent: 0,
          activeConversations: 0,
          responseRate: 0,
          averageResponseTime: 0
        }
      }))
    };

    // Create and return worker
    return new GameWorker(workerConfig);
  }
}

export default EchochambersPlugin;
