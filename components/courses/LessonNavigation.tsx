'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ICourse, IEnrollment } from '@/lib/mongodb/models';
import { CheckCircle, PlayCircle, Lock, Radio } from 'lucide-react';
import Link from 'next/link';

interface LessonNavigationProps {
  course: ICourse;
  currentLessonId: string;
  enrollment: IEnrollment | null;
  locale: string;
}

export default function LessonNavigation({ 
  course, 
  currentLessonId, 
  enrollment, 
  locale 
}: LessonNavigationProps) {
  const t = useTranslations('courses');
  
  const isEnrolled = !!enrollment;
  const completedLessons = enrollment?.progress?.completedLessons?.map((id: any) => id.toString()) || [];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">
        {t('courseContent')}
      </h3>
      
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {course.lessons?.map((lesson: any, index: number) => {
          const lessonId = lesson._id.toString();
          const isCurrent = lessonId === currentLessonId;
          const isCompleted = completedLessons.includes(lessonId);
          const isPreview = lesson.isPreview;
          const isAccessible = isEnrolled || isPreview;
          const isLiveStream = lesson.isLiveStream;
          
          const lessonTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title.en;
          
          return (
            <Link
              key={lessonId}
              href={isAccessible ? `/${locale}/courses/${course.slug}/lessons/${lessonId}` : '#'}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-colors
                ${isCurrent 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${!isAccessible ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              onClick={(e) => !isAccessible && e.preventDefault()}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : isLiveStream ? (
                  <Radio className="w-5 h-5 text-red-500" />
                ) : isAccessible ? (
                  <PlayCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {/* Lesson Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCurrent ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                  {index + 1}. {lessonTitle}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lesson.duration} {t('minutes')}
                  {isPreview && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      {t('preview')}
                    </span>
                  )}
                  {isLiveStream && (
                    <span className="ml-2 text-red-600 dark:text-red-400">
                      {t('live')}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Progress Summary */}
      {isEnrolled && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{t('yourProgress')}</span>
            <span>{enrollment?.progress?.completionPercentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${enrollment?.progress?.completionPercentage || 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {completedLessons.length} / {course.lessons?.length || 0} {t('lessonsCompleted')}
          </p>
        </div>
      )}
    </div>
  );
}
