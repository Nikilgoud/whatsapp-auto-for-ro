'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search,
  Plus,
  Wrench,
  Menu,
  Cloud,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface TopNavProps {
  onOpenAddCustomer: () => void;
  onOpenScheduleService: () => void;
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenAddCustomer,
  onOpenScheduleService,
  onOpenSearch,
  onToggleSidebar,
  activeTab,
  setActiveTab,
}) => {
  const {
    business,
    renewals,
    inventory,
    cloudSyncStatus,
  } = useApp();

  const overdueCount = renewals.filter((r) => r.daysRemaining <= 0 && r.status === 'PENDING').length;
  const lowStockCount = inventory.filter((i) => i.isLowStock).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
        title="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Input Bar */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded-xl border border-slate-200 dark:border-slate-700 transition group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
            <span className="truncate">Search phone, customer...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Live Cloud Sync Status */}
        <div
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-[11px] font-semibold rounded-xl border transition ${
            cloudSyncStatus === 'synced'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : cloudSyncStatus === 'syncing'
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              : cloudSyncStatus === 'needs_table'
              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
          }`}
          title={
            cloudSyncStatus === 'synced'
              ? 'Connected to Supabase. Mobile and Computer in live sync.'
              : cloudSyncStatus === 'syncing'
              ? 'Syncing changes to Supabase cloud...'
              : cloudSyncStatus === 'needs_table'
              ? 'Supabase connected! Run the SQL script in Supabase SQL editor to enable live sync.'
              : 'Local storage cache'
          }
        >
          {cloudSyncStatus === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
          ) : cloudSyncStatus === 'needs_table' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'synced' ? 'text-emerald-500' : 'text-slate-400'}`} />
          )}
          <span className="hidden md:inline">
            {cloudSyncStatus === 'synced' && 'Cloud Synced'}
            {cloudSyncStatus === 'syncing' && 'Syncing...'}
            {cloudSyncStatus === 'needs_table' && 'Run SQL Schema'}
            {cloudSyncStatus === 'offline' && 'Offline'}
          </span>
        </div>

        {/* Quick Actions Buttons */}
        <button
          onClick={onOpenScheduleService}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
        >
          <Wrench className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Book Service</span>
        </button>

        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Customer</span>
        </button>
      </div>
    </header>
  );
};
