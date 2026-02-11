import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import Course from '@/lib/mongodb/models/Course';
import connectToDatabase from '@/lib/mongodb/connection';
import { Types } from 'mongoose';

// POST /api/courses/[id]/groups/[groupId]/assign - Assign students to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id, groupId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !hasPermission(session.user.role, 'course.manage')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid studentIds' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Find the group
    const groupIndex = course.groups.findIndex(
      (g: any) => g._id.toString() === groupId
    );

    if (groupIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    const group = course.groups[groupIndex];

    // Check if group is full
    if (studentIds.length > group.maxStudents) {
      return NextResponse.json(
        { success: false, error: `Group can only have ${group.maxStudents} students` },
        { status: 400 }
      );
    }

    // Convert studentIds to ObjectIds
    const studentObjectIds = studentIds.map((sid: string) => new Types.ObjectId(sid));

    // Update group's studentIds
    course.groups[groupIndex].studentIds = studentObjectIds;
    
    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Students assigned successfully',
      data: {
        groupId,
        studentCount: studentIds.length,
      },
    });
  } catch (error) {
    console.error('Error assigning students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign students' },
      { status: 500 }
    );
  }
}
