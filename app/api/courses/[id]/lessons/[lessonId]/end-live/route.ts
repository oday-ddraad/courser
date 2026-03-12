import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';
import Meeting from '@/lib/mongodb/models/Meeting';
import { Types } from 'mongoose';
import { notificationService } from '@/lib/services/notifications';

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

    // Notify enrolled students that live lesson ended
    try {
      const { Enrollment, User } = await import('@/lib/mongodb/models');
      const enrollments = await Enrollment.find({
        courseId: course._id,
        status: 'active',
      }).populate('userId', 'name email locale');

      for (const enrollment of enrollments) {
        const student = enrollment.userId as any;
        const locale = student.locale || 'en';
        
        // Create localized notification
        const titles = {
          en: 'Live Lesson Ended',
          de: 'Live-Unterricht beendet',
          ar: 'انتهى الدرس المباشر',
        };
        
        const messages = {
          en: `"${lesson.title.en}" in "${course.title.en}" has ended. Thank you for attending!`,
          de: `"${lesson.title.de || lesson.title.en}" in "${course.title.de || course.title.en}" wurde beendet. Vielen Dank für Ihre Teilnahme!`,
          ar: `"${lesson.title.ar || lesson.title.en}" في "${course.title.ar || course.title.en}" انتهى. شكراً لحضورك!`,
        };

        await notificationService.createNotification({
          userId: student._id.toString(),
          type: 'live_lesson_ended',
          title: titles[locale as keyof typeof titles] || titles.en,
          message: messages[locale as keyof typeof messages] || messages.en,
          data: {
            courseId: course._id.toString(),
            lessonId: lesson._id.toString(),
            courseSlug: course.slug,
          },
          actionUrl: `/${locale}/courses/${course.slug}/lessons/${lesson._id}`,
        });
      }
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
