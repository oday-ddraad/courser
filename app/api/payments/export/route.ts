import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Payment } from '@/lib/mongodb/models';

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'payment.approve')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const courseId = url.searchParams.get('courseId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const query: any = {};
    if (status) query.status = status;

    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ success: false, error: 'Invalid courseId' }, { status: 400 });
      }
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .populate('paymentMethodId', 'name type')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'paymentId',
      'referenceCode',
      'studentName',
      'studentEmail',
      'courseTitle',
      'amount',
      'currency',
      'paymentMethod',
      'paymentMethodType',
      'status',
      'operationNumber',
      'createdAt',
      'reviewedAt',
    ];

    const rows = payments.map((p: any) => [
      p._id?.toString?.() || '',
      p.referenceCode || '',
      p.userId?.name || '',
      p.userId?.email || '',
      p.courseId?.title?.en || p.courseId?.title?.de || p.courseId?.title?.ar || '',
      p.amount ?? '',
      p.currency || '',
      p.paymentMethodId?.name?.en || p.paymentMethodId?.name?.de || p.paymentMethodId?.name?.ar || '',
      p.paymentMethodId?.type || '',
      p.status || '',
      p.operationNumber || '',
      p.createdAt ? new Date(p.createdAt).toISOString() : '',
      p.reviewedAt ? new Date(p.reviewedAt).toISOString() : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payments-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to export payments' }, { status: 500 });
  }
}
