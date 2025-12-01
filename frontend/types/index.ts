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

