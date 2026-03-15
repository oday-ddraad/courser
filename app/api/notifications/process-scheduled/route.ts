import { NextRequest, NextResponse } from 'next/server';
import { notificationWorker } from '@/lib/services/notificationWorker';

/**
 * POST /api/notifications/process-scheduled
 * Process pending scheduled notifications
 * Can be called by Vercel Cron or manually
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for secret if you want to restrict access
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const results = await notificationWorker.processScheduled();

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error processing scheduled notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled notifications',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/process-scheduled
 * Get worker status
 */
export async function GET() {
  const status = notificationWorker.getStatus();

  return NextResponse.json({
    success: true,
    data: status,
  });
}
