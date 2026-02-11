import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { Category, Course } from '@/lib/mongodb/models';

// GET /api/courses/categories - Get all active categories with course counts
export async function GET() {
  try {
    await connectDB();
    
    // Get all active categories
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    
    // Get course counts for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const courseCount = await Course.countDocuments({
          category: category.slug,
          isPublished: true,
        });
        
        return {
          _id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          color: category.color,
          courseCount,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
