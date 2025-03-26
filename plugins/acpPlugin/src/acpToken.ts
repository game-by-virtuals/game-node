import {
  Address,
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import ACP_TOKEN_ABI from "./acpTokenAbi";
import { privateKeyToAccount } from "viem/accounts";
import { AcpJobPhases } from "./interface";

export enum MemoType {
  MESSAGE,
  CONTEXT_URL,
  IMAGE_URL,
  VOICE_URL,
  OBJECT_URL,
  TXHASH,
}

export interface IMemo {
  content: string;
  memoType: MemoType;
  isSecured: boolean;
  nextPhase: number;
  jobId: number;
  numApprovals: number;
  sender: string;
}

export interface IJob {
  id: number;
  client: string;
  provider: string;
  budget: bigint;
  amountClaimed: number;
  phase: AcpJobPhases;
  memoCount: number;
  expiredAt: number;
  evaluatorCount: number;
}

export type JobResult = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number
];

export class AcpToken {
  private publicClient;
  private privateClient;

  constructor(
    walletPrivateKey: Address,
    chain: typeof base | typeof baseSepolia,
    private contractAddress: Address = "0x5e4ee2620482f7c4fee12bf27b095e48d441f5cf",
    private virtualsTokenAddress: Address = "0xbfAB80ccc15DF6fb7185f9498d6039317331846a"
  ) {
    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    this.privateClient = createWalletClient({
      chain,
      account: privateKeyToAccount(walletPrivateKey),
      transport: http(),
    });
  }

  getContractAddress() {
    return this.contractAddress;
  }

  getWalletAddress() {
    return this.privateClient.account.address;
  }

  async createJob(
    providerAddress: string,
    expireAt: Date
  ): Promise<{ txHash: string; jobId: number }> {
    try {
      const { request, result } = await this.publicClient.simulateContract({
        account: this.privateClient.account,
        address: this.contractAddress,
        abi: ACP_TOKEN_ABI,
        functionName: "createJob",
        args: [providerAddress, Math.floor(expireAt.getTime() / 1000)],
      });

      const txHash = await this.privateClient.writeContract(request);

      await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      return { txHash, jobId: Number(result) };
    } catch (error) {
      console.error(error);
      throw new Error("Failed to create job");
    }
  }

  async approveAllowance(priceInWei: bigint) {
    const approvalRequest = await this.publicClient.simulateContract({
      account: this.privateClient.account,
      address: this.virtualsTokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [this.contractAddress, priceInWei],
    });

    const txHash = await this.privateClient.writeContract(
      approvalRequest.request
    );

    await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    return txHash;
  }

  async createMemo(
    jobId: number,
    content: string,
    type: MemoType,
    isSecured: boolean,
    nextPhase: number
  ): Promise<{ txHash: Address; memoId: number }> {
    let retries = 3;
    while (retries > 0) {
      try {
        const { request, result } = await this.publicClient.simulateContract({
          account: this.privateClient.account,
          address: this.contractAddress,
          abi: ACP_TOKEN_ABI,
          functionName: "createMemo",
          args: [jobId, content, type, isSecured, nextPhase],
        });

        const txHash = await this.privateClient.writeContract(request);

        return { txHash, memoId: Number(result) };
      } catch (error) {
        console.error(`failed to create memo ${jobId} ${content} ${error}`);
        retries -= 1;
        await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
      }
    }

    throw new Error("Failed to create memo");
  }

  async signMemo(memoId: number, isApproved: boolean, reason?: string) {
    let retries = 3;
    while (retries > 0) {
      try {
        const { request } = await this.publicClient.simulateContract({
          account: this.privateClient.account,
          address: this.contractAddress,
          abi: ACP_TOKEN_ABI,
          functionName: "signMemo",
          args: [memoId, isApproved, reason],
        });

        const txHash = await this.privateClient.writeContract(request);

        await this.publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        return txHash;
      } catch (error) {
        console.error(`failed to sign memo ${error}`);
        retries -= 1;
        await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
      }
    }

    throw new Error("Failed to create memo");
  }

  async setBudget(jobId: number, budget: bigint) {
    try {
      const { request } = await this.publicClient.simulateContract({
        account: this.privateClient.account,
        address: this.contractAddress,
        abi: ACP_TOKEN_ABI,
        functionName: "setBudget",
        args: [jobId, budget],
      });

      const txHash = await this.privateClient.writeContract(request);

      await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      return txHash;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to set budget");
    }
  }

  async getJob(jobId: number): Promise<IJob | undefined> {
    try {
      const jobData = (await this.publicClient.readContract({
        address: this.contractAddress,
        abi: ACP_TOKEN_ABI,
        functionName: "jobs",
        args: [jobId],
      })) as JobResult;

      if (!jobData) {
        return;
      }

      const [
        id,
        client,
        provider,
        budget,
        amountClaimed,
        phase,
        memoCount,
        expiredAt,
        evaluatorCount,
      ] = jobData;

      return {
        id,
        client,
        provider,
        budget: BigInt(budget),
        amountClaimed: Number(amountClaimed),
        phase: Number(phase),
        memoCount: Number(memoCount),
        expiredAt: Number(expiredAt),
        evaluatorCount: Number(evaluatorCount),
      };
    } catch (error) {
      console.error(error);
      throw new Error("Failed to get job");
    }
  }

  async getMemoByJob(
    jobId: number,
    memoType?: MemoType
  ): Promise<IMemo | undefined> {
    try {
      const memos = (await this.publicClient.readContract({
        address: this.contractAddress,
        abi: ACP_TOKEN_ABI,
        functionName: "getAllMemos",
        args: [jobId],
      })) as IMemo[];

      if (memoType) {
        return memos.filter((m) => m.memoType === memoType).pop();
      } else {
        return memos[memos.length - 1];
      }
    } catch (error) {
      console.error(error);
      throw new Error("Failed to get memo");
    }
  }

  async getMemosForPhase(
    jobId: number,
    phase: AcpJobPhases,
    targetPhase: AcpJobPhases
  ): Promise<IMemo | undefined> {
    try {
      const memos = (await this.publicClient.readContract({
        address: this.contractAddress,
        abi: ACP_TOKEN_ABI,
        functionName: "getMemosForPhase",
        args: [jobId, phase],
      })) as IMemo[];

      const targetMemos = memos.filter((m) => m.nextPhase === targetPhase);

      if (targetMemos) {
        return targetMemos[targetMemos.length - 1];
      } else {
        return;
      }
    } catch (error) {
      console.error(error);
      throw new Error("Failed to get memos");
    }
  }
}
