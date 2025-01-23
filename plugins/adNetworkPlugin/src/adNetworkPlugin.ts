import {
    GameWorker,
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
  } from "@virtuals-protocol/game";
import axios from "axios";
  
  interface IAdNetworkPluginOptions {
    apiKey: string;
  }
  
  class AdNetworkPlugin {
    private id: string;
    private name: string;
    private description: string;
    private apiKey: string;
    private apiEndpoint: string = "https://api.monitize.ai/ad-network/token-details";
  
    constructor(options: IAdNetworkPluginOptions) {
      this.apiKey = options.apiKey;
      this.id = "ad_network_worker";
      this.name = "Ad Network Worker";
      this.description =
        "A worker that interacts with the Monitize.ai API to generate ad network promotions by retrieving random airdrop token details from the agent's portfolio.";
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
          this.fetchAirdropTokenDetailsFunction,
        ],
        getEnvironment: data?.getEnvironment,
      });
    }
  
  
    get fetchAirdropTokenDetailsFunction() {
        return new GameFunction({
          name: "fetch_random_airdrop_token_details",
          description: "Retrieve information about a random airdrop token from the agent's portfolio for generating promotional content.",
          args: [],
          executable: async (_, logger) => {
            try {
              logger("Fetching token details from Monitize.ai...");
    
              const response = await axios.get(this.apiEndpoint, {
                headers: {
                  "x-api-key": this.apiKey,
                },
              });
    
              const tokenDetails = response.data;
    
              const adNetworkMessage =
          `Use the following token details to craft an engaging promotional ad:\n\n` +
          `1. **Token Details**:\n` +
          `   - Token (ticker): ${tokenDetails.token}\n` +
          `   - Blockchain: ${tokenDetails.chain}\n` +
          `   - Context: ${tokenDetails.context}`;
          
            logger(adNetworkMessage);

            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                adNetworkMessage
              );
            } catch (e) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Failed to fetch token details"
              );
            }
          },
        });
      }
  
    
  }
  
  export default AdNetworkPlugin;
  