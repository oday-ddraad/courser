'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { X, Video, Bell } from 'lucide-react';

interface LiveSession {
  id: string;
  courseSlug: string;
  courseName: string;
  lessonId: string;
  lessonName: string;
  subject: string;
  roomName: string;
  instructorName: string;
  startedAt: string;
  joinUrl: string;
}

interface LiveSessionNotificationProps {
  onSessionJoin?: (session: LiveSession) => void;
}

export default function LiveSessionNotification({ onSessionJoin }: LiveSessionNotificationProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [dismissedSessions, setDismissedSessions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live session notifications from API
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchLiveSessions = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/notifications/live-session');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        
        const data = await res.json();
        
        if (data.success && data.notifications) {
          // Convert notifications to LiveSession format
          const sessions: LiveSession[] = data.notifications.map((notif: any) => ({
            id: notif._id,
            courseSlug: notif.data?.courseSlug || '',
            courseName: notif.data?.courseSlug || 'Course',
            lessonId: notif.data?.lessonId || '',
            lessonName: notif.data?.lessonId || 'Lesson',
            subject: notif.data?.subject || 'Live Session',
            roomName: notif.data?.roomName || '',
            instructorName: notif.data?.instructorName || 'Instructor',
            startedAt: notif.data?.startedAt || notif.createdAt,
            joinUrl: notif.data?.joinUrl || '',
          }));
          
          setActiveSessions(sessions);
        }
      } catch (error) {
        console.error('Error fetching live sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveSessions();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchLiveSessions, 30000);
    
    return () => clearInterval(interval);
  }, [status]);

  const handleDismiss = (sessionId: string) => {
    setDismissedSessions([...dismissedSessions, sessionId]);
  };

  const handleJoin = (liveSession: LiveSession) => {
    onSessionJoin?.(liveSession);
    router.push(liveSession.joinUrl);
  };

  // Filter out dismissed sessions
  const visibleSessions = activeSessions.filter(
    session => !dismissedSessions.includes(session.id)
  );

  if (status !== 'authenticated' || visibleSessions.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {visibleSessions.map((liveSession) => (
        <div
          key={liveSession.id}
          className="bg-blue-600 text-white rounded-lg shadow-lg p-4 animate-slide-in-right"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">🔴 Live Session Started!</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {liveSession.instructorName} started a session
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(liveSession.id)}
              className="text-blue-200 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-sm font-medium">{liveSession.subject}</p>
            <p className="text-xs text-blue-100">
              Course: {liveSession.courseName}
            </p>
            <p className="text-xs text-blue-100">
              Started {new Date(liveSession.startedAt).toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={() => handleJoin(liveSession)}
            className="mt-3 w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded transition text-sm"
          >
            Join Now
          </button>
        </div>
      ))}
    </div>
  );
}

// Helper function to create a test notification (for admin testing)
export function createTestLiveSession(sessionData: Omit<LiveSession, 'id' | 'startedAt'>) {
  const testSession: LiveSession = {
    ...sessionData,
    id: `test-${Date.now()}`,
    startedAt: new Date().toISOString(),
  };
  
  localStorage.setItem('testLiveSession', JSON.stringify(testSession));
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('liveSessionStarted', { detail: testSession }));
  
  return testSession;
}

// Hook to listen for live session events
export function useLiveSessionListener(callback: (session: LiveSession) => void) {
  useEffect(() => {
    const handleLiveSession = (event: CustomEvent<LiveSession>) => {
      callback(event.detail);
    };
    
    window.addEventListener('liveSessionStarted', handleLiveSession as EventListener);
    
    return () => {
      window.removeEventListener('liveSessionStarted', handleLiveSession as EventListener);
    };
  }, [callback]);
}
