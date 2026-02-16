import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { jaasService } from '@/lib/services/jaas';
import dbConnect from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';
import Meeting from '@/lib/mongodb/models/Meeting';

/**
 * POST /api/jaas/meetings
 * Create a new JaaS meeting
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!jaasService.isConfigured()) {
      const config = jaasService.getConfig();
      return NextResponse.json({ 
        error: 'JaaS not configured',
        details: {
          hasAppId: !!config.appId,
          hasPrivateKey: !!config.privateKey,
        }
      }, { status: 503 });
    }

    const body = await request.json();
    const { courseSlug, lessonId, maxParticipants, expiresInHours = 24 } = body;

    if (!courseSlug || !lessonId) {
      return NextResponse.json({ error: 'Missing courseSlug or lessonId' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or instructor
    const isModerator = user.role === 'admin' || user.role === 'instructor';
    if (!isModerator) {
      return NextResponse.json({ error: 'Only admins and instructors can create meetings' }, { status: 403 });
    }

    let jaasUserId = user.jaasUserId;
    if (!jaasUserId) {
      jaasUserId = jaasService.generateJaaSUserId(user._id.toString());
      user.jaasUserId = jaasUserId;
      await user.save();
    }

    const roomName = jaasService.generateRoomName(courseSlug, lessonId);
    const meetingUrl = jaasService.getMeetingUrl(roomName);
    const config = jaasService.getConfig();
    
    // Generate JWT token
    let jwt: string;
    try {
      jwt = jaasService.generateJWTToken(
        user._id.toString(),
        jaasUserId,
        user.name,
        user.email,
        isModerator
      );
    } catch (error: any) {
      console.error('JWT generation error:', error);
      return NextResponse.json({ 
        error: 'Failed to generate JWT',
        details: error.message 
      }, { status: 500 });
    }

    // Validate the token structure
    const validation = jaasService.validateToken(jwt);
    if (!validation.valid) {
      console.error('Token validation failed:', validation.error);
      return NextResponse.json({ 
        error: 'Token validation failed', 
        details: validation.error 
      }, { status: 500 });
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Check if an active meeting already exists for this room
    const existingMeeting = await Meeting.findOne({
      roomName,
      status: 'active',
      isActive: true,
    });

    if (existingMeeting) {
      // If meeting exists and user is the creator, return existing meeting
      if (existingMeeting.createdBy.toString() === user._id.toString()) {
        return NextResponse.json({
          success: true,
          meeting: {
            id: existingMeeting._id,
            roomName: existingMeeting.roomName,
            meetingUrl: existingMeeting.meetingUrl,
            jwt,
            status: existingMeeting.status,
            expiresAt: existingMeeting.expiresAt,
            isModerator: true,
            courseSlug,
            lessonId,
            createdBy: user._id.toString(),
            createdAt: existingMeeting.createdAt,
          },
          message: 'Existing active meeting returned',
        });
      }
      
      // If another admin created it, return error
      return NextResponse.json({ 
        error: 'An active meeting already exists for this room',
        existingMeeting: {
          createdBy: existingMeeting.createdBy,
          startedAt: existingMeeting.startedAt,
        }
      }, { status: 409 });
    }

    // Create new meeting record
    const meeting = await Meeting.create({
      roomName,
      courseSlug,
      lessonId,
      createdBy: user._id,
      status: 'active',
      startedAt: new Date(),
      expiresAt,
      participants: [user._id],
      maxParticipants: maxParticipants || 100,
      jwtToken: jwt,
      meetingUrl,
      isActive: true,
    });

    // Get debug info
    const debug = jaasService.debugToken(jwt);

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        meetingUrl: meeting.meetingUrl,
        jwt,
        status: meeting.status,
        expiresAt: meeting.expiresAt,
        isModerator: true,
        courseSlug: meeting.courseSlug,
        lessonId: meeting.lessonId,
        createdBy: meeting.createdBy.toString(),
        createdAt: meeting.createdAt,
      },
      debug: {
        header: debug.header,
        payload: {
          iss: debug.payload?.iss,
          sub: debug.payload?.sub,
          aud: debug.payload?.aud,
          room: debug.payload?.room,
          user: debug.payload?.context?.user,
        }
      }
    });

  } catch (error: any) {
    console.error('Meeting creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create meeting',
      details: error?.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/jaas/meetings
 * Get meeting information or list active meetings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!jaasService.isConfigured()) {
      return NextResponse.json({ error: 'JaaS not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');
    const listActive = searchParams.get('list') === 'active';

    await dbConnect();

    // List all active meetings for admin
    if (listActive && (session.user.role === 'admin' || session.user.role === 'instructor')) {
      const meetings = await Meeting.find({
        status: 'active',
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
        .populate('createdBy', 'name email')
        .sort({ startedAt: -1 });

      return NextResponse.json({
        success: true,
        meetings: meetings.map(m => ({
          id: m._id,
          roomName: m.roomName,
          courseSlug: m.courseSlug,
          lessonId: m.lessonId,
          status: m.status,
          startedAt: m.startedAt,
          expiresAt: m.expiresAt,
          participantCount: m.participants.length,
          createdBy: m.createdBy,
        })),
      });
    }

    // Get specific meeting by room name
    if (!roomName) {
      return NextResponse.json({ error: 'roomName required or use ?list=active' }, { status: 400 });
    }

    const meeting = await Meeting.findOne({
      roomName,
      status: 'active',
      isActive: true,
    }).populate('createdBy', 'name email');

    if (!meeting) {
      return NextResponse.json({ 
        error: 'Meeting not found or has ended',
        ended: true,
      }, { status: 404 });
    }

    // Check if meeting has expired
    if (new Date() > meeting.expiresAt) {
      await meeting.endMeeting(meeting.createdBy, 'expired');
      return NextResponse.json({ 
        error: 'Meeting has expired',
        ended: true,
        expired: true,
      }, { status: 410 });
    }

    const meetingUrl = jaasService.getMeetingUrl(roomName);

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        meetingUrl,
        status: meeting.status,
        startedAt: meeting.startedAt,
        expiresAt: meeting.expiresAt,
        participantCount: meeting.participants.length,
        maxParticipants: meeting.maxParticipants,
        createdBy: meeting.createdBy,
        isJoinable: meeting.isJoinable(),
      },
    });
  } catch (error: any) {
    console.error('Meeting fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to get meeting',
      details: error?.message 
    }, { status: 500 });
  }
}
