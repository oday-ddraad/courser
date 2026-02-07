import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb/connection';
import { Course, User } from '@/lib/mongodb/models';

// GET /api/courses/instructors - Get all instructors with published courses
export async function GET() {
  try {
    await connectDB();
    
    // Get unique instructor IDs from published courses
    const instructorIds = await Course.distinct('instructor', { isPublished: true });
    
    // Fetch instructor details
    const instructors = await User.find(
      { 
        _id: { $in: instructorIds as Types.ObjectId[] },
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
