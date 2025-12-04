'use client';

import { useState, useEffect, useCallback } from 'react';

interface AgentStatus {
  is_running: boolean;
  port?: number;
  address?: string;
  last_seen?: string;
  health_status: 'healthy' | 'degraded' | 'down';
}

interface AgentsStatus {
  judge: AgentStatus;
  target: AgentStatus;
  red_team: AgentStatus;
  started_at?: string;
}

export function useAgentStatus(pollInterval: number = 2000) {
  const [status, setStatus] = useState<AgentsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/agent-status');
      if (!response.ok) {
        throw new Error('Failed to fetch agent status');
      }
      const data: AgentsStatus = await response.json();
      setStatus(data);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      // Set default status on error
      setStatus({
        judge: { is_running: false, health_status: 'down' },
        target: { is_running: false, health_status: 'down' },
        red_team: { is_running: false, health_status: 'down' },
      });
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up polling interval
    const interval = setInterval(fetchStatus, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchStatus, pollInterval]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}

