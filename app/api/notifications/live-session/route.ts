import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import dbConnect from '@/lib/mongodb/connection';
import Notification from '@/lib/mongodb/models/Notification';
import { createInAppNotification } from '@/lib/services/pusherNotifications';

/**
 * POST /api/notifications/live-session
 * Create live session notifications for selected users
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { userIds, roomName, courseSlug, lessonId, subject, joinUrl } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (!roomName || !joinUrl) {
      return NextResponse.json(
        { error: 'Room name and join URL are required' },
        { status: 400 }
      );
    }

    const subjectText = subject || 'Live Session';
    const instructorName = session.user.name || 'Instructor';

    // Create notifications for each user with real-time Pusher delivery
    const notifications = await Promise.all(
      userIds.map(async (userId: string) => {
        const notification = await createInAppNotification({
          userId,
          type: 'live_stream_starting',
          title: {
            en: '🔴 Live Session Started!',
            de: '🔴 Live-Sitzung gestartet!',
            ar: '🔴 بدأت الجلسة المباشرة!',
          },
          message: {
            en: `${instructorName} started a live session: ${subjectText}`,
            de: `${instructorName} hat eine Live-Sitzung gestartet: ${subjectText}`,
            ar: `${instructorName} بدأ جلسة مباشرة: ${subjectText}`,
          },
          data: {
            roomName,
            courseSlug,
            lessonId,
            subject: subjectText,
            joinUrl,
            instructorName,
            startedAt: new Date().toISOString(),
          },
          actionUrl: joinUrl,
          sendRealtime: true,
        });
        return notification;
      })
    );

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${userIds.length} user(s)`,
      notificationIds: notifications.map((n: any) => n._id.toString()),
    });

  } catch (error) {
    console.error('Error creating live session notifications:', error);
    return NextResponse.json(
      { error: 'Failed to create notifications' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/live-session
 * Get active live session notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get unread live stream notifications from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const notifications = await Notification.find({
      userId: session.user.id,
      type: 'live_stream_starting',
      isRead: false,
      createdAt: { $gte: twoHoursAgo },
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n: any) => ({
        ...n,
        _id: n._id.toString(),
      })),
    });

  } catch (error) {
    console.error('Error fetching live session notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
