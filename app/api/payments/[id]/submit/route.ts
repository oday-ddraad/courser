import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { Course, Enrollment, Payment, PaymentSettings, User } from '@/lib/mongodb/models';
import { triggerPaymentSubmitted } from '@/lib/services/pusherNotifications';


function serializePayment(payment: any) {
  return {
    ...payment,
    _id: payment._id?.toString?.() || payment._id,
    enrollmentId: payment.enrollmentId?.toString?.() || payment.enrollmentId,
    userId: payment.userId?.toString?.() || payment.userId,
    courseId: payment.courseId?.toString?.() || payment.courseId,
    paymentMethodId: payment.paymentMethodId?.toString?.() || payment.paymentMethodId,
    createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
    updatedAt: payment.updatedAt?.toISOString?.() || payment.updatedAt,
    lastSubmittedAt: payment.lastSubmittedAt?.toISOString?.() || payment.lastSubmittedAt,
    expiresAt: payment.expiresAt?.toISOString?.() || payment.expiresAt,
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

    if (payment.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (!['pending', 'rejected'].includes(payment.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot submit payment in ${payment.status} status` },
        { status: 400 }
      );
    }

    if (payment.expiresAt && new Date(payment.expiresAt).getTime() < Date.now()) {
      payment.status = 'expired';
      await payment.save();

      await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
        $set: { paymentStatus: 'expired' },
      });

      return NextResponse.json({ success: false, error: 'Payment has expired' }, { status: 400 });
    }

    const settings = await PaymentSettings.findOne({}).lean();
    const maxResubmissions = settings?.maxResubmissions ?? 3;

    if (payment.submissionCount >= maxResubmissions) {
      return NextResponse.json(
        { success: false, error: `Maximum submissions reached (${maxResubmissions})` },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const operationNumber = body?.operationNumber?.trim?.() || '';
    const receiptScreenshots = Array.isArray(body?.receiptScreenshots)
      ? body.receiptScreenshots.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0)
      : [];
    const userNotes = body?.userNotes?.trim?.() || '';

    if (!operationNumber && receiptScreenshots.length === 0) {
      return NextResponse.json(
        { success: false, error: 'operationNumber or at least one receipt screenshot is required' },
        { status: 400 }
      );
    }

    payment.operationNumber = operationNumber;
    payment.receiptScreenshots = receiptScreenshots;
    payment.userNotes = userNotes;
    payment.status = 'pending';
    payment.rejectionReason = '';
    payment.reviewedBy = undefined;
    payment.reviewedAt = undefined;

    payment.submissionCount = (payment.submissionCount || 0) + 1;
    payment.lastSubmittedAt = new Date();

    await payment.save();

    await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
      $set: {
        paymentStatus: 'pending',
      },
    });

    // Notify admins about submitted/resubmitted payment
    try {
      const [course, student] = await Promise.all([
        Course.findById(payment.courseId).select('title').lean(),
        User.findById(payment.userId).select('name').lean(),
      ]);

      await triggerPaymentSubmitted({
        paymentId: payment._id.toString(),
        enrollmentId: payment.enrollmentId.toString(),
        courseId: payment.courseId.toString(),
        courseTitle: course?.title?.en || 'Course',
        studentId: payment.userId.toString(),
        studentName: student?.name || 'Student',
        amount: payment.amount,
        currency: payment.currency,
        referenceCode: payment.referenceCode,
      });
    } catch (notifyError) {
      console.error('Failed to send payment submitted notification:', notifyError);
    }

    return NextResponse.json({

      success: true,
      data: serializePayment(payment.toObject()),
    });
  } catch (error) {
    console.error('Error submitting payment proof:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit payment proof' }, { status: 500 });
  }
}
