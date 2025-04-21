import GAMEClientV2 from "./apiV2";
import { LLMModel } from "./interface/GameClient";
import GameFunction, { ExecutableGameFunctionResponse } from "./function";

// Type definitions
export interface Argument {
  name: string;
  type?: string;
  description: string;
  required?: boolean;
}

export interface FunctionResult {
  action_id: string;
  action_status: { value: string };
  feedback_message?: string;
  info?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  isFinished: boolean;
  functionCall: FunctionCallResponse | null;
}

export interface FunctionCallResponse {
  fn_name: string;
  fn_args: any;
  result: FunctionResult;
}

export interface GameChatResponse {
  message?: string;
  is_finished: boolean;
  function_call?: {
    id: string;
    fn_name: string;
    args: any;
  };
}

export enum FunctionResultStatus {
  DONE = "done",
  FAILED = "failed",
}

// Main Chat class
export class Chat {
  public chatId: string;
  public client: GAMEClientV2;
  private actionSpace: Record<string, GameFunction<any>> | null;
  private getStateFn: (() => Record<string, any>) | null;

  constructor(
    chatId: string,
    client: GAMEClientV2,
    actionSpace?: GameFunction<any>[],
    getStateFn?: () => Record<string, any>
  ) {
    this.chatId = chatId;
    this.client = client;
    this.actionSpace = actionSpace
      ? Object.fromEntries(actionSpace.map((f) => [f.name, f]))
      : null;
    this.getStateFn = getStateFn || null;
  }

  async next(message: string): Promise<ChatResponse> {
    const convoResponse = await this.updateConversation(message);

    let responseMessage: string;
    let functionCallResponse: FunctionCallResponse | null = null;

    if (convoResponse.function_call) {
      if (!this.actionSpace) {
        throw new Error("No functions provided");
      }

      const fnName = convoResponse.function_call.fn_name;
      const fnToCall = this.actionSpace[fnName];

      if (!fnToCall) {
        throw new Error(
          `Function ${fnName}, returned by the agent, not found in action space`
        );
      }

      const executableArgs = Object.entries(
        convoResponse.function_call.args
      ).reduce((acc, [key, value]) => {
        acc[key] = { value: String(value) };
        return acc;
      }, {} as Record<string, { value: string }>);

      const result = await fnToCall.execute(
        executableArgs, 
        (msg) => console.log(msg)
      );

      responseMessage = await this.reportFunctionResult(
        result,
        convoResponse.function_call.id
      );
      functionCallResponse = {
        fn_name: fnName,
        fn_args: convoResponse.function_call.args,
        result: {
          action_id: convoResponse.function_call.id,
          action_status: { value: result.status },
          feedback_message: result.feedback,
        },
      };
    } else {
      responseMessage = convoResponse.message || "";
    }

    return {
      message: responseMessage,
      isFinished: convoResponse.is_finished,
      functionCall: functionCallResponse,
    };
  }

  end(message?: string): void {
    this.client.endChat(this.chatId, { message });
  }

  async updateConversation(message: string): Promise<GameChatResponse> {
    const data = {
      message,
      state: this.getStateFn ? this.getStateFn() : null,
      functions: this.actionSpace
        ? Object.values(this.actionSpace).map((f) => f.toJSON())
        : null,
    };
    const result = await this.client.updateChat(this.chatId, data);
    return result as GameChatResponse;
  }

  async reportFunctionResult(
    result: ExecutableGameFunctionResponse,
    fnId: string
  ): Promise<string> {
    const data = {
      fn_id: fnId,
      result: result.feedback
        ? `${result.status}: ${result.feedback}`
        : result.status,
    };
    const response = await this.client.reportFunction(this.chatId, data);

    if (!response.message) {
      throw new Error(
        "Agent did not return a message for the function report."
      );
    }
    return response.message;
  }
}

// ChatAgent class
export class ChatAgent {
  private _api_key: string;
  public prompt: string;
  private client: GAMEClientV2;

  constructor(api_key: string, prompt: string) {
    this._api_key = api_key;
    this.prompt = prompt;

    if (api_key.startsWith("apt-")) {
      this.client = new GAMEClientV2(api_key, LLMModel.Llama_3_3_70B_Instruct, "", "");
    } else {
      throw new Error("Please use V2 API key to use ChatAgent");
    }
  }

  async createChat(data: {
    partnerId: string;
    partnerName: string;
    actionSpace?: GameFunction<any>[];
    getStateFn?: () => Record<string, any>;
  }): Promise<Chat> {
    const chat_id = await this.client.createChat({
      prompt: this.prompt,
      partner_id: data.partnerId,
      partner_name: data.partnerName,
    });

    return new Chat(chat_id, this.client, data.actionSpace, data.getStateFn);
  }
}
