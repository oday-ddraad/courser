import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// GET /api/courses/[id]/progress - Get course progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    // Find enrollment
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
    
    // Get course for total lessons count
    const course = await Course.findById(id).select('lessons').lean();
    const totalLessons = course?.lessons?.length || 0;
    
    return NextResponse.json({
      success: true,
      data: {
        enrollment,
        totalLessons,
        completedLessons: enrollment.progress.completedLessons.length,
        completionPercentage: enrollment.progress.completionPercentage,
        lastAccessedLesson: enrollment.progress.lastAccessedLesson,
        lastAccessedAt: enrollment.progress.lastAccessedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id]/progress - Update course progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { lessonId, action, videoProgress } = body;
    
    if (!lessonId || !Types.ObjectId.isValid(lessonId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lesson ID' },
        { status: 400 }
      );
    }
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: id,
      status: { $in: ['active', 'completed'] },
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }
    
    // Get course for total lessons count
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const totalLessons = course.lessons.length;
    
    // Handle different actions
    switch (action) {
      case 'complete':
        // Mark lesson as completed
        enrollment.completeLesson(new Types.ObjectId(lessonId), totalLessons);
        break;
        
      case 'access':
        // Update last accessed lesson
        enrollment.progress.lastAccessedLesson = new Types.ObjectId(lessonId);
        enrollment.progress.lastAccessedAt = new Date();
        break;
        
      case 'video-progress':
        // Save video progress (can be used for resume playback)
        enrollment.progress.lastAccessedLesson = new Types.ObjectId(lessonId);
        enrollment.progress.lastAccessedAt = new Date();
        // Video progress can be stored in a separate field if needed
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    await enrollment.save();
    
    return NextResponse.json({
      success: true,
      data: {
        enrollment,
        totalLessons,
        completedLessons: enrollment.progress.completedLessons.length,
        completionPercentage: enrollment.progress.completionPercentage,
        lastAccessedLesson: enrollment.progress.lastAccessedLesson,
        lastAccessedAt: enrollment.progress.lastAccessedAt,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
