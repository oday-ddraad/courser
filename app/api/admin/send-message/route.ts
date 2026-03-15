import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { User, Notification } from '@/lib/mongodb/models';
import emailService from '@/lib/services/email';

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
      // Support both simple strings and multi-language objects
      const titleStr = typeof title === 'string' ? title : title.en || 'Email';
      const messageStr = typeof message === 'string' ? message : message.en || 'Message';
      
      // Send actual email using the email service
      const emailResult = await emailService.sendEmail({
        to: user.email,
        template: {
          name: 'admin-message',
          subject: titleStr,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">NEXAPATH</div>
                  <h1 style="color: #2563eb; font-size: 24px; font-weight: bold; margin: 0;">${titleStr}</h1>
                </div>
                <div style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">
                  <p>Hello ${user.name},</p>
                  <p>${messageStr}</p>
                </div>
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p>Best regards,<br><strong style="color: #2563eb;">NexaPath Academy Team</strong></p>
                  <p style="margin-top: 10px;"><a href="https://nexapath.academy" style="color: #2563eb; text-decoration: none;">https://nexapath.academy</a></p>
                </div>
              </div>
            </div>
          `,
          variables: ['name', 'title', 'message'],
        },
        variables: {
          name: user.name,
          title: titleStr,
          message: messageStr,
        },
      });

      if (!emailResult.success) {
        return NextResponse.json(
          { success: false, error: emailResult.error || 'Failed to send email' },
          { status: 500 }
        );
      }

      // Create notification as record
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
          emailId: emailResult.id,
        },
        isRead: false,
      });

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          _id: notification._id.toString(),
          emailId: emailResult.id,
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
