import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// POST /api/courses/[id]/enroll - Enroll in a course
export async function POST(
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
    
    // Find course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if course is published
    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Course is not available' },
        { status: 400 }
      );
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: id,
    });
    
    if (existingEnrollment) {
      if (existingEnrollment.status === 'active' || existingEnrollment.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Already enrolled in this course' },
          { status: 409 }
        );
      }
      
      // Reactivate cancelled/pending enrollment
      if (existingEnrollment.status === 'cancelled' || existingEnrollment.status === 'pending') {
        existingEnrollment.status = 'active';
        await existingEnrollment.save();
        
        // Update course enrollment count
        course.enrollmentCount += 1;
        await course.save();
        
        return NextResponse.json({
          success: true,
          data: existingEnrollment,
          message: 'Enrollment reactivated',
        });
      }
    }
    
    // Create new enrollment
    const enrollment = await Enrollment.create({
      userId: session.user.id,
      courseId: id,
      status: 'active',
      progress: {
        completedLessons: [],
        completionPercentage: 0,
      },
    });
    
    // Update course enrollment count
    course.enrollmentCount += 1;
    await course.save();
    
    return NextResponse.json({
      success: true,
      data: enrollment,
      message: 'Successfully enrolled in course',
    }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// GET /api/courses/[id]/enroll - Check enrollment status
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
    
    return NextResponse.json({
      success: true,
      data: {
        isEnrolled: !!enrollment && (enrollment.status === 'active' || enrollment.status === 'completed'),
        enrollment,
      },
    });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check enrollment status' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/enroll - Unenroll from course
export async function DELETE(
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
    
    // Find and update enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      {
        userId: session.user.id,
        courseId: id,
        status: { $in: ['active', 'pending'] },
      },
      {
        status: 'cancelled',
      },
      { new: true }
    );
    
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found or already cancelled' },
        { status: 404 }
      );
    }
    
    // Update course enrollment count
    const course = await Course.findById(id);
    if (course && course.enrollmentCount > 0) {
      course.enrollmentCount -= 1;
      await course.save();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from course',
    });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unenroll from course' },
      { status: 500 }
    );
  }
}
