import { GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";

async function initializeAcpPlugin() {
  return new AcpPlugin({
    apiKey: process.env.GAME_DEV_API_KEY ?? "",
    acpTokenClient: await AcpToken.build(
      `0x${process.env.WHITELISTED_WALLET_PRIVATE_KEY?.replace('0x', '') ?? ""}`,
      parseInt(process.env.SESSION_ENTITY_KEY_ID ?? ""),
      `0x${process.env.AGENT_WALLET_ADDRESS?.replace('0x', '') ?? ""}`
    ),
  });
}

async function initializeFunctions() {
  const acpPlugin = await initializeAcpPlugin();

  return {
    aixbtFunction: new GameFunction({
      name: "get_top_crypto_projects",
      description: "a function to get and return top crypto projects in the market. Use this when producing service ",
      args: [
        {
            name: "description",
            type: "string",
            description: "A description of the top crypto projects",
          },
          {
            name: "jobId",
            type: "string",
            description: "Job that your are responding to.",
            hint: "look into jobId field in the state to find the job you are responding to"
          },
          {
            name: "reasoning",
            type: "string",
            description: "The reasoning of the tweet",
          }
      ] as const,
      executable: async (args) => {
        
        try {
          const response = await fetch('https://api.aixbt.tech/v1/projects?limit=2', {
            headers: {
              'x-api-key': process.env.AIXBT_API_KEY || '',
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch top crypto projects');
          }
          const data = await response.json();

          // deliver job 

          const state = await acpPlugin.getAcpState();

          const job = state.jobs.active.asASeller.find(
            (j) => j.jobId === +args.jobId!
          );


          console.log(`
            ============================
            data: ${JSON.stringify(data)}

            state: ${JSON.stringify(state)}
            
            job: ${JSON.stringify(job)}
            ============================
            `);


          if (!job) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              `Job ${args.jobId} is invalid. Should only respond to active as a seller job.`
            );
          }

          const finalProduct = JSON.stringify(data.data[0].analysis);

          try {
            acpPlugin.addProduceItem({
              jobId: +args.jobId!,
              type: "url",
              value: "deBridge remains a leading cross-chain DeFi infrastructure project connecting 20 blockchains through 190 routes. The platform provides real-time crypto asset swaps with fast transfers, guaranteed rates, and deep liquidity. Key metrics include $1.7B volume in January 2025, $8B+ total processed volume, and $17M+ treasury. Their native token $DBR has a ~$50M market cap. The platform serves 51K+ users with features including cross-chain messaging, native asset bridging, and multi-chain integrations. Recent developments include the launch of ARB Horizon growth program.",
            });
            console.log("finalProduct: ", finalProduct)
            console.log(`Successfully produced item for job ${args.jobId}`);
          } catch (error) {
            console.error(`Failed to produce item for job ${args.jobId}:`, error);
            throw error;  // or handle the error appropriately
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify(data)
          );
        } catch (error) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Error fetching top crypto projects: ${error}`
          );
        }

      }
    }),
    translateAPIResonse: new GameFunction({
      name: "translate_api_response",
      description: "translate api response to signal(buy or dont buy)",
      args: [
        {
          name: "analysis",
          description: "analysis of the project, found in the api response under the key 'analysis'",
          type: "string"
        }
      ] as const,
      executable: async (args) => {
        const request = `based on ${args.analysis}, should I buy or not?`
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(request)
        );
      }
    }),
    getSignal: new GameFunction({
      name: "get_signal",
      description: "get the signal(buy or dont buy)",
      args: [
        {
          name: "signal",
          description: "signal(buy or dont buy)",
          type: "string"
        }
      ] as const,
      executable: async (args) => {
        console.log(args.signal)
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(args)
        );
      }
    })
  };
}

export default initializeFunctions;