import {
    GameWorker,
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
  } from "@virtuals-protocol/game";
  import axios from "axios";
  
  interface IAlchemyPluginOptions {
    id?: string;
    name?: string;
    description?: string;
    credentials: {
      apiKey: string;
    };
  }
  
  class AlchemyPlugin {
    private id: string;
    private name: string;
    private description: string;
    private apiKey: string;
    private baseUrl: string = "https://api.g.alchemy.com/data";
  
    constructor(options: IAlchemyPluginOptions) {
      this.id = options.id || "alchemy_worker";
      this.name = options.name || "Alchemy Worker";
      this.description =
        options.description ||
        "A worker that fetches on-chain data using the Alchemy API, including transaction history, tokens held (with metadata/prices), token balances, NFTs by wallet, and NFT contracts by wallet.";
      this.apiKey = options.credentials.apiKey;
  
      // Validate API key presence
      if (!this.apiKey) {
        throw new Error("Alchemy API key is required.");
      }
    }
  
    /**
     * Function to fetch transaction history for a wallet address.
     * Requires the wallet address and optionally a list of networks.
     */
    public get getTransactionHistoryFunction() {
      return new GameFunction({
        name: "get_transaction_history",
        description:
          "Fetches the transaction history for a given EVM address across specified blockchain networks using the Alchemy API. The supported networks include ETH (eth-mainnet) and BASE (base-mainnet), among others.",
        args: [
          {
            name: "address",
            description:
              "The EVM address to fetch transaction history for (e.g., 0x1E6E8695FAb3Eb382534915eA8d7Cc1D1994B152)",
            type: "string",
          },
          {
            name: "networks",
            description:
              'Array of networks to query the transaction history on (e.g., ["eth-mainnet", "base-mainnet"]). Defaults to ["eth-mainnet"] if not provided. Currently only supports eth-mainnet and base-mainnet.',
            type: "array",
          },
          {
            name: "limit",
            description:
              "Maximum number of transactions to return. Defaults to 25 if not provided. Maximum limit is 100.",
            type: "number",
          },
        ] as const,
        executable: async (args, logger) => {
          try {
            // Validate wallet address
            if (!args.address) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "An EVM/Wallet address is required."
              );
            }
            if (!/^0x[a-fA-F0-9]{40}$/.test(args.address)) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Invalid EVM/Wallet address format. Must be a valid EVM address."
              );
            }
  
            const networks = args.networks
              ? Array.isArray(args.networks)
                ? args.networks
                : JSON.parse(args.networks.replace(/'/g, '"'))
              : ["eth-mainnet"];
            const limit = args.limit ? parseInt(args.limit, 10) : 25;
  
            if (isNaN(limit) || limit <= 0) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Limit must be a positive number."
              );
            }
  
            logger(
              `Fetching transaction history for address: ${args.address} on networks: ${networks}`
            );
  
            const requestBody = {
              addresses: [
                {
                  address: args.address,
                  networks: networks,
                },
              ],
              limit: limit,
            };
  
            logger(`Request body: ${JSON.stringify(requestBody)}`);
  
            const response = await axios.post(
              `${this.baseUrl}/v1/${this.apiKey}/transactions/history/by-address`,
              requestBody,
              {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "x-app-id": "virtuals-plugin",
                },
              }
            );
  
            const result = response.data;
            logger(`Successfully fetched ${result.totalCount} transactions.`);
  
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              JSON.stringify({
                message: "Transaction history fetched successfully",
                data: result,
              })
            );
          } catch (e: any) {
            logger(`Error: ${e.message}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to fetch transaction history: ${e.response?.data?.error?.message || e.message}`
            );
          }
        },
      });
    }
  
    /**
     * Function to fetch tokens held by wallet.
     * Retrieves tokens held by one or multiple wallet addresses along with metadata and prices.
     * Note: This endpoint does not return the current token balances.
     */
    public get getTokensByWalletFunction() {
      return new GameFunction({
        name: "get_tokens_by_wallet",
        description:
          "Fetches tokens held by one or multiple wallet addresses using network and address pairs. This returns associated metadata and prices but does not include the current token balances.",
        args: [
          {
            name: "addresses",
            description:
              'A JSON string representing an array of objects with wallet address and networks pairs. Example: `[{"address": "0x1E6E8695FAb3Eb382534915eA8d7Cc1D1994B152", "networks": ["eth-mainnet", "base-mainnet"]}]`',
            type: "string",
          },
          {
            name: "withMetadata",
            description:
              "Boolean flag indicating if metadata should be returned. Defaults to true.",
            type: "boolean",
          },
          {
            name: "withPrices",
            description:
              "Boolean flag indicating if token prices should be returned. Defaults to true.",
            type: "boolean",
          },
        ] as const,
        executable: async (args, logger) => {
          try {
            if (!args.addresses) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Addresses parameter is required."
              );
            }
            let addresses;
            try {
              addresses =
                typeof args.addresses === "string"
                  ? JSON.parse(args.addresses)
                  : args.addresses;
              if (!Array.isArray(addresses)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Addresses parameter must be an array of address objects."
                );
              }
            } catch (error) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to parse addresses parameter. It should be a valid JSON array."
              );
            }
            
            for (const item of addresses) {
              if (!item.address || !/^0x[a-fA-F0-9]{40}$/.test(item.address)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  `Invalid wallet address format: ${item.address}`
                );
              }
              if (!item.networks || !Array.isArray(item.networks) || item.networks.length === 0) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Each address object must include a non-empty networks array."
                );
              }
            }
  
            const withMetadata =
              typeof args.withMetadata === "boolean" ? args.withMetadata : true;
            const withPrices =
              typeof args.withPrices === "boolean" ? args.withPrices : true;
  
            const requestBody = {
              addresses: addresses,
              withMetadata: withMetadata,
              withPrices: withPrices,
            };
  
            logger(
              `Fetching tokens by wallet with request body: ${JSON.stringify(requestBody)}`
            );
  
            const response = await axios.post(
              `${this.baseUrl}/v1/${this.apiKey}/assets/tokens/by-address`,
              requestBody,
              {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "x-app-id": "virtuals-plugin",
                },
              }
            );
  
            const result = response.data;
            logger(`Successfully fetched tokens data for wallets.`);
  
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              JSON.stringify({
                message: "Tokens by wallet fetched successfully",
                data: result,
              })
            );
          } catch (e: any) {
            logger(`Error: ${e.message}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to fetch tokens by wallet: ${e.response?.data?.error?.message || e.message}`
            );
          }
        },
      });
    }
  
    /**
     * Function to fetch token balances by wallet.
     * Retrieves current token balances for one or multiple wallet addresses using network and address pairs.
     * Returns a list of token balances with each item including the network and address.
     */
    public get getTokenBalancesByWalletFunction() {
      return new GameFunction({
        name: "get_token_balances_by_wallet",
        description:
          "Fetches current token balances for one or multiple wallet addresses using network and address pairs. Returns a list of token balances, each including the network and address.",
        args: [
          {
            name: "addresses",
            description:
              'A JSON string representing an array of objects with wallet address and networks pairs. Example: `[{"address": "0x1E6E8695FAb3Eb382534915eA8d7Cc1D1994B152", "networks": ["eth-mainnet", "base-mainnet"]}]`',
            type: "string",
          },
        ] as const,
        executable: async (args, logger) => {
          try {
            if (!args.addresses) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Addresses parameter is required."
              );
            }
            let addresses;
            try {
              addresses =
                typeof args.addresses === "string"
                  ? JSON.parse(args.addresses)
                  : args.addresses;
              if (!Array.isArray(addresses)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Addresses parameter must be an array of address objects."
                );
              }
            } catch (error) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to parse addresses parameter. It should be a valid JSON array."
              );
            }
            
            for (const item of addresses) {
              if (!item.address || !/^0x[a-fA-F0-9]{40}$/.test(item.address)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  `Invalid wallet address format: ${item.address}`
                );
              }
              if (!item.networks || !Array.isArray(item.networks) || item.networks.length === 0) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Each address object must include a non-empty networks array."
                );
              }
            }
  
            const requestBody = { addresses: addresses };
  
            logger(
              `Fetching token balances by wallet with request body: ${JSON.stringify(requestBody)}`
            );
  
            const response = await axios.post(
              `${this.baseUrl}/v1/${this.apiKey}/assets/tokens/balances/by-address`,
              requestBody,
              {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "x-app-id": "virtuals-plugin",
                },
              }
            );
            const result = response.data;
            logger(`Successfully fetched token balances for wallets.`);
  
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              JSON.stringify({
                message: "Token balances by wallet fetched successfully",
                data: result,
              })
            );
          } catch (e: any) {
            logger(`Error: ${e.message}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to fetch token balances by wallet: ${e.response?.data?.error?.message || e.message}`
            );
          }
        },
      });
    }
  
    /**
     * Function to fetch NFTs by wallet.
     * Retrieves all NFTs currently owned by one or multiple wallet addresses using network and address pairs.
     * Supports optional paging parameters and a flag to include metadata.
     */
    public get getNFTsByWalletFunction() {
      return new GameFunction({
        name: "get_nfts_by_wallet",
        description:
          "Retrieves all NFTs currently owned by one or multiple wallet addresses using network and address pairs. Supports optional paging parameters and a flag to include metadata.",
        args: [
          {
            name: "addresses",
            description:
              'A JSON string representing an array of objects with wallet address and networks pairs. Example: `[{"address": "0x1E6E8695FAb3Eb382534915eA8d7Cc1D1994B152", "networks": ["eth-mainnet", "base-mainnet", "matic-mainnet"]}]`',
            type: "string",
          },
          {
            name: "withMetadata",
            description:
              "Boolean flag indicating if metadata should be returned. Defaults to true.",
            type: "boolean",
          },
          {
            name: "pageKey",
            description: "Optional paging cursor for the response.",
            type: "string",
          },
          {
            name: "pageSize",
            description: "Optional number specifying the number of items per page.",
            type: "number",
          },
        ] as const,
        executable: async (args, logger) => {
          try {
            if (!args.addresses) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Addresses parameter is required."
              );
            }
            let addresses;
            try {
              addresses =
                typeof args.addresses === "string"
                  ? JSON.parse(args.addresses)
                  : args.addresses;
              if (!Array.isArray(addresses)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Addresses parameter must be an array of address objects."
                );
              }
            } catch (error) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to parse addresses parameter. It should be a valid JSON array."
              );
            }
            
            for (const item of addresses) {
              if (!item.address || !/^0x[a-fA-F0-9]{40}$/.test(item.address)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  `Invalid wallet address format: ${item.address}`
                );
              }
              if (!item.networks || !Array.isArray(item.networks) || item.networks.length === 0) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Each address object must include a non-empty networks array."
                );
              }
            }
  
            const withMetadata = typeof args.withMetadata === "boolean" ? args.withMetadata : true;
            const requestBody: any = {
              addresses: addresses,
              withMetadata: withMetadata,
            };
            if (args.pageKey) {
              requestBody.pageKey = args.pageKey;
            }
            if (args.pageSize) {
              requestBody.pageSize = parseInt(args.pageSize, 10);
            }
  
            logger(`Fetching NFTs by wallet with request body: ${JSON.stringify(requestBody)}`);
  
            const response = await axios.post(
              `${this.baseUrl}/v1/${this.apiKey}/assets/nfts/by-address`,
              requestBody,
              {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "x-app-id": "virtuals-plugin",
                },
              }
            );
            const result = response.data;
            logger(`Successfully fetched NFTs for wallets.`);
  
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              JSON.stringify({
                message: "NFTs by wallet fetched successfully",
                data: result,
              })
            );
          } catch (e: any) {
            logger(`Error: ${e.message}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to fetch NFTs by wallet: ${e.response?.data?.error?.message || e.message}`
            );
          }
        },
      });
    }
  
    /**
     * Function to fetch NFT contracts by wallet.
     * Retrieves all NFT contracts currently owned by one or multiple wallet addresses using network and address pairs.
     * This endpoint is supported on Ethereum and many L2s (e.g., Polygon, Arbitrum, Optimism, Base, World Chain, etc.)
     * and returns each NFT contract with associated metadata.
     */
    public get getNftContractsByWalletFunction() {
      return new GameFunction({
        name: "get_nft_contracts_by_wallet",
        description:
          "Retrieves all NFT contracts currently owned by one or multiple wallet addresses using network and address pairs. This endpoint is supported on Ethereum and many L2s and returns each NFT contract with associated metadata.",
        args: [
          {
            name: "addresses",
            description:
              'A JSON string representing an array of objects with wallet address and networks pairs. Example: `[{"address": "0x1E6E8695FAb3Eb382534915eA8d7Cc1D1994B152", "networks": ["eth-mainnet", "base-mainnet", "matic-mainnet"]}]`',
            type: "string",
          },
          {
            name: "withMetadata",
            description:
              "Boolean flag indicating if metadata should be returned. Defaults to true.",
            type: "boolean",
          },
        ] as const,
        executable: async (args, logger) => {
          try {
            if (!args.addresses) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Addresses parameter is required."
              );
            }
            let addresses;
            try {
              addresses =
                typeof args.addresses === "string"
                  ? JSON.parse(args.addresses)
                  : args.addresses;
              if (!Array.isArray(addresses)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Addresses parameter must be an array of address objects."
                );
              }
            } catch (error) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to parse addresses parameter. It should be a valid JSON array."
              );
            }
            
            for (const item of addresses) {
              if (!item.address || !/^0x[a-fA-F0-9]{40}$/.test(item.address)) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  `Invalid wallet address format: ${item.address}`
                );
              }
              if (!item.networks || !Array.isArray(item.networks) || item.networks.length === 0) {
                return new ExecutableGameFunctionResponse(
                  ExecutableGameFunctionStatus.Failed,
                  "Each address object must include a non-empty networks array."
                );
              }
            }
  
            const withMetadata = typeof args.withMetadata === "boolean" ? args.withMetadata : true;
            const requestBody = {
              addresses: addresses,
              withMetadata: withMetadata,
            };
  
            logger(`Fetching NFT contracts by wallet with request body: ${JSON.stringify(requestBody)}`);
  
            const response = await axios.post(
              `${this.baseUrl}/v1/${this.apiKey}/assets/nfts/contracts/by-address`,
              requestBody,
              {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "x-app-id": "virtuals-plugin",
                },
              }
            );
            const result = response.data;
            logger(`Successfully fetched NFT contracts for wallets.`);
  
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              JSON.stringify({
                message: "NFT contracts by wallet fetched successfully",
                data: result,
              })
            );
          } catch (e: any) {
            logger(`Error: ${e.message}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Failed to fetch NFT contracts by wallet: ${e.response?.data?.error?.message || e.message}`
            );
          }
        },
      });
    }
  
    /**
     * Returns the GameWorker instance with all defined API functions.
     */
    public getWorker(data?: {
      id?: string;
      functions?: GameFunction<any>[];
      getEnvironment?: () => Promise<Record<string, any>>;
    }): GameWorker {
      const functions = data?.functions || [
        this.getTransactionHistoryFunction,
        this.getTokensByWalletFunction,
        this.getTokenBalancesByWalletFunction,
        this.getNFTsByWalletFunction,
        this.getNftContractsByWalletFunction,
      ];
      return new GameWorker({
        id: this.id,
        name: this.name,
        description: this.description,
        functions,
        getEnvironment: data?.getEnvironment,
      });
    }
  }
  
  export default AlchemyPlugin;
  