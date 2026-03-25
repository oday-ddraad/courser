import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Course, Payment } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

function serializePayment(payment: any) {
  return {
    ...payment,
    _id: payment._id?.toString?.() || payment._id,
    enrollmentId: payment.enrollmentId?._id?.toString?.() || payment.enrollmentId?.toString?.() || payment.enrollmentId,
    userId: payment.userId?._id?.toString?.() || payment.userId?.toString?.() || payment.userId,
    courseId: payment.courseId?._id?.toString?.() || payment.courseId?.toString?.() || payment.courseId,
    paymentMethodId:
      payment.paymentMethodId?._id?.toString?.() || payment.paymentMethodId?.toString?.() || payment.paymentMethodId,
    reviewedBy: payment.reviewedBy?.toString?.() || payment.reviewedBy || null,
    refundedBy: payment.refundedBy?.toString?.() || payment.refundedBy || null,
    createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
    updatedAt: payment.updatedAt?.toISOString?.() || payment.updatedAt,
    reviewedAt: payment.reviewedAt?.toISOString?.() || payment.reviewedAt,
    refundedAt: payment.refundedAt?.toISOString?.() || payment.refundedAt,
    expiresAt: payment.expiresAt?.toISOString?.() || payment.expiresAt,
    reminderSentAt: payment.reminderSentAt?.toISOString?.() || payment.reminderSentAt,
    lastSubmittedAt: payment.lastSubmittedAt?.toISOString?.() || payment.lastSubmittedAt,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const payment = await Payment.findById(id)
      .populate('userId', 'name email avatar')
      .populate('courseId', 'title slug instructorIds')
      .populate('paymentMethodId', 'name type paymentAddress bankName accountHolderName')
      .populate('enrollmentId', 'status paymentStatus enrolledAt')
      .lean();

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const userRole = session.user.role as UserRole;
    const isAdmin = userRole === 'admin' && hasPermission(userRole, 'payment.approve');
    const isOwner = payment.userId?._id?.toString?.() === session.user.id || payment.userId?.toString?.() === session.user.id;

    let isInstructorForCourse = false;
    if (userRole === 'instructor') {
      const courseId = payment.courseId?._id?.toString?.() || payment.courseId?.toString?.();
      if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
        const instructorCourse = await Course.exists({
          _id: courseId,
          instructorIds: session.user.id,
        });
        isInstructorForCourse = Boolean(instructorCourse);
      }
    }

    if (!isAdmin && !isOwner && !isInstructorForCourse) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: serializePayment(payment),
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment' }, { status: 500 });
  }
}
