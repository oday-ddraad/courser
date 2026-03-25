import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { Payment, Enrollment } from '@/lib/mongodb/models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ success: false, error: 'Invalid user id' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const [paymentStats] = await Payment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalPaidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] },
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          approvedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          rejectedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          refundedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
          refundedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] },
          },
        },
      },
    ]);

    const [enrollmentStats] = await Enrollment.aggregate([
      {
        $match: {
          studentId: userId,
        },
      },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          pendingEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPayments: paymentStats?.totalPayments || 0,
        totalPaidAmount: paymentStats?.totalPaidAmount || 0,
        pendingPayments: paymentStats?.pendingPayments || 0,
        approvedPayments: paymentStats?.approvedPayments || 0,
        rejectedPayments: paymentStats?.rejectedPayments || 0,
        refundedPayments: paymentStats?.refundedPayments || 0,
        refundedAmount: paymentStats?.refundedAmount || 0,
        totalEnrollments: enrollmentStats?.totalEnrollments || 0,
        activeEnrollments: enrollmentStats?.activeEnrollments || 0,
        pendingEnrollments: enrollmentStats?.pendingEnrollments || 0,
        completedEnrollments: enrollmentStats?.completedEnrollments || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user payment stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user payment stats' }, { status: 500 });
  }
}
