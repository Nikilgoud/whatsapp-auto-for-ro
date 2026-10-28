'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Repeat,
  Users,
  Wrench,
  Menu,
  Bot,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
}) => {
  const { renewals } = useApp();
  const overdueCount = renewals.filter((r) => r.daysRemaining <= 0 && r.status === 'PENDING').length;

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'whatsapp-automation',
      label: 'WhatsApp',
      icon: Bot,
      badge: 'AUTO',
    },
    {
      id: 'renewals',
      label: 'Renewals',
      icon: Repeat,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'services', label: 'Services', icon: Wrench },
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center relative transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold px-1 py-0.2 rounded-full min-w-3.5 text-center leading-tight">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* More / Full Menu button */}
      <button
        onClick={onOpenSidebar}
        className="flex-1 py-1.5 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </nav>
  );
};
