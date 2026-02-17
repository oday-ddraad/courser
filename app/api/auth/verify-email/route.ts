import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';
import emailService from '@/lib/services/email';
import { generateVerificationEmail } from '@/lib/email/templates/verify-email';

// POST /api/auth/verify-email - Send verification email
export async function POST(req: NextRequest) {
  try {
    const { email, locale = 'en' } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours expiry

    // Save token to user
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    // Generate verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/${locale}/verify-email?token=${token}`;

    // In development, auto-verify the email for easy testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Auto-verify in development
      user.emailVerified = new Date();
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Email auto-verified in development mode',
        devMode: true,
        verificationUrl, // Still provide the URL for manual testing if needed
      });
    }

    // Send email in production
    const { subject, html } = generateVerificationEmail(user.name, verificationUrl, locale);
    
    const emailResult = await emailService.sendEmail({
      to: email,
      template: {
        name: 'email-verification',
        subject,
        htmlContent: html,
        variables: [],
      },
      variables: {},
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });

  } catch (error: any) {
    console.error('Send verification email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
