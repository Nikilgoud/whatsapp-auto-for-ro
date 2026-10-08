'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Settings,
  Building,
  Clock,
  Shield,
  RotateCcw,
  Download,
  Save,
  CheckCircle2,
  Phone,
  FileText,
  User,
  Sparkles,
  Send,
  Upload,
} from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const {
    business,
    updateBusinessSettings,
    updateBusinessProfile,
    resetDemoData,
    customers,
    purifiers,
    services,
    inventory,
    technicians,
    renewals,
    invoices,
    amcSubscriptions,
  } = useApp();

  const [businessName, setBusinessName] = useState(business.name);
  const [ownerName, setOwnerName] = useState(business.ownerName || '');
  const [tagline, setTagline] = useState(business.tagline || 'Never miss a service. Never lose a customer.');
  const [phone, setPhone] = useState(business.phone);
  const [whatsappNumber, setWhatsappNumber] = useState(business.whatsappNumber);
  const [address, setAddress] = useState(business.address);
  const [city, setCity] = useState(business.city);
  const [gstin, setGstin] = useState(business.settings.gstin || '');
  const [invoicePrefix, setInvoicePrefix] = useState(business.settings.invoicePrefix);

  // Intervals
  const [defaultInterval, setDefaultInterval] = useState(business.settings.defaultServiceIntervalMonths);
  const [sedimentInterval, setSedimentInterval] = useState(business.settings.sedimentFilterIntervalMonths);
  const [carbonInterval, setCarbonInterval] = useState(business.settings.carbonFilterIntervalMonths);
  const [membraneInterval, setMembraneInterval] = useState(business.settings.membraneIntervalMonths);
  const [uvInterval, setUvInterval] = useState(business.settings.uvLampIntervalMonths);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProfile = {
      name: businessName,
      ownerName: ownerName.trim(),
      tagline,
      phone,
      whatsappNumber,
      address,
      city,
      gstin,
      invoicePrefix,
      defaultServiceIntervalMonths: defaultInterval,
    };

    // 1. Update in-memory state & localStorage
    updateBusinessProfile({
      name: businessName,
      ownerName: ownerName.trim(),
      tagline,
      phone,
      whatsappNumber,
      address,
      city,
    });

    updateBusinessSettings({
      defaultServiceIntervalMonths: defaultInterval,
      sedimentFilterIntervalMonths: sedimentInterval,
      carbonFilterIntervalMonths: carbonInterval,
      membraneIntervalMonths: membraneInterval,
      uvLampIntervalMonths: uvInterval,
      gstin,
      invoicePrefix,
    });

    // 2. Also write directly to disk (src/config/businessProfile.json) so the project folder is permanently configured for this client!
    try {
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanProfile),
      });
    } catch {
      // serverless or offline fallback
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleExportBackup = () => {
    const backup = {
      business: {
        ...business,
        name: businessName,
        ownerName: ownerName.trim(),
        tagline,
        phone,
        whatsappNumber,
        address,
        city,
        settings: {
          ...business.settings,
          defaultServiceIntervalMonths: defaultInterval,
          sedimentFilterIntervalMonths: sedimentInterval,
          carbonFilterIntervalMonths: carbonInterval,
          membraneIntervalMonths: membraneInterval,
          uvLampIntervalMonths: uvInterval,
          gstin,
          invoicePrefix,
        },
      },
      customers,
      purifiers,
      services,
      technicians,
      renewals,
      invoices,
      inventory,
      amcSubscriptions,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ro_full_store_backup_${businessName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>RO Business Configuration</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tune component replacement intervals, invoice branding, and dealer operational settings.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">

        {/* Business Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Business Profile & Contact</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Business / Agency Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sri Sai Water Purifiers, Aqualife RO Services"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <User className="w-3.5 h-3.5" />
                <span>Owner / Proprietor Name *</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Rajesh Kumar, Srinivas Rao"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-blue-400/60 dark:border-blue-500/60 rounded-xl font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Business Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Pure Water, Healthy Family"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">City & State</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad, Telangana"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Official Calling Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">WhatsApp Business Number (For Reminders)</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Shop / Service Center Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop address shown on customer invoices & reminders"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* SERVICE DUE CALCULATION INTERVALS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Consumable Replacement Intervals (Renewal Engine Defaults)</span>
            </h3>
            <p className="text-slate-500 mt-0.5">
              These intervals power the automatic next due date calculations. Actual intervals can be tailored per customer based on local borewell TDS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold mb-1">General RO Service</label>
              <select
                value={defaultInterval}
                onChange={(e) => setDefaultInterval(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-semibold"
              >
                <option value={2}>Every 2 Months (60 Days)</option>
                <option value={3}>Every 3 Months (90 Days - Recommended)</option>
                <option value={4}>Every 4 Months (120 Days)</option>
                <option value={6}>Every 6 Months (180 Days)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold mb-1">Sediment Filter Candle</label>
              <select
                value={sedimentInterval}
                onChange={(e) => setSedimentInterval(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-semibold"
              >
                <option value={2}>Every 2 Months</option>
                <option value={3}>Every 3 Months</option>
                <option value={4}>Every 4 Months</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold mb-1">Activated Carbon Block</label>
              <select
                value={carbonInterval}
                onChange={(e) => setCarbonInterval(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-semibold"
              >
                <option value={4}>Every 4 Months</option>
                <option value={6}>Every 6 Months (Standard)</option>
                <option value={9}>Every 9 Months</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold mb-1">RO Membrane (75/100 GPD)</label>
              <select
                value={membraneInterval}
                onChange={(e) => setMembraneInterval(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-semibold"
              >
                <option value={12}>Every 12 Months (1 Year)</option>
                <option value={18}>Every 18 Months (Recommended)</option>
                <option value={24}>Every 24 Months (2 Years)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold mb-1">UV Germicidal Lamp</label>
              <select
                value={uvInterval}
                onChange={(e) => setUvInterval(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-semibold"
              >
                <option value={12}>Every 12 Months</option>
                <option value={18}>Every 18 Months</option>
              </select>
            </div>
          </div>
        </div>

        {/* GST & Invoicing */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Tax & Invoicing Setup</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">GSTIN Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 36ABCDE1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset to initial Hyderabad RO dataset?')) {
                  resetDemoData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo</span>
            </button>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
