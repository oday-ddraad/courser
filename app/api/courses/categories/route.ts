import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';

// GET /api/courses/categories - Get all unique categories
export async function GET() {
  try {
    await connectDB();
    
    // Get unique categories from published courses
    const categories = await Course.distinct('category', { isPublished: true });
    
    return NextResponse.json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
