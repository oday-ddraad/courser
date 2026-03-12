'use client';

import { useState, useEffect } from 'react';
import { ILesson, ICourse, IEnrollment } from '@/lib/mongodb/models';
import YouTubePrivacyPlayer, { extractYouTubeVideoId } from './YouTubePrivacyPlayer';
import LiveLessonPlayer from './LiveLessonPlayer';
import { CheckCircle, Clock, Radio, AlertCircle, RefreshCw, Lock } from 'lucide-react';

interface LessonPlayerProps {
  lesson: ILesson;
  course: ICourse;
  enrollment: IEnrollment | null;
  locale: string;
}

// ── State banners ──────────────────────────────────────────────────────────────

function LiveBanner({ locale }: { locale: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-t-xl">
      <Radio className="w-4 h-4 animate-pulse" />
      {locale === 'ar' ? 'البث المباشر جارٍ الآن' : 'Live session in progress'}
    </div>
  );
}

function ScheduledBanner({ lesson, locale }: { lesson: ILesson; locale: string }) {
  const scheduled = lesson.scheduledDateTime ? new Date(lesson.scheduledDateTime) : null;
  const formatted = scheduled
    ? scheduled.toLocaleString(locale === 'ar' ? 'ar-SA' : locale === 'de' ? 'de-DE' : 'en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-orange-800 dark:text-orange-300 text-sm">
      <Clock className="w-4 h-4 flex-shrink-0" />
      <span>
        {locale === 'ar'
          ? `هذا الدرس مجدول${formatted ? ` في ${formatted}` : ''}. ستتلقى إشعاراً عند البدء.`
          : `This lesson is scheduled${formatted ? ` for ${formatted}` : ''}. You'll be notified when it starts.`}
      </span>
    </div>
  );
}

function WaitingBanner({ locale }: { locale: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-300 text-sm">
      <Clock className="w-4 h-4 flex-shrink-0 animate-pulse" />
      <div>
        <p className="font-medium">{locale === 'ar' ? 'في انتظار المدرب...' : 'Waiting for instructor...'}</p>
        <p className="text-xs mt-0.5 opacity-80">{locale === 'ar' ? 'ستُحدَّث الصفحة تلقائياً عند بدء البث.' : 'Page will refresh automatically when the session starts.'}</p>
      </div>
      <button onClick={() => window.location.reload()} className="ml-auto p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-800/40 rounded-lg transition" title={locale === 'ar' ? 'تحديث' : 'Refresh'}>
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}

function EndedBanner({ locale }: { locale: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {locale === 'ar' ? 'انتهى هذا الدرس المباشر.' : 'This live session has ended.'}
    </div>
  );
}

function CompletedBanner({ locale }: { locale: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
      <CheckCircle className="w-4 h-4" />
      {locale === 'ar' ? 'أتممت هذا الدرس!' : 'You completed this lesson!'}
    </div>
  );
}

function EnrollmentGate({ locale, courseSlug }: { locale: string; courseSlug: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-48 gap-4 p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
      <Lock className="w-10 h-10 text-gray-400" />
      <div>
        <p className="font-semibold text-gray-800 dark:text-white text-lg">
          {locale === 'ar' ? 'هذا الدرس للمسجلين فقط' : 'Enrolled students only'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {locale === 'ar' ? 'سجّل في الدورة للوصول إلى هذا الدرس.' : 'Enroll in this course to access this lesson.'}
        </p>
      </div>
      <a href={`/${locale}/courses/${courseSlug}`}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm">
        {locale === 'ar' ? 'عرض الدورة' : 'View Course'}
      </a>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LessonPlayer({ lesson: initialLesson, course, enrollment, locale }: LessonPlayerProps) {
  const [lesson, setLesson] = useState<ILesson>(initialLesson);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLive, setIsLive] = useState(initialLesson.liveStatus === 'live');

  const isLiveStream = lesson.isLiveStream;
  const isScheduled = lesson.scheduledDateTime && new Date(lesson.scheduledDateTime) > new Date();
  const youtubeVideoId = lesson.youtubeVideoId || (lesson.videoUrl ? extractYouTubeVideoId(lesson.videoUrl) : null);
  const lessonTitle = lesson.title[locale as keyof typeof lesson.title] || lesson.title.en;

  // Check if lesson is already completed
  useEffect(() => {
    if (enrollment && (enrollment as any).completedLessons) {
      const completed = (enrollment as any).completedLessons.some(
        (id: any) => id.toString() === lesson._id.toString()
      );
      setIsCompleted(completed);
    }
  }, [enrollment, lesson._id]);

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Poll live status for live lessons - check both liveStatus AND meeting data
  useEffect(() => {
    if (!isLiveStream || !enrollment) {
      console.log('LessonPlayer: Skipping poll - isLiveStream:', isLiveStream, 'enrollment:', !!enrollment);
      return;
    }
    
    console.log('LessonPlayer: Starting live status polling for lesson:', lesson._id);
    
    const checkLiveStatus = async () => {
      try {
        const url = `/api/courses/${course._id}/lessons/${lesson._id}/live-status?t=${Date.now()}`;
        console.log('LessonPlayer: Polling:', url);
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          console.log('LessonPlayer: Poll response:', { 
            liveStatus: data.liveStatus, 
            hasMeeting: !!data.meeting,
            meetingRoomName: data.meeting?.roomName 
          });
          
          // Determine if live: either liveStatus is 'live' OR there's an active meeting in DB
          const hasActiveMeeting = !!data.meeting;
          const isLiveNow = data.liveStatus === 'live' || hasActiveMeeting;
          
          console.log('LessonPlayer: Live check:', { isLiveNow, currentIsLive: isLive, hasActiveMeeting });
          
          // Update live state if changed
          if (isLiveNow !== isLive) {
            console.log('LessonPlayer: Updating isLive from', isLive, 'to', isLiveNow);
            setIsLive(isLiveNow);
          }
          
          // Update lesson data if status or room name changed
          // IMPORTANT: If there's an active meeting, force liveStatus to 'live'
          const newRoomName = data.meeting?.roomName || data.jitsiRoomName;
          const effectiveLiveStatus = hasActiveMeeting ? 'live' : data.liveStatus;
          
          if (effectiveLiveStatus !== lesson.liveStatus || (newRoomName && newRoomName !== lesson.jitsiRoomName)) {
            console.log('LessonPlayer: Updating lesson state:', { 
              liveStatus: effectiveLiveStatus, 
              jitsiRoomName: newRoomName 
            });
            setLesson((prev) => ({ 
              ...prev, 
              liveStatus: effectiveLiveStatus, 
              jitsiRoomName: newRoomName || prev.jitsiRoomName 
            }));
          }
        } else {
          console.error('LessonPlayer: Poll failed with status:', res.status);
        }
      } catch (err) {
        console.error('LessonPlayer: Poll error:', err);
      }
    };
    
    // Check immediately on mount
    checkLiveStatus();
    
    // Then poll every 5 seconds for more responsive updates
    const interval = setInterval(checkLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [isLiveStream, enrollment, course._id, lesson._id, lesson.liveStatus, isLive]);

  const markComplete = async () => {
    if (!enrollment || isCompleted) return;
    try {
      await fetch(`/api/courses/${course._id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson._id.toString(), action: 'complete' }),
      });
      setIsCompleted(true);
    } catch { /* silent */ }
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render video area ──────────────────────────────────────────────────────

  const renderVideoArea = () => {
    // Not enrolled and not preview
    if (!enrollment && !lesson.isPreview) {
      return <EnrollmentGate locale={locale} courseSlug={course.slug} />;
    }

    // Live stream
    if (isLiveStream) {
      if (isLive || lesson.liveStatus === 'live') {
        return (
          <div className="w-full rounded-xl overflow-hidden" style={{ height: '480px' }}>
            <LiveBanner locale={locale} />
            <div style={{ height: 'calc(100% - 36px)' }}>
              <LiveLessonPlayer
                lesson={{ _id: lesson._id.toString(), title: lesson.title, scheduledDateTime: lesson.scheduledDateTime?.toString(), jitsiRoomName: lesson.jitsiRoomName, liveStatus: lesson.liveStatus, isLiveStream: lesson.isLiveStream }}
                courseSlug={course.slug}
                locale={locale}
                userName={(enrollment as any)?.studentId?.name || 'Student'}
                userEmail={(enrollment as any)?.studentId?.email || ''}
                isModerator={false}
              />
            </div>
          </div>
        );
      }
      if (lesson.liveStatus === 'ended') return <EndedBanner locale={locale} />;
      if (isScheduled) return <ScheduledBanner lesson={lesson} locale={locale} />;
      return <WaitingBanner locale={locale} />;
    }

    // YouTube video
    if (youtubeVideoId) {
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
          <YouTubePrivacyPlayer
            videoId={youtubeVideoId}
            title={lessonTitle}
            className="w-full h-full"
            onEnded={markComplete}
          />
        </div>
      );
    }

    // Native video
    if (lesson.videoUrl) {
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
          <video src={lesson.videoUrl} controls className="w-full h-full" onEnded={markComplete} />
        </div>
      );
    }

    // No video
    return (
      <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm">{locale === 'ar' ? 'لا يوجد فيديو لهذا الدرس' : 'No video available for this lesson'}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Completed banner */}
      {isCompleted && <CompletedBanner locale={locale} />}

      {/* Video area */}
      {renderVideoArea()}

      {/* Mark complete button (uploaded lessons, enrolled, not yet completed) */}
      {!isLiveStream && enrollment && !isCompleted && (youtubeVideoId || lesson.videoUrl) && (
        <div className="flex justify-end">
          <button
            onClick={markComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
          >
            <CheckCircle className="w-4 h-4" />
            {locale === 'ar' ? 'تحديد كمكتمل' : 'Mark as complete'}
          </button>
        </div>
      )}

      {/* Live chat placeholder for live lessons */}
      {isLiveStream && enrollment && (isLive || lesson.liveStatus === 'live') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
            {locale === 'ar' ? 'الدردشة المباشرة' : 'Live Chat'}
          </h3>
          <div className="h-40 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            {locale === 'ar' ? 'الدردشة متاحة أثناء البث المباشر' : 'Chat available during live session'}
          </div>
        </div>
      )}
    </div>
  );
}
