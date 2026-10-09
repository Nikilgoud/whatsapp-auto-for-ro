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
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { getServiceCharge, formatIndianCurrency } from '@/lib/utils';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose }) => {
  const { business, addCustomer, amcPlans, addAmcPlan, addServiceRecord } = useApp();
  const [step, setStep] = useState<number>(1);

  // STEP 1 & 2: Contact & Name
  const [mobileNumber, setMobileNumber] = useState('');
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

  // STEP 5: Service, Warranty & Next Service Due
  const [currentServiceTaken, setCurrentServiceTaken] = useState('New Installation & Setup');
  const [serviceLabourCharge, setServiceLabourCharge] = useState<number>(0);
  const [sparePartName, setSparePartName] = useState('');
  const [servicePartsCharge, setServicePartsCharge] = useState<number>(0);
  const [serviceDate, setServiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nextIntervalChoice, setNextIntervalChoice] = useState<'3_MONTHS' | '6_MONTHS' | 'CUSTOM'>('3_MONTHS');
  const [customIntervalMonths, setCustomIntervalMonths] = useState<number>(3);
  const [customExactDueDate, setCustomExactDueDate] = useState<string>('');
  const [inletTds, setInletTds] = useState('800');
  const [notes, setNotes] = useState('');

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

    const newCustomer = addCustomer(
      {
        businessId: business.id,
        customerCode: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName,
        mobileNumber: cleanPhone,
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
        tags: ['New Customer'],
        notes,
        whatsappOptOut: false,
        totalSpend: (Number(serviceLabourCharge) || 0) + (Number(servicePartsCharge) || 0),
        pendingBalance: 0,
      },
      {
        brand: finalBrand,
        model,
        purifierType: finalPurifierType,
        capacityLph: 15,
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
    const totalAmount = (Number(serviceLabourCharge) || 0) + (Number(servicePartsCharge) || 0);
    const serviceNameFinal = currentServiceTaken.trim() || 'New Installation & Setup';

    addServiceRecord({
      businessId: business.id || 'biz-client-ro',
      customerId: newCustomer.id,
      purifierId: `pur-${newCustomer.id}`,
      serviceType: serviceNameFinal.toLowerCase().includes('installation') ? 'Installation' : 'Installation',
      bookingDate: serviceDate,
      scheduledDate: serviceDate,
      scheduledTimeSlot: 'Completed on Onboarding',
      startedTime: `${serviceDate} 10:00`,
      completedTime: `${serviceDate} 11:00`,
      status: 'Completed',
      issueDescription: `Installation: ${finalBrand} ${model}`,
      workSummary: `Initial RO Installation & Setup (${finalBrand} ${model}). Installed on ${serviceDate}. ${serviceNameFinal !== 'New Installation & Setup' ? `[${serviceNameFinal}]` : ''}`,
      inletWaterTds: parseInt(inletTds, 10) || undefined,
      outputWaterTds: Math.round((parseInt(inletTds, 10) || 800) * 0.1),
      checklists: [],
      partsUsed:
        sparePartName.trim() || servicePartsCharge > 0
          ? [
              {
                id: `p-${Date.now()}`,
                name: sparePartName.trim() || 'RO Spare Part / Filter',
                quantity: 1,
                unitPrice: Number(servicePartsCharge) || 0,
                totalPrice: Number(servicePartsCharge) || 0,
              },
            ]
          : [],
      labourCharge: Number(serviceLabourCharge) || 0,
      partsCharge: Number(servicePartsCharge) || 0,
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

    onClose();
    // Reset Form
    setStep(1);
    setMobileNumber('');
    setFullName('');
    setStreetAddress('');
    setWarrantyExpiry('');
    setSparePartsWarrantyExpiry('');
    setSparePartsWarrantyNotes('');
    setSelectedAmcPlanId('none');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
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
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto max-h-[75vh]">
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
                  <option value="Blue Star">Blue Star</option>
                  <option value="Havells">Havells</option>
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
                  <option value="RO+Alkaline">RO + Alkaline</option>
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
                      'Dust filter (pre-filter) replacement',
                      'Full filter kit replacement',
                      'RO Membrane replacement',
                      'New Installation & Setup',
                      'General Service & Cleaning',
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => {
                          setCurrentServiceTaken(preset);
                          const serviceType = preset.includes('Installation')
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

                {/* DEDICATED CHARGES SECTION (SET BY OWNER) */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                    <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <span>Service & Spare Part Charges</span>
                    </span>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-xs">
                      Total: {formatIndianCurrency((Number(serviceLabourCharge) || 0) + (Number(servicePartsCharge) || 0))}
                    </span>
                  </div>

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

                    {/* 3. Spare Part Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Spare Part Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sediment Filter, Spun Candle, RO Membrane..."
                        value={sparePartName}
                        onChange={(e) => setSparePartName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
                      />
                      {/* Quick spare part suggestions */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Sediment Filter', 'Carbon Filter', 'RO Membrane', 'Pre-Filter Candle', 'Booster Pump'].map((part) => (
                          <button
                            type="button"
                            key={part}
                            onClick={() => setSparePartName(part)}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition"
                          >
                            + {part}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Spare Part Charges */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Spare Part Charges (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={servicePartsCharge}
                        onChange={(e) => setServicePartsCharge(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-900 dark:text-white"
                      />
                    </div>
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
                    Due: {computedNextDueDate}
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
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              <Check className="w-4 h-4" />
              <span>Save & Onboard Customer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
