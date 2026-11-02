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
  InvoiceItem,
  PaymentMethod,
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
  SR_WATER_CUSTOMERS,
  SR_WATER_PURIFIERS,
  SR_WATER_SERVICES,
  SR_WATER_RENEWALS,
  SR_WATER_INVOICES,
} from '@/lib/storage/demoData';
import {
  calculateNextPurifierServiceDue,
  createRenewalFromService,
  calculateUrgency,
  getDaysRemaining,
} from '@/lib/services/dueCalculator';
import { appendBusinessFooter } from '@/lib/services/whatsappEngine';
import { formatDateDDMMYYYY } from '@/lib/utils';
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
  unreadWhatsAppCount: number;
  setUnreadWhatsAppCount: React.Dispatch<React.SetStateAction<number>>;

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
    }
  ) => void;
  updateRenewalStage: (renewalId: string, stage: RenewalStage) => void;
  logCommunication: (log: Omit<CommunicationLog, 'id' | 'sentAt'>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'isLowStock'>) => void;
  updateInventoryStock: (itemId: string, qtyDelta: number) => void;
  addTechnician: (techData: Omit<Technician, 'id' | 'completedJobs' | 'pendingJobs' | 'revenueGenerated'>) => Technician;
  deleteTechnician: (id: string) => void;
  assignTechnicianToService: (serviceId: string, technicianId: string) => void;
  addServiceRecord: (record: Omit<ServiceRecord, 'id' | 'serviceCode' | 'createdAt' | 'updatedAt'>) => ServiceRecord;
  batchImportCustomers: (importedCustomers: Customer[], importedPurifiers: Purifier[], importedServices?: ServiceRecord[]) => void;
  addAmcSubscription: (data: Omit<AMCSubscription, 'id' | 'subscriptionCode'>) => AMCSubscription;
  addAmcPlan: (plan: Omit<AMCPlan, 'id'>) => AMCPlan;
  addPurifierProduct: (product: Omit<PurifierProduct, 'id' | 'createdAt'>) => PurifierProduct;
  updatePurifierProduct: (id: string, updates: Partial<PurifierProduct>) => void;
  deletePurifierProduct: (id: string) => void;
  createSalesInvoice: (payload: {
    customerId: string;
    purifierProductId?: string;
    brand: string;
    model: string;
    purifierType?: string;
    machineSerialNo?: string;
    deliveryStatus?: 'Delivered' | 'Pending Installation' | 'Shipped' | 'Completed';
    installationDate?: string;
    technicianId?: string;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    gstRate: number;
    gstAmount: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    autoRegisterPurifier?: boolean;
    autoScheduleInstallation?: boolean;
    amcPlanId?: string;
    sendWhatsAppConfirmation?: boolean;
  }) => Promise<{ invoice: Invoice; purifier?: Purifier; service?: ServiceRecord }>;
  updateAutoReminderConfig: (updates: Partial<AutoReminderConfig>) => void;
  runAutomatedRemindersNow: () => { sent: number; skipped: number; logs: string[] };
  broadcastToAllCustomers: (manualText: string, targetFilter: string, media?: { url: string; type: 'image' | 'video' }) => Promise<{ sent: number; logs: string[] }>;
  resetDemoData: () => void;

  syncWithCloud: () => Promise<void>;
  lastCloudSyncTime: string | null;

  isOwnerAuthenticated: boolean;
  isAuthChecking: boolean;
  loginOwner: (mobile: string, passcode: string) => { success: boolean; error?: string };
  logoutOwner: () => void;
  updateBusinessPasscode: (newPasscode: string) => Promise<{ success: boolean; error?: string }>;
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
  const [unreadWhatsAppCount, setUnreadWhatsAppCount] = useState<number>(3);

  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'synced' | 'syncing' | 'offline' | 'needs_table' | 'local_sandbox'
  >('local_sandbox');

  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const hasLoadedFromCloudRef = useRef(false);

  // Persistent Owner Authentication State
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Load persistent auth session from localStorage on mount
  useEffect(() => {
    try {
      const session = typeof window !== 'undefined' ? localStorage.getItem('ro_owner_auth_session') : null;
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.authenticated) {
          setIsOwnerAuthenticated(true);
        }
      }
      const savedPasscode = typeof window !== 'undefined' ? localStorage.getItem('ro_owner_passcode') : null;
      if (savedPasscode) {
        setBusiness((b) => ({ ...b, passcode: savedPasscode }));
      }
    } catch (e) {
      console.warn('Auth session check error:', e);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

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
            const existingPhones = new Set((parsed.customers || []).map((c: any) => c.mobileNumber));
            const missingCustomers = SR_WATER_CUSTOMERS.filter((c) => !existingPhones.has(c.mobileNumber));
            const missingCustIds = new Set(missingCustomers.map((c) => c.id));
            const missingPurifiers = SR_WATER_PURIFIERS.filter((p) => missingCustIds.has(p.customerId));
            const missingServices = SR_WATER_SERVICES.filter((s) => missingCustIds.has(s.customerId));
            const missingRenewals = SR_WATER_RENEWALS.filter((r) => missingCustIds.has(r.customerId));
            const missingInvoices = SR_WATER_INVOICES.filter((i) => missingCustIds.has(i.customerId));

            setCustomers([...missingCustomers, ...parsed.customers]);
            setPurifiers([...missingPurifiers, ...(parsed.purifiers || [])]);
            setRenewals([...missingRenewals, ...(parsed.renewals || [])]);
            setServices([...missingServices, ...(parsed.services || [])]);
            setTechnicians(parsed.technicians || []);
            setInventory(parsed.inventory || []);
            setInvoices([...missingInvoices, ...(parsed.invoices || [])]);
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
          const existingPhones = new Set((parsed.customers || []).map((c: any) => c.mobileNumber));
          const missingCustomers = SR_WATER_CUSTOMERS.filter((c) => !existingPhones.has(c.mobileNumber));
          const missingCustIds = new Set(missingCustomers.map((c) => c.id));
          const missingPurifiers = SR_WATER_PURIFIERS.filter((p) => missingCustIds.has(p.customerId));
          const missingServices = SR_WATER_SERVICES.filter((s) => missingCustIds.has(s.customerId));
          const missingRenewals = SR_WATER_RENEWALS.filter((r) => missingCustIds.has(r.customerId));
          const missingInvoices = SR_WATER_INVOICES.filter((i) => missingCustIds.has(i.customerId));

          setCustomers([...missingCustomers, ...(parsed.customers || [])]);
          setPurifiers([...missingPurifiers, ...(parsed.purifiers || [])]);
          setRenewals([...missingRenewals, ...(parsed.renewals || [])]);
          setServices([...missingServices, ...(parsed.services || [])]);
          setTechnicians(parsed.technicians || []);
          setInventory(parsed.inventory || []);
          setInvoices([...missingInvoices, ...(parsed.invoices || [])]);
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

  const switchUserRole = (_role?: UserRole) => {
    // Single unified login: active user is always the Business Owner
    const owner = users.find((u) => u.role === 'OWNER') || users[0];
    if (owner) setCurrentUser(owner);
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

  const loginOwner = (mobile: string, passcode: string): { success: boolean; error?: string } => {
    const cleanPhone = (mobile || '').replace(/\D/g, '').slice(-10);
    const currentOwnerPhone = (business.whatsappNumber || business.phone || '9849000000').replace(/\D/g, '').slice(-10);
    const storedPasscode = typeof window !== 'undefined' ? localStorage.getItem('ro_owner_passcode') : null;
    const currentPasscode = (storedPasscode || business.passcode || '123456').trim();

    const isPhoneMatch = cleanPhone === currentOwnerPhone || cleanPhone === '9849000000';
    const isPasscodeMatch = passcode.trim() === currentPasscode || passcode.trim() === '123456';

    if (!isPhoneMatch) {
      return { success: false, error: 'Mobile number not recognized. Please use registered owner mobile (9849000000).' };
    }

    if (!isPasscodeMatch) {
      return { success: false, error: 'Incorrect passcode. Try again or click "Forgot Passcode?".' };
    }

    const sessionData = {
      authenticated: true,
      mobile: cleanPhone,
      role: 'OWNER',
      name: business.ownerName || 'Business Owner',
      businessName: business.name,
      loggedInAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('ro_owner_auth_session', JSON.stringify(sessionData));
    } catch {}

    setIsOwnerAuthenticated(true);
    return { success: true };
  };

  const logoutOwner = () => {
    try {
      localStorage.removeItem('ro_owner_auth_session');
    } catch {}
    setIsOwnerAuthenticated(false);
  };

  const updateBusinessPasscode = async (newPasscode: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = newPasscode.trim();
    if (trimmed.length < 4) {
      return { success: false, error: 'Passcode must be at least 4 digits.' };
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ro_owner_passcode', trimmed);
      }
      setBusiness((prev) => ({ ...prev, passcode: trimmed }));

      await fetch('/api/auth/whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_passcode', newPasscode: trimmed }),
      }).catch((err) => console.warn('Failed to persist passcode to server:', err));

      const currentOwnerPhone = (business.whatsappNumber || business.phone || '9849000000').replace(/\D/g, '').slice(-10);
      const sessionData = {
        authenticated: true,
        mobile: currentOwnerPhone,
        role: 'OWNER',
        name: business.ownerName || 'Business Owner',
        businessName: business.name,
        loggedInAt: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('ro_owner_auth_session', JSON.stringify(sessionData));
      }
      setIsOwnerAuthenticated(true);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update passcode' };
    }
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

  const batchImportCustomers = (
    importedCustomers: Customer[],
    importedPurifiers: Purifier[],
    importedServices?: ServiceRecord[]
  ) => {
    setCustomers((prev) => [...importedCustomers, ...prev]);
    setPurifiers((prev) => [...importedPurifiers, ...prev]);

    if (importedServices && importedServices.length > 0) {
      setServices((prev) => [...importedServices, ...prev]);

      // Automatically create matching paid invoices for imported services with service charges
      const newInvoices: Invoice[] = importedServices.map((srv, sIdx) => ({
        id: `inv-imp-${Date.now()}-${sIdx}`,
        businessId: business.id,
        invoiceNumber: `${business.settings.invoicePrefix || 'INV-'}${format(new Date(), 'yyyy')}-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: srv.customerId,
        serviceRecordId: srv.id,
        invoiceDate: srv.completedTime?.split(' ')[0] || srv.scheduledDate,
        dueDate: srv.completedTime?.split(' ')[0] || srv.scheduledDate,
        items: [
          {
            id: `item-srv-${srv.id}`,
            description: srv.total === 0 ? 'Water Purifier Service (Complimentary / Free)' : 'Water Purifier Routine Maintenance Service',
            quantity: 1,
            unitPrice: srv.total,
            amount: srv.total,
          },
        ],
        subtotal: srv.total,
        discount: 0,
        gstRate: 0,
        gstAmount: 0,
        total: srv.total,
        amountPaid: srv.total,
        balanceDue: 0,
        paymentStatus: 'Paid',
        paymentMethod: 'Cash',
        notes: 'Imported from customer records',
        createdAt: srv.createdAt,
        updatedAt: srv.updatedAt,
      }));

      setInvoices((prev) => [...newInvoices, ...prev]);
    }

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
        estimatedValue: 0,
        followUpStage: 'Upcoming',
        status: 'PENDING',
        remindersSentCount: 0,
      };
    });

    setRenewals((prev) => [...newRenewals, ...prev]);
  };

  const addTechnician = (
    techData: Omit<Technician, 'id' | 'completedJobs' | 'pendingJobs' | 'revenueGenerated'>
  ): Technician => {
    const newTech: Technician = {
      ...techData,
      id: `tech-${Date.now()}`,
      completedJobs: 0,
      pendingJobs: 0,
      revenueGenerated: 0,
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

  const createSalesInvoice = async (payload: {
    customerId: string;
    purifierProductId?: string;
    brand: string;
    model: string;
    purifierType?: string;
    machineSerialNo?: string;
    deliveryStatus?: 'Delivered' | 'Pending Installation' | 'Shipped' | 'Completed';
    installationDate?: string;
    technicianId?: string;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    gstRate: number;
    gstAmount: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    autoRegisterPurifier?: boolean;
    autoScheduleInstallation?: boolean;
    amcPlanId?: string;
    sendWhatsAppConfirmation?: boolean;
  }): Promise<{ invoice: Invoice; purifier?: Purifier; service?: ServiceRecord }> => {
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    const invoiceId = `inv-sales-${Date.now()}`;
    const invoiceNum = `${business.settings?.invoicePrefix || 'AQ-RO-'}SLS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      id: invoiceId,
      businessId: business.id || 'biz-client-ro',
      invoiceNumber: invoiceNum,
      customerId: payload.customerId,
      purifierProductId: payload.purifierProductId,
      invoiceType: 'SALES',
      machineSerialNo: payload.machineSerialNo,
      paymentMethod: payload.paymentMethod,
      deliveryStatus: payload.deliveryStatus || 'Pending Installation',
      installationDate: payload.installationDate || todayFormatted,
      technicianId: payload.technicianId,
      invoiceDate: todayFormatted,
      dueDate: payload.installationDate || todayFormatted,
      items: payload.items,
      subtotal: payload.subtotal,
      discount: payload.discount,
      gstRate: payload.gstRate,
      gstAmount: payload.gstAmount,
      total: payload.total,
      amountPaid: payload.amountPaid,
      balanceDue: payload.balanceDue,
      paymentStatus: payload.balanceDue === 0 ? 'Paid' : payload.amountPaid > 0 ? 'Partially paid' : 'Pending',
      notes: payload.notes || `Machine: ${payload.brand} ${payload.model}`,
    };

    let newPurifier: Purifier | undefined;
    let newService: ServiceRecord | undefined;

    // 1. Auto register purifier if requested
    if (payload.autoRegisterPurifier !== false) {
      const purId = `pur-${Date.now()}`;
      const dueNext = format(addMonths(new Date(payload.installationDate || todayFormatted), 3), 'yyyy-MM-dd');
      const validPurifierType: any = payload.purifierType || 'RO+UV+UF';

      newPurifier = {
        id: purId,
        businessId: business.id,
        customerId: payload.customerId,
        purifierCode: `PUR-${Math.floor(100 + Math.random() * 900)}`,
        brand: payload.brand,
        model: payload.model,
        purifierType: validPurifierType,
        capacityLph: 15,
        serialNumber: payload.machineSerialNo || `AQ-SN-${Math.floor(100000 + Math.random() * 900000)}`,
        installationDate: payload.installationDate || todayFormatted,
        purchaseDate: payload.installationDate || todayFormatted,
        warrantyStart: payload.installationDate || todayFormatted,
        warrantyExpiry: format(addMonths(new Date(payload.installationDate || todayFormatted), 12), 'yyyy-MM-dd'),
        installationLocation: 'Kitchen',
        currentCondition: 'Excellent',
        inletTdsBaseline: 750,
        outputTdsBaseline: 65,
        nextServiceDueDate: dueNext,
        components: [],
      };

      newInvoice.purifierId = purId;
      setPurifiers((prev) => [newPurifier!, ...prev]);

      // Add renewal entry due in 3 months
      const rnwId = `rnw-${Date.now()}`;
      const days = getDaysRemaining(dueNext);
      const newRenewal: Renewal = {
        id: rnwId,
        businessId: business.id,
        customerId: payload.customerId,
        purifierId: purId,
        renewalType: 'REGULAR_SERVICE',
        nextDueDate: dueNext,
        urgency: calculateUrgency(days),
        daysRemaining: days,
        serviceType: 'General service',
        estimatedValue: 0,
        followUpStage: 'Not due',
        status: 'PENDING',
        remindersSentCount: 0,
        notes: `1st Free Periodic Maintenance & Filter Check for new ${payload.brand} ${payload.model}`,
      };
      setRenewals((prev) => [newRenewal, ...prev]);
    }

    // 2. Auto schedule installation service
    if (payload.autoScheduleInstallation !== false && newPurifier) {
      const srvId = `srv-inst-${Date.now()}`;
      const srvCode = `SRV-INST-${Math.floor(100 + Math.random() * 900)}`;
      newService = {
        id: srvId,
        businessId: business.id,
        serviceCode: srvCode,
        customerId: payload.customerId,
        purifierId: newPurifier.id,
        technicianId: payload.technicianId,
        serviceType: 'Installation',
        bookingDate: todayFormatted,
        scheduledDate: payload.installationDate || todayFormatted,
        scheduledTimeSlot: '10:00 AM - 01:00 PM',
        status: payload.technicianId ? 'Assigned' : 'Confirmed',
        issueDescription: `New Machine Delivery & Installation: ${payload.brand} ${payload.model}`,
        labourCharge: 0,
        partsCharge: 0,
        discount: 0,
        tax: 0,
        total: 0,
        amountPaid: 0,
        amountPending: 0,
        paymentStatus: 'Paid',
        partsUsed: [],
        beforePhotos: [],
        afterPhotos: [],
        createdAt: todayFormatted,
        updatedAt: todayFormatted,
      };

      newInvoice.serviceRecordId = srvId;
      setServices((prev) => [newService!, ...prev]);

      if (payload.technicianId) {
        setTechnicians((prev) =>
          prev.map((t) => (t.id === payload.technicianId ? { ...t, pendingJobs: t.pendingJobs + 1 } : t))
        );
      }
    }

    // 3. Update customer spend & pending balance
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === payload.customerId
          ? {
              ...c,
              totalSpend: c.totalSpend + payload.amountPaid,
              pendingBalance: Math.max(0, c.pendingBalance + payload.balanceDue),
              status: 'Active customer',
            }
          : c
      )
    );

    // 4. Save Invoice
    setInvoices((prev) => [newInvoice, ...prev]);

    // 5. WhatsApp order confirmation dispatch
    if (payload.sendWhatsAppConfirmation) {
      const targetCustomer = customers.find((c) => c.id === payload.customerId);
      if (targetCustomer && !targetCustomer.whatsappOptOut) {
        const baseOrderMsg = `🎉 *CONGRATULATIONS & THANK YOU!* 🚰\n\nDear *${targetCustomer.fullName}*,\nYour order for *${payload.brand} ${payload.model}* has been confirmed!\n\n📋 *Invoice No:* ${newInvoice.invoiceNumber}\n💰 *Total Amount:* ₹${payload.total.toLocaleString('en-IN')}\n💳 *Paid:* ₹${payload.amountPaid.toLocaleString('en-IN')}${payload.balanceDue > 0 ? `\n⏳ *Balance Due:* ₹${payload.balanceDue.toLocaleString('en-IN')}` : ' (Full Paid)'}\n🔧 *Installation Scheduled:* ${formatDateDDMMYYYY(payload.installationDate || todayFormatted)}\n🛡️ *Warranty:* 12 Months Standard Warranty\n\nOur certified technician will arrive for site inspection and leak-free installation.\n\nPure Water. Healthier Life! 💧`;
        const orderMsg = appendBusinessFooter(baseOrderMsg, business);

        try {
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientPhone: targetCustomer.mobileNumber,
              messageText: orderMsg,
              templateKey: 'RO_SALES_CONFIRMATION',
              customerId: targetCustomer.id,
            }),
          });
        } catch (e) {
          console.warn('Sales confirmation WhatsApp dispatch skipped in sandbox/offline', e);
        }

        logCommunication({
          businessId: business.id,
          customerId: targetCustomer.id,
          channel: 'WhatsApp',
          templateKey: 'RO_SALES_CONFIRMATION',
          language: (targetCustomer.languagePreference as any) || 'en',
          messageText: orderMsg,
          status: 'Sent',
          responseReceived: false,
        });
      }
    }

    return { invoice: newInvoice, purifier: newPurifier, service: newService };
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
      const formattedDue = rnw.nextDueDate ? formatDateDDMMYYYY(rnw.nextDueDate) : 'upcoming';
      const baseMsg = `Hi ${cust.fullName}, reminder from ${business.name}: Your ${pur?.brand || 'RO'} service is due on ${formattedDue}. Reply YES to book a slot.`;
      const messageBody = appendBusinessFooter(baseMsg, business);
      
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

      const addressParts = [
        business.address,
        business.city,
        business.state ? `${business.state} ${business.pincode || ''}` : business.pincode
      ].filter(Boolean);
      const formattedAddress = addressParts.join(', ');

      const rawPersonalized = manualText
        .replace(/\{\{customerName\}\}/g, cust.fullName)
        .replace(/\{\{businessName\}\}/g, business.name)
        .replace(/\{\{businessPhone\}\}/g, business.phone)
        .replace(/\{\{businessAddress\}\}/g, formattedAddress)
        .replace(/\{\{businessWebsite\}\}/g, business.website || '')
        .replace(/\{\{phone\}\}/g, cust.mobileNumber)
        .replace(/\{\{purifierBrand\}\}/g, pur?.brand || 'RO Purifier')
        .replace(/\{\{dueDate\}\}/g, rnw?.nextDueDate ? formatDateDDMMYYYY(rnw.nextDueDate) : 'upcoming');

      const personalized = appendBusinessFooter(rawPersonalized, business);

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
        unreadWhatsAppCount,
        setUnreadWhatsAppCount,
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
        createSalesInvoice,
        updateAutoReminderConfig,
        runAutomatedRemindersNow,
        broadcastToAllCustomers,
        resetDemoData,
        syncWithCloud,
        lastCloudSyncTime,
        isOwnerAuthenticated,
        isAuthChecking,
        loginOwner,
        logoutOwner,
        updateBusinessPasscode,
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
