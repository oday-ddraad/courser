import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import whatsappService from '@/lib/services/whatsapp';
import dbConnect from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';

/**
 * GET /api/notifications/whatsapp
 * Check WhatsApp service status
 */
export async function GET() {
  try {
    const isConfigured = whatsappService.isConfigured();
    
    return NextResponse.json({
      success: true,
      data: {
        configured: isConfigured,
        message: isConfigured 
          ? 'WhatsApp service is configured and ready'
          : 'WhatsApp service is not configured. Please set environment variables.',
      },
    });
  } catch (error) {
    console.error('WhatsApp status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check WhatsApp status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/whatsapp
 * Send WhatsApp notification to a user
 * Requires admin or instructor role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization (admin or instructor only)
    const userRole = session.user.role;
    if (!['admin', 'instructor'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin or Instructor access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, templateName, parameters } = body;

    // Validate required fields
    if (!userId || !templateName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, templateName' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has verified phone number
    if (!user.phoneNumber || !user.phoneVerified) {
      return NextResponse.json(
        { success: false, error: 'User does not have a verified phone number' },
        { status: 400 }
      );
    }

    // Check if WhatsApp notifications are enabled for user
    if (user.whatsappNotificationsEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp notifications are disabled for this user' },
        { status: 400 }
      );
    }

    // Send WhatsApp message
    const result = await whatsappService.sendMessage({
      to: user.phoneNumber,
      templateName,
      parameters: parameters || [],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send WhatsApp message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp notification sent successfully',
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Send WhatsApp notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
