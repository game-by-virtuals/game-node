import { AcpAgent, AcpJobPhases, AcpState } from "./interface";
import { AcpToken, MemoType } from "./acpToken";
import { parseEther } from "viem";

export class AcpClient {
  private baseUrl = "https://sdk-dev.game.virtuals.io/acp";

  constructor(
    private apiKey: string,
    private acpToken: AcpToken,
    private agentRepoUrl?: string
  ) {}

  get walletAddress() {
    return this.acpToken.getWalletAddress();
  }

  get acpTokenClient() {
    return this.acpToken;
  }

  async getState(): Promise<AcpState> {
    const response = await this.request(`states/${this.walletAddress}`, {
      method: "get",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get state: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as AcpState;
  }

  async browseAgents(query: string, cluster?: string) {
    const baseUrl =
      this.agentRepoUrl || "https://acpx-staging.virtuals.io/api/agents";
    let url = `${baseUrl}?search=${encodeURIComponent(query)}`;

    if (cluster) {
      url += `&filters[cluster]=${encodeURIComponent(cluster)}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to browse agents: ${response.status} ${response.statusText}`
      );
    }

    const responseJson = await response.json();
    return (responseJson.data as AcpAgent[]).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      walletAddress: agent.walletAddress,
      twitterHandler: agent.twitterHandle,
      offerings: agent.offerings,
    }));
  }

  async createJob(
    providerAddress: string,
    evaluatorAddress: string,
    price: number,
    jobDescription: string,
    expiredAt: Date
  ) {
    const { jobId } = await this.acpToken.createJob(
      providerAddress,
      evaluatorAddress,
      expiredAt
    );

    const payload = {
      jobId: jobId,
      clientAddress: this.walletAddress,
      providerAddress: providerAddress,
      evaluatorAddress: evaluatorAddress,
      description: jobDescription,
      price: price,
      expiredAt: expiredAt.toISOString(),
    };

    const response = await this.request(``, {
      method: "post",
      body: JSON.stringify(payload),
    });

    const memoResponse = await this.acpToken.createMemo(
      jobId,
      jobDescription,
      MemoType.MESSAGE,
      false,
      AcpJobPhases.NEGOTIOATION
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create job: ${response.status} ${response.statusText}`
      );
    }

    return jobId;
  }

  async responseJob(
    jobId: number,
    accept: boolean,
    memoId: number,
    reasoning: string
  ) {
    if (accept) {
      await this.acpToken.signMemo(memoId, accept, reasoning);

      const transactionResult = await this.acpToken.createMemo(
        jobId,
        `Job ${jobId} accepted. ${reasoning}`,
        MemoType.MESSAGE,
        false,
        AcpJobPhases.TRANSACTION
      );

      return transactionResult;
    } else {
      const transactionResult = await this.acpToken.createMemo(
        jobId,
        `Job ${jobId} rejected. ${reasoning}`,
        MemoType.MESSAGE,
        false,
        AcpJobPhases.REJECTED
      );

      return transactionResult;
    }
  }

  async makePayment(
    jobId: number,
    amount: number,
    memoId: number,
    reason: string
  ) {
    const txHash = await this.acpToken.setBudget(
      jobId,
      parseEther(amount.toString())
    );

    const approvalTxHash = await this.acpToken.approveAllowance(
      parseEther(amount.toString())
    );

    const signedMemoTxHash = await this.acpToken.signMemo(memoId, true, reason);

    const transactionResult = await this.acpToken.createMemo(
      jobId,
      `Payment of ${amount} made. ${reason}`,
      MemoType.MESSAGE,
      false,
      AcpJobPhases.EVALUATION
    );
  }

  async deliverJob(jobId: number, deliverable: string) {
    const result = await this.acpToken.createMemo(
      jobId,
      deliverable,
      MemoType.MESSAGE,
      false,
      AcpJobPhases.COMPLETED
    );
  }

  async addTweet(jobId: number, tweetId: string, content: string) {
    const payload = {
      tweetId,
      content,
    };

    const response = await this.request(
      `${jobId}/tweets/${this.walletAddress}`,
      {
        method: "post",
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to add tweet: ${response.status} ${response.statusText}`
      );
    }
  }

  async resetState(walletAddress: string) {
    const response = await this.request(`states/${walletAddress}`, {
      method: "delete",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to reset state: ${response.status} ${response.statusText}`
      );
    }
  }

  private async request(url: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (process.env.npm_package_version) {
      headers["x-package-version"] = process.env.npm_package_version;
    }

    return fetch(`${this.baseUrl}/${url}`, {
      ...options,
      headers,
    });
  }
}
