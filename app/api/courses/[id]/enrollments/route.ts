import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Enrollment, Course } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// GET /api/courses/[id]/enrollments - Get all enrollments for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check authorization (admin or instructor)
    const userRole = session.user.role;
    if (!['admin', 'instructor'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { id } = await params;
    
    // Verify course exists and check ownership
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Instructors can only view their own course enrollments
    const isInstructor = course.instructorIds.some(
      (id: Types.ObjectId) => id.toString() === session.user.id
    );
    if (userRole === 'instructor' && !isInstructor) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Not your course' },
        { status: 403 }
      );
    }

    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build query
    const query: any = { courseId: id };
    
    if (status) {
      query.status = status;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    // Get enrollments with user details
    let enrollmentsQuery = Enrollment.find(query)
      .populate('userId', 'name email avatar isActive')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const enrollments = await enrollmentsQuery.lean();
    
    // Filter by search term if provided
    let filteredEnrollments = enrollments;
    if (search) {
      filteredEnrollments = enrollments.filter((e: any) => {
        const user = e.userId;
        if (!user) return false;
        const searchLower = search.toLowerCase();
        return (
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    const totalCount = await Enrollment.countDocuments(query);
    
    // Calculate statistics
    const stats = await Enrollment.aggregate([
      { $match: { courseId: new Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pendingEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          averageProgress: { $avg: '$progress.completionPercentage' },
        },
      },
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        enrollments: filteredEnrollments,
        course: {
          _id: course._id,
          title: course.title,
          slug: course.slug,
          enrollmentCount: course.enrollmentCount,
        },
        statistics: stats[0] || {
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          pendingEnrollments: 0,
          averageProgress: 0,
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/enrollments - Remove a student from course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admins can remove students
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { enrollmentId } = body;
    
    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete enrollment
    const enrollment = await Enrollment.findByIdAndDelete(enrollmentId);
    
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
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
      message: 'Student removed from course successfully',
    });
  } catch (error) {
    console.error('Error removing enrollment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove student' },
      { status: 500 }
    );
  }
}
