import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import Meeting from '@/lib/mongodb/models/Meeting';
import { Types } from 'mongoose';

// GET /api/courses/[id]/lessons/[lessonId]/live-status - Check if lesson is live
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
    
    // Use lean() to get fresh data without Mongoose caching
    const course = await Course.findById(id).lean();
    
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

    // Check if user is enrolled or is instructor/admin
    const isAdmin = session.user.role === 'admin';
    const isInstructor = course.instructorIds.some(
      (instructorId: Types.ObjectId) => instructorId.toString() === session.user.id
    );
    
    let isEnrolled = false;
    if (!isAdmin && !isInstructor) {
      const enrollment = await Enrollment.findOne({
        userId: session.user.id,
        courseId: course._id,
        status: 'active',
      });
      isEnrolled = !!enrollment;
    }

    // Check for active meeting in database
    let meetingData = null;
    try {
      if (lesson.jitsiRoomName) {
        const meeting = await Meeting.findOne({
          roomName: lesson.jitsiRoomName,
          status: 'active',
          isActive: true,
        }).select('-jwtToken'); // Don't return JWT token for security
        
        if (meeting) {
          meetingData = {
            roomName: meeting.roomName,
            meetingUrl: meeting.meetingUrl,
            startedAt: meeting.startedAt,
            participants: meeting.participants.length,
          };
        }
      }
    } catch (meetingError) {
      console.error('Error fetching meeting data:', meetingError);
      // Continue without meeting data
    }

    // Return live status with meeting info
    return NextResponse.json({
      success: true,
      liveStatus: lesson.liveStatus,
      isLiveStream: lesson.isLiveStream,
      jitsiRoomName: lesson.jitsiRoomName,
      scheduledDateTime: lesson.scheduledDateTime,
      liveStartedAt: lesson.liveStartedAt,
      isEnrolled: isEnrolled || isAdmin || isInstructor,
      meeting: meetingData,
    });
  } catch (error: any) {
    console.error('Error checking live status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check live status' },
      { status: 500 }
    );
  }
}
