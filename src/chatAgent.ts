import GAMEClientV2 from "./apiV2";
import { LLMModel } from "./interface/GameClient";

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

export class Function {
  fn_name: string;
  fn_description: string;
  args: Argument[];
  hint?: string;
  private executable: (
    ...args: any[]
  ) => [FunctionResultStatus, string, Record<string, any>];

  constructor(
    fn_name: string,
    fn_description: string,
    args: Argument[],
    executable: (
      ...args: any[]
    ) => [FunctionResultStatus, string, Record<string, any>],
    hint?: string
  ) {
    this.fn_name = fn_name;
    this.fn_description = fn_description;
    this.args = args;
    this.executable = executable || Function.defaultExecutable;
    this.hint = hint;
  }

  get_function_def(): Record<string, any> {
    return {
      fn_name: this.fn_name,
      fn_description: this.fn_description,
      args: this.args,
      hint: this.hint,
    };
  }

  static defaultExecutable(): [
    FunctionResultStatus,
    string,
    Record<string, any>
  ] {
    return [
      FunctionResultStatus.DONE,
      "Default implementation - no action taken",
      {},
    ];
  }

  execute(kwargs: {
    fn_id: string;
    args: Record<string, any>;
  }): FunctionResult {
    try {
      const processedArgs: Record<string, any> = {};

      // Process nested argument values
      for (const [argName, argValue] of Object.entries(kwargs.args)) {
        if (argValue && typeof argValue === "object" && "value" in argValue) {
          processedArgs[argName] = argValue.value;
        } else {
          processedArgs[argName] = argValue;
        }
      }

      const [status, feedback, info] = this.executable(processedArgs);

      return {
        action_id: kwargs.fn_id,
        action_status: { value: status },
        feedback_message: feedback,
        info,
      };
    } catch (error) {
      return {
        action_id: kwargs.fn_id,
        action_status: { value: FunctionResultStatus.FAILED },
        feedback_message: `Error executing function: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
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
class Chat {
  private chatId: string;
  private client: GAMEClientV2;
  private actionSpace: Record<string, Function> | null;
  private getStateFn: (() => Record<string, any>) | null;

  constructor(
    chatId: string,
    client: GAMEClientV2,
    actionSpace?: Function[],
    getStateFn?: () => Record<string, any>
  ) {
    this.chatId = chatId;
    this.client = client;
    this.actionSpace = actionSpace
      ? Object.fromEntries(actionSpace.map((f) => [f.fn_name, f]))
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

      const result = fnToCall.execute({
        fn_id: convoResponse.function_call.id,
        args: convoResponse.function_call.args,
      });

      responseMessage = await this.reportFunctionResult(result);
      functionCallResponse = {
        fn_name: fnName,
        fn_args: convoResponse.function_call.args,
        result,
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
        ? Object.values(this.actionSpace).map((f) => f.get_function_def())
        : null,
    };
    const result = await this.client.updateChat(this.chatId, data);
    return result as GameChatResponse;
  }

  async reportFunctionResult(result: FunctionResult): Promise<string> {
    const data = {
      fn_id: result.action_id,
      result: result.feedback_message
        ? `${result.action_status.value}: ${result.feedback_message}`
        : result.action_status.value,
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
      this.client = new GAMEClientV2(api_key, LLMModel.Llama_3_1_405B_Instruct);
    } else {
      throw new Error("Please use V2 API key to use ChatAgent");
    }
  }

  async createChat(data: {
    partnerId: string;
    partnerName: string;
    actionSpace?: Function[];
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
