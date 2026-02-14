import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { whatsappService } from '@/lib/services/whatsapp';
import User from '@/lib/mongodb/models/User';
import dbConnect from '@/lib/mongodb/connection';

/**
 * POST /api/whatsapp/otp/send
 * Send OTP to user's phone number for verification
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

    const body = await request.json();
    const { phoneNumber, purpose = 'verification' } = body;

    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if phone number is already verified by another user
    const existingUser = await User.findOne({
      phoneNumber,
      _id: { $ne: session.user.id },
      phoneVerified: { $ne: null },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'This phone number is already verified by another user' },
        { status: 409 }
      );
    }

    // Send OTP
    const result = await whatsappService.sendOTP(
      session.user.id,
      phoneNumber,
      purpose
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }

    // Update user's phone number (but not verified yet)
    await User.findByIdAndUpdate(session.user.id, {
      phoneNumber,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt,
    });

  } catch (error) {
    console.error('Send OTP API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
