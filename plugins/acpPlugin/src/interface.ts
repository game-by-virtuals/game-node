export interface AcpAgent {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
}

export enum AcpJobPhases {
  REQUEST = 0,
  NEGOTIOATION = 1,
  TRANSACTION = 2,
  EVALUATION = 3,
  COMPLETED = 4,
  REJECTED = 5,
}

export enum AcpJobPhasesDesc {
  REQUEST = "request",
  NEGOTIOATION = "pending_payment",
  TRANSACTION = "in_progress",
  EVALUATION = "evaluation",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

export interface AcpRequestMemo {
  id: number;
  createdAt: number;
}

export interface AcpJob {
  jobId: number;
  desc: string;
  price: string;
  phase: AcpJobPhasesDesc;
  memo: AcpRequestMemo[];
  lastUpdated: number;
}

export interface IDeliverable {
  type: string;
  value: string;
}

export interface IInventory extends IDeliverable {
  jobId: number;
}

export interface AcpState {
  inventory: {
    aquired: IInventory[];
    produced: IInventory[];
  };
  jobs: {
    active: {
      asABuyer: AcpJob[];
      asASeller: AcpJob[];
    };
    completed: AcpJob[];
    cancelled: AcpJob[];
  };
}
