'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Customer, Purifier, ServiceRecord } from '@/types';
import { Search, X, User, Phone, MapPin, Wrench, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const { customers, purifiers, services } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle search
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedCustomers = q
    ? customers.filter((c) => {
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.mobileNumber.includes(q) ||
          c.whatsappNumber.includes(q) ||
          c.customerCode.toLowerCase().includes(q) ||
          c.areaLocality.toLowerCase().includes(q) ||
          c.streetAddress.toLowerCase().includes(q)
        );
      })
    : customers.slice(0, 5);

  const matchedServices = q
    ? services.filter(
        (s) =>
          s.serviceCode.toLowerCase().includes(q) ||
          s.serviceType.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs p-4 pt-20 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search by phone number (e.g. 98765), customer name, address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
              Customers ({matchedCustomers.length})
            </span>
            <div className="space-y-1">
              {matchedCustomers.map((c) => {
                const p = purifiers.find((pur) => pur.customerId === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                        {c.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition truncate">
                          {c.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          📱 +91 {c.mobileNumber} • 📍 {c.areaLocality} • {p?.brand} {p?.model}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 transition" />
                  </button>
                );
              })}
            </div>
          </div>

          {matchedServices.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Services ({matchedServices.length})
              </span>
              <div className="space-y-1">
                {matchedServices.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600">{s.serviceCode}</span>
                      <p className="text-slate-600 dark:text-slate-300">{s.serviceType} • {s.scheduledDate}</p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">₹{s.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
