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

    // Ensure all fields have defaults (handle missing fields in old documents)
    const safeSettings = {
      enabled: settings.enabled ?? true,
      otpEnabled: settings.otpEnabled ?? true,
      notificationsEnabled: settings.notificationsEnabled ?? true,
      serviceState: settings.serviceState ?? 'disconnected',
      monthlyLimit: settings.monthlyLimit ?? 1000,
      warningThreshold: settings.warningThreshold ?? 80,
      monthlyConversations: settings.monthlyConversations ?? 0,
      conversationsResetDate: settings.conversationsResetDate ?? new Date(),
      lastConversationDate: settings.lastConversationDate ?? null,
      totalConversations: settings.totalConversations ?? 0,
      activeConversations: settings.activeConversations ?? 0,
      adminEmail: settings.adminEmail ?? '',
      notifyAdminOnLimit: settings.notifyAdminOnLimit ?? true,
    };

    // Calculate usage statistics
    const usagePercentage = safeSettings.monthlyLimit > 0
      ? (safeSettings.monthlyConversations / safeSettings.monthlyLimit) * 100
      : 0;

    const warningTriggered = usagePercentage >= safeSettings.warningThreshold;
    const limitReached = safeSettings.monthlyConversations >= safeSettings.monthlyLimit;

    return NextResponse.json({
      success: true,
      data: {
        settings: safeSettings,
        stats: {
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          remainingConversations: Math.max(0, safeSettings.monthlyLimit - safeSettings.monthlyConversations),
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
    console.log('API received body:', body);

    const {
      enabled,
      otpEnabled,
      notificationsEnabled,
      monthlyLimit,
      warningThreshold,
      adminEmail,
      notifyAdminOnLimit,
    } = body;

    await dbConnect();

    // Use findOneAndUpdate to ensure atomic update with all fields
    const updateData: any = {};
    
    // Only update fields that are provided in the request
    if (enabled !== undefined) updateData.enabled = enabled;
    if (otpEnabled !== undefined) updateData.otpEnabled = otpEnabled;
    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit;
    if (warningThreshold !== undefined) updateData.warningThreshold = warningThreshold;
    if (adminEmail !== undefined) updateData.adminEmail = adminEmail;
    if (notifyAdminOnLimit !== undefined) updateData.notifyAdminOnLimit = notifyAdminOnLimit;

    console.log('Updating with data:', updateData);

    // Use findOneAndUpdate to atomically update the document
    // This ensures all fields are properly set even if they didn't exist before
    const savedSettings = await WhatsAppSettings.findOneAndUpdate(
      {}, // Match any document
      { $set: updateData },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true, // Apply schema defaults on insert
      }
    );

    console.log('Settings after save:', {
      enabled: savedSettings?.enabled,
      otpEnabled: savedSettings?.otpEnabled,
      notificationsEnabled: savedSettings?.notificationsEnabled,
    });

    if (!savedSettings) {
      return NextResponse.json(
        { success: false, error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: savedSettings.enabled ?? true,
        otpEnabled: savedSettings.otpEnabled ?? true,
        notificationsEnabled: savedSettings.notificationsEnabled ?? true,
        monthlyLimit: savedSettings.monthlyLimit ?? 1000,
        warningThreshold: savedSettings.warningThreshold ?? 80,
        adminEmail: savedSettings.adminEmail ?? '',
        notifyAdminOnLimit: savedSettings.notifyAdminOnLimit ?? true,
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
