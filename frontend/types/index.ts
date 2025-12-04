export interface LogEntry {
  timestamp: string;
  actor: string;
  icon: string;
  message: string;
  type: string;
  is_vulnerability?: boolean;
}

export interface AgentStatus {
  redTeam: string;
  target: string;
  judge: string;
}

export interface Audit {
  id: string;
  targetAddress: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  vulnerabilityCount?: number;
  riskScore?: number;
  intensity?: string;
}

