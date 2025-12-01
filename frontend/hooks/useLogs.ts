'use client';

import { useState, useEffect, useRef } from 'react';
import type { LogEntry } from '@/types';

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastLogCount, setLastLogCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const pollLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        if (!response.ok) {
          return;
        }
        const newLogs: LogEntry[] = await response.json();
        
        if (newLogs.length > lastLogCount) {
          const newEntries = newLogs.slice(lastLogCount);
          setLogs((prev) => [...prev, ...newEntries]);
          setLastLogCount(newLogs.length);
        }
      } catch (error) {
        // Silently fail if logs.json doesn't exist yet
        console.debug('Logs not available yet');
      }
    };

    // Initial poll
    pollLogs();

    // Set up polling interval
    intervalRef.current = setInterval(pollLogs, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lastLogCount]);

  return logs;
}

