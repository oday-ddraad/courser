import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, User } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';


// GET /api/courses - List courses with search and filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const locale = searchParams.get('locale') || 'en';
    
    // Build query
    const query: any = { isPublished: true };
    
    // Search by text (multi-language)
    if (search) {
      query.$or = [
        { [`title.${locale}`]: { $regex: search, $options: 'i' } },
        { [`description.${locale}`]: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    
    // Filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (rating) query.rating = { $gte: parseInt(rating) };
    
    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const courses = await Course.find(query)
      .populate('instructorId', 'name avatar instructorProfile')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCount = await Course.countDocuments(query);

    
    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create new course (instructor/admin only)
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
    
    // Check authorization
    const userRole = session.user.role as UserRole;
    if (!['instructor', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }
    
    await connectDB();

    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['slug', 'title', 'description', 'price', 'level', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if slug is unique
    const existingCourse = await Course.findOne({ slug: body.slug.toLowerCase() });
    if (existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course slug already exists' },
        { status: 409 }
      );
    }
    
    // Create course
    const course = await Course.create({
      ...body,
      instructorId: session.user.id,
      isPublished: body.isPublished || false,
    });
    
    // Update instructor's course count
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { 'instructorProfile.totalCourses': 1 },
    });
    
    return NextResponse.json(
      { success: true, data: course },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
