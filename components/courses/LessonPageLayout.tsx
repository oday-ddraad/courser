'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, BookOpen, Lock } from 'lucide-react';
import LessonPlayer from './LessonPlayer';
import LessonNavigation from './LessonNavigation';
import LiveChat from './LiveChat';

interface MultiLang { en: string; de: string; ar: string; }

interface LessonPageLayoutProps {
  locale: string;
  slug: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  lessonDescription: string;
  serializedCourse: any;
  serializedLesson: any;
  serializedEnrollment: any | null;
  serializedMessages: any[];
  isEnrolled: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isLiveLesson: boolean;
  userRole?: 'admin' | 'instructor' | 'user';
  prevLesson: { _id: string; title: MultiLang } | null;
  nextLesson: { _id: string; title: MultiLang } | null;
  completedCount: number;
  totalCount: number;
  resources: { url: string; name: string; type: string }[];
  googleDriveLinks: { url: string; name: MultiLang; type: string }[];
}

export default function LessonPageLayout({
  locale, slug, lessonId, courseTitle, lessonTitle, lessonDescription,
  serializedCourse, serializedLesson, serializedEnrollment, serializedMessages,
  isEnrolled, isAdmin, isInstructor, isLiveLesson, userRole,
  prevLesson, nextLesson, completedCount, totalCount,
  resources, googleDriveLinks,
}: LessonPageLayoutProps) {
  const isAr = locale === 'ar';
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const lessonUrl = (id: string) => ['', locale, 'courses', slug, 'lessons', id].join('/');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={['', locale, 'courses', slug].join('/')}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition min-w-0">
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            <span className="truncate max-w-[160px] sm:max-w-xs">{courseTitle}</span>
          </Link>

          {isEnrolled && totalCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: progressPct + '%' }} />
              </div>
              <span>{completedCount}/{totalCount}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {prevLesson && (
              <Link href={lessonUrl(prevLesson._id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <ChevronLeft className="w-3.5 h-3.5" />
                {isAr ? 'السابق' : 'Prev'}
              </Link>
            )}
            {nextLesson && (
              <Link href={lessonUrl(nextLesson._id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                {isAr ? 'التالي' : 'Next'}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <LessonPlayer
              lesson={serializedLesson}
              course={serializedCourse}
              enrollment={serializedEnrollment}
              locale={locale}
            />

            {/* Lesson info */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{lessonTitle}</h1>
              {lessonDescription && (
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{lessonDescription}</p>
              )}

              {resources.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{isAr ? 'الموارد' : 'Resources'}</h3>
                  <div className="space-y-2">
                    {resources.map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">
                        <span className="text-gray-900 dark:text-white">{r.name}</span>
                        <span className="text-xs text-gray-400 uppercase">{r.type}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {googleDriveLinks.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{isAr ? 'المواد الدراسية' : 'Course Materials'}</h3>
                  <div className="space-y-2">
                    {googleDriveLinks.map((link, i) => {
                      const name = link.name?.[locale as keyof MultiLang] || link.name?.en || 'Material';
                      return (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">
                          <span className="text-gray-900 dark:text-white">{name}</span>
                          <span className="text-xs text-gray-400 capitalize">{link.type}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Next lesson CTA */}
            {nextLesson && isEnrolled && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">{isAr ? 'الدرس التالي' : 'Up next'}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {nextLesson.title?.[locale as keyof MultiLang] || nextLesson.title?.en}
                  </p>
                </div>
                <Link href={lessonUrl(nextLesson._id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex-shrink-0">
                  {isAr ? 'التالي' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Course complete CTA */}
            {!nextLesson && isEnrolled && completedCount === totalCount && totalCount > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-bold text-green-800 dark:text-green-300 text-lg">{isAr ? 'أتممت الدورة!' : 'Course Complete!'}</p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  {isAr ? 'أحسنت! لقد أنهيت جميع دروس هذه الدورة.' : "Great job! You've finished all lessons."}
                </p>
                <Link href={['', locale, 'courses', slug].join('/')}
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition">
                  <BookOpen className="w-4 h-4" />
                  {isAr ? 'العودة إلى الدورة' : 'Back to Course'}
                </Link>
              </div>
            )}

            {/* Enroll CTA */}
            {!isEnrolled && !isAdmin && !isInstructor && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{isAr ? 'سجّل للوصول إلى جميع الدروس' : 'Enroll to access all lessons'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{isAr ? 'هذا الدرس متاح كمعاينة مجانية' : 'This lesson is a free preview'}</p>
                  </div>
                </div>
                <Link href={['', locale, 'courses', slug].join('/')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex-shrink-0">
                  {isAr ? 'التسجيل' : 'Enroll Now'}
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{isAr ? 'محتوى الدورة' : 'Course Content'}</h3>
                {isEnrolled && totalCount > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{progressPct}%</span>}
              </div>
              <LessonNavigation
                course={serializedCourse}
                currentLessonId={lessonId}
                enrollment={serializedEnrollment}
                locale={locale}
              />
            </div>

            {isLiveLesson && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <LiveChat
                  courseId={serializedCourse._id}
                  lessonId={lessonId}
                  initialMessages={serializedMessages}
                  isEnrolled={isEnrolled}
                  userRole={userRole}
                  locale={locale}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
