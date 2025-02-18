import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import { ATTPsSDK, parseNewAgentAddress } from "attps-sdk-js";
import { AttpsPriceQueryResponse } from "./types";

interface IAttpsPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  credentials: {
    rpcUrl: string;
    privateKey: string;
    proxyAddress: string;
    converterAddress?: string;
    autoHashData?: boolean;
  }
}

async function fetchPriceData(sourceAgentId: string, feedId: string) {
  const response = await fetch(`https://ai-agent-test.apro.com/api/ai-agent/price-detail?sourceAgentId=${sourceAgentId}&feedId=${feedId}`);
  const { result, code, message } = await response.json();
  if (code !== 0) {
      throw new Error(message);
  }
  return result as AttpsPriceQueryResponse;
}

function cleanNumber(numStr: string) {
  return parseFloat(numStr).toString();
}

function parseArray(array?: any) {
  if (!array) {
    return [];
  }

  if (Array.isArray(array)) {
    return array;
  }

  return JSON.parse(array.replace(/'/g, '"').trim());
} 

class AttpsPlugin {
  private id: string;
  private name: string;
  private description: string;
  private agentSDK: ATTPsSDK

  constructor(options: IAttpsPluginOptions) {
    this.id = options.id || "attps_worker";
    this.name = options.name || "ATTPs Worker";
    this.description =
      options.description ||
      "A worker that will execute tasks within the ATTPs Platforms. It is capable of creating agents, verifying data, and more.";

    this.agentSDK = new ATTPsSDK({
      rpcUrl: options.credentials.rpcUrl,
      privateKey: options.credentials.privateKey,
      proxyAddress: options.credentials.proxyAddress,
      converterAddress: options.credentials.converterAddress,
      autoHashData: options.credentials.autoHashData,
    });
  }

  public getWorker(data?: {
    functions?: GameFunction<any>[];
    getEnvironment?: () => Promise<Record<string, any>>;
  }): GameWorker {
    return new GameWorker({
      id: this.id,
      name: this.name,
      description: this.description,
      functions: data?.functions || [
        this.createAndRegisterAgentFunction,
        this.verifyDataFunction,
        this.attpsPriceQueryFunction,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  get createAndRegisterAgentFunction() {
    return new GameFunction({
      name: "create_and_register_agent",
      description: "Create and register an agent in the ATTPs Platform.",
      args: [
        {
          name: "signers",
          type: "string[]",
          description: "The signers of the agent.",
        },
        {
          name: "threshold",
          type: "number",
          description: "The threshold of the agent.",
        },
        {
          name: "converterAddress",
          type: "string",
          description: "The converter address of the agent.",
        },
        {
          name: "agentHeaderSourceAgentId",
          type: "string",
          optional: true,
          description: "The source agent id of the agent header.",
        },
        {
          name: "agentHeaderMessageId",
          type: "string",
          optional: true,
          description: "The message id of the agent header.",
        },
        {
          name: "agentHeaderSourceAgentName",
          type: "string",
          description: "The source agent name of the agent header.",
        },
        {
          name: "agentHeaderTargetAgentId",
          type: "string",
          description: "The target agent id of the agent header.",
        },
        {
          name: "agentHeaderMessageType",
          type: "number",
          description: "The message type of the agent header.",
        },
        {
          name: "agentHeaderPriority",
          type: "number",
          description: "The priority of the agent header.",
        },
        {
          name: "agentHeaderTtl",
          type: "number",
          description: "The ttl of the agent header.",
        }
      ] as const,
      executable: async (args, logger) => {
        logger("Creating and registering agent with args: \n" + JSON.stringify(args));

        const agentHeader = {
          sourceAgentId: args.agentHeaderSourceAgentId,
          messageId: args.agentHeaderMessageId,
          sourceAgentName: args.agentHeaderSourceAgentName,
          targetAgentId: args.agentHeaderTargetAgentId,
          messageType: Number(args.agentHeaderMessageType),
          priority: Number(args.agentHeaderPriority),
          ttl: Number(args.agentHeaderTtl),
        }
        const agentSettings = {
          signers: parseArray(args.signers),
          threshold: Number(args.threshold),
          converterAddress: args.converterAddress,
          agentHeader,
        }

        try {
          logger("Creating and registering agent with settings: " + JSON.stringify(agentSettings));

          const tx = await this.agentSDK.createAndRegisterAgent({ agentSettings: agentSettings as any });
          logger("Created and registered agent with tx hash: " + tx.hash);

          const receipt = await tx.wait()
          const agentAddress = parseNewAgentAddress(receipt)
          logger("Created and registered agent with address: " + agentAddress);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Created and registered agent with address: " + agentAddress
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to create and register agent: " + e.message
          );
        }
      }
    })
  }

  get verifyDataFunction() {
    return new GameFunction({
      name: "verify_data",
      description: "Verify data in the ATTPs Platform.",
      args: [
        {
          name: "agent",
          type: "string",
          description: "The agent address.",
        },
        {
          name: "configDigest",
          type: "string",
          description: "The config digest.",
        },
        {
          name: "data",
          type: "string",
          description: "The data to verify.",
        },
        {
          name: "dataHash",
          type: "string",
          description: "The hash of the data.",
        },
        {
          name: "signatures",
          type: "{ r: string, s: string, v: number }[]",
          description: "The signatures of the data.",
        },
        {
          name: "metadataContentType",
          type: "string",
          description: "The content type of the metadata.",
        },
        {
          name: "metadataEncoding",
          type: "string",
          description: "The encoding of the metadata.",
        },
        {
          name: "metadataCompression",
          type: "string",
          description: "The compression of the metadata.",
        },
      ] as const,
      executable: async (args, logger) => {
        logger("Verifying data with args: \n" + JSON.stringify(args));

        const payload = {
          data: args.data,
          dataHash: args.dataHash,
          signatures: parseArray(args.signatures),
          metadata: {
            contentType: args.metadataContentType,
            encoding: args.metadataEncoding,
            compression: args.metadataCompression,
          }
        }

        const params = {
          agent: args.agent,
          digest: args.configDigest,
          payload: payload as any,
        }

        try {
          logger("Verifying data with payload: " + JSON.stringify(params));

          const tx = await this.agentSDK.verify(params as any);
          logger("Verified data with tx hash: " + tx.hash);

          await tx.wait()
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Verified data with tx hash: " + tx.hash
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to verify data: " + e.message
          );
        }
      }
    })
  }

  get attpsPriceQueryFunction() {
    return new GameFunction({
      name: "price_query",
      description: "Query the price of a service in the ATTPs Platform.",
      args: [
        {
          name: "sourceAgentId",
          type: "string",
          description: "The source agent id.",
        },
        {
          name: "feedId",
          type: "string",
          description: "The feed id.",
        },
      ],
      executable: async (args, logger) => {
        if (!args.sourceAgentId || !args.feedId) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Source agent id and feed id are required"
          );
        }

        try {
          const priceData = await fetchPriceData(args.sourceAgentId, args.feedId);
          logger(`Price data: ${JSON.stringify(priceData)}`);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            `Fetched price data: \nAsk price: ${cleanNumber(priceData.askPrice)}\nBid price: ${cleanNumber(priceData.bidPrice)}\nMid price: ${cleanNumber(priceData.midPrice)}\nTimestamp: ${priceData.validTimeStamp}`
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to fetch price data, error: " + e.message
          );
        }
      }
    })
  }
}

export default AttpsPlugin;