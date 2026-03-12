import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment, User } from '@/lib/mongodb/models';
import Meeting from '@/lib/mongodb/models/Meeting';
import { Types } from 'mongoose';
import { notificationService } from '@/lib/services/notifications';
import { jaasService } from '@/lib/services/jaas';

// POST /api/courses/[id]/lessons/[lessonId]/start-live - Start a live lesson
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

    // Only admin and instructor can start live lessons
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

    // Check if lesson is already live
    if (lesson.liveStatus === 'live') {
      return NextResponse.json(
        { success: false, error: 'Lesson is already live' },
        { status: 400 }
      );
    }

    // Generate Jitsi room name if not exists
    if (!lesson.jitsiRoomName) {
      lesson.jitsiRoomName = jaasService.generateRoomName(course.slug, lessonId);
    }

    // Update lesson status
    lesson.liveStatus = 'live';
    lesson.liveStartedAt = new Date();
    lesson.liveStartedBy = new Types.ObjectId(session.user.id);
    lesson.isLiveStream = true;

    await course.save();

    // Create or update meeting in database with JWT token
    let meeting = null;
    let jwtToken = null;
    try {
      // Check if there's already an active meeting for this lesson
      meeting = await Meeting.findOne({
        roomName: lesson.jitsiRoomName,
        status: 'active',
        isActive: true,
      });

      // Get user for JWT generation
      const user = await User.findById(session.user.id);
      if (user) {
        let jaasUserId = user.jaasUserId;
        if (!jaasUserId) {
          jaasUserId = jaasService.generateJaaSUserId(user._id.toString());
          user.jaasUserId = jaasUserId;
          await user.save();
        }

        // Generate JWT token for instructor (moderator)
        jwtToken = jaasService.generateJWTToken(
          user._id.toString(),
          jaasUserId,
          user.name || 'Instructor',
          user.email || '',
          true // isModerator
        );

        if (!meeting) {
          // Create new meeting
          meeting = new Meeting({
            roomName: lesson.jitsiRoomName,
            courseSlug: course.slug,
            lessonId: lesson._id.toString(),
            createdBy: new Types.ObjectId(session.user.id),
            status: 'active',
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            participants: [new Types.ObjectId(session.user.id)],
            maxParticipants: 100,
            jwtToken: jwtToken,
            meetingUrl: jaasService.getMeetingUrl(lesson.jitsiRoomName),
            isActive: true,
            // settings is not required in schema, omit it
          });
          await meeting.save();
          console.log('Meeting created successfully:', meeting._id);
        } else {
          // Update existing meeting with new JWT
          meeting.jwtToken = jwtToken;
          meeting.startedAt = new Date();
          meeting.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          meeting.isActive = true;
          meeting.status = 'active';
          await meeting.save();
          console.log('Meeting updated successfully:', meeting._id);
        }
      }
    } catch (meetingError) {
      console.error('Error creating/updating meeting:', meetingError);
      // Log full error details
      if (meetingError instanceof Error) {
        console.error('Error details:', meetingError.message, meetingError.stack);
      }
      // Don't fail the request if meeting creation fails
    }

    // Notify enrolled students
    try {
      const enrollments = await Enrollment.find({
        courseId: course._id,
        status: 'active',
      }).populate('userId', 'name email locale');

      for (const enrollment of enrollments) {
        const student = enrollment.userId as any;
        const locale = student.locale || 'en';
        
        // Create localized notification
        const titles = {
          en: 'Live Lesson Started!',
          de: 'Live-Unterricht hat begonnen!',
          ar: 'بدأ الدرس المباشر!',
        };
        
        const messages = {
          en: `"${lesson.title.en}" in "${course.title.en}" is now live. Click to join!`,
          de: `"${lesson.title.de || lesson.title.en}" in "${course.title.de || course.title.en}" ist jetzt live. Klicken Sie, um beizutreten!`,
          ar: `"${lesson.title.ar || lesson.title.en}" في "${course.title.ar || course.title.en}" مباشر الآن. انقر للانضمام!`,
        };

        await notificationService.createNotification({
          userId: student._id.toString(),
          type: 'live_lesson_started',
          title: titles[locale as keyof typeof titles] || titles.en,
          message: messages[locale as keyof typeof messages] || messages.en,
          data: {
            courseId: course._id.toString(),
            lessonId: lesson._id.toString(),
            courseSlug: course.slug,
            jitsiRoomName: lesson.jitsiRoomName,
          },
          actionUrl: `/${locale}/courses/${course.slug}/lessons/${lesson._id}`,
        });
      }
    } catch (notifyError) {
      console.error('Failed to send live start notifications:', notifyError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      data: {
        lessonId: lesson._id,
        liveStatus: lesson.liveStatus,
        jitsiRoomName: lesson.jitsiRoomName,
        liveStartedAt: lesson.liveStartedAt,
      },
      message: 'Live lesson started successfully',
    });
  } catch (error: any) {
    console.error('Error starting live lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start live lesson' },
      { status: 500 }
    );
  }
}
