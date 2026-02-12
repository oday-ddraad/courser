import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import dbConnect from '@/lib/mongodb/connection';
import EmailLog from '@/lib/mongodb/models/EmailLog';

// GET /api/admin/email-logs - Get email logs with filtering
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
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get('status');
    const templateId = searchParams.get('templateId');
    const to = searchParams.get('to');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const query: any = {};
    
    if (status) query.status = status;
    if (templateId) query.templateId = templateId;
    if (to) query.to = { $regex: to, $options: 'i' };
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const [logs, total] = await Promise.all([
      EmailLog.find(query)
        .populate('templateId', 'name')
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit),
      EmailLog.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
