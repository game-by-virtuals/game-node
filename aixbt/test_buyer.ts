import {
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
    GameAgent,
    GameFunction,
    GameWorker,
  } from "@virtuals-protocol/game";
  import * as readline from "readline";
  // import AcpPlugin from "./acpPlugin";
  // import { AcpToken } from "./acpToken";
  import { baseSepolia } from "viem/chains";
  import AcpPlugin, { 
    AcpToken, 
    EvaluateResult
  } from "@virtuals-protocol/game-acp-plugin";
  import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
  import axios from "axios";
  
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
    accessToken: "apt-f347af8d1fff9255848428e9ba78ecab",
  });

  const onEvaluate = async (deliverables: any): Promise<EvaluateResult> => {
    return new EvaluateResult(true, "This is a test reasoning");
  };
  
  async function test() {
    const acpPlugin = new AcpPlugin({
      apiKey: "apt-429190c02ee424a00c6d9b97c0e38c65",
      acpTokenClient: await AcpToken.build(
        "0x57757f00a436da9ec0c0d99ea4e03ace236b014fcbcfa0134fb2c676ca3b44a1",
        2,
        "0x5003D33624DB6287BD6Da69efe49240Df8099fD8"        
      ),
      onEvaluate: onEvaluate,
      // twitterClient: gameTwitterClient,
    });
  
    const coreWorker = new GameWorker({
      id: "core-worker",
      name: "Core Worker",
      description: "This worker is to post tweet",
      functions: [
        new GameFunction({
          name: "post_tweet",
          description: "This function is to post tweet",
          args: [
            {
              name: "content",
              type: "string",
              description: "The content of the tweet",
            },
            {
              name: "reasoning",
              type: "string",
              description: "The reasoning of the tweet",
            },
            {
              name: "serviceRequirements",
              type: "string",
              description: "Detailed specifications for service-based items, only needed if the seller's catalog specifies service requirements. For marketing materials, provide a clear image generation prompt describing the exact visual elements, composition, and style. Come up with your own creative prompt that matches your needs - don't copy the example (e.g. '3 lemons cut in half arranged around a tall glass filled with golden lemonade, soft natural lighting, white background'). Can be left empty for items that don't require specifications.",
            },
          ] as const,
          executable: async (args, logger) => {
            logger("Posting tweet...");
            logger(`Content: ${args.content}. Reasoning: ${args.reasoning}`);
  
            console.log("OUTPUT: ", new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              "Tweet has been posted"
            ))
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              "Tweet has been posted"
            );
          },
        }),
      ],
      getEnvironment: async () => {
        return acpPlugin.getAcpState();
      },
    });
  
    const agent = new GameAgent("apt-e117491ca835429c897fc7e13faa84f8", {
      name: "John_agent",
      goal: "Finding the best alpha agent to provide with best crypto project picks, buy from aixbt_agent_test agent",
      description: `
        Agent focused on discovering and partnering with the most skilled alpha-generating agents in the crypto space. 
        You seek out agents who can provide high-quality analysis and insights on promising crypto projects: aixbt_agent_test agent.
        This is the service requirements: Get top 1 project pick from aixbt_agent_test agent to invest in& only look for aixbt_agent_test agent.
        ${acpPlugin.agentDescription}
        if you have received deliverable or products, make it a priority to evaluate it and approve it or complete it.
        `,
      workers: [coreWorker, acpPlugin.getWorker()],
      getAgentState: () => {
        return acpPlugin.getAcpState();
      },
    });
  
    await agent.init();
  
    while (true) {
      await agent.step({
        verbose: true,
      });
  
      // await askQuestion("\nPress any key to continue...\n");
      console.log('\n Waiting for 1 minute before next step...');
      await new Promise(resolve => setTimeout(resolve, 60 * 1000));
    }
  }
  
  test();
  