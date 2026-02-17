import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';

// POST /api/profile/complete - Save profile completion data
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      firstName,
      lastName,
      country,
      phoneNumber,
      address,
      whatsappConsent,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !country) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and country are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update user profile
    const updateData: any = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, // Update full name
      country,
      profileCompleted: true,
      profileCompletedAt: new Date(),
    };

    // Add optional fields if provided
    if (phoneNumber) {
      updateData.phoneNumber = phoneNumber;
    }

    if (address) {
      updateData.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
      };
    }

    if (whatsappConsent !== undefined) {
      updateData.whatsappConsent = whatsappConsent;
      if (whatsappConsent) {
        updateData.whatsappConsentAt = new Date();
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileCompleted: updatedUser.profileCompleted,
      },
    });

  } catch (error: any) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete profile: ' + error.message },
      { status: 500 }
    );
  }
}

// GET /api/profile/complete - Get current profile status
export async function GET() {
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
      profileCompleted: user.profileCompleted,
      user: {
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        address: user.address,
        documents: user.documents,
        whatsappConsent: user.whatsappConsent,
        provider: user.provider,
      },
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
