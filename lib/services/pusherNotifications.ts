import pusher from '@/lib/pusher/server';
import connectDB from '@/lib/mongodb/connection';
import { Notification, User, type INotification } from '@/lib/mongodb/models';
import { emailService } from '@/lib/services/email';

export const NOTIFICATION_CHANNELS = {
  USER_PREFIX: 'private-user-',
} as const;

export const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',
  ALL_READ: 'all-notifications-read',
  LIVE_LESSON_STARTED: 'live-lesson-started',
  LIVE_LESSON_ENDED: 'live-lesson-ended',
  COURSE_APPROVED: 'course-approved',
  COURSE_REJECTED: 'course-rejected',
  COURSE_SUBMITTED: 'course-submitted',
  STUDENT_ENROLLED: 'student-enrolled',
  PAYMENT_STATUS_CHANGED: 'payment-status-changed',
  NEW_PAYMENT_SUBMITTED: 'new-payment-submitted',
  INSTRUCTOR_NEW_ENROLLMENT: 'instructor-new-enrollment',
} as const;


type LocalizedText = {
  en: string;
  de: string;
  ar: string;
};

interface PusherNotificationData {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

interface CreateInAppNotificationInput {
  userId: string;
  type: INotification['type'];
  title: string | LocalizedText;
  message: string | LocalizedText;
  data?: Record<string, unknown>;
  actionUrl?: string;
  sendRealtime?: boolean;
  /** Set true to skip the automatic email copy (e.g. when the caller already sends its own email) */
  skipEmail?: boolean;
}

function toLocalizedText(value: string | LocalizedText): LocalizedText {
  if (typeof value === 'string') {
    return {
      en: value,
      de: value,
      ar: value,
    };
  }

  return {
    en: value.en,
    de: value.de,
    ar: value.ar,
  };
}

async function getAdminUserIds(): Promise<string[]> {
  await connectDB();

  const admins = await User.find({
    role: 'admin',
  })
    .select('_id')
    .lean();

  return admins.map((admin: any) => admin._id.toString());
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
 * Send an email copy of a notification to the user.
 * Fires-and-forgets — never throws so it cannot break the main flow.
 */
async function sendNotificationEmail(
  userId: string,
  title: LocalizedText,
  message: LocalizedText,
  actionUrl?: string
): Promise<void> {
  try {
    const user = await User.findById(userId).select('email name locale').lean() as any;
    if (!user?.email) return;

    const locale = (user.locale as keyof LocalizedText) || 'en';
    const localizedTitle = title[locale] || title.en;
    const localizedMessage = message[locale] || message.en;
    const userName = user.name || 'User';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexapath.academy';
    const actionButton = actionUrl
      ? `<div style="text-align:center;margin-top:24px;">
           <a href="${appUrl}${actionUrl}"
              style="background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
             View Details
           </a>
         </div>`
      : '';

    await emailService.sendEmail({
      to: user.email,
      template: {
        name: 'notification-copy',
        subject: localizedTitle,
        htmlContent: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;
                      background-color:#f5f5f5;">
            <div style="background-color:#ffffff;border-radius:8px;padding:40px;
                        box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:28px;font-weight:bold;color:#2563eb;margin-bottom:6px;">
                  NEXAPATH
                </div>
                <p style="color:#6b7280;font-size:14px;margin:0;">New Notification</p>
              </div>
              <h2 style="color:#1f2937;font-size:20px;margin-bottom:12px;">
                ${localizedTitle}
              </h2>
              <p style="color:#4b5563;font-size:16px;margin-bottom:8px;">
                Hello ${userName},
              </p>
              <p style="color:#4b5563;font-size:16px;">
                ${localizedMessage}
              </p>
              ${actionButton}
              <div style="text-align:center;color:#9ca3af;font-size:13px;
                          margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
                <p>You received this email because you have an account on NexaPath Academy.</p>
                <p><a href="${appUrl}" style="color:#2563eb;text-decoration:none;">
                  nexapath.academy
                </a></p>
              </div>
            </div>
          </div>`,
        variables: [],
      },
      variables: {},
    });
  } catch (err) {
    // Non-fatal — log and continue
    console.error(`[Notification Email] Failed to send email copy to user ${userId}:`, err);
  }
}

/**
 * Create DB notification directly (server-safe), optionally emit realtime event,
 * and automatically send an email copy to the user.
 */
export async function createInAppNotification(
  input: CreateInAppNotificationInput
): Promise<INotification> {
  await connectDB();

  const title = toLocalizedText(input.title);
  const message = toLocalizedText(input.message);

  const notification = await Notification.create({
    userId: input.userId,
    type: input.type,
    title,
    message,
    data: input.data || {},
    actionUrl: input.actionUrl,
  });

  // Send real-time Pusher event
  if (input.sendRealtime !== false) {
    await sendPusherNotification(input.userId, {
      notificationId: notification._id.toString(),
      type: input.type,
      title: title.en,
      message: message.en,
      actionUrl: input.actionUrl,
      data: input.data,
      timestamp: new Date().toISOString(),
    });
  }

  // Send email copy (fire-and-forget, unless caller opts out)
  if (!input.skipEmail) {
    sendNotificationEmail(input.userId, title, message, input.actionUrl);
  }

  return notification;
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
      await createInAppNotification({
        userId,
        type: 'live_lesson_started',
        title: {
          en: 'Live Lesson Started!',
          de: 'Live-Unterricht hat begonnen!',
          ar: 'بدأ الدرس المباشر!',
        },
        message: {
          en: `"${lessonData.lessonTitle}" in "${lessonData.courseTitle}" is now live. Click to join!`,
          de: `"${lessonData.lessonTitle}" in "${lessonData.courseTitle}" ist jetzt live. Klicken Sie, um beizutreten!`,
          ar: `"${lessonData.lessonTitle}" في "${lessonData.courseTitle}" مباشر الآن. انقر للانضمام!`,
        },
        actionUrl: `/courses/${lessonData.courseSlug}/lessons/${lessonData.lessonId}`,
        data: {
          courseId: lessonData.courseId,
          lessonId: lessonData.lessonId,
          jitsiRoomName: lessonData.jitsiRoomName,
        },
        sendRealtime: true,
      });
    } catch (error) {
      console.error(`Failed to notify user ${userId}:`, error);
    }
  });

  await Promise.allSettled(notificationPromises);
}

/**
 * Notify enrolled students when a live lesson ends
 */
export async function triggerLiveLessonEnded(
  enrolledStudentIds: string[],
  lessonData: {
    lessonId: string;
    lessonTitle: string;
    courseTitle: string;
    courseSlug: string;
    courseId: string;
  }
): Promise<void> {
  const notificationPromises = enrolledStudentIds.map(async (userId) => {
    try {
      await createInAppNotification({
        userId,
        type: 'live_lesson_ended',
        title: {
          en: 'Live Lesson Ended',
          de: 'Live-Unterricht beendet',
          ar: 'انتهى الدرس المباشر',
        },
        message: {
          en: `"${lessonData.lessonTitle}" in "${lessonData.courseTitle}" has ended. Thank you for attending!`,
          de: `"${lessonData.lessonTitle}" in "${lessonData.courseTitle}" wurde beendet. Vielen Dank für Ihre Teilnahme!`,
          ar: `"${lessonData.lessonTitle}" في "${lessonData.courseTitle}" انتهى. شكراً لحضورك!`,
        },
        actionUrl: `/courses/${lessonData.courseSlug}/lessons/${lessonData.lessonId}`,
        data: {
          courseId: lessonData.courseId,
          lessonId: lessonData.lessonId,
        },
        sendRealtime: true,
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
    await createInAppNotification({
      userId: instructorId,
      type: 'course_approved',
      title: {
        en: 'Course Approved!',
        de: 'Kurs genehmigt!',
        ar: 'تمت الموافقة على الدورة!',
      },
      message: {
        en: `Your course "${courseData.courseTitle}" has been approved and is now live.`,
        de: `Ihr Kurs "${courseData.courseTitle}" wurde genehmigt und ist jetzt live.`,
        ar: `تمت الموافقة على دورتك "${courseData.courseTitle}" وهي الآن متاحة.`,
      },
      actionUrl: `/dashboard/instructor/courses/${courseData.courseSlug}`,
      data: {
        courseId: courseData.courseId,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error(`Failed to notify instructor ${instructorId}:`, error);
  }
}

/**
 * Notify instructor when their course is rejected
 */
export async function triggerCourseRejected(
  instructorId: string,
  courseData: {
    courseId: string;
    courseTitle: string;
    courseSlug: string;
    rejectionReason: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: instructorId,
      type: 'course_rejected',
      title: {
        en: 'Course Rejected',
        de: 'Kurs abgelehnt',
        ar: 'تم رفض الدورة',
      },
      message: {
        en: `Your course "${courseData.courseTitle}" has been rejected. Reason: ${courseData.rejectionReason}`,
        de: `Ihr Kurs "${courseData.courseTitle}" wurde abgelehnt. Grund: ${courseData.rejectionReason}`,
        ar: `تم رفض دورتك "${courseData.courseTitle}". السبب: ${courseData.rejectionReason}`,
      },
      actionUrl: `/dashboard/instructor/courses/${courseData.courseSlug}/edit`,
      data: {
        courseId: courseData.courseId,
        rejectionReason: courseData.rejectionReason,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error(`Failed to notify instructor ${instructorId}:`, error);
  }
}

/**
 * Notify admins when a course is submitted for approval
 */
export async function triggerCourseSubmitted(
  adminId: string,
  courseData: {
    courseId: string;
    courseTitle: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: adminId,
      type: 'course_submitted',
      title: {
        en: 'New Course Submitted for Approval',
        de: 'Neuer Kurs zur Genehmigung eingereicht',
        ar: 'تم إرسال دورة جديدة للموافقة',
      },
      message: {
        en: `Course "${courseData.courseTitle}" has been submitted for approval.`,
        de: `Der Kurs "${courseData.courseTitle}" wurde zur Genehmigung eingereicht.`,
        ar: `تم إرسال الدورة "${courseData.courseTitle}" للموافقة.`,
      },
      actionUrl: `/dashboard/admin/courses/approval`,
      data: {
        courseId: courseData.courseId,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error(`Failed to notify admin ${adminId}:`, error);
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
    await createInAppNotification({
      userId: instructorId,
      type: 'course_enrolled',
      title: {
        en: 'New Student Enrolled',
        de: 'Neuer Teilnehmer eingeschrieben',
        ar: 'تم تسجيل طالب جديد',
      },
      message: {
        en: `${courseData.studentName} enrolled in your course "${courseData.courseTitle}"`,
        de: `${courseData.studentName} hat sich in Ihren Kurs "${courseData.courseTitle}" eingeschrieben`,
        ar: `قام ${courseData.studentName} بالتسجيل في دورتك "${courseData.courseTitle}"`,
      },
      actionUrl: `/dashboard/instructor/courses/${courseData.courseSlug}/students`,
      data: {
        courseId: courseData.courseId,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error(`Failed to notify instructor ${instructorId}:`, error);
  }
}

export async function triggerPaymentSubmitted(paymentData: {
  paymentId: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  referenceCode?: string;
}): Promise<void> {
  try {
    const adminIds = await getAdminUserIds();

    const notificationPromises = adminIds.map((adminId) =>
      createInAppNotification({
        userId: adminId,
        type: 'payment_pending_review',
        title: {
          en: 'New Payment Submitted',
          de: 'Neue Zahlung eingereicht',
          ar: 'تم إرسال دفعة جديدة',
        },
        message: {
          en: `${paymentData.studentName} submitted payment for "${paymentData.courseTitle}" — ${paymentData.amount} ${paymentData.currency}`,
          de: `${paymentData.studentName} hat eine Zahlung für "${paymentData.courseTitle}" eingereicht — ${paymentData.amount} ${paymentData.currency}`,
          ar: `قدّم ${paymentData.studentName} دفعة لـ "${paymentData.courseTitle}" — ${paymentData.amount} ${paymentData.currency}`,
        },
        actionUrl: '/dashboard/admin/payments',
        data: {
          paymentId: paymentData.paymentId,
          enrollmentId: paymentData.enrollmentId,
          courseId: paymentData.courseId,
          studentId: paymentData.studentId,
          referenceCode: paymentData.referenceCode,
        },
        sendRealtime: true,
      })
    );

    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error('Failed to trigger payment submitted notifications:', error);
  }
}

export async function triggerPaymentApproved(
  studentId: string,
  paymentData: {
    paymentId: string;
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    courseSlug: string;
    amount: number;
    currency: string;
    instructorIds?: string[];
    studentName?: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: studentId,
      type: 'payment_approved',
      title: {
        en: 'Payment Approved! 🎉',
        de: 'Zahlung genehmigt! 🎉',
        ar: 'تمت الموافقة على الدفعة! 🎉',
      },
      message: {
        en: `Your payment for "${paymentData.courseTitle}" has been approved. You can now access the course.`,
        de: `Ihre Zahlung für "${paymentData.courseTitle}" wurde genehmigt. Sie können jetzt auf den Kurs zugreifen.`,
        ar: `تمت الموافقة على دفعتك لـ "${paymentData.courseTitle}". يمكنك الآن الوصول إلى الدورة.`,
      },
      actionUrl: '/dashboard/user/payments',

      data: {
        paymentId: paymentData.paymentId,
        enrollmentId: paymentData.enrollmentId,
        courseId: paymentData.courseId,
        amount: paymentData.amount,
        currency: paymentData.currency,
      },
      sendRealtime: true,
    });

    if (paymentData.instructorIds?.length) {
      const instructorPromises = paymentData.instructorIds.map((instructorId) =>
        createInAppNotification({
          userId: instructorId,
          type: 'new_enrollment_instructor',
          title: {
            en: 'New Student Enrolled',
            de: 'Neuer Teilnehmer eingeschrieben',
            ar: 'تسجيل طالب جديد',
          },
          message: {
            en: `${paymentData.studentName || 'A student'} has enrolled in your course "${paymentData.courseTitle}"`,
            de: `${paymentData.studentName || 'Ein Teilnehmer'} hat sich in Ihren Kurs "${paymentData.courseTitle}" eingeschrieben`,
            ar: `قام ${paymentData.studentName || 'طالب'} بالتسجيل في دورتك "${paymentData.courseTitle}"`,
          },
          actionUrl: `/dashboard/instructor/courses/${paymentData.courseSlug}/students`,
          data: {
            paymentId: paymentData.paymentId,
            enrollmentId: paymentData.enrollmentId,
            courseId: paymentData.courseId,
            studentId,
          },
          sendRealtime: true,
        })
      );

      await Promise.allSettled(instructorPromises);
    }
  } catch (error) {
    console.error('Failed to trigger payment approved notifications:', error);
  }
}

export async function triggerPaymentRejected(
  studentId: string,
  paymentData: {
    paymentId: string;
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    rejectionReason: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: studentId,
      type: 'payment_rejected',
      title: {
        en: 'Payment Rejected',
        de: 'Zahlung abgelehnt',
        ar: 'تم رفض الدفعة',
      },
      message: {
        en: `Your payment for "${paymentData.courseTitle}" was rejected. Reason: ${paymentData.rejectionReason}`,
        de: `Ihre Zahlung für "${paymentData.courseTitle}" wurde abgelehnt. Grund: ${paymentData.rejectionReason}`,
        ar: `تم رفض دفعتك لـ "${paymentData.courseTitle}". السبب: ${paymentData.rejectionReason}`,
      },
      actionUrl: `/payment/${paymentData.enrollmentId}`,
      data: {
        paymentId: paymentData.paymentId,
        enrollmentId: paymentData.enrollmentId,
        courseId: paymentData.courseId,
        rejectionReason: paymentData.rejectionReason,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error('Failed to trigger payment rejected notification:', error);
  }
}

export async function triggerPaymentExpired(
  studentId: string,
  paymentData: {
    paymentId: string;
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    courseSlug?: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: studentId,
      type: 'payment_expired',
      title: {
        en: 'Payment Expired',
        de: 'Zahlung abgelaufen',
        ar: 'انتهت صلاحية الدفعة',
      },
      message: {
        en: `Your payment for "${paymentData.courseTitle}" has expired. Please enroll again to continue.`,
        de: `Ihre Zahlung für "${paymentData.courseTitle}" ist abgelaufen. Bitte melden Sie sich erneut an, um fortzufahren.`,
        ar: `انتهت صلاحية دفعتك لـ "${paymentData.courseTitle}". يرجى التسجيل مجدداً للمتابعة.`,
      },
      actionUrl: paymentData.courseSlug
        ? `/courses/${paymentData.courseSlug}`
        : '/dashboard/user/payments',
      data: {
        paymentId: paymentData.paymentId,
        enrollmentId: paymentData.enrollmentId,
        courseId: paymentData.courseId,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error('Failed to trigger payment expired notification:', error);
  }
}

export async function triggerPaymentReminder(
  studentId: string,
  paymentData: {
    paymentId: string;
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: studentId,
      type: 'payment_reminder',
      title: {
        en: 'Complete Your Payment ⏰',
        de: 'Zahlung abschließen ⏰',
        ar: 'أكمل دفعتك ⏰',
      },
      message: {
        en: `Don't forget! Your payment for "${paymentData.courseTitle}" is still pending.`,
        de: `Nicht vergessen! Ihre Zahlung für "${paymentData.courseTitle}" steht noch aus.`,
        ar: `لا تنسَ! دفعتك لـ "${paymentData.courseTitle}" لا تزال معلقة.`,
      },
      actionUrl: `/payment/${paymentData.enrollmentId}`,
      data: {
        paymentId: paymentData.paymentId,
        enrollmentId: paymentData.enrollmentId,
        courseId: paymentData.courseId,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error('Failed to trigger payment reminder notification:', error);
  }
}

export async function triggerPaymentRefunded(
  studentId: string,
  paymentData: {
    paymentId: string;
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    refundReason?: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: studentId,
      type: 'payment_refunded',
      title: {
        en: 'Payment Refunded',
        de: 'Zahlung erstattet',
        ar: 'تم استرداد الدفعة',
      },
      message: {
        en: `Your payment for "${paymentData.courseTitle}" has been refunded${paymentData.refundReason ? `. Reason: ${paymentData.refundReason}` : '.'}`,
        de: `Ihre Zahlung für "${paymentData.courseTitle}" wurde erstattet${paymentData.refundReason ? `. Grund: ${paymentData.refundReason}` : '.'}`,
        ar: `تم استرداد دفعتك لـ "${paymentData.courseTitle}"${paymentData.refundReason ? `. السبب: ${paymentData.refundReason}` : '.'}`,
      },
      actionUrl: '/dashboard/user/payments',
      data: {
        paymentId: paymentData.paymentId,
        enrollmentId: paymentData.enrollmentId,
        courseId: paymentData.courseId,
        refundReason: paymentData.refundReason,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error('Failed to trigger payment refunded notification:', error);
  }
}

export async function triggerInstructorPayout(
  instructorId: string,
  payoutData: {
    amount: number;
    currency: string;
    reference?: string;
    note?: string;
  }
): Promise<void> {
  try {
    await createInAppNotification({
      userId: instructorId,
      type: 'custom',

      title: {
        en: 'Payout Recorded',
        de: 'Auszahlung erfasst',
        ar: 'تم تسجيل الدفعة',
      },
      message: {
        en: `Admin has recorded a payout of ${payoutData.amount} ${payoutData.currency}${payoutData.reference ? `. Reference: ${payoutData.reference}` : ''}.`,
        de: `Der Administrator hat eine Auszahlung von ${payoutData.amount} ${payoutData.currency}${payoutData.reference ? `. Referenz: ${payoutData.reference}` : ''} erfasst.`,
        ar: `سجّل المسؤول دفعة بقيمة ${payoutData.amount} ${payoutData.currency}${payoutData.reference ? `. المرجع: ${payoutData.reference}` : ''}.`,
      },
      actionUrl: '/dashboard/instructor/earnings',
      data: {
        subtype: 'instructor_payout',
        amount: payoutData.amount,
        currency: payoutData.currency,
        reference: payoutData.reference,
        note: payoutData.note,
      },
      sendRealtime: true,
    });
  } catch (error) {
    console.error('Failed to trigger instructor payout notification:', error);
  }
}
