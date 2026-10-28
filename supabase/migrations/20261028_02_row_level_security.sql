-- =========================================================================
-- RO SERVICE RENEWAL ENGINE - ROW LEVEL SECURITY (PHASE 2 & PHASE 4)
-- Migration: 20261028_02_row_level_security.sql
-- =========================================================================

-- 1. Helper function: Get current user's business ID
CREATE OR REPLACE FUNCTION public.current_user_business_id()
RETURNS TEXT AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Helper function: Get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. REMOVE INSECURE LEGACY PUBLIC POLICIES
DROP POLICY IF EXISTS "Allow public read and write for ro_app_state" ON public.ro_app_state;

-- Secure ro_app_state for authenticated users only
ALTER TABLE public.ro_app_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ro_app_state_auth_policy" ON public.ro_app_state
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. ENABLE RLS ACROSS ALL NORMALIZED TABLES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purifier_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amc_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amc_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purifier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. BUSINESSES POLICIES
CREATE POLICY "businesses_select" ON public.businesses
  FOR SELECT TO authenticated
  USING (id = public.current_user_business_id());

CREATE POLICY "businesses_update" ON public.businesses
  FOR UPDATE TO authenticated
  USING (id = public.current_user_business_id() AND public.current_user_role() = 'OWNER')
  WITH CHECK (id = public.current_user_business_id() AND public.current_user_role() = 'OWNER');

-- 6. PROFILES POLICIES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (business_id = public.current_user_business_id());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (business_id = public.current_user_business_id() AND public.current_user_role() = 'OWNER'))
  WITH CHECK (id = auth.uid() OR (business_id = public.current_user_business_id() AND public.current_user_role() = 'OWNER'));

-- 7. CUSTOMERS POLICIES
CREATE POLICY "customers_all" ON public.customers
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

-- 8. PURIFIERS POLICIES
CREATE POLICY "purifiers_all" ON public.purifiers
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "purifier_components_all" ON public.purifier_components
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.purifiers p 
    WHERE p.id = purifier_components.purifier_id AND p.business_id = public.current_user_business_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purifiers p 
    WHERE p.id = purifier_components.purifier_id AND p.business_id = public.current_user_business_id()
  ));

-- 9. RENEWALS POLICIES
CREATE POLICY "renewals_all" ON public.renewals
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

-- 10. SERVICES POLICIES
CREATE POLICY "services_all" ON public.services
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "service_parts_all" ON public.service_parts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_parts.service_id AND s.business_id = public.current_user_business_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_parts.service_id AND s.business_id = public.current_user_business_id()
  ));

-- 11. TECHNICIANS POLICIES
CREATE POLICY "technicians_all" ON public.technicians
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

-- 12. INVENTORY POLICIES
CREATE POLICY "inventory_items_all" ON public.inventory_items
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "inventory_transactions_all" ON public.inventory_transactions
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

-- 13. INVOICES POLICIES
CREATE POLICY "invoices_all" ON public.invoices
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "invoice_items_all" ON public.invoice_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices inv 
    WHERE inv.id = invoice_items.invoice_id AND inv.business_id = public.current_user_business_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices inv 
    WHERE inv.id = invoice_items.invoice_id AND inv.business_id = public.current_user_business_id()
  ));

-- 14. AMC PLANS & SUBSCRIPTIONS POLICIES
CREATE POLICY "amc_plans_all" ON public.amc_plans
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "amc_subscriptions_all" ON public.amc_subscriptions
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

-- 15. PRODUCTS & WHATSAPP TEMPLATES POLICIES
CREATE POLICY "purifier_products_all" ON public.purifier_products
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "whatsapp_templates_all" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

-- 16. MESSAGE JOBS & COMMUNICATION LOGS POLICIES
CREATE POLICY "message_jobs_all" ON public.message_jobs
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "communication_logs_all" ON public.communication_logs
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

-- 17. BROADCASTS & AUTOMATIONS POLICIES
CREATE POLICY "broadcast_campaigns_all" ON public.broadcast_campaigns
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "broadcast_recipients_all" ON public.broadcast_recipients
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.broadcast_campaigns bc 
    WHERE bc.id = broadcast_recipients.campaign_id AND bc.business_id = public.current_user_business_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.broadcast_campaigns bc 
    WHERE bc.id = broadcast_recipients.campaign_id AND bc.business_id = public.current_user_business_id()
  ));

CREATE POLICY "automation_configs_all" ON public.automation_configs
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "automation_runs_all" ON public.automation_runs
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "customer_opt_outs_all" ON public.customer_opt_outs
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());

CREATE POLICY "audit_logs_all" ON public.audit_logs
  FOR ALL TO authenticated
  USING (business_id = public.current_user_business_id())
  WITH CHECK (business_id = public.current_user_business_id());
