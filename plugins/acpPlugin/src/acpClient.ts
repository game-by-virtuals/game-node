import { AcpAgent, AcpJobPhases, AcpState } from "./interface";
import { AcpToken, MemoType } from "./acpToken";
import { parseEther } from "viem";

export class AcpClient {
  private baseUrl = "https://sdk-dev.game.virtuals.io/acp";

  constructor(private apiKey: string, private acpToken: AcpToken) {}

  get walletAddress() {
    return this.acpToken.getWalletAddress();
  }

  async getState(): Promise<AcpState> {
    const response = await fetch(
      `${this.baseUrl}/states/${this.walletAddress}`,
      {
        method: "get",
        headers: {
          "x-api-key": this.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get state: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as AcpState;
  }

  async browseAgents(query: string, cluster?: string) {
    let url = `https://acpx.virtuals.gg/api/agents?search=${encodeURIComponent(
      query
    )}`;

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
    }));
  }

  async createJob(
    providerAddress: string,
    price: number,
    jobDescription: string
  ) {
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 1);

    const { txHash, jobId } = await this.acpToken.createJob(
      providerAddress,
      expiredAt
    );

    const memoResponse = await this.acpToken.createMemo(
      jobId,
      jobDescription,
      MemoType.MESSAGE,
      false,
      AcpJobPhases.NEGOTIOATION
    );

    const payload = {
      jobId: jobId,
      clientAddress: this.acpToken.getWalletAddress(),
      providerAddress: providerAddress,
      description: jobDescription,
      price: price,
      expiredAt: expiredAt.toISOString(),
    };

    const response = await fetch(`${this.baseUrl}`, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

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
      const txHash = await this.acpToken.signMemo(memoId, accept, reasoning);

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

    const response = await fetch(
      `${this.baseUrl}/${jobId}/tweets/${this.walletAddress}`,
      {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
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
    const response = await fetch(`${this.baseUrl}/states/${walletAddress}`, {
      method: "delete",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to reset state: ${response.status} ${response.statusText}`
      );
    }
  }
}
