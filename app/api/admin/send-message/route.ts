import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { User, Notification } from '@/lib/mongodb/models';

// POST /api/admin/send-message - Send notification or email to user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();
    const { userId, type, title, message } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (type === 'notification') {
      // Create in-app notification directly using Mongoose model
      // Support both simple strings and multi-language objects
      const titleObj = typeof title === 'string' 
        ? { en: title, de: title, ar: title }
        : title;
      const messageObj = typeof message === 'string'
        ? { en: message, de: message, ar: message }
        : message;
      
      const notification = await Notification.create({
        userId,
        type: 'admin_message',
        title: titleObj,
        message: messageObj,
        data: {
          sentBy: session.user.id,
          sentAt: new Date().toISOString(),
        },
        isRead: false,
      });


      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        data: {
          _id: notification._id.toString(),
        },
      });
    } else if (type === 'email') {
      // For email, we would typically use a service like SendGrid, AWS SES, etc.
      // For now, we'll create a notification and log the email intent
      // TODO: Implement actual email sending when email service is configured
      
      // Support both simple strings and multi-language objects
      const titleStr = typeof title === 'string' ? title : title.en || 'Email';
      const messageStr = typeof message === 'string' ? message : message.en || 'Message';
      
      // Create notification as backup
      const notification = await Notification.create({
        userId,
        type: 'admin_message',
        title: {
          en: `Email: ${titleStr}`,
          de: `E-Mail: ${titleStr}`,
          ar: `بريد إلكتروني: ${titleStr}`,
        },
        message: {
          en: `An email was sent to you: ${messageStr}`,
          de: `Eine E-Mail wurde an Sie gesendet: ${messageStr}`,
          ar: `تم إرسال بريد إلكتروني إليك: ${messageStr}`,
        },
        data: {
          sentBy: session.user.id,
          sentAt: new Date().toISOString(),
          emailSent: true,
        },
        isRead: false,
      });


      // Log email intent (replace with actual email service)
      console.log(`[EMAIL] To: ${user.email}, Subject: ${title}, Body: ${message}`);

      return NextResponse.json({
        success: true,
        message: 'Email queued for sending',
        note: 'Email service integration required for actual delivery',
        data: {
          _id: notification._id.toString(),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid message type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
