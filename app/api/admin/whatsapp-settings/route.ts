import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import dbConnect from '@/lib/mongodb/connection';
import WhatsAppSettings from '@/lib/mongodb/models/WhatsAppSettings';

// GET /api/admin/whatsapp-settings - Get WhatsApp settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const settings = await WhatsAppSettings.getSettings();

    // Calculate usage statistics
    const usagePercentage = settings.monthlyLimit > 0
      ? (settings.monthlyConversations / settings.monthlyLimit) * 100
      : 0;

    const warningTriggered = usagePercentage >= settings.warningThreshold;
    const limitReached = settings.monthlyConversations >= settings.monthlyLimit;

    return NextResponse.json({
      success: true,
      data: {
        settings: {
          monthlyLimit: settings.monthlyLimit,
          warningThreshold: settings.warningThreshold,
          monthlyConversations: settings.monthlyConversations,
          conversationsResetDate: settings.conversationsResetDate,
          lastConversationDate: settings.lastConversationDate,
          totalConversations: settings.totalConversations,
          activeConversations: settings.activeConversations,
          adminEmail: settings.adminEmail,
          notifyAdminOnLimit: settings.notifyAdminOnLimit,
        },
        stats: {
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          remainingConversations: Math.max(0, settings.monthlyLimit - settings.monthlyConversations),
          warningTriggered,
          limitReached,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/whatsapp-settings - Update WhatsApp settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      monthlyLimit,
      warningThreshold,
      adminEmail,
      notifyAdminOnLimit,
    } = body;

    await dbConnect();

    const settings = await WhatsAppSettings.getSettings();

    // Update fields
    if (monthlyLimit !== undefined) settings.monthlyLimit = monthlyLimit;
    if (warningThreshold !== undefined) settings.warningThreshold = warningThreshold;
    if (adminEmail !== undefined) settings.adminEmail = adminEmail;
    if (notifyAdminOnLimit !== undefined) settings.notifyAdminOnLimit = notifyAdminOnLimit;

    await settings.save();

    return NextResponse.json({
      success: true,
      data: {
        monthlyLimit: settings.monthlyLimit,
        warningThreshold: settings.warningThreshold,
        adminEmail: settings.adminEmail,
        notifyAdminOnLimit: settings.notifyAdminOnLimit,
      },
    });
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/whatsapp-settings - Reset counters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    await dbConnect();

    if (type === 'monthly') {
      await WhatsAppSettings.resetMonthlyCounters();
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid reset type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Counters reset successfully',
    });
  } catch (error) {
    console.error('Error resetting WhatsApp counters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset counters' },
      { status: 500 }
    );
  }
}
