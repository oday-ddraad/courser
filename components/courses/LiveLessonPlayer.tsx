'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import JitsiMeeting from '@/components/JitsiMeeting';

interface LiveLessonPlayerProps {
  lesson: {
    _id: string;
    title: { en: string; de: string; ar: string };
    scheduledDateTime?: string | Date;
    jitsiRoomName?: string;
    liveStatus?: 'scheduled' | 'live' | 'ended';
    isLiveStream?: boolean;
  };
  courseSlug: string;
  locale: string;
  userName?: string;
  userEmail?: string;
  isModerator?: boolean;
}

// Memoized component to prevent unnecessary re-renders
function LiveLessonPlayer({
  lesson,
  courseSlug,
  locale,
  userName,
  userEmail,
  isModerator = false,
}: LiveLessonPlayerProps) {
  const hasFetchedRef = useRef(false);
  const [meetingData, setMeetingData] = useState<{
    roomName: string;
    jwt: string;
    appId: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lessonTitle = lesson.title?.[locale as keyof typeof lesson.title] || lesson.title?.en || 'Live Lesson';

  // Memoized fetch function
  const fetchMeetingData = useCallback(async () => {
    // Prevent double fetching
    if (hasFetchedRef.current) {
      console.log('LiveLessonPlayer: Already fetched, skipping');
      return;
    }
    hasFetchedRef.current = true;

    try {
      setLoading(true);
      setError(null);
      
      console.log('LiveLessonPlayer: Fetching meeting data:', { 
        courseSlug, 
        lessonId: lesson._id, 
        liveStatus: lesson.liveStatus, 
        isModerator,
        hasJitsiRoomName: !!lesson.jitsiRoomName
      });
      
      // For instructors/moderators, use a different endpoint to create the meeting
      const endpoint = isModerator 
        ? `/api/courses/${courseSlug}/lessons/${lesson._id}/start-live?t=${Date.now()}`
        : `/api/jaas/meetings?t=${Date.now()}`;
      
      const requestBody = isModerator 
        ? {} 
        : {
            courseSlug,
            lessonId: lesson._id,
            jitsiRoomName: lesson.jitsiRoomName, // Pass the room name directly
            subject: lessonTitle,
          };
      
      console.log('LiveLessonPlayer: Using endpoint:', endpoint, 'Body:', requestBody);
      
      // Call the API to get or create meeting with cache-busting
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('LiveLessonPlayer: Meeting API response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to get meeting data');
      }

      if (data.success && data.meeting) {
        console.log('LiveLessonPlayer: Meeting data received, setting state');
        setMeetingData({
          roomName: data.meeting.roomName,
          jwt: data.meeting.jwt,
          appId: data.meeting.appId,
        });
      } else {
        throw new Error('Invalid meeting data received');
      }
    } catch (err: any) {
      console.error('LiveLessonPlayer: Error fetching meeting data:', err);
      setError(err.message || 'Failed to load meeting');
    } finally {
      setLoading(false);
    }
  }, [courseSlug, lesson._id, lesson.liveStatus, lessonTitle, isModerator, lesson.jitsiRoomName]);

  useEffect(() => {
    // Reset hasFetchedRef when liveStatus changes to allow re-fetching
    // This is important when lesson goes from 'scheduled' to 'live'
    hasFetchedRef.current = false;
    
    // Only fetch meeting data when lesson is actually live
    // For scheduled lessons, show the scheduled state without fetching
    if (lesson.liveStatus === 'live') {
      fetchMeetingData();
    } else if (lesson.liveStatus === 'scheduled') {
      // Show scheduled state, don't try to fetch meeting yet
      setLoading(false);
      setError(null);
    } else {
      setLoading(false);
      setError('Lesson is not currently live');
    }
  }, [lesson.liveStatus, lesson.isLiveStream, fetchMeetingData]);

  // Polling effect: retry fetching when lesson is live but we got "not started" error
  useEffect(() => {
    // Only poll if:
    // 1. Lesson is live
    // 2. We have an error that indicates "not started" OR any error when lesson is live
    // 3. We don't have meeting data yet
    const isNotStartedError = error?.includes('not started') || error?.includes('notStarted');
    const isLiveError = lesson.liveStatus === 'live' && error;
    
    if ((isLiveError || isNotStartedError) && !meetingData) {
      console.log('LiveLessonPlayer: Starting polling for meeting...');
      
      const pollInterval = setInterval(() => {
        console.log('LiveLessonPlayer: Retrying fetch...');
        // Reset the hasFetchedRef to allow re-fetching
        hasFetchedRef.current = false;
        fetchMeetingData();
      }, 3000); // Retry every 3 seconds
      
      return () => {
        console.log('LiveLessonPlayer: Stopping polling');
        clearInterval(pollInterval);
      };
    }
  }, [lesson.liveStatus, error, meetingData, fetchMeetingData]);

  // Show scheduled state only if lesson is NOT live
  if (lesson.liveStatus !== 'live' && (lesson.liveStatus === 'scheduled' || (lesson.scheduledDateTime && new Date(lesson.scheduledDateTime) > new Date()))) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">{lessonTitle}</p>
          <p className="text-gray-300 mb-2">
            {locale === 'ar' ? 'الدرس المباشر سيبدأ قريباً' : 
             locale === 'de' ? 'Live-Unterricht beginnt bald' : 
             'Live lesson starting soon'}
          </p>
          {lesson.scheduledDateTime && (
            <p className="text-gray-400">
              {new Date(lesson.scheduledDateTime).toLocaleString(locale === 'ar' ? 'ar-SY' : locale === 'de' ? 'de-DE' : 'en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">
            {locale === 'ar' ? 'جاري تحميل الدرس المباشر...' : 
             locale === 'de' ? 'Live-Unterricht wird geladen...' : 
             'Loading live lesson...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !meetingData) {
    // Check if it's a "not started" error for students or "not currently live" error
    const isNotStarted = error?.includes('not started') || error?.includes('notStarted') || 
                         error?.includes('not currently live');
    
    return (
      <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
        <div className="text-center max-w-lg px-4">
          <p className="text-xl font-semibold mb-2">{lessonTitle}</p>
          
          {isNotStarted && !isModerator ? (
            // Show "waiting for instructor" message for students only
            <>
              <div className="mb-4">
                <div className="animate-pulse flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              <p className="text-yellow-300 mb-2 text-lg">
                {locale === 'ar' ? 'في انتظار المدرب...' : 
                 locale === 'de' ? 'Warte auf den Dozenten...' : 
                 'Waiting for instructor...'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {locale === 'ar' ? 'المدرب لم يبدأ الدرس المباشر بعد. سيتم تحديث الصفحة تلقائياً عندما يبدأ.' : 
                 locale === 'de' ? 'Der Dozent hat den Live-Unterricht noch nicht gestartet. Die Seite wird automatisch aktualisiert, wenn er beginnt.' : 
                 'The instructor has not started the live lesson yet. The page will refresh automatically when it begins.'}
              </p>
            </>
          ) : (
            // Show generic error
            <>
              <p className="text-red-300 mb-2">
                {locale === 'ar' ? 'فشل تحميل الدرس المباشر' : 
                 locale === 'de' ? 'Fehler beim Laden des Live-Unterrichts' : 
                 'Failed to load live lesson'}
              </p>
              <p className="text-gray-300 text-sm mb-4">{error || 'Meeting data not available'}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {locale === 'ar' ? 'إعادة المحاولة' : 
                 locale === 'de' ? 'Erneut versuchen' : 
                 'Retry'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <JitsiMeeting
      roomName={meetingData.roomName}
      jwt={meetingData.jwt}
      appId={meetingData.appId}
      userName={userName || 'Student'}
      userEmail={userEmail || ''}
      isModerator={isModerator}
      height="100%"
    />
  );
}

// Export memoized version to prevent parent re-renders from re-initializing
const MemoizedLiveLessonPlayer = memo(LiveLessonPlayer, (prevProps, nextProps) => {
  // Re-render if lesson ID changes, live status changes, moderator status changes, or user changes
  // This ensures the component updates when the lesson goes live
  return (
    prevProps.lesson._id === nextProps.lesson._id &&
    prevProps.lesson.liveStatus === nextProps.lesson.liveStatus &&
    prevProps.isModerator === nextProps.isModerator &&
    prevProps.userName === nextProps.userName
  );
});

export default MemoizedLiveLessonPlayer;
