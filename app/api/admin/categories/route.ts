import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb/connection';
import { Category, Course } from '@/lib/mongodb/models';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';

// GET /api/admin/categories - Get all categories with course counts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !hasPermission(session.user.role, 'course.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    
    // Get all categories
    const categories = await Category.find().sort({ sortOrder: 1, createdAt: -1 });
    
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
          isActive: category.isActive,
          sortOrder: category.sortOrder,
          courseCount,
          createdAt: category.createdAt?.toISOString(),
          updatedAt: category.updatedAt?.toISOString(),
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

// POST /api/admin/categories - Create a new category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !hasPermission(session.user.role, 'course.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name?.en || !body.slug) {
      return NextResponse.json(
        { success: false, error: 'Name (EN) and slug are required' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: body.slug });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 409 }
      );
    }
    
    const category = await Category.create({
      name: {
        en: body.name.en,
        de: body.name.de || body.name.en,
        ar: body.name.ar || body.name.en,
      },
      slug: body.slug.toLowerCase().replace(/\s+/g, '-'),
      description: {
        en: body.description?.en || '',
        de: body.description?.de || '',
        ar: body.description?.ar || '',
      },
      icon: body.icon || '',
      color: body.color || '#3B82F6',
      isActive: body.isActive !== false,
      sortOrder: body.sortOrder || 0,
    });
    
    // Create response object with serialized values
    const responseData = {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt?.toISOString(),
      updatedAt: category.updatedAt?.toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      data: responseData,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
