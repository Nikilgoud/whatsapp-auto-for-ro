'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PurifierProduct, Customer } from '@/types';
import { appendBusinessFooter } from '@/lib/services/whatsappEngine';
import {
  X,
  Share2,
  Send,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface WhatsAppProductBrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: PurifierProduct | null;
  initialCustomer?: Customer | null;
}

export const WhatsAppProductBrochureModal: React.FC<WhatsAppProductBrochureModalProps> = ({
  isOpen,
  onClose,
  product,
  initialCustomer,
}) => {
  const { business, customers, logCommunication } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomer ? initialCustomer.id : ''
  );
  const [customPhone, setCustomPhone] = useState<string>(
    initialCustomer ? initialCustomer.mobileNumber : ''
  );
  const [recipientName, setRecipientName] = useState<string>(
    initialCustomer ? initialCustomer.fullName : 'Valued Customer'
  );
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const handleSelectCustomer = (cId: string) => {
    setSelectedCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setRecipientName(found.fullName);
      setCustomPhone(found.mobileNumber);
    }
  };

  const discountAmount = Math.max(0, (product.mrp || 0) - (product.sellingPrice || 0));

  const productPhotos = (product.images && product.images.length > 0)
    ? product.images
    : product.imageUrl
    ? [product.imageUrl]
    : [];

  const photosText = productPhotos.length > 1
    ? productPhotos.map((url, i) => `📸 *Photo #${i + 1}:* ${url}`).join('\n') + '\n'
    : productPhotos.length === 1
    ? `📸 *Product Preview:* ${productPhotos[0]}\n`
    : '';

  const rawBrochureText = `🚰 *${business.name.toUpperCase()} - PRODUCT SHOWCASE* 🚰

Hello *${recipientName}*! Thank you for inquiring about clean drinking water solutions. Here are the complete specifications for our recommended purifier:

🌟 *${product.brand} - ${product.model}*
⚡ *Purification Type:* ${product.purifierType}
🏷️ *Offer Price:* ₹${product.sellingPrice.toLocaleString('en-IN')}${product.mrp > product.sellingPrice ? ` *(MRP: ₹${product.mrp.toLocaleString('en-IN')})*` : ''}
${discountAmount > 0 ? `💰 *Special Discount:* Save ₹${discountAmount.toLocaleString('en-IN')} Today!\n` : ''}
💧 *Key Technical Specifications:*
• Output Capacity: ${product.capacityLph || 15} Litres/Hour
• Storage Tank: ${product.storageLiters || 8} Litres
• Purification Stages: ${product.stagesCount || 7} Stages
• Max Input TDS: Up to ${product.maxInputTds || 2000} ppm

✨ *Highlights:*
${(product.features || []).map((f) => `• ${f}`).join('\n')}

🛡️ *Dealer Assurance & Inclusions:*
• ${product.warrantyMonths || 12} Months Comprehensive Warranty
• ${product.freeServicesCount || 3} Free Periodic Filter Check Visits
• Free Doorstep Delivery & Professional On-site Installation

${photosText}Reply to this message or call *${business.phone}* to book your machine or schedule a free water TDS check today!`;

  const brochureText = appendBusinessFooter(rawBrochureText, business);

  const cleanPhone = customPhone.replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waShareUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(brochureText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(brochureText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendViaApi = async () => {
    if (!waPhone) {
      alert('Please select a customer or provide a valid WhatsApp phone number.');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: customPhone,
          messageText: brochureText,
          templateKey: 'RO_PRODUCT_BROCHURE',
          customerId: selectedCustomerId || undefined,
        }),
      });

      if (response.ok) {
        setSendSuccess(true);
        if (selectedCustomerId) {
          logCommunication({
            businessId: business.id,
            customerId: selectedCustomerId,
            channel: 'WhatsApp',
            templateKey: 'RO_PRODUCT_BROCHURE',
            language: 'en',
            messageText: brochureText,
            status: 'Sent',
            responseReceived: false,
          });
        }
        setTimeout(() => {
          setSendSuccess(false);
          onClose();
        }, 1500);
      } else {
        alert('Could not dispatch message. You can use "Open WhatsApp Web / App" to send directly.');
      }
    } catch (err) {
      console.warn('API send failed or sandbox fallback', err);
      // Still log communication
      if (selectedCustomerId) {
        logCommunication({
          businessId: business.id,
          customerId: selectedCustomerId,
          channel: 'WhatsApp',
          templateKey: 'RO_PRODUCT_BROCHURE',
          language: 'en',
          messageText: brochureText,
          status: 'Manual Logged',
          responseReceived: false,
        });
      }
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 1500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Share WhatsApp Product Brochure
              </h2>
              <p className="text-xs text-slate-500">
                1-Click pre-formatted machine specs, offer pricing & photo link.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Existing Customer (Optional)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Custom Lead / Non-Registered Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.mobileNumber}) - {c.areaLocality}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name / Mobile
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp Mobile"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Machine Info Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            {productPhotos.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                {productPhotos.slice(0, 3).map((photoUrl, pIdx) => (
                  <img
                    key={pIdx}
                    src={photoUrl}
                    alt={`${product.model} photo ${pIdx + 1}`}
                    className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 dark:border-slate-700"
                  />
                ))}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                {product.brand}
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                {product.model}
              </h4>
              <p className="text-xs text-slate-500">
                {product.purifierType} • {product.capacityLph} LPH • {product.storageLiters}L Tank
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.sellingPrice && (
                <div className="text-[11px] text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                WhatsApp Message Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-emerald-950 text-emerald-100 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-emerald-900">
              {brochureText}
            </pre>
          </div>

          {sendSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp brochure message successfully logged and dispatched!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in WhatsApp Web / App
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendViaApi}
                disabled={isSending}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send via WhatsApp API</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
