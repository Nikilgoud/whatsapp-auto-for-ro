'use client';

import React, { useState, useEffect } from 'react';
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
  DollarSign,
  Globe,
  QrCode,
  X,
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
  const [website, setWebsite] = useState(business.website || '');
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState(business.paymentQrCodeUrl || '');
  const [address, setAddress] = useState(business.address);
  const [city, setCity] = useState(business.city);
  const [gstin, setGstin] = useState(business.settings.gstin || '');
  const [invoicePrefix, setInvoicePrefix] = useState(business.settings.invoicePrefix);

  const qrFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [qrUploadSuccess, setQrUploadSuccess] = useState(false);

  useEffect(() => {
    if (business.paymentQrCodeUrl) {
      setPaymentQrCodeUrl(business.paymentQrCodeUrl);
    }
  }, [business.paymentQrCodeUrl]);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('QR Code image must be smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawDataUrl = uploadEvent.target?.result as string;

      // Downscale to 450x450 canvas to keep size under 50KB for ultra-reliable storage & fast invoice printing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 450;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

          // 1. Update component local state
          setPaymentQrCodeUrl(compressedDataUrl);

          // 2. Immediately update AppContext so it is active across all invoices right away!
          updateBusinessProfile({ paymentQrCodeUrl: compressedDataUrl });

          // 3. Persist to API
          fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: businessName,
              ownerName: ownerName.trim(),
              tagline,
              phone,
              whatsappNumber,
              website: website.trim(),
              paymentQrCodeUrl: compressedDataUrl,
              address,
              city,
            }),
          }).catch(() => {});

          setQrUploadSuccess(true);
          setTimeout(() => setQrUploadSuccess(false), 3000);
        } else {
          setPaymentQrCodeUrl(rawDataUrl);
          updateBusinessProfile({ paymentQrCodeUrl: rawDataUrl });
        }
      };
      img.onerror = () => {
        setPaymentQrCodeUrl(rawDataUrl);
        updateBusinessProfile({ paymentQrCodeUrl: rawDataUrl });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setPaymentQrCodeUrl('');
    updateBusinessProfile({ paymentQrCodeUrl: '' });
    fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: businessName,
        ownerName: ownerName.trim(),
        tagline,
        phone,
        whatsappNumber,
        website: website.trim(),
        paymentQrCodeUrl: '',
        address,
        city,
      }),
    }).catch(() => {});
  };

  // Intervals
  const [defaultInterval, setDefaultInterval] = useState(business.settings.defaultServiceIntervalMonths);
  const [sedimentInterval, setSedimentInterval] = useState(business.settings.sedimentFilterIntervalMonths);
  const [carbonInterval, setCarbonInterval] = useState(business.settings.carbonFilterIntervalMonths);
  const [membraneInterval, setMembraneInterval] = useState(business.settings.membraneIntervalMonths);
  const [uvInterval, setUvInterval] = useState(business.settings.uvLampIntervalMonths);

  // Owner-Configured Service Charges
  const [generalServiceCharge, setGeneralServiceCharge] = useState(business.settings.serviceCharges?.generalService ?? 0);
  const [periodicServiceCharge, setPeriodicServiceCharge] = useState(business.settings.serviceCharges?.periodicService ?? 0);
  const [installationCharge, setInstallationCharge] = useState(business.settings.serviceCharges?.installation ?? 0);
  const [uninstallationCharge, setUninstallationCharge] = useState(business.settings.serviceCharges?.uninstallation ?? 0);
  const [filterReplacementCharge, setFilterReplacementCharge] = useState(business.settings.serviceCharges?.filterReplacement ?? 0);
  const [membraneReplacementCharge, setMembraneReplacementCharge] = useState(business.settings.serviceCharges?.membraneReplacement ?? 0);
  const [uvReplacementCharge, setUvReplacementCharge] = useState(business.settings.serviceCharges?.uvReplacement ?? 0);
  const [leakageRepairCharge, setLeakageRepairCharge] = useState(business.settings.serviceCharges?.leakageRepair ?? 0);
  const [tdsAdjustmentCharge, setTdsAdjustmentCharge] = useState(business.settings.serviceCharges?.tdsAdjustment ?? 0);
  const [emergencyServiceCharge, setEmergencyServiceCharge] = useState(business.settings.serviceCharges?.emergencyService ?? 0);
  const [minimumVisitingFee, setMinimumVisitingFee] = useState(business.settings.serviceCharges?.minimumVisitingFee ?? 0);
  const [averageServiceCost, setAverageServiceCost] = useState(business.settings.averageServiceCost ?? 0);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProfile = {
      name: businessName,
      ownerName: ownerName.trim(),
      tagline,
      phone,
      whatsappNumber,
      website: website.trim(),
      paymentQrCodeUrl,
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
      website: website.trim(),
      paymentQrCodeUrl,
      address,
      city,
    });

    const serviceChargesConfig = {
      generalService: Number(generalServiceCharge) || 0,
      periodicService: Number(periodicServiceCharge) || 0,
      installation: Number(installationCharge) || 0,
      uninstallation: Number(uninstallationCharge) || 0,
      filterReplacement: Number(filterReplacementCharge) || 0,
      membraneReplacement: Number(membraneReplacementCharge) || 0,
      uvReplacement: Number(uvReplacementCharge) || 0,
      leakageRepair: Number(leakageRepairCharge) || 0,
      tdsAdjustment: Number(tdsAdjustmentCharge) || 0,
      emergencyService: Number(emergencyServiceCharge) || 0,
      minimumVisitingFee: Number(minimumVisitingFee) || 0,
    };

    updateBusinessSettings({
      defaultServiceIntervalMonths: defaultInterval,
      sedimentFilterIntervalMonths: sedimentInterval,
      carbonFilterIntervalMonths: carbonInterval,
      membraneIntervalMonths: membraneInterval,
      uvLampIntervalMonths: uvInterval,
      gstin,
      invoicePrefix,
      averageServiceCost: Number(averageServiceCost) || Number(generalServiceCharge) || 0,
      serviceCharges: serviceChargesConfig,
    });

    // 2. Also write directly to disk (src/config/businessProfile.json) so the project folder is permanently configured for this client!
    try {
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cleanProfile,
          averageServiceCost: Number(averageServiceCost) || Number(generalServiceCharge) || 0,
          serviceCharges: serviceChargesConfig,
        }),
      });
    } catch {
      // serverless or offline fallback
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleExportBackup = () => {
    const serviceChargesConfig = {
      generalService: Number(generalServiceCharge) || 0,
      periodicService: Number(periodicServiceCharge) || 0,
      installation: Number(installationCharge) || 0,
      uninstallation: Number(uninstallationCharge) || 0,
      filterReplacement: Number(filterReplacementCharge) || 0,
      membraneReplacement: Number(membraneReplacementCharge) || 0,
      uvReplacement: Number(uvReplacementCharge) || 0,
      leakageRepair: Number(leakageRepairCharge) || 0,
      tdsAdjustment: Number(tdsAdjustmentCharge) || 0,
      emergencyService: Number(emergencyServiceCharge) || 0,
      minimumVisitingFee: Number(minimumVisitingFee) || 0,
    };

    const backup = {
      business: {
        ...business,
        name: businessName,
        ownerName: ownerName.trim(),
        tagline,
        phone,
        whatsappNumber,
        website: website.trim(),
        paymentQrCodeUrl,
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
          averageServiceCost: Number(averageServiceCost) || Number(generalServiceCharge) || 0,
          serviceCharges: serviceChargesConfig,
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

            <div>
              <label className="block font-semibold mb-1 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Business Website Link</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://aquapurero.in or www.aquapurero.com"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Automatically appended to customer WhatsApp messages, reminders, and product brochures alongside your business address.
              </span>
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

            {/* PAYMENT QR CODE (SCAN TO PAY ON INVOICES) */}
            <div className="sm:col-span-2 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
              <div>
                <label className="block font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Payment QR Code (Invoice Scan & Pay)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload your UPI payment QR code photo (PhonePe, Google Pay, Paytm, or BHIM). This QR photo will appear directly on all customer invoices for seamless digital payments.
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="hidden"
              />

              {paymentQrCodeUrl ? (
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 bg-white p-2 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={paymentQrCodeUrl}
                      alt="Uploaded Payment QR"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Active on Invoices
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Shown on print & digital invoices
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Customers can scan this QR photo with any UPI app (GPay, PhonePe, Paytm, Cred) to settle service bills instantly.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => qrFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-600 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Change Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveQr}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    </div>

                    {qrUploadSuccess && (
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                        ✓ QR Code photo updated & active on all invoices!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => qrFileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      + Add Payment QR Code Photo
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Click to upload your QR image (PNG, JPG, WebP up to 5MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs pointer-events-none"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Photo</span>
                  </button>
                </div>
              )}
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

        {/* SERVICE CHARGES & PRICING MASTER (SET BY OWNER) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Service Charges & Labour Rates (Set by Owner)</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Every charge across the engine is strictly controlled here. No automatic charges are added without your approval. Leave as ₹0 if you wish to enter fees manually during job execution.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto shrink-0">
              Owner Controlled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                General RO Service Visit (₹)
              </label>
              <input
                type="number"
                min="0"
                value={generalServiceCharge}
                onChange={(e) => setGeneralServiceCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 250, 300"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Routine inspection & basic cleaning</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Periodic Service Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                value={periodicServiceCharge}
                onChange={(e) => setPeriodicServiceCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 300"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Scheduled 3-month or 6-month maintenance</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                New RO Installation Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                value={installationCharge}
                onChange={(e) => setInstallationCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 400, 500"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Wall mounting, plumbing & initial setup</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Uninstallation / Shifting (₹)
              </label>
              <input
                type="number"
                min="0"
                value={uninstallationCharge}
                onChange={(e) => setUninstallationCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 300"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Dismantling & relocation service</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Filter Replacement Labour (₹)
              </label>
              <input
                type="number"
                min="0"
                value={filterReplacementCharge}
                onChange={(e) => setFilterReplacementCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 150"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Labour fee for pre-filter/carbon/sediment</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Membrane Replacement Labour (₹)
              </label>
              <input
                type="number"
                min="0"
                value={membraneReplacementCharge}
                onChange={(e) => setMembraneReplacementCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 250"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">RO membrane installation & housing flush</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                UV Lamp Replacement Labour (₹)
              </label>
              <input
                type="number"
                min="0"
                value={uvReplacementCharge}
                onChange={(e) => setUvReplacementCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 200"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">UV tube / ballast replacement</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Leakage / Pump Repair Visit (₹)
              </label>
              <input
                type="number"
                min="0"
                value={leakageRepairCharge}
                onChange={(e) => setLeakageRepairCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 200"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Electrical diagnosis, pump, elbow fittings</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                TDS Calibration & Testing (₹)
              </label>
              <input
                type="number"
                min="0"
                value={tdsAdjustmentCharge}
                onChange={(e) => setTdsAdjustmentCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 150"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Mineral booster & TDS adjuster calibration</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Emergency Breakdown Visit (₹)
              </label>
              <input
                type="number"
                min="0"
                value={emergencyServiceCharge}
                onChange={(e) => setEmergencyServiceCharge(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 350"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Same-day urgent priority dispatch</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Minimum Visiting / Inspection Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={minimumVisitingFee}
                onChange={(e) => setMinimumVisitingFee(Number(e.target.value) || 0)}
                placeholder="e.g. 0, 150"
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Doorstep inspection if no repair done</span>
            </div>

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
              <label className="block font-bold text-blue-900 dark:text-blue-300 mb-1">
                Default Renewal Estimate Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={averageServiceCost}
                onChange={(e) => setAverageServiceCost(Number(e.target.value) || 0)}
                placeholder="e.g. 0 or standard routine fee"
                className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-lg font-bold text-blue-950 dark:text-blue-200"
              />
              <span className="text-[10px] text-blue-600/80 dark:text-blue-400 mt-1 block">Used for overdue pipeline valuation</span>
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
