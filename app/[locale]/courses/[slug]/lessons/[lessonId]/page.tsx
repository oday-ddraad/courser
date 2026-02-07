import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/mongodb/connection';
import { Course, Enrollment } from '@/lib/mongodb/models';
import { Types } from 'mongoose';
import LessonPlayer from '@/components/courses/LessonPlayer';
import LessonNavigation from '@/components/courses/LessonNavigation';

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
  
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/courses/${slug}/lessons/${lessonId}`);
  }
  
  await connectDB();
  
  // Fetch course
  const course = await Course.findOne({ slug })
    .populate('instructorId', 'name avatar')
    .lean();
  
  if (!course) {
    notFound();
  }
  
  // Find lesson
  const lesson = course.lessons?.find((l: any) => l._id.toString() === lessonId);
  
  if (!lesson) {
    notFound();
  }
  
  // Check if lesson is preview or user is enrolled
  const isPreview = lesson.isPreview;
  let isEnrolled = false;
  let enrollment = null;
  
  if (!isPreview) {
    enrollment = await Enrollment.findOne({
      userId: session.user.id,
      courseId: course._id,
      status: { $in: ['active', 'completed'] },
    }).lean();
    
    isEnrolled = !!enrollment;
    
    if (!isEnrolled) {
      redirect(`/${locale}/courses/${slug}?error=not-enrolled`);
    }
  }
  
  // Get lesson index for navigation
  const lessonIndex = course.lessons.findIndex((l: any) => l._id.toString() === lessonId);
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;
  
  // Get localized content
  const lessonTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title.en;
  const lessonDescription = lesson.description[locale as keyof typeof lesson.description] || lesson.description.en;
  const lessonContent = lesson.content[locale as keyof typeof lesson.content] || lesson.content.en;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <a href={`/${locale}/courses`} className="hover:text-blue-600">
            {t('allCourses')}
          </a>
          <span>/</span>
          <a href={`/${locale}/courses/${slug}`} className="hover:text-blue-600">
            {course.title[locale as keyof typeof course.title] || course.title.en}
          </a>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{lessonTitle}</span>
        </nav>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Player */}
            <LessonPlayer
              lesson={lesson}
              course={course}
              enrollment={enrollment}
              locale={locale}
            />
            
            {/* Lesson Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {lessonTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {lessonDescription}
              </p>
              
              {/* Lesson Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span>{t('lesson')} {lessonIndex + 1} {t('of')} {course.lessons.length}</span>
                <span>•</span>
                <span>{lesson.duration} {t('minutes')}</span>
                {lesson.isLiveStream && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      {t('liveStream')}
                    </span>
                  </>
                )}
              </div>
              
              {/* Lesson Content */}
              {lessonContent && (
                <div className="prose dark:prose-invert max-w-none">
                  {lessonContent}
                </div>
              )}
              
              {/* Resources */}
              {lesson.resources && lesson.resources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {t('resources')}
                  </h3>
                  <ul className="space-y-2">
                    {lesson.resources.map((resource: any, index: number) => (
                      <li key={index}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {resource.type === 'pdf' && '📄'}
                          {resource.type === 'video' && '🎥'}
                          {resource.type === 'link' && '🔗'}
                          {resource.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between">
              {prevLesson ? (
                <a
                  href={`/${locale}/courses/${slug}/lessons/${prevLesson._id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>←</span>
                  <span className="hidden sm:inline">{t('previousLesson')}</span>
                </a>
              ) : (
                <div />
              )}
              
              {nextLesson ? (
                <a
                  href={`/${locale}/courses/${slug}/lessons/${nextLesson._id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="hidden sm:inline">{t('nextLesson')}</span>
                  <span>→</span>
                </a>
              ) : (
                <div />
              )}
            </div>
          </div>
          
          {/* Sidebar - Lesson Navigation */}
          <div className="lg:col-span-1">
            <LessonNavigation
              course={course}
              currentLessonId={lessonId}
              enrollment={enrollment}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
