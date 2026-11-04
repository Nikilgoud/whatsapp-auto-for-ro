import {
  Business,
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
  User,
  AutomationSequence,
  PurifierProduct,
  AutoReminderConfig,
  BroadcastLog,
} from '@/types';
import clientConfig from '@/config/businessProfile.json';


export const INITIAL_BUSINESS: Business = {
  id: 'biz-client-ro',
  name: clientConfig.name || 'Aquapure RO Solutions',
  ownerName: clientConfig.ownerName || 'Owner',
  tagline: clientConfig.tagline || 'Never miss a service. Never lose a customer.',
  phone: clientConfig.phone || '+91 98490 12345',
  whatsappNumber: clientConfig.whatsappNumber || '919849012345',
  email: clientConfig.email || 'service@aquapurero.in',
  website: (clientConfig as any).website || 'https://aquapurero.in',
  paymentQrCodeUrl: (clientConfig as any).paymentQrCodeUrl || '',
  signatureUrl: (clientConfig as any).signatureUrl || '',
  passcode: (clientConfig as any).passcode || '123456',
  address: clientConfig.address || 'Hitech City Main Rd, Madhapur',
  city: clientConfig.city || 'Hyderabad',
  state: clientConfig.state || 'Telangana',
  pincode: clientConfig.pincode || '500081',
  settings: {
    defaultServiceIntervalMonths: clientConfig.defaultServiceIntervalMonths || 3,
    sedimentFilterIntervalMonths: 3,
    carbonFilterIntervalMonths: 6,
    membraneIntervalMonths: 18,
    uvLampIntervalMonths: 12,
    workingHoursStart: '09:00',
    workingHoursEnd: '19:30',
    quietHoursEnabled: true,
    currency: 'INR',
    gstin: clientConfig.gstin || '',
    enableGst: false,
    invoicePrefix: clientConfig.invoicePrefix || '',
    averageServiceCost: 0,
    averageFilterCost: 0,
    averageAmcCost: 0,
    serviceCharges: {
      generalService: 0,
      periodicService: 0,
      installation: 0,
      uninstallation: 0,
      filterReplacement: 0,
      membraneReplacement: 0,
      uvReplacement: 0,
      leakageRepair: 0,
      tdsAdjustment: 0,
      emergencyService: 0,
      minimumVisitingFee: 0,
    },
  },
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    businessId: 'biz-client-ro',
    name: clientConfig.ownerName || 'Owner',
    email: clientConfig.email || 'owner@roservice.in',
    role: 'OWNER',
    phone: clientConfig.phone || '9849012345',
    isActive: true,
  },
];

export const INITIAL_AMC_PLANS: AMCPlan[] = [
  {
    id: 'amc-plan-1',
    businessId: 'biz-client-ro',
    name: 'Basic Service Contract',
    description: 'Includes 3 scheduled routine services per year with filter cleaning and water testing.',
    durationMonths: 12,
    annualVisits: 3,
    isMembraneCovered: false,
    isFiltersCovered: false,
    isElectricalCovered: false,
    isLabourCovered: true,
    price: 1999,
  },
  {
    id: 'amc-plan-2',
    businessId: 'biz-client-ro',
    name: 'Comprehensive Maintenance Contract',
    description: 'Complete peace of mind. Covers Spun filter, Pre-Carbon, Post-Carbon replacements and 3 services.',
    durationMonths: 12,
    annualVisits: 3,
    isMembraneCovered: false,
    isFiltersCovered: true,
    isElectricalCovered: true,
    isLabourCovered: true,
    price: 3499,
  },
  {
    id: 'amc-plan-3',
    businessId: 'biz-client-ro',
    name: 'Commercial RO Maintenance Plan',
    description: 'Full coverage for commercial plants including RO Membrane, All Filters, Booster pump and 4 services.',
    durationMonths: 12,
    annualVisits: 4,
    isMembraneCovered: true,
    isFiltersCovered: true,
    isElectricalCovered: true,
    isLabourCovered: true,
    price: 5499,
  },
];

// Production records initialized clean
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_PURIFIERS: Purifier[] = [];
export const INITIAL_RENEWALS: Renewal[] = [];
export const INITIAL_SERVICES: ServiceRecord[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_TECHNICIANS: Technician[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_COMMUNICATIONS: CommunicationLog[] = [];
export const INITIAL_AMC_SUBSCRIPTIONS: AMCSubscription[] = [];
export const INITIAL_AUTOMATIONS: AutomationSequence[] = [];

export const INITIAL_AUTO_REMINDER_CONFIG: AutoReminderConfig = {
  enabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '19:30',
  quietHoursEnd: '09:00',
  stages: [
    { daysBeforeOrAfter: 15, label: '15 Days Before Due Date', templateKey: 'SERVICE_DUE', enabled: true },
    { daysBeforeOrAfter: 3, label: '3 Days Before Due Date', templateKey: 'SERVICE_DUE', enabled: true },
    { daysBeforeOrAfter: 0, label: 'On Due Date', templateKey: 'SERVICE_DUE', enabled: true },
    { daysBeforeOrAfter: -7, label: '7 Days Overdue (Urgent)', templateKey: 'SERVICE_OVERDUE', enabled: true },
    { daysBeforeOrAfter: -30, label: '30 Days Overdue (Critical)', templateKey: 'SERVICE_OVERDUE', enabled: true },
  ],
  autoSentCount: 0,
};

export const INITIAL_BROADCAST_LOGS: BroadcastLog[] = [];

export const INITIAL_PURIFIER_PRODUCTS: PurifierProduct[] = [
  {
    id: 'prod-01',
    businessId: 'biz-client-ro',
    brand: 'Kent',
    model: 'Grand Plus Alkaline RO+UV+UF',
    purifierType: 'RO+UV+UF+Alkaline',
    capacityLph: 20,
    storageLiters: 9,
    stagesCount: 8,
    mrp: 21500,
    sellingPrice: 16999,
    warrantyMonths: 12,
    features: [
      'Zero Water Wastage Technology',
      'Alkaline Mineralizer (pH 8.0 - 8.5)',
      'UV LED Light in Storage Tank',
      'High-grade TDS Controller'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    createdAt: '2026-08-01',
  },
  {
    id: 'prod-02',
    businessId: 'biz-client-ro',
    brand: 'Aquaguard',
    model: 'Aura RO+UV+Active Copper',
    purifierType: 'RO+UV+Copper',
    capacityLph: 15,
    storageLiters: 7,
    stagesCount: 8,
    mrp: 19990,
    sellingPrice: 15499,
    warrantyMonths: 12,
    features: [
      'Active Copper + Zinc Booster Tech',
      'Mineral Guard Technology',
      'Smart LED Indicators',
      'Compact Wall Mount Design'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    createdAt: '2026-08-05',
  },
  {
    id: 'prod-03',
    businessId: 'biz-client-ro',
    brand: 'Havells',
    model: 'Max Alkaline RO+UV',
    purifierType: 'RO+UV+Alkaline',
    capacityLph: 15,
    storageLiters: 8,
    stagesCount: 7,
    mrp: 20990,
    sellingPrice: 15999,
    warrantyMonths: 12,
    features: [
      'Futuristic corner mount design',
      'Revitalizer cartridge restructure water molecules',
      'iProtect purification monitoring',
      'Removable tank for easy cleaning'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    createdAt: '2026-08-10',
  },
  {
    id: 'prod-04',
    businessId: 'biz-client-ro',
    brand: 'Livpure',
    model: 'Glo Alkaline RO+UV+Mineralizer',
    purifierType: 'RO+UV+Mineralizer',
    capacityLph: 12,
    storageLiters: 7,
    stagesCount: 6,
    mrp: 16500,
    sellingPrice: 12499,
    warrantyMonths: 12,
    features: [
      'Budget-friendly Indian household favorite',
      'Advanced 6-stage purification',
      'Mineral health enhancer',
      'Fast flow tap'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'prod-05',
    businessId: 'biz-client-ro',
    brand: 'Aquapure',
    model: 'Commercial 50 LPH RO Plant',
    purifierType: 'Commercial RO',
    capacityLph: 50,
    storageLiters: 50,
    stagesCount: 5,
    mrp: 35000,
    sellingPrice: 28500,
    warrantyMonths: 12,
    features: [
      'High-capacity 50 Litres/Hour output',
      'Heavy-duty Stainless Steel 304 skid frame',
      'Dual 100 GPD high-rejection membranes',
      'Ideal for restaurants, offices & schools'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=500&auto=format&fit=crop&q=60',
    inStock: true,
    createdAt: '2026-08-20',
  },
];

