'use client';

import React, { useState, useEffect } from 'react';
import type { LogEntry } from '@/types';

interface HivemindItem {
  vector: string;
  timestamp: string;
}

export default function HivemindList({ logs }: { logs: LogEntry[] }) {
  const [attacks, setAttacks] = useState<HivemindItem[]>([]);

  useEffect(() => {
    const knownAttacks = new Set<string>();
    const newAttacks: HivemindItem[] = [];

    logs.forEach((log) => {
      if (log.type === 'attack' && log.message.includes('Executing vector:')) {
        const match = log.message.match(/'([^']+)'/);
        if (match && match[1] && !knownAttacks.has(match[1])) {
          knownAttacks.add(match[1]);
          newAttacks.push({
            vector: match[1],
            timestamp: log.timestamp,
          });
        }
      }
    });

    // Keep only last 10 entries
    setAttacks(newAttacks.slice(-10).reverse());
  }, [logs]);

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all duration-200">
      <h2 className="text-lg font-semibold mb-4 tracking-tight">Hivemind Dictionary (Unibase)</h2>
      <div className="space-y-2">
        {attacks.length === 0 ? (
          <div className="text-gray-500 text-sm">No attacks learned yet...</div>
        ) : (
          attacks.map((attack, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0 hover:bg-gray-900/30 transition-colors duration-200 rounded px-1"
            >
              <span className="mono text-sm text-white">{attack.vector}</span>
              <span className="text-xs text-gray-500">Added just now</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

