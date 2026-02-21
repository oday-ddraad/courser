import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Notification } from '@/lib/mongodb/models';
import { Types } from 'mongoose';
import { notificationService } from '@/lib/services/notifications';

// GET /api/courses/[id]/lessons - Get all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const isAuthorized = 
      session.user.role === 'admin' ||
      course.instructorId.toString() === session.user.id ||
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
  { params }: { params: { id: string } }
) {
  try {
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
    
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is the instructor of this course or admin
    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Not your course' },
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
        const enrollments = await Notification.find({ courseId: course._id, status: 'active' }).distinct('userId');
        for (const userId of enrollments) {
          await notificationService.notifyLessonAvailable(
            userId.toString(),
            course._id.toString(),
            course.title.en,
            title.en
          );
        }
      } catch (notifyError) {
        console.error('Failed to send lesson notifications:', notifyError);
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
