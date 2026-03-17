import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, User } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';
import {
  triggerCourseApproved,
  triggerCourseRejected,
  triggerCourseSubmitted,
} from '@/lib/services/pusherNotifications';

import { Types } from 'mongoose';


// GET /api/courses/approval - List pending approval courses (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admins can view pending approvals
    const userRole = session.user.role as UserRole;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    // Build query
    const query: any = { approvalStatus: status };
    
    // Fetch courses with instructor details
    const courses = await Course.find(query)
      .populate('instructorIds', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    
    return NextResponse.json({
      success: true,
      data: courses,
      count: courses.length,
    });
  } catch (error) {
    console.error('Error fetching pending courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending courses' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/approval - Approve or reject a course (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admins can approve/reject courses
    const userRole = session.user.role as UserRole;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const body = await request.json();
    const { courseId, action, rejectionReason } = body;
    
    if (!courseId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: courseId and action' },
        { status: 400 }
      );
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    // Find the course
    const course = await Course.findById(courseId).populate('instructorIds', 'name email');
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    
    // Check if course is already approved or rejected
    if (course.approvalStatus !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Course is already ${course.approvalStatus}` },
        { status: 400 }
      );
    }
    
    // Update course based on action
    if (action === 'approve') {
      course.approvalStatus = 'approved';
      course.approvedBy = new Types.ObjectId(session.user.id);
      course.approvalDate = new Date();
      course.rejectionReason = '';
      
      await course.save();
      
      // Send real-time notifications to all instructors via Pusher
      try {
        for (const instructor of course.instructorIds) {
          await triggerCourseApproved(instructor._id.toString(), {
            courseId: course._id.toString(),
            courseTitle: course.title.en,
            courseSlug: course.slug,
          });
        }
        console.log(`Real-time notifications sent to ${course.instructorIds.length} instructors`);
      } catch (notifyError) {
        console.error('Failed to send approval notification:', notifyError);
      }


      
      return NextResponse.json({
        success: true,
        message: 'Course approved successfully',
        data: course,
      });
    } else {
      // Reject action
      if (!rejectionReason || rejectionReason.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required when rejecting a course' },
          { status: 400 }
        );
      }
      
      course.approvalStatus = 'rejected';
      course.rejectionReason = rejectionReason;
      course.approvedBy = new Types.ObjectId(session.user.id);
      course.approvalDate = new Date();
      
      await course.save();
      
      // Send real-time notifications to all instructors via Pusher
      try {
        for (const instructor of course.instructorIds) {
          await triggerCourseRejected(instructor._id.toString(), {
            courseId: course._id.toString(),
            courseTitle: course.title.en,
            courseSlug: course.slug,
            rejectionReason,
          });
        }
        console.log(`Real-time rejection notifications sent to ${course.instructorIds.length} instructors`);
      } catch (notifyError) {
        console.error('Failed to send rejection notification:', notifyError);
      }


      
      return NextResponse.json({
        success: true,
        message: 'Course rejected successfully',
        data: course,
      });
    }
  } catch (error) {
    console.error('Error processing course approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process course approval' },
      { status: 500 }
    );
  }
}

// POST /api/courses/approval - Submit course for approval (instructor only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only instructors can submit courses for approval
    const userRole = session.user.role as UserRole;
    if (!['instructor', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Instructor access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const body = await request.json();
    const { courseId } = body;
    
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: courseId' },
        { status: 400 }
      );
    }
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if user is one of the instructors of this course
    const isInstructor = course.instructorIds.some(
      (id: Types.ObjectId) => id.toString() === session.user.id
    );
    if (!isInstructor && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only submit your own courses' },
        { status: 403 }
      );
    }

    
    // Check if course is already submitted or approved
    if (course.approvalStatus === 'pending') {
      return NextResponse.json(
        { success: false, error: 'Course is already pending approval' },
        { status: 400 }
      );
    }
    
    if (course.approvalStatus === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Course is already approved' },
        { status: 400 }
      );
    }
    
    // Update course status to pending
    course.approvalStatus = 'pending';
    course.submittedForApprovalAt = new Date();
    course.rejectionReason = ''; // Clear any previous rejection reason
    
    await course.save();
    
    // Notify admins about new course submission via Pusher
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const admin of admins) {
        await triggerCourseSubmitted(admin._id.toString(), {
          courseId: course._id.toString(),
          courseTitle: course.title.en,
        });

      }
      console.log(`Real-time submission notifications sent to ${admins.length} admins`);
    } catch (notifyError) {
      console.error('Failed to send admin notification:', notifyError);
    }

    
    return NextResponse.json({
      success: true,
      message: 'Course submitted for approval successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error submitting course for approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit course for approval' },
      { status: 500 }
    );
  }
}
