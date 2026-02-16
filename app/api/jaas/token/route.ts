import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { jaasService } from '@/lib/services/jaas';
import dbConnect from '@/lib/mongodb/connection';
import User from '@/lib/mongodb/models/User';

export async function GET(request: NextRequest) {
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

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let jaasUserId = user.jaasUserId;
    if (!jaasUserId) {
      jaasUserId = jaasService.generateJaaSUserId(user._id.toString());
      user.jaasUserId = jaasUserId;
      user.jaasTokenGeneratedAt = new Date();
      await user.save();
    }

    const config = jaasService.getConfig();
    const isModerator = user.role === 'admin' || user.role === 'instructor';
    
    let token: string;
    try {
      token = jaasService.generateJWTToken(
        user._id.toString(),
        jaasUserId,
        user.name,
        user.email,
        isModerator
      );
    } catch (error: any) {
      console.error('Token generation error:', error);
      return NextResponse.json({ 
        error: 'Failed to generate token',
        details: error.message 
      }, { status: 500 });
    }

    // Validate the token structure
    const validation = jaasService.validateToken(token);
    if (!validation.valid) {
      console.error('Token validation failed:', validation.error);
      return NextResponse.json({ 
        error: 'Token validation failed', 
        details: validation.error 
      }, { status: 500 });
    }

    // Get debug info
    const debug = jaasService.debugToken(token);

    user.jaasTokenGeneratedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      token,
      appId: config.appId,
      jaasUserId,
      isModerator,
      expiresIn: 3600,
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
    console.error('Token error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate token',
      details: error?.message 
    }, { status: 500 });
  }
}
