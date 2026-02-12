import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import dbConnect from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import mongoose from 'mongoose';

// GET /api/courses/[id]/progress - Get user's progress for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: id,
    }).lean();


    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollment.progress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id]/progress - Update lesson progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { lessonId, completed, watchTime, totalDuration } = body;

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: id,
    });


    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    // Get course to calculate total lessons
    const course = await Course.findById(id).lean();
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const totalLessons = course.lessons?.length || 0;

    // Update progress
    if (completed) {
      // Add to completed lessons if not already there
      const lessonObjectId = new mongoose.Types.ObjectId(lessonId);
      const alreadyCompleted = enrollment.progress.completedLessons.some(
        (id: mongoose.Types.ObjectId) => id.toString() === lessonId
      );

      if (!alreadyCompleted) {
        enrollment.progress.completedLessons.push(lessonObjectId);
      }
    }

    // Update last accessed lesson
    enrollment.progress.lastAccessedLesson = new mongoose.Types.ObjectId(lessonId);
    enrollment.progress.lastAccessedAt = new Date();

    // Update watch time if provided
    if (watchTime && totalDuration) {
      const existingWatchTime = enrollment.progress.lessonWatchTimes.find(
        (wt: { lessonId: mongoose.Types.ObjectId }) => wt.lessonId.toString() === lessonId
      );

      if (existingWatchTime) {
        existingWatchTime.watchTime = Math.max(existingWatchTime.watchTime, watchTime);
        existingWatchTime.percentage = Math.min(100, Math.round((watchTime / totalDuration) * 100));
        existingWatchTime.lastUpdated = new Date();
      } else {
        enrollment.progress.lessonWatchTimes.push({
          lessonId: new mongoose.Types.ObjectId(lessonId),
          watchTime,
          percentage: Math.min(100, Math.round((watchTime / totalDuration) * 100)),
          lastUpdated: new Date(),
        });
      }
    }

    // Calculate completion percentage
    const completedCount = enrollment.progress.completedLessons.length;
    enrollment.progress.completionPercentage = totalLessons > 0 
      ? Math.round((completedCount / totalLessons) * 100) 
      : 0;

    // Check if course is completed
    if (enrollment.progress.completionPercentage >= 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    return NextResponse.json({
      success: true,
      data: enrollment.progress,
      message: 'Progress updated successfully',
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
