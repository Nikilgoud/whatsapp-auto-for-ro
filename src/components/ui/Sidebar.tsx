'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Users,
  Repeat,
  Wrench,
  Calendar,
  ShieldCheck,
  Package,
  FileText,
  BarChart3,
  Settings,
  Smartphone,
  Droplets,
  RotateCcw,
  Sparkles,
  X,
  Bot,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen = false, onClose }) => {
  const { business, renewals, inventory, resetDemoData, switchUserRole } = useApp();

  const overdueCount = renewals.filter((r) => r.daysRemaining <= 0 && r.status === 'PENDING').length;
  const lowStockCount = inventory.filter((i) => i.isLowStock).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'whatsapp-automation',
      label: 'WhatsApp Automation',
      icon: Bot,
      badge: 'AUTO',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'renewals',
      label: 'Renewals Pipeline',
      icon: Repeat,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'customers', label: 'Customers 360', icon: Users },

    { id: 'services', label: 'Services & Jobs', icon: Wrench },
    { id: 'calendar', label: 'Service Calendar', icon: Calendar },
    { id: 'amc', label: 'AMC Management', icon: ShieldCheck },
    { id: 'technicians', label: 'Technicians', icon: Users },
    {
      id: 'inventory',
      label: 'Inventory Spares',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'invoices', label: 'Invoices & Billing', icon: FileText },
    { id: 'reports', label: 'Business Reports', icon: BarChart3 },
    { id: 'settings', label: 'Business Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl shadow-md text-white shadow-cyan-500/20">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                  RO Renewal <span className="text-cyan-400 font-extrabold text-xs px-1 py-0.5 bg-cyan-950 rounded">PRO</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Never miss a service. Never lose a customer.</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Badge */}
          <div className="mt-3.5 px-2.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 flex items-center justify-between">
            <div className="truncate">
              <p className="text-[11px] font-bold text-slate-200 truncate">{business.name}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {business.ownerName ? `Owner: ${business.ownerName}` : `${business.city}, ${business.state}`}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active Business"></span>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Reset Demo Data */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => {
            if (confirm('Reset to initial realistic Hyderabad RO demo dataset?')) {
              resetDemoData();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
    </>
  );
};
