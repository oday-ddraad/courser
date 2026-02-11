import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/permissions';
import Course from '@/lib/mongodb/models/Course';
import connectToDatabase from '@/lib/mongodb/connection';
import { Types } from 'mongoose';

// PUT /api/courses/[id]/groups/[groupId] - Update a group
export async function PUT(
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
    const { name, maxStudents, instructor, schedule, notificationSettings } = body;

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

    // Update group fields
    if (name) {
      course.groups[groupIndex].name = {
        en: name,
        de: name,
        ar: name,
      };
    }
    if (maxStudents) course.groups[groupIndex].maxStudents = maxStudents;
    if (instructor !== undefined) course.groups[groupIndex].instructorId = instructor || null;
    if (schedule) course.groups[groupIndex].schedule = schedule;
    if (notificationSettings) {
      course.groups[groupIndex].notificationSettings = {
        ...course.groups[groupIndex].notificationSettings,
        ...notificationSettings,
      };
    }

    await course.save();

    return NextResponse.json({
      success: true,
      data: course.groups[groupIndex],
      message: 'Group updated successfully',
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/groups/[groupId] - Delete a group
export async function DELETE(
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

    await connectToDatabase();

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Remove the group
    course.groups = course.groups.filter(
      (g: any) => g._id.toString() !== groupId
    );

    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
