'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AMCPlan, AMCSubscription, Customer, Purifier } from '@/types';
import { formatIndianCurrency } from '@/lib/utils';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import { Customer360Modal } from '@/components/customers/Customer360Modal';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Calendar,
  Sparkles,
  Phone,
  User,
  MapPin,
  X,
  Droplets,
  Shield,
  Eye,
  Settings,
  Layers,
} from 'lucide-react';
import { format, addYears } from 'date-fns';

export const AMCManager: React.FC = () => {
  const { amcPlans, amcSubscriptions, customers, purifiers, business, addAmcSubscription, addAmcPlan } = useApp();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions');
  const [searchQuery, setSearchQuery] = useState('');

  // WhatsApp modal state
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [selectedPur, setSelectedPur] = useState<Purifier | null>(null);

  // Customer 360 modal state
  const [viewCustomer360, setViewCustomer360] = useState<Customer | null>(null);

  // Create Custom Plan Modal State
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('Custom Annual Maintenance Plan');
  const [newPlanPrice, setNewPlanPrice] = useState<number>(2999);
  const [newPlanVisits, setNewPlanVisits] = useState<number>(3);
  const [newPlanDescription, setNewPlanDescription] = useState('Comprehensive coverage including scheduled periodic services, filter replacement, and priority breakdown response.');
  const [newIsMembraneCovered, setNewIsMembraneCovered] = useState(false);
  const [newIsFiltersCovered, setNewIsFiltersCovered] = useState(true);
  const [newIsElectricalCovered, setNewIsElectricalCovered] = useState(true);
  const [newIsLabourCovered, setNewIsLabourCovered] = useState(true);

  // Enroll in AMC Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(amcPlans[0]?.id || 'CUSTOM_TYPED');
  const [customTypedPlanName, setCustomTypedPlanName] = useState<string>('Custom Maintenance Contract');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(addYears(new Date(), 1), 'yyyy-MM-dd'));

  const chosenPlan = amcPlans.find((p) => p.id === selectedPlanId);
  const [customPrice, setCustomPrice] = useState<number>(chosenPlan?.price || 2499);
  const [customVisits, setCustomVisits] = useState<number>(chosenPlan?.annualVisits || 3);
  const [notes, setNotes] = useState<string>('Enrolled via AMC Manager');

  // Purifiers for currently selected customer in enroll modal
  const customerPurifiers = purifiers.filter((p) => p.customerId === selectedCustomerId);
  const [selectedPurifierId, setSelectedPurifierId] = useState<string>(customerPurifiers[0]?.id || '');

  const expiringSubs = amcSubscriptions.filter(
    (s) => s.status === 'Expiring soon' || s.status === 'Active'
  );

  const filteredSubscriptions = amcSubscriptions.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cust = customers.find((c) => c.id === sub.customerId);
    const plan = amcPlans.find((p) => p.id === sub.amcPlanId);
    return (
      sub.subscriptionCode.toLowerCase().includes(q) ||
      cust?.fullName.toLowerCase().includes(q) ||
      cust?.mobileNumber.includes(q) ||
      cust?.areaLocality.toLowerCase().includes(q) ||
      plan?.name.toLowerCase().includes(q)
    );
  });

  const openWhatsApp = (customer: Customer, purifier?: Purifier) => {
    setSelectedCust(customer);
    setSelectedPur(purifier || null);
    setWhatsAppModalOpen(true);
  };

  const handleOpenEnrollForPlan = (plan: AMCPlan) => {
    setSelectedPlanId(plan.id);
    setCustomPrice(plan.price);
    setCustomVisits(plan.annualVisits);
    setIsEnrollModalOpen(true);
  };

  const handleCustomerSelectionChange = (newCustId: string) => {
    setSelectedCustomerId(newCustId);
    const purs = purifiers.filter((p) => p.customerId === newCustId);
    if (purs.length > 0) {
      setSelectedPurifierId(purs[0].id);
    } else {
      setSelectedPurifierId('');
    }
  };

  const handlePlanSelectionChange = (newPlanId: string) => {
    setSelectedPlanId(newPlanId);
    if (newPlanId === 'CUSTOM_TYPED') {
      setCustomPrice(2999);
      setCustomVisits(3);
    } else {
      const plan = amcPlans.find((p) => p.id === newPlanId);
      if (plan) {
        setCustomPrice(plan.price);
        setCustomVisits(plan.annualVisits);
      }
    }
  };

  const handleSaveCustomPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    addAmcPlan({
      businessId: business.id || 'biz-aquapure-hyd',
      name: newPlanName.trim(),
      description: newPlanDescription.trim(),
      durationMonths: 12,
      annualVisits: Number(newPlanVisits) || 3,
      price: Number(newPlanPrice) || 2999,
      isMembraneCovered: newIsMembraneCovered,
      isFiltersCovered: newIsFiltersCovered,
      isElectricalCovered: newIsElectricalCovered,
      isLabourCovered: newIsLabourCovered,
    });

    setIsCreatePlanModalOpen(false);
    setActiveTab('plans');
  };

  const handleSaveEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    let targetPurifierId = selectedPurifierId;
    if (!targetPurifierId && customerPurifiers.length > 0) {
      targetPurifierId = customerPurifiers[0].id;
    }

    let finalPlanId = selectedPlanId;

    // If custom plan option was typed on-the-fly, create and register the custom plan!
    if (selectedPlanId === 'CUSTOM_TYPED') {
      const createdPlan = addAmcPlan({
        businessId: business.id || 'biz-aquapure-hyd',
        name: customTypedPlanName.trim() || 'Custom AMC Plan',
        description: `Custom maintenance plan tailored with ${customVisits} annual visits and on-demand spare support.`,
        durationMonths: 12,
        annualVisits: Number(customVisits) || 3,
        price: Number(customPrice) || 2499,
        isMembraneCovered: false,
        isFiltersCovered: true,
        isElectricalCovered: true,
        isLabourCovered: true,
      });
      finalPlanId = createdPlan.id;
    }

    addAmcSubscription({
      businessId: business.id || 'biz-aquapure-hyd',
      customerId: selectedCustomerId,
      purifierId: targetPurifierId || `pur-temp-${Date.now()}`,
      amcPlanId: finalPlanId,
      startDate,
      endDate,
      renewalDate: endDate,
      visitsTotal: Number(customVisits) || 3,
      visitsCompleted: 0,
      price: Number(customPrice) || 2499,
      amountPaid: Number(customPrice) || 2499,
      status: 'Active',
      notes,
    });

    setIsEnrollModalOpen(false);
    setActiveTab('subscriptions');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Annual Maintenance Contracts (AMC)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Secure recurring annual revenue, create custom AMC plans, and proactively manage customer service contracts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreatePlanModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Plan</span>
          </button>

          <button
            onClick={() => {
              setSelectedPlanId(amcPlans[0]?.id || 'CUSTOM_TYPED');
              setIsEnrollModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Customer in AMC</span>
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'subscriptions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active Subscriptions ({amcSubscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'plans'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              AMC Plans ({amcPlans.length})
            </button>
          </div>
        </div>
      </div>

      {/* EXPIRING SOON NOTICE */}
      <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AMC Renewals Coming Up This Month</h3>
            <p className="text-xs text-indigo-200">
              {expiringSubs.length} customers have contracts expiring in the next 30 days. Send renewal offers on WhatsApp!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20">
            Est. Renewal Value: ₹{expiringSubs.reduce((s, sub) => s + sub.price, 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* SUBSCRIPTIONS TABLE */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search AMC subscriptions by customer name, phone number, locality, or contract code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs font-medium"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-4">Contract Code</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Purifier System & Warranty</th>
                    <th className="py-3 px-4">AMC Plan & Coverage</th>
                    <th className="py-3 px-4">Validity Period</th>
                    <th className="py-3 px-4">Visits Remaining</th>
                    <th className="py-3 px-4">Contract Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredSubscriptions.map((sub) => {
                    const customer = customers.find((c) => c.id === sub.customerId);
                    const purifier = purifiers.find((p) => p.id === sub.purifierId);
                    const plan = amcPlans.find((p) => p.id === sub.amcPlanId);
                    if (!customer) return null;

                    const hasUnitWarranty = purifier?.warrantyExpiry && new Date(purifier.warrantyExpiry) >= new Date();
                    const hasPartsWarranty = purifier?.sparePartsWarrantyExpiry && new Date(purifier.sparePartsWarrantyExpiry) >= new Date();

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {sub.subscriptionCode}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {customer.fullName}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            +91 {customer.mobileNumber}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                            {customer.areaLocality}, {customer.streetAddress}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {purifier ? `${purifier.brand} ${purifier.model}` : 'RO Purifier'}
                          </span>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-400">
                              {purifier?.purifierCode}
                            </span>
                            {hasUnitWarranty && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Machine Warranty
                              </span>
                            )}
                            {hasPartsWarranty && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                Spares Warranty
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {plan?.name || 'Custom AMC Plan'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {plan?.isMembraneCovered ? 'Membrane + Filters Covered' : plan?.isFiltersCovered ? 'Filters Covered' : 'Service Only'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{sub.startDate}</span>
                          <span className="text-slate-400 block text-[10px]">to <strong className="text-rose-600 dark:text-rose-400">{sub.endDate}</strong></span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <span>{sub.visitsTotal - sub.visitsCompleted}</span>
                            <span className="text-[10px] text-slate-400 font-normal">of {sub.visitsTotal} Left</span>
                          </div>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${(sub.visitsCompleted / sub.visitsTotal) * 100}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {formatIndianCurrency(sub.price)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'Expiring soon'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openWhatsApp(customer, purifier)}
                              className="p-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                              title="Send WhatsApp Offer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`tel:${customer.mobileNumber}`}
                              className="p-1.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-600 hover:text-white rounded-lg transition"
                              title="Call Customer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => setViewCustomer360(customer)}
                              className="p-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg transition"
                              title="View Customer 360"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PLANS LIST */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Manage pre-defined and custom AMC plan templates. You can also create brand-new custom plans anytime.
            </p>
            <button
              onClick={() => setIsCreatePlanModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Custom Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {amcPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md">
                      {plan.annualVisits} Visits / Year
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">12 Months</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2">{plan.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${plan.isLabourCovered ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{plan.isLabourCovered ? 'Free Labour & Breakdown support' : 'Labour charged'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${plan.isFiltersCovered ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{plan.isFiltersCovered ? 'Sediment & Carbon Spares Included' : 'Filters Charged Extra'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${plan.isMembraneCovered ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{plan.isMembraneCovered ? 'RO Membrane Covered (100%)' : 'Membrane Not Covered'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatIndianCurrency(plan.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">per year</span>
                  </div>

                  <button
                    onClick={() => handleOpenEnrollForPlan(plan)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enroll Customer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM PLAN */}
      {isCreatePlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Create New Custom AMC Plan</span>
              </h3>
              <button
                onClick={() => setIsCreatePlanModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPlan} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Plan Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Filter Care / Restaurant RO Plan"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plan Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Visits Included *
                  </label>
                  <input
                    type="number"
                    value={newPlanVisits}
                    onChange={(e) => setNewPlanVisits(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Description
                </label>
                <textarea
                  rows={2}
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Briefly describe what is covered in this custom plan..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none"
                />
              </div>

              {/* Coverage Features */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="block font-bold text-[11px] text-slate-800 dark:text-slate-200">
                  Coverage Inclusions:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newIsLabourCovered}
                      onChange={(e) => setNewIsLabourCovered(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Free Labour & Visits</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newIsFiltersCovered}
                      onChange={(e) => setNewIsFiltersCovered(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Sediment & Carbon Spares</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newIsMembraneCovered}
                      onChange={(e) => setNewIsMembraneCovered(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>RO Membrane Covered</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newIsElectricalCovered}
                      onChange={(e) => setNewIsElectricalCovered(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Pump & SMPS Electricals</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatePlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  Save Custom Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL CUSTOMER IN AMC */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Enroll Customer in AMC Plan</span>
              </h3>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEnrollment} className="space-y-4">
              {/* Select Customer */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelectionChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (+91 {c.mobileNumber}) — {c.areaLocality} [{c.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Purifier */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Water Purifier
                </label>
                {customerPurifiers.length > 0 ? (
                  <select
                    value={selectedPurifierId}
                    onChange={(e) => setSelectedPurifierId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {customerPurifiers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.brand} {p.model} ({p.purifierCode}) — Installed: {p.installationDate}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px]">
                    No purifier registered yet. A default purifier will be linked automatically.
                  </p>
                )}
              </div>

              {/* Select or Type Custom Plan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select or Type AMC Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanSelectionChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="CUSTOM_TYPED">✨ + Type Custom AMC Plan for this Customer</option>
                  {amcPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatIndianCurrency(p.price)}/yr ({p.annualVisits} visits)
                    </option>
                  ))}
                </select>
              </div>

              {/* If Custom Plan is selected, allow typing custom plan name */}
              {selectedPlanId === 'CUSTOM_TYPED' && (
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-2.5">
                  <span className="block font-bold text-[11px] text-indigo-950 dark:text-indigo-200">
                    Custom Plan Details:
                  </span>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Type Custom Plan Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1-Year Comprehensive RO Protection"
                      value={customTypedPlanName}
                      onChange={(e) => setCustomTypedPlanName(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Pricing & Visits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price of the Plan (₹) *
                  </label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Visits Included *
                  </label>
                  <input
                    type="number"
                    value={customVisits}
                    onChange={(e) => setCustomVisits(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contract End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contract Notes / Terms agreed (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special customer remarks or terms agreed upon"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  Create & Activate AMC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 360 Modal */}
      {viewCustomer360 && (
        <Customer360Modal
          isOpen={!!viewCustomer360}
          onClose={() => setViewCustomer360(null)}
          customer={viewCustomer360}
          onBookService={() => {}}
        />
      )}

      {/* WhatsApp Modal */}
      {selectedCust && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setSelectedCust(null);
          }}
          customer={selectedCust}
          purifier={selectedPur || undefined}
          defaultTemplateKey="AMC_RENEWAL"
        />
      )}
    </div>
  );
};
