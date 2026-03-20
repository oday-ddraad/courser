import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Payment } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasPermission(userRole, 'payment.approve')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      [overall],
      [todayRevenueAgg],
      [monthRevenueAgg],
      recentPayments,
      revenueByMethod,
      revenueByCountry,
    ] = await Promise.all([
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0],
              },
            },
            pendingPayments: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
              },
            },
            approvedPayments: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
              },
            },
            rejectedPayments: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0],
              },
            },
            refundedPayments: {
              $sum: {
                $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'approved',
            reviewedAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$amount' },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'approved',
            reviewedAt: { $gte: monthStart },
          },
        },
        {
          $group: {
            _id: null,
            thisMonthRevenue: { $sum: '$amount' },
          },
        },
      ]),
      Payment.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select('userId courseId amount currency status createdAt reviewedAt paymentMethodId referenceCode')
        .lean(),
      Payment.aggregate([
        {
          $match: { status: 'approved' },
        },
        {
          $lookup: {
            from: 'paymentmethods',
            localField: 'paymentMethodId',
            foreignField: '_id',
            as: 'method',
          },
        },
        {
          $unwind: {
            path: '$method',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$method.type',
            count: { $sum: 1 },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Payment.aggregate([
        {
          $match: { status: 'approved' },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'student',
          },
        },
        {
          $unwind: {
            path: '$student',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$student.country',
            count: { $sum: 1 },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: overall?.totalRevenue || 0,
        pendingPayments: overall?.pendingPayments || 0,
        approvedPayments: overall?.approvedPayments || 0,
        rejectedPayments: overall?.rejectedPayments || 0,
        refundedPayments: overall?.refundedPayments || 0,
        todayRevenue: todayRevenueAgg?.todayRevenue || 0,
        thisMonthRevenue: monthRevenueAgg?.thisMonthRevenue || 0,
        recentPayments,
        revenueByMethod: revenueByMethod.map((item) => ({
          method: item._id || 'unknown',
          count: item.count,
          revenue: item.revenue,
        })),
        revenueByCountry: revenueByCountry.map((item) => ({
          country: item._id || 'unknown',
          count: item.count,
          revenue: item.revenue,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching admin payment stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin payment stats' }, { status: 500 });
  }
}
