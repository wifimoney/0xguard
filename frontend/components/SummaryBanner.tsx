import React from 'react';

export default function SummaryBanner() {
  return (
    <div className="border-b border-gray-800 bg-[#111111]">
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">0xGuard Protocol</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded border border-gray-800 hover:border-gray-700 transition-all duration-200">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-green"></div>
              <span className="text-sm font-medium">Swarm Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="px-4 py-2 text-sm border border-gray-800 rounded hover:border-gray-700 hover:brightness-110 transition-all duration-200 font-medium"
            >
              View on AgentVerse ↗
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm border border-gray-800 rounded hover:border-gray-700 hover:brightness-110 transition-all duration-200 font-medium"
            >
              Midnight Explorer ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

