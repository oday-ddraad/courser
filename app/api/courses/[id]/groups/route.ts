import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import Course from '@/lib/mongodb/models/Course';
import connectToDatabase from '@/lib/mongodb/connection';

// GET /api/courses/[id]/groups - Get all groups for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !hasPermission(session.user.role, 'course.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const course = await Course.findById(id)

      .populate('groups.studentIds', 'name email')
      .populate('groups.instructorId', 'name email');

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Transform groups to match frontend interface
    const groups = course.groups.map((group: any) => ({
      _id: group._id,
      name: group.name?.en || 'Unnamed Group',
      maxStudents: group.maxStudents,
      students: group.studentIds || [],
      instructor: group.instructorId,
      schedule: group.schedule || [],
      notificationSettings: group.notificationSettings,
    }));

    return NextResponse.json({
      success: true,
      data: groups,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !hasPermission(session.user.role, 'course.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, maxStudents, instructor, schedule, notificationSettings } = body;

    await connectToDatabase();

    const course = await Course.findById(id);


    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Create new group with proper structure
    const newGroup: any = {
      name: {
        en: name,
        de: name,
        ar: name,
      },
      description: {
        en: '',
        de: '',
        ar: '',
      },
      lessonIds: [],
      order: course.groups.length,
      maxStudents: maxStudents || 20,
      studentIds: [],
      instructorId: instructor || null,
      schedule: schedule || [],
      notificationSettings: notificationSettings || {
        enabled: true,
        earlyMorningEnabled: true,
        earlyMorningTime: '08:00',
        oneHourEnabled: true,
        notificationTypes: ['email', 'in_app'],
        alertType: 'live_lesson',
      },
    };

    course.groups.push(newGroup);

    await course.save();

    return NextResponse.json({
      success: true,
      data: newGroup,
      message: 'Group created successfully',
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
