import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { PaymentSettings } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

const DEFAULT_SETTINGS = {
  maxPendingPaymentsPerStudent: 3,
  paymentExpiryHours: 48,
  reminderAfterHours: 24,
  allowResubmission: true,
  maxResubmissions: 5,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as UserRole;
    if (!hasPermission(role, 'payment.approve')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    let settings = await PaymentSettings.findOne().sort({ updatedAt: -1 }).lean();

    if (!settings) {
      const created = await PaymentSettings.create(DEFAULT_SETTINGS);
      settings = created.toObject();
    }

    return NextResponse.json({
      success: true,
      data: {
        maxPendingPaymentsPerStudent: settings.maxPendingPaymentsPerStudent,
        paymentExpiryHours: settings.paymentExpiryHours,
        reminderAfterHours: settings.reminderAfterHours,
        allowResubmission: settings.allowResubmission,
        maxResubmissions: settings.maxResubmissions,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as UserRole;
    if (!hasPermission(role, 'payment.approve')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const maxPendingPaymentsPerStudent = Number(body.maxPendingPaymentsPerStudent);

    const paymentExpiryHours = Number(body.paymentExpiryHours);
    const reminderAfterHours = Number(body.reminderAfterHours);
    const allowResubmission =
      typeof body.allowResubmission === 'boolean'
        ? body.allowResubmission
        : DEFAULT_SETTINGS.allowResubmission;
    const maxResubmissions = Number(body.maxResubmissions);


    if (!Number.isFinite(maxPendingPaymentsPerStudent) || maxPendingPaymentsPerStudent < 1 || maxPendingPaymentsPerStudent > 20) {
      return NextResponse.json(
        { success: false, error: 'maxPendingPaymentsPerStudent must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(paymentExpiryHours) || paymentExpiryHours < 1 || paymentExpiryHours > 168) {
      return NextResponse.json(
        { success: false, error: 'paymentExpiryHours must be between 1 and 168' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(reminderAfterHours) || reminderAfterHours < 1 || reminderAfterHours >= paymentExpiryHours) {
      return NextResponse.json(
        { success: false, error: 'reminderAfterHours must be >= 1 and less than paymentExpiryHours' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(maxResubmissions) || maxResubmissions < 1 || maxResubmissions > 50) {
      return NextResponse.json(
        { success: false, error: 'maxResubmissions must be between 1 and 50' },
        { status: 400 }
      );
    }

    await connectDB();

    let settings = await PaymentSettings.findOne().sort({ updatedAt: -1 });

    if (!settings) {
      settings = new PaymentSettings(DEFAULT_SETTINGS);
    }

    settings.maxPendingPaymentsPerStudent = maxPendingPaymentsPerStudent;
    settings.paymentExpiryHours = paymentExpiryHours;
    settings.reminderAfterHours = reminderAfterHours;
    settings.allowResubmission = allowResubmission;
    settings.maxResubmissions = maxResubmissions;

    const savedSettings = await settings.save();

    return NextResponse.json({
      success: true,
      data: {
        maxPendingPaymentsPerStudent: savedSettings.maxPendingPaymentsPerStudent,
        paymentExpiryHours: savedSettings.paymentExpiryHours,
        reminderAfterHours: savedSettings.reminderAfterHours,
        allowResubmission: savedSettings.allowResubmission,
        maxResubmissions: savedSettings.maxResubmissions,
        updatedAt: savedSettings.updatedAt,
      },
      message: 'Payment settings updated successfully',
    });

  } catch (error) {
    console.error('Error updating payment settings:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update payment settings';

    return NextResponse.json(
      { success: false, error: 'Failed to update payment settings', details: errorMessage },
      { status: 500 }
    );
  }
}
