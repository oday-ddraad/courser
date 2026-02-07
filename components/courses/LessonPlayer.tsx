'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ILesson, ICourse, IEnrollment } from '@/lib/mongodb/models';

interface LessonPlayerProps {
  lesson: ILesson;
  course: ICourse;
  enrollment: IEnrollment | null;
  locale: string;
}

export default function LessonPlayer({ lesson, course, enrollment, locale }: LessonPlayerProps) {
  const t = useTranslations('courses');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get localized lesson title
  const lessonTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title.en;
  
  // Check if lesson is a live stream
  const isLiveStream = lesson.isLiveStream;
  
  // Check if live stream is scheduled for the future
  const isScheduled = lesson.scheduledDateTime && new Date(lesson.scheduledDateTime) > new Date();
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [lesson._id]);
  
  if (isLoading) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Video/Live Stream Player */}
      <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
        {isLiveStream ? (
          <div className="w-full h-full flex items-center justify-center text-white">
            {isScheduled ? (
              <div className="text-center">
                <p className="text-xl font-semibold mb-2">{t('liveStreamStartingSoon')}</p>
                <p className="text-gray-400">
                  {new Date(lesson.scheduledDateTime!).toLocaleString(locale)}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xl font-semibold mb-4">{lessonTitle}</p>
                <p className="text-gray-400 mb-4">{t('jitsiLiveStreamIntegration')}</p>
                <div className="px-4 py-2 bg-blue-600 rounded-lg">
                  {t('joinLiveStream')}
                </div>
              </div>
            )}
          </div>
        ) : lesson.videoUrl ? (
          <video
            src={lesson.videoUrl}
            controls
            className="w-full h-full"
            onEnded={() => {
              // Mark lesson as completed when video ends
              if (enrollment) {
                fetch(`/api/courses/${course._id}/progress`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    lessonId: lesson._id.toString(),
                    action: 'complete',
                  }),
                });
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>{t('noVideoAvailable')}</p>
          </div>
        )}
      </div>
      
      {/* Live Chat placeholder */}
      {(isLiveStream || course.isLiveStream) && enrollment && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            {t('liveChat')}
          </h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
            {t('chatIntegrationPlaceholder')}
          </div>
        </div>
      )}
    </div>
  );
}
