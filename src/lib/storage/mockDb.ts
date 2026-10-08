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
    invoicePrefix: clientConfig.invoicePrefix || 'RO-',
    averageServiceCost: 650,
    averageFilterCost: 1450,
    averageAmcCost: 3500,
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

// Production-ready: All operational data starts clean and empty
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_PURIFIERS: Purifier[] = [];
export const INITIAL_RENEWALS: Renewal[] = [];
export const INITIAL_SERVICES: ServiceRecord[] = [];
export const INITIAL_TECHNICIANS: Technician[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_COMMUNICATIONS: CommunicationLog[] = [];
export const INITIAL_AMC_SUBSCRIPTIONS: AMCSubscription[] = [];
export const INITIAL_AUTOMATIONS: AutomationSequence[] = [];
