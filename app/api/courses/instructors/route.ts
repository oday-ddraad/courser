import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

import connectDB from '@/lib/mongodb/connection';
import { Course, User } from '@/lib/mongodb/models';

// GET /api/courses/instructors - Get all instructors with published courses
// GET /api/courses/instructors?all=true - Get all instructors (admin only)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    
    let instructorIds: Types.ObjectId[] = [];
    
    if (all) {
      // Check if user is admin
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
      // Get all instructor IDs (not just those with published courses)
      instructorIds = await User.distinct('_id', { role: 'instructor' }) as Types.ObjectId[];
    } else {
      // Get unique instructor IDs from published courses
      instructorIds = await Course.distinct('instructor', { isPublished: true }) as Types.ObjectId[];
    }
    
    // Fetch instructor details
    const instructors = await User.find(
      { 
        _id: { $in: instructorIds },
        role: 'instructor',
        isActive: true 
      },
      {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
        'instructorProfile.bio': 1,
        'instructorProfile.specialization': 1,
        'instructorProfile.rating': 1,
        'instructorProfile.totalStudents': 1,
        'instructorProfile.totalCourses': 1,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      data: instructors,
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}
