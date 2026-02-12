import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment, ChatMessage } from '@/lib/mongodb/models';
import LessonPlayer from '@/components/courses/LessonPlayer';
import LessonNavigation from '@/components/courses/LessonNavigation';
import LiveChat from '@/components/courses/LiveChat';

interface Props {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lessonId, locale } = await params;
  
  await connectDB();
  const course = await Course.findOne({ slug }).lean();
  
  if (!course) {
    return { title: 'Lesson Not Found' };
  }
  
  const lesson = course.lessons?.find((l: any) => l._id.toString() === lessonId);
  const title = lesson?.title[locale as keyof typeof lesson.title] || lesson?.title.en || 'Lesson';
  
  return {
    title: `${title} | ${course.title[locale as keyof typeof course.title] || course.title.en}`,
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  const session = await getServerSession(authOptions);
  
  await connectDB();
  
  // Fetch course
  const course = await Course.findOne({ slug })
    .populate('instructorId', 'name avatar')
    .lean();
  
  if (!course) {
    notFound();
  }
  
  // Find current lesson
  const currentLesson = course.lessons?.find((l: any) => l._id.toString() === lessonId);
  
  if (!currentLesson) {
    notFound();
  }
  
  // Check enrollment
  let enrollment = null;
  let isEnrolled = false;
  let isPreview = currentLesson.isPreview;
  
  if (session?.user?.id) {
    enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: course._id,
      status: { $in: ['active', 'completed'] },
    }).lean();
    
    isEnrolled = !!enrollment;
  }
  
  // If not enrolled and not a preview lesson, redirect to course page
  if (!isEnrolled && !isPreview) {
    notFound();
  }
  
  // Fetch chat messages for this lesson
  const chatMessages = await ChatMessage.find({
    courseId: course._id,
    $or: [
      { lessonId: currentLesson._id },
      { lessonId: null }, // Course-wide messages
    ],
    deletedAt: null,
  })
    .populate('userId', 'name avatar role')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  
  // Serialize data
  const serializedCourse = {
    ...course,
    _id: course._id.toString(),
    instructorId: course.instructorId ? {
      ...course.instructorId,
      _id: course.instructorId._id.toString(),
    } : undefined,
    lessons: course.lessons?.map((l: any) => ({
      ...l,
      _id: l._id.toString(),
    })) || [],
  };
  
  const serializedLesson = {
    ...currentLesson,
    _id: currentLesson._id.toString(),
  };
  
  const serializedEnrollment = enrollment ? {
    ...enrollment,
    _id: enrollment._id.toString(),
    userId: enrollment.userId.toString(),
    courseId: enrollment.courseId.toString(),
    progress: {
      ...enrollment.progress,
      completedLessons: enrollment.progress.completedLessons.map((id: any) => id.toString()),
      lastAccessedLesson: enrollment.progress.lastAccessedLesson?.toString(),
      lessonWatchTimes: enrollment.progress.lessonWatchTimes?.map((wt: any) => ({
        ...wt,
        lessonId: wt.lessonId.toString(),
      })) || [],
    },
  } : null;
  
  const serializedMessages = chatMessages.map((msg: any) => ({
    ...msg,
    _id: msg._id.toString(),
    courseId: msg.courseId.toString(),
    lessonId: msg.lessonId?.toString(),
    userId: msg.userId ? {
      ...msg.userId,
      _id: msg.userId._id.toString(),
    } : undefined,
  }));
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Player */}
            <LessonPlayer
              course={serializedCourse as any}
              lesson={serializedLesson as any}
              enrollment={serializedEnrollment as any}
              locale={locale}
            />
            
            {/* Lesson Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentLesson.title[locale as keyof typeof currentLesson.title] || currentLesson.title.en}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentLesson.description[locale as keyof typeof currentLesson.description] || currentLesson.description.en}
              </p>
              
              {/* Lesson Resources */}
              {currentLesson.resources && currentLesson.resources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {t('resources')}
                  </h3>
                  <div className="space-y-2">
                    {currentLesson.resources.map((resource: any, index: number) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="flex-1 text-gray-900 dark:text-white">
                          {resource.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                          {resource.type}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Lesson Navigation */}
            <LessonNavigation
              course={serializedCourse as any}
              currentLessonId={lessonId}
              enrollment={serializedEnrollment as any}
              locale={locale}
            />
          </div>
          
          {/* Sidebar - Live Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <LiveChat
                courseId={course._id.toString()}
                lessonId={currentLesson._id.toString()}
                initialMessages={serializedMessages}
                isEnrolled={isEnrolled}
                userRole={session?.user?.role as 'admin' | 'instructor' | 'user' | undefined}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
