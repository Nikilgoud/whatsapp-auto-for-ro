import { supabaseAdmin } from './supabaseAdmin';
import { sendWhatsAppMessage, WhatsAppSendParams } from './whatsappCloudApi';

export interface EnqueueJobParams {
  businessId: string;
  recipientPhone: string;
  payload: WhatsAppSendParams;
  jobType?: 'REMINDER' | 'BROADCAST' | 'SERVICE_UPDATE' | 'INVOICE' | 'SYSTEM';
  scheduledAt?: Date;
  idempotencyKey?: string;
}

/**
 * Enqueue a message job to the durable database queue with optional idempotency key
 * Uses production schema: message_jobs table
 */
export async function enqueueMessageJob(params: EnqueueJobParams): Promise<{ jobId?: string; skipped?: boolean }> {
  const {
    businessId,
    recipientPhone,
    payload,
    jobType = 'REMINDER',
    scheduledAt = new Date(),
    idempotencyKey,
  } = params;

  try {
    // Check idempotency if key provided
    if (idempotencyKey) {
      const { data: existing } = await supabaseAdmin
        .from('message_jobs')
        .select('id, status')
        .eq('business_id', businessId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existing) {
        return { jobId: existing.id, skipped: true };
      }
    }

    const { data, error } = await supabaseAdmin
      .from('message_jobs')
      .insert({
        business_id: businessId,
        job_type: jobType,
        recipient_phone: recipientPhone,
        payload,
        status: 'PENDING',
        scheduled_at: scheduledAt.toISOString(),
        idempotency_key: idempotencyKey || null,
        attempts: 0,
        max_attempts: 3,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting message job into queue:', error.message);
      return { skipped: false };
    }

    return { jobId: data?.id, skipped: false };
  } catch (err) {
    console.error('Failed to enqueue message job:', err);
    return { skipped: false };
  }
}

/**
 * Worker function to process pending message jobs with concurrency locking and exponential backoff.
 * Uses production schema: message_jobs table
 */
export async function processPendingMessageJobs(batchSize: number = 20): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Recover stale locked jobs (locked for more than 5 minutes)
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('message_jobs')
    .update({ status: 'PENDING', locked_at: null })
    .eq('status', 'PROCESSING')
    .lt('locked_at', staleThreshold);

  // 2. Fetch pending jobs ready to be processed
  const { data: jobs, error: fetchError } = await supabaseAdmin
    .from('message_jobs')
    .select('*')
    .eq('status', 'PENDING')
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(batchSize);

  if (fetchError || !jobs || jobs.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    // 3. Atomically lock the job
    const { error: lockError } = await supabaseAdmin
      .from('message_jobs')
      .update({ status: 'PROCESSING', locked_at: nowIso })
      .eq('id', job.id)
      .eq('status', 'PENDING');

    if (lockError) {
      // Job was claimed by another concurrent worker instance
      continue;
    }

    // 4. Dispatch WhatsApp message
    const sendParams: WhatsAppSendParams = job.payload;
    const result = await sendWhatsAppMessage(sendParams);

    if (result.success) {
      succeeded++;
      await supabaseAdmin
        .from('message_jobs')
        .update({
          status: 'COMPLETED',
          processed_at: new Date().toISOString(),
          error_message: null,
          locked_at: null,
        })
        .eq('id', job.id);
    } else {
      failed++;
      const currentAttempts = (job.attempts || 0) + 1;
      const maxAttempts = job.max_attempts || 3;

      if (currentAttempts < maxAttempts) {
        // Exponential backoff: 2^attempt * 30s + jitter
        const delaySeconds = Math.pow(2, currentAttempts) * 30 + Math.floor(Math.random() * 15);
        const retryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

        await supabaseAdmin
          .from('message_jobs')
          .update({
            status: 'PENDING',
            attempts: currentAttempts,
            scheduled_at: retryAt,
            error_message: result.error || 'WhatsApp dispatch failed',
            locked_at: null,
          })
          .eq('id', job.id);
      } else {
        // Max attempts reached, mark as FAILED
        await supabaseAdmin
          .from('message_jobs')
          .update({
            status: 'FAILED',
            attempts: currentAttempts,
            processed_at: new Date().toISOString(),
            error_message: `Max retries exceeded: ${result.error}`,
            locked_at: null,
          })
          .eq('id', job.id);
      }
    }
  }

  return {
    processed: succeeded + failed,
    succeeded,
    failed,
  };
}