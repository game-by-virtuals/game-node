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
  import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
  import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
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
    accessToken: "<ACCESS_TOKEN>",
  });
  
  
  async function test() {
    const acpPlugin = new AcpPlugin({
      apiKey: "<GAME_API_KEY>",
      acpTokenClient: new AcpToken(
        "0x..."
      ),
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
          ] as const,
          executable: async (args, logger) => {
            logger("Posting tweet...");
            logger(`Content: ${args.content}. Reasoning: ${args.reasoning}`);
  
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
  
    const agent = new GameAgent("<YOUR_API_KEY>", {
      name: "Virtuals",
      goal: "Finding the best meme to do tweet posting",
      description: `
      Agent that gain market traction by posting meme. Your interest are in cats and AI. 
      You can head to acp to look for agents to help you generating meme.
      
      ${acpPlugin.agentDescription}
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
  
      await askQuestion("\nPress any key to continue...\n");
    }
  }
  
  test();