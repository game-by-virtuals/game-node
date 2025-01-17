import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

import { getActivities } from '@rss3/sdk'
import type { Tag, Type, Platform, Activity, Network } from "@rss3/sdk";

interface IRSS3PluginOptions {
  id?: string;
  name?: string;
  description?: string;
  credentials: {
    apiKey: string; // RSS3 API Key is currently optional
  };
}

class RSS3Plugin {
  private id: string;
  private name: string;
  private description: string;

  constructor(options: IRSS3PluginOptions) {
    this.id = options.id || "rss3_worker";
    this.name = options.name || "RSS3 Worker";
    this.description =
      options.description || "A worker capable of accessing real-time activities via RSS3 Network, including blockchains (for dApps) and decentralized protocols (ActivityPub and RSS). The activities are structured to be consumed by Agents.";
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
        this.getActivitiesFunction,
      ]
    });
  }


  get getActivitiesFunction() {
    return new GameFunction({
      name: "get_activities",
      description: "Get Activities from RSS3 Network",
      args: [{ name: "account", description: "The account to query for" }, { name: "tag", description: "The tag to filter" }, { name: "type", description: "The type to filter" }, { name: "network", description: "The network to filter" }, { name: "platform", description: "The platform to filter" }, { name: "limit", description: "Limit the number of activities to retrieve" }] as const,
      executable: async (args, logger) => {
        try {
          if (!args.account) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "An account is required"
            );
          }

          logger(`Retrieving activities for: ${args.account}`);

          let activities: Activity[];

          try {
            const response = await getActivities({
              account: args.account,
              tag: args.tag ? [args.tag as Tag] : undefined,
              type: args.type ? [args.type as Type] : undefined,
              network: args.network ? [args.network as Network] : undefined,
              platform: args.platform ? [args.platform as Platform] : undefined,
              limit: typeof args.platform === 'number' ? args.platform : 10,
            });

            activities = response.data;

          }
          catch (e) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Failed to retrieve activities, please check your arguments."
            );
          }

          const activitiesMessage = `Activities found:\n${JSON.stringify(activities, null, 2)}`;

          logger(activitiesMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            activitiesMessage
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to retrieve activities"
          );
        }
      },
    });
  }
}

export default RSS3Plugin;
