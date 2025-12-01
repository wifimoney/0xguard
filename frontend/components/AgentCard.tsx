'use client';

import React from 'react';
import type { LogEntry } from '@/types';

interface AgentCardProps {
  name: string;
  status: string;
  icon: React.ReactNode;
  model?: string;
  logs: LogEntry[];
}

export default function AgentCard({ name, status, icon, model, logs }: AgentCardProps) {
  // Determine status from logs
  const actorName = name.toLowerCase();
  const relevantLogs = logs.filter((log) => {
    const logActor = log.actor.toLowerCase();
    return logActor.includes(actorName.split('-')[0]) || logActor.includes(actorName);
  });

  let displayStatus = status;
  if (relevantLogs.length > 0) {
    const lastLog = relevantLogs[relevantLogs.length - 1];
    if (lastLog.type === 'attack') {
      displayStatus = 'Attacking -> Target';
    } else if (lastLog.type === 'vulnerability') {
      displayStatus = actorName.includes('target') ? 'Vulnerability Triggered!' : 'Vulnerability Found!';
    } else if (lastLog.message.includes('Listening')) {
      displayStatus = 'Listening on port 8000';
    } else if (lastLog.type === 'proof' || lastLog.message.includes('Proof')) {
      displayStatus = 'Verifying output...';
    } else if (lastLog.type === 'info' && !actorName.includes('judge')) {
      displayStatus = 'Thinking...';
    }
  }

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex items-center space-x-2">{icon}</div>
        <div className="flex-1">
          <div className="font-medium mono mb-1 text-white">{name}</div>
          <div className="text-sm text-gray-400">{displayStatus}</div>
          {model && <div className="text-xs text-gray-500 mono mt-1">Model: {model}</div>}
        </div>
      </div>
    </div>
  );
}

