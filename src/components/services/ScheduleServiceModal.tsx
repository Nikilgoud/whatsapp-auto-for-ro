'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Customer, Purifier, ServiceType, Technician } from '@/types';
import { matchTechniciansForService, TechnicianMatchResult } from '@/lib/services/technicianMatcher';
import { SendJobToTechWhatsAppModal } from '@/components/technician/SendJobToTechWhatsAppModal';
import { X, Calendar, Wrench, Clock, UserCheck, AlertCircle, CheckCircle, Sparkles, Send } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomer?: Customer | null;
  preselectedPurifier?: Purifier | null;
  preselectedServiceType?: ServiceType;
}

export const ScheduleServiceModal: React.FC<ScheduleServiceModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomer,
  preselectedPurifier,
  preselectedServiceType,
}) => {
  const { customers, purifiers, technicians, scheduleService } = useApp();

  const [customerId, setCustomerId] = useState<string>('');
  const [purifierId, setPurifierId] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType>('General service');
  const [scheduledDate, setScheduledDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('09:30 AM - 11:00 AM');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [labourCharge, setLabourCharge] = useState<number>(300);

  // Post-booking dispatch modal
  const [createdServiceForDispatch, setCreatedServiceForDispatch] = useState<any>(null);

  useEffect(() => {
    if (preselectedCustomer) {
      setCustomerId(preselectedCustomer.id);
    } else if (customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [preselectedCustomer, customers]);

  useEffect(() => {
    if (preselectedPurifier) {
      setPurifierId(preselectedPurifier.id);
    } else if (customerId) {
      const p = purifiers.find((item) => item.customerId === customerId);
      if (p) setPurifierId(p.id);
    }
  }, [preselectedPurifier, customerId, purifiers]);

  useEffect(() => {
    if (preselectedServiceType) {
      setServiceType(preselectedServiceType);
    }
  }, [preselectedServiceType]);

  // Selected customer object for smart matching
  const currentCustomer = customers.find((c) => c.id === customerId);

  // Smart technician matches
  const techMatches: TechnicianMatchResult[] = currentCustomer
    ? matchTechniciansForService(technicians, currentCustomer, serviceType)
    : [];

  useEffect(() => {
    if (techMatches.length > 0 && !technicianId) {
      setTechnicianId(techMatches[0].technician.id);
    }
  }, [techMatches, technicianId]);

  if (!isOpen) return null;

  const handleBook = (dispatchViaWhatsApp: boolean = false) => {
    if (!customerId) {
      alert('Please select a customer');
      return;
    }

    const newRecord = scheduleService({
      customerId,
      purifierId,
      serviceType,
      scheduledDate,
      scheduledTimeSlot,
      technicianId: technicianId || undefined,
      issueDescription: issueDescription || `${serviceType} scheduled for ${currentCustomer?.areaLocality}`,
      labourCharge,
    });

    if (dispatchViaWhatsApp && technicianId) {
      setCreatedServiceForDispatch(newRecord);
    } else {
      alert(`Service appointment scheduled successfully! Assigned to ${technicians.find(t => t.id === technicianId)?.name || 'Technician'}.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Schedule RO Service Job</h3>
              <p className="text-xs text-slate-500">Dispatch technician with smart locality matching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Customer Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} • +91 {c.mobileNumber} ({c.areaLocality})
                </option>
              ))}
            </select>
          </div>

          {/* Service Type & Purifier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
              >
                <option value="General service">General service</option>
                <option value="Filter replacement">Filter replacement</option>
                <option value="Membrane replacement">Membrane replacement</option>
                <option value="UV replacement">UV replacement</option>
                <option value="Leakage repair">Leakage repair (Urgent)</option>
                <option value="Pump replacement">Booster pump replacement</option>
                <option value="SMPS replacement">SMPS power replacement</option>
                <option value="AMC service">AMC periodic service</option>
                <option value="Installation">New purifier installation</option>
                <option value="TDS adjustment">TDS adjustment & calibration</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Labour / Visit Charge (₹)
              </label>
              <input
                type="number"
                value={labourCharge}
                onChange={(e) => setLabourCharge(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Time Slot
              </label>
              <select
                value={scheduledTimeSlot}
                onChange={(e) => setScheduledTimeSlot(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
              >
                <option value="09:30 AM - 11:00 AM">09:30 AM - 11:00 AM</option>
                <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM</option>
                <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM</option>
                <option value="04:30 PM - 06:00 PM">04:30 PM - 06:00 PM</option>
                <option value="06:30 PM - 08:00 PM">06:30 PM - 08:00 PM (Evening)</option>
              </select>
            </div>
          </div>

          {/* SMART TECHNICIAN RECOMMENDATION WIDGET */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Smart Technician Assignment</span>
              </label>
              <span className="text-[11px] text-slate-400">Locality & workload matched</span>
            </div>

            <div className="space-y-2">
              {techMatches.map((m) => (
                <label
                  key={m.technician.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                    technicianId === m.technician.id
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="techAssignment"
                      checked={technicianId === m.technician.id}
                      onChange={() => setTechnicianId(m.technician.id)}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {m.technician.name}
                        </span>
                        {m.isRecommended && (
                          <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold">
                            Best Match ({m.score}%)
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          {m.distanceEstimateKm} km away
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {m.matchReasons.join(' • ')}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {m.technician.rating} ★
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Issue or Special Customer Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Slow flow, membrane vibrating, check pre-filter"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition text-center"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleBook(false)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Book Only</span>
            </button>

            <button
              onClick={() => handleBook(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Book & WhatsApp Tech</span>
            </button>
          </div>
        </div>
      </div>

      {/* Immediate WhatsApp Dispatch Modal */}
      {createdServiceForDispatch && currentCustomer && (
        <SendJobToTechWhatsAppModal
          isOpen={!!createdServiceForDispatch}
          onClose={() => {
            setCreatedServiceForDispatch(null);
            onClose();
          }}
          service={createdServiceForDispatch}
          customer={currentCustomer}
          purifier={purifiers.find((p) => p.id === purifierId)}
          defaultTechnicianId={technicianId}
        />
      )}
    </div>
  );
};
