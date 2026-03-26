import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import { Course, Enrollment, Payment, PaymentMethod } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';

function generateReferenceCode() {
  return `ENROLL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function serializePayment(payment: any) {
  const serializeRef = (value: any) => {
    if (!value) return value;
    if (typeof value === 'string') return value;
    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (typeof value === 'object' && value._id) {
      return {
        ...value,
        _id: value._id?.toString?.() || value._id,
      };
    }
    return value?.toString?.() || value;
  };

  return {
    ...payment,
    _id: payment._id?.toString?.() || payment._id,
    enrollmentId: serializeRef(payment.enrollmentId),
    userId: serializeRef(payment.userId),
    courseId: serializeRef(payment.courseId),
    paymentMethodId: serializeRef(payment.paymentMethodId),
    reviewedBy: serializeRef(payment.reviewedBy) || null,
    refundedBy: serializeRef(payment.refundedBy) || null,
    createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
    updatedAt: payment.updatedAt?.toISOString?.() || payment.updatedAt,
    reviewedAt: payment.reviewedAt?.toISOString?.() || payment.reviewedAt,
    refundedAt: payment.refundedAt?.toISOString?.() || payment.refundedAt,
    expiresAt: payment.expiresAt?.toISOString?.() || payment.expiresAt,
    reminderSentAt: payment.reminderSentAt?.toISOString?.() || payment.reminderSentAt,
    lastSubmittedAt: payment.lastSubmittedAt?.toISOString?.() || payment.lastSubmittedAt,
  };
}


// GET /api/payments - List payments (admin: all, user/instructor: own-related)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userRole = session.user.role as UserRole;
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 100);
    const courseId = url.searchParams.get('courseId');
    const userId = url.searchParams.get('userId');
    const search = url.searchParams.get('search')?.trim();
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const query: any = {};

    // Scope by role
    if (userRole === 'admin' && hasPermission(userRole, 'payment.approve')) {
      // full access
      if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return NextResponse.json({ success: false, error: 'Invalid userId' }, { status: 400 });
        }
        query.userId = new mongoose.Types.ObjectId(userId);
      }
    } else if (userRole === 'instructor') {
      // Instructor sees payments for their courses
      const instructorCourses = await Course.find({ instructorIds: session.user.id }).select('_id').lean();
      query.courseId = {
        $in: instructorCourses.map((c: any) => c._id),
      };
    } else {
      // Student/user sees own payments only
      query.userId = new mongoose.Types.ObjectId(session.user.id);
    }

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

    if (search) {
      query.$or = [
        { referenceCode: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { operationNumber: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email')
        .populate('courseId', 'title slug')
        .populate('paymentMethodId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: payments.map(serializePayment),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments - Create payment record for an enrollment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const enrollmentId = body?.enrollmentId;
    const paymentMethodId = body?.paymentMethodId;

    if (!enrollmentId || !paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'enrollmentId and paymentMethodId are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(enrollmentId) || !mongoose.Types.ObjectId.isValid(paymentMethodId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid enrollmentId or paymentMethodId' },
        { status: 400 }
      );
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const existingPayment = await Payment.findOne({ enrollmentId: enrollment._id });
    if (existingPayment) {
      return NextResponse.json({ success: false, error: 'Payment already exists for this enrollment' }, { status: 409 });
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod || !paymentMethod.isActive) {
      return NextResponse.json({ success: false, error: 'Payment method not found or inactive' }, { status: 404 });
    }

    const course = await Course.findById(enrollment.courseId).select('price currency');
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    let referenceCode = generateReferenceCode();
    let retry = 0;
    while (retry < 5) {
      const exists = await Payment.exists({ referenceCode });
      if (!exists) break;
      referenceCode = generateReferenceCode();
      retry++;
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const payment = await Payment.create({
      enrollmentId: enrollment._id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      paymentMethodId: paymentMethod._id,
      amount: course.price || 0,
      currency: course.currency || 'USD',
      status: 'pending',
      referenceCode,
      expiresAt,
      receiptScreenshots: [],
      submissionCount: 0,
    });

    await Enrollment.findByIdAndUpdate(enrollment._id, {
      $set: {
        paymentId: payment._id,
        paymentStatus: 'pending',
        amountPaid: 0,
        currency: course.currency || 'USD',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: serializePayment(payment.toObject()),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to create payment' }, { status: 500 });
  }
}
