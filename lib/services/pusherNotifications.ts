import pusher from '@/lib/pusher/server';
import { notificationService } from './notifications';

export const NOTIFICATION_CHANNELS = {
  USER_PREFIX: 'private-user-',
} as const;

export const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',
  ALL_READ: 'all-notifications-read',
  LIVE_LESSON_STARTED: 'live-lesson-started',
  COURSE_APPROVED: 'course-approved',
  STUDENT_ENROLLED: 'student-enrolled',
} as const;

interface PusherNotificationData {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, any>;
  timestamp: string;
}

/**
 * Send notification to a specific user via Pusher
 */
export async function sendPusherNotification(
  userId: string,
  data: PusherNotificationData
): Promise<void> {
  const channel = `${NOTIFICATION_CHANNELS.USER_PREFIX}${userId}`;
  
  try {
    await pusher.trigger(channel, NOTIFICATION_EVENTS.NEW_NOTIFICATION, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    console.log(`Pusher notification sent to user ${userId}`);
  } catch (error) {
    console.error(`Failed to send Pusher notification to user ${userId}:`, error);
  }
}

/**
 * Notify enrolled students when a live lesson starts
 */
export async function triggerLiveLessonStarted(
  enrolledStudentIds: string[],
  lessonData: {
    lessonId: string;
    lessonTitle: string;
    courseTitle: string;
    courseSlug: string;
    courseId: string;
    jitsiRoomName?: string;
  }
): Promise<void> {
  const notificationPromises = enrolledStudentIds.map(async (userId) => {

    try {
      // Create in-app notification
      const notification = await notificationService.createNotification({
        userId,
        type: 'live_lesson_started',
        title: 'Live Lesson Started!',
        message: `"${lessonData.lessonTitle}" is now live. Click to join!`,
        actionUrl: `/courses/${lessonData.courseSlug}/lessons/${lessonData.lessonId}`,
        data: {
          courseId: lessonData.courseId,
          lessonId: lessonData.lessonId,
          jitsiRoomName: lessonData.jitsiRoomName,
        },
      });

      // Send real-time notification
      await sendPusherNotification(userId, {
        notificationId: notification._id.toString(),
        type: 'live_lesson_started',
        title: 'Live Lesson Started!',
        message: `"${lessonData.lessonTitle}" is now live. Click to join!`,
        actionUrl: `/courses/${lessonData.courseSlug}/lessons/${lessonData.lessonId}`,
        data: {
          courseId: lessonData.courseId,
          lessonId: lessonData.lessonId,
          jitsiRoomName: lessonData.jitsiRoomName,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to notify user ${userId}:`, error);
    }
  });

  await Promise.allSettled(notificationPromises);
}

/**
 * Notify instructor when their course is approved
 */
export async function triggerCourseApproved(
  instructorId: string,
  courseData: {
    courseId: string;
    courseTitle: string;
    courseSlug: string;
  }
): Promise<void> {
  try {
    const notification = await notificationService.createNotification({
      userId: instructorId,
      type: 'course_approved',
      title: 'Course Approved!',
      message: `Your course "${courseData.courseTitle}" has been approved and is now live.`,
      actionUrl: `/dashboard/instructor/courses/${courseData.courseSlug}`,
      data: {
        courseId: courseData.courseId,
      },
    });

    await sendPusherNotification(instructorId, {
      notificationId: notification._id.toString(),
      type: 'course_approved',
      title: 'Course Approved!',
      message: `Your course "${courseData.courseTitle}" has been approved and is now live.`,
      actionUrl: `/dashboard/instructor/courses/${courseData.courseSlug}`,
      data: {
        courseId: courseData.courseId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Failed to notify instructor ${instructorId}:`, error);
  }
}

/**
 * Notify instructor when a new student enrolls
 */
export async function triggerStudentEnrolled(
  instructorId: string,
  courseData: {
    courseId: string;
    courseTitle: string;
    courseSlug: string;
    studentName: string;
  }
): Promise<void> {
  try {
    const notification = await notificationService.createNotification({
      userId: instructorId,
      type: 'course_enrolled',
      title: 'New Student Enrolled',
      message: `${courseData.studentName} enrolled in your course "${courseData.courseTitle}"`,
      actionUrl: `/dashboard/instructor/courses/${courseData.courseSlug}/students`,
      data: {
        courseId: courseData.courseId,
      },
    });

    await sendPusherNotification(instructorId, {
      notificationId: notification._id.toString(),
      type: 'course_enrolled',
      title: 'New Student Enrolled',
      message: `${courseData.studentName} enrolled in your course "${courseData.courseTitle}"`,
      actionUrl: `/dashboard/instructor/courses/${courseData.courseSlug}/students`,
      data: {
        courseId: courseData.courseId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Failed to notify instructor ${instructorId}:`, error);
  }
}
