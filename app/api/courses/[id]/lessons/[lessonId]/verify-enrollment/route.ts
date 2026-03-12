import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// GET /api/courses/[id]/lessons/[lessonId]/verify-enrollment - Check if user is enrolled
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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

    const lesson = course.lessons.find((l: any) => l._id.toString() === lessonId);
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Admin and instructors can always access
    const isAdmin = session.user.role === 'admin';
    const isInstructor = course.instructorIds.some(
      (instructorId: Types.ObjectId) => instructorId.toString() === session.user.id
    );

    if (isAdmin || isInstructor) {
      return NextResponse.json({
        success: true,
        data: {
          isEnrolled: true,
          canAccess: true,
          isAdmin,
          isInstructor,
          lesson: {
            _id: lesson._id,
            title: lesson.title,
            liveStatus: lesson.liveStatus,
            scheduledDateTime: lesson.scheduledDateTime,
            jitsiRoomName: lesson.jitsiRoomName,
          },
        },
      });
    }

    // Check enrollment for students
    const enrollment = await Enrollment.findOne({
      courseId: course._id,
      userId: session.user.id,
      status: 'active',
    });

    const isEnrolled = !!enrollment;

    // For live lessons, check if it's actually live
    if (lesson.isLiveStream && lesson.liveStatus !== 'live' && !isAdmin && !isInstructor) {
      return NextResponse.json({
        success: true,
        data: {
          isEnrolled,
          canAccess: false,
          reason: 'lesson_not_live',
          lessonStatus: lesson.liveStatus,
          scheduledDateTime: lesson.scheduledDateTime,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isEnrolled,
        canAccess: isEnrolled,
        lesson: isEnrolled ? {
          _id: lesson._id,
          title: lesson.title,
          liveStatus: lesson.liveStatus,
          scheduledDateTime: lesson.scheduledDateTime,
          jitsiRoomName: lesson.jitsiRoomName,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Error verifying enrollment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify enrollment' },
      { status: 500 }
    );
  }
}
