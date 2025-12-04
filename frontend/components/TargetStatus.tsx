'use client';

import React from 'react';
import { useAgentStatus } from '@/hooks/useAgentStatus';

export const TargetStatus = () => {
  const { status } = useAgentStatus();
  const targetStatus = status?.target;

  const isRunning = targetStatus?.is_running ?? false;
  const healthStatus = targetStatus?.health_status ?? 'down';
  const port = targetStatus?.port ?? 8000;
  const address = targetStatus?.address;

  const getStatusText = () => {
    if (!isRunning || healthStatus === 'down') {
      return 'Status: Offline';
    } else if (healthStatus === 'degraded') {
      return 'Status: Degraded';
    } else {
      return 'Status: Listening';
    }
  };

  const getStatusColor = () => {
    if (!isRunning || healthStatus === 'down') {
      return 'bg-gray-500';
    } else if (healthStatus === 'degraded') {
      return 'bg-yellow-500';
    } else {
      return 'bg-amber-500';
    }
  };

  return (
    <div className="group relative flex items-center gap-3 cursor-help select-none w-fit">
      {/* 1. The Icon Container 
          - Color: Amber-500 (Warm orange)
          - Effect: Static by default. On hover, it brightens and adds a subtle glow drop-shadow.
      */}
      <div className={`relative flex items-center justify-center h-4 w-4 ${isRunning && healthStatus === 'healthy' ? 'text-amber-500' : 'text-gray-500'} transition-all duration-300 ${isRunning && healthStatus === 'healthy' ? 'group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : ''}`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="w-full h-full"
        >
          {/* Outer Ring */}
          <circle cx="12" cy="12" r="10" />
          {/* Middle Ring */}
          <circle cx="12" cy="12" r="6" />
          {/* Inner Core (Filled) */}
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>

      {/* 2. The Text Label */}
      <span className="font-mono text-sm text-gray-400 group-hover:text-gray-100 transition-colors">
        {address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'dummy-contract-v2'}
      </span>

      {/* 3. The Custom Tooltip */}
      <div className="absolute left-0 -bottom-8 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-10">
        <div className="bg-zinc-900 border border-zinc-700 text-xs text-white px-2 py-1 rounded shadow-xl whitespace-nowrap flex items-center gap-2">
          {/* Status Dot */}
          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`}></span>
          {getStatusText()} {port && `(Port ${port})`}
        </div>
      </div>
    </div>
  );
};




