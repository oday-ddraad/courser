import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import dbConnect from '@/lib/mongodb/connection';
import EmailSettings from '@/lib/mongodb/models/EmailSettings';

// GET /api/admin/email-settings - Get email settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }


    await dbConnect();
    
    const settings = await EmailSettings.getSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-settings - Update email settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }


    await dbConnect();
    
    const body = await request.json();
    const {
      dailyLimit,
      monthlyLimit,
      dailyWarningThreshold,
      monthlyWarningThreshold,
      notifyAdminOnLimit,
      adminEmail,
      defaultFromEmail,
      defaultFromName,
      emailEnabled,
      trackOpens,
      trackClicks,
    } = body;

    const settings = await EmailSettings.getSettings();

    // Update fields if provided
    if (dailyLimit !== undefined) settings.dailyLimit = dailyLimit;
    if (monthlyLimit !== undefined) settings.monthlyLimit = monthlyLimit;
    if (dailyWarningThreshold !== undefined) settings.dailyWarningThreshold = dailyWarningThreshold;
    if (monthlyWarningThreshold !== undefined) settings.monthlyWarningThreshold = monthlyWarningThreshold;
    if (notifyAdminOnLimit !== undefined) settings.notifyAdminOnLimit = notifyAdminOnLimit;
    if (adminEmail !== undefined) settings.adminEmail = adminEmail;
    if (defaultFromEmail !== undefined) settings.defaultFromEmail = defaultFromEmail;
    if (defaultFromName !== undefined) settings.defaultFromName = defaultFromName;
    if (emailEnabled !== undefined) settings.emailEnabled = emailEnabled;
    if (trackOpens !== undefined) settings.trackOpens = trackOpens;
    if (trackClicks !== undefined) settings.trackClicks = trackClicks;
    
    settings.updatedBy = session.user.id;
    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Email settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-settings/reset - Reset counters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }


    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'daily' or 'monthly'

    const settings = await EmailSettings.getSettings();

    if (type === 'daily') {
      await settings.resetDaily();
    } else if (type === 'monthly') {
      await settings.resetMonthly();
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid reset type. Use "daily" or "monthly"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} counter reset successfully`,
      data: settings,
    });
  } catch (error) {
    console.error('Error resetting email counters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset counters' },
      { status: 500 }
    );
  }
}
