import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { whatsappService } from '@/lib/services/whatsapp';
import dbConnect from '@/lib/mongodb/connection';

/**
 * POST /api/whatsapp/otp/verify
 * Verify OTP code sent to user's phone
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
    const { code, purpose = 'verification' } = body;

    // Validate code
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'OTP code is required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Verify OTP
    const result = await whatsappService.verifyOTP(
      session.user.id,
      code,
      purpose
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to verify OTP' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
