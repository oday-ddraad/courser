// Notification Service
// Handles creating and managing notifications for users

import { INotification } from '@/lib/mongodb/models';
import { whatsappService } from './whatsapp';
import User from '@/lib/mongodb/models/User';


interface CreateNotificationInput {
  userId: string;
  type: INotification['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

class NotificationService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = '/api/notifications';
  }

  /**
   * Create a new notification
   */
  async createNotification(input: CreateNotificationInput): Promise<INotification> {
    const response = await fetch(this.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get user notifications
   */
  async getNotifications(limit: number = 20, unreadOnly: boolean = false): Promise<{
    notifications: INotification[];
    unreadCount: number;
  }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (unreadOnly) {
      params.append('unreadOnly', 'true');
    }

    const response = await fetch(`${this.apiBaseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<INotification> {
    const response = await fetch(`${this.apiBaseUrl}/${notificationId}/read`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/read-all`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/${notificationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Send course enrollment notification
   */
  async notifyCourseEnrolled(userId: string, courseId: string, courseTitle: string): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'course_enrolled',
      title: 'Course Enrollment Confirmed',
      message: `You have successfully enrolled in "${courseTitle}"`,
      data: { courseId },
      actionUrl: `/courses/${courseId}`,
    });
  }

  /**
   * Send live stream starting notification
   */
  async notifyLiveStreamStarting(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonTitle: string,
    startTime: Date
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'live_stream_starting',
      title: 'Live Stream Starting Soon',
      message: `"${lessonTitle}" in "${courseTitle}" starts at ${startTime.toLocaleTimeString()}`,
      data: { courseId, startTime },
      actionUrl: `/courses/${courseId}`,
    });
  }

  /**
   * Send lesson available notification
   */
  async notifyLessonAvailable(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonTitle: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'lesson_available',
      title: 'New Lesson Available',
      message: `A new lesson "${lessonTitle}" is now available in "${courseTitle}"`,
      data: { courseId },
      actionUrl: `/courses/${courseId}`,
    });
  }

  /**
   * Send course completed notification
   */
  async notifyCourseCompleted(userId: string, courseId: string, courseTitle: string): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'course_completed',
      title: 'Course Completed!',
      message: `Congratulations! You have completed "${courseTitle}"`,
      data: { courseId },
      actionUrl: `/courses/${courseId}`,
    });
  }

  /**
   * Send payment approved notification
   */
  async notifyPaymentApproved(userId: string, courseId: string, courseTitle: string): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'payment_approved',
      title: 'Payment Approved',
      message: `Your payment for "${courseTitle}" has been approved. You can now access the course.`,
      data: { courseId },
      actionUrl: `/courses/${courseId}`,
    });
  }

  /**
   * Send payment rejected notification
   */
  async notifyPaymentRejected(userId: string, courseId: string, courseTitle: string, reason?: string): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'payment_rejected',
      title: 'Payment Rejected',
      message: `Your payment for "${courseTitle}" was rejected${reason ? `: ${reason}` : ''}. Please try again or contact support.`,
      data: { courseId, reason },
    });
  }

  /**
   * Send bulk notifications to course students
   */
  async notifyCourseStudents(
    courseId: string,
    enrolledStudentIds: string[],
    notification: Omit<CreateNotificationInput, 'userId'>
  ): Promise<void> {
    // In a real implementation, this would use a queue system
    // For now, we'll send notifications one by one
    const promises = enrolledStudentIds.map(userId =>
      this.createNotification({ ...notification, userId })
    );

    await Promise.all(promises);
  }

  /**
   * Send WhatsApp notification to user
   */
  async notifyViaWhatsApp(
    userId: string,
    type: 'welcome' | 'course_enrollment' | 'live_stream_starting' | 'payment_approved',
    data: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user with phone number
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if user has verified phone and enabled WhatsApp notifications
      if (!user.phoneNumber || !user.phoneVerified) {
        return { success: false, error: 'User does not have a verified phone number' };
      }

      if (!user.whatsappNotificationsEnabled) {
        return { success: false, error: 'User has disabled WhatsApp notifications' };
      }

      // Send appropriate WhatsApp message
      let result;
      switch (type) {
        case 'welcome':
          result = await whatsappService.sendWelcomeMessage(
            user.phoneNumber,
            data.userName || user.name
          );
          break;

        case 'course_enrollment':
          result = await whatsappService.sendCourseEnrollmentNotification(
            user.phoneNumber,
            data.userName || user.name,
            data.courseTitle
          );
          break;

        case 'live_stream_starting':
          result = await whatsappService.sendLiveStreamNotification(
            user.phoneNumber,
            data.courseTitle,
            data.startTime
          );
          break;

        case 'payment_approved':
          result = await whatsappService.sendPaymentApprovedNotification(
            user.phoneNumber,
            data.userName || user.name,
            data.courseTitle
          );
          break;

        default:
          return { success: false, error: `Unknown notification type: ${type}` };
      }

      return result;
    } catch (error) {
      console.error('WhatsApp notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp notification',
      };
    }
  }

  /**
   * Send course enrollment notification via both in-app and WhatsApp
   */
  async notifyCourseEnrolledWithWhatsApp(
    userId: string,
    courseId: string,
    courseTitle: string
  ): Promise<{ inApp: INotification; whatsApp?: { success: boolean; error?: string } }> {
    // Create in-app notification
    const inAppNotification = await this.notifyCourseEnrolled(userId, courseId, courseTitle);

    // Try to send WhatsApp notification (non-blocking)
    let whatsAppResult;
    try {
      whatsAppResult = await this.notifyViaWhatsApp(userId, 'course_enrollment', {
        userName: undefined, // Will use user's name from database
        courseTitle,
      });
    } catch (error) {
      console.error('Failed to send WhatsApp enrollment notification:', error);
      whatsAppResult = { success: false, error: 'Failed to send WhatsApp notification' };
    }

    return {
      inApp: inAppNotification,
      whatsApp: whatsAppResult,
    };
  }

  /**
   * Send payment approved notification via both in-app and WhatsApp
   */
  async notifyPaymentApprovedWithWhatsApp(
    userId: string,
    courseId: string,
    courseTitle: string
  ): Promise<{ inApp: INotification; whatsApp?: { success: boolean; error?: string } }> {
    // Create in-app notification
    const inAppNotification = await this.notifyPaymentApproved(userId, courseId, courseTitle);

    // Try to send WhatsApp notification (non-blocking)
    let whatsAppResult;
    try {
      whatsAppResult = await this.notifyViaWhatsApp(userId, 'payment_approved', {
        userName: undefined, // Will use user's name from database
        courseTitle,
      });
    } catch (error) {
      console.error('Failed to send WhatsApp payment notification:', error);
      whatsAppResult = { success: false, error: 'Failed to send WhatsApp notification' };
    }

    return {
      inApp: inAppNotification,
      whatsApp: whatsAppResult,
    };
  }

  /**
   * Send live stream starting notification via both in-app and WhatsApp
   */
  async notifyLiveStreamStartingWithWhatsApp(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonTitle: string,
    startTime: Date
  ): Promise<{ inApp: INotification; whatsApp?: { success: boolean; error?: string } }> {
    // Create in-app notification
    const inAppNotification = await this.notifyLiveStreamStarting(
      userId,
      courseId,
      courseTitle,
      lessonTitle,
      startTime
    );

    // Try to send WhatsApp notification (non-blocking)
    let whatsAppResult;
    try {
      whatsAppResult = await this.notifyViaWhatsApp(userId, 'live_stream_starting', {
        courseTitle,
        startTime: startTime.toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Failed to send WhatsApp live stream notification:', error);
      whatsAppResult = { success: false, error: 'Failed to send WhatsApp notification' };
    }

    return {
      inApp: inAppNotification,
      whatsApp: whatsAppResult,
    };
  }
}


// Export singleton instance
export const notificationService = new NotificationService();

// Export class for testing or custom instances
export { NotificationService };

// Default export
export default notificationService;
