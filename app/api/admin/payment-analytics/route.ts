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

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [monthlyRevenue, revenueByMethod, revenueByCountry, revenueByCourse] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            status: 'approved',
            reviewedAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$reviewedAt' },
              month: { $month: '$reviewedAt' },
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }],
                },
              ],
            },
            revenue: 1,
            count: 1,
          },
        },
        { $sort: { month: 1 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'approved' } },
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
            _id: '$method.name.en',
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'approved' } },
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
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'approved' } },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course',
          },
        },
        {
          $unwind: {
            path: '$course',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$course.title.en',
            revenue: { $sum: '$amount' },
            students: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const totalMethodRevenue = revenueByMethod.reduce((acc, item) => acc + (item.revenue || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        monthlyRevenue,
        revenueByMethod: revenueByMethod.map((item) => ({
          method: item._id || 'Unknown',
          revenue: item.revenue || 0,
          count: item.count || 0,
          percentage: totalMethodRevenue > 0 ? Math.round(((item.revenue || 0) / totalMethodRevenue) * 100) : 0,
        })),
        revenueByCountry: revenueByCountry.map((item) => ({
          country: item._id || 'Unknown',
          revenue: item.revenue || 0,
          count: item.count || 0,
        })),
        revenueByCourse: revenueByCourse.map((item) => ({
          courseTitle: item._id || 'Untitled Course',
          revenue: item.revenue || 0,
          students: item.students || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment analytics' }, { status: 500 });
  }
}
