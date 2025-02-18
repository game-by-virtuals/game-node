import { registerVoter, checkColdWalletReward, encrypt, submitVote } from "mind-randgen-sdk";
import { formatEther } from "ethers";
import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import cache from "./cache";

interface IMindNetworkPluginOptions {
  id?: string;
  name?: string;
  description?: string;
}

const voteIntervalSeconds = 600;

class MindNetworkPlugin {
  private id: string;
  private name: string;
  private description: string;

  constructor(options: IMindNetworkPluginOptions) {
    this.id = options.id || "mind_network_voter";
    this.name = options.name || "Mind Network Voter";
    this.description =
      options.description ||
      "The Mind Network plugin empowers users to participate in secure, privacy-preserving voting on the Mind Network.";
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
        this.registerAsVoter,
        this.getVotingReward,
        this.fheEncrypt,
        this.submitVote,
      ],
      getEnvironment: data?.getEnvironment,
    });
  }

  get registerAsVoter() {
    return new GameFunction({
      name: "register_as_voter",
      description: "Register as a voter so that user can vote in Mind Network Randgen Hub.",
      args: [] as const,
      executable: async (_, logger) => {
        try {
          await registerVoter();
          const successMessage = "You have registered successfully.";
          logger(successMessage);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            successMessage
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `An error occurred while fetching voting reward from Mind Network: ${e.message || "Unknown error"}`
          );
        }
      },
    });
  }

  get getVotingReward() {
    return new GameFunction({
      name: "get_voting_reward",
      description: "Get user's voting reward amount earned via voting in Mind Network.",
      args: [] as const,
      hint: "This function will return the voting reward amount in Mind Network.",
      executable: async (_, logger) => {
        try {
          const rewardAmount = await checkColdWalletReward();
          const successMessage = `Your voting reward amount is ${formatEther(rewardAmount)} vFHE.`;
          logger(successMessage);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            successMessage
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `An error occurred while fetching voting reward from Mind Network: ${e.message || "Unknown error"}`
          );
        }
      },
    });
  }

  get fheEncrypt() {
    return new GameFunction({
      name: "fhe_encrypt",
      description: "Encrypt a number of user's choice with FHE.",
      args: [
        {
          name: "numberToEncrypt",
          description:
            "The numberToEncrypt corresponds to the number that user wants to encrypt before voting.",
          type: "number",
        },
      ] as const,
      executable: async (args, logger) => {
        if (!args.numberToEncrypt) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Number to encrypt is required"
          );
        }
        try {
          const cypherUrl = await encrypt(Math.floor(Number(args.numberToEncrypt)) % 256);
          cache.latestEncryptedNumber = cypherUrl;
          const message = `Encryption is successful. Your encrypted number is available: ${cypherUrl}.`;
          logger(message);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            message
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `An error occurred while encrypting number with FHE: ${e.message || "Unknown error"}`
          );
        }
      },
    });
  }

  get submitVote() {
    return new GameFunction({
      name: "submit_vote",
      description: "Submit the encrypted number as a vote to Mind Network.",
      args: [] as const,
      executable: async (args, logger) => {
        try {
          if (!cache.latestEncryptedNumber) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "You need to encrypt a number of your choice first. Tell me your number of choice for FHE encryption."
            );
          }

          const voteInterval = Math.floor((Date.now() - cache.lastVoteTs) / 1000);
          if (voteInterval < voteIntervalSeconds) {
            const message = `You are voting too fast. Please wait for ${voteIntervalSeconds - voteInterval} seconds to try again.`;
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              message
            );
          }

          await submitVote(cache.latestEncryptedNumber);
          cache.lastVoteTs = Date.now();
          const message = "You vote has been submitted successfully.";
          logger(message);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            message
          );
        } catch (e: any) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `An error occurred while submit FHE vote to Mind Network: ${e.message || "Unknown error"}`
          );
        }
      },
    });
  }

}

export default MindNetworkPlugin;
