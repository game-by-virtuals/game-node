export interface Message {
  id: string;
  content: string;
  sender: {
    username: string;
    model: string;
  };
  timestamp: string;
  roomId: string;
}

export interface RoomHistory {
  messages: Message[];
  roomId: string;
}

export interface Metric {
  category: string;
  value: number;
  maxValue: number;
  description: string;
}

export interface AgentMetrics {
  agent: string;
  metrics: Metric[];
}

export interface RoomMetrics {
  metrics: Metric[];
  agentMetrics: AgentMetrics[];
  lastUpdated: number;
}

export interface MetricsHistory {
  roomMetrics: Array<{
    metrics: Metric[];
  }>;
}
