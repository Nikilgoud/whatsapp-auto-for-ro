'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ServiceRecord, Customer, Purifier } from '@/types';
import { formatIndianCurrency } from '@/lib/utils';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import { SendJobToTechWhatsAppModal } from '@/components/technician/SendJobToTechWhatsAppModal';
import {
  Wrench,
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface ServiceListProps {
  onOpenSchedule: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  onOpenSchedule,
  onSelectCustomer,
}) => {
  const { services, customers, purifiers, technicians, startService, completeService } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // WhatsApp modal (Customer)
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppCustomer, setWhatsAppCustomer] = useState<Customer | null>(null);
  const [whatsAppPurifier, setWhatsAppPurifier] = useState<Purifier | null>(null);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<string>('TECHNICIAN_ON_WAY');

  // WhatsApp Dispatch to Technician Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchService, setDispatchService] = useState<ServiceRecord | null>(null);
  const [dispatchCustomer, setDispatchCustomer] = useState<Customer | null>(null);
  const [dispatchPurifier, setDispatchPurifier] = useState<Purifier | null>(null);

  // Quick complete service modal
  const [serviceToComplete, setServiceToComplete] = useState<ServiceRecord | null>(null);
  const [inletTds, setInletTds] = useState(850);
  const [outputTds, setOutputTds] = useState(80);
  const [workSummary, setWorkSummary] = useState('Routine checkup, cleaned sediment bowl, output TDS normal.');
  const [amountPaid, setAmountPaid] = useState(650);

  const filteredServices = services.filter((srv) => {
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'ACTIVE' && srv.status !== 'Assigned' && srv.status !== 'Started' && srv.status !== 'Confirmed') {
        return false;
      }
      if (filterStatus === 'COMPLETED' && srv.status !== 'Completed') return false;
      if (filterStatus === 'STARTED' && srv.status !== 'Started') return false;
    }

    if (searchQuery.trim()) {
      const customer = customers.find((c) => c.id === srv.customerId);
      const q = searchQuery.toLowerCase();
      const matchName = customer?.fullName.toLowerCase().includes(q);
      const matchPhone = customer?.mobileNumber.includes(q);
      const matchCode = srv.serviceCode.toLowerCase().includes(q);
      const matchType = srv.serviceType.toLowerCase().includes(q);
      return matchName || matchPhone || matchCode || matchType;
    }

    return true;
  });

  const handleOpenWhatsApp = (customer: Customer, purifier?: Purifier, templateKey = 'TECHNICIAN_ON_WAY') => {
    setWhatsAppCustomer(customer);
    setWhatsAppPurifier(purifier || null);
    setWhatsAppTemplate(templateKey);
    setWhatsAppModalOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!serviceToComplete) return;
    completeService(serviceToComplete.id, {
      inletTds,
      outputTds,
      workSummary,
      labourCharge: serviceToComplete.labourCharge || 300,
      discount: serviceToComplete.discount || 0,
      amountPaid,
      partsUsed: serviceToComplete.partsUsed.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        inventoryItemId: p.inventoryItemId,
      })),
      paymentMethod: 'UPI',
    });
    setServiceToComplete(null);
    alert('Service completed! Inventory auto-deducted & next 3-month renewal scheduled!');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Service Operations & Visits</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {filteredServices.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Dispatch, track, and verify field technician visits with TDS readings and customer signatures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSchedule}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Book Service</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search service code (e.g. SRV-2026), customer name, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: 'All Services' },
            { key: 'ACTIVE', label: 'Today & Active' },
            { key: 'STARTED', label: 'In Progress (Started)' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
                filterStatus === f.key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Service Code & Customer</th>
                <th className="py-3 px-4">Purifier Model</th>
                <th className="py-3 px-4">Schedule Slot</th>
                <th className="py-3 px-4">Assigned Technician</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Bill Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredServices.map((srv) => {
                const customer = customers.find((c) => c.id === srv.customerId);
                const purifier = purifiers.find((p) => p.id === srv.purifierId);
                const tech = technicians.find((t) => t.id === srv.technicianId);
                if (!customer) return null;

                return (
                  <tr key={srv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {srv.serviceCode}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {srv.serviceType}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelectCustomer(customer)}
                        className="font-bold text-slate-900 dark:text-white hover:text-blue-600 text-left mt-0.5"
                      >
                        {customer.fullName}
                      </button>
                      <p className="text-[11px] text-slate-400">
                        {customer.areaLocality} • +91 {customer.mobileNumber}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {purifier?.brand} {purifier?.model}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {srv.scheduledDate}
                      </span>
                      <span className="text-[11px] text-slate-400">{srv.scheduledTimeSlot}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {tech ? (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{tech.name}</p>
                          <p className="text-[10px] text-slate-400">+91 {tech.phone}</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          srv.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : srv.status === 'Started'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {srv.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {formatIndianCurrency(srv.total)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          srv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : srv.paymentStatus === 'Partially paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {srv.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setDispatchService(srv);
                            setDispatchCustomer(customer);
                            setDispatchPurifier(purifier || null);
                            setDispatchModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg text-[11px] font-semibold transition"
                          title="Assign & WhatsApp Job to Technician"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp Tech</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsApp(customer, purifier, 'TECHNICIAN_ON_WAY')}
                          className="p-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                          title="WhatsApp 'Technician On Way' to Customer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {srv.status !== 'Completed' && (
                          <>
                            {srv.status !== 'Started' ? (
                              <button
                                onClick={() => startService(srv.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-semibold transition"
                              >
                                <Play className="w-3 h-3" />
                                <span>Start</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setServiceToComplete(srv);
                                  setAmountPaid(srv.total);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Service Dialog */}
      {serviceToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Complete Service: {serviceToComplete.serviceCode}
            </h3>
            <p className="text-xs text-slate-500">
              Record water TDS readings and payment to finalize this service and update the renewal engine.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Raw Inlet TDS (ppm)</label>
                <input
                  type="number"
                  value={inletTds}
                  onChange={(e) => setInletTds(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Pure Output TDS (ppm)</label>
                <input
                  type="number"
                  value={outputTds}
                  onChange={(e) => setOutputTds(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold mb-1">Technician Work Summary</label>
              <input
                type="text"
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>

            <div className="text-xs">
              <label className="block font-semibold mb-1">Amount Collected (₹)</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setServiceToComplete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmComplete}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Complete & Schedule Next Due
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal (Customer) */}
      {whatsAppCustomer && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setWhatsAppCustomer(null);
          }}
          customer={whatsAppCustomer}
          purifier={whatsAppPurifier || undefined}
          defaultTemplateKey={whatsAppTemplate}
        />
      )}

      {/* WhatsApp Dispatch Modal (Technician) */}
      {dispatchService && dispatchCustomer && (
        <SendJobToTechWhatsAppModal
          isOpen={dispatchModalOpen}
          onClose={() => {
            setDispatchModalOpen(false);
            setDispatchService(null);
            setDispatchCustomer(null);
            setDispatchPurifier(null);
          }}
          service={dispatchService}
          customer={dispatchCustomer}
          purifier={dispatchPurifier || undefined}
          defaultTechnicianId={dispatchService.technicianId}
        />
      )}
    </div>
  );
};
