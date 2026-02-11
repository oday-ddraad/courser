import { IGroup, IGroupSchedule, IGroupNotificationSettings } from '@/lib/mongodb/models/Course';
import User, { IUser } from '@/lib/mongodb/models/User';
import Notification from '@/lib/mongodb/models/Notification';


export interface GroupNotificationData {
  groupId: string;
  courseId: string;
  courseTitle: string;
  schedule: IGroupSchedule;
  studentIds: string[];
  notificationSettings: IGroupNotificationSettings;
}

export class GroupNotificationService {
  /**
   * Schedule notifications for a group based on its schedule
   */
  static async scheduleGroupNotifications(groupData: GroupNotificationData) {
    const { schedule, studentIds, notificationSettings, courseId, courseTitle } = groupData;

    if (!notificationSettings.enabled || !schedule.isActive) {
      return;
    }

    // Calculate notification times
    const lessonDateTime = this.calculateNextLessonDateTime(schedule);
    if (!lessonDateTime) return;

    const earlyMorningTime = this.parseTime(notificationSettings.earlyMorningTime);
    const oneHourBefore = new Date(lessonDateTime.getTime() - 60 * 60 * 1000);

    // Schedule early morning notification
    if (notificationSettings.earlyMorningEnabled) {
      await this.scheduleNotification({
        studentIds,
        courseId,
        courseTitle,
        schedule,
        scheduledTime: earlyMorningTime,
        type: 'early_morning',
        notificationSettings,
      });
    }

    // Schedule 1-hour before notification
    if (notificationSettings.oneHourEnabled) {
      await this.scheduleNotification({
        studentIds,
        courseId,
        courseTitle,
        schedule,
        scheduledTime: oneHourBefore,
        type: 'one_hour_before',
        notificationSettings,
      });
    }
  }

  /**
   * Send immediate notification for a group
   */
  static async sendImmediateGroupNotification(groupData: GroupNotificationData, message: string) {
    const { studentIds, notificationSettings, courseId, courseTitle } = groupData;

    if (!notificationSettings.enabled) {
      return;
    }

    // Get student details
    const students = await User.find({ _id: { $in: studentIds } });


    // Send notifications based on settings
    if (notificationSettings.notificationTypes.includes('in_app')) {
      await this.createInAppNotifications(students, courseId, message);
    }

    if (notificationSettings.notificationTypes.includes('email')) {
      await this.sendEmailNotifications(students, courseTitle, message);
    }
  }

  /**
   * Cancel scheduled notifications for a group
   */
  static async cancelGroupNotifications(groupId: string) {
    await Notification.deleteMany({
      'metadata.groupId': groupId,
      type: { $in: ['group_early_morning', 'group_one_hour_before'] },
      status: 'scheduled',
    });
  }

  /**
   * Update notification settings for a group
   */
  static async updateGroupNotificationSettings(
    groupId: string,
    settings: Partial<IGroupNotificationSettings>
  ) {
    // This would be called when group settings are updated
    // Cancel existing notifications and reschedule with new settings
    await this.cancelGroupNotifications(groupId);

    // Reschedule would happen in the group update logic
  }

  private static async scheduleNotification({
    studentIds,
    courseId,
    courseTitle,
    schedule,
    scheduledTime,
    type,
    notificationSettings,
  }: {
    studentIds: string[];
    courseId: string;
    courseTitle: string;
    schedule: IGroupSchedule;
    scheduledTime: Date;
    type: 'early_morning' | 'one_hour_before';
    notificationSettings: IGroupNotificationSettings;
  }) {
    const message = this.generateNotificationMessage(type, courseTitle, schedule);

    // Create scheduled notifications
    const notifications = studentIds.map(studentId => ({
      userId: studentId,
      type: type === 'early_morning' ? 'group_early_morning' : 'group_one_hour_before',
      title: this.getNotificationTitle(type),
      message,
      scheduledFor: scheduledTime,
      status: 'scheduled',
      metadata: {
        courseId,
        courseTitle,
        schedule,
        groupId: '', // Would be set when called
      },
    }));

    await Notification.insertMany(notifications);
  }

  private static async createInAppNotifications(students: any[], courseId: string, message: string) {
    const notifications = students.map(student => ({
      userId: student._id,
      type: 'group_announcement',
      title: 'Group Announcement',
      message,
      status: 'unread',
      metadata: {
        courseId,
      },
    }));

    await Notification.insertMany(notifications);
  }

  private static async sendEmailNotifications(students: IUser[], courseTitle: string, message: string) {
    // TODO: Implement email service
    console.log(`Sending email notifications to ${students.length} students for ${courseTitle}`);
    // Placeholder for email implementation
    // Would integrate with email service here
  }


  private static calculateNextLessonDateTime(schedule: IGroupSchedule): Date | null {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const lessonTime = new Date();
    lessonTime.setHours(hours, minutes, 0, 0);

    // Find next occurrence of the day
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = daysOfWeek.indexOf(schedule.dayOfWeek);
    const currentDayIndex = now.getDay();

    let daysUntilNext = targetDayIndex - currentDayIndex;
    if (daysUntilNext <= 0) {
      daysUntilNext += 7;
    }

    const nextLessonDate = new Date(now);
    nextLessonDate.setDate(now.getDate() + daysUntilNext);
    nextLessonDate.setHours(hours, minutes, 0, 0);

    // If the lesson time has already passed today, schedule for next week
    if (nextLessonDate <= now) {
      nextLessonDate.setDate(nextLessonDate.getDate() + 7);
    }

    return nextLessonDate;
  }

  private static parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private static generateNotificationMessage(
    type: 'early_morning' | 'one_hour_before',
    courseTitle: string,
    schedule: IGroupSchedule
  ): string {
    const dayName = schedule.dayOfWeek.charAt(0).toUpperCase() + schedule.dayOfWeek.slice(1);
    const lessonType = schedule.lessonType === 'live' ? 'live lesson' : 'recorded lesson';

    if (type === 'early_morning') {
      return `Don't forget your ${lessonType} for ${courseTitle} this ${dayName} at ${schedule.time}.`;
    } else {
      return `Your ${lessonType} for ${courseTitle} starts in 1 hour (${schedule.time}).`;
    }
  }

  private static getNotificationTitle(type: 'early_morning' | 'one_hour_before'): string {
    return type === 'early_morning' ? 'Upcoming Lesson Reminder' : 'Lesson Starting Soon';
  }
}

export default GroupNotificationService;
