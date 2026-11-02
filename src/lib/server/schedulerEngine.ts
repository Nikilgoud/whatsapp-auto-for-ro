import crypto from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';
import { enqueueMessageJob } from './messageQueue';

export interface StageDefinition {
  id: string;
  name: string;
  stageType: 'BEFORE_DUE' | 'DUE_TODAY' | 'OVERDUE';
  daysOffset: number; // e.g., 30, 15, 7, 3 (for before), 0 (for due today), -1, -7, -30 (for overdue)
  templateName: string;
}

export const DEFAULT_STAGES: StageDefinition[] = [
  { id: 'stage_before_30', name: '30 Days Before', stageType: 'BEFORE_DUE', daysOffset: 30, templateName: 'ro_service_reminder_30d' },
  { id: 'stage_before_15', name: '15 Days Before', stageType: 'BEFORE_DUE', daysOffset: 15, templateName: 'ro_service_reminder_15d' },
  { id: 'stage_before_7',  name: '7 Days Before',  stageType: 'BEFORE_DUE', daysOffset: 7,  templateName: 'ro_service_reminder_7d' },
  { id: 'stage_before_3',  name: '3 Days Before',  stageType: 'BEFORE_DUE', daysOffset: 3,  templateName: 'ro_service_reminder_3d' },
  { id: 'stage_due_today', name: 'Due Today',      stageType: 'DUE_TODAY',  daysOffset: 0,  templateName: 'ro_service_due_today' },
  { id: 'stage_overdue_1', name: '1 Day Overdue',  stageType: 'OVERDUE',    daysOffset: -1, templateName: 'ro_service_overdue_1d' },
  { id: 'stage_overdue_7', name: '7 Days Overdue', stageType: 'OVERDUE',    daysOffset: -7, templateName: 'ro_service_overdue_7d' },
  { id: 'stage_overdue_30',name: '30 Days Overdue',stageType: 'OVERDUE',    daysOffset: -30,templateName: 'ro_service_overdue_30d' },
];

/**
 * Checks if current time is within safe operational hours (09:00 - 20:00 IST)
 */
export function isWithinOperationalHours(timezone: string = 'Asia/Kolkata'): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const currentHour = parseInt(formatter.format(new Date()), 10);
    return currentHour >= 9 && currentHour < 20;
  } catch {
    const currentHour = new Date().getUTCHours() + 5.5; // Rough fallback IST
    return currentHour >= 9 && currentHour < 20;
  }
}

/**
 * Exact directional stage matcher.
 * Solves the critical bug where daysRemaining <= 0 matched Due Today for all overdue renewals.
 */
export function findMatchingStage(
  daysUntilDue: number,
  stages: StageDefinition[] = DEFAULT_STAGES
): StageDefinition | null {
  for (const stage of stages) {
    if (stage.stageType === 'DUE_TODAY' && daysUntilDue === 0) {
      return stage;
    }
    if (stage.stageType === 'BEFORE_DUE' && daysUntilDue === stage.daysOffset) {
      return stage;
    }
    if (stage.stageType === 'OVERDUE' && daysUntilDue === stage.daysOffset) {
      return stage;
    }
  }
  return null;
}

/**
 * Generates deterministic SHA-256 idempotency key to prevent double messaging
 */
export function generateReminderIdempotencyKey(
  businessId: string,
  customerId: string,
  renewalId: string,
  stageId: string,
  dueDate: string
): string {
  const raw = `${businessId}:${customerId}:${renewalId}:${stageId}:${dueDate}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Core Autonomous Server-Side Scheduler Run
 * Uses the normalized production schema tables (businesses, renewals, customers, purifiers)
 */
export async function runAutonomousReminderEngine(
  businessId?: string,
  forceRun: boolean = false
): Promise<{
  businessProcessed: number;
  renewalsEvaluated: number;
  remindersQueued: number;
  skippedQuietHours: boolean;
}> {
  // 1. Guard against quiet hours unless explicitly forced
  if (!forceRun && !isWithinOperationalHours()) {
    return {
      businessProcessed: 0,
      renewalsEvaluated: 0,
      remindersQueued: 0,
      skippedQuietHours: true,
    };
  }

  // 2. Fetch businesses to process
  // Production schema uses 'phone' not 'business_phone', and 'timezone' column
  let businessQuery = supabaseAdmin.from('businesses').select('id, name, phone, timezone');
  if (businessId) {
    businessQuery = businessQuery.eq('id', businessId);
  }
  const { data: businesses, error: busError } = await businessQuery;

  if (busError || !businesses || businesses.length === 0) {
    return {
      businessProcessed: 0,
      renewalsEvaluated: 0,
      remindersQueued: 0,
      skippedQuietHours: false,
    };
  }

  let totalEvaluated = 0;
  let totalQueued = 0;

  for (const business of businesses) {
    // Fetch active renewals and associated customer info using production schema column names
    // renewals.next_due_date, renewals.estimated_value, customers.full_name, customers.mobile_number, customers.whatsapp_opt_out
    const { data: renewals, error: renError } = await supabaseAdmin
      .from('renewals')
      .select(`
        id,
        next_due_date,
        renewal_type,
        estimated_value,
        customer_id,
        purifier_id,
        status,
        customers!inner (
          id,
          full_name,
          mobile_number,
          language_preference,
          whatsapp_opt_out
        ),
        purifiers (
          brand,
          model
        )
      `)
      .eq('business_id', business.id)
      .in('status', ['PENDING', 'OVERDUE']);

    if (renError || !renewals) {
      console.warn(`Renewals query error for business ${business.id}:`, renError?.message);
      continue;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const renewal of renewals) {
      totalEvaluated++;
      const customer = renewal.customers as any;
      if (!customer || customer.whatsapp_opt_out) {
        continue;
      }

      const dueDate = new Date(renewal.next_due_date);
      dueDate.setHours(0, 0, 0, 0);

      // Exact day calculation
      const diffTime = dueDate.getTime() - today.getTime();
      const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const matchedStage = findMatchingStage(daysUntilDue, DEFAULT_STAGES);
      if (!matchedStage) {
        continue;
      }

      // Generate SHA-256 idempotency key
      const idempotencyKey = generateReminderIdempotencyKey(
        business.id,
        customer.id,
        renewal.id,
        matchedStage.id,
        renewal.next_due_date
      );

      const purifier = (renewal.purifiers as any) || { brand: 'RO Purifier', model: 'Standard' };
      const customerLang = customer.language_preference || 'te';

      // Enqueue job with idempotency key
      const enqueueRes = await enqueueMessageJob({
        businessId: business.id,
        recipientPhone: customer.mobile_number,
        jobType: 'REMINDER',
        idempotencyKey,
        payload: {
          businessId: business.id,
          recipientPhone: customer.mobile_number,
          customerId: customer.id,
          renewalId: renewal.id,
          templateName: matchedStage.templateName,
          languageCode: customerLang,
          parameters: [
            customer.full_name,
            `${purifier.brand} ${purifier.model}`,
            renewal.next_due_date,
            `₹${renewal.estimated_value || 1500}`,
            business.phone || 'Customer Support',
          ],
        },
      });

      if (!enqueueRes.skipped) {
        totalQueued++;
      }
    }
  }

  return {
    businessProcessed: businesses.length,
    renewalsEvaluated: totalEvaluated,
    remindersQueued: totalQueued,
    skippedQuietHours: false,
  };
}