'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ServiceRecord, Customer, Purifier, Technician } from '@/types';
import { generateTechnicianDispatchMessage, generateWhatsAppLink } from '@/lib/services/whatsappEngine';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { X, Send, MessageSquare, Wrench, MapPin, User, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

interface SendJobToTechWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRecord;
  customer: Customer;
  purifier?: Purifier;
  defaultTechnicianId?: string;
}

export const SendJobToTechWhatsAppModal: React.FC<SendJobToTechWhatsAppModalProps> = ({
  isOpen,
  onClose,
  service,
  customer,
  purifier,
  defaultTechnicianId,
}) => {
  const { technicians, business, assignTechnicianToService, logCommunication } = useApp();

  const [selectedTechId, setSelectedTechId] = useState<string>(
    defaultTechnicianId || service.technicianId || technicians[0]?.id || ''
  );
  const [customInstructions, setCustomInstructions] = useState<string>(
    'Please call 15 mins prior. Carry sediment candle and test membrane reject flow.'
  );
  const [previewMessage, setPreviewMessage] = useState<string>('');

  const selectedTech = technicians.find((t) => t.id === selectedTechId) || technicians[0];

  useEffect(() => {
    if (selectedTech && customer) {
      const msg = generateTechnicianDispatchMessage(
        selectedTech,
        customer,
        purifier,
        service,
        business,
        customInstructions
      );
      setPreviewMessage(msg);
    }
  }, [selectedTech, customer, purifier, service, business, customInstructions]);

  if (!isOpen) return null;

  const handleSendToTech = () => {
    if (!selectedTech) {
      alert('Please select a technician to assign this job to.');
      return;
    }

    // 1. Assign technician in app state
    assignTechnicianToService(service.id, selectedTech.id);

    // 2. Open WhatsApp to technician's mobile number with job details
    const targetPhone = selectedTech.whatsappNumber || selectedTech.phone;
    const url = generateWhatsAppLink(targetPhone, previewMessage);
    window.open(url, '_blank');

    // 3. Log communication
    logCommunication({
      businessId: business.id,
      customerId: customer.id,
      channel: 'WhatsApp',
      templateKey: 'TECHNICIAN_JOB_DISPATCH',
      language: 'en',
      messageText: `Assigned job ${service.serviceCode} to technician ${selectedTech.name} via WhatsApp.`,
      status: 'Sent',
      responseReceived: false,
    });

    alert(`Job assigned to ${selectedTech.name}! WhatsApp message opened with complete job details.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Assign Job & Notify Technician via WhatsApp</h3>
              <p className="text-xs text-emerald-100">
                Send customer address, time slot, and Google Maps link to technician
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Scheduled Job Summary */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Customer: {customer.fullName}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {service.serviceCode}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              📍 {customer.streetAddress}, {customer.areaLocality} • +91 {customer.mobileNumber}{(customer.alternateMobile || customer.alternativePhone) ? ` • Alt: +91 ${customer.alternateMobile || customer.alternativePhone}` : ''}
            </p>
            <p className="text-slate-500">
              📅 Scheduled: <strong>{formatDateDDMMYYYY(service.scheduledDate)}</strong> ({service.scheduledTimeSlot}) • Type: <strong>{service.serviceType}</strong>
            </p>
          </div>

          {/* Select Technician to Assign */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Technician to Assign *
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold outline-none text-xs"
            >
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} — Zone: {tech.serviceAreas.join(', ')} ({tech.pendingJobs} active jobs)
                </option>
              ))}
            </select>
            {selectedTech && (
              <p className="text-[11px] text-slate-500 mt-1">
                Will dispatch message to: <strong>+91 {selectedTech.whatsappNumber || selectedTech.phone}</strong>
              </p>
            )}
          </div>

          {/* Owner Custom Instructions */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Add Owner / Manager Instructions for Technician (Optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Customer requested evening slot, carry 75 GPD membrane"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
            />
          </div>

          {/* WhatsApp Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                WhatsApp Dispatch Message Preview:
              </label>
              <span className="text-[11px] text-emerald-600 font-semibold">Includes Google Maps Link</span>
            </div>
            <textarea
              rows={8}
              value={previewMessage}
              onChange={(e) => setPreviewMessage(e.target.value)}
              className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none leading-relaxed text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSendToTech}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
          >
            <Send className="w-4 h-4" />
            <span>Send Job to {selectedTech?.name || 'Technician'} on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
