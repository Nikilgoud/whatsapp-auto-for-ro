import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousReminderEngine } from '@/lib/server/schedulerEngine';
import { processPendingMessageJobs } from '@/lib/server/messageQueue';
import { withCronAuth } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * Autonomous Cron Route for Scheduled Service Reminders
 * Secured via CRON_SECRET authorization header or query param.
 * Uses withCronAuth middleware for consistent auth handling.
 */
async function cronHandler(req: NextRequest) {
  try {
    const forceRun = req.nextUrl.searchParams.get('force') === 'true';
    const businessId = req.nextUrl.searchParams.get('businessId') || undefined;

    // 1. Run reminder scheduler
    const reminderResult = await runAutonomousReminderEngine(businessId, forceRun);

    // 2. Process pending message queue jobs
    const queueResult = await processPendingMessageJobs(30);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scheduler: reminderResult,
      queue: queueResult,
    });
  } catch (error: any) {
    console.error('Error executing autonomous cron reminder run:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error running reminders cron',
      },
      { status: 500 }
    );
  }
}

export const GET = withCronAuth(cronHandler);
export const POST = withCronAuth(cronHandler);