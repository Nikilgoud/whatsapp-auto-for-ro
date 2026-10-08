'use client';

import React, { useState, useEffect } from 'react';
import { Customer, Purifier, LanguageCode } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  WHATSAPP_TEMPLATES,
  interpolateTemplate,
  generateWhatsAppLink,
  checkReminderEligibility,
} from '@/lib/services/whatsappEngine';
import { MessageSquare, ExternalLink, Globe, AlertCircle, CheckCircle, X } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  purifier?: Purifier;
  defaultTemplateKey?: string;
  dueDate?: string;
  amount?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  technicianName?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  customer,
  purifier,
  defaultTemplateKey = 'SERVICE_DUE',
  dueDate,
  amount,
  scheduledDate,
  scheduledTime,
  technicianName,
}) => {
  const { business, selectedLanguage, switchLanguage, logCommunication } = useApp();
  const [templateKey, setTemplateKey] = useState<string>(defaultTemplateKey);
  const [lang, setLang] = useState<LanguageCode>(selectedLanguage);
  const [messageBody, setMessageBody] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const eligibility = checkReminderEligibility(customer);

  useEffect(() => {
    setTemplateKey(defaultTemplateKey);
  }, [defaultTemplateKey]);

  useEffect(() => {
    const templateDef = WHATSAPP_TEMPLATES[templateKey] || WHATSAPP_TEMPLATES.SERVICE_DUE;
    const rawTemplate = templateDef.languages[lang] || templateDef.languages.en;

    const interpolated = interpolateTemplate(rawTemplate, {
      customerName: customer.fullName,
      purifierBrand: purifier?.brand || 'RO',
      purifierModel: purifier?.model || '',
      dueDate: dueDate || purifier?.nextServiceDueDate || 'soon',
      businessName: business.name,
      ownerName: business.ownerName || 'K. Venkat Rao',
      businessAddress: `${business.address}, ${business.city}`,
      businessPhone: business.phone,
      technicianName: technicianName || 'Our Technician',
      scheduledDate,
      scheduledTime,
      amount,
    });

    setMessageBody(interpolated);
  }, [templateKey, lang, customer, purifier, dueDate, amount, scheduledDate, scheduledTime, technicianName, business.name, business.ownerName, business.address, business.city, business.phone]);

  if (!isOpen) return null;

  const handleSend = () => {
    const url = generateWhatsAppLink(customer.whatsappNumber || customer.mobileNumber, messageBody);
    window.open(url, '_blank');

    // Log the communication
    logCommunication({
      businessId: business.id,
      customerId: customer.id,
      channel: 'WhatsApp',
      templateKey,
      language: lang,
      messageText: messageBody,
      status: 'Sent',
      responseReceived: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Send WhatsApp Message</h3>
              <p className="text-xs text-emerald-100">
                To: {customer.fullName} (+91 {customer.mobileNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!eligibility.eligible && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-medium">Reminder Notice:</p>
                <p>{eligibility.reason}</p>
              </div>
            </div>
          )}

          {/* Template & Language Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Select Template
              </label>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {Object.entries(WHATSAPP_TEMPLATES).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                Language
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                {(['en', 'te', 'hi', 'hinglish'] as LanguageCode[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setLang(l);
                      switchLanguage(l);
                    }}
                    className={`py-1.5 text-xs font-medium rounded-md uppercase transition ${
                      lang === l
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {l === 'hinglish' ? 'Hing' : l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Message Preview (Editable)
              </label>
              <span className="text-[11px] text-slate-400">Indian RO Industry Ready</span>
            </div>
            <textarea
              rows={6}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full text-xs font-sans bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Recipient: <strong>+91 {customer.whatsappNumber || customer.mobileNumber}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Click-to-Chat Enabled</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition"
          >
            <ExternalLink className="w-4 h-4" />
            Open WhatsApp & Send
          </button>
        </div>
      </div>
    </div>
  );
};
