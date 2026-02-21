import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// GET /api/courses/[id]/groups - Get all groups for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized (admin, instructor of this course, or enrolled student)
    const isAuthorized = 
      session.user.role === 'admin' ||
      course.instructorId.toString() === session.user.id ||
      course.groups.some((group: any) => 
        group.studentIds.includes(session.user.id)
      );

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course.groups,
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/groups - Create a new group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can create groups
    if (!['admin', 'instructor'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is the instructor of this course or admin
    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Not your course' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name?.en) {
      return NextResponse.json(
        { success: false, error: 'Group name in English is required' },
        { status: 400 }
      );
    }

    // Create new group
    const newGroup = {
      _id: new Types.ObjectId(),
      name: {
        en: body.name.en,
        de: body.name.de || body.name.en,
        ar: body.name.ar || body.name.en,
      },
      description: {
        en: body.description?.en || '',
        de: body.description?.de || body.description?.en || '',
        ar: body.description?.ar || body.description?.en || '',
      },
      lessonIds: [],
      order: course.groups.length + 1,
      maxStudents: body.maxStudents || 20,
      studentIds: [],
      instructorId: session.user.id,
      schedule: body.schedule || [],
      notificationSettings: {
        enabled: body.notificationSettings?.enabled ?? true,
        earlyMorningEnabled: body.notificationSettings?.earlyMorningEnabled ?? true,
        earlyMorningTime: body.notificationSettings?.earlyMorningTime || '08:00',
        oneHourEnabled: body.notificationSettings?.oneHourEnabled ?? true,
        notificationTypes: body.notificationSettings?.notificationTypes || ['email', 'in_app'],
        alertType: 'live_lesson',
      },
      createdAt: new Date(),
    };

    course.groups.push(newGroup);
    await course.save();

    return NextResponse.json({
      success: true,
      data: newGroup,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
