import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Enrollment, InstructorEarnings, Payment } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const canViewOwn = userRole === 'instructor' || hasPermission(userRole, 'payment.approve');
    if (!canViewOwn) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }


    await connectDB();

    const url = new URL(request.url);
    const instructorIdParam = url.searchParams.get('instructorId');

    let instructorId: string = session.user.id;

    // Admin can request any instructor, instructor can only request self
    if (hasPermission(userRole, 'payment.approve') && instructorIdParam) {
      instructorId = instructorIdParam;
    } else if (instructorIdParam && instructorIdParam !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }


    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ success: false, error: 'Invalid instructor id' }, { status: 400 });
    }

    const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

    const earningsDoc = await InstructorEarnings.findOne({ instructorId: instructorObjectId }).lean();

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
          $or: [{ 'course.instructorId': instructorObjectId }, { 'course.instructors': instructorObjectId }],
        },
      },
      {
        $group: {
          _id: null,
          approvedPaymentsCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
            },
          },
          refundedPaymentsCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0],
            },
          },
          grossRevenueFromPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0],
            },
          },
          refundedFromPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const [enrollmentStats] = await Enrollment.aggregate([
      {
        $match: {
          instructorId: instructorObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
            },
          },
          pendingEnrollments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          cancelledEnrollments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0],
            },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        instructorId,
        earnings: earningsDoc || {
          totalRevenue: 0,
          totalRefunded: 0,
          netRevenue: 0,
          paidAmount: 0,
          pendingAmount: 0,
          currency: 'USD',
          revenueShareConfig: [],
          payoutHistory: [],
          manualAdjustments: [],
        },
        paymentStats: paymentStats || {
          approvedPaymentsCount: 0,
          refundedPaymentsCount: 0,
          grossRevenueFromPayments: 0,
          refundedFromPayments: 0,
        },
        enrollmentStats: enrollmentStats || {
          totalEnrollments: 0,
          activeEnrollments: 0,
          pendingEnrollments: 0,
          cancelledEnrollments: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching instructor earnings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch instructor earnings' }, { status: 500 });
  }
}
