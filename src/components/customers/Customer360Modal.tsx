'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Purifier, ServiceRecord, CommunicationLog, ServiceType, ServiceStatus } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatIndianCurrency, getServiceCharge } from '@/lib/utils';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Wrench,
  Shield,
  ShieldCheck,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Droplets,
  Plus,
  Award,
  Sparkles,
  UserCheck,
  Star,
  Pencil,
  Trash2,
  Save,
  Package,
  Receipt,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { format, addYears } from 'date-fns';

interface Customer360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onBookService: (customer: Customer, purifier?: Purifier) => void;
  initialTab?: 'overview' | 'services' | 'components' | 'history';
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({
  isOpen,
  onClose,
  customer,
  onBookService,
  initialTab = 'overview',
}) => {
  const {
    business,
    customers,
    purifiers,
    services,
    invoices,
    communications,
    amcSubscriptions,
    amcPlans,
    technicians,
    addAmcSubscription,
    addAmcPlan,
    addServiceRecord,
    updateCustomer,
    deleteCustomer,
  } = useApp();

  const currentCustomer = customers.find((c) => c.id === customer.id) || customer;

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'components' | 'history'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, customer.id, isOpen]);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  // Edit & Delete modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Edit Customer Form State
  const [editFullName, setEditFullName] = useState(currentCustomer.fullName);
  const [editMobile, setEditMobile] = useState(currentCustomer.mobileNumber);
  const [editAlternateMobile, setEditAlternateMobile] = useState(currentCustomer.alternateMobile || '');
  const [editEmail, setEditEmail] = useState(currentCustomer.email || '');
  const [editHouseFlatNo, setEditHouseFlatNo] = useState(currentCustomer.houseFlatNo || '');
  const [editStreetAddress, setEditStreetAddress] = useState(currentCustomer.streetAddress);
  const [editAreaLocality, setEditAreaLocality] = useState(currentCustomer.areaLocality);
  const [editLandmark, setEditLandmark] = useState(currentCustomer.landmark || '');
  const [editCity, setEditCity] = useState(currentCustomer.city || 'Hyderabad');
  const [editPincode, setEditPincode] = useState(currentCustomer.pincode || '');
  const [editStatus, setEditStatus] = useState<Customer['status']>(currentCustomer.status);
  const [editNotes, setEditNotes] = useState(currentCustomer.notes || '');

  const handleOpenEdit = () => {
    setEditFullName(currentCustomer.fullName);
    setEditMobile(currentCustomer.mobileNumber);
    setEditAlternateMobile(currentCustomer.alternateMobile || '');
    setEditEmail(currentCustomer.email || '');
    setEditHouseFlatNo(currentCustomer.houseFlatNo || '');
    setEditStreetAddress(currentCustomer.streetAddress);
    setEditAreaLocality(currentCustomer.areaLocality);
    setEditLandmark(currentCustomer.landmark || '');
    setEditCity(currentCustomer.city || 'Hyderabad');
    setEditPincode(currentCustomer.pincode || '');
    setEditStatus(currentCustomer.status);
    setEditNotes(currentCustomer.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim() || !editMobile.trim()) return;

    updateCustomer(currentCustomer.id, {
      fullName: editFullName.trim(),
      mobileNumber: editMobile.trim(),
      alternateMobile: editAlternateMobile.trim() || undefined,
      email: editEmail.trim() || undefined,
      houseFlatNo: editHouseFlatNo.trim() || undefined,
      streetAddress: editStreetAddress.trim(),
      areaLocality: editAreaLocality.trim(),
      landmark: editLandmark.trim() || undefined,
      city: editCity.trim(),
      pincode: editPincode.trim() || undefined,
      status: editStatus,
      notes: editNotes.trim() || undefined,
    });
    setIsEditModalOpen(false);
  };

  const handleDeleteCustomer = () => {
    deleteCustomer(currentCustomer.id);
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  // Modal states for Service Logging & AMC Enrollment
  const [isLogServiceOpen, setIsLogServiceOpen] = useState(false);
  const [isAmcEnrollOpen, setIsAmcEnrollOpen] = useState(false);

  // Log Service Form State
  const [logServiceType, setLogServiceType] = useState<ServiceType>('Periodic service');
  const [logDate, setLogDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [logTimeSlot, setLogTimeSlot] = useState<string>('10:00 AM - 12:00 PM');
  const [logTechId, setLogTechId] = useState<string>(technicians[0]?.id || '');
  const [logInletTds, setLogInletTds] = useState<string>('');
  const [logOutputTds, setLogOutputTds] = useState<string>('');
  const [logWorkSummary, setLogWorkSummary] = useState<string>('');
  const [logPartName, setLogPartName] = useState<string>('');
  const [logPartQty, setLogPartQty] = useState<number>(1);
  const [logPartPrice, setLogPartPrice] = useState<number>(0);
  const [logLabourCharge, setLogLabourCharge] = useState<number>(() => {
    return getServiceCharge('Periodic service', business?.settings);
  });
  const [logPaymentMethod, setLogPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [logRating, setLogRating] = useState<number>(5);

  // AMC Enrollment Form State
  const [enrollPlanId, setEnrollPlanId] = useState<string>(amcPlans[0]?.id || 'CUSTOM_TYPED');
  const [customTypedAmcName, setCustomTypedAmcName] = useState<string>('Custom Maintenance Plan');
  const [enrollStartDate, setEnrollStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [enrollEndDate, setEnrollEndDate] = useState<string>(format(addYears(new Date(), 1), 'yyyy-MM-dd'));
  const selectedPlan = amcPlans.find((p) => p.id === enrollPlanId) || amcPlans[0];
  const [enrollPrice, setEnrollPrice] = useState<number>(selectedPlan ? selectedPlan.price : 2499);
  const [enrollVisits, setEnrollVisits] = useState<number>(selectedPlan ? selectedPlan.annualVisits : 3);

  if (!isOpen) return null;

  const customerPurifiers = purifiers.filter((p) => p.customerId === currentCustomer.id);
  const primaryPurifier = customerPurifiers[0];
  const rawCustomerServices = services.filter((s) => s.customerId === currentCustomer.id);

  // Guarantee that every service from purifier installation to every subsequent service is included in history
  const customerServices = useMemo(() => {
    let list = [...rawCustomerServices];
    const hasInstallation = list.some((s) => s.serviceType === 'Installation');
    if (!hasInstallation && primaryPurifier) {
      const installDate = primaryPurifier.installationDate || primaryPurifier.purchaseDate;
      if (installDate) {
        list.push({
          id: `inst-${primaryPurifier.id}`,
          businessId: business.id || 'biz-client-ro',
          serviceCode: `INST-${(primaryPurifier.brand || 'RO').slice(0, 3).toUpperCase()}-01`,
          customerId: currentCustomer.id,
          purifierId: primaryPurifier.id,
          serviceType: 'Installation',
          bookingDate: installDate,
          scheduledDate: installDate,
          scheduledTimeSlot: '10:00 AM - 12:00 PM',
          startedTime: `${installDate} 10:00`,
          completedTime: `${installDate} 11:30`,
          status: 'Completed',
          issueDescription: 'Purifier Unit Installation & Commissioning',
          workSummary: `Installed and commissioned ${primaryPurifier.brand} ${primaryPurifier.model}. Plumbing lines connected, electrical setup verified, filters primed, and membrane calibrated.`,
          inletWaterTds: primaryPurifier.inletTdsBaseline,
          outputWaterTds: primaryPurifier.outputTdsBaseline,
          partsUsed: [
            {
              id: 'p-inst-set',
              name: `${primaryPurifier.brand} Purifier Unit & Initial Filter Kit`,
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0,
            },
          ],
          labourCharge: getServiceCharge('Installation', business?.settings) || 0,
          partsCharge: 0,
          discount: 0,
          tax: 0,
          total: getServiceCharge('Installation', business?.settings) || 0,
          amountPaid: getServiceCharge('Installation', business?.settings) || 0,
          amountPending: 0,
          paymentStatus: 'Paid',
          paymentMethod: 'Cash',
          customerRating: 5,
          beforePhotos: [],
          afterPhotos: [],
          createdAt: installDate,
          updatedAt: installDate,
        });
      }
    }
    return list.sort((a, b) => {
      const dateA = a.completedTime || a.scheduledDate || a.bookingDate || '';
      const dateB = b.completedTime || b.scheduledDate || b.bookingDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [rawCustomerServices, primaryPurifier, business?.id, business?.settings, currentCustomer.id]);

  const customerComms = communications.filter((c) => c.customerId === currentCustomer.id);
  const customerAmc = amcSubscriptions.find((sub) => sub.customerId === currentCustomer.id);
  const amcPlan = customerAmc ? amcPlans.find((p) => p.id === customerAmc.amcPlanId) : null;

  // Helper to check if a date is still active
  const isDateActive = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      return new Date(dateStr) >= new Date();
    } catch {
      return false;
    }
  };

  const handlePlanChange = (planId: string) => {
    setEnrollPlanId(planId);
    if (planId === 'CUSTOM_TYPED') {
      setEnrollPrice(2999);
      setEnrollVisits(3);
    } else {
      const plan = amcPlans.find((p) => p.id === planId);
      if (plan) {
        setEnrollPrice(plan.price);
        setEnrollVisits(plan.annualVisits);
      }
    }
  };

  const handleSaveAmc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryPurifier) return;

    let targetPlanId = enrollPlanId;

    if (enrollPlanId === 'CUSTOM_TYPED') {
      const newPlan = addAmcPlan({
        businessId: 'biz-aquapure-hyd',
        name: customTypedAmcName.trim() || 'Custom Maintenance Plan',
        description: `Custom contract with ${enrollVisits} visits per year.`,
        durationMonths: 12,
        annualVisits: Number(enrollVisits) || 3,
        price: Number(enrollPrice) || 2999,
        isMembraneCovered: false,
        isFiltersCovered: true,
        isElectricalCovered: true,
        isLabourCovered: true,
      });
      targetPlanId = newPlan.id;
    }

    addAmcSubscription({
      businessId: 'biz-aquapure-hyd',
      customerId: customer.id,
      purifierId: primaryPurifier.id,
      amcPlanId: targetPlanId,
      startDate: enrollStartDate,
      endDate: enrollEndDate,
      renewalDate: enrollEndDate,
      visitsTotal: Number(enrollVisits) || 3,
      visitsCompleted: 0,
      price: Number(enrollPrice) || 2499,
      amountPaid: Number(enrollPrice) || 2499,
      status: 'Active',
      notes: 'Enrolled via Customer 360 View',
    });

    setIsAmcEnrollOpen(false);
  };

  const handleSaveServiceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryPurifier) return;

    const partsTotal = logPartName.trim() ? logPartQty * logPartPrice : 0;
    const totalAmount = partsTotal + Number(logLabourCharge);

    addServiceRecord({
      businessId: 'biz-aquapure-hyd',
      customerId: customer.id,
      purifierId: primaryPurifier.id,
      technicianId: logTechId || undefined,
      serviceType: logServiceType,
      bookingDate: logDate,
      scheduledDate: logDate,
      scheduledTimeSlot: logTimeSlot,
      startedTime: `${logDate} 10:00`,
      completedTime: `${logDate} 11:30`,
      status: 'Completed',
      issueDescription: 'Service completed and verified.',
      inletWaterTds: logInletTds ? Number(logInletTds) : undefined,
      outputWaterTds: logOutputTds ? Number(logOutputTds) : undefined,
      workSummary: logWorkSummary,
      checklists: [],
      partsUsed: logPartName.trim()
        ? [
            {
              id: `p-${Date.now()}`,
              name: logPartName,
              quantity: Number(logPartQty),
              unitPrice: Number(logPartPrice),
              totalPrice: partsTotal,
            },
          ]
        : [],
      labourCharge: Number(logLabourCharge) || 0,
      partsCharge: partsTotal,
      discount: 0,
      tax: 0,
      total: totalAmount,
      amountPaid: totalAmount,
      amountPending: 0,
      paymentStatus: 'Paid',
      paymentMethod: logPaymentMethod,
      customerRating: logRating,
      beforePhotos: [],
      afterPhotos: [],
    });

    setIsLogServiceOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] sm:max-h-[90vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg shrink-0">
              {currentCustomer.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-lg sm:text-xl font-bold truncate">{currentCustomer.fullName}</h3>
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                  {currentCustomer.customerCode}
                </span>
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  {currentCustomer.status}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> +91 {currentCustomer.mobileNumber}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> {currentCustomer.areaLocality}, Hyderabad
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              title="View complete customer service history, spare parts, and charges"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Services</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-white/25 text-white">
                {customerServices.length}
              </span>
            </button>
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-xs cursor-pointer"
              title="Edit customer details"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-xs cursor-pointer"
              title="Delete customer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setWhatsAppModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <a
              href={`tel:${currentCustomer.mobileNumber}`}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Call customer"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition ml-auto sm:ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/70 text-xs font-semibold overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview & Purifier
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'components'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Consumables & Filters ({primaryPurifier?.components?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-3 border-b-2 font-bold transition flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Services & History</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'services'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {customerServices.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            WhatsApp & Activity Log ({customerComms.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] text-slate-400">Purifier Unit</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                    {primaryPurifier ? `${primaryPurifier.brand} ${primaryPurifier.model}` : 'RO Purifier'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] text-slate-400">Pending Balance</p>
                  <p className={`text-base font-bold mt-0.5 ${currentCustomer.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatIndianCurrency(currentCustomer.pendingBalance)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] text-slate-400">AMC Status</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {customerAmc ? customerAmc.status : 'No Active AMC'}
                  </p>
                </div>
              </div>

              {/* Direct Access to Services & Spares History */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-2xs shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Full Customer Service & Spare Parts History</span>
                      <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {customerServices.length} Total Services
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      All records from initial purifier installation to every subsequent visit with parts replaced and charges taken.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('services')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>View Services</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Customer Purifiers Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>Registered Water Purifier</span>
                  </h4>
                  <button
                    onClick={() => onBookService(customer, primaryPurifier)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Book Service Visit</span>
                  </button>
                </div>

                {customerPurifiers.map((pur) => {
                  const machineWarrantyValid = isDateActive(pur.warrantyExpiry);
                  const sparePartsWarrantyValid = isDateActive(pur.sparePartsWarrantyExpiry);

                  return (
                    <div
                      key={pur.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {pur.brand} - {pur.model}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Type: {pur.purifierType} • Location: {pur.installationLocation} • Capacity: {pur.capacityLph} LPH
                          </p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {pur.purifierCode}
                        </span>
                      </div>

                      {/* Purifier Service Dates & TDS Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Installed On:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{pur.installationDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Last Service:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {pur.lastServiceDate ? pur.lastServiceDate : 'Never / At Install'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Next Due Date:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{pur.nextServiceDueDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Baseline TDS:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {pur.inletTdsBaseline ? `${pur.inletTdsBaseline} in / ${pur.outputTdsBaseline} out` : 'Not recorded'}
                          </span>
                        </div>
                      </div>

                      {/* WARRANTY DETAILS CARD */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Purifier Warranty Details</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          {/* Machine Warranty */}
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Purifier Unit Warranty</span>
                              {pur.warrantyExpiry ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    machineWarrantyValid
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {machineWarrantyValid ? 'ACTIVE' : 'EXPIRED'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">None</span>
                              )}
                            </div>
                            <p className="text-slate-500 mt-1">
                              {pur.warrantyExpiry ? `Valid until: ${pur.warrantyExpiry}` : 'No machine warranty recorded'}
                            </p>
                          </div>

                          {/* Spare Parts Warranty */}
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Spare Parts Warranty</span>
                              {pur.sparePartsWarrantyExpiry ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    sparePartsWarrantyValid
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {sparePartsWarrantyValid ? 'ACTIVE' : 'EXPIRED'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">None</span>
                              )}
                            </div>
                            <p className="text-slate-500 mt-1">
                              {pur.sparePartsWarrantyExpiry
                                ? `Valid until: ${pur.sparePartsWarrantyExpiry}`
                                : 'No spare parts warranty recorded'}
                            </p>
                            {pur.sparePartsWarrantyNotes && (
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                                Covered: {pur.sparePartsWarrantyNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AMC CONTRACT CARD */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Annual Maintenance Contract (AMC)</h4>
                  </div>
                  {!customerAmc ? (
                    <button
                      onClick={() => setIsAmcEnrollOpen(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Enroll in AMC Plan</span>
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {customerAmc.status}
                    </span>
                  )}
                </div>

                {customerAmc ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block">Plan:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {amcPlan?.name || 'Annual Maintenance Plan'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contract Period:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {customerAmc.startDate} to {customerAmc.endDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Visits Remaining:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {customerAmc.visitsTotal - customerAmc.visitsCompleted} of {customerAmc.visitsTotal} Visits
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contract Price:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatIndianCurrency(customerAmc.price)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Customer does not have an active AMC subscription. Enroll them to ensure guaranteed recurring service visits and filter replacements.
                  </p>
                )}
              </div>

              {/* Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Doorstep Address</p>
                    <button
                      onClick={handleOpenEdit}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {currentCustomer.houseFlatNo && `${currentCustomer.houseFlatNo}, `}
                    {currentCustomer.streetAddress}, {currentCustomer.areaLocality}, Hyderabad, {currentCustomer.pincode}
                  </p>
                  {currentCustomer.landmark && (
                    <p className="text-[11px] text-slate-400 mt-1">Landmark: {currentCustomer.landmark}</p>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Customer Notes</p>
                    <button
                      onClick={handleOpenEdit}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    &ldquo;{currentCustomer.notes || 'No special technician instructions recorded.'}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* COMPONENTS & CONSUMABLES TAB */}
          {activeTab === 'components' && (
            <div className="space-y-4">
              <p className="text-slate-500">
                Tracking filter lifecycles allows the engine to proactively remind the customer when sediment, carbon, or membrane is about to choke.
              </p>

              {primaryPurifier?.components && primaryPurifier.components.length > 0 ? (
                <div className="space-y-2.5">
                  {primaryPurifier.components.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{comp.componentType}</p>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              comp.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : comp.status === 'DUE_SOON'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {comp.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Brand: {comp.brand} • Life: {comp.expectedLifeMonths} Months • Due: {comp.nextReplacementDate}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatIndianCurrency(comp.sellingPrice)}
                        </p>
                        <p className="text-[10px] text-slate-400">Replacement Cost</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No individual components logged yet. They will be added during the next filter replacement.
                </div>
              )}
            </div>
          )}

          {/* SERVICE HISTORY TAB */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {/* Service History Top Summary Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/70 rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">TOTAL SERVICES</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {customerServices.length} Records ({customerServices.filter((s) => s.status === 'Completed').length} Completed)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">RO INSTALLATION</span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {primaryPurifier?.installationDate || primaryPurifier?.purchaseDate || 'Onboarding'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">LIFETIME CHARGES TAKEN</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatIndianCurrency(currentCustomer.totalSpend)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">SPARE PARTS REPLACED</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {customerServices.reduce((acc, s) => acc + (s.partsUsed?.length || 0), 0)} Spares Total
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsLogServiceOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Service Record</span>
                </button>
              </div>

              {/* PERMANENT RO INSTALLATION RECORD BANNER */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-700 dark:text-blue-300">
                        Permanent RO Installation Date
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded">
                        Founding Record
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      Installed on {primaryPurifier?.installationDate || primaryPurifier?.purchaseDate || 'Onboarding'} • {primaryPurifier?.brand} {primaryPurifier?.model}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Commissioned
                  </span>
                </div>
              </div>

              {/* Service Records List */}
              <div className="space-y-4">
                {customerServices.length > 0 ? (
                  customerServices.map((srv) => {
                    const tech = technicians.find((t) => t.id === srv.technicianId);
                    const matchingInvoice = invoices.find(
                      (inv) => inv.serviceRecordId === srv.id || (srv.serviceCode && inv.notes?.includes(srv.serviceCode))
                    );
                    const partsTotal = (srv.partsUsed || []).reduce(
                      (sum, p) => sum + (p.totalPrice || p.quantity * p.unitPrice),
                      0
                    );
                    const labourCharge = srv.labourCharge ?? 0;
                    const totalCharges = srv.total || (labourCharge + partsTotal - (srv.discount || 0));
                    const isInstallation = srv.serviceType === 'Installation';
                    const tdsReduction =
                      srv.inletWaterTds && srv.outputWaterTds
                        ? Math.round(((srv.inletWaterTds - srv.outputWaterTds) / srv.inletWaterTds) * 100)
                        : null;

                    return (
                      <div
                        key={srv.id}
                        className={`p-4 rounded-xl border transition space-y-3.5 ${
                          isInstallation
                            ? 'bg-blue-50/40 dark:bg-slate-800/80 border-blue-200 dark:border-blue-900 shadow-2xs'
                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        {/* Header: Service Type & Tags */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {isInstallation ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white flex items-center gap-1 shadow-2xs">
                                <span>📌 RO PURIFIER INSTALLATION</span>
                              </span>
                            ) : (
                              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                                <span>{srv.serviceType}</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {srv.serviceCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                srv.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : srv.status === 'Assigned'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {srv.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 self-start sm:self-auto">
                            <div className="text-right">
                              <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 block">
                                {formatIndianCurrency(totalCharges)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {srv.paymentStatus || 'Paid'} {srv.paymentMethod ? `via ${srv.paymentMethod}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Metadata: Date, Technician, Rating */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>Date: {srv.scheduledDate || srv.bookingDate} {srv.completedTime ? `(${srv.completedTime})` : ''}</span>
                          </span>
                          {tech && (
                            <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Technician: {tech.name}</span>
                            </span>
                          )}
                          {srv.customerRating && (
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{srv.customerRating}/5 Rating</span>
                            </span>
                          )}
                          {matchingInvoice && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                              <Receipt className="w-3 h-3" />
                              <span>Invoice #{matchingInvoice.invoiceNumber}</span>
                            </span>
                          )}
                        </div>

                        {/* Work Done Summary */}
                        {srv.workSummary && (
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-800">
                            <strong className="text-slate-900 dark:text-white">Service Work Done:</strong> {srv.workSummary}
                          </div>
                        )}

                        {/* Spare Parts Replaced / Added */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-blue-600" />
                              <span>Spare Parts Added / Replaced</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              Spares Total: {formatIndianCurrency(srv.partsCharge || partsTotal)}
                            </span>
                          </div>

                          {srv.partsUsed && srv.partsUsed.length > 0 ? (
                            <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-850 rounded-lg px-3 border border-slate-100 dark:border-slate-800">
                              {srv.partsUsed.map((part, idx) => (
                                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{part.name}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                                      {part.quantity}x
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      @ {formatIndianCurrency(part.unitPrice)}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {formatIndianCurrency(part.totalPrice || part.quantity * part.unitPrice)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">No spare parts replaced for this visit (Labour only).</p>
                          )}
                        </div>

                        {/* Structured Charges Taken Section */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Charges Taken & Payment Breakdown</span>
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                            <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-medium">Service / Labour</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {formatIndianCurrency(labourCharge)}
                              </span>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-medium">Spare Parts</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {formatIndianCurrency(srv.partsCharge || partsTotal)}
                              </span>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-medium">Total Charges Taken</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatIndianCurrency(totalCharges)}
                              </span>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-medium">Payment Method</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {srv.paymentMethod || 'Cash'} ({srv.paymentStatus || 'Paid'})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Water Quality & TDS Verification */}
                        {srv.inletWaterTds && srv.outputWaterTds && (
                          <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <Droplets className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-slate-500">Inlet TDS:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{srv.inletWaterTds} ppm</strong>
                            </div>
                            <span className="text-slate-300 dark:text-slate-600">&rarr;</span>
                            <div>
                              <span className="text-slate-500">Output Pure TDS:</span>
                              <strong className="text-emerald-600 dark:text-emerald-400 ml-1">{srv.outputWaterTds} ppm</strong>
                            </div>
                            {tdsReduction && (
                              <span className="ml-auto text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                {tdsReduction}% TDS Purified
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 space-y-3">
                    <Wrench className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p>No past service history recorded yet for this customer.</p>
                    <button
                      onClick={() => setIsLogServiceOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                    >
                      + Log First Service Record
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMMUNICATION TIMELINE TAB */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {customerComms.length > 0 ? (
                customerComms.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> WhatsApp Sent ({comm.language.toUpperCase()})
                      </span>
                      <span className="text-slate-400">{comm.sentAt}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      {comm.messageText}
                    </p>
                    {comm.responseReceived && comm.responseText && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-800 dark:text-emerald-300 text-[11px]">
                        <strong>Customer Replied:</strong> &ldquo;{comm.responseText}&rdquo;
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No previous WhatsApp communications logged.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBookService(customer, primaryPurifier)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Book Upcoming Visit</span>
            </button>
            {!customerAmc && (
              <button
                onClick={() => setIsAmcEnrollOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enroll in AMC</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-semibold transition text-xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* MODAL: LOG SERVICE RECORD */}
      {isLogServiceOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Log Service History Record</span>
              </h3>
              <button
                onClick={() => setIsLogServiceOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceRecord} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={logServiceType}
                    onChange={(e) => {
                      const newType = e.target.value as ServiceType;
                      setLogServiceType(newType);
                      setLogLabourCharge(getServiceCharge(newType, business?.settings));
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="Periodic service">Periodic service</option>
                    <option value="Filter replacement">Filter replacement</option>
                    <option value="Membrane replacement">Membrane replacement</option>
                    <option value="Repair / Breakdown">Repair / Breakdown</option>
                    <option value="General service">General service</option>
                    <option value="TDS adjustment">TDS adjustment</option>
                    <option value="Complete cleaning">Complete cleaning</option>
                    <option value="AMC service">AMC service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Date
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Technician
                  </label>
                  <select
                    value={logTechId}
                    onChange={(e) => setLogTechId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (+91 {t.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={logTimeSlot}
                    onChange={(e) => setLogTimeSlot(e.target.value)}
                    placeholder="e.g. 10:00 AM - 11:30 AM"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Water TDS Readings */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Raw Inlet TDS (ppm)
                  </label>
                  <input
                    type="number"
                    value={logInletTds}
                    onChange={(e) => setLogInletTds(e.target.value)}
                    placeholder="e.g. 780"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pure Output TDS (ppm)
                  </label>
                  <input
                    type="number"
                    value={logOutputTds}
                    onChange={(e) => setLogOutputTds(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Work Done Summary */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Completed / Notes
                </label>
                <textarea
                  rows={2}
                  value={logWorkSummary}
                  onChange={(e) => setLogWorkSummary(e.target.value)}
                  placeholder="Describe work completed, tank sanitization, flow rate check, etc."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                />
              </div>

              {/* Spare Parts Replaced */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Parts Replaced (Optional)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={logPartName}
                      onChange={(e) => setLogPartName(e.target.value)}
                      placeholder="Part Name (e.g. Sediment filter)"
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={logPartPrice}
                      onChange={(e) => setLogPartPrice(Number(e.target.value))}
                      placeholder="Price (₹)"
                      className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    />
                  </div>
                </div>

                {/* Quick suggestions pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { name: 'Sediment Filter', price: 350 },
                    { name: 'Pre-Carbon Filter', price: 450 },
                    { name: 'RO Membrane 80 GPD', price: 1800 },
                    { name: 'Post-Carbon / Alkaline', price: 650 },
                    { name: 'Booster Pump 100 GPD', price: 2200 },
                    { name: 'SMPS Power Adapter', price: 850 },
                    { name: 'Float Valve & Switch', price: 250 },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setLogPartName(p.name);
                        setLogPartPrice(p.price);
                      }}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 rounded text-[10px] font-medium border border-slate-200 dark:border-slate-700 transition"
                    >
                      + {p.name} (₹{p.price})
                    </button>
                  ))}
                </div>
              </div>

              {/* Charges & Payment */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Labour Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={logLabourCharge}
                    onChange={(e) => setLogLabourCharge(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={logPaymentMethod}
                    onChange={(e) => setLogPaymentMethod(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={logRating}
                    onChange={(e) => setLogRating(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Real-time Total Charges preview */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Total Bill Taken:</span>
                  <p className="text-[10px] text-slate-500">
                    Labour: ₹{logLabourCharge || 0} + Spares: ₹{logPartName.trim() ? (logPartQty * logPartPrice) : 0}
                  </p>
                </div>
                <span className="text-base font-extrabold text-blue-700 dark:text-blue-300">
                  ₹{(Number(logLabourCharge) || 0) + (logPartName.trim() ? (logPartQty * logPartPrice) : 0)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogServiceOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL IN AMC */}
      {isAmcEnrollOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Enroll Customer in AMC Plan</span>
              </h3>
              <button
                onClick={() => setIsAmcEnrollOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAmc} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer
                </label>
                <p className="font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {customer.fullName} (+91 {customer.mobileNumber})
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select AMC Plan
                </label>
                <select
                  value={enrollPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                >
                  <option value="CUSTOM_TYPED">✨ + Type Custom AMC Plan for this Customer</option>
                  {amcPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatIndianCurrency(p.price)}/yr ({p.annualVisits} visits)
                    </option>
                  ))}
                </select>
              </div>

              {enrollPlanId === 'CUSTOM_TYPED' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type Custom Plan Name *
                  </label>
                  <input
                    type="text"
                    value={customTypedAmcName}
                    onChange={(e) => setCustomTypedAmcName(e.target.value)}
                    placeholder="e.g. 1-Year Comprehensive RO Protection"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={enrollStartDate}
                    onChange={(e) => setEnrollStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date (1 Year)
                  </label>
                  <input
                    type="date"
                    value={enrollEndDate}
                    onChange={(e) => setEnrollEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contract Price (₹)
                  </label>
                  <input
                    type="number"
                    value={enrollPrice}
                    onChange={(e) => setEnrollPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visits Included
                  </label>
                  <input
                    type="number"
                    value={enrollVisits}
                    onChange={(e) => setEnrollVisits(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAmcEnrollOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  Activate AMC Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Edit Customer Profile
                  </h4>
                  <p className="text-xs text-slate-400">
                    Update personal, phone, address & status ({currentCustomer.customerCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Mobile (+91) *
                  </label>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    required
                    maxLength={10}
                    placeholder="10-digit number"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Secondary Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alternate Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editAlternateMobile}
                    onChange={(e) => setEditAlternateMobile(e.target.value)}
                    placeholder="Optional phone number"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Area Locality & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    value={editAreaLocality}
                    onChange={(e) => setEditAreaLocality(e.target.value)}
                    required
                    placeholder="e.g. Madhapur, Kondapur, Gachibowli"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Hyderabad"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Flat / House No. & Street Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Flat / House No.
                  </label>
                  <input
                    type="text"
                    value={editHouseFlatNo}
                    onChange={(e) => setEditHouseFlatNo(e.target.value)}
                    placeholder="Flat 402, Lotus Apt"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address / Colony *
                  </label>
                  <input
                    type="text"
                    value={editStreetAddress}
                    onChange={(e) => setEditStreetAddress(e.target.value)}
                    required
                    placeholder="Road No 12, Whitefields"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Landmark & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={editLandmark}
                    onChange={(e) => setEditLandmark(e.target.value)}
                    placeholder="Near Ratnadeep Supermarket"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    placeholder="500081"
                    maxLength={6}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Customer['status'])}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active customer">Active Customer</option>
                  <option value="AMC active">AMC Active</option>
                  <option value="Service due">Service Due</option>
                  <option value="Overdue">Overdue</option>
                  <option value="AMC expiring">AMC Expiring</option>
                  <option value="New lead">New Lead</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Lost customer">Lost Customer</option>
                </select>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Technician / Customer Instructions
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Gate pass needed, dog on premises, call 30 mins before arrival..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-sm transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER CONFIRMATION DIALOG */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Delete Customer Account?
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p>
                <strong>Customer:</strong> {currentCustomer.fullName} ({currentCustomer.customerCode})
              </p>
              <p>
                <strong>Phone:</strong> +91 {currentCustomer.mobileNumber}
              </p>
              <p>
                <strong>Address:</strong> {currentCustomer.areaLocality}, Hyderabad
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Deleting this customer will remove their profile along with all associated water purifiers ({customerPurifiers.length}), past service records ({customerServices.length}), AMC subscriptions, and upcoming renewal reminders.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel / Keep
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-sm transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        customer={currentCustomer}
        purifier={primaryPurifier}
        defaultTemplateKey={currentCustomer.status === 'Overdue' ? 'SERVICE_OVERDUE' : 'SERVICE_DUE'}
      />
    </div>
  );
};
