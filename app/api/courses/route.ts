import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, User } from '@/lib/mongodb/models';
import { UserRole } from '@/types/database';
import { Types } from 'mongoose';


// Helper function to apply multilingual fallback
function applyMultilingualFallback(data: any) {
  const result = { ...data };
  
  // If German is empty, fallback to English or Arabic
  if (!result.de || result.de.trim() === '') {
    result.de = result.en || result.ar || '';
  }
  
  // If Arabic is empty, fallback to English or German
  if (!result.ar || result.ar.trim() === '') {
    result.ar = result.en || result.de || '';
  }
  
  // If English is empty, fallback to Arabic or German
  if (!result.en || result.en.trim() === '') {
    result.en = result.ar || result.de || '';
  }
  
  return result;
}

// GET /api/courses - List courses with search and filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
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
    const status = searchParams.get('status'); // 'published' or 'draft'
    const approvalStatus = searchParams.get('approvalStatus'); // 'pending', 'approved', 'rejected'
    const courseType = searchParams.get('courseType'); // 'live' or 'uploaded'
    const myCourses = searchParams.get('myCourses'); // 'true' to show only user's courses
    
    // Build query
    const userRole = session?.user?.role as UserRole;
    const isAdmin = userRole === 'admin';
    const isInstructor = userRole === 'instructor';
    const query: any = {};
    
    // Regular users only see published and approved courses
    if (!isAdmin && !isInstructor) {
      query.isPublished = true;
      query.approvalStatus = 'approved';
    } else if (isInstructor && !isAdmin) {
      // Instructors see their own courses (any status) + published approved courses
      if (myCourses === 'true') {
        query.instructorId = session?.user.id;
      } else {
        query.$or = [
          { instructorId: session?.user.id },
          { isPublished: true, approvalStatus: 'approved' }
        ];
      }
    }
    // Admins can see all courses with optional filters
    
    // Filter by status
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }
    
    // Filter by approval status
    if (approvalStatus && isAdmin) {
      query.approvalStatus = approvalStatus;
    }
    
    // Filter by course type
    if (courseType) {
      query.courseType = courseType;
    }
    
    // Search by text (all languages)
    if (search) {
      query.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.de': { $regex: search, $options: 'i' } },
        { 'title.ar': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { 'description.de': { $regex: search, $options: 'i' } },
        { 'description.ar': { $regex: search, $options: 'i' } },
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
      .populate('approvedBy', 'name')
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
  } catch (error: any) {
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
    const requiredFields = ['slug', 'title', 'description', 'category', 'courseType'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Apply multilingual fallback for title and description
    body.title = applyMultilingualFallback(body.title);
    body.description = applyMultilingualFallback(body.description);
    if (body.content) {
      body.content = applyMultilingualFallback(body.content);
    }
    
    // Check if slug is unique
    const existingCourse = await Course.findOne({ slug: body.slug.toLowerCase() });
    if (existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course slug already exists' },
        { status: 409 }
      );
    }
    
    // Set approval status based on role
    // Admins can create approved courses directly
    // Instructors must submit for approval
    const isAdmin = userRole === 'admin';
    const approvalStatus = isAdmin ? 'approved' : 'pending';
    const approvedBy = isAdmin ? session.user.id : null;
    const approvalDate = isAdmin ? new Date() : null;
    
    // Set initial price to 0 (price will be set after approval)
    const price = isAdmin && body.price ? body.price : 0;
    const priceSetBy = isAdmin && body.price ? session.user.id : null;
    const priceSetAt = isAdmin && body.price ? new Date() : null;
    
    // Admin courses are published immediately, instructor courses need approval first
    const isPublished = isAdmin;
    const publishedAt = isAdmin ? new Date() : null;
    
    // Create default GROUP A
    const defaultGroup = {
      _id: new Types.ObjectId(),
      name: {
        en: 'GROUP A',
        de: 'GRUPPE A',
        ar: 'المجموعة أ',
      },
      description: {
        en: 'Default group for all enrolled students',
        de: 'Standardgruppe für alle eingeschriebenen Studenten',
        ar: 'المجموعة الافتراضية لجميع الطلاب المسجلين',
      },
      lessonIds: [],
      order: 1,
      maxStudents: 100,
      studentIds: [],
      instructorId: session.user.id,
      schedule: [],
      notificationSettings: {
        enabled: true,
        earlyMorningEnabled: true,
        earlyMorningTime: '08:00',
        oneHourEnabled: true,
        notificationTypes: ['email', 'in_app'],
        alertType: body.courseType === 'live' ? 'live_lesson' : 'recorded_lesson',
      },
      createdAt: new Date(),
    };
    
    // Create course with default group
    const course = await Course.create({
      ...body,
      instructorId: session.user.id,
      approvalStatus,
      approvedBy,
      approvalDate,
      price,
      priceSetBy,
      priceSetAt,
      isPublished,
      publishedAt,
      groups: [defaultGroup],
    });


    
    // Update instructor's course count
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { 'instructorProfile.totalCourses': 1 },
    });
    
    return NextResponse.json(
      { success: true, data: course },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }

}
