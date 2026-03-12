import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course } from '@/lib/mongodb/models';
import { Types } from 'mongoose';

// PUT /api/courses/[id]/groups/[groupId] - Update a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id, groupId } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can update groups
    if (!['admin', 'instructor'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is the instructor of this course or admin
    const isInstructor = course.instructorIds.some(
      (instructorId: Types.ObjectId) => instructorId.toString() === session.user.id
    );
    if (session.user.role === 'instructor' && !isInstructor) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Not your course' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Find the group index
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
    const group = course.groups[groupIndex];
    
    if (body.name) {
      group.name = {
        en: body.name.en || group.name.en,
        de: body.name.de || group.name.de || body.name.en,
        ar: body.name.ar || group.name.ar || body.name.en,
      };
    }

    if (body.description) {
      group.description = {
        en: body.description.en || group.description.en,
        de: body.description.de || group.description.de || group.description.en,
        ar: body.description.ar || group.description.ar || group.description.en,
      };
    }

    if (body.maxStudents !== undefined) {
      group.maxStudents = body.maxStudents;
    }

    if (body.schedule) {
      group.schedule = body.schedule;
    }

    if (body.notificationSettings) {
      group.notificationSettings = {
        ...group.notificationSettings,
        ...body.notificationSettings,
      };
    }

    await course.save();

    return NextResponse.json({
      success: true,
      data: group,
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can delete groups
    if (!['admin', 'instructor'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is the instructor of this course or admin
    const isInstructor = course.instructorIds.some(
      (instructorId: Types.ObjectId) => instructorId.toString() === session.user.id
    );
    if (session.user.role === 'instructor' && !isInstructor) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Not your course' },
        { status: 403 }
      );
    }

    // Prevent deletion of default GROUP A
    const group = course.groups.find((g: any) => g._id.toString() === groupId);
    if (group && group.name.en === 'GROUP A') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default GROUP A' },
        { status: 400 }
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
