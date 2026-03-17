import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';
import Meeting from '@/lib/mongodb/models/Meeting';
import { Types } from 'mongoose';
import { triggerLiveLessonEnded } from '@/lib/services/pusherNotifications';

// POST /api/courses/[id]/lessons/[lessonId]/end-live - End a live lesson
export async function POST(
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

    // Only admin and instructor can end live lessons
    if (!['admin', 'instructor'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
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

    // Check if user is the instructor of this course or admin
    const isInstructor = course.instructorIds.some(
      (instructorId: Types.ObjectId) => instructorId.toString() === session.user.id
    );
    if (session.user.role === 'instructor' && !isInstructor) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Not your course' },
        { status: 403 }
      );
    }

    const lesson = course.lessons.find((l: any) => l._id.toString() === lessonId);
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if lesson is actually live
    if (lesson.liveStatus !== 'live') {
      return NextResponse.json(
        { success: false, error: 'Lesson is not currently live' },
        { status: 400 }
      );
    }

    // Update lesson status
    lesson.liveStatus = 'ended';
    await course.save();

    // End and delete the meeting data from database
    let meetingEnded = false;
    let meetingDeleted = false;
    try {
      if (lesson.jitsiRoomName) {
        const meeting = await Meeting.findOne({
          roomName: lesson.jitsiRoomName,
          status: 'active',
          isActive: true,
        });

        if (meeting) {
          // End the meeting first
          await meeting.endMeeting(
            new Types.ObjectId(session.user.id),
            'admin_ended'
          );
          meetingEnded = true;
          
          // Delete the meeting data from database (as per myplan.md requirement)
          await Meeting.deleteOne({ _id: meeting._id });
          meetingDeleted = true;
          console.log(`Meeting ${meeting._id} deleted after ending`);
        }
      }
    } catch (meetingError) {
      console.error('Error ending/deleting meeting:', meetingError);
      // Continue even if meeting end/delete fails
    }

    // Notify enrolled students via Pusher (real-time + in-app)
    try {
      const { Enrollment } = await import('@/lib/mongodb/models');
      const enrollments = await Enrollment.find({
        courseId: course._id,
        status: 'active',
      }).select('userId');

      const enrolledStudentIds = enrollments.map((e: any) => e.userId.toString());

      await triggerLiveLessonEnded(enrolledStudentIds, {
        lessonId: lesson._id.toString(),
        lessonTitle: lesson.title.en,
        courseTitle: course.title.en,
        courseSlug: course.slug,
        courseId: course._id.toString(),
      });
    } catch (notifyError) {
      console.error('Failed to send live end notifications:', notifyError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      data: {
        lessonId: lesson._id,
        liveStatus: lesson.liveStatus,
        meetingEnded,
      },
      message: 'Live lesson ended successfully',
    });
  } catch (error: any) {
    console.error('Error ending live lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end live lesson' },
      { status: 500 }
    );
  }
}
