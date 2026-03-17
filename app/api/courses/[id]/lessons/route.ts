import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Notification, Enrollment, User } from '@/lib/mongodb/models';
import { Types } from 'mongoose';
import { createInAppNotification } from '@/lib/services/pusherNotifications';
import { notificationWorker } from '@/lib/services/notificationWorker';

// GET /api/courses/[id]/lessons - Get all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Check authorization
    const isInstructor = course.instructorIds.some(
      (instructorId: Types.ObjectId) => instructorId.toString() === session.user.id
    );
    const isAuthorized = 
      session.user.role === 'admin' ||
      isInstructor ||
      (course.approvalStatus === 'approved' && course.isPublished);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // For students, only return published lessons
    const isStudent = session.user.role === 'user';
    const lessons = isStudent 
      ? course.lessons.filter((l: any) => l.isPublished)
      : course.lessons;

    return NextResponse.json({
      success: true,
      data: lessons,
    });
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/lessons - Add new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can add lessons
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

    // Instructors can only add lessons if course is pending or rejected
    // Once approved, only admin can add lessons
    if (session.user.role === 'instructor' && course.approvalStatus === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Cannot add lessons after course is approved' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title?.en) {
      return NextResponse.json(
        { success: false, error: 'Lesson title in English is required' },
        { status: 400 }
      );
    }

    // Apply multilingual fallback
    const title = {
      en: body.title.en,
      de: body.title.de || body.title.en,
      ar: body.title.ar || body.title.en,
    };

    const description = {
      en: body.description?.en || '',
      de: body.description?.de || body.description?.en || '',
      ar: body.description?.ar || body.description?.en || '',
    };

    // Extract YouTube video ID if provided
    let youtubeVideoId = null;
    if (body.youtubeUrl) {
      const match = body.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      youtubeVideoId = match ? match[1] : null;
    }

    // Create new lesson
    const newLesson = {
      _id: new Types.ObjectId(),
      order: course.lessons.length + 1,
      title,
      description,
      content: {
        en: body.content?.en || '',
        de: body.content?.de || body.content?.en || '',
        ar: body.content?.ar || body.content?.en || '',
      },
      videoUrl: body.videoUrl || null,
      youtubeVideoId,
      duration: body.duration || 0,
      isLiveStream: body.isLiveStream || false,
      scheduledDateTime: body.scheduledDateTime || null,
      jitsiRoomName: body.jitsiRoomName || null,
      resources: body.resources || [],
      googleDriveLinks: body.googleDriveLinks || [],
      isPreview: body.isPreview || false,
      isPublished: body.isPublished || false,
      createdAt: new Date(),
    };

    course.lessons.push(newLesson);
    await course.save();

    // Notify enrolled students if lesson is published immediately
    if (newLesson.isPublished && course.approvalStatus === 'approved') {
      try {
        const enrollments = await Enrollment.find({ courseId: course._id, status: 'active' }).select('userId');
        for (const enrollment of enrollments) {
          await createInAppNotification({
            userId: enrollment.userId.toString(),
            type: 'lesson_available',
            title: {
              en: `New Lesson Available: ${title.en}`,
              de: `Neue Lektion verfügbar: ${title.de || title.en}`,
              ar: `درس جديد متاح: ${title.ar || title.en}`,
            },
            message: {
              en: `A new lesson "${title.en}" is now available in "${course.title.en}"`,
              de: `Eine neue Lektion "${title.de || title.en}" ist jetzt in "${course.title.de || course.title.en}" verfügbar`,
              ar: `درس جديد "${title.ar || title.en}" متاح الآن في "${course.title.ar || course.title.en}"`,
            },
            data: {
              courseId: course._id.toString(),
              lessonId: newLesson._id.toString(),
              courseSlug: course.slug,
            },
            actionUrl: `/courses/${course.slug}/lessons/${newLesson._id}`,
            sendRealtime: true,
          });
        }
      } catch (notifyError) {
        console.error('Failed to send lesson notifications:', notifyError);
      }
    }

    // Schedule reminder notifications for live lessons with scheduledDateTime
    if (newLesson.isLiveStream && newLesson.scheduledDateTime) {
      try {
        const scheduledTime = new Date(newLesson.scheduledDateTime);
        const enrollments = await Enrollment.find({
          courseId: course._id,
          status: 'active',
        }).populate('userId', 'name email locale');

        // Schedule reminders for each enrolled student
        for (const enrollment of enrollments) {
          const student = enrollment.userId as any;
          const locale = student.locale || 'en';
          const userId = student._id.toString();

          // 30 minutes before - Student reminder
          const reminder30min = new Date(scheduledTime.getTime() - 30 * 60000);
          if (reminder30min > new Date()) {
            await notificationWorker.scheduleNotification({
              userId,
              type: 'live_lesson_reminder',
              title: {
                en: 'Live Lesson Starting Soon',
                de: 'Live-Unterricht beginnt bald',
                ar: 'الدرس المباشر سيبدأ قريباً',
              },
              message: {
                en: `"${title.en}" starts in 30 minutes. Get ready!`,
                de: `"${title.de || title.en}" beginnt in 30 Minuten. Bereiten Sie sich vor!`,
                ar: `"${title.ar || title.en}" يبدأ خلال 30 دقيقة. استعد!`,
              },
              sendAt: reminder30min,
              actionUrl: `/${locale}/courses/${course.slug}/lessons/${newLesson._id}`,
              data: {
                courseId: course._id.toString(),
                lessonId: newLesson._id.toString(),
                scheduledTime: scheduledTime.toISOString(),
              },
              lessonId: newLesson._id.toString(),
              courseId: course._id.toString(),
            });
          }

          // 5 minutes before - Final reminder
          const reminder5min = new Date(scheduledTime.getTime() - 5 * 60000);
          if (reminder5min > new Date()) {
            await notificationWorker.scheduleNotification({
              userId,
              type: 'live_lesson_final_reminder',
              title: {
                en: 'Live Lesson Starting in 5 Minutes',
                de: 'Live-Unterricht beginnt in 5 Minuten',
                ar: 'الدرس المباشر يبدأ خلال 5 دقائق',
              },
              message: {
                en: `"${title.en}" starts in 5 minutes. Join now!`,
                de: `"${title.de || title.en}" beginnt in 5 Minuten. Treten Sie jetzt bei!`,
                ar: `"${title.ar || title.en}" يبدأ خلال 5 دقائق. انضم الآن!`,
              },
              sendAt: reminder5min,
              actionUrl: `/${locale}/courses/${course.slug}/lessons/${newLesson._id}`,
              data: {
                courseId: course._id.toString(),
                lessonId: newLesson._id.toString(),
                scheduledTime: scheduledTime.toISOString(),
              },
              lessonId: newLesson._id.toString(),
              courseId: course._id.toString(),
            });
          }
        }

        // Schedule instructor reminders
        for (const instructorId of course.instructorIds) {
          const instructor = await User.findById(instructorId);
          if (instructor) {
            const locale = instructor.locale || 'en';
            const userId = instructor._id.toString();

            // 15 minutes before - Instructor reminder
            const reminder15min = new Date(scheduledTime.getTime() - 15 * 60000);
            if (reminder15min > new Date()) {
              await notificationWorker.scheduleNotification({
                userId,
                type: 'live_lesson_instructor_reminder',
                title: {
                  en: 'Your Live Lesson Starts in 15 Minutes',
                  de: 'Ihr Live-Unterricht beginnt in 15 Minuten',
                  ar: 'درسك المباشر يبدأ خلال 15 دقيقة',
                },
                message: {
                  en: `"${title.en}" starts in 15 minutes. Prepare to go live!`,
                  de: `"${title.de || title.en}" beginnt in 15 Minuten. Bereiten Sie sich vor, live zu gehen!`,
                  ar: `"${title.ar || title.en}" يبدأ خلال 15 دقيقة. استعد للبث المباشر!`,
                },
                sendAt: reminder15min,
                actionUrl: `/${locale}/dashboard/instructor/courses/${course.slug}/lessons`,
                data: {
                  courseId: course._id.toString(),
                  lessonId: newLesson._id.toString(),
                  scheduledTime: scheduledTime.toISOString(),
                },
                lessonId: newLesson._id.toString(),
                courseId: course._id.toString(),
              });
            }
          }
        }

        console.log(`Scheduled reminders for lesson ${newLesson._id}`);
      } catch (scheduleError) {
        console.error('Failed to schedule lesson reminders:', scheduleError);
        // Don't fail the request if scheduling fails
      }
    }

    return NextResponse.json({
      success: true,
      data: newLesson,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
