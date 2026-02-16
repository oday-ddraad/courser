import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import dbConnect from '@/lib/mongodb/connection';
import Meeting from '@/lib/mongodb/models/Meeting';
import mongoose from 'mongoose';

/**
 * POST /api/jaas/meetings/[id]/end
 * End a meeting (admin or creator only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const meeting = await Meeting.findById(id);

    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check if meeting is already ended
    if (meeting.status !== 'active' || !meeting.isActive) {
      return NextResponse.json(
        { error: 'Meeting is already ended', status: meeting.status },
        { status: 400 }
      );
    }

    // Check if user can end this meeting (must be admin, instructor, or the creator)
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const isAdmin = session.user.role === 'admin';
    const isInstructor = session.user.role === 'instructor';
    const isCreator = meeting.createdBy.toString() === session.user.id;

    if (!isAdmin && !isInstructor && !isCreator) {
      return NextResponse.json(
        { error: 'Only admins, instructors, or the meeting creator can end this meeting' },
        { status: 403 }
      );
    }

    // End the meeting
    await meeting.endMeeting(userId, 'admin_ended');

    return NextResponse.json({
      success: true,
      message: 'Meeting ended successfully',
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        status: meeting.status,
        endedAt: meeting.endedAt,
        endedBy: meeting.endedBy,
        endReason: meeting.endReason,
      },
    });

  } catch (error: any) {
    console.error('Error ending meeting:', error);
    return NextResponse.json(
      { error: 'Failed to end meeting', details: error?.message },
      { status: 500 }
    );
  }
}
