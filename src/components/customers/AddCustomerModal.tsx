'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CustomerType, PurifierType } from '@/types';
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Phone,
  User,
  MapPin,
  Droplets,
  Calendar,
  Shield,
  ShieldCheck,
  Crosshair,
  Loader2,
  Wrench,
  Sparkles,
  Receipt,
  MessageSquare,
  CheckCheck,
  Eye,
  EyeOff,
  ShoppingCart,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { getServiceCharge, formatIndianCurrency, formatDateDDMMYYYY, generateCustomerCode } from '@/lib/utils';
import { formatBusinessDetailsFooter, appendBusinessFooter } from '@/lib/services/whatsappEngine';

export const COMMON_RO_SPARES = [
  { name: 'Pre-Filter Spun Candle (5 Micron)', price: 150 },
  { name: 'Sediment Filter (10" Melt Blown)', price: 350 },
  { name: 'Pre-Carbon / Activated Carbon Block', price: 350 },
  { name: 'RO Membrane (80 GPD Filmtec/High TDS)', price: 1800 },
  { name: 'Post-Carbon / Taste Enhancer Cartridge', price: 350 },
  { name: 'Alkaline & Mineralizer Filter Cartridge', price: 650 },
  { name: 'UV Lamp (11W Philips / High Intensity)', price: 450 },
  { name: 'UF Ultra Filtration Hollow Fibre Membrane', price: 550 },
  { name: 'RO Booster Pump 100 GPD (Pure Copper)', price: 2200 },
  { name: 'SMPS Power Adapter (24V / 2.5A)', price: 850 },
  { name: 'SV (Solenoid Valve 24V DC)', price: 450 },
  { name: 'FR-450 Flow Restrictor', price: 150 },
  { name: 'Pre-Filter Outer Bowl Housing Set', price: 450 },
  { name: 'Float Valve & Auto Cut-Off Switch', price: 250 },
  { name: 'Low Pressure Switch (LPS) Sensor', price: 250 },
  { name: 'TDS Adjuster Brass Control Valve', price: 350 },
  { name: 'Complete Filter Kit Replacement (Full Set)', price: 2400 },
];

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose }) => {
  const { business, customers, addCustomer, amcPlans, addAmcPlan, addServiceRecord, logCommunication, purifierProducts } = useApp();
  const [step, setStep] = useState<number>(1);

  // Automated WhatsApp Welcome & Onboarding
  const [sendWelcomeWhatsApp, setSendWelcomeWhatsApp] = useState<boolean>(true);
  const [whatsappOptOut, setWhatsappOptOut] = useState<boolean>(false);
  const [showWelcomePreview, setShowWelcomePreview] = useState<boolean>(true);
  const [customWelcomeNote, setCustomWelcomeNote] = useState<string>('');
  const [isEditingWelcomeMsg, setIsEditingWelcomeMsg] = useState<boolean>(false);

  // STEP 1 & 2: Contact & Name
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Residential');

  // STEP 3: Address & Current Location
  const [streetAddress, setStreetAddress] = useState('');
  const [areaLocality, setAreaLocality] = useState('Kondapur');
  const [landmark, setLandmark] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectMsg, setLocationDetectMsg] = useState<string | null>(null);

  // STEP 4: Purifier Specifications
  const [brandDropdown, setBrandDropdown] = useState('CUSTOM');
  const [customBrandName, setCustomBrandName] = useState('Kent');
  const [model, setModel] = useState('Grand+ RO+UV');
  const [purifierTypeDropdown, setPurifierTypeDropdown] = useState<string>('RO+UV');
  const [customPurifierType, setCustomPurifierType] = useState('RO + Alkaline');

  // STEP 5: Service, Warranty, Machine Purchase & Next Service Due
  const [currentServiceTaken, setCurrentServiceTaken] = useState('New Installation & Setup');
  const [isNewPurifierSale, setIsNewPurifierSale] = useState<boolean>(true);
  const [purifierPrice, setPurifierPrice] = useState<number>(14500);
  const [purifierSerialNo, setPurifierSerialNo] = useState<string>('');
  const [matchedCatalogProduct, setMatchedCatalogProduct] = useState<string>('');
  const [serviceLabourCharge, setServiceLabourCharge] = useState<number>(0);
  
  // Multi-item spare parts list for Step 5 (starts empty, no automatic parts)
  const [sparePartsList, setSparePartsList] = useState<Array<{ id: string; name: string; price: number }>>([]);

  const totalSparePartsCharge = sparePartsList.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0
  );

  const handleAddSparePart = (initialName: string = '', initialPrice?: number) => {
    const matched = COMMON_RO_SPARES.find((s) => s.name.toLowerCase().includes(initialName.toLowerCase()));
    const finalPrice = initialPrice !== undefined ? initialPrice : (matched ? matched.price : 0);
    setSparePartsList((prev) => [
      ...prev,
      {
        id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: initialName,
        price: finalPrice,
      },
    ]);
  };

  const handleUpdateSparePart = (id: string, updates: Partial<{ name: string; price: number }>) => {
    setSparePartsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveSparePart = (id: string) => {
    setSparePartsList((prev) => prev.filter((item) => item.id !== id));
  };

  const [serviceDate, setServiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nextIntervalChoice, setNextIntervalChoice] = useState<'3_MONTHS' | '6_MONTHS' | 'CUSTOM'>('3_MONTHS');
  const [customIntervalMonths, setCustomIntervalMonths] = useState<number>(3);
  const [customExactDueDate, setCustomExactDueDate] = useState<string>('');
  const [inletTds, setInletTds] = useState('800');
  const [notes, setNotes] = useState('');

  // Auto-fill price from catalog if available
  React.useEffect(() => {
    if (purifierProducts && purifierProducts.length > 0) {
      const match = purifierProducts.find(
        (p) =>
          p.model.toLowerCase().includes('grand') ||
          p.brand.toLowerCase() === 'kent'
      );
      if (match && match.sellingPrice) {
        setPurifierPrice(match.sellingPrice);
      }
    }
  }, [purifierProducts]);

  // Warranty Details (Optional)
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [sparePartsWarrantyExpiry, setSparePartsWarrantyExpiry] = useState('');
  const [sparePartsWarrantyNotes, setSparePartsWarrantyNotes] = useState('');

  // AMC Details (Optional)
  const [selectedAmcPlanId, setSelectedAmcPlanId] = useState('none');
  const [customAmcPlanName, setCustomAmcPlanName] = useState('Custom Maintenance Contract');
  const [customAmcPlanPrice, setCustomAmcPlanPrice] = useState<number>(2999);
  const [customAmcPlanVisits, setCustomAmcPlanVisits] = useState<number>(3);

  if (!isOpen) return null;

  // Calculate Next Service Due Date
  const calculateNextDueDate = (): string => {
    try {
      const baseDate = serviceDate ? new Date(serviceDate) : new Date();
      if (nextIntervalChoice === '3_MONTHS') {
        return format(addMonths(baseDate, 3), 'yyyy-MM-dd');
      }
      if (nextIntervalChoice === '6_MONTHS') {
        return format(addMonths(baseDate, 6), 'yyyy-MM-dd');
      }
      if (nextIntervalChoice === 'CUSTOM') {
        if (customExactDueDate) return customExactDueDate;
        return format(addMonths(baseDate, Number(customIntervalMonths) || 3), 'yyyy-MM-dd');
      }
      return format(addMonths(baseDate, 3), 'yyyy-MM-dd');
    } catch {
      return format(addMonths(new Date(), 3), 'yyyy-MM-dd');
    }
  };

  const computedNextDueDate = calculateNextDueDate();
  const finalBrand = brandDropdown === 'CUSTOM' ? customBrandName.trim() || 'Aquapure' : brandDropdown;
  const finalPurifierType =
    purifierTypeDropdown === 'CUSTOM'
      ? (customPurifierType.trim() as any) || 'RO+UV'
      : (purifierTypeDropdown as PurifierType);

  // Helper to generate live personalized WhatsApp Welcome / Onboarding message
  const generateWelcomeMessage = (): string => {
    const custName = fullName.trim() || 'Customer';
    const purifierName = `${finalBrand} ${model}`.trim();
    const calculatedOutputTds = Math.round((parseInt(inletTds, 10) || 800) * 0.1);
    const dueDateDisplay = computedNextDueDate
      ? formatDateDDMMYYYY(computedNextDueDate)
      : formatDateDDMMYYYY(addMonths(new Date(), 3));

    const bName = business?.name || 'Aquapure RO Care';
    const bFooter = formatBusinessDetailsFooter(business);

    if (customWelcomeNote.trim()) {
      return appendBusinessFooter(customWelcomeNote.trim(), business);
    }

    return (
      `Welcome ${custName}! 🚰\n` +
      `Thank you for registering with ${bName}. Your ${isNewPurifierSale ? 'new ' : ''}${purifierName} has been registered with initial TDS ${calculatedOutputTds} ppm.\n` +
      `🗓️ Your upcoming scheduled service date is: ${dueDateDisplay}.\n` +
      `For any service assistance, filter check, or emergency water breakdown, reply to this WhatsApp number anytime!\n\n` +
      bFooter
    );
  };

  // Handle GPS Current Location Detection
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationDetectMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const detectedArea =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.village ||
              addr.city_district ||
              'Hyderabad';
            const detectedStreet = [addr.road, addr.house_number].filter(Boolean).join(', ');
            const detectedLandmark = addr.amenity || addr.shop || '';

            if (detectedArea) setAreaLocality(detectedArea);
            if (detectedStreet) setStreetAddress(detectedStreet);
            if (detectedLandmark) setLandmark(detectedLandmark);

            setLocationDetectMsg(`📍 Location detected: ${detectedArea}`);
          } else {
            setAreaLocality('Detected GPS Location');
            setLocationDetectMsg(`📍 Location coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          console.error('Error reverse geocoding:', err);
          setLocationDetectMsg('GPS coordinates captured. You can adjust details manually.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsDetectingLocation(false);
        alert('Could not detect location automatically. Please enter your address manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = () => {
    if (!mobileNumber || !fullName) {
      alert('Please fill customer name and phone number');
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '').slice(-10);
    const cleanAltPhone = alternateMobile.replace(/\D/g, '').slice(-10);
    const finalBrand = brandDropdown === 'CUSTOM' ? customBrandName.trim() || 'Custom RO' : brandDropdown;
    const finalPurifierType =
      purifierTypeDropdown === 'CUSTOM'
        ? (customPurifierType.trim() as any) || 'RO+UV'
        : (purifierTypeDropdown as PurifierType);

    let finalAmcPlanId: string | undefined = undefined;

    // Handle Custom AMC Plan if typed
    if (selectedAmcPlanId === 'CUSTOM') {
      const createdPlan = addAmcPlan({
        businessId: business.id,
        name: customAmcPlanName.trim() || 'Custom AMC Plan',
        description: `Custom maintenance contract with ${customAmcPlanVisits} visits per year.`,
        durationMonths: 12,
        annualVisits: Number(customAmcPlanVisits) || 3,
        price: Number(customAmcPlanPrice) || 2999,
        isMembraneCovered: false,
        isFiltersCovered: true,
        isElectricalCovered: true,
        isLabourCovered: true,
      });
      finalAmcPlanId = createdPlan.id;
    } else if (selectedAmcPlanId !== 'none') {
      finalAmcPlanId = selectedAmcPlanId;
    }

    const finalMachinePrice = isNewPurifierSale ? (Number(purifierPrice) || 0) : 0;
    const totalAmount = finalMachinePrice + (Number(serviceLabourCharge) || 0) + totalSparePartsCharge;
    const serviceNameFinal = currentServiceTaken.trim() || 'New Installation & Setup';

    const newCustomer = addCustomer(
      {
        businessId: business.id,
        customerCode: generateCustomerCode(customers),
        fullName,
        mobileNumber: cleanPhone,
        alternateMobile: cleanAltPhone || undefined,
        alternativePhone: cleanAltPhone || undefined,
        whatsappNumber: `91${cleanPhone}`,
        houseFlatNo: '',
        streetAddress,
        areaLocality,
        city: business.city || 'Hyderabad',
        state: business.state || 'Telangana',
        pincode: '500084',
        landmark,
        customerType,
        status: finalAmcPlanId ? 'AMC active' : 'Active customer',
        tags: isNewPurifierSale ? ['New Purifier Unit', 'New Customer'] : ['New Customer'],
        notes: [notes, isNewPurifierSale ? `New Machine Sale: ${finalBrand} ${model} (${formatIndianCurrency(finalMachinePrice)})` : ''].filter(Boolean).join(' | '),
        whatsappOptOut,
        languagePreference: 'en',
        totalSpend: totalAmount,
        pendingBalance: 0,
      },
      {
        brand: finalBrand,
        model,
        purifierType: finalPurifierType,
        capacityLph: 15,
        serialNumber: purifierSerialNo.trim() || undefined,
        installationDate: serviceDate,
        purchaseDate: serviceDate,
        warrantyStart: serviceDate,
        warrantyExpiry: warrantyExpiry || undefined,
        sparePartsWarrantyExpiry: sparePartsWarrantyExpiry || undefined,
        sparePartsWarrantyNotes: sparePartsWarrantyNotes || undefined,
        lastServiceDate: serviceDate,
        nextServiceDueDate: computedNextDueDate,
        installationLocation: 'Kitchen',
        currentCondition: 'Good',
        inletTdsBaseline: parseInt(inletTds, 10) || 800,
        outputTdsBaseline: Math.round((parseInt(inletTds, 10) || 800) * 0.1),
        amcPlanId: finalAmcPlanId,
      } as any
    );

    // PERMANENT INSTALLATION & SERVICE RECORD IN SERVICE HISTORY
    const partsUsedList: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    if (finalMachinePrice > 0) {
      partsUsedList.push({
        id: `p-machine-${Date.now()}`,
        name: `${finalBrand} ${model} (New Purifier Unit)`,
        quantity: 1,
        unitPrice: finalMachinePrice,
        totalPrice: finalMachinePrice,
      });
    }

    sparePartsList.forEach((sp, idx) => {
      const spName = sp.name.trim();
      const spPrice = Number(sp.price) || 0;
      if (spName || spPrice > 0) {
        partsUsedList.push({
          id: sp.id || `p-part-${idx}-${Date.now()}`,
          name: spName || `RO Spare Part #${idx + 1}`,
          quantity: 1,
          unitPrice: spPrice,
          totalPrice: spPrice,
        });
      }
    });

    const sparePartsSummary = partsUsedList
      .filter((p) => !p.id.includes('machine'))
      .map((p) => p.name)
      .join(', ');

    addServiceRecord({
      businessId: business.id,
      customerId: newCustomer.id,
      purifierId: `pur-${newCustomer.id}`,
      serviceType: serviceNameFinal.toLowerCase().includes('installation') ? 'Installation' : 'Installation',
      bookingDate: serviceDate,
      scheduledDate: serviceDate,
      scheduledTimeSlot: 'Completed on Onboarding',
      startedTime: `${serviceDate} 10:00`,
      completedTime: `${serviceDate} 11:00`,
      status: 'Completed',
      issueDescription: isNewPurifierSale
        ? `New Purifier Sale & Installation: ${finalBrand} ${model}${sparePartsSummary ? ` + Spares: ${sparePartsSummary}` : ''}`
        : `Service & Spares: ${finalBrand} ${model}${sparePartsSummary ? ` (${sparePartsSummary})` : ''}`,
      workSummary: isNewPurifierSale
        ? `Installed new ${finalBrand} ${model} purifier unit (${formatIndianCurrency(finalMachinePrice)}). ${serviceNameFinal} completed on ${serviceDate}.${sparePartsSummary ? ` Replaced: ${sparePartsSummary}.` : ''} Initial TDS calibrated.`
        : `Initial RO Installation & Setup (${finalBrand} ${model}). Installed on ${serviceDate}. ${serviceNameFinal !== 'New Installation & Setup' ? `[${serviceNameFinal}]` : ''}.${sparePartsSummary ? ` Spares: ${sparePartsSummary}.` : ''}`,
      inletWaterTds: parseInt(inletTds, 10) || undefined,
      outputWaterTds: Math.round((parseInt(inletTds, 10) || 800) * 0.1),
      checklists: [],
      partsUsed: partsUsedList,
      labourCharge: Number(serviceLabourCharge) || 0,
      partsCharge: totalSparePartsCharge + finalMachinePrice,
      discount: 0,
      tax: 0,
      total: totalAmount,
      amountPaid: totalAmount,
      amountPending: 0,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI',
      beforePhotos: [],
      afterPhotos: [],
    });

    // AUTOMATED WHATSAPP WELCOME & ONBOARDING DISPATCH
    if (sendWelcomeWhatsApp && !whatsappOptOut && cleanPhone.length >= 10) {
      const welcomeContent = generateWelcomeMessage();
      const outputTdsCalc = Math.round((parseInt(inletTds, 10) || 800) * 0.1);

      // 1. Dispatch through WhatsApp Cloud API / mock engine
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: `91${cleanPhone}`,
          customerId: newCustomer.id,
          customerName: fullName.trim(),
          area: areaLocality,
          purifierBrand: finalBrand,
          purifierModel: model,
          nextDueDate: computedNextDueDate,
          outputTds: outputTdsCalc,
          bodyText: welcomeContent,
          languageCode: 'en',
        }),
      }).catch((err) => console.warn('Failed to dispatch welcome WhatsApp message:', err));

      // 2. Log in AppContext communication logs for immediate audit and UI visibility
      logCommunication({
        businessId: business.id,
        customerId: newCustomer.id,
        channel: 'WhatsApp',
        templateKey: 'WELCOME_ONBOARDING',
        language: 'en',
        messageText: welcomeContent,
        status: 'Delivered',
        responseReceived: false,
      });
    }

    onClose();
    // Reset Form
    setStep(1);
    setMobileNumber('');
    setAlternateMobile('');
    setFullName('');
    setStreetAddress('');
    setWarrantyExpiry('');
    setSparePartsWarrantyExpiry('');
    setSparePartsWarrantyNotes('');
    setSelectedAmcPlanId('none');
    setSendWelcomeWhatsApp(true);
    setWhatsappOptOut(false);
    setCustomWelcomeNote('');
    setIsEditingWelcomeMsg(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Add New RO Customer (Step {step} of 5)
            </h3>
            <p className="text-xs text-slate-500">Fast customer registration designed for Indian RO dealers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto max-h-[80vh]">
          {/* STEP 1: Phone */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Step 1: Mobile Phone Number</h4>
                  <p className="text-xs text-slate-500">Auto-routes WhatsApp service reminders</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                    Customer ID
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {generateCustomerCode(customers)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  10-Digit Mobile / WhatsApp Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    autoFocus
                    placeholder="98765 43210"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alternative Mobile Number (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    placeholder="98490 00000"
                    maxLength={10}
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Secondary phone for technician calls and emergency service communications
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Name & Type */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Step 2: Customer Name & Type</h4>
                  <p className="text-xs text-slate-500">Individual or commercial establishment</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name / Business Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Rajesh Kumar or Cafe Niloufer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Customer Type
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial (Large Plant)</option>
                  <option value="Office">Office / IT Company</option>
                  <option value="Restaurant">Restaurant / Cafe</option>
                  <option value="School">School / College</option>
                  <option value="Hospital">Hospital / Clinic</option>
                  <option value="Apartment">Apartment Community</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Address & Current Location */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Step 3: Doorstep Service Address</h4>
                    <p className="text-xs text-slate-500">Detect location automatically or type manually</p>
                  </div>
                </div>

                {/* CURRENT LOCATION BUTTON */}
                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={isDetectingLocation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 rounded-xl font-semibold text-xs transition border border-blue-200 dark:border-blue-800 shadow-xs"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                      <span>Current Location</span>
                    </>
                  )}
                </button>
              </div>

              {locationDetectMsg && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{locationDetectMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Locality / Area (Hyderabad) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kondapur, Madhapur, Gachibowli, Kukatpally"
                  value={areaLocality}
                  onChange={(e) => setAreaLocality(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Street Address & Flat/House No
                </label>
                <textarea
                  rows={2}
                  placeholder="Flat 402, Aditya Elite, Raghavendra Colony..."
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Landmark
                </label>
                <input
                  type="text"
                  placeholder="Near Botanical Garden / Opp. Metro Station"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Purifier Brand & Type (With Direct Typing) */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Step 4: Purifier Specifications</h4>
                  <p className="text-xs text-slate-500">Choose from top brands or type custom brand & purifier type</p>
                </div>
              </div>

              {/* BRAND SELECTION & DIRECT TYPING */}
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Purifier Brand
                </label>

                <select
                  value={brandDropdown}
                  onChange={(e) => setBrandDropdown(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
                >
                  <option value="CUSTOM">✏️ [Type Custom Brand / Enter Name Below]</option>
                  <option value="Kent">Kent</option>
                  <option value="Aquaguard / Eureka Forbes">Aquaguard / Eureka Forbes</option>
                  <option value="Livpure">Livpure</option>
                  <option value="Pureit / HUL">Pureit / HUL</option>
                  <option value="Havells">Havells</option>
                  <option value="Blue Star">Blue Star</option>
                  <option value="Aquafresh">Aquafresh</option>
                  <option value="Aqua 2090">Aqua 2090</option>
                  <option value="Aqua 4070">Aqua 4070</option>
                  <option value="Aqua Innvoica">Aqua Innvoica</option>
                  <option value="Purosis">Purosis</option>
                  <option value="Purosis Plus">Purosis Plus</option>
                  <option value="Finpure">Finpure</option>
                  <option value="Aqua Pearl">Aqua Pearl</option>
                  <option value="Aqua Copper">Aqua Copper</option>
                  <option value="Royal Copper">Royal Copper</option>
                  <option value="Cosmax">Cosmax</option>
                  <option value="Lx One">Lx One</option>
                  <option value="G + Series">G + Series</option>
                  <option value="AO Smith">AO Smith</option>
                  <option value="Voltas Beko">Voltas Beko</option>
                  <option value="Assembled / Local RO">Assembled / Local RO</option>
                  <option value="Commercial RO Plant">Commercial RO Plant</option>
                </select>

                {/* Direct Typing for Brand */}
                {brandDropdown === 'CUSTOM' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Type Brand Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ZeroB, Crux, Dolphin, Aquafresh, Aqua Grand..."
                      value={customBrandName}
                      onChange={(e) => setCustomBrandName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* PURIFIER TYPE SELECTION & DIRECT TYPING */}
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Purifier Technology / Type
                </label>

                <select
                  value={purifierTypeDropdown}
                  onChange={(e) => setPurifierTypeDropdown(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
                >
                  <option value="RO">RO Only</option>
                  <option value="RO+UV">RO + UV</option>
                  <option value="RO+UV+UF">RO + UV + UF</option>
                  <option value="RO+UV+UF+Alkaline">RO + UV + UF + Alkaline</option>
                  <option value="RO+UV+Copper">RO + UV + Copper</option>
                  <option value="Ro + Copper + Zink">Ro + Copper + Zink</option>
                  <option value="Ro + Alkaline">Ro + Alkaline</option>
                  <option value="Ro + Copper + Alkaline">Ro + Copper + Alkaline</option>
                  <option value="Commercial RO">Commercial RO (50+ LPH)</option>
                  <option value="CUSTOM">✏️ [Type Custom Purifier Type Below]</option>
                </select>

                {/* Direct Typing for Purifier Type */}
                {purifierTypeDropdown === 'CUSTOM' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Type Custom Purifier Type:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Copper Alkaline RO, UV Only, Industrial RO..."
                      value={customPurifierType}
                      onChange={(e) => setCustomPurifierType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Model Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand+ Mineral RO / Geneus Active Copper"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Service Taken, Next Service Interval & AMC */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Step 5: Service, Warranty & Intervals</h4>
                  <p className="text-[11px] text-slate-500">Record current work, next service schedule (3 or 6 months), and AMC</p>
                </div>
              </div>

              {/* CURRENT SERVICE TAKEN & SERVICE DATE */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold text-xs">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>Current Service / Work Taken</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    What service is customer taking today? (e.g. changing dust filter) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Changing dust filter (pre-filter), Sediment & Carbon replacement..."
                    value={currentServiceTaken}
                    onChange={(e) => setCurrentServiceTaken(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
                  />
                  {/* Quick Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'New Installation & Setup',
                      'Dust filter (pre-filter) replacement',
                      'Full filter kit replacement',
                      'RO Membrane replacement',
                      'General Service & Cleaning',
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => {
                          setCurrentServiceTaken(preset);
                          const isInstall = preset.toLowerCase().includes('installation');
                          setIsNewPurifierSale(isInstall);
                          const serviceType = isInstall
                            ? 'Installation'
                            : preset.includes('Membrane')
                            ? 'Membrane replacement'
                            : preset.includes('filter')
                            ? 'Filter replacement'
                            : 'General service';
                          const configuredCharge = getServiceCharge(serviceType, business?.settings);
                          setServiceLabourCharge(configuredCharge);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition ${
                          currentServiceTaken === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Service Date
                    </label>
                    <input
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Raw Inlet TDS (ppm)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 800"
                      value={inletTds}
                      onChange={(e) => setInletTds(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* ======================================================== */}
                {/* SUBSECTION: NEW PURIFIER MACHINE PRICE & PURCHASE DETAILS */}
                {/* ======================================================== */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    isNewPurifierSale
                      ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-cyan-50/30 dark:from-emerald-950/40 dark:via-teal-950/25 dark:to-slate-900 border-emerald-300 dark:border-emerald-700/80 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isNewPurifierSale
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            New Purifier Machine Sale & Pricing
                          </h4>
                          {isNewPurifierSale && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-700">
                              NEW UNIT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Add new machine price to customer invoice & service warranty record
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNewPurifierSale}
                        onChange={(e) => setIsNewPurifierSale(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 shadow-xs"></div>
                    </label>
                  </div>

                  {isNewPurifierSale && (
                    <div className="pt-2.5 border-t border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
                      {/* Purifier Info & Catalog Quick Match */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                              Purifier Device (from Step 4):
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {finalBrand} {model} <span className="text-emerald-600 dark:text-emerald-400">({finalPurifierType})</span>
                            </span>
                          </div>
                        </div>

                        {/* Quick pick from sales catalog */}
                        {purifierProducts && purifierProducts.length > 0 && (
                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Catalog:</span>
                            <select
                              value={matchedCatalogProduct}
                              onChange={(e) => {
                                const prodId = e.target.value;
                                setMatchedCatalogProduct(prodId);
                                const found = purifierProducts.find((p) => p.id === prodId);
                                if (found) {
                                  setPurifierPrice(found.sellingPrice);
                                  if (found.brand) {
                                    setBrandDropdown(found.brand);
                                    setCustomBrandName(found.brand);
                                  }
                                  if (found.model) setModel(found.model);
                                  if (found.purifierType) setPurifierTypeDropdown(found.purifierType);
                                }
                              }}
                              className="text-[11px] font-semibold bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 outline-none max-w-[210px]"
                            >
                              <option value="">-- Match from Catalog --</option>
                              {purifierProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.brand} {p.model} (₹{p.sellingPrice.toLocaleString('en-IN')})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Machine Price & Serial Number Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            New Purifier Selling Price (₹) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={purifierPrice}
                              onChange={(e) => setPurifierPrice(Number(e.target.value) || 0)}
                              placeholder="14500"
                              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg outline-none font-bold text-emerald-900 dark:text-emerald-300 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                            />
                          </div>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 block">
                            Itemized on initial bill & credited to customer spend
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Purifier Serial Number (S/N) (Optional)
                          </label>
                          <input
                            type="text"
                            value={purifierSerialNo}
                            onChange={(e) => setPurifierSerialNo(e.target.value)}
                            placeholder="e.g. SN-KENT-2026-9842"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono text-slate-800 dark:text-slate-200"
                          />
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                            Used for warranty, filter replacement & QR stickers
                          </span>
                        </div>
                      </div>

                      {/* Included Warranty & Service Note */}
                      <div className="flex items-center gap-2 p-2 bg-emerald-100/70 dark:bg-emerald-950/40 rounded-lg text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Includes 12-Month Official Machine Warranty + Free Pre-Filter & Installation Service.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* DEDICATED CHARGES SECTION (SET BY OWNER) */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                    <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <span>Service & Spare Part Charges</span>
                    </span>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-xs">
                      Total: {formatIndianCurrency((isNewPurifierSale ? (Number(purifierPrice) || 0) : 0) + (Number(serviceLabourCharge) || 0) + totalSparePartsCharge)}
                    </span>
                  </div>

                  {/* Dynamic itemization if new machine was purchased */}
                  {isNewPurifierSale && (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-xs border border-emerald-200 dark:border-emerald-800">
                      <span className="text-emerald-900 dark:text-emerald-200 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>New Purifier Unit: {finalBrand} {model}</span>
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {formatIndianCurrency(Number(purifierPrice) || 0)}
                      </span>
                    </div>
                  )}

                  {/* Dynamic itemization of added spare parts in summary */}
                  {sparePartsList.filter((p) => p.name.trim() || p.price > 0).map((part, idx) => (
                    <div
                      key={part.id || idx}
                      className="flex items-center justify-between p-2 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-lg text-xs border border-indigo-200/70 dark:border-indigo-800"
                    >
                      <span className="text-indigo-950 dark:text-indigo-200 font-semibold flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{part.name.trim() || `Spare Part #${idx + 1}`}</span>
                      </span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        {formatIndianCurrency(Number(part.price) || 0)}
                      </span>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Service Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New Installation & Setup, Periodic Service..."
                        value={currentServiceTaken}
                        onChange={(e) => setCurrentServiceTaken(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
                      />
                    </div>

                    {/* 2. Service Charges */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Service Charges / Labour (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={serviceLabourCharge}
                        onChange={(e) => setServiceLabourCharge(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* 3. MULTI-SPARE PARTS & REPAIR ITEMS LIST */}
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                        <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          Replaced Spare Parts & Filters ({sparePartsList.filter(p => p.name.trim() || p.price > 0).length})
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        {totalSparePartsCharge > 0 && (
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                            Parts Total: {formatIndianCurrency(totalSparePartsCharge)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddSparePart()}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Spare Part</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Quick Add:</span>
                      {COMMON_RO_SPARES.slice(0, 8).map((sp) => (
                        <button
                          type="button"
                          key={sp.name}
                          onClick={() => {
                            const emptyItem = sparePartsList.find((p) => !p.name.trim() && p.price === 0);
                            if (emptyItem) {
                              handleUpdateSparePart(emptyItem.id, { name: sp.name, price: sp.price });
                            } else {
                              handleAddSparePart(sp.name, sp.price);
                            }
                          }}
                          className="px-2 py-0.5 rounded-md text-[9px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                        >
                          + {sp.name}
                        </button>
                      ))}
                    </div>

                    {/* If no spare parts added yet */}
                    {sparePartsList.length === 0 ? (
                      <div className="p-3.5 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/60 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No spare parts added yet. Click <strong className="text-indigo-600 dark:text-indigo-400">"+ Add Spare Part"</strong> or a quick chip above if any filters or parts were replaced.
                        </p>
                      </div>
                    ) : (
                      /* Spare Parts Rows (Name & Price - NO quantity) */
                      <div className="space-y-2.5">
                        {sparePartsList.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200/80 dark:border-slate-700 shadow-xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black">
                                  {index + 1}
                                </span>
                                <span>Spare Part #{index + 1} {item.name ? `— ${item.name}` : ''}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSparePart(item.id)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-0.5 rounded-md transition cursor-pointer"
                                title="Remove spare part"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>

                            {/* Dropdown Picker for Spare Part Name */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Choose Spare Part Name
                              </label>
                              <select
                                value={COMMON_RO_SPARES.some((s) => s.name === item.name) ? item.name : ''}
                                onChange={(e) => {
                                  const selectedName = e.target.value;
                                  if (selectedName) {
                                    const matched = COMMON_RO_SPARES.find((s) => s.name === selectedName);
                                    handleUpdateSparePart(item.id, {
                                      name: selectedName,
                                      price: matched ? matched.price : item.price,
                                    });
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                              >
                                <option value="">-- Select Spare Part from List --</option>
                                {COMMON_RO_SPARES.map((s) => (
                                  <option key={s.name} value={s.name}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Inputs: Spare Part Name & Price (NO Quantity) */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-8">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Spare Part Name (Editable / Custom) *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Sediment Filter, Spun Candle, RO Membrane..."
                                  value={item.name}
                                  onChange={(e) => handleUpdateSparePart(item.id, { name: e.target.value })}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-900 dark:text-white"
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Price (₹) *
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={item.price || ''}
                                    onChange={(e) => handleUpdateSparePart(item.id, { price: Number(e.target.value) || 0 })}
                                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom Add button */}
                    <button
                      type="button"
                      onClick={() => handleAddSparePart()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Another Spare Part</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* NEXT SERVICE INTERVAL: 3 MONTHS, 6 MONTHS, OR TYPE CUSTOM */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Next Service Interval Schedule</span>
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    Due: {formatDateDDMMYYYY(computedNextDueDate)}
                  </span>
                </div>

                {/* Interval Options */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNextIntervalChoice('3_MONTHS')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      nextIntervalChoice === '3_MONTHS'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs block">3 Months</span>
                    <span className="text-[10px] text-slate-500 block">Pre-Filter / Dust</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNextIntervalChoice('6_MONTHS')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      nextIntervalChoice === '6_MONTHS'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs block">6 Months</span>
                    <span className="text-[10px] text-slate-500 block">Carbon & General</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNextIntervalChoice('CUSTOM')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      nextIntervalChoice === 'CUSTOM'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs block">Custom</span>
                    <span className="text-[10px] text-slate-500 block">Type Months/Date</span>
                  </button>
                </div>

                {/* If Custom selected: allow typing custom months or exact date */}
                {nextIntervalChoice === 'CUSTOM' && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Type Interval (Months):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={customIntervalMonths}
                        onChange={(e) => {
                          setCustomIntervalMonths(Number(e.target.value));
                          setCustomExactDueDate('');
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold"
                        placeholder="e.g. 4 or 8 months"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Or Pick Exact Due Date:
                      </label>
                      <input
                        type="date"
                        value={customExactDueDate}
                        onChange={(e) => setCustomExactDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* WARRANTY DETAILS (OPTIONAL) */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Warranty Details (Optional)</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                    Spare Parts & Purifier
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Machine Warranty Expiry
                    </label>
                    <input
                      type="date"
                      value={warrantyExpiry}
                      onChange={(e) => setWarrantyExpiry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Spare Parts Warranty Expiry
                    </label>
                    <input
                      type="date"
                      value={sparePartsWarrantyExpiry}
                      onChange={(e) => setSparePartsWarrantyExpiry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Covered Spares Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Booster Pump & SMPS Adapter covered"
                    value={sparePartsWarrantyNotes}
                    onChange={(e) => setSparePartsWarrantyNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* AMC CONTRACT ENROLLMENT (WITH CUSTOM PLAN TYPING) */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Annual Maintenance Contract (AMC) (Optional)</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                    Recurring Plan
                  </span>
                </div>

                <div>
                  <select
                    value={selectedAmcPlanId}
                    onChange={(e) => setSelectedAmcPlanId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
                  >
                    <option value="none">None / Pay-per-service (No AMC Contract)</option>
                    <option value="CUSTOM">✨ + Type Custom AMC Plan for this Customer</option>
                    {amcPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price.toLocaleString('en-IN')}/yr ({plan.annualVisits} visits)
                      </option>
                    ))}
                  </select>
                </div>

                {/* If Custom AMC Plan is selected in dropdown */}
                {selectedAmcPlanId === 'CUSTOM' && (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Type Custom Plan Name:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1-Year Full Purifier AMC"
                        value={customAmcPlanName}
                        onChange={(e) => setCustomAmcPlanName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Plan Price (₹):
                        </label>
                        <input
                          type="number"
                          value={customAmcPlanPrice}
                          onChange={(e) => setCustomAmcPlanPrice(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Visits Included:
                        </label>
                        <input
                          type="number"
                          value={customAmcPlanVisits}
                          onChange={(e) => setCustomAmcPlanVisits(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* AUTOMATED WHATSAPP WELCOME / ONBOARDING MESSAGE SECTION */}
              {/* ========================================================= */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/25 dark:to-teal-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                {/* Header with Switch Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Send WhatsApp Welcome Message
                        </span>
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold px-1.5 py-0.2 rounded">
                          AUTO
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Instant onboarding receipt & scheduled service reminder
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWelcomeWhatsApp && !whatsappOptOut}
                      disabled={whatsappOptOut}
                      onChange={(e) => setSendWelcomeWhatsApp(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 shadow-xs"></div>
                  </label>
                </div>

                {/* Sub-controls when enabled */}
                {sendWelcomeWhatsApp && !whatsappOptOut && (
                  <div className="space-y-2.5 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                    {/* Preview Toggle Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Live Preview ({mobileNumber ? `+91 ${mobileNumber}` : '+91 XXXXX XXXXX'}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowWelcomePreview(!showWelcomePreview)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        {showWelcomePreview ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Show Preview
                          </>
                        )}
                      </button>
                    </div>

                    {/* Live WhatsApp Bubble Preview */}
                    {showWelcomePreview && (
                      <div className="bg-[#e5ddd5] dark:bg-slate-900/90 p-3 rounded-xl border border-emerald-300/60 dark:border-emerald-800/80 shadow-inner">
                        <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-black/5 dark:border-white/10 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>WhatsApp Cloud Service Desk • {business.name}</span>
                        </div>

                        {/* Speech Bubble */}
                        <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded-xl rounded-tl-xs shadow-xs text-xs space-y-1.5 leading-relaxed font-normal">
                          <p className="whitespace-pre-wrap">{generateWelcomeMessage()}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                            <span>{format(new Date(), 'hh:mm a')}</span>
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
                          </div>
                        </div>

                        {/* Custom message edit toggle */}
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            Auto-fills Customer Name, RO Brand, TDS ({Math.round((parseInt(inletTds, 10) || 800) * 0.1)} ppm) & Due Date
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingWelcomeMsg(!isEditingWelcomeMsg)}
                            className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {isEditingWelcomeMsg ? 'Done Customizing' : '✏️ Edit Template Text'}
                          </button>
                        </div>

                        {isEditingWelcomeMsg && (
                          <div className="mt-2 animate-in fade-in">
                            <textarea
                              rows={3}
                              value={customWelcomeNote || generateWelcomeMessage()}
                              onChange={(e) => setCustomWelcomeNote(e.target.value)}
                              placeholder="Type custom welcome message text..."
                              className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            {customWelcomeNote && (
                              <button
                                type="button"
                                onClick={() => setCustomWelcomeNote('')}
                                className="text-[10px] text-rose-500 hover:underline mt-0.5"
                              >
                                Reset to Default Template
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* WhatsApp Opt-Out Checkbox */}
                <div className="pt-1.5 border-t border-emerald-200/40 dark:border-emerald-800/30 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="whatsappOptOutCheck"
                    checked={whatsappOptOut}
                    onChange={(e) => {
                      setWhatsappOptOut(e.target.checked);
                      if (e.target.checked) setSendWelcomeWhatsApp(false);
                    }}
                    className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="whatsappOptOutCheck" className="text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                    Customer requested WhatsApp Opt-Out (Do not send welcome message or reminder alerts)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => {
                if (step === 1 && mobileNumber.length < 10) {
                  alert('Please enter a valid 10-digit mobile number');
                  return;
                }
                if (step === 2 && !fullName.trim()) {
                  alert('Please enter customer full name');
                  return;
                }
                setStep(step + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Total Amount:</span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                  {formatIndianCurrency(
                    (isNewPurifierSale ? (Number(purifierPrice) || 0) : 0) +
                    (Number(serviceLabourCharge) || 0) +
                    totalSparePartsCharge
                  )}
                </span>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
              >
                <Check className="w-4 h-4" />
                <span>Save & Onboard Customer</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
