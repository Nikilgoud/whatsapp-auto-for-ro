'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Business,
  User,
  UserRole,
  Customer,
  Purifier,
  Technician,
  ServiceRecord,
  Renewal,
  AMCPlan,
  AMCSubscription,
  InventoryItem,
  Invoice,
  CommunicationLog,
  LanguageCode,
  AutomationSequence,
  RenewalStage,
  ServiceStatus,
  PaymentStatus,
} from '@/types';
import {
  INITIAL_BUSINESS,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PURIFIERS,
  INITIAL_TECHNICIANS,
  INITIAL_RENEWALS,
  INITIAL_SERVICES,
  INITIAL_INVENTORY,
  INITIAL_INVOICES,
  INITIAL_COMMUNICATIONS,
  INITIAL_AMC_PLANS,
  INITIAL_AMC_SUBSCRIPTIONS,
  INITIAL_AUTOMATIONS,
} from '@/lib/storage/mockDb';
import {
  calculateNextPurifierServiceDue,
  createRenewalFromService,
  calculateUrgency,
  getDaysRemaining,
} from '@/lib/services/dueCalculator';
import { format, addMonths } from 'date-fns';

interface AppContextType {
  business: Business;
  currentUser: User;
  selectedLanguage: LanguageCode;
  customers: Customer[];
  purifiers: Purifier[];
  renewals: Renewal[];
  services: ServiceRecord[];
  technicians: Technician[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  amcPlans: AMCPlan[];
  amcSubscriptions: AMCSubscription[];
  communications: CommunicationLog[];
  automations: AutomationSequence[];
  searchTerm: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'needs_table';

  // Actions
  setSearchTerm: (term: string) => void;
  switchUserRole: (role: UserRole) => void;
  switchLanguage: (lang: LanguageCode) => void;
  updateBusinessSettings: (settings: Partial<Business['settings']>) => void;
  updateBusinessProfile: (profile: Partial<Omit<Business, 'settings' | 'id'>>) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, purifier?: Partial<Purifier>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addPurifier: (purifier: Omit<Purifier, 'id'>) => Purifier;
  scheduleService: (service: Partial<ServiceRecord>) => ServiceRecord;
  startService: (serviceId: string) => void;
  completeService: (
    serviceId: string,
    data: {
      inletTds?: number;
      outputTds?: number;
      technicianNotes?: string;
      workSummary?: string;
      partsUsed: { name: string; quantity: number; unitPrice: number; inventoryItemId?: string }[];
      labourCharge: number;
      discount: number;
      amountPaid: number;
      paymentMethod?: any;
      customerSignature?: string;
      customerRating?: number;
    }
  ) => void;
  updateRenewalStage: (renewalId: string, stage: RenewalStage) => void;
  logCommunication: (log: Omit<CommunicationLog, 'id' | 'sentAt'>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'isLowStock'>) => void;
  updateInventoryStock: (itemId: string, qtyDelta: number) => void;
  addTechnician: (techData: Omit<Technician, 'id' | 'completedJobs' | 'pendingJobs' | 'revenueGenerated' | 'rating'>) => Technician;
  deleteTechnician: (id: string) => void;
  assignTechnicianToService: (serviceId: string, technicianId: string) => void;
  batchImportCustomers: (importedCustomers: Customer[], importedPurifiers: Purifier[]) => void;
  addAmcSubscription: (data: Omit<AMCSubscription, 'id' | 'subscriptionCode'>) => AMCSubscription;
  addAmcPlan: (plan: Omit<AMCPlan, 'id'>) => AMCPlan;
  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'serviceCode' | 'createdAt' | 'updatedAt'>) => ServiceRecord;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'ro_renewal_engine_prod_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [business, setBusiness] = useState<Business>(INITIAL_BUSINESS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [purifiers, setPurifiers] = useState<Purifier[]>(INITIAL_PURIFIERS);
  const [renewals, setRenewals] = useState<Renewal[]>(INITIAL_RENEWALS);
  const [services, setServices] = useState<ServiceRecord[]>(INITIAL_SERVICES);
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [amcPlans, setAmcPlans] = useState<AMCPlan[]>(INITIAL_AMC_PLANS);
  const [amcSubscriptions, setAmcSubscriptions] = useState<AMCSubscription[]>(INITIAL_AMC_SUBSCRIPTIONS);
  const [communications, setCommunications] = useState<CommunicationLog[]>(INITIAL_COMMUNICATIONS);
  const [automations, setAutomations] = useState<AutomationSequence[]>(INITIAL_AUTOMATIONS);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'needs_table'>('syncing');
  const isRemoteUpdateRef = useRef(false);

  // 1. Initial Load: Load local storage instantly, then sync latest from Supabase
  useEffect(() => {
    try {
      // Clear legacy demo cache keys
      localStorage.removeItem('ro_renewal_engine_v1_store');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure legacy demo customers (cust-1) are ignored
        if (parsed.customers && (!parsed.customers[0] || parsed.customers[0].id !== 'cust-1')) {
          setCustomers(parsed.customers || []);
          setPurifiers(parsed.purifiers || []);
          setRenewals(parsed.renewals || []);
          setServices(parsed.services || []);
          setTechnicians(parsed.technicians || []);
          setInventory(parsed.inventory || []);
          setInvoices(parsed.invoices || []);
          setAmcSubscriptions(parsed.amcSubscriptions || []);
          if (parsed.business) setBusiness(parsed.business);
        }
      }
    } catch {
      // fallback to initial
    }
    setMounted(true);

    // Fetch latest cloud data from Supabase
    const fetchCloudData = async () => {
      try {
        const { data, error } = await supabase
          .from('ro_app_state')
          .select('data')
          .eq('id', 'primary_business')
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            setCloudSyncStatus('needs_table');
          } else {
            setCloudSyncStatus('offline');
          }
          return;
        }

        if (data && data.data) {
          const cloud = data.data;
          const isStaleDemo = cloud.customers?.[0]?.id === 'cust-1' || cloud.invoices?.[0]?.id === 'inv-102';

          if (!isStaleDemo) {
            isRemoteUpdateRef.current = true;
            setCustomers(cloud.customers || []);
            setPurifiers(cloud.purifiers || []);
            setRenewals(cloud.renewals || []);
            setServices(cloud.services || []);
            setTechnicians(cloud.technicians || []);
            setInventory(cloud.inventory || []);
            setInvoices(cloud.invoices || []);
            setAmcSubscriptions(cloud.amcSubscriptions || []);
            if (cloud.business) setBusiness(cloud.business);
          } else {
            // Overwrite stale demo in Supabase with clean production data
            supabase.from('ro_app_state').upsert({
              id: 'primary_business',
              data: {
                customers: [],
                purifiers: [],
                renewals: [],
                services: [],
                technicians: [],
                inventory: [],
                invoices: [],
                amcSubscriptions: [],
                business: INITIAL_BUSINESS,
              },
              updated_at: new Date().toISOString(),
            });
          }
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('synced');
        }
      } catch {
        setCloudSyncStatus('offline');
      }
    };

    fetchCloudData();

    // 2. Realtime listener: Automatically updates computer when mobile edits, and vice-versa
    const channel = supabase
      .channel('ro_live_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ro_app_state',
          filter: 'id=eq.primary_business',
        },
        (payload: any) => {
          if (payload.new && payload.new.data) {
            const cloud = payload.new.data;
            isRemoteUpdateRef.current = true;
            if (cloud.customers) setCustomers(cloud.customers);
            if (cloud.purifiers) setPurifiers(cloud.purifiers);
            if (cloud.renewals) setRenewals(cloud.renewals);
            if (cloud.services) setServices(cloud.services);
            if (cloud.technicians) setTechnicians(cloud.technicians);
            if (cloud.inventory) setInventory(cloud.inventory);
            if (cloud.invoices) setInvoices(cloud.invoices);
            if (cloud.amcSubscriptions) setAmcSubscriptions(cloud.amcSubscriptions);
            if (cloud.business) setBusiness(cloud.business);
            setCloudSyncStatus('synced');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Save to LocalStorage and Supabase (debounced by 800ms)
  useEffect(() => {
    if (!mounted) return;

    const payload = {
      customers,
      purifiers,
      renewals,
      services,
      technicians,
      inventory,
      invoices,
      amcSubscriptions,
      business,
    };

    // Keep LocalStorage updated for offline caching
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}

    // Avoid echoing remote updates back to cloud
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    setCloudSyncStatus('syncing');

    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase.from('ro_app_state').upsert({
          id: 'primary_business',
          data: payload,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            setCloudSyncStatus('needs_table');
          } else {
            setCloudSyncStatus('offline');
          }
        } else {
          setCloudSyncStatus('synced');
        }
      } catch {
        setCloudSyncStatus('offline');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [mounted, customers, purifiers, renewals, services, technicians, inventory, invoices, amcSubscriptions, business]);

  const switchUserRole = (role: UserRole) => {
    const matched = users.find((u) => u.role === role) || users[0];
    setCurrentUser(matched);
  };

  const switchLanguage = (lang: LanguageCode) => {
    setSelectedLanguage(lang);
  };

  const updateBusinessSettings = (settings: Partial<Business['settings']>) => {
    setBusiness((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const updateBusinessProfile = (profile: Partial<Omit<Business, 'settings' | 'id'>>) => {
    setBusiness((prev) => {
      const updated = {
        ...prev,
        ...profile,
      };
      // Also sync currentUser name if ownerName is updated
      if (profile.ownerName) {
        setCurrentUser((u) => (u.role === 'OWNER' ? { ...u, name: profile.ownerName! } : u));
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.role === 'OWNER' ? { ...u, name: profile.ownerName! } : u))
        );
      }
      return updated;
    });
  };

  const addCustomer = (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>,
    purifierData?: Partial<Purifier>
  ): Customer => {
    const newCustId = `cust-${Date.now()}`;
    const nowStr = format(new Date(), 'yyyy-MM-dd');
    const newCustomer: Customer = {
      ...customerData,
      id: newCustId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    if (purifierData) {
      const newPurId = `pur-${Date.now()}`;
      const nextDue = purifierData.nextServiceDueDate || format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd');
      const newPurifier: Purifier = {
        id: newPurId,
        businessId: business.id,
        customerId: newCustId,
        purifierCode: purifierData.purifierCode || `PUR-${Math.floor(100 + Math.random() * 900)}`,
        brand: purifierData.brand || 'Kent',
        model: purifierData.model || 'Grand+ RO',
        purifierType: purifierData.purifierType || 'RO+UV',
        capacityLph: purifierData.capacityLph || 15,
        installationDate: purifierData.installationDate || nowStr,
        purchaseDate: purifierData.purchaseDate || purifierData.installationDate || nowStr,
        warrantyStart: purifierData.warrantyStart || purifierData.installationDate || nowStr,
        warrantyExpiry: purifierData.warrantyExpiry,
        sparePartsWarrantyExpiry: purifierData.sparePartsWarrantyExpiry,
        sparePartsWarrantyNotes: purifierData.sparePartsWarrantyNotes,
        installationLocation: purifierData.installationLocation || 'Kitchen',
        currentCondition: purifierData.currentCondition || 'Good',
        inletTdsBaseline: purifierData.inletTdsBaseline,
        outputTdsBaseline: purifierData.outputTdsBaseline,
        lastServiceDate: purifierData.lastServiceDate || purifierData.installationDate,
        nextServiceDueDate: nextDue,
        components: purifierData.components || [],
      };
      setPurifiers((prev) => [newPurifier, ...prev]);

      // Automatically create the initial Renewal pipeline record!
      const days = getDaysRemaining(nextDue);
      const newRenewal: Renewal = {
        id: `rnw-${Date.now()}`,
        businessId: business.id,
        customerId: newCustId,
        purifierId: newPurId,
        renewalType: 'REGULAR_SERVICE',
        nextDueDate: nextDue,
        urgency: calculateUrgency(days),
        daysRemaining: days,
        serviceType: 'General service',
        estimatedValue: business.settings.serviceCharges?.generalService ?? business.settings.averageServiceCost ?? 0,
        followUpStage: days <= 14 ? 'Upcoming' : 'Not due',
        status: 'PENDING',
        remindersSentCount: 0,
      };
      setRenewals((prev) => [newRenewal, ...prev]);

      // Optional initial AMC Plan enrollment
      const amcPlanId = (purifierData as any)?.amcPlanId;
      if (amcPlanId && amcPlanId !== 'none') {
        const plan = amcPlans.find((p) => p.id === amcPlanId);
        if (plan) {
          const startDate = nowStr;
          const endDate = format(addMonths(new Date(), plan.durationMonths || 12), 'yyyy-MM-dd');
          const newAmcId = `amc-sub-${Date.now()}`;
          const newAmcCode = `AMC-${format(new Date(), 'yyyy')}-${Math.floor(100 + Math.random() * 900)}`;
          const newSub: AMCSubscription = {
            id: newAmcId,
            businessId: business.id,
            subscriptionCode: newAmcCode,
            customerId: newCustId,
            purifierId: newPurId,
            amcPlanId: plan.id,
            startDate,
            endDate,
            renewalDate: endDate,
            visitsTotal: plan.annualVisits || 3,
            visitsCompleted: 0,
            price: plan.price,
            amountPaid: plan.price,
            status: 'Active',
            notes: `Enrolled upon registration: ${plan.name}`,
          };
          setAmcSubscriptions((prevSubs) => [newSub, ...prevSubs]);
          // Mark customer as AMC active
          newCustomer.status = 'AMC active';
        }
      }
    }

    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: format(new Date(), 'yyyy-MM-dd') } : c))
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setPurifiers((prev) => prev.filter((p) => p.customerId !== id));
    setRenewals((prev) => prev.filter((r) => r.customerId !== id));
    setServices((prev) => prev.filter((s) => s.customerId !== id));
    setAmcSubscriptions((prev) => prev.filter((a) => a.customerId !== id));
    setInvoices((prev) => prev.filter((i) => i.customerId !== id));
    setCommunications((prev) => prev.filter((comm) => comm.customerId !== id));
  };

  const addPurifier = (purifierData: Omit<Purifier, 'id'>): Purifier => {
    const newPurId = `pur-${Date.now()}`;
    const newPurifier: Purifier = {
      ...purifierData,
      id: newPurId,
    };
    setPurifiers((prev) => [newPurifier, ...prev]);
    return newPurifier;
  };

  const scheduleService = (data: Partial<ServiceRecord>): ServiceRecord => {
    const newId = `srv-${Date.now()}`;
    const code = `SRV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');

    const newRecord: ServiceRecord = {
      id: newId,
      businessId: business.id,
      serviceCode: code,
      customerId: data.customerId || '',
      purifierId: data.purifierId || '',
      technicianId: data.technicianId,
      serviceType: data.serviceType || 'General service',
      bookingDate: todayFormatted,
      scheduledDate: data.scheduledDate || todayFormatted,
      scheduledTimeSlot: data.scheduledTimeSlot || '10:00 AM - 12:00 PM',
      status: data.technicianId ? 'Assigned' : 'Confirmed',
      issueDescription: data.issueDescription || 'Scheduled service',
      checklists: [
        { id: 'c1', title: 'Check raw water inlet pressure and tap connection', completed: false },
        { id: 'c2', title: 'Measure raw inlet TDS level', completed: false },
        { id: 'c3', title: 'Inspect and clean sediment filter / candle', completed: false },
        { id: 'c4', title: 'Check carbon block & taste conditioner', completed: false },
        { id: 'c5', title: 'Measure pure water output TDS level', completed: false },
        { id: 'c6', title: 'Sanitize water storage tank and check float switch', completed: false },
        { id: 'c7', title: 'Perform leak test on all elbows, stem tees and pipes', completed: false },
      ],
      partsUsed: data.partsUsed || [],
      labourCharge: data.labourCharge || 250,
      partsCharge: data.partsCharge || 0,
      discount: data.discount || 0,
      tax: 0,
      total: (data.labourCharge || 250) + (data.partsCharge || 0) - (data.discount || 0),
      amountPaid: 0,
      amountPending: (data.labourCharge || 250) + (data.partsCharge || 0) - (data.discount || 0),
      paymentStatus: 'Pending',
      beforePhotos: [],
      afterPhotos: [],
      createdAt: todayFormatted,
      updatedAt: todayFormatted,
    };

    setServices((prev) => [newRecord, ...prev]);

    // Update matching renewal status to SCHEDULED
    if (data.customerId) {
      setRenewals((prev) =>
        prev.map((r) =>
          r.customerId === data.customerId && r.status === 'PENDING'
            ? { ...r, followUpStage: 'Appointment scheduled', status: 'SCHEDULED' }
            : r
        )
      );
    }

    return newRecord;
  };

  const startService = (serviceId: string) => {
    const nowStr = format(new Date(), 'yyyy-MM-dd HH:mm');
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              status: 'Started',
              startedTime: nowStr,
              updatedAt: format(new Date(), 'yyyy-MM-dd'),
            }
          : s
      )
    );
  };

  const completeService = (
    serviceId: string,
    data: {
      inletTds?: number;
      outputTds?: number;
      technicianNotes?: string;
      workSummary?: string;
      partsUsed: { name: string; quantity: number; unitPrice: number; inventoryItemId?: string }[];
      labourCharge: number;
      discount: number;
      amountPaid: number;
      paymentMethod?: any;
      customerSignature?: string;
      customerRating?: number;
    }
  ) => {
    const completedTimeStr = format(new Date(), 'yyyy-MM-dd HH:mm');
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');

    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const partsTotal = data.partsUsed.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
    const grossTotal = data.labourCharge + partsTotal - data.discount;
    const balance = Math.max(0, grossTotal - data.amountPaid);
    const paymentStatus: PaymentStatus =
      balance === 0 ? 'Paid' : data.amountPaid > 0 ? 'Partially paid' : 'Pending';

    // 1. Update service record
    const updatedService: ServiceRecord = {
      ...service,
      status: 'Completed',
      completedTime: completedTimeStr,
      inletWaterTds: data.inletTds,
      outputWaterTds: data.outputTds,
      technicianNotes: data.technicianNotes,
      workSummary: data.workSummary,
      partsUsed: data.partsUsed.map((p, idx) => ({
        id: `pu-${Date.now()}-${idx}`,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.quantity * p.unitPrice,
        inventoryItemId: p.inventoryItemId,
      })),
      labourCharge: data.labourCharge,
      partsCharge: partsTotal,
      discount: data.discount,
      total: grossTotal,
      amountPaid: data.amountPaid,
      amountPending: balance,
      paymentStatus,
      paymentMethod: data.paymentMethod || 'UPI',
      customerSignature: data.customerSignature,
      customerRating: data.customerRating || 5,
      updatedAt: todayFormatted,
    };

    setServices((prev) => prev.map((s) => (s.id === serviceId ? updatedService : s)));

    // 2. Automatically reduce inventory stock for replaced parts!
    if (data.partsUsed && data.partsUsed.length > 0) {
      setInventory((prevInv) =>
        prevInv.map((inv) => {
          const used = data.partsUsed.find(
            (p) => p.inventoryItemId === inv.id || p.name.toLowerCase().includes(inv.productName.toLowerCase())
          );
          if (used) {
            const newStock = Math.max(0, inv.currentStock - used.quantity);
            return {
              ...inv,
              currentStock: newStock,
              isLowStock: newStock <= inv.reorderLevel,
            };
          }
          return inv;
        })
      );
    }

    // 3. Update customer spend and pending balance
    const customer = customers.find((c) => c.id === service.customerId);
    const purifier = purifiers.find((p) => p.id === service.purifierId);

    if (customer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? {
                ...c,
                totalSpend: c.totalSpend + data.amountPaid,
                pendingBalance: c.pendingBalance + balance,
                status: 'Active customer',
                updatedAt: todayFormatted,
              }
            : c
        )
      );
    }

    // 4. Update purifier last service date & calculate next due date
    if (purifier && customer) {
      const nextDue = calculateNextPurifierServiceDue(purifier, business.settings, todayFormatted);
      setPurifiers((prev) =>
        prev.map((p) =>
          p.id === purifier.id
            ? {
                ...p,
                lastServiceDate: todayFormatted,
                nextServiceDueDate: nextDue,
                inletTdsBaseline: data.inletTds || p.inletTdsBaseline,
                outputTdsBaseline: data.outputTds || p.outputTdsBaseline,
                currentCondition: 'Good',
              }
            : p
        )
      );

      // 5. CRITICAL: Automatically create the next Renewal record for this customer!
      const newRenewal = createRenewalFromService(customer, purifier, updatedService, business.settings);
      setRenewals((prev) => [
        newRenewal,
        ...prev.map((r) =>
          r.customerId === customer.id && r.status === 'SCHEDULED'
            ? { ...r, status: 'CONVERTED' as const, followUpStage: 'Service completed' as RenewalStage }
            : r
        ),
      ]);
    }

    // 6. Generate Invoice record
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      businessId: business.id,
      invoiceNumber: `${business.settings.invoicePrefix}${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: service.customerId,
      serviceRecordId: service.id,
      invoiceDate: todayFormatted,
      dueDate: todayFormatted,
      items: [
        { id: 'i1', description: 'Labour & Service Charges', quantity: 1, unitPrice: data.labourCharge, amount: data.labourCharge },
        ...data.partsUsed.map((p, idx) => ({
          id: `i-part-${idx}`,
          description: p.name,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          amount: p.quantity * p.unitPrice,
        })),
      ],
      subtotal: data.labourCharge + partsTotal,
      discount: data.discount,
      gstRate: business.settings.enableGst ? 18 : 0,
      gstAmount: 0,
      total: grossTotal,
      amountPaid: data.amountPaid,
      balanceDue: balance,
      paymentStatus,
      notes: `Service Code: ${service.serviceCode}`,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const updateRenewalStage = (renewalId: string, stage: RenewalStage) => {
    setRenewals((prev) =>
      prev.map((r) => (r.id === renewalId ? { ...r, followUpStage: stage } : r))
    );
  };

  const logCommunication = (log: Omit<CommunicationLog, 'id' | 'sentAt'>) => {
    const newEntry: CommunicationLog = {
      ...log,
      id: `comm-${Date.now()}`,
      sentAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
    };
    setCommunications((prev) => [newEntry, ...prev]);

    // Update customer's renewal remindersSentCount if applicable
    setRenewals((prev) =>
      prev.map((r) =>
        r.customerId === log.customerId && r.status === 'PENDING'
          ? {
              ...r,
              remindersSentCount: r.remindersSentCount + 1,
              lastReminderDate: format(new Date(), 'yyyy-MM-dd'),
              followUpStage: 'Reminder sent',
            }
          : r
      )
    );
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'isLowStock'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      isLowStock: item.currentStock <= item.reorderLevel,
    };
    setInventory((prev) => [newItem, ...prev]);
  };

  const updateInventoryStock = (itemId: string, qtyDelta: number) => {
    setInventory((prev) =>
      prev.map((inv) => {
        if (inv.id === itemId) {
          const newQty = Math.max(0, inv.currentStock + qtyDelta);
          return {
            ...inv,
            currentStock: newQty,
            isLowStock: newQty <= inv.reorderLevel,
          };
        }
        return inv;
      })
    );
  };

  const batchImportCustomers = (importedCustomers: Customer[], importedPurifiers: Purifier[]) => {
    setCustomers((prev) => [...importedCustomers, ...prev]);
    setPurifiers((prev) => [...importedPurifiers, ...prev]);

    // Create renewals for valid imported purifiers
    const newRenewals: Renewal[] = importedPurifiers.map((pur) => {
      const days = getDaysRemaining(pur.nextServiceDueDate);
      return {
        id: `rnw-imp-${Date.now()}-${pur.id}`,
        businessId: business.id,
        customerId: pur.customerId,
        purifierId: pur.id,
        renewalType: 'REGULAR_SERVICE',
        nextDueDate: pur.nextServiceDueDate,
        urgency: calculateUrgency(days),
        daysRemaining: days,
        serviceType: 'General service',
        estimatedValue: business.settings.serviceCharges?.generalService ?? business.settings.averageServiceCost ?? 0,
        followUpStage: 'Upcoming',
        status: 'PENDING',
        remindersSentCount: 0,
      };
    });

    setRenewals((prev) => [...newRenewals, ...prev]);
  };

  const addTechnician = (
    techData: Omit<Technician, 'id' | 'completedJobs' | 'pendingJobs' | 'revenueGenerated' | 'rating'>
  ): Technician => {
    const newTech: Technician = {
      ...techData,
      id: `tech-${Date.now()}`,
      completedJobs: 0,
      pendingJobs: 0,
      revenueGenerated: 0,
      rating: 5.0,
    };
    setTechnicians((prev) => [newTech, ...prev]);
    return newTech;
  };

  const deleteTechnician = (id: string) => {
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
    // Reset any active assignments for this technician
    setServices((prev) =>
      prev.map((s) =>
        s.technicianId === id
          ? { ...s, technicianId: undefined, status: s.status === 'Assigned' ? 'Confirmed' : s.status }
          : s
      )
    );
  };

  const assignTechnicianToService = (serviceId: string, technicianId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, technicianId, status: 'Assigned' } : s))
    );
    setTechnicians((prev) =>
      prev.map((t) => (t.id === technicianId ? { ...t, pendingJobs: t.pendingJobs + 1 } : t))
    );
  };

  const addAmcSubscription = (
    data: Omit<AMCSubscription, 'id' | 'subscriptionCode'>
  ): AMCSubscription => {
    const newId = `amc-sub-${Date.now()}`;
    const code = `AMC-${format(new Date(), 'yyyy')}-${Math.floor(100 + Math.random() * 900)}`;
    const newSub: AMCSubscription = {
      ...data,
      id: newId,
      subscriptionCode: code,
    };
    setAmcSubscriptions((prev) => [newSub, ...prev]);

    // Update customer status to 'AMC active'
    setCustomers((prev) =>
      prev.map((c) => (c.id === data.customerId ? { ...c, status: 'AMC active' } : c))
    );

    // Link/update renewal pipeline for AMC renewal
    setRenewals((prev) => {
      const existing = prev.find((r) => r.customerId === data.customerId);
      const days = getDaysRemaining(data.endDate);
      const amcRenewal: Renewal = {
        id: `rnw-amc-${Date.now()}`,
        businessId: business.id,
        customerId: data.customerId,
        purifierId: data.purifierId,
        amcSubscriptionId: newId,
        renewalType: 'AMC_RENEWAL',
        nextDueDate: data.endDate,
        urgency: calculateUrgency(days),
        daysRemaining: days,
        serviceType: 'AMC service',
        estimatedValue: data.price,
        followUpStage: days <= 30 ? 'Upcoming' : 'Not due',
        status: 'PENDING',
        remindersSentCount: 0,
        notes: `AMC contract ends on ${data.endDate}. Renew for continued coverage.`,
      };
      if (existing) {
        return prev.map((r) => (r.id === existing.id ? amcRenewal : r));
      }
      return [amcRenewal, ...prev];
    });

    return newSub;
  };

  const addAmcPlan = (planData: Omit<AMCPlan, 'id'>): AMCPlan => {
    const newId = `amc-plan-${Date.now()}`;
    const newPlan: AMCPlan = {
      ...planData,
      id: newId,
    };
    setAmcPlans((prev) => [newPlan, ...prev]);
    return newPlan;
  };

  const addServiceRecord = (
    recordData: Omit<ServiceRecord, 'id' | 'serviceCode' | 'createdAt' | 'updatedAt'>
  ): ServiceRecord => {
    const newId = `srv-${Date.now()}`;
    const code = `SRV-${format(new Date(), 'yyyy')}-${Math.floor(100 + Math.random() * 900)}`;
    const nowStr = format(new Date(), 'yyyy-MM-dd');

    const newRecord: ServiceRecord = {
      ...recordData,
      id: newId,
      serviceCode: code,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setServices((prev) => [newRecord, ...prev]);

    // Update purifier lastServiceDate if completed
    if (recordData.status === 'Completed' && recordData.scheduledDate) {
      setPurifiers((prev) =>
        prev.map((p) =>
          p.id === recordData.purifierId
            ? {
                ...p,
                lastServiceDate: recordData.scheduledDate,
                outputTdsBaseline: recordData.outputWaterTds || p.outputTdsBaseline,
                inletTdsBaseline: recordData.inletWaterTds || p.inletTdsBaseline,
              }
            : p
        )
      );

      // Add to customer totalSpend and reduce pending balance if paid
      if (recordData.amountPaid > 0) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === recordData.customerId
              ? {
                  ...c,
                  totalSpend: c.totalSpend + recordData.amountPaid,
                  pendingBalance: Math.max(0, c.pendingBalance + (recordData.amountPending || 0)),
                }
              : c
          )
        );
      }

      // If technician is assigned, increment their completed jobs
      if (recordData.technicianId) {
        setTechnicians((prev) =>
          prev.map((t) =>
            t.id === recordData.technicianId
              ? {
                  ...t,
                  completedJobs: t.completedJobs + 1,
                  revenueGenerated: t.revenueGenerated + (recordData.total || 0),
                }
              : t
          )
        );
      }
    }

    return newRecord;
  };

  const resetDemoData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setBusiness(INITIAL_BUSINESS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setCustomers(INITIAL_CUSTOMERS);
    setPurifiers(INITIAL_PURIFIERS);
    setRenewals(INITIAL_RENEWALS);
    setServices(INITIAL_SERVICES);
    setTechnicians(INITIAL_TECHNICIANS);
    setInventory(INITIAL_INVENTORY);
    setInvoices(INITIAL_INVOICES);
    setAmcPlans(INITIAL_AMC_PLANS);
    setAmcSubscriptions(INITIAL_AMC_SUBSCRIPTIONS);
    setCommunications(INITIAL_COMMUNICATIONS);
    setAutomations(INITIAL_AUTOMATIONS);
  };

  return (
    <AppContext.Provider
      value={{
        business,
        currentUser,
        selectedLanguage,
        customers,
        purifiers,
        renewals,
        services,
        technicians,
        inventory,
        invoices,
        amcPlans,
        amcSubscriptions,
        communications,
        automations,
        searchTerm,
        cloudSyncStatus,
        setSearchTerm,
        switchUserRole,
        switchLanguage,
        updateBusinessSettings,
        updateBusinessProfile,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPurifier,
        scheduleService,
        startService,
        completeService,
        updateRenewalStage,
        logCommunication,
        addInventoryItem,
        updateInventoryStock,
        addTechnician,
        deleteTechnician,
        assignTechnicianToService,
        batchImportCustomers,
        addAmcSubscription,
        addAmcPlan,
        addServiceRecord,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
