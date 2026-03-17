import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Notification } from '@/lib/mongodb/models';
import { sendPusherNotification } from '@/lib/services/pusherNotifications';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    await connectDB();

    const query: any = { userId: session.user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    // Serialize notifications for JSON response
    const serializedNotifications = notifications.map((notification: any) => ({
      ...notification,
      _id: notification._id.toString(),
      userId: notification.userId.toString(),
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: serializedNotifications,
        unreadCount,
      },
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, type, title, message, data, actionUrl, sendRealtime } = body;

    // Only admins and instructors can create notifications for other users
    if (userId !== session.user.id && !['admin', 'instructor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();

    // Normalize title and message to multilingual objects if plain strings are passed
    const normalizedTitle = typeof title === 'string'
      ? { en: title, de: title, ar: title }
      : title;
    const normalizedMessage = typeof message === 'string'
      ? { en: message, de: message, ar: message }
      : message;

    const notification = await Notification.create({
      userId: userId || session.user.id,
      type,
      title: normalizedTitle,
      message: normalizedMessage,
      data,
      actionUrl,
    });

    // Send real-time notification via Pusher if requested (default: true)
    const shouldSendRealtime = sendRealtime !== false;

    if (shouldSendRealtime) {
      try {
        await sendPusherNotification(userId || session.user.id, {
          notificationId: notification._id.toString(),
          type,
          title: typeof title === 'string' ? title : title.en,
          message: typeof message === 'string' ? message : message.en,
          actionUrl,
          data,
          timestamp: new Date().toISOString(),
        });
      } catch (pusherError) {
        console.error('Failed to send real-time notification via Pusher:', pusherError);
        // Don't fail the API call if Pusher fails
      }
    }

    return NextResponse.json({
      success: true,
      data: notification,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Mark all notifications as read
    const result = await Notification.updateMany(
      { userId: session.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    // Send real-time event to update UI
    try {
      await sendPusherNotification(session.user.id, {
        notificationId: 'all',
        type: 'all_notifications_read',
        title: 'All notifications marked as read',
        message: 'All your notifications have been marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (pusherError) {
      console.error('Failed to send real-time notification via Pusher:', pusherError);
      // Don't fail the API call if Pusher fails
    }

    return NextResponse.json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
