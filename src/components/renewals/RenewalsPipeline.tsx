'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Renewal, RenewalStage, Customer, Purifier } from '@/types';
import { getUrgencyBadgeConfig } from '@/lib/services/dueCalculator';
import { formatIndianCurrency, formatDateDDMMYYYY } from '@/lib/utils';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import {
  Search,
  MessageSquare,
  Repeat,
} from 'lucide-react';

interface RenewalsPipelineProps {
  onScheduleForRenewal: (renewal: Renewal) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const RenewalsPipeline: React.FC<RenewalsPipelineProps> = ({
  onScheduleForRenewal,
  onSelectCustomer,
}) => {
  const { renewals, customers, purifiers, updateRenewalStage } = useApp();
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedCustForWhatsApp, setSelectedCustForWhatsApp] = useState<Customer | null>(null);
  const [selectedPurForWhatsApp, setSelectedPurForWhatsApp] = useState<Purifier | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState<string>('SERVICE_DUE');

  // Filter renewals
  const filteredRenewals = renewals.filter((r) => {
    if (filterUrgency !== 'ALL' && r.urgency !== filterUrgency) return false;
    if (searchQuery.trim()) {
      const customer = customers.find((c) => c.id === r.customerId);
      const q = searchQuery.toLowerCase();
      const matchName = customer?.fullName.toLowerCase().includes(q);
      const matchPhone = customer?.mobileNumber.includes(q);
      const matchArea = customer?.areaLocality.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchArea) return false;
    }
    return true;
  });

  const openWhatsApp = (customer: Customer, purifier?: Purifier, isOverdue = false) => {
    setSelectedCustForWhatsApp(customer);
    setSelectedPurForWhatsApp(purifier || null);
    setTemplateKey(isOverdue ? 'SERVICE_OVERDUE' : 'SERVICE_DUE');
    setWhatsAppModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header & Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-600" />
            <span>Service Renewal Pipeline</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {filteredRenewals.length} Opportunities
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Never miss a service. Proactively track customer due dates and run WhatsApp follow-ups.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, area..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Urgency Filter Dropdown */}
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Urgency Levels</option>
            <option value="RED">🔴 Red: Overdue / Due Today</option>
            <option value="ORANGE">🟠 Orange: Due in &lt; 14 Days</option>
            <option value="YELLOW">🟡 Yellow: Upcoming (15-30 Days)</option>
            <option value="GREEN">🟢 Green: Healthy (&gt; 30 Days)</option>
          </select>
        </div>
      </div>

      {/* Renewals Pipeline: Mobile Cards (< md screens) + Desktop Table (>= md screens) */}
      {/* 1. Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredRenewals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
            No service renewals found matching your search or urgency filter.
          </div>
        ) : (
          filteredRenewals.map((rnw) => {
            const customer = customers.find((c) => c.id === rnw.customerId);
            const purifier = purifiers.find((p) => p.id === rnw.purifierId);
            if (!customer) return null;
            const urgencyBadge = getUrgencyBadgeConfig(rnw.urgency);

            return (
              <div
                key={rnw.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
              >
                {/* Header: Customer & Urgency */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      onClick={() => onSelectCustomer(customer)}
                      className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 text-left block truncate"
                    >
                      {customer.fullName}
                    </button>
                    <p className="text-xs text-slate-500 font-mono">
                      +91 {customer.mobileNumber} • {customer.areaLocality}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${urgencyBadge.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${urgencyBadge.dot}`} />
                    {rnw.daysRemaining <= 0
                      ? `${Math.abs(rnw.daysRemaining)}d Overdue`
                      : `${rnw.daysRemaining}d Left`}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Purifier & Service</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {purifier?.brand} {purifier?.model}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {rnw.serviceType}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Due Date & Est.</span>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {formatDateDDMMYYYY(rnw.nextDueDate)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      {formatIndianCurrency(rnw.estimatedValue)}
                    </span>
                  </div>
                </div>

                {/* Follow-up Stage & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Stage:</span>
                    <select
                      value={rnw.followUpStage}
                      onChange={(e) => updateRenewalStage(rnw.id, e.target.value as RenewalStage)}
                      className="flex-1 sm:flex-initial text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Reminder sent">Reminder sent</option>
                      <option value="Customer contacted">Customer contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Appointment scheduled">Appointment scheduled</option>
                      <option value="Follow-up required">Follow-up required</option>
                      <option value="Customer declined">Customer declined</option>
                      <option value="No response">No response</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${customer.mobileNumber}`}
                      className="p-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-600 hover:text-white rounded-xl transition"
                      title="Call"
                    >
                      <span className="text-xs font-bold">📞</span>
                    </a>

                    <button
                      onClick={() => openWhatsApp(customer, purifier, rnw.daysRemaining <= 0)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onScheduleForRenewal(rnw)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-xs text-center"
                    >
                      Book Job
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Purifier Model</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Urgency Status</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Follow-up Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRenewals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No service renewals found matching your search or urgency filter.
                  </td>
                </tr>
              ) : (
                filteredRenewals.map((rnw) => {
                  const customer = customers.find((c) => c.id === rnw.customerId);
                  const purifier = purifiers.find((p) => p.id === rnw.purifierId);
                  if (!customer) return null;
                  const urgencyBadge = getUrgencyBadgeConfig(rnw.urgency);

                  return (
                    <tr key={rnw.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectCustomer(customer)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 text-left cursor-pointer"
                        >
                          {customer.fullName}
                        </button>
                        <p className="text-[10px] text-slate-400">
                          {customer.areaLocality} • +91 {customer.mobileNumber}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {purifier?.brand} {purifier?.model}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {formatDateDDMMYYYY(rnw.nextDueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${urgencyBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${urgencyBadge.dot}`}></span>
                          {rnw.daysRemaining <= 0
                            ? `${Math.abs(rnw.daysRemaining)} Days Overdue`
                            : `${rnw.daysRemaining} Days Left`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {rnw.serviceType}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatIndianCurrency(rnw.estimatedValue)}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={rnw.followUpStage}
                          onChange={(e) => updateRenewalStage(rnw.id, e.target.value as RenewalStage)}
                          className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none cursor-pointer"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Reminder sent">Reminder sent</option>
                          <option value="Customer contacted">Customer contacted</option>
                          <option value="Interested">Interested</option>
                          <option value="Appointment scheduled">Appointment scheduled</option>
                          <option value="Follow-up required">Follow-up required</option>
                          <option value="Customer declined">Customer declined</option>
                          <option value="No response">No response</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openWhatsApp(customer, purifier, rnw.daysRemaining <= 0)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg transition shadow-2xs cursor-pointer"
                            title="Send WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onScheduleForRenewal(rnw)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                          >
                            Book Job
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {selectedCustForWhatsApp && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setSelectedCustForWhatsApp(null);
          }}
          customer={selectedCustForWhatsApp}
          purifier={selectedPurForWhatsApp || undefined}
          defaultTemplateKey={templateKey}
        />
      )}
    </div>
  );
};
