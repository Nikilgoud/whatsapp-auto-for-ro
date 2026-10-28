'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isLocalSandbox } from '@/lib/supabaseClient';
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
  PurifierProduct,
  AutoReminderConfig,
  BroadcastLog,
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
  INITIAL_PURIFIER_PRODUCTS,
  INITIAL_AUTO_REMINDER_CONFIG,
  INITIAL_BROADCAST_LOGS,
} from '@/lib/storage/mockDb';
import {
  DEMO_BUSINESS,
  DEMO_CUSTOMERS,
  DEMO_PURIFIERS,
  DEMO_RENEWALS,
  DEMO_SERVICES,
  DEMO_TECHNICIANS,
  DEMO_INVOICES,
  DEMO_PURIFIER_PRODUCTS,
} from '@/lib/storage/demoData';
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
  purifierProducts: PurifierProduct[];
  autoReminderConfig: AutoReminderConfig;
  broadcastLogs: BroadcastLog[];
  searchTerm: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'needs_table' | 'local_sandbox';

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
  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'serviceCode' | 'createdAt' | 'updatedAt'>) => ServiceRecord;
  batchImportCustomers: (importedCustomers: Customer[], importedPurifiers: Purifier[]) => void;
  addAmcSubscription: (data: Omit<AMCSubscription, 'id' | 'subscriptionCode'>) => AMCSubscription;
  addAmcPlan: (plan: Omit<AMCPlan, 'id'>) => AMCPlan;
  addPurifierProduct: (product: Omit<PurifierProduct, 'id' | 'createdAt'>) => PurifierProduct;
  updatePurifierProduct: (id: string, updates: Partial<PurifierProduct>) => void;
  deletePurifierProduct: (id: string) => void;
  updateAutoReminderConfig: (updates: Partial<AutoReminderConfig>) => void;
  runAutomatedRemindersNow: () => { sent: number; skipped: number; logs: string[] };
  broadcastToAllCustomers: (manualText: string, targetFilter: string, media?: { url: string; type: 'image' | 'video' }) => Promise<{ sent: number; logs: string[] }>;
  resetDemoData: () => void;

  syncWithCloud: () => Promise<void>;
  lastCloudSyncTime: string | null;
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
  const [purifierProducts, setPurifierProducts] = useState<PurifierProduct[]>(INITIAL_PURIFIER_PRODUCTS);
  const [autoReminderConfig, setAutoReminderConfig] = useState<AutoReminderConfig>(INITIAL_AUTO_REMINDER_CONFIG);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>(INITIAL_BROADCAST_LOGS);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'synced' | 'syncing' | 'offline' | 'needs_table' | 'local_sandbox'
  >('local_sandbox');

  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const hasLoadedFromCloudRef = useRef(false);

  // Fetch latest cloud data from Supabase
  const fetchCloudData = async () => {
    // If running locally, completely isolate from client's Supabase
    if (isLocalSandbox()) {
      setCloudSyncStatus('local_sandbox');
      hasLoadedFromCloudRef.current = true;
      return;
    }

    try {
      setCloudSyncStatus('syncing');
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
        isRemoteUpdateRef.current = true;
        if (Array.isArray(cloud.customers)) setCustomers(cloud.customers);
        if (Array.isArray(cloud.purifiers)) setPurifiers(cloud.purifiers);
        if (Array.isArray(cloud.renewals)) setRenewals(cloud.renewals);
        if (Array.isArray(cloud.services)) setServices(cloud.services);
        if (Array.isArray(cloud.technicians)) setTechnicians(cloud.technicians);
        if (Array.isArray(cloud.inventory)) setInventory(cloud.inventory);
        
        let activeInvoices = Array.isArray(cloud.invoices) ? cloud.invoices : [];
        if (Array.isArray(cloud.services)) {
          const existingServiceIds = new Set(activeInvoices.map((inv: any) => inv.serviceRecordId));
          const missingInvoices = cloud.services
            .filter((srv: any) => srv.status === 'Completed' && !existingServiceIds.has(srv.id))
            .map((srv: any, idx: number) => {
              const partsSum = (srv.partsUsed || []).reduce((sum: number, p: any) => sum + (p.totalPrice || p.quantity * p.unitPrice || 0), 0);
              const gross = srv.total ?? ((srv.labourCharge || 0) + partsSum - (srv.discount || 0));
              const paid = srv.amountPaid ?? gross;
              const bal = Math.max(0, gross - paid);
              return {
                id: `inv-${Date.now()}-${idx}`,
                businessId: srv.businessId || 'biz-client-ro',
                invoiceNumber: `AQ-RO-${Math.floor(1000 + Math.random() * 9000)}`,
                customerId: srv.customerId,
                serviceRecordId: srv.id,
                invoiceDate: srv.scheduledDate || srv.completedTime?.split(' ')[0] || srv.createdAt,
                dueDate: srv.scheduledDate || srv.completedTime?.split(' ')[0] || srv.createdAt,
                items: [
                  {
                    id: 'i-labour',
                    description: `${srv.serviceType || 'Service'} - Labour / Service Charges`,
                    quantity: 1,
                    unitPrice: srv.labourCharge || 0,
                    amount: srv.labourCharge || 0,
                  },
                  ...(srv.partsUsed || []).map((p: any, pIdx: number) => ({
                    id: `i-part-${pIdx}`,
                    description: p.name,
                    quantity: p.quantity || 1,
                    unitPrice: p.unitPrice || 0,
                    amount: p.totalPrice || (p.quantity || 1) * (p.unitPrice || 0),
                  })),
                ],
                subtotal: (srv.labourCharge || 0) + partsSum,
                discount: srv.discount || 0,
                gstRate: 0,
                gstAmount: 0,
                total: gross,
                amountPaid: paid,
                balanceDue: bal,
                paymentStatus: bal === 0 ? 'Paid' : paid > 0 ? 'Partially paid' : 'Pending',
                notes: `Auto-generated for Service: ${srv.serviceCode}`,
              };
            });
          if (missingInvoices.length > 0) {
            activeInvoices = [...missingInvoices, ...activeInvoices];
          }
        }
        setInvoices(activeInvoices);
        if (Array.isArray(cloud.amcSubscriptions)) setAmcSubscriptions(cloud.amcSubscriptions);
        if (Array.isArray(cloud.purifierProducts)) setPurifierProducts(cloud.purifierProducts);
        if (cloud.autoReminderConfig) setAutoReminderConfig(cloud.autoReminderConfig);
        if (Array.isArray(cloud.broadcastLogs)) setBroadcastLogs(cloud.broadcastLogs);
        if (cloud.business) setBusiness(cloud.business);
        hasLoadedFromCloudRef.current = true;
        setCloudSyncStatus('synced');

        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        hasLoadedFromCloudRef.current = true;
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch {
      setCloudSyncStatus('offline');
    }
  };

  // Explicit function to trigger sync on demand
  const syncWithCloud = async () => {
    if (isLocalSandbox()) {
      setCloudSyncStatus('local_sandbox');
      return;
    }
    await fetchCloudData();
  };

  // 1. Initial Load: Load local storage instantly, then sync latest from Supabase
  useEffect(() => {
    const isSandbox = isLocalSandbox();
    if (isSandbox) {
      try {
        const saved = localStorage.getItem('ro_local_sandbox_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.customers && parsed.customers.length > 0) {
            setCustomers(parsed.customers);
            setPurifiers(parsed.purifiers || []);
            setRenewals(parsed.renewals || []);
            setServices(parsed.services || []);
            setTechnicians(parsed.technicians || []);
            setInventory(parsed.inventory || []);
            setInvoices(parsed.invoices || []);
            setAmcSubscriptions(parsed.amcSubscriptions || []);
            setPurifierProducts(parsed.purifierProducts || DEMO_PURIFIER_PRODUCTS);
            setAutoReminderConfig(parsed.autoReminderConfig || INITIAL_AUTO_REMINDER_CONFIG);
            setBroadcastLogs(parsed.broadcastLogs || []);
            if (parsed.business) setBusiness(parsed.business);
          } else {
            setCustomers(DEMO_CUSTOMERS);
            setPurifiers(DEMO_PURIFIERS);
            setRenewals(DEMO_RENEWALS);
            setServices(DEMO_SERVICES);
            setTechnicians(DEMO_TECHNICIANS);
            setInvoices(DEMO_INVOICES);
            setPurifierProducts(DEMO_PURIFIER_PRODUCTS);
            setBusiness(DEMO_BUSINESS);
          }
        } else {
          setCustomers(DEMO_CUSTOMERS);
          setPurifiers(DEMO_PURIFIERS);
          setRenewals(DEMO_RENEWALS);
          setServices(DEMO_SERVICES);
          setTechnicians(DEMO_TECHNICIANS);
          setInvoices(DEMO_INVOICES);
          setPurifierProducts(DEMO_PURIFIER_PRODUCTS);
          setBusiness(DEMO_BUSINESS);
        }
      } catch {
        setCustomers(DEMO_CUSTOMERS);
        setPurifiers(DEMO_PURIFIERS);
        setRenewals(DEMO_RENEWALS);
        setServices(DEMO_SERVICES);
        setTechnicians(DEMO_TECHNICIANS);
        setInvoices(DEMO_INVOICES);
        setPurifierProducts(DEMO_PURIFIER_PRODUCTS);
        setBusiness(DEMO_BUSINESS);
      }
      setMounted(true);
      hasLoadedFromCloudRef.current = true;
      setCloudSyncStatus('local_sandbox');
      return; // Do NOT attach Supabase realtime listener or fetch from cloud!
    }

    try {
      localStorage.removeItem('ro_renewal_engine_v1_store');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customers && (!parsed.customers[0] || parsed.customers[0].id !== 'cust-1')) {
          setCustomers(parsed.customers || []);
          setPurifiers(parsed.purifiers || []);
          setRenewals(parsed.renewals || []);
          setServices(parsed.services || []);
          setTechnicians(parsed.technicians || []);
          setInventory(parsed.inventory || []);
          setInvoices(parsed.invoices || []);
          setAmcSubscriptions(parsed.amcSubscriptions || []);
          setPurifierProducts(parsed.purifierProducts || INITIAL_PURIFIER_PRODUCTS);
          setAutoReminderConfig(parsed.autoReminderConfig || INITIAL_AUTO_REMINDER_CONFIG);
          setBroadcastLogs(parsed.broadcastLogs || []);
          if (parsed.business) setBusiness(parsed.business);
        }
      }
    } catch {
      // fallback to initial
    }
    setMounted(true);

    fetchCloudData();

    // Re-fetch when user switches back to this tab or unlocks mobile phone
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCloudData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchCloudData);

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
            if (cloud.purifierProducts) setPurifierProducts(cloud.purifierProducts);
            if (cloud.autoReminderConfig) setAutoReminderConfig(cloud.autoReminderConfig);
            if (cloud.broadcastLogs) setBroadcastLogs(cloud.broadcastLogs);
            if (cloud.business) setBusiness(cloud.business);
            hasLoadedFromCloudRef.current = true;
            setCloudSyncStatus('synced');
            setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchCloudData);
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Save to LocalStorage and Supabase (debounced by 800ms)
  useEffect(() => {
    if (!mounted || !hasLoadedFromCloudRef.current) return;

    const payload = {
      customers,
      purifiers,
      renewals,
      services,
      technicians,
      inventory,
      invoices,
      amcSubscriptions,
      purifierProducts,
      autoReminderConfig,
      broadcastLogs,
      business,
    };


    // In local sandbox, save strictly to local storage and NEVER touch Supabase!
    if (isLocalSandbox()) {
      try {
        localStorage.setItem('ro_local_sandbox_v1', JSON.stringify(payload));
      } catch {}
      setCloudSyncStatus('local_sandbox');
      return; // NEVER touch Supabase!
    }

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
      invoiceNumber: `${business.settings?.invoicePrefix || 'AQ-RO-'}${Math.floor(1000 + Math.random() * 9000)}`,
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

      // Automatically generate Invoice for completed service
      const partsTotal = (recordData.partsUsed || []).reduce((sum, p) => sum + (p.totalPrice || p.quantity * p.unitPrice), 0);
      const grossTotal = recordData.total ?? ((recordData.labourCharge || 0) + partsTotal - (recordData.discount || 0));
      const amountPaid = recordData.amountPaid ?? grossTotal;
      const balance = Math.max(0, grossTotal - amountPaid);
      const paymentStatus: PaymentStatus =
        balance === 0 ? 'Paid' : amountPaid > 0 ? 'Partially paid' : 'Pending';

      const invoiceId = `inv-${Date.now()}`;
      const newInvoice: Invoice = {
        id: invoiceId,
        businessId: business.id || 'biz-client-ro',
        invoiceNumber: `${business.settings?.invoicePrefix || 'AQ-RO-'}${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: recordData.customerId,
        serviceRecordId: newId,
        invoiceDate: recordData.scheduledDate || nowStr,
        dueDate: recordData.scheduledDate || nowStr,
        items: [
          {
            id: 'i-labour',
            description: `${recordData.serviceType} - Labour / Service Charges`,
            quantity: 1,
            unitPrice: recordData.labourCharge || 0,
            amount: recordData.labourCharge || 0,
          },
          ...(recordData.partsUsed || []).map((p, idx) => ({
            id: `i-part-${idx}`,
            description: p.name,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            amount: p.totalPrice || p.quantity * p.unitPrice,
          })),
        ],
        subtotal: (recordData.labourCharge || 0) + partsTotal,
        discount: recordData.discount || 0,
        gstRate: business.settings?.enableGst ? 18 : 0,
        gstAmount: 0,
        total: grossTotal,
        amountPaid: amountPaid,
        balanceDue: balance,
        paymentStatus,
        notes: `Service Code: ${code}`,
      };

      setInvoices((prev) => [newInvoice, ...prev]);
    }

    return newRecord;
  };

  const addPurifierProduct = (productData: Omit<PurifierProduct, 'id' | 'createdAt'>): PurifierProduct => {
    const newProduct: PurifierProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPurifierProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updatePurifierProduct = (id: string, updates: Partial<PurifierProduct>) => {
    setPurifierProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePurifierProduct = (id: string) => {
    setPurifierProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateAutoReminderConfig = (updates: Partial<AutoReminderConfig>) => {
    setAutoReminderConfig((prev) => ({ ...prev, ...updates }));
  };

  const runAutomatedRemindersNow = () => {
    let sentCount = 0;
    let skippedCount = 0;
    const logDetails: string[] = [];

    // Check quiet hours
    if (autoReminderConfig.quietHoursEnabled) {
      const now = new Date();
      const currentHoursMinutes = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const { quietHoursStart, quietHoursEnd } = autoReminderConfig;
      const isQuietTime = quietHoursStart > quietHoursEnd
        ? (currentHoursMinutes >= quietHoursStart || currentHoursMinutes < quietHoursEnd)
        : (currentHoursMinutes >= quietHoursStart && currentHoursMinutes <= quietHoursEnd);

      if (isQuietTime) {
        return {
          sent: 0,
          skipped: renewals.length,
          logs: [`Quiet hours active (${quietHoursStart} - ${quietHoursEnd}). Automated dispatch paused.`]
        };
      }
    }

    const newComms: CommunicationLog[] = [];
    const updatedRenewals = renewals.map((rnw) => {
      const cust = customers.find((c) => c.id === rnw.customerId);
      const pur = purifiers.find((p) => p.id === rnw.purifierId);
      if (!cust || cust.whatsappOptOut || rnw.status === 'SCHEDULED' || rnw.status === 'CONVERTED') {
        skippedCount++;
        return rnw;
      }

      // Check if eligible for any enabled stage with exact directional matching
      const matchingStage = autoReminderConfig.stages.find((stg) => {
        if (!stg.enabled) return false;
        if (stg.daysBeforeOrAfter > 0) {
          return rnw.daysRemaining <= stg.daysBeforeOrAfter && rnw.daysRemaining > 0;
        } else if (stg.daysBeforeOrAfter === 0) {
          return rnw.daysRemaining === 0;
        } else {
          // Overdue stages (e.g. -1, -7, -30)
          return rnw.daysRemaining <= stg.daysBeforeOrAfter;
        }
      });

      if (!matchingStage) {
        skippedCount++;
        return rnw;
      }

      // Prevent duplicate reminder within 48 hours
      if (rnw.lastReminderDate) {
        const lastSent = new Date(rnw.lastReminderDate).getTime();
        const hoursAgo = (Date.now() - lastSent) / (1000 * 60 * 60);
        if (hoursAgo < 48) {
          skippedCount++;
          return rnw;
        }
      }

      sentCount++;
      const messageBody = `Hi ${cust.fullName}, reminder from ${business.name}: Your ${pur?.brand || 'RO'} service is due on ${rnw.nextDueDate}. Reply YES to book a slot.`;
      
      newComms.push({
        id: `comm-auto-${Date.now()}-${sentCount}`,
        businessId: business.id,
        customerId: cust.id,
        channel: 'WhatsApp',
        templateKey: matchingStage.templateKey,
        language: selectedLanguage,
        messageText: messageBody,
        status: 'Sent',
        sentAt: new Date().toISOString(),
        responseReceived: false,
      });

      logDetails.push(`Auto-reminder sent to ${cust.fullName} (${cust.mobileNumber}) - ${matchingStage.label}`);

      return {
        ...rnw,
        remindersSentCount: (rnw.remindersSentCount || 0) + 1,
        lastReminderDate: new Date().toISOString(),
        followUpStage: 'Reminder sent' as RenewalStage,
      };
    });

    if (newComms.length > 0) {
      setCommunications((prev) => [...newComms, ...prev]);
      setRenewals(updatedRenewals);
      setAutoReminderConfig((prev) => ({
        ...prev,
        lastAutoRun: new Date().toISOString(),
        autoSentCount: (prev.autoSentCount || 0) + sentCount,
      }));
    }

    return {
      sent: sentCount,
      skipped: skippedCount,
      logs: logDetails.length > 0 ? logDetails : ['All customers are up-to-date or already reminded recently.'],
    };
  };

  const broadcastToAllCustomers = async (manualText: string, targetFilter: string, media?: { url: string; type: 'image' | 'video' }) => {
    let targets = [...customers];
    if (targetFilter === 'overdue') {
      const overdueCustIds = new Set(renewals.filter((r) => r.daysRemaining <= 0).map((r) => r.customerId));
      targets = targets.filter((c) => overdueCustIds.has(c.id));
    } else if (targetFilter === 'due_soon') {
      const dueCustIds = new Set(renewals.filter((r) => r.daysRemaining > 0 && r.daysRemaining <= 15).map((r) => r.customerId));
      targets = targets.filter((c) => dueCustIds.has(c.id));
    } else if (targetFilter === 'amc_active') {
      const amcCustIds = new Set(amcSubscriptions.filter((s) => s.status === 'Active').map((s) => s.customerId));
      targets = targets.filter((c) => amcCustIds.has(c.id));
    }

    targets = targets.filter((c) => !c.whatsappOptOut && c.mobileNumber);

    const newComms: CommunicationLog[] = [];
    const logs: string[] = [];

    targets.forEach((cust, index) => {
      const pur = purifiers.find((p) => p.customerId === cust.id);
      const rnw = renewals.find((r) => r.customerId === cust.id);

      const personalized = manualText
        .replace(/\{\{customerName\}\}/g, cust.fullName)
        .replace(/\{\{businessName\}\}/g, business.name)
        .replace(/\{\{phone\}\}/g, cust.mobileNumber)
        .replace(/\{\{purifierBrand\}\}/g, pur?.brand || 'RO Purifier')
        .replace(/\{\{dueDate\}\}/g, rnw?.nextDueDate || 'upcoming');

      newComms.push({
        id: `comm-bc-${Date.now()}-${index}`,
        businessId: business.id,
        customerId: cust.id,
        channel: 'WhatsApp',
        templateKey: 'CUSTOM_BROADCAST',
        language: selectedLanguage,
        messageText: personalized,
        status: 'Sent',
        sentAt: new Date().toISOString(),
        responseReceived: false,
        mediaUrl: media?.url,
        mediaType: media?.type,
      });

      logs.push(`Message queued for ${cust.fullName} (+91 ${cust.mobileNumber})${media ? ` with attached ${media.type}` : ''}`);
    });

    const newBroadcastLog: BroadcastLog = {
      id: `bc-log-${Date.now()}`,
      messageText: manualText,
      targetAudience: targetFilter,
      recipientCount: targets.length,
      status: 'Completed',
      sentAt: new Date().toISOString(),
      mediaUrl: media?.url,
      mediaType: media?.type,
    };

    setCommunications((prev) => [...newComms, ...prev]);
    setBroadcastLogs((prev) => [newBroadcastLog, ...prev]);

    return {
      sent: targets.length,
      logs,
    };
  };


  const resetDemoData = () => {
    if (isLocalSandbox()) {
      try {
        localStorage.removeItem('ro_local_sandbox_v1');
      } catch {}
      setBusiness(DEMO_BUSINESS);
      setCustomers(DEMO_CUSTOMERS);
      setPurifiers(DEMO_PURIFIERS);
      setRenewals(DEMO_RENEWALS);
      setServices(DEMO_SERVICES);
      setTechnicians(DEMO_TECHNICIANS);
      setInvoices(DEMO_INVOICES);
      setPurifierProducts(DEMO_PURIFIER_PRODUCTS);
      setAutoReminderConfig(INITIAL_AUTO_REMINDER_CONFIG);
      setBroadcastLogs([]);
      return;
    }

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
    setPurifierProducts(INITIAL_PURIFIER_PRODUCTS);
    setAutoReminderConfig(INITIAL_AUTO_REMINDER_CONFIG);
    setBroadcastLogs([]);
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
        purifierProducts,
        autoReminderConfig,
        broadcastLogs,
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
        addPurifierProduct,
        updatePurifierProduct,
        deletePurifierProduct,
        updateAutoReminderConfig,
        runAutomatedRemindersNow,
        broadcastToAllCustomers,
        resetDemoData,
        syncWithCloud,
        lastCloudSyncTime,
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
