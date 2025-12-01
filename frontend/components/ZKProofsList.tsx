'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { LogEntry } from '@/types';

interface ProofItem {
  hash: string;
  timestamp: string;
}

export default function ZKProofsList({ logs }: { logs: LogEntry[] }) {
  const [proofs, setProofs] = useState<ProofItem[]>([]);

  useEffect(() => {
    const knownProofs = new Set<string>();
    const newProofs: ProofItem[] = [];

    logs.forEach((log) => {
      if (log.type === 'proof' || (log.message.includes('Proof') && log.message.includes('Hash'))) {
        const match = log.message.match(/Hash:\s*([a-zA-Z0-9_]+)/);
        if (match && match[1] && !knownProofs.has(match[1])) {
          knownProofs.add(match[1]);
          newProofs.push({
            hash: match[1],
            timestamp: log.timestamp,
          });
        }
      }
    });

    // Keep only last 10 entries
    setProofs(newProofs.slice(-10).reverse());
  }, [logs]);

  const handleProofClick = (hash: string) => {
    // In a real implementation, this would open Midnight explorer
    alert(`Would open Midnight explorer for: ${hash}`);
  };

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        {/* Midnight Protocol Symbol */}
        <Image
          src="/Background.png"
          alt="Midnight Protocol"
          width={20}
          height={20}
          className="w-5 h-5"
        />
        <h2 className="text-lg font-semibold tracking-tight">ZK Proofs (Midnight)</h2>
      </div>
      <div className="space-y-2">
        {proofs.length === 0 ? (
          <div className="text-gray-500 text-sm">No proofs generated yet...</div>
        ) : (
          proofs.map((proof, index) => (
            <div
              key={index}
              className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0 hover:bg-gray-900/30 transition-colors duration-200 rounded px-1"
            >
              <span>🛡️</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleProofClick(proof.hash);
                }}
                className="mono text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                {proof.hash.length > 20 ? proof.hash.substring(0, 20) + '...' : proof.hash}
              </a>
              <span className="ml-auto text-xs text-green-500 font-medium">Verified</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

