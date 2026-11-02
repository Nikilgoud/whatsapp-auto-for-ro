'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PurifierProduct, Customer, Technician, InvoiceItem, PaymentMethod } from '@/types';
import { format } from 'date-fns';
import {
  X,
  CheckCircle2,
  User,
  Package,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Layers,
  Wrench,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Droplets,
  Search,
  Check,
  Sparkles,
} from 'lucide-react';

interface CreateSalesInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProduct?: PurifierProduct | null;
  onSuccess?: (invoiceId: string) => void;
}

interface AddonAccessory {
  id: string;
  name: string;
  price: number;
  selected: boolean;
  quantity: number;
}

const COMMON_ACCESSORIES: AddonAccessory[] = [
  { id: 'acc-prefilter', name: 'Heavy-Duty Pre-Filter Housing Bowl with Spun Candle', price: 750, selected: false, quantity: 1 },
  { id: 'acc-iron', name: 'Iron & Sand Particle Pre-Treatment Cartridge', price: 1200, selected: false, quantity: 1 },
  { id: 'acc-copper', name: 'Active Copper + Alkaline Post-Carbon Cartridge', price: 850, selected: false, quantity: 1 },
  { id: 'acc-pump', name: 'External High-Pressure Booster Pump (100 GPD)', price: 1800, selected: false, quantity: 1 },
];

export const CreateSalesInvoiceModal: React.FC<CreateSalesInvoiceModalProps> = ({
  isOpen,
  onClose,
  preselectedProduct,
  onSuccess,
}) => {
  const {
    customers,
    purifierProducts,
    technicians,
    amcPlans,
    addCustomer,
    createSalesInvoice,
    business,
  } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Customer
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  // New customer inputs
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustArea, setNewCustArea] = useState('Madhapur');
  const [newCustLanguage, setNewCustLanguage] = useState<'en' | 'te' | 'hi'>('te');

  // Step 2: Machine Selection
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customBrand, setCustomBrand] = useState('Kent');
  const [customModel, setCustomModel] = useState('');
  const [customSerialNo, setCustomSerialNo] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(15000);
  const [discount, setDiscount] = useState<number>(0);
  const [enableGst, setEnableGst] = useState<boolean>(business.settings.enableGst || false);
  const [gstRate, setGstRate] = useState<number>(18);

  // Step 3: Add-on Accessories
  const [accessories, setAccessories] = useState<AddonAccessory[]>(COMMON_ACCESSORIES);
  const [customAccName, setCustomAccName] = useState('');
  const [customAccPrice, setCustomAccPrice] = useState<number>(500);

  // Step 4: Warranty & Service Scheduling
  const [bundleAmc, setBundleAmc] = useState<boolean>(false);
  const [selectedAmcPlanId, setSelectedAmcPlanId] = useState<string>('');
  const [installationDate, setInstallationDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>('');

  // Step 5: Payment & Confirmations
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [autoRegisterPurifier, setAutoRegisterPurifier] = useState<boolean>(true);
  const [autoScheduleInstallation, setAutoScheduleInstallation] = useState<boolean>(true);
  const [sendWhatsAppConfirmation, setSendWhatsAppConfirmation] = useState<boolean>(true);
  const [orderNotes, setOrderNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Init when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormError('');
      if (customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customers[0].id);
      }
      if (preselectedProduct) {
        setSelectedProductId(preselectedProduct.id);
        setCustomBrand(preselectedProduct.brand);
        setCustomModel(preselectedProduct.model);
        setSellingPrice(preselectedProduct.sellingPrice);
        setCustomSerialNo(`AQ-SN-${Math.floor(100000 + Math.random() * 900000)}`);
      } else if (purifierProducts.length > 0) {
        const first = purifierProducts[0];
        setSelectedProductId(first.id);
        setCustomBrand(first.brand);
        setCustomModel(first.model);
        setSellingPrice(first.sellingPrice);
        setCustomSerialNo(`AQ-SN-${Math.floor(100000 + Math.random() * 900000)}`);
      }
      setAccessories(COMMON_ACCESSORIES.map((a) => ({ ...a, selected: false })));
      setBundleAmc(false);
      setInstallationDate(format(new Date(), 'yyyy-MM-dd'));
      if (technicians.length > 0) {
        setAssignedTechnicianId(technicians[0].id);
      }
    }
  }, [isOpen, preselectedProduct]);

  // When selected product changes
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = purifierProducts.find((p) => p.id === prodId);
    if (prod) {
      setCustomBrand(prod.brand);
      setCustomModel(prod.model);
      setSellingPrice(prod.sellingPrice);
      setCustomSerialNo(`AQ-SN-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

  // Toggle accessory
  const handleToggleAccessory = (accId: string) => {
    setAccessories((prev) =>
      prev.map((a) => (a.id === accId ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleAddCustomAccessory = () => {
    if (!customAccName.trim() || customAccPrice <= 0) return;
    const newAcc: AddonAccessory = {
      id: `acc-cust-${Date.now()}`,
      name: customAccName.trim(),
      price: customAccPrice,
      selected: true,
      quantity: 1,
    };
    setAccessories([...accessories, newAcc]);
    setCustomAccName('');
    setCustomAccPrice(500);
  };

  // Calculate totals
  const selectedAccessories = accessories.filter((a) => a.selected);
  const accessoriesTotal = selectedAccessories.reduce((sum, a) => sum + a.price * a.quantity, 0);

  const selectedAmcPlan = amcPlans.find((p) => p.id === selectedAmcPlanId);
  const amcTotal = bundleAmc && selectedAmcPlan ? selectedAmcPlan.price : 0;

  const rawSubtotal = sellingPrice + accessoriesTotal + amcTotal;
  const taxableAmount = Math.max(0, rawSubtotal - discount);
  const calculatedGst = enableGst ? Math.round((taxableAmount * gstRate) / 100) : 0;
  const grandTotal = taxableAmount + calculatedGst;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  // Sync default amountPaid to grandTotal whenever grandTotal changes
  useEffect(() => {
    setAmountPaid(grandTotal);
  }, [grandTotal]);

  const handleNext = () => {
    setFormError('');
    if (currentStep === 1) {
      if (customerMode === 'existing' && !selectedCustomerId) {
        setFormError('Please select a customer to proceed.');
        return;
      }
      if (customerMode === 'new') {
        if (!newCustName.trim() || !newCustPhone.trim()) {
          setFormError('Please enter Customer Name and valid Mobile Number.');
          return;
        }
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!customBrand.trim() || !customModel.trim()) {
        setFormError('Please select or specify a Machine Brand and Model.');
        return;
      }
      if (sellingPrice <= 0) {
        setFormError('Machine selling price must be greater than zero.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePrev = () => {
    setFormError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setFormError('');

    try {
      let finalCustomerId = selectedCustomerId;

      // If new customer mode, create customer first
      if (customerMode === 'new') {
        const created = addCustomer({
          businessId: business.id || 'biz-client-ro',
          customerCode: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: newCustName.trim(),
          mobileNumber: newCustPhone.trim(),
          whatsappNumber: newCustPhone.trim(),
          whatsappOptOut: false,
          houseFlatNo: '',
          streetAddress: newCustAddress.trim(),
          areaLocality: newCustArea.trim(),
          city: business.city || 'Hyderabad',
          state: business.state || 'Telangana',
          pincode: business.pincode || '500081',
          customerType: 'Residential',
          status: 'Active customer',
          tags: ['RO Machine Sales'],
          languagePreference: newCustLanguage,
          notes: 'Customer created during RO machine sales invoicing',
          totalSpend: 0,
          pendingBalance: 0,
        });
        finalCustomerId = created.id;
      }

      // Build invoice items
      const items: InvoiceItem[] = [
        {
          id: `item-machine-${Date.now()}`,
          description: `${customBrand} ${customModel} - RO Water Purifier System${customSerialNo ? ` (S/N: ${customSerialNo})` : ''}`,
          quantity: 1,
          unitPrice: sellingPrice,
          amount: sellingPrice,
        },
      ];

      // Add accessories
      selectedAccessories.forEach((acc, idx) => {
        items.push({
          id: `item-acc-${idx}`,
          description: `Accessory: ${acc.name}`,
          quantity: acc.quantity,
          unitPrice: acc.price,
          amount: acc.price * acc.quantity,
        });
      });

      // Add bundled AMC if selected
      if (bundleAmc && selectedAmcPlan) {
        items.push({
          id: `item-amc-${Date.now()}`,
          description: `Warranty/AMC Bundle: ${selectedAmcPlan.name} (${selectedAmcPlan.durationMonths} Months)`,
          quantity: 1,
          unitPrice: selectedAmcPlan.price,
          amount: selectedAmcPlan.price,
        });
      }

      const result = await createSalesInvoice({
        customerId: finalCustomerId,
        purifierProductId: selectedProductId || undefined,
        brand: customBrand,
        model: customModel,
        purifierType: purifierProducts.find((p) => p.id === selectedProductId)?.purifierType || 'RO+UV+UF',
        machineSerialNo: customSerialNo,
        deliveryStatus: 'Pending Installation',
        installationDate,
        technicianId: assignedTechnicianId || undefined,
        items,
        subtotal: rawSubtotal,
        discount,
        gstRate: enableGst ? gstRate : 0,
        gstAmount: calculatedGst,
        total: grandTotal,
        amountPaid,
        balanceDue,
        paymentMethod,
        notes: orderNotes || `Sold by ${business.name}. Warranty active for 12 months.`,
        autoRegisterPurifier,
        autoScheduleInstallation,
        amcPlanId: bundleAmc ? selectedAmcPlanId : undefined,
        sendWhatsAppConfirmation,
      });

      if (onSuccess) {
        onSuccess(result.invoice.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create sales invoice', err);
      setFormError(err.message || 'Error occurred while creating sales invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.mobileNumber.includes(customerSearchQuery) ||
      c.areaLocality.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                RO Purifier Sales Invoicing & Billing
              </h2>
              <p className="text-xs text-slate-500">
                5-Step Wizard: Customer, Machine, Accessories, AMC & Instant Billing.
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

        {/* Wizard Stepper Progress Bar */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto">
          {[
            { step: 1, label: '1. Customer' },
            { step: 2, label: '2. Machine' },
            { step: 3, label: '3. Accessories' },
            { step: 4, label: '4. Warranty/Install' },
            { step: 5, label: '5. Payment & Review' },
          ].map((s) => (
            <div
              key={s.step}
              className={`flex items-center gap-1.5 font-semibold shrink-0 px-2 py-1 rounded-md transition-colors ${
                currentStep === s.step
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : currentStep > s.step
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {currentStep > s.step ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-bold">
                  {s.step}
                </span>
              )}
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl">
              {formError}
            </div>
          )}

          {/* STEP 1: CUSTOMER SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    customerMode === 'existing'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Select Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    customerMode === 'new'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  + Quick Add New Customer
                </button>
              </div>

              {customerMode === 'existing' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer by name, mobile, or locality..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No matching customers found.</p>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCustomerId(c.id)}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            selectedCustomerId === c.id
                              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                              : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {c.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              +91 {c.mobileNumber} • {c.areaLocality}
                            </span>
                          </div>
                          {selectedCustomerId === c.id && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Chandra"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit Mobile"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Area / Locality
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kondapur / Madhapur"
                        value={newCustArea}
                        onChange={(e) => setNewCustArea(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preferred WhatsApp Language
                      </label>
                      <select
                        value={newCustLanguage}
                        onChange={(e) => setNewCustLanguage(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Delivery Address
                    </label>
                    <input
                      type="text"
                      placeholder="Flat/House No, Building, Street, Landmark"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MACHINE SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Choose Water Purifier Model from Catalog
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                {purifierProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProductSelect(p.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center gap-3 transition-colors ${
                      selectedProductId === p.id
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.model}
                        className="w-12 h-12 rounded-lg object-cover bg-white shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-blue-600 block uppercase">{p.brand}</span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">{p.model}</p>
                      <p className="text-[11px] text-slate-500">{p.purifierType}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-emerald-600 text-sm">
                        ₹{p.sellingPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editable Machine Details */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Machine Billing & Serial Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Brand</label>
                    <input
                      type="text"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Serial Number (S/N)</label>
                    <input
                      type="text"
                      placeholder="e.g. AQ-SN-982341"
                      value={customSerialNo}
                      onChange={(e) => setCustomSerialNo(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Agreed Selling Price (₹) *</label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Custom Discount (₹)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">GST Application</label>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="enableGstToggle"
                        checked={enableGst}
                        onChange={(e) => setEnableGst(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="enableGstToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        Apply 18% GST ({business.settings.gstin ? 'Regular GSTIN' : 'Tax'})
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACCESSORIES */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select Add-On Accessories & Installation Hardware
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check accessories included with or billed alongside this water purifier.
                </p>
              </div>

              <div className="space-y-2">
                {accessories.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => handleToggleAccessory(acc.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      acc.selected
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={acc.selected}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-900 dark:text-white">{acc.name}</span>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ₹{acc.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Custom Item */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="text"
                  placeholder="Custom accessory / fitting name..."
                  value={customAccName}
                  onChange={(e) => setCustomAccName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={customAccPrice}
                  onChange={(e) => setCustomAccPrice(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAccessory}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                  + Add Item
                </button>
              </div>

              <div className="text-right text-xs text-slate-500">
                Accessories Total: <span className="font-bold text-slate-800 dark:text-slate-200">₹{accessoriesTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* STEP 4: WARRANTY & INSTALLATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* AMC Bundle Option */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Bundle 1-Year Comprehensive AMC Plan
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Include annual filter replacements & unlimited breakdown coverage in this sale.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bundleAmc}
                    onChange={(e) => setBundleAmc(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {bundleAmc && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-500 mb-1">Select AMC Plan</label>
                    <select
                      value={selectedAmcPlanId}
                      onChange={(e) => setSelectedAmcPlanId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Choose AMC Plan --</option>
                      {amcPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price.toLocaleString('en-IN')} ({plan.annualVisits} Services, {plan.durationMonths} Mo)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Delivery & Technician Assignment */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Installation Date & Technician Dispatch
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Delivery & Installation Date</label>
                    <input
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Assign Certified Technician</label>
                    <select
                      value={assignedTechnicianId}
                      onChange={(e) => setAssignedTechnicianId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Assign Later --</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (+91 {t.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PAYMENT & FINAL REVIEW */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {/* Payment Summary Box */}
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Machine Base ({customBrand} {customModel}):</span>
                  <span>₹{sellingPrice.toLocaleString('en-IN')}</span>
                </div>
                {accessoriesTotal > 0 && (
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Accessories ({selectedAccessories.length} items):</span>
                    <span>₹{accessoriesTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {amcTotal > 0 && (
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>AMC Plan Bundle:</span>
                    <span>₹{amcTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>- ₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {enableGst && calculatedGst > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>18% GST (CGST 9% + SGST 9%):</span>
                    <span>₹{calculatedGst.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-emerald-200/80 dark:border-emerald-900/50">
                  <span>Grand Total Payable:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Method & Paid Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash on Delivery / In-Store Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank transfer">Bank IMPS / NEFT Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Collected / Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                  {balanceDue > 0 ? (
                    <span className="text-[11px] text-rose-500 font-semibold block mt-1">
                      Balance Due on Delivery: ₹{balanceDue.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                      ✓ Paid in Full
                    </span>
                  )}
                </div>
              </div>

              {/* Automation Checkboxes */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRegisterPurifier}
                    onChange={(e) => setAutoRegisterPurifier(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Automatically register machine in customer profile with 12M warranty & 3M renewal pipeline
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScheduleInstallation}
                    onChange={(e) => setAutoScheduleInstallation(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Auto-schedule 1st Installation & Commissioning Job for assigned technician
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWhatsAppConfirmation}
                    onChange={(e) => setSendWhatsAppConfirmation(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Send instant WhatsApp Order Confirmation & Warranty details to customer
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Order Notes / Invoice Remarks
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Free Pre-filter bowl included. Customer requested installation between 11 AM - 1 PM."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Generating Bill...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate Invoice & Finalize Sale</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
