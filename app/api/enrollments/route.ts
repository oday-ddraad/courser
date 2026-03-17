import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Enrollment, Course, User } from '@/lib/mongodb/models';
import { triggerStudentEnrolled } from '@/lib/services/pusherNotifications';
import { UserRole } from '@/types/database';


// GET /api/enrollments - Get user's enrollments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query
    const query: any = { userId: session.user.id };
    
    if (status) {
      query.status = status;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'courseId',
        select: 'slug title description thumbnail instructorIds level duration price',
        populate: {
          path: 'instructorIds',
          select: 'name avatar',
        },
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    
    const totalCount = await Enrollment.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: enrollments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST /api/enrollments - Create new enrollment (for students) or get instructor enrollments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userRole = session.user.role as UserRole;
    
    // Handle instructor/admin requests (get enrollments for their courses)
    if (['instructor', 'admin'].includes(userRole)) {
      return await handleInstructorEnrollments(request, session);
    }
    
    // Handle student requests (create enrollment)
    await connectDB();
    
    // Check if user's email is verified
    const user = await User.findById(session.user.id).select('emailVerified');
    if (!user?.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before enrolling in courses' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { courseId } = body;
    
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: courseId,
    });
    
    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: session.user.id,
      courseId: courseId,
      status: 'pending',
      enrolledAt: new Date(),
    });
    
    // Notify instructor about new enrollment via Pusher
    try {
      const course = await Course.findById(courseId).populate('instructorIds', 'name');
      const student = await User.findById(session.user.id).select('name');
      
      if (course && student) {
        for (const instructor of course.instructorIds) {
          await triggerStudentEnrolled(instructor._id.toString(), {
            courseId: courseId,
            courseTitle: course.title.en,
            courseSlug: course.slug,
            studentName: student.name || 'A student',
          });
        }
        console.log(`Real-time enrollment notifications sent to ${course.instructorIds.length} instructors`);
      }
    } catch (notifyError) {
      console.error('Failed to send enrollment notification:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: enrollment,
      message: 'Enrollment created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in enrollment POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process enrollment request' },
      { status: 500 }
    );
  }
}

// Helper function to handle instructor enrollments
async function handleInstructorEnrollments(request: NextRequest, session: any) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { courseId } = body;
    
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    // Verify course ownership (instructors can only view their own course enrollments)
    if (session.user.role === 'instructor') {
      const course = await Course.findById(courseId);
      const isInstructor = course?.instructorIds.some(
        (id: any) => id.toString() === session.user.id
      );
      if (!course || !isInstructor) {
        return NextResponse.json(
          { success: false, error: 'Course not found or access denied' },
          { status: 403 }
        );
      }
    }

    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build query
    const query: any = { courseId };
    
    if (status) {
      query.status = status;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const enrollments = await Enrollment.find(query)
      .populate('userId', 'name email avatar')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const totalCount = await Enrollment.countDocuments(query);
    
    // Calculate statistics
    const stats = await Enrollment.aggregate([
      { $match: { courseId: new (await import('mongoose')).Types.ObjectId(courseId) } },
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
          averageProgress: { $avg: '$progress.completionPercentage' },
        },
      },
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        enrollments,
        statistics: stats[0] || {
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
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
