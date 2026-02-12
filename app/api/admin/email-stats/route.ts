import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import dbConnect from '@/lib/mongodb/connection';
import EmailLog from '@/lib/mongodb/models/EmailLog';
import EmailSettings from '@/lib/mongodb/models/EmailSettings';

// GET /api/admin/email-stats - Get email statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }


    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 24h, 7d, 30d, 90d
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get email settings
    const settings = await EmailSettings.getSettings();

    // Aggregate statistics
    const stats = await EmailLog.aggregate([
      {
        $match: {
          sentAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get daily breakdown
    const dailyStats = await EmailLog.aggregate([
      {
        $match: {
          sentAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$sentAt' },
            month: { $month: '$sentAt' },
            day: { $dayOfMonth: '$sentAt' },
          },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] },
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          opened: {
            $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $in: ['$status', ['failed', 'bounced']] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    ]);

    // Get template usage
    const templateStats = await EmailLog.aggregate([
      {
        $match: {
          sentAt: { $gte: startDate, $lte: now },
          templateId: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$templateId',
          templateName: { $first: '$templateName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Format status counts
    const statusCounts: Record<string, number> = {};
    stats.forEach((stat) => {
      statusCounts[stat._id] = stat.count;
    });

    // Calculate rates
    const totalSent = statusCounts.sent || 0;
    const totalDelivered = statusCounts.delivered || 0;
    const totalOpened = statusCounts.opened || 0;
    const totalFailed = (statusCounts.failed || 0) + (statusCounts.bounced || 0);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;

    // Check limits and warnings
    const warnings = {
      dailyLimitReached: settings.isDailyLimitReached(),
      monthlyLimitReached: settings.isMonthlyLimitReached(),
      dailyWarning: settings.shouldShowDailyWarning(),
      monthlyWarning: settings.shouldShowMonthlyWarning(),
      dailyPercentage: (settings.dailySent / settings.dailyLimit) * 100,
      monthlyPercentage: (settings.monthlySent / settings.monthlyLimit) * 100,
    };

    return NextResponse.json({
      success: true,
      data: {
        period,
        summary: {
          total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
          ...statusCounts,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          openRate: Math.round(openRate * 100) / 100,
        },
        limits: {
          dailyLimit: settings.dailyLimit,
          monthlyLimit: settings.monthlyLimit,
          dailySent: settings.dailySent,
          monthlySent: settings.monthlySent,
          dailyRemaining: Math.max(0, settings.dailyLimit - settings.dailySent),
          monthlyRemaining: Math.max(0, settings.monthlyLimit - settings.monthlySent),
        },
        warnings,
        dailyBreakdown: dailyStats.map((day) => ({
          date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
          ...day,
          _id: undefined,
        })),
        topTemplates: templateStats,
      },
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email statistics' },
      { status: 500 }
    );
  }
}
