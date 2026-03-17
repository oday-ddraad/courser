import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import pusher from '@/lib/pusher/server';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.formData();
    const socketId = body.get('socket_id') as string;
    const channel = body.get('channel_name') as string;

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    // Verify user can access this channel
    // Channel format: private-user-{userId}
    const expectedChannel = `private-user-${session.user.id}`;
    if (channel !== expectedChannel) {
      return NextResponse.json(
        { error: 'Forbidden - cannot access this channel' },
        { status: 403 }
      );
    }

    // Authorize the channel
    const auth = pusher.authorizeChannel(socketId, channel);

    return NextResponse.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
