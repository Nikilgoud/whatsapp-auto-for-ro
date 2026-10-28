-- =========================================================================
-- RO SERVICE RENEWAL ENGINE - PRODUCTION RELATIONAL SCHEMA (PHASE 1)
-- Migration: 20261028_01_normalized_schema.sql
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESSES (Multi-Tenant Root)
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT,
  tagline TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  logo_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PROFILES (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'TECHNICIAN')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  alternate_mobile TEXT,
  whatsapp_number TEXT,
  email TEXT,
  house_flat_no TEXT,
  building_name TEXT,
  street_address TEXT,
  area_locality TEXT,
  city TEXT DEFAULT 'Hyderabad',
  state TEXT DEFAULT 'Telangana',
  pincode TEXT,
  landmark TEXT,
  google_maps_url TEXT,
  customer_type TEXT NOT NULL DEFAULT 'Residential',
  status TEXT NOT NULL DEFAULT 'Active customer',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  whatsapp_opt_out BOOLEAN NOT NULL DEFAULT false,
  total_spend NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PURIFIERS (Installed equipment belonging to customers)
CREATE TABLE IF NOT EXISTS public.purifiers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  purifier_code TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  purifier_type TEXT NOT NULL DEFAULT 'RO+UV',
  capacity_lph NUMERIC(6,2) DEFAULT 15.00,
  serial_number TEXT,
  installation_date DATE NOT NULL,
  purchase_date DATE,
  warranty_start DATE,
  warranty_expiry DATE,
  spare_parts_warranty_expiry DATE,
  spare_parts_warranty_notes TEXT,
  installation_location TEXT DEFAULT 'Kitchen',
  current_condition TEXT NOT NULL DEFAULT 'Good',
  inlet_tds_baseline INTEGER,
  output_tds_baseline INTEGER,
  last_service_date DATE,
  next_service_due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PURIFIER COMPONENTS (Filtration cartridges & health)
CREATE TABLE IF NOT EXISTS public.purifier_components (
  id TEXT PRIMARY KEY,
  purifier_id TEXT NOT NULL REFERENCES public.purifiers(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  installed_date DATE NOT NULL,
  expected_life_months INTEGER NOT NULL DEFAULT 3,
  next_replacement_date DATE NOT NULL,
  cost NUMERIC(10,2) DEFAULT 0.00,
  selling_price NUMERIC(10,2) DEFAULT 0.00,
  warranty_months INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AMC PLANS (Contract Definitions)
CREATE TABLE IF NOT EXISTS public.amc_plans (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER NOT NULL DEFAULT 12,
  annual_visits INTEGER NOT NULL DEFAULT 3,
  is_membrane_covered BOOLEAN NOT NULL DEFAULT false,
  is_filters_covered BOOLEAN NOT NULL DEFAULT true,
  is_electrical_covered BOOLEAN NOT NULL DEFAULT false,
  is_labour_covered BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AMC SUBSCRIPTIONS (Customer Contracts)
CREATE TABLE IF NOT EXISTS public.amc_subscriptions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subscription_code TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  purifier_id TEXT NOT NULL REFERENCES public.purifiers(id) ON DELETE CASCADE,
  amc_plan_id TEXT NOT NULL REFERENCES public.amc_plans(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  visits_total INTEGER NOT NULL DEFAULT 3,
  visits_completed INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TECHNICIANS (Field Service Team)
CREATE TABLE IF NOT EXISTS public.technicians (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  service_areas TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Available',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  pending_jobs INTEGER NOT NULL DEFAULT 0,
  revenue_generated NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  current_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SERVICES & JOBS (Work Orders)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_code TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  purifier_id TEXT NOT NULL REFERENCES public.purifiers(id) ON DELETE CASCADE,
  technician_id TEXT REFERENCES public.technicians(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL DEFAULT 'General service',
  booking_date DATE NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time_slot TEXT NOT NULL DEFAULT '10:00 - 13:00',
  started_time TIMESTAMPTZ,
  completed_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Requested',
  issue_description TEXT,
  technician_notes TEXT,
  work_summary TEXT,
  inlet_water_tds INTEGER,
  output_water_tds INTEGER,
  parts_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  labour_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_pending NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  payment_method TEXT,
  customer_rating INTEGER,
  customer_signature TEXT,
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INVENTORY ITEMS (Spare Parts & Consumables)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  supplier TEXT,
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 5,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'pcs',
  is_low_stock BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('PURCHASE', 'USAGE', 'RETURN', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. SERVICE PARTS USED
CREATE TABLE IF NOT EXISTS public.service_parts (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  inventory_item_id TEXT REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. INVOICES & BILLING
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_record_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- 15. RENEWALS PIPELINE (Follow-up Tracking)
CREATE TABLE IF NOT EXISTS public.renewals (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  purifier_id TEXT NOT NULL REFERENCES public.purifiers(id) ON DELETE CASCADE,
  amc_subscription_id TEXT REFERENCES public.amc_subscriptions(id) ON DELETE SET NULL,
  renewal_type TEXT NOT NULL DEFAULT 'REGULAR_SERVICE',
  last_service_date DATE,
  next_due_date DATE NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'GREEN',
  days_remaining INTEGER NOT NULL DEFAULT 30,
  service_type TEXT NOT NULL DEFAULT 'General service',
  estimated_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  assigned_technician_id TEXT REFERENCES public.technicians(id) ON DELETE SET NULL,
  follow_up_stage TEXT NOT NULL DEFAULT 'Not due',
  status TEXT NOT NULL DEFAULT 'PENDING',
  reminders_sent_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. PURIFIER PRODUCTS (WhatsApp Commerce Catalog)
CREATE TABLE IF NOT EXISTS public.purifier_products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  purifier_type TEXT NOT NULL DEFAULT 'RO+UV',
  capacity_lph NUMERIC(6,2) NOT NULL DEFAULT 15.00,
  storage_liters NUMERIC(6,2) NOT NULL DEFAULT 8.00,
  stages_count INTEGER NOT NULL DEFAULT 6,
  mrp NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  warranty_months INTEGER NOT NULL DEFAULT 12,
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  brochure_url TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. WHATSAPP TEMPLATES (Meta Approved Templates Definition)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  meta_template_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'UTILITY',
  languages JSONB NOT NULL DEFAULT '{}'::jsonb,
  variables TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'APPROVED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. MESSAGE JOBS (Durable Queue with Concurrency & Retry Control)
CREATE TABLE IF NOT EXISTS public.message_jobs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL,
  template_id TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED')) DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  provider_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. COMMUNICATION LOGS (Complete WhatsApp Audit Trail)
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WhatsApp',
  template_key TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  message_text TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('OUTBOUND', 'INBOUND')) DEFAULT 'OUTBOUND',
  status TEXT NOT NULL DEFAULT 'QUEUED',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  provider_message_id TEXT,
  response_received BOOLEAN NOT NULL DEFAULT false,
  response_text TEXT,
  media_url TEXT,
  media_type TEXT,
  error_details TEXT,
  campaign_id TEXT,
  automation_run_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. BROADCAST CAMPAIGNS & RECIPIENTS
CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message_text TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  queued_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  media_url TEXT,
  media_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')) DEFAULT 'QUEUED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_job_id TEXT REFERENCES public.message_jobs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. AUTOMATION CONFIG & EXECUTION RUNS
CREATE TABLE IF NOT EXISTS public.automation_configs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TEXT NOT NULL DEFAULT '19:30',
  quiet_hours_end TEXT NOT NULL DEFAULT '09:00',
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_run_at TIMESTAMPTZ,
  total_auto_sent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'RUNNING',
  customers_evaluated INTEGER NOT NULL DEFAULT 0,
  eligible_count INTEGER NOT NULL DEFAULT 0,
  jobs_created INTEGER NOT NULL DEFAULT 0,
  jobs_skipped INTEGER NOT NULL DEFAULT 0,
  errors TEXT[] DEFAULT '{}'
);

-- 22. CUSTOMER OPT OUTS (WhatsApp STOP Compliance)
CREATE TABLE IF NOT EXISTS public.customer_opt_outs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  reason TEXT,
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_business_opt_out UNIQUE (business_id, phone_number)
);

-- 23. AUDIT LOGS (Immutable Security Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- INDEXES FOR SUB-MILLISECOND SCALE (PHASE 1 REQUIREMENT)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_customers_biz ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(business_id, mobile_number);
CREATE INDEX IF NOT EXISTS idx_purifiers_biz ON public.purifiers(business_id);
CREATE INDEX IF NOT EXISTS idx_purifiers_cust ON public.purifiers(customer_id);
CREATE INDEX IF NOT EXISTS idx_purifiers_due ON public.purifiers(business_id, next_service_due_date);
CREATE INDEX IF NOT EXISTS idx_renewals_biz ON public.renewals(business_id);
CREATE INDEX IF NOT EXISTS idx_renewals_due ON public.renewals(business_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_renewals_status ON public.renewals(business_id, status);
CREATE INDEX IF NOT EXISTS idx_services_biz ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_sched ON public.services(business_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_services_tech ON public.services(technician_id);
CREATE INDEX IF NOT EXISTS idx_invoices_biz ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cust ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_message_jobs_queue ON public.message_jobs(status, scheduled_at) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX IF NOT EXISTS idx_message_jobs_idempotency ON public.message_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_communication_logs_biz ON public.communication_logs(business_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_provider ON public.communication_logs(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_biz ON public.audit_logs(business_id, created_at DESC);
