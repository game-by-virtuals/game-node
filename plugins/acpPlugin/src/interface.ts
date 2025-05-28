export enum AcpJobPhasesDesc {
  REQUEST = "request",
  NEGOTIATION = "pending_payment",
  TRANSACTION = "in_progress",
  EVALUATION = "evaluation",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

export interface AcpRequestMemo {
  id: number;
}

export interface ITweet {
  type: "buyer" | "seller";
  tweetId: string;
  content: string;
  createdAt: number;
}

export interface IAcpJob {
  jobId: number;
  clientName?: string;
  providerName?: string;
  desc: string;
  price: string;
  providerAddress?: string;
  phase: AcpJobPhasesDesc;
  memo: AcpRequestMemo[];
}

export interface IDeliverable {
  type: string;
  value: string;
}

export interface IInventory extends IDeliverable {
  jobId: number;
  clientName?: string;
  providerName?: string;
}

export interface AcpState {
  inventory: {
    acquired: IInventory[];
    produced: IInventory[];
  };
  jobs: {
    active: {
      asABuyer: IAcpJob[];
      asASeller: IAcpJob[];
    };
    completed: IAcpJob[];
    cancelled: IAcpJob[];
  };
}
