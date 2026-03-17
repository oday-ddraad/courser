import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, User } from '@/lib/mongodb/models';

import { Types } from 'mongoose';
import { triggerCourseSubmitted } from '@/lib/services/pusherNotifications';


// POST /api/courses/[id]/submit - Submit course for approval
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Only instructors can submit their own courses
    if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only instructors can submit courses' },
        { status: 403 }
      );
    }

    await connectDB();

    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is an instructor of this course
    const isInstructor = course.instructorIds.some(
      (instructorId: Types.ObjectId) => instructorId.toString() === session.user.id
    );
    
    if (!isInstructor && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to submit this course' },
        { status: 403 }
      );
    }

    // Can only submit if currently pending or rejected
    if (course.approvalStatus === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Course is already approved' },
        { status: 400 }
      );
    }

    // Update course status to pending
    course.approvalStatus = 'pending';
    course.submittedForApprovalAt = new Date();
    await course.save();

    // Notify admins about new course submission (in-app + realtime)
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      await Promise.allSettled(
        admins.map((admin) =>
          triggerCourseSubmitted(admin._id.toString(), {
            courseId: course._id.toString(),
            courseTitle: course.title.en,
          })
        )
      );
    } catch (notifyError) {
      console.log('Failed to notify admins for course submission:', notifyError);
    }

    return NextResponse.json({

      success: true,
      message: 'Course submitted for approval',
      data: {
        id: course._id,
        approvalStatus: course.approvalStatus,
        submittedForApprovalAt: course.submittedForApprovalAt,
      },
    });
  } catch (error: any) {
    console.log('Error submitting course for approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit course' },
      { status: 500 }
    );
  }
}
