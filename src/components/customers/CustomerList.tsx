'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Customer, Purifier } from '@/types';
import { Customer360Modal } from './Customer360Modal';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import { formatIndianCurrency, formatDateDDMMYYYY } from '@/lib/utils';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  MapPin,
  Droplets,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Wrench,
} from 'lucide-react';

interface CustomerListProps {
  onOpenAddCustomer: () => void;
  onOpenImport: () => void;
  onBookService: (customer: Customer, purifier?: Purifier) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onOpenAddCustomer,
  onOpenImport,
  onBookService,
}) => {
  const { customers, purifiers, searchTerm, setSearchTerm } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'services' | 'components' | 'history'>('overview');

  // WhatsApp modal state
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppCustomer, setWhatsAppCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    if (filterType !== 'ALL') {
      if (filterType === 'OVERDUE' && c.status !== 'Overdue') return false;
      if (filterType === 'SERVICE_DUE' && c.status !== 'Service due' && c.status !== 'Overdue') return false;
      if (filterType === 'AMC' && c.status !== 'AMC active' && c.status !== 'AMC expiring') return false;
      if (filterType === 'COMMERCIAL' && c.customerType !== 'Commercial' && c.customerType !== 'Restaurant') return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchPhone = c.mobileNumber.includes(q) || c.whatsappNumber.includes(q);
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchArea = c.areaLocality.toLowerCase().includes(q);
      const matchCode = c.customerCode.toLowerCase().includes(q);
      return matchPhone || matchName || matchArea || matchCode;
    }

    return true;
  });

  const handleOpenWhatsApp = (e: React.MouseEvent, cust: Customer) => {
    e.stopPropagation();
    setWhatsAppCustomer(cust);
    setWhatsAppModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {filteredCustomers.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Search by phone number for sub-second customer lookup during incoming calls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-300 dark:border-emerald-800 transition shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>📥 Import Customers via Excel</span>
          </button>

          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Fast search: enter phone number (e.g. 98765), name, or locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-xs font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'SERVICE_DUE', label: 'Due / Overdue' },
            { key: 'OVERDUE', label: 'Overdue Only' },
            { key: 'AMC', label: 'AMC Contracts' },
            { key: 'COMMERCIAL', label: 'Commercial' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
                filterType === f.key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List: Desktop Table + Mobile Cards */}
      {/* 1. Mobile Cards (< md screens) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
            No customers found. Click <strong>+ Add Customer</strong> above to onboard your first customer.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const customerPurifier = purifiers.find((p) => p.customerId === cust.id);
            const hasUnitWarranty = customerPurifier?.warrantyExpiry && new Date(customerPurifier.warrantyExpiry) >= new Date();
            const hasPartsWarranty = customerPurifier?.sparePartsWarrantyExpiry && new Date(customerPurifier.sparePartsWarrantyExpiry) >= new Date();

            return (
              <div
                key={cust.id}
                onClick={() => {
                  setSelectedCustomer(cust);
                  setModalInitialTab('overview');
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 active:scale-[0.99] transition cursor-pointer"
              >
                {/* Header: Name, Avatar, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      {cust.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {cust.fullName}
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        +91 {cust.mobileNumber}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      cust.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : cust.status === 'Service due'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : cust.status === 'AMC active'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {cust.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Purifier</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {customerPurifier ? `${customerPurifier.brand}${customerPurifier.model ? ` ${customerPurifier.model}` : ''}` : 'RO Purifier'}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {hasUnitWarranty && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Warranty
                        </span>
                      )}
                      {hasPartsWarranty && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          Parts War.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Service Due</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 block">
                      {formatDateDDMMYYYY(customerPurifier?.nextServiceDueDate, 'N/A')}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      📍 {cust.areaLocality}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(cust);
                      setModalInitialTab('services');
                    }}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Services</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenWhatsApp(e, cust)}
                    className="p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-xl transition"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <a
                    href={`tel:${cust.mobileNumber}`}
                    className="p-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-600 hover:text-white rounded-xl transition"
                    title="Call Customer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onBookService(cust, customerPurifier)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition text-center shadow-xs"
                  >
                    Book Job
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Table (>= md screens) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Customer & Phone</th>
                <th className="py-3 px-4">Doorstep Locality</th>
                <th className="py-3 px-4">Purifier & Warranty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Service Timeline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found. Click <strong>+ Add Customer</strong> above to onboard your first customer.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const customerPurifier = purifiers.find((p) => p.customerId === cust.id);
                  const hasUnitWarranty = customerPurifier?.warrantyExpiry && new Date(customerPurifier.warrantyExpiry) >= new Date();
                  const hasPartsWarranty = customerPurifier?.sparePartsWarrantyExpiry && new Date(customerPurifier.sparePartsWarrantyExpiry) >= new Date();

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setModalInitialTab('overview');
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                            {cust.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                              {cust.fullName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 font-medium">
                              +91 {cust.mobileNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {cust.areaLocality}
                        </span>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {cust.streetAddress}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {customerPurifier ? `${customerPurifier.brand} ${customerPurifier.model}` : 'RO Purifier'}
                        </span>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {customerPurifier?.purifierType || 'RO'}
                          </span>
                          {hasUnitWarranty && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Unit Warranty
                            </span>
                          )}
                          {hasPartsWarranty && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                              Parts Warranty
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cust.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : cust.status === 'Service due'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : cust.status === 'AMC active'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          Due: <span className="text-blue-600 dark:text-blue-400">{formatDateDDMMYYYY(customerPurifier?.nextServiceDueDate, 'N/A')}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Last: {customerPurifier?.lastServiceDate ? formatDateDDMMYYYY(customerPurifier.lastServiceDate) : 'Never'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(cust);
                              setModalInitialTab('services');
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 rounded-lg font-semibold text-[11px] transition flex items-center gap-1 shadow-2xs"
                            title="View Services & Spare Parts History"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Services</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenWhatsApp(e, cust)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${cust.mobileNumber}`}
                            className="p-1.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-600 hover:text-white rounded-lg transition"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onBookService(cust, customerPurifier)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] transition"
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

      {/* Customer 360 Modal */}
      {selectedCustomer && (
        <Customer360Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          customer={selectedCustomer}
          onBookService={onBookService}
          initialTab={modalInitialTab}
        />
      )}

      {/* WhatsApp Modal */}
      {whatsAppCustomer && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setWhatsAppCustomer(null);
          }}
          customer={whatsAppCustomer}
          purifier={purifiers.find((p) => p.customerId === whatsAppCustomer.id)}
          defaultTemplateKey={whatsAppCustomer.status === 'Overdue' ? 'SERVICE_OVERDUE' : 'SERVICE_DUE'}
        />
      )}
    </div>
  );
};
