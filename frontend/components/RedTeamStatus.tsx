'use client';

import React from 'react';
import { useAgentStatus } from '@/hooks/useAgentStatus';

export const RedTeamStatus = () => {
  const { status } = useAgentStatus();
  const redTeamStatus = status?.red_team;

  const isRunning = redTeamStatus?.is_running ?? false;
  const healthStatus = redTeamStatus?.health_status ?? 'down';
  const port = redTeamStatus?.port ?? 8001;
  const address = redTeamStatus?.address;

  const getStatusText = () => {
    if (!isRunning || healthStatus === 'down') {
      return 'Status: Offline';
    } else if (healthStatus === 'degraded') {
      return 'Status: Degraded';
    } else {
      return 'Status: Engaging Target...';
    }
  };

  return (
    <div className="group relative flex items-center gap-3 cursor-help select-none w-fit">
      {/* 1. The Icon Container */}
      <div className="relative flex h-3 w-3">
        {/* Outer Ring:
            - Default: 'animate-pulse' (Slow breathing) 
            - Hover: 'animate-ping' (Frenetic active state) 
        */}
        {isRunning && healthStatus === 'healthy' && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-pulse group-hover:animate-ping transition-all duration-300"></span>
        )}
        
        {/* Inner Solid Circle */}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${isRunning && healthStatus === 'healthy' ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]' : 'bg-gray-600'}`}></span>
      </div>
      
      {/* 2. The Text Label */}
      <span className="font-mono text-sm text-gray-400 group-hover:text-gray-100 transition-colors">
        {address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'asi-red-team-01'}
      </span>
      
      {/* 3. The Custom Tooltip (Appears on Hover) */}
      <div className="absolute left-0 -bottom-8 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-10">
        <div className="bg-zinc-900 border border-zinc-700 text-xs text-white px-2 py-1 rounded shadow-xl whitespace-nowrap flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning && healthStatus === 'healthy' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
          {getStatusText()} {port && `(Port ${port})`}
        </div>
      </div>
    </div>
  );
};





