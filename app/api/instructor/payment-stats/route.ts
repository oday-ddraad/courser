import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { Enrollment, Payment } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as UserRole;
    if (role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ success: false, error: 'Invalid instructor id' }, { status: 400 });
    }

    const instructorId = new mongoose.Types.ObjectId(session.user.id);

    const [paymentStats] = await Payment.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'refunded'] },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $match: {
          $or: [{ 'course.instructorId': instructorId }, { 'course.instructors': instructorId }],
        },
      },
      {
        $group: {
          _id: null,
          approvedPaymentsCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          refundedPaymentsCount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
          grossRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] },
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
          instructorId,
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
          cancelledEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    const grossRevenue = paymentStats?.grossRevenue || 0;
    const refundedAmount = paymentStats?.refundedAmount || 0;

    return NextResponse.json({
      success: true,
      data: {
        approvedPaymentsCount: paymentStats?.approvedPaymentsCount || 0,
        refundedPaymentsCount: paymentStats?.refundedPaymentsCount || 0,
        grossRevenue,
        refundedAmount,
        netRevenue: grossRevenue - refundedAmount,
        totalEnrollments: enrollmentStats?.totalEnrollments || 0,
        activeEnrollments: enrollmentStats?.activeEnrollments || 0,
        pendingEnrollments: enrollmentStats?.pendingEnrollments || 0,
        cancelledEnrollments: enrollmentStats?.cancelledEnrollments || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching instructor payment stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch instructor payment stats' }, { status: 500 });
  }
}
