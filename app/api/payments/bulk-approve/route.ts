import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Enrollment, Payment } from '@/lib/mongodb/models';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.approve')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const paymentIds = Array.isArray(body?.paymentIds) ? body.paymentIds : [];
    const adminNotes = typeof body?.adminNotes === 'string' ? body.adminNotes.trim() : '';

    if (paymentIds.length === 0) {
      return NextResponse.json({ success: false, error: 'paymentIds is required' }, { status: 400 });
    }

    const validIds = paymentIds.filter((id: unknown) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid payment ids provided' }, { status: 400 });
    }

    await connectDB();

    const payments = await Payment.find({
      _id: { $in: validIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      status: 'pending',
    });

    if (payments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No pending payments found for provided ids' },
        { status: 404 }
      );
    }

    const now = new Date();
    const adminId = new mongoose.Types.ObjectId(session.user.id);

    const updatedPayments: string[] = [];
    for (const payment of payments) {
      payment.status = 'approved';
      payment.reviewedBy = adminId;
      payment.reviewedAt = now;
      if (adminNotes) payment.adminNotes = adminNotes;
      payment.rejectionReason = '';
      await payment.save();

      await Enrollment.findByIdAndUpdate(payment.enrollmentId, {
        $set: {
          status: 'active',
          paymentStatus: 'approved',
          amountPaid: payment.amount,
          currency: payment.currency,
        },
      });

      updatedPayments.push(payment._id.toString());
    }

    return NextResponse.json({
      success: true,
      data: {
        approvedCount: updatedPayments.length,
        approvedPaymentIds: updatedPayments,
      },
      message: `Approved ${updatedPayments.length} payment(s)`,
    });
  } catch (error) {
    console.error('Error bulk approving payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to bulk approve payments' }, { status: 500 });
  }
}
