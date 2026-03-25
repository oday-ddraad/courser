import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Course, Enrollment, InstructorEarnings, Payment } from '@/lib/mongodb/models';
import { triggerPaymentRefunded } from '@/lib/services/pusherNotifications';


function serializePayment(payment: any) {
  return {
    ...payment,
    _id: payment._id?.toString?.() || payment._id,
    enrollmentId: payment.enrollmentId?.toString?.() || payment.enrollmentId,
    userId: payment.userId?.toString?.() || payment.userId,
    courseId: payment.courseId?.toString?.() || payment.courseId,
    paymentMethodId: payment.paymentMethodId?.toString?.() || payment.paymentMethodId,
    reviewedBy: payment.reviewedBy?.toString?.() || payment.reviewedBy || null,
    refundedBy: payment.refundedBy?.toString?.() || payment.refundedBy || null,
    reviewedAt: payment.reviewedAt?.toISOString?.() || payment.reviewedAt,
    refundedAt: payment.refundedAt?.toISOString?.() || payment.refundedAt,
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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const refundReason = body?.refundReason?.trim?.();
    if (!refundReason) {
      return NextResponse.json({ success: false, error: 'refundReason is required' }, { status: 400 });
    }

    await connectDB();

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: `Only approved payments can be refunded. Current status: ${payment.status}` },
        { status: 400 }
      );
    }

    payment.status = 'refunded';
    payment.refundedBy = new mongoose.Types.ObjectId(session.user.id);
    payment.refundedAt = new Date();
    payment.refundReason = refundReason;
    if (typeof body.adminNotes === 'string') {
      payment.adminNotes = body.adminNotes.trim();
    }

    await payment.save();

    await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
      $set: {
        status: 'cancelled',
        paymentStatus: 'refunded',
      },
    });

    // Notify student about refund
    try {
      const course = await Course.findById(payment.courseId).select('title').lean();

      await triggerPaymentRefunded(payment.userId.toString(), {
        paymentId: payment._id.toString(),
        enrollmentId: payment.enrollmentId.toString(),
        courseId: payment.courseId.toString(),
        courseTitle: course?.title?.en || 'Course',
        refundReason,
      });
    } catch (notifyError) {
      console.error('Failed to send payment refunded notification:', notifyError);
    }

    // Deduct from instructor earnings for all docs tied to this course

    const docs = await InstructorEarnings.find({
      'revenueShareConfig.courseId': payment.courseId,
    });

    for (const doc of docs) {
      const cfg = doc.revenueShareConfig.find(
        (c: any) => c.courseId?.toString?.() === payment.courseId.toString()
      );
      const sharePercentage = cfg ? cfg.sharePercentage : 100;
      const deduction = (payment.amount * sharePercentage) / 100;

      doc.totalRefunded = (doc.totalRefunded || 0) + deduction;
      doc.netRevenue = Math.max((doc.totalRevenue || 0) - doc.totalRefunded, 0);
      doc.pendingAmount = Math.max((doc.pendingAmount || 0) - deduction, 0);

      await doc.save();
    }

    return NextResponse.json({
      success: true,
      data: serializePayment(payment.toObject()),
      message: 'Payment refunded successfully',
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to refund payment' }, { status: 500 });
  }
}
