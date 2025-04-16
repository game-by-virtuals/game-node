import {
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
    GameAgent,
    GameFunction,
    GameWorker,
  } from "@virtuals-protocol/game";
  import * as readline from "readline";
  import { baseSepolia } from "viem/chains";
  import dotenv from "dotenv";

  import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
  import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
  
  dotenv.config();


  function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    return new Promise((resolve) =>
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
      })
    );
  }
  
  const gameTwitterClient = new GameTwitterClient({
    accessToken: "<ACCESS_TOKEN>",
  });
  
  async function test() {
    const acpPlugin = new AcpPlugin({
        apiKey: process.env.GAME_DEV_API_KEY ?? "",
        acpTokenClient: await AcpToken.build(
          `0x${process.env.WHITELISTED_WALLET_PRIVATE_KEY?.replace('0x', '') ?? ""}`,
          parseInt(process.env.SESSION_ENTITY_KEY_ID ?? ""),
          `0x${process.env.AGENT_WALLET_ADDRESS?.replace('0x', '') ?? ""}`
        ),
      });
  
    const coreWorker = new GameWorker({
      id: "core-worker",
      name: "Core Worker",
      description:
        "Aixbt worker that will get the top crypto projects and return the signal(buy or dont buy)",
      functions: [
        new GameFunction({
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
                    type: "text",
                    value: finalProduct,
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
          })
      ],
      getEnvironment: async () => {
        return acpPlugin.getAcpState();
      },
    });
  
    const agent = new GameAgent(process.env.GAME_API_KEY ?? "", {
        name: "Aixbt Agent",
        goal: `To provide top crypto projects as a service/product. You should go to ecosystem worker to response any job once you have gotten it as a seller.`,
        description: `
    AIxBT is an AI crypto oracle that provides top crypto projects in the market.
    
    
    Its goal is to provide top crypto projects as a service/product. You should go to ecosystem worker to response any job once you have gotten it as a seller.
    ${acpPlugin.agentDescription}`,
        workers: [coreWorker, acpPlugin.getWorker()],
        getAgentState: async () => {
          return await acpPlugin.getAcpState();
        },
      });
  
    await agent.init();
  
    // Temporarily store the original console.log
    const originalLog = console.log;
    
    // Override console.log with our formatted version
    console.log = function(message: any) {
      if (typeof message === 'string') {
        // Handle State logs
        if (message.includes('State:')) {
          const label = message.split(':')[0];
          try {
            const jsonStr = message.substring(message.indexOf(':') + 1);
            const data = JSON.parse(jsonStr);
            
            console.log(`\n${label}:`);
            console.log('-'.repeat(50));
            console.dir(data, { 
              depth: null,
              colors: true,
              compact: false,
              sorted: true
            });
          } catch (e) {
            originalLog.call(console, message);
          }
        // Handle function status logs
        } else if (message.includes('Function status')) {
          console.log('\nFunction Status:');
          console.log('-'.repeat(50));
          try {
            const jsonStr = message.substring(message.indexOf(']:') + 2);
            const data = JSON.parse(jsonStr);
            console.dir(data, { depth: null, colors: true, compact: false, sorted: true });
          } catch (e) {
            originalLog.call(console, message);
          }
        // Handle data/state/job debug logs
        } else if (message.includes('============================')) {
          console.log('\nDebug Information:');
          console.log('-'.repeat(50));
          const lines = message.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            if (line.includes(':')) {
              const [key, value] = line.split(':').map(s => s.trim());
              try {
                const data = JSON.parse(value);
                console.log(`\n${key}:`);
                console.dir(data, { depth: null, colors: true, compact: false, sorted: true });
              } catch (e) {
                originalLog.call(console, line);
              }
            }
          });
        // Handle finalProduct and success messages
        } else if (message.startsWith('finalProduct: ')) {
          console.log('\nFinal Product:');
          console.log('-'.repeat(50));
          try {
            const data = message.substring('finalProduct: '.length);
            console.dir(JSON.parse(data), { 
              depth: null, 
              colors: true, 
              compact: false, 
              sorted: true 
            });
          } catch (e) {
            // If not JSON, print as plain text with nice formatting
            console.log(message.substring('finalProduct: '.length));
          }
        } else if (message.startsWith('Successfully produced')) {
          console.log('\n✅ ' + message);
        } else {
          originalLog.call(console, ...Array.from(arguments));
        }
      } else {
        originalLog.call(console, ...Array.from(arguments));
      }
    };
  
    while (true) {
      await agent.step({
        verbose: true,
      });
  
      console.log('\n Waiting for 1 minute before next step...');
      // 5 minutes = 5 * 60 * 1000 milliseconds
      await new Promise(resolve => setTimeout(resolve, 60 * 1000));
    }
  }
  
  test();
  