// Lightweight Notification Worker
// Processes scheduled notifications without heavy cron dependencies

import { ScheduledNotification, Notification } from '@/lib/mongodb/models';
import connectDB from '@/lib/mongodb/connection';

class NotificationWorker {
  private isRunning = false;
  private lastRun: Date | null = null;

  /**
   * Process pending scheduled notifications
   * Call this from API routes or set up a lightweight interval
   */
  async processScheduled(): Promise<{
    processed: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      await connectDB();

      const now = new Date();

      // Find notifications that should be sent now
      // Only get pending ones that are due
      const pendingNotifications = await ScheduledNotification.find({
        status: 'pending',
        sendAt: { $lte: now },
      })
        .sort({ sendAt: 1 })
        .limit(100) // Process in batches
        .lean();

      results.processed = pendingNotifications.length;

      for (const scheduled of pendingNotifications) {
        try {
          // Create the actual notification
          await Notification.create({
            userId: scheduled.userId,
            type: scheduled.type,
            title: scheduled.title,
            message: scheduled.message,
            data: scheduled.data,
            actionUrl: scheduled.actionUrl,
            isRead: false,
          });

          // Mark scheduled as sent
          await ScheduledNotification.findByIdAndUpdate(scheduled._id, {
            status: 'sent',
            sentAt: new Date(),
          });

          results.sent++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Failed to send ${scheduled._id}: ${errorMsg}`);

          // Mark as failed
          await ScheduledNotification.findByIdAndUpdate(scheduled._id, {
            status: 'failed',
            error: errorMsg,
            $inc: { retryCount: 1 },
          });

          results.failed++;
        }
      }

      this.lastRun = new Date();
      return results;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Worker failed';
      results.errors.push(errorMsg);
      return results;
    }
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(data: {
    userId: string;
    type: string;
    title: { en: string; de: string; ar: string };
    message: { en: string; de: string; ar: string };
    sendAt: Date;
    actionUrl?: string;
    data?: Record<string, any>;
    lessonId?: string;
    courseId?: string;
  }): Promise<string> {
    await connectDB();

    const scheduled = await ScheduledNotification.create({
      ...data,
      status: 'pending',
      retryCount: 0,
    });

    return scheduled._id.toString();
  }

  /**
   * Cancel all scheduled notifications for a lesson
   */
  async cancelLessonNotifications(lessonId: string): Promise<number> {
    await connectDB();

    const result = await ScheduledNotification.updateMany(
      { lessonId, status: 'pending' },
      { status: 'cancelled' }
    );

    return result.modifiedCount;
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean;
    lastRun: Date | null;
  } {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
    };
  }

  /**
   * Retry failed notifications (optional cleanup)
   */
  async retryFailed(maxRetries = 3): Promise<number> {
    await connectDB();

    const failed = await ScheduledNotification.find({
      status: 'failed',
      retryCount: { $lt: maxRetries },
    }).limit(50);

    let retried = 0;
    for (const notification of failed) {
      // Reset to pending for retry
      await ScheduledNotification.findByIdAndUpdate(notification._id, {
        status: 'pending',
        error: undefined,
      });
      retried++;
    }

    return retried;
  }
}

// Export singleton
export const notificationWorker = new NotificationWorker();
export default notificationWorker;
