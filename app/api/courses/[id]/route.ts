import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';
import { Types } from 'mongoose';

// GET /api/courses/[id] - Get single course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }
    
    // Get session for enrollment check
    const session = await getServerSession(authOptions);
    
    // Build query
    const query: any = { _id: id };
    
    // If not admin/instructor, only show published courses
    if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      query.isPublished = true;
    }
    
    const course = await Course.findOne(query)
      .populate('instructorId', 'name avatar instructorProfile')
      .lean();
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if user is enrolled
    let enrollment = null;
    if (session?.user?.id) {
      enrollment = await Enrollment.findOne({
        userId: session.user.id,
        courseId: id,
        status: { $in: ['active', 'completed'] },
      }).lean();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...course,
        isEnrolled: !!enrollment,
        enrollment,
      },
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update course (instructor/admin only)
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
    
    // Check authorization
    const userRole = session.user.role as UserRole;
    if (!['instructor', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
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
    
    // Check ownership (instructors can only edit their own courses)
    if (userRole === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only edit your own courses' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    console.log('PUT /api/courses/[id] - Request body:', JSON.stringify(body, null, 2));
    console.log('Current course instructorId:', course.instructorId?.toString());
    
    // Remove empty strings for ObjectId fields to prevent cast errors
    if (body.instructorId === '') {
      console.log('Removing empty instructorId');
      delete body.instructorId;
    } else if (body.instructorId) {
      console.log('Updating instructorId to:', body.instructorId);
    }

    
    // Prevent changing slug if course is published
    if (body.slug && body.slug !== course.slug && course.isPublished) {

      return NextResponse.json(
        { success: false, error: 'Cannot change slug of published course' },
        { status: 400 }
      );
    }
    
    // Check if new slug is unique
    if (body.slug && body.slug !== course.slug) {
      const existingCourse = await Course.findOne({ slug: body.slug.toLowerCase() });
      if (existingCourse) {
        return NextResponse.json(
          { success: false, error: 'Course slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update course
    Object.assign(course, body);
    console.log('Course after Object.assign, instructorId:', course.instructorId?.toString());
    
    await course.save();
    console.log('Course saved successfully');
    
    return NextResponse.json({
      success: true,
      data: course,
    });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete course (instructor/admin only)
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
    
    // Check authorization
    const userRole = session.user.role as UserRole;
    if (!['instructor', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
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
    
    // Check ownership (instructors can only delete their own courses)
    if (userRole === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only delete your own courses' },
        { status: 403 }
      );
    }
    
    // Check if course has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ courseId: id });
    if (enrollmentCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete course with active enrollments' },
        { status: 400 }
      );
    }
    
    await Course.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
