import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Payment } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userRole = session.user.role as UserRole;
    const isAdmin = hasPermission(userRole, 'payment.approve');
    const isInstructor = userRole === 'instructor';

    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    const match: any = {};

    if (isAdmin) {
      // full scope
    } else if (isInstructor) {
      if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
        match.courseId = new mongoose.Types.ObjectId(courseId);
      } else {
        // instructor fallback: only own user-related payments until dedicated instructor stats route
        match.userId = new mongoose.Types.ObjectId(session.user.id);
      }
    } else {
      match.userId = new mongoose.Types.ObjectId(session.user.id);
    }

    const [stats] = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          expiredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] },
          },
          refundedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
          approvedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] },
          },
          refundedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: stats || {
        totalPayments: 0,
        totalAmount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        cancelledCount: 0,
        expiredCount: 0,
        refundedCount: 0,
        approvedAmount: 0,
        refundedAmount: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment stats' }, { status: 500 });
  }
}
