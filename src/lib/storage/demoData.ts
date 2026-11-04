import {
  Business,
  Customer,
  Purifier,
  Technician,
  ServiceRecord,
  Renewal,
  Invoice,
  PurifierProduct,
} from '@/types';
import { INITIAL_BUSINESS } from './mockDb';

export const DEMO_BUSINESS: Business = INITIAL_BUSINESS;

export const SR_WATER_CUSTOMERS: Customer[] = [];
export const SR_WATER_PURIFIERS: Purifier[] = [];
export const SR_WATER_SERVICES: ServiceRecord[] = [];
export const SR_WATER_RENEWALS: Renewal[] = [];
export const SR_WATER_INVOICES: Invoice[] = [];

export const DEMO_CUSTOMERS: Customer[] = [];
export const DEMO_PURIFIERS: Purifier[] = [];
export const DEMO_RENEWALS: Renewal[] = [];
export const DEMO_TECHNICIANS: Technician[] = [];
export const DEMO_SERVICES: ServiceRecord[] = [];
export const DEMO_INVOICES: Invoice[] = [];
export const DEMO_PURIFIER_PRODUCTS: PurifierProduct[] = [];
