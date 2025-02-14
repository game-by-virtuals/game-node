import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import { exceptionHandler, maopVisitor } from "./utils";

// Default configuration values
export const DEFAULT_API_KEY = "qf-3e4f1a2b5c6d7e8f9a0b1c2d3e4f5a6b";
export const DEFAULT_BASE_API_URL = "https://staging.questflow.ai";

// Interface for plugin configuration options
interface ICoingeckoMAOPPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  apiClientConfig: {
    apiKey?: string;
    baseApiUrl?: string;
  };
}

class CoingeckoMAOPPlugin {
  private id: string;
  private name: string;
  private description: string;
  private apiKey: string;
  private baseApiUrl: string;

  constructor(options: ICoingeckoMAOPPluginOptions) {
    this.id = options.id || "coingecko_maop_worker";
    this.name = options.name || "CoinGecko Cryptocurrency Data Worker";
    this.description =
      options.description ||
      "Worker that queries all the data of a cryptocurrency based on its unique Coin ID";

    this.apiKey = options.apiClientConfig.apiKey || DEFAULT_API_KEY;
    this.baseApiUrl =
      options.apiClientConfig.baseApiUrl || DEFAULT_BASE_API_URL;
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
        this.coinDataByID,
        this.coinPricesByAddress,
        this.coinPricesByIDs,
        this.coinsCategoriesList,
        this.coinsListWithMarketData,
        this.newPoolsByNetwork,
        this.specificPoolData,
        this.tokenInfoByAddress,
        this.tokenPriceByAddresses,
        this.topGainersLosersConfig,
        this.trendingPoolsByNetwork,
        this.trendingPoolsList,
        this.trendingSearchList,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  get coinDataByID() {
    return new GameFunction({
      name: "coin_data_by_id",
      description:
        "Queries all the data of a cryptocurrency based on its unique Coin ID.",
      args: [
        // use part of coingecko parameters to avoid GAME 413 error, or the request will body will be to long
        {
          name: "id",
          description: "The unique API ID of the cryptocurrency to query.",
          type: "string",
        },
        {
          name: "localization",
          description: "Include all localized languages in the response.",
          type: "boolean",
          default: false,
        },
      ] as const,
      executable: async (args: any, logger: any) => {
        try {
          // Validate required arguments
          if (!args.id) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "ID is required for querying coin data"
            );
          }

          logger(`Querying coin data with ID: ${args.id}`);

          return await maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "coin_data_by_id_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get coinPricesByAddress() {
    return new GameFunction({
      name: "coin_prices_by_address",
      description:
        "Queries the prices of one or more cryptocurrencies using their unique Coin addresses.",
      args: [
        {
          name: "id",
          description: `Asset platform's id *refers to /asset_platforms.`,
          type: "string",
          default: "ethereum",
        },
        {
          name: "contract_addresses",
          description: `The contract addresses of tokens, comma-separated if querying more than 1 token's contract address.`,
          type: "string",
          default: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        },
        {
          name: "vs_currencies",
          description:
            "Comma-separated target currencies for the coins prices.",
          type: "string",
        },
        {
          name: "include_market_cap",
          description: "Whether to include market cap in the response.",
          type: "boolean",
          default: false,
        },
        {
          name: "include_24hr_vol",
          description: "Whether to include 24hr volume in the response.",
          type: "boolean",
          default: false,
        },
        {
          name: "include_24hr_change",
          description: "Whether to include 24hr change in the response.",
          type: "boolean",
          default: false,
        },
        {
          name: "include_last_updated_at",
          description:
            "Whether to include last updated timestamp in the response.",
          type: "boolean",
          default: false,
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.id || !args.contract_addresses || !args.vs_currencies) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "ID, contract_addresses, and vs_currencies are required for querying coin prices by address"
            );
          }

          logger(
            `Querying coin prices by address with ID: ${args.id} and contract_addresses: ${args.contract_addresses}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "coin_price_by_address_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get coinPricesByIDs() {
    return new GameFunction({
      name: "coin_prices_by_ids",
      description:
        "Queries the prices of one or more cryptocurrencies using their unique Coin IDs.",
      args: [
        {
          name: "ids",
          description: "Comma-separated cryptocurrency IDs (API IDs) to query.",
          type: "string",
        },
        {
          name: "vs_currencies",
          description:
            "Comma-separated target currencies for the coins prices.",
          type: "string",
        },
        {
          name: "include_market_cap",
          description: "Whether to include market cap in the response.",
          type: "boolean",
          default: false,
        },
        {
          name: "include_24hr_vol",
          description: "Whether to include 24hr volume in the response.",
          type: "boolean",
          default: false,
        },
        {
          name: "include_24hr_change",
          description: "Whether to include 24hr change in the response.",
          type: "boolean",
          default: false,
        },
        {
          name: "include_last_updated_at",
          description:
            "Whether to include last updated timestamp in the response.",
          type: "boolean",
          default: false,
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.ids || !args.vs_currencies) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "IDs and vs_currencies are required for querying coin prices"
            );
          }

          logger(
            `Querying coin prices with IDs: ${args.ids} and vs_currencies: ${args.vs_currencies}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "coin_price_by_ids_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get coinsCategoriesList() {
    return new GameFunction({
      name: "coins_categories_list",
      description: "Queries all the coin categories on CoinGecko.",
      args: [] as const,
      executable: async (args, logger) => {
        try {
          logger(`Querying all coin categories`);

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "coins_categories_list_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get coinsListWithMarketData() {
    return new GameFunction({
      name: "coins_list_with_market_data",
      description:
        "Fetches market data for cryptocurrencies including price, market cap, volume and other related information.",
      args: [
        {
          name: "vs_currency",
          description:
            "The target currency of coins and market data (e.g., usd).",
          type: "string",
        },
        {
          name: "ids",
          description:
            "Comma-separated cryptocurrency IDs to query (e.g., bitcoin,ethereum).",
          type: "string",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.vs_currency || !args.ids) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "vs_currency and ids are required for querying coins list with market data"
            );
          }

          logger(
            `Querying coins list with market data for vs_currency: ${args.vs_currency} and ids: ${args.ids}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "coins_list_with_market_data_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get newPoolsByNetwork() {
    return new GameFunction({
      name: "new_pools_by_network",
      description:
        "Allows users to query all the latest pools based on provided network.",
      args: [
        {
          name: "network",
          description: "The network for which to query the new pools.",
          type: "string",
        },
        {
          name: "include",
          description:
            "Attributes to include, comma-separated if more than one.",
          type: "string",
          default: "base_token",
          enum: ["base_token", "quote_token", "dex"],
        },
        {
          name: "page",
          description: "Page number of results to show.",
          type: "integer",
          default: 1,
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.network) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "network is required for querying new pools by network"
            );
          }

          logger(
            `Querying new pools by network for network: ${args.network}, include: ${args.include}, page: ${args.page}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "new_pools_by_network_tool",
            args,
            logger
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Error occurred: ${e.message}`
          );
        }
      },
    });
  }

  get specificPoolData() {
    return new GameFunction({
      name: "specific_pool_data",
      description:
        "Allows users to query the specific pool data based on the provided network and pool address. Users can include additional attributes such as base_token, quote_token, dex.",
      args: [
        {
          name: "network",
          description: "The network identifier (e.g., eth).",
          type: "string",
        },
        {
          name: "address",
          description: "The pool address to query.",
          type: "string",
        },
        {
          name: "include",
          description:
            "Comma-separated attributes to include in the response (base_token, quote_token, dex).",
          type: "string",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.network || !args.address) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "network and address are required for querying specific pool data"
            );
          }

          logger(
            `Querying specific pool data for network: ${args.network}, address: ${args.address}, include: ${args.include}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "specific_pool_data_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get tokenInfoByAddress() {
    return new GameFunction({
      name: "token_info_by_address",
      description:
        "Allows users to query specific token info such as name, symbol, coingecko id etc. based on provided token contract address on a network.",
      args: [
        {
          name: "network",
          description: "The network of the token (e.g., eth).",
          type: "string",
        },
        {
          name: "address",
          description: "The token contract address.",
          type: "string",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.network || !args.address) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "network and address are required for querying token info by address"
            );
          }

          logger(
            `Querying token info by address for network: ${args.network} and address: ${args.address}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "token_info_by_address_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get tokenPriceByAddresses() {
    return new GameFunction({
      name: "token_price_by_addresses",
      description:
        "Allows users to get token price based on the provided token contract addresses on a network. Users can also include additional data such as market cap and 24hr volume.",
      args: [
        {
          name: "network",
          description: "The network of the tokens (e.g., eth).",
          type: "string",
        },
        {
          name: "addresses",
          description: "Comma-separated token contract addresses.",
          type: "string",
        },
        {
          name: "include_market_cap",
          description:
            "Whether to include market capitalization in the response.",
          type: "boolean",
          default: false,
        },
        {
          name: "include_24hr_vol",
          description: "Whether to include 24hr volume in the response.",
          type: "boolean",
          default: false,
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.network || !args.addresses) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "network and addresses are required for querying token price by addresses"
            );
          }

          logger(
            `Querying token price by addresses for network: ${args.network} and addresses: ${args.addresses}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "token_price_by_addresses_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get topGainersLosersConfig() {
    return new GameFunction({
      name: "top_gainers_losers",
      description:
        "Allows users to query the top 30 coins with the largest price gain and loss by a specific time duration.",
      args: [
        {
          name: "vs_currency",
          description: "Target currency of coins (e.g., usd).",
          type: "string",
        },
        {
          name: "duration",
          description: "Filter result by time range (Default value: 24h).",
          type: "string",
        },
        {
          name: "top_coins",
          description:
            "Filter result by market cap ranking (top 300 to 1000) or all coins (including coins that do not have market cap) (Default value: 1000).",
          type: "string",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.vs_currency) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "vs_currency is required for querying top gainers and losers"
            );
          }

          logger(
            `Querying top gainers and losers for vs_currency: ${args.vs_currency}, duration: ${args.duration}, and top_coins: ${args.top_coins}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "top_gainers_losers_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get trendingPoolsByNetwork() {
    return new GameFunction({
      name: "trending_pools_by_network",
      description:
        "Allows users to query the trending pools based on the provided network.",
      args: [
        {
          name: "network",
          description: "The network for which to query the trending pools.",
          type: "string",
        },
        {
          name: "include",
          description:
            "Attributes to include, comma-separated if more than one.",
          type: "string",
          default: "base_token",
          enum: ["base_token", "quote_token", "dex"],
        },
        {
          name: "page",
          description: "Page number of results to show.",
          type: "integer",
          default: 1,
        },
        {
          name: "duration",
          description: "Duration in hours to sort trending list by.",
          type: "string",
          default: "24h",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.network) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "network is required for querying trending pools by network"
            );
          }

          logger(
            `Querying trending pools by network for network: ${args.network}, include: ${args.include}, page: ${args.page}, duration: ${args.duration}`
          );

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "trending_pools_by_network_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get trendingPoolsList() {
    return new GameFunction({
      name: "trending_pools_list",
      description:
        "Allows users to query the list of trending pools based on various networks.",
      args: [
        {
          name: "include",
          description:
            "Attributes to include, comma-separated if more than one to include. Available values: base_token, quote_token, dex, network. Example: base_token or base_token,dex",
          type: "string",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          // Validate required arguments
          if (!args.include) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "include is required for querying trending pools list"
            );
          }

          logger(`Querying trending pools list with include: ${args.include}`);

          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "trending_pools_list_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }

  get trendingSearchList() {
    return new GameFunction({
      name: "trending_search_list",
      description:
        "Fetches the top trending coins, NFTs, and categories on CoinGecko in the last 24 hours.",
      args: [] as const,
      executable: async (args, logger) => {
        try {
          logger(
            "Fetching the top trending coins, NFTs, and categories on CoinGecko in the last 24 hours."
          );
          return maopVisitor(
            this.apiKey,
            this.baseApiUrl,
            "trending_search_list_tool",
            args,
            logger
          );
        } catch (e: any) {
          return exceptionHandler(e, logger);
        }
      },
    });
  }
}

export default CoingeckoMAOPPlugin;
