import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Enrollment, Payment } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

function serializePayment(payment: any) {
  return {
    ...payment,
    _id: payment._id?.toString?.() || payment._id,
    enrollmentId: payment.enrollmentId?.toString?.() || payment.enrollmentId,
    userId: payment.userId?.toString?.() || payment.userId,
    courseId: payment.courseId?.toString?.() || payment.courseId,
    paymentMethodId: payment.paymentMethodId?.toString?.() || payment.paymentMethodId,
    reviewedBy: payment.reviewedBy?.toString?.() || payment.reviewedBy || null,
    reviewedAt: payment.reviewedAt?.toISOString?.() || payment.reviewedAt,
    createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
    updatedAt: payment.updatedAt?.toISOString?.() || payment.updatedAt,
  };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid payment id' }, { status: 400 });
    }

    await connectDB();

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const userRole = session.user.role as UserRole;
    const isAdmin = hasPermission(userRole, 'payment.approve');
    const isOwner = payment.userId.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (!['pending', 'rejected'].includes(payment.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel payment in ${payment.status} status` },
        { status: 400 }
      );
    }

    payment.status = 'cancelled';

    if (isAdmin) {
      payment.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
      payment.reviewedAt = new Date();
    } else {
      payment.reviewedBy = undefined;
      payment.reviewedAt = undefined;
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (isAdmin && typeof body.adminNotes === 'string') {
      payment.adminNotes = body.adminNotes.trim();
    }

    await payment.save();

    await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
      $set: {
        paymentStatus: 'cancelled',
        status: 'cancelled',
      },
    });

    return NextResponse.json({
      success: true,
      data: serializePayment(payment.toObject()),
      message: 'Payment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel payment' }, { status: 500 });
  }
}
