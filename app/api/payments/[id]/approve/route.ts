import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Course, Enrollment, InstructorEarnings, Payment, User } from '@/lib/mongodb/models';
import { triggerPaymentApproved } from '@/lib/services/pusherNotifications';


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

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Only pending payments can be approved. Current status: ${payment.status}` },
        { status: 400 }
      );
    }

    payment.status = 'approved';
    payment.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    payment.reviewedAt = new Date();
    payment.rejectionReason = '';

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (typeof body.adminNotes === 'string') {
      payment.adminNotes = body.adminNotes.trim();
    }

    await payment.save();

    await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
      $set: {
        status: 'active',
        paymentStatus: 'approved',
        amountPaid: payment.amount,
        currency: payment.currency,
      },
    });

    // Revenue distribution
    const course = await Course.findById(payment.courseId).select('instructorIds title slug').lean();
    if (course?.instructorIds?.length) {

      const adminId = new mongoose.Types.ObjectId(session.user.id);
      const instructorCount = course.instructorIds.length;
      const equalShare = instructorCount > 0 ? payment.amount / instructorCount : payment.amount;

      for (const instructorId of course.instructorIds) {
        const doc = await InstructorEarnings.findOne({ instructorId });

        if (!doc) {
          await InstructorEarnings.create({
            instructorId,
            totalRevenue: equalShare,
            totalRefunded: 0,
            netRevenue: equalShare,
            currency: payment.currency,
            paidAmount: 0,
            pendingAmount: equalShare,
            revenueShareConfig: [],
            payoutHistory: [],
            manualAdjustments: [],
            resetNote: '',

          });
          continue;
        }

        const config = doc.revenueShareConfig?.find(
          (cfg: any) => cfg.courseId?.toString?.() === payment.courseId.toString()
        );
        const sharePercentage = config ? config.sharePercentage : 100 / instructorCount;
        const shareAmount = (payment.amount * sharePercentage) / 100;

        doc.totalRevenue = (doc.totalRevenue || 0) + shareAmount;
        doc.netRevenue = Math.max((doc.totalRevenue || 0) - (doc.totalRefunded || 0), 0);
        doc.pendingAmount = (doc.pendingAmount || 0) + shareAmount;
        doc.currency = payment.currency;

        if (!config) {
          doc.revenueShareConfig.push({
            courseId: payment.courseId,
            sharePercentage,
            setBy: adminId,
            setAt: new Date(),
          } as any);
        }

        await doc.save();
      }
    }

    // Notify student + instructors
    try {
      const student = await User.findById(payment.userId).select('name').lean();

      await triggerPaymentApproved(payment.userId.toString(), {
        paymentId: payment._id.toString(),
        enrollmentId: payment.enrollmentId.toString(),
        courseId: payment.courseId.toString(),
        courseTitle: course?.title?.en || 'Course',
        courseSlug: course?.slug || '',
        amount: payment.amount,
        currency: payment.currency,
        instructorIds: (course?.instructorIds || []).map((id: any) => id.toString()),
        studentName: student?.name || 'Student',
      });
    } catch (notifyError) {
      console.error('Failed to send payment approved notifications:', notifyError);
    }

    return NextResponse.json({

      success: true,
      data: serializePayment(payment.toObject()),
      message: 'Payment approved successfully',
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to approve payment' }, { status: 500 });
  }
}
