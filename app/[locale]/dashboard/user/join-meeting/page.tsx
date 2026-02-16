'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { 
  Video, 
  Users, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  LogOut,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

const JitsiMeeting = dynamic(() => import('@/components/JitsiMeeting'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-100 dark:bg-slate-800 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function JoinMeetingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMeeting, setShowMeeting] = useState(false);
  const [jwt, setJwt] = useState('');
  const [appId, setAppId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);

  const roomName = searchParams.get('room') || '';
  const courseSlug = searchParams.get('course') || '';
  const lessonId = searchParams.get('lesson') || '';
  const subject = searchParams.get('subject') || 'Live Session';

  useEffect(() => {
    if (status === 'unauthenticated') {
      const currentUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      setUserName(session.user.name || 'Student');
      setUserEmail(session.user.email || '');
      setIsLoading(false);
    }
  }, [status, session, router]);

  const joinMeeting = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      const res = await fetch('/api/jaas/token');
      if (!res.ok) {
        throw new Error('Failed to get meeting token');
      }
      const data = await res.json();
      setJwt(data.token);
      setAppId(data.appId || '');
      setShowMeeting(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to join meeting');
    }
  };

  const handleMeetingEnd = () => {
    setShowMeeting(false);
    // Redirect back to dashboard
    router.push('/dashboard/user');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!roomName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              <h1 className="text-2xl font-bold text-red-900 dark:text-red-300">
                Invalid Meeting Link
              </h1>
            </div>
            <p className="text-red-700 dark:text-red-400 mb-4">
              No meeting room specified. Please check your notification link or contact your instructor.
            </p>
            <button
              onClick={() => router.push('/dashboard/user')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Join Live Session
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-12">
            Course: <span className="font-medium text-gray-900 dark:text-white">{courseSlug}</span>
            <span className="mx-2">•</span>
            Lesson: <span className="font-medium text-gray-900 dark:text-white">{lessonId}</span>
          </p>
          {subject && (
            <p className="text-lg text-blue-600 dark:text-blue-400 font-medium ml-12 mt-1">
              {subject}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300">Error</h3>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Pre-join Screen */}
        {!showMeeting && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Join Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Enter Your Details
              </h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Device Controls */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                    audioEnabled 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  {audioEnabled ? 'Mic On' : 'Mic Off'}
                </button>
                <button
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                    videoEnabled 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {videoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                  {videoEnabled ? 'Camera On' : 'Camera Off'}
                </button>
              </div>

              <button
                onClick={joinMeeting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg transition shadow-lg hover:shadow-xl"
              >
                <Video className="w-6 h-6" />
                Join Meeting
              </button>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                By joining, you agree to participate in the live session
              </p>
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                    Before You Join
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Test your camera and microphone
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Ensure you're in a quiet environment
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Use a stable internet connection (WiFi recommended)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Close unnecessary applications
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                  Meeting Info
                </h3>
                <div className="space-y-1 text-sm text-yellow-800 dark:text-yellow-400">
                  <p><strong>Room:</strong> {roomName}</p>
                  <p><strong>Course:</strong> {courseSlug}</p>
                  <p><strong>Lesson:</strong> {lessonId}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Meeting */}
        {showMeeting && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-green-600" />
                  {subject}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Joined as: <span className="font-medium text-gray-700 dark:text-gray-300">{userName}</span>
                </p>
              </div>
              <button
                onClick={handleMeetingEnd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Leave Meeting
              </button>
            </div>

            <JitsiMeeting
              roomName={roomName}
              jwt={jwt}
              appId={appId}
              userName={userName}
              userEmail={userEmail}
              height="600px"
              onMeetingEnd={handleMeetingEnd}
            />
          </div>
        )}
      </div>
    </div>
  );
}
