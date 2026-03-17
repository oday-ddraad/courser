import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import { createInAppNotification } from '@/lib/services/pusherNotifications';
import { emailService } from '@/lib/services/email';
import { whatsappService } from '@/lib/services/whatsapp';
import { Types } from 'mongoose';

// POST /api/courses/[id]/notify - Send notifications to enrolled students
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and instructor can send notifications
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
    const { 
      type, 
      message, 
      channels = ['in_app'], 
      groupIds = [],
      lessonId = null
    } = body;

    // Get enrolled students
    const enrollmentQuery: any = { courseId: id, status: 'active' };
    if (groupIds.length > 0) {
      enrollmentQuery.groupId = { $in: groupIds };
    }
    
    const enrollments = await Enrollment.find(enrollmentQuery).populate('userId', 'name email phoneNumber');
    
    if (enrollments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No enrolled students found' },
        { status: 404 }
      );
    }

    const results = {
      inApp: 0,
      email: 0,
      whatsapp: 0,
      failed: 0,
    };

    // Check if WhatsApp notifications are enabled
    const whatsappEnabled = await whatsappService.isNotificationsEnabled();

    // Send notifications
    for (const enrollment of enrollments) {
      const user = enrollment.userId as any;
      
      try {
        // In-app notification with real-time Pusher delivery
        // skipEmail when the email channel is also selected to avoid duplicate emails
        if (channels.includes('in_app')) {
          await createInAppNotification({
            userId: user._id.toString(),
            type: type || 'admin_message',
            title: {
              en: `Announcement: ${course.title.en}`,
              de: `Ankündigung: ${course.title.de || course.title.en}`,
              ar: `إعلان: ${course.title.ar || course.title.en}`,
            },
            message: {
              en: message,
              de: message,
              ar: message,
            },
            data: {
              courseId: id,
              lessonId,
            },
            sendRealtime: true,
            skipEmail: channels.includes('email'),
          });
          results.inApp++;
        }

        // Email notification
        if (channels.includes('email') && user.email) {
          try {
            await emailService.sendEmail({
              to: user.email,
              template: {
                name: 'course-announcement',
                subject: `Announcement: ${course.title.en}`,
                htmlContent: `
                  <h1>${course.title.en}</h1>
                  <p>${message}</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.slug}">
                    View Course
                  </a>
                `,
                variables: ['courseName', 'message', 'courseUrl'],
              },
              variables: {
                courseName: course.title.en,
                message: message,
                courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.slug}`,
              },
            });
            results.email++;
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
          }
        }

        // WhatsApp notification
        if (channels.includes('whatsapp') && whatsappEnabled && user.phoneNumber) {
          try {
            await whatsappService.sendMessage({
              to: user.phoneNumber,
              templateName: 'course_enrollment',
              parameters: [user.name || 'Student', course.title.en],
            });
            results.whatsapp++;
          } catch (waError) {
            console.error('Failed to send WhatsApp:', waError);
          }
        }

      } catch (error) {
        console.error('Failed to send notification to user:', user._id, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRecipients: enrollments.length,
        results,
      },
    });
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
