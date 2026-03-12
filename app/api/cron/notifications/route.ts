import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment, User } from '@/lib/mongodb/models';
import { notificationService } from '@/lib/services/notifications';
import { emailService } from '@/lib/services/email';

// Cron job to send live lesson reminders
// This should be called every minute by a cron service (e.g., Vercel Cron, AWS EventBridge)

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured
    const cronSecret = request.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const now = new Date();
    const results = {
      studentReminders: 0,
      instructorReminders: 0,
      errors: [] as string[],
    };

    // Find all live courses with scheduled lessons
    const courses = await Course.find({
      courseType: 'live',
      approvalStatus: 'approved',
      isPublished: true,
    });

    for (const course of courses) {
      try {
        // Get default group (first group or create one)
        const defaultGroup = course.groups[0];
        if (!defaultGroup) continue;

        // Get enrolled students
        const enrollments = await Enrollment.find({
          courseId: course._id,
          status: 'active',
        }).populate('userId', 'name email');

        const enrolledStudentIds = enrollments.map((e: any) => e.userId._id.toString());
        const enrolledStudents = enrollments.map((e: any) => e.userId);

        // Process each lesson
        for (const lesson of course.lessons) {
          if (!lesson.scheduledDateTime || lesson.isPublished === false) continue;

          const scheduledTime = new Date(lesson.scheduledDateTime);
          const timeDiff = scheduledTime.getTime() - now.getTime();
          const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));

          // Skip if lesson is already live or ended
          if (lesson.liveStatus === 'live' || lesson.liveStatus === 'ended') continue;

          // Student reminders (configurable, default 30 min before)
          const studentReminderMinutes = lesson.reminderMinutesBefore || 30;
          if (minutesUntilStart === studentReminderMinutes) {
            // Send to all enrolled students
            for (const student of enrolledStudents) {
              try {
                // In-app notification with clickable link
                await notificationService.createNotification({
                  userId: student._id.toString(),
                  type: 'live_lesson_reminder',
                  title: 'Live Lesson Starting Soon',
                  message: `"${lesson.title.en}" in "${course.title.en}" starts in ${studentReminderMinutes} minutes`,
                  data: {
                    courseId: course._id.toString(),
                    lessonId: lesson._id.toString(),
                    scheduledTime: lesson.scheduledDateTime,
                    courseSlug: course.slug,
                  },
                  actionUrl: `/${student.locale || 'en'}/courses/${course.slug}/lessons/${lesson._id}`,
                });

                // WhatsApp notification if enabled
                await notificationService.notifyViaWhatsApp(
                  student._id.toString(),
                  'live_stream_starting',
                  {
                    courseTitle: course.title.en,
                    startTime: scheduledTime.toLocaleTimeString(),
                  }
                );

                results.studentReminders++;
              } catch (error) {
                results.errors.push(`Failed to notify student ${student._id}: ${error}`);
              }
            }
          }

          // Admin/Instructor reminder (15 minutes before)
          if (minutesUntilStart === 15) {
            // Get all instructors and admins
            const instructorIds = course.instructorIds.map((id: any) => id.toString());
            
            // Notify instructors with localized messages
            for (const instructorId of instructorIds) {
              try {
                const instructor = await User.findById(instructorId);
                const instLocale = instructor?.locale || 'en';
                
                // Localized titles
                const instTitles = {
                  en: 'Your Live Lesson Starts in 15 Minutes',
                  de: 'Ihr Live-Unterricht beginnt in 15 Minuten',
                  ar: 'درسك المباشر يبدأ خلال 15 دقيقة',
                };
                
                // Localized messages
                const instMessages = {
                  en: `"${lesson.title.en}" in "${course.title.en}" starts at ${scheduledTime.toLocaleTimeString(instLocale === 'ar' ? 'ar-SY' : instLocale === 'de' ? 'de-DE' : 'en-US')}`,
                  de: `"${lesson.title.de || lesson.title.en}" in "${course.title.de || course.title.en}" beginnt um ${scheduledTime.toLocaleTimeString('de-DE')}`,
                  ar: `"${lesson.title.ar || lesson.title.en}" في "${course.title.ar || course.title.en}" يبدأ الساعة ${scheduledTime.toLocaleTimeString('ar-SY')}`,
                };

                await notificationService.createNotification({
                  userId: instructorId,
                  type: 'live_lesson_instructor_reminder',
                  title: instTitles[instLocale as keyof typeof instTitles] || instTitles.en,
                  message: instMessages[instLocale as keyof typeof instMessages] || instMessages.en,
                  data: {
                    courseId: course._id.toString(),
                    lessonId: lesson._id.toString(),
                    scheduledTime: lesson.scheduledDateTime,
                    courseSlug: course.slug,
                  },
                  actionUrl: `/${instLocale}/dashboard/instructor/courses/${course.slug}/lessons`,
                });

                results.instructorReminders++;
              } catch (error) {
                results.errors.push(`Failed to notify instructor ${instructorId}: ${error}`);
              }
            }
          }

          // 5 minutes before - final reminder for students
          if (minutesUntilStart === 5) {
            for (const student of enrolledStudents) {
              try {
                const studentLocale = student.locale || 'en';
                
                const finalTitles = {
                  en: 'Live Lesson Starting in 5 Minutes!',
                  de: 'Live-Unterricht beginnt in 5 Minuten!',
                  ar: 'الدرس المباشر يبدأ خلال 5 دقائق!',
                };
                
                const finalMessages = {
                  en: `"${lesson.title.en}" starts very soon! Click to join now.`,
                  de: `"${lesson.title.de || lesson.title.en}" beginnt sehr bald! Klicken Sie, um beizutreten.`,
                  ar: `"${lesson.title.ar || lesson.title.en}" يبدأ قريباً جداً! انقر للانضمام.`,
                };

                await notificationService.createNotification({
                  userId: student._id.toString(),
                  type: 'live_lesson_final_reminder',
                  title: finalTitles[studentLocale as keyof typeof finalTitles] || finalTitles.en,
                  message: finalMessages[studentLocale as keyof typeof finalMessages] || finalMessages.en,
                  data: {
                    courseId: course._id.toString(),
                    lessonId: lesson._id.toString(),
                    scheduledTime: lesson.scheduledDateTime,
                    courseSlug: course.slug,
                  },
                  actionUrl: `/${studentLocale}/courses/${course.slug}/lessons/${lesson._id}`,
                });
              } catch (error) {
                results.errors.push(`Failed to send final reminder to student ${student._id}: ${error}`);
              }
            }
          }
        }
      } catch (error) {
        results.errors.push(`Failed to process course ${course._id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
