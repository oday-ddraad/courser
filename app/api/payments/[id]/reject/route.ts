import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Course, Enrollment, Payment } from '@/lib/mongodb/models';
import { triggerPaymentRejected } from '@/lib/services/pusherNotifications';

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

    if (!session || !hasPermission(session.user.role, 'payment.approve')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid payment id' }, { status: 400 });
    }

    await connectDB();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const rejectionReason = body?.reason?.trim?.();
    const adminNotes = body?.adminNotes?.trim?.() || '';

    if (!rejectionReason) {
      return NextResponse.json({ success: false, error: 'reason is required' }, { status: 400 });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    if (!['pending', 'approved'].includes(payment.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot reject payment in ${payment.status} status` },
        { status: 400 }
      );
    }

    payment.status = 'rejected';
    payment.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    payment.reviewedAt = new Date();
    payment.rejectionReason = rejectionReason;
    payment.adminNotes = adminNotes;

    await payment.save();

    await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
      $set: {
        paymentStatus: 'rejected',
        status: 'pending',
      },
    });

    // Notify student about rejection
    try {
      const course = await Course.findById(payment.courseId).select('title').lean();

      await triggerPaymentRejected(payment.userId.toString(), {
        paymentId: payment._id.toString(),
        enrollmentId: payment.enrollmentId.toString(),
        courseId: payment.courseId.toString(),
        courseTitle: course?.title?.en || 'Course',
        rejectionReason,
      });
    } catch (notifyError) {
      console.error('Failed to send payment rejected notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: serializePayment(payment.toObject()),
      message: 'Payment rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to reject payment' }, { status: 500 });
  }
}

