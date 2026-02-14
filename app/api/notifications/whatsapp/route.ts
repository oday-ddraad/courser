import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { whatsappService } from '@/lib/services/whatsapp';
import User from '@/lib/mongodb/models/User';
import dbConnect from '@/lib/mongodb/connection';

/**
 * POST /api/notifications/whatsapp
 * Send WhatsApp notification to a user
 * Requires admin or instructor role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions (admin or instructor)
    const allowedRoles = ['admin', 'instructor'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, data } = body;

    // Validate required fields
    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: 'User ID and notification type are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get target user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if user has verified phone and enabled WhatsApp notifications
    if (!user.phoneNumber || !user.phoneVerified) {
      return NextResponse.json(
        { success: false, error: 'User does not have a verified phone number' },
        { status: 400 }
      );
    }

    if (!user.whatsappNotificationsEnabled) {
      return NextResponse.json(
        { success: false, error: 'User has disabled WhatsApp notifications' },
        { status: 400 }
      );
    }

    // Send appropriate notification based on type
    let result;
    switch (type) {
      case 'welcome':
        result = await whatsappService.sendWelcomeMessage(
          user.phoneNumber,
          data.userName || user.name
        );
        break;

      case 'course_enrollment':
        result = await whatsappService.sendCourseEnrollmentNotification(
          user.phoneNumber,
          data.userName || user.name,
          data.courseTitle
        );
        break;

      case 'live_stream_starting':
        result = await whatsappService.sendLiveStreamNotification(
          user.phoneNumber,
          data.courseTitle,
          data.startTime
        );
        break;

      case 'payment_approved':
        result = await whatsappService.sendPaymentApprovedNotification(
          user.phoneNumber,
          data.userName || user.name,
          data.courseTitle
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send WhatsApp notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp notification sent successfully',
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Send WhatsApp notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/whatsapp/status
 * Check WhatsApp service configuration status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if service is configured
    const isConfigured = whatsappService.isConfigured();

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      message: isConfigured 
        ? 'WhatsApp service is configured' 
        : 'WhatsApp service is not configured. Please set environment variables.',
    });

  } catch (error) {
    console.error('WhatsApp status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
