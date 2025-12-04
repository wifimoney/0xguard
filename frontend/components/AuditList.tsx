'use client';

import React, { useState, useMemo } from 'react';
import { Audit } from '@/types';
import AuditCard from './AuditCard';
import { useAudits } from '@/hooks/useAudits';
import { useToast } from '@/hooks/useToast';
import { ErrorBoundary } from './ErrorBoundary';

interface AuditListProps {
  searchQuery?: string;
}

function AuditListContent({ searchQuery = '' }: AuditListProps) {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | Audit['status']>('all');
  
  // Use the custom hook for data fetching
  const { audits, loading, error, refetch, pagination } = useAudits({
    autoRefresh: false, // Set to true if you want auto-refresh
    refreshInterval: 30000,
  });

  // Memoize filtered audits for performance
  const filteredAudits = useMemo(() => {
    if (!audits || audits.length === 0) return [];
    
    return audits.filter((audit) => {
      const matchesSearch = audit.targetAddress.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || audit.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [audits, searchQuery, filterStatus]);

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
          <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4 mx-auto">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load audits</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              refetch().catch(() => {
                toast.error('Failed to refresh audits');
              });
            }}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
          <div className="text-gray-400">Loading audits...</div>
        </div>
        {pagination && (
          <p className="text-xs text-gray-500 mt-2">Total: {pagination.total}</p>
        )}
      </div>
    );
  }

  // Show empty state
  if (filteredAudits.length === 0) {
    const hasFilters = searchQuery || filterStatus !== 'all';
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-400 mb-2">
          {hasFilters ? 'No audits match your filters' : 'No audits found'}
        </p>
        <p className="text-sm text-gray-500">
          {hasFilters
            ? 'Try adjusting your search or filters'
            : 'Create a new audit to get started'}
        </p>
        {hasFilters && (
          <button
            onClick={() => {
              setFilterStatus('all');
              // Clear search query would require parent component
            }}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-2">
            {filteredAudits.length} {filteredAudits.length === 1 ? 'audit' : 'audits'}
            {pagination && pagination.total > filteredAudits.length && (
              <span className="text-gray-500"> of {pagination.total}</span>
            )}
          </span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              filterStatus === 'all'
                ? 'bg-white text-black'
                : 'bg-[#09090b] text-gray-400 hover:text-white border border-[#27272a]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              filterStatus === 'active'
                ? 'bg-white text-black'
                : 'bg-[#09090b] text-gray-400 hover:text-white border border-[#27272a]'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              filterStatus === 'completed'
                ? 'bg-white text-black'
                : 'bg-[#09090b] text-gray-400 hover:text-white border border-[#27272a]'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              filterStatus === 'failed'
                ? 'bg-white text-black'
                : 'bg-[#09090b] text-gray-400 hover:text-white border border-[#27272a]'
            }`}
          >
            Failed
          </button>
        </div>

        <div className="flex items-center gap-1 bg-[#09090b] border border-[#27272a] rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'grid' ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:text-white'
            }`}
            aria-label="Grid view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'list' ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:text-white'
            }`}
            aria-label="List view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Audit Cards */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }
      >
        {filteredAudits.map((audit) => (
          <AuditCard key={audit.id} audit={audit} />
        ))}
      </div>
    </div>
  );
}

// Export component wrapped with ErrorBoundary
export default function AuditList(props: AuditListProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Failed to load audit list</h3>
            <p className="text-sm text-gray-400 mb-4">
              Something went wrong while loading the audit list. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      }
    >
      <AuditListContent {...props} />
    </ErrorBoundary>
  );
}

