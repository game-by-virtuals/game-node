import { Address, encodeFunctionData, erc20Abi, fromHex } from "viem";
import ACP_TOKEN_ABI from "./acpTokenAbi";
import { AcpJobPhases } from "./interface";
import {
  createModularAccountV2Client,
  ModularAccountV2Client,
} from "@account-kit/smart-contracts";
import { LocalAccountSigner, SmartAccountSigner } from "@aa-sdk/core";
import { alchemy, baseSepolia } from "@account-kit/infra";

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
  private _sessionKeyClient: ModularAccountV2Client | undefined;

  private chain = baseSepolia;
  private contractAddress: Address =
    "0x2422c1c43451Eb69Ff49dfD39c4Dc8C5230fA1e6";
  private virtualsTokenAddress: Address =
    "0xbfAB80ccc15DF6fb7185f9498d6039317331846a";

  constructor(
    private walletPrivateKey: Address,
    private sessionEntityKeyId: number,
    private agentWalletAddress: Address
  ) {}

  static async build(
    walletPrivateKey: Address,
    sessionEntityKeyId: number,
    agentWalletAddress: Address
  ) {
    const acpToken = new AcpToken(
      walletPrivateKey,
      sessionEntityKeyId,
      agentWalletAddress
    );

    await acpToken.init();

    return acpToken;
  }

  async init() {
    const sessionKeySigner: SmartAccountSigner =
      LocalAccountSigner.privateKeyToAccountSigner(this.walletPrivateKey);

    this._sessionKeyClient = await createModularAccountV2Client({
      chain: this.chain,
      transport: alchemy({
        rpcUrl: "https://alchemy-proxy.virtuals.io/api/proxy/rpc",
      }),
      signer: sessionKeySigner,
      policyId: "0f2ca493-af82-41cf-99a6-8534d668f160",
      accountAddress: this.agentWalletAddress,
      signerEntity: {
        entityId: this.sessionEntityKeyId,
        isGlobalValidation: true,
      },
    });
  }

  get sessionKeyClient() {
    if (!this._sessionKeyClient) {
      throw new Error("Session key client not initialized");
    }

    return this._sessionKeyClient;
  }

  getContractAddress() {
    return this.contractAddress;
  }

  getWalletAddress() {
    return this.agentWalletAddress;
  }

  private async getJobId(hash: Address) {
    const result = await this.sessionKeyClient.getUserOperationReceipt(hash);

    if (!result) {
      throw new Error("Failed to get user operation receipt");
    }

    const contractLogs = result.logs.find(
      (log: any) =>
        log.address.toLowerCase() === this.contractAddress.toLowerCase()
    ) as any;

    if (!contractLogs) {
      throw new Error("Failed to get contract logs");
    }

    return fromHex(contractLogs.data, "number");
  }

  async createJob(
    providerAddress: string,
    expireAt: Date
  ): Promise<{ txHash: string; jobId: number }> {
    try {
      const data = encodeFunctionData({
        abi: ACP_TOKEN_ABI,
        functionName: "createJob",
        args: [
          providerAddress,
          providerAddress,
          Math.floor(expireAt.getTime() / 1000),
        ],
      });

      const { hash } = await this.sessionKeyClient.sendUserOperation({
        uo: {
          target: this.contractAddress,
          data: data,
        },
      });

      const result =
        await this.sessionKeyClient.waitForUserOperationTransaction({
          hash,
        });

      const jobId = await this.getJobId(hash);

      return { txHash: hash, jobId: jobId };
    } catch (error) {
      console.error(error);
      throw new Error("Failed to create job");
    }
  }

  async approveAllowance(priceInWei: bigint) {
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [this.contractAddress, priceInWei],
    });

    const { hash } = await this.sessionKeyClient.sendUserOperation({
      uo: {
        target: this.virtualsTokenAddress,
        data: data,
      },
    });

    await this.sessionKeyClient.waitForUserOperationTransaction({
      hash,
    });

    return hash;
  }

  async createMemo(
    jobId: number,
    content: string,
    type: MemoType,
    isSecured: boolean,
    nextPhase: number
  ): Promise<Address> {
    let retries = 3;
    while (retries > 0) {
      try {
        const data = encodeFunctionData({
          abi: ACP_TOKEN_ABI,
          functionName: "createMemo",
          args: [jobId, content, type, isSecured, nextPhase],
        });

        const { hash } = await this.sessionKeyClient.sendUserOperation({
          uo: {
            target: this.contractAddress,
            data: data,
          },
        });

        await this.sessionKeyClient.waitForUserOperationTransaction({
          hash,
        });

        return hash;
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
        const data = encodeFunctionData({
          abi: ACP_TOKEN_ABI,
          functionName: "signMemo",
          args: [memoId, isApproved, reason],
        });

        const { hash } = await this.sessionKeyClient.sendUserOperation({
          uo: {
            target: this.contractAddress,
            data: data,
          },
        });

        await this.sessionKeyClient.waitForUserOperationTransaction({
          hash,
        });

        return hash;
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
      const data = encodeFunctionData({
        abi: ACP_TOKEN_ABI,
        functionName: "setBudget",
        args: [jobId, budget],
      });

      const { hash } = await this.sessionKeyClient.sendUserOperation({
        uo: {
          target: this.contractAddress,
          data: data,
        },
      });

      await this.sessionKeyClient.waitForUserOperationTransaction({
        hash,
      });

      return hash;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to set budget");
    }
  }

  async getJob(jobId: number): Promise<IJob | undefined> {
    try {
      const jobData = (await this.sessionKeyClient.readContract({
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
      const memos = (await this.sessionKeyClient.readContract({
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
      const memos = (await this.sessionKeyClient.readContract({
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
