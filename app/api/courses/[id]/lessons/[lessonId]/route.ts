import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// PUT /api/courses/[id]/lessons/[lessonId] - Update lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can update lessons
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

    const lesson = course.lessons.find((l: any) => l._id.toString() === params.lessonId);
    if (!lesson) {

      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Update fields
    if (body.title) {
      lesson.title = {
        en: body.title.en || lesson.title.en,
        de: body.title.de || body.title.en || lesson.title.de,
        ar: body.title.ar || body.title.en || lesson.title.ar,
      };
    }

    if (body.description) {
      lesson.description = {
        en: body.description.en || lesson.description.en,
        de: body.description.de || body.description.en || lesson.description.de,
        ar: body.description.ar || body.description.en || lesson.description.ar,
      };
    }

    if (body.content) {
      lesson.content = {
        en: body.content.en || lesson.content.en,
        de: body.content.de || body.content.en || lesson.content.de,
        ar: body.content.ar || body.content.en || lesson.content.ar,
      };
    }

    // Extract YouTube video ID if URL provided
    if (body.youtubeUrl) {
      const match = body.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      lesson.youtubeVideoId = match ? match[1] : null;
    }

    if (body.videoUrl !== undefined) lesson.videoUrl = body.videoUrl;
    if (body.duration !== undefined) lesson.duration = body.duration;
    if (body.isLiveStream !== undefined) lesson.isLiveStream = body.isLiveStream;
    if (body.scheduledDateTime !== undefined) lesson.scheduledDateTime = body.scheduledDateTime;
    if (body.jitsiRoomName !== undefined) lesson.jitsiRoomName = body.jitsiRoomName;
    if (body.resources !== undefined) lesson.resources = body.resources;
    if (body.googleDriveLinks !== undefined) lesson.googleDriveLinks = body.googleDriveLinks;
    if (body.isPreview !== undefined) lesson.isPreview = body.isPreview;
    if (body.isPublished !== undefined) lesson.isPublished = body.isPublished;

    await course.save();

    return NextResponse.json({
      success: true,
      data: lesson,
    });
  } catch (error: any) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/lessons/[lessonId] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can delete lessons
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

    const lessonIndex = course.lessons.findIndex(
      (l: any) => l._id.toString() === params.lessonId
    );

    if (lessonIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Remove lesson
    course.lessons.splice(lessonIndex, 1);

    // Reorder remaining lessons
    course.lessons.forEach((lesson: any, index: number) => {
      lesson.order = index + 1;
    });

    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[id]/lessons/[lessonId] - Quick publish/unpublish toggle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can publish lessons
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
    const lesson = course.lessons.find((l: any) => l._id.toString() === params.lessonId);
    
    if (!lesson) {

      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    if (body.isPublished !== undefined) {
      lesson.isPublished = body.isPublished;
    }

    await course.save();

    return NextResponse.json({
      success: true,
      data: lesson,
    });
  } catch (error: any) {
    console.error('Error updating lesson status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson status' },
      { status: 500 }
    );
  }
}
