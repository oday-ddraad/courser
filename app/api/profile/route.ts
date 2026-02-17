import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        locale: user.locale,
        country: user.country,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        whatsappNotificationsEnabled: user.whatsappNotificationsEnabled,
        whatsappConsent: user.whatsappConsent,
        whatsappConsentAt: user.whatsappConsentAt,
        avatar: user.avatar,
        address: user.address,
        documents: user.documents || [],
        provider: user.provider,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Fields that are allowed to be updated
    const allowedFields = [
      'country',
      'phoneNumber',
      'address',
      'whatsappConsent',
      'avatar',
    ];

    // Filter only allowed fields
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add timestamp for whatsapp consent
    if (updateData.whatsappConsent !== undefined) {
      updateData.whatsappConsentAt = updateData.whatsappConsent ? new Date() : null;
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phoneNumber: user.phoneNumber,
        whatsappConsent: user.whatsappConsent,
        avatar: user.avatar,
        address: user.address,
        documents: user.documents || [],
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile: ' + error.message },
      { status: 500 }
    );
  }
}
