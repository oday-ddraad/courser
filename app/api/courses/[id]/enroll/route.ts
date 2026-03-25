import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment, Payment, PaymentMethod } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

function generateReferenceCode() {
  return `ENROLL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// POST /api/courses/[id]/enroll - Enroll in a course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Find course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course is published
    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Course is not available' },
        { status: 400 }
      );
    }

    const coursePrice = Number(course.price || 0);
    const courseCurrency: 'USD' | 'EUR' | 'SYP' =
      course.currency === 'EUR' || course.currency === 'SYP' ? course.currency : 'USD';
    const isFreeCourse = coursePrice <= 0;


    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: id,
    });

    if (existingEnrollment) {
      // Already active/completed means already has access
      if (existingEnrollment.status === 'active' || existingEnrollment.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Already enrolled in this course' },
          { status: 409 }
        );
      }

      // For paid course + pending payment: return pending enrollment so client can go to payment page
      if (!isFreeCourse && existingEnrollment.status === 'pending') {
        const existingPayment = await Payment.findOne({ enrollmentId: existingEnrollment._id }).lean();

        if (existingPayment) {
          return NextResponse.json({
            success: true,
            data: {
              _id: existingEnrollment._id.toString(),
              status: existingEnrollment.status,
              paymentStatus: 'pending',
              paymentId: existingPayment._id.toString(),
            },
            message: 'Pending enrollment exists, continue payment',
          });
        }
      }

      // Reactivate cancelled enrollment for free course
      if (isFreeCourse && existingEnrollment.status === 'cancelled') {
        existingEnrollment.status = 'active';
        existingEnrollment.paymentStatus = 'free';
        existingEnrollment.amountPaid = 0;
        existingEnrollment.currency = courseCurrency;

        await existingEnrollment.save();

        course.enrollmentCount += 1;
        await course.save();

        return NextResponse.json({
          success: true,
          data: existingEnrollment,
          message: 'Enrollment reactivated',
        });
      }
    }

    // Free course: activate immediately
    if (isFreeCourse) {
      const enrollment = await Enrollment.create({
        userId: session.user.id,
        courseId: id,
        status: 'active',
        paymentStatus: 'free',
        amountPaid: 0,
        currency: courseCurrency,
        progress: {

          completedLessons: [],
          completionPercentage: 0,
        },
      });

      course.enrollmentCount += 1;
      await course.save();

      return NextResponse.json(
        {
          success: true,
          data: enrollment,
          message: 'Successfully enrolled in free course',
        },
        { status: 201 }
      );
    }

    // Paid course: create pending enrollment + payment
    const enrollment = await Enrollment.create({
      userId: session.user.id,
      courseId: id,
      status: 'pending',
      paymentStatus: 'pending',
      amountPaid: 0,
      currency: courseCurrency,
      progress: {

        completedLessons: [],
        completionPercentage: 0,
      },
    });

    // Pick first active method (global preferred fallback)
    const userCountry = (session.user as any).country || null;
    const methodsQuery: any = { isActive: true };
    if (userCountry) {
      methodsQuery.$or = [{ isGlobal: true }, { countries: userCountry.toUpperCase() }];
    } else {
      methodsQuery.isGlobal = true;
    }

    let paymentMethod = await PaymentMethod.findOne(methodsQuery).sort({ sortOrder: 1, createdAt: -1 });

    if (!paymentMethod) {
      paymentMethod = await PaymentMethod.findOne({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
    }

    if (!paymentMethod) {
      await Enrollment.findByIdAndDelete(enrollment._id);
      return NextResponse.json(
        { success: false, error: 'No active payment method available. Please contact admin.' },
        { status: 400 }
      );
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
      amount: coursePrice,
      currency: courseCurrency,
      status: 'pending',

      referenceCode,
      expiresAt,
      receiptScreenshots: [],
      submissionCount: 0,
    });

    enrollment.paymentId = payment._id;
    await enrollment.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: enrollment._id.toString(),
          status: enrollment.status,
          paymentStatus: 'pending',
          paymentId: payment._id.toString(),
        },
        message: 'Enrollment created. Proceed to payment.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// GET /api/courses/[id]/enroll - Check enrollment status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: id,
    }).lean();

    return NextResponse.json({
      success: true,
      data: {
        isEnrolled: !!enrollment && (enrollment.status === 'active' || enrollment.status === 'completed'),
        enrollment,
      },
    });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check enrollment status' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/enroll - Unenroll from course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Find and update enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      {
        userId: session.user.id,
        courseId: id,
        status: { $in: ['active', 'pending'] },
      },
      {
        status: 'cancelled',
      },
      { new: true }
    );

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found or already cancelled' },
        { status: 404 }
      );
    }

    // Update course enrollment count
    const course = await Course.findById(id);
    if (course && course.enrollmentCount > 0) {
      course.enrollmentCount -= 1;
      await course.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from course',
    });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unenroll from course' },
      { status: 500 }
    );
  }
}
