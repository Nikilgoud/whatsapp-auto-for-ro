import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { isWithinOperationalHours } from '@/lib/server/schedulerEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;
  let queueSummary = { pending: 0, processing: 0, failed: 0 };

  try {
    const dbCheckStart = Date.now();
    const { data, error } = await supabaseAdmin.from('businesses').select('id').limit(1);
    dbLatencyMs = Date.now() - dbCheckStart;

    if (error) {
      dbStatus = 'degraded';
    }
  } catch {
    dbStatus = 'unreachable';
  }

  try {
    // Check pending jobs count
    const { count: pendingCount } = await supabaseAdmin
      .from('message_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');

    const { count: procCount } = await supabaseAdmin
      .from('message_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PROCESSING');

    const { count: failedCount } = await supabaseAdmin
      .from('message_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'FAILED');

    queueSummary = {
      pending: pendingCount || 0,
      processing: procCount || 0,
      failed: failedCount || 0,
    };
  } catch (qErr) {
    console.warn('Queue health check warning:', qErr);
  }

  const isOperational = isWithinOperationalHours('Asia/Kolkata');

  return NextResponse.json({
    status: dbStatus === 'healthy' ? 'operational' : 'degraded',
    service: 'RO Purifier Service & Renewal Platform',
    version: '2.0.0-production',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    messageQueue: queueSummary,
    scheduler: {
      timezone: 'Asia/Kolkata',
      withinOperationalHours: isOperational,
      autonomousCadence: '09:00 IST Daily',
    },
    whatsappIntegration: {
      mode: process.env.WHATSAPP_MODE || 'mock',
      configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    },
    responseLatencyMs: Date.now() - startTime,
  });
}
