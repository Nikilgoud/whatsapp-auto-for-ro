-- =========================================================================
-- RO SERVICE RENEWAL ENGINE - DATA MIGRATION (PHASE 43)
-- Migration: 20261028_03_migrate_existing_data.sql
-- Safely migrates existing JSON state from ro_app_state into normalized tables
-- =========================================================================

DO $$
DECLARE
  v_state JSONB;
  v_biz JSONB;
  v_biz_id TEXT;
  v_item JSONB;
BEGIN
  -- 1. Check if legacy state exists
  SELECT data INTO v_state FROM public.ro_app_state WHERE id = 'primary_business';
  
  IF v_state IS NOT NULL THEN
    v_biz := v_state->'business';
    v_biz_id := COALESCE(v_biz->>'id', 'biz-client-ro');

    -- Insert or update Business
    INSERT INTO public.businesses (
      id, name, owner_name, tagline, phone, whatsapp_number, email, address, city, state, pincode, gstin, settings, updated_at
    ) VALUES (
      v_biz_id,
      COALESCE(v_biz->>'name', 'niki Aquapure RO Solutions'),
      COALESCE(v_biz->>'ownerName', 'Niki'),
      COALESCE(v_biz->>'tagline', 'Never miss a service. Never lose a customer.'),
      COALESCE(v_biz->>'phone', '+91 98490 12345'),
      COALESCE(v_biz->>'whatsappNumber', '919849012345'),
      COALESCE(v_biz->>'email', 'service@aquapurero.in'),
      COALESCE(v_biz->>'address', 'Plot 42, Hitech City Main Rd, Madhapur'),
      COALESCE(v_biz->>'city', 'Hyderabad'),
      COALESCE(v_biz->>'state', 'Telangana'),
      COALESCE(v_biz->>'pincode', '500081'),
      v_biz->>'gstin',
      COALESCE(v_biz->'settings', '{}'::jsonb),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      owner_name = EXCLUDED.owner_name,
      settings = EXCLUDED.settings,
      updated_at = NOW();

    -- Migrate Customers
    IF v_state->'customers' IS NOT NULL THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_state->'customers') LOOP
        INSERT INTO public.customers (
          id, business_id, customer_code, full_name, mobile_number, alternate_mobile, whatsapp_number, email,
          house_flat_no, street_address, area_locality, city, state, pincode, landmark, customer_type, status,
          tags, notes, whatsapp_opt_out, total_spend, pending_balance, created_at, updated_at
        ) VALUES (
          v_item->>'id',
          v_biz_id,
          COALESCE(v_item->>'customerCode', 'CUST-' || SUBSTRING(v_item->>'id' FROM 6)),
          COALESCE(v_item->>'fullName', 'Valued Customer'),
          COALESCE(v_item->>'mobileNumber', '9849012345'),
          v_item->>'alternateMobile',
          COALESCE(v_item->>'whatsappNumber', v_item->>'mobileNumber', '9849012345'),
          v_item->>'email',
          COALESCE(v_item->>'houseFlatNo', ''),
          COALESCE(v_item->>'streetAddress', ''),
          COALESCE(v_item->>'areaLocality', 'Madhapur'),
          COALESCE(v_item->>'city', 'Hyderabad'),
          COALESCE(v_item->>'state', 'Telangana'),
          COALESCE(v_item->>'pincode', '500081'),
          v_item->>'landmark',
          COALESCE(v_item->>'customerType', 'Residential'),
          COALESCE(v_item->>'status', 'Active customer'),
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_item->'tags', '[]'::jsonb))),
          v_item->>'notes',
          COALESCE((v_item->>'whatsappOptOut')::boolean, false),
          COALESCE((v_item->>'totalSpend')::numeric, 0.00),
          COALESCE((v_item->>'pendingBalance')::numeric, 0.00),
          COALESCE((v_item->>'createdAt')::timestamptz, NOW()),
          COALESCE((v_item->>'updatedAt')::timestamptz, NOW())
        ) ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    -- Migrate Purifiers
    IF v_state->'purifiers' IS NOT NULL THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_state->'purifiers') LOOP
        INSERT INTO public.purifiers (
          id, business_id, customer_id, purifier_code, brand, model, purifier_type, capacity_lph, serial_number,
          installation_date, purchase_date, warranty_start, warranty_expiry, spare_parts_warranty_expiry,
          spare_parts_warranty_notes, installation_location, current_condition, inlet_tds_baseline, output_tds_baseline,
          last_service_date, next_service_due_date, created_at, updated_at
        ) VALUES (
          v_item->>'id',
          v_biz_id,
          v_item->>'customerId',
          COALESCE(v_item->>'purifierCode', 'PUR-' || SUBSTRING(v_item->>'id' FROM 5)),
          COALESCE(v_item->>'brand', 'Kent'),
          COALESCE(v_item->>'model', 'Grand Plus'),
          COALESCE(v_item->>'purifierType', 'RO+UV'),
          COALESCE((v_item->>'capacityLph')::numeric, 15.00),
          v_item->>'serialNumber',
          COALESCE((v_item->>'installationDate')::date, CURRENT_DATE),
          (v_item->>'purchaseDate')::date,
          (v_item->>'warrantyStart')::date,
          (v_item->>'warrantyExpiry')::date,
          (v_item->>'sparePartsWarrantyExpiry')::date,
          v_item->>'sparePartsWarrantyNotes',
          COALESCE(v_item->>'installationLocation', 'Kitchen'),
          COALESCE(v_item->>'currentCondition', 'Good'),
          (v_item->>'inletTdsBaseline')::integer,
          (v_item->>'outputTdsBaseline')::integer,
          (v_item->>'lastServiceDate')::date,
          COALESCE((v_item->>'nextServiceDueDate')::date, CURRENT_DATE + INTERVAL '90 days'),
          NOW(),
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    -- Migrate Technicians
    IF v_state->'technicians' IS NOT NULL THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_state->'technicians') LOOP
        INSERT INTO public.technicians (
          id, business_id, name, phone, whatsapp_number, email, service_areas, skills, status,
          joining_date, completed_jobs, pending_jobs, revenue_generated, rating, current_location
        ) VALUES (
          v_item->>'id',
          v_biz_id,
          COALESCE(v_item->>'name', 'Technician'),
          COALESCE(v_item->>'phone', '9849012345'),
          COALESCE(v_item->>'whatsappNumber', '919849012345'),
          v_item->>'email',
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_item->'serviceAreas', '[]'::jsonb))),
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_item->'skills', '[]'::jsonb))),
          COALESCE(v_item->>'status', 'Available'),
          COALESCE((v_item->>'joiningDate')::date, CURRENT_DATE),
          COALESCE((v_item->>'completedJobs')::integer, 0),
          COALESCE((v_item->>'pendingJobs')::integer, 0),
          COALESCE((v_item->>'revenueGenerated')::numeric, 0.00),
          COALESCE((v_item->>'rating')::numeric, 5.00),
          v_item->>'currentLocation'
        ) ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    -- Migrate Renewals
    IF v_state->'renewals' IS NOT NULL THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_state->'renewals') LOOP
        INSERT INTO public.renewals (
          id, business_id, customer_id, purifier_id, amc_subscription_id, renewal_type, last_service_date,
          next_due_date, urgency, days_remaining, service_type, estimated_value, assigned_technician_id,
          follow_up_stage, status, reminders_sent_count, last_reminder_date, notes
        ) VALUES (
          v_item->>'id',
          v_biz_id,
          v_item->>'customerId',
          v_item->>'purifierId',
          v_item->>'amcSubscriptionId',
          COALESCE(v_item->>'renewalType', 'REGULAR_SERVICE'),
          (v_item->>'lastServiceDate')::date,
          COALESCE((v_item->>'nextDueDate')::date, CURRENT_DATE + INTERVAL '30 days'),
          COALESCE(v_item->>'urgency', 'GREEN'),
          COALESCE((v_item->>'daysRemaining')::integer, 30),
          COALESCE(v_item->>'serviceType', 'General service'),
          COALESCE((v_item->>'estimatedValue')::numeric, 0.00),
          v_item->>'assignedTechnicianId',
          COALESCE(v_item->>'followUpStage', 'Upcoming'),
          COALESCE(v_item->>'status', 'PENDING'),
          COALESCE((v_item->>'remindersSentCount')::integer, 0),
          (v_item->>'lastReminderDate')::timestamptz,
          v_item->>'notes'
        ) ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    -- Migrate Purifier Products Catalog
    IF v_state->'purifierProducts' IS NOT NULL THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_state->'purifierProducts') LOOP
        INSERT INTO public.purifier_products (
          id, business_id, brand, model, purifier_type, capacity_lph, storage_liters, stages_count,
          mrp, selling_price, warranty_months, features, image_url, brochure_url, in_stock
        ) VALUES (
          v_item->>'id',
          v_biz_id,
          COALESCE(v_item->>'brand', 'Kent'),
          COALESCE(v_item->>'model', 'Grand Plus'),
          COALESCE(v_item->>'purifierType', 'RO+UV'),
          COALESCE((v_item->>'capacityLph')::numeric, 15.00),
          COALESCE((v_item->>'storageLiters')::numeric, 8.00),
          COALESCE((v_item->>'stagesCount')::integer, 6),
          COALESCE((v_item->>'mrp')::numeric, 0.00),
          COALESCE((v_item->>'sellingPrice')::numeric, 0.00),
          COALESCE((v_item->>'warrantyMonths')::integer, 12),
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_item->'features', '[]'::jsonb))),
          v_item->>'imageUrl',
          v_item->>'brochureUrl',
          COALESCE((v_item->>'inStock')::boolean, true)
        ) ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    -- Migrate Automation Config
    IF v_state->'autoReminderConfig' IS NOT NULL THEN
      v_item := v_state->'autoReminderConfig';
      INSERT INTO public.automation_configs (
        id, business_id, enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, stages, total_auto_sent, updated_at
      ) VALUES (
        'cfg-' || v_biz_id,
        v_biz_id,
        COALESCE((v_item->>'enabled')::boolean, true),
        COALESCE((v_item->>'quietHoursEnabled')::boolean, true),
        COALESCE(v_item->>'quietHoursStart', '19:30'),
        COALESCE(v_item->>'quietHoursEnd', '09:00'),
        COALESCE(v_item->'stages', '[]'::jsonb),
        COALESCE((v_item->>'autoSentCount')::integer, 0),
        NOW()
      ) ON CONFLICT (business_id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        stages = EXCLUDED.stages,
        updated_at = NOW();
    END IF;

  END IF;
END $$;
