import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousReminderEngine } from '@/lib/server/schedulerEngine';
import { processPendingMessageJobs } from '@/lib/server/messageQueue';

export const dynamic = 'force-dynamic';

/**
 * Autonomous Cron Route for Scheduled Service Reminders
 * Secured via CRON_SECRET authorization header or query param.
 */
export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const urlSecret = req.nextUrl.searchParams.get('secret');

    // Security check: Validate CRON_SECRET if set in production
    if (cronSecret) {
      const isValidBearer = authHeader === `Bearer ${cronSecret}`;
      const isValidParam = urlSecret === cronSecret;

      if (!isValidBearer && !isValidParam) {
        return NextResponse.json(
          { error: 'Unauthorized. Invalid or missing CRON_SECRET.' },
          { status: 401 }
        );
      }
    }

    const forceRun = req.nextUrl.searchParams.get('force') === 'true';

    // 1. Run reminder scheduler
    const reminderResult = await runAutonomousReminderEngine(undefined, forceRun);

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

export async function POST(req: NextRequest) {
  return GET(req);
}
