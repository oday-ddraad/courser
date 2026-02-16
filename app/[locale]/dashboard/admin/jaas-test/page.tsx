'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { 
  Video, 
  Users, 
  Bell, 
  Play, 
  X, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { createTestLiveSession } from '@/components/LiveSessionNotification';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface JitsiMeetingInlineProps {
  roomName: string;
  jwt: string;
  appId: string;
  userName?: string;
  userEmail?: string;
  isModerator?: boolean;
  onMeetingEnd?: () => void;
  meetingId?: string;
}


function JitsiMeetingInline({
  roomName,
  jwt,
  appId,
  userName = 'Guest',
  userEmail = '',
  isModerator = false,
  onMeetingEnd,
}: JitsiMeetingInlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    if (!appId) {
      setError('JaaS appId not provided');
      setIsLoading(false);
      return;
    }

    let cleanRoom = roomName;
    if (cleanRoom.includes(`${appId}/`)) {
      cleanRoom = cleanRoom.split(`${appId}/`)[1];
    }
    const fullRoomName = `${appId}/${cleanRoom}`;

    setStatus(`Loading Jitsi for room: ${fullRoomName}`);

    const script = document.createElement('script');
    script.src = `https://8x8.vc/${appId}/external_api.js`;
    script.async = true;

    script.onload = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) {
        setError('Failed to load Jitsi API');
        setIsLoading(false);
        return;
      }

      try {
        const options = {
          roomName: fullRoomName,
          jwt: jwt,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: userName,
            email: userEmail,
          },
          configOverwrite: {
            // Performance optimizations
            prejoinPageEnabled: false, // Skip prejoin to reduce load
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            
            // Reduce video quality for better performance
            resolution: 360,
            constraints: {
              video: {
                height: { ideal: 360, max: 720 },
                width: { ideal: 640, max: 1280 }
              }
            },
            
            // Disable resource-intensive features
            disableSimulcast: false,
            enableLayerSuspension: true,
            
            // Optimize audio
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            
            // Disable unnecessary features
            disableDeepLinking: true,
            disableInviteFunctions: true,
            doNotStoreRoom: true,
            
            // P2P for better performance with few participants
            p2p: {
              enabled: true,
              stunServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
              ]
            },
            
            // Reduce analytics overhead
            analytics: {
              disabled: true
            },
            
            // Optimize tile view
            tileView: {
              numberOfVisibleTiles: 4
            }
          },
          interfaceConfigOverwrite: {
            // Minimize UI elements for better performance
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            
            // Disable animations
            DISABLE_VIDEO_BACKGROUND: true,
            
            // Optimize toolbar
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'hangup',
              'chat',
              'tileview'
            ],
            
            // Reduce filmstrip tiles
            FILM_STRIP_MAX_HEIGHT: 90,
            TILE_VIEW_MAX_COLUMNS: 2
          }
        };

        apiRef.current = new window.JitsiMeetExternalAPI('8x8.vc', options);

        apiRef.current.addEventListener('videoConferenceJoined', () => {
          setIsLoading(false);
          setStatus(`Joined as ${isModerator ? 'Moderator' : 'Participant'}`);
        });

        apiRef.current.addEventListener('videoConferenceLeft', () => {
          onMeetingEnd?.();
        });

        apiRef.current.addEventListener('readyToClose', () => {
          onMeetingEnd?.();
        });

        apiRef.current.addEventListener('errorOccurred', (err: any) => {
          console.error('Jitsi error:', err);
          let msg = 'Meeting error occurred';
          if (err?.error && typeof err.error === 'string') {
            msg = err.error;
          } else if (err?.error?.message) {
            msg = err.error.message;
          } else if (err?.message && typeof err.message === 'string') {
            msg = err.message;
          }
          
          if (msg.includes('could not obtain public key')) {
            msg = 'JWT Authentication Failed: The API Key ID (kid) in your JWT does not match JaaS. Please check your JAAS_API_KEY_ID in .env.local';
          }
          
          setError(msg);
          setIsLoading(false);
        });

        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
          }
        }, 10000);

      } catch (err: any) {
        console.error('Jitsi init error:', err);
        setError(err?.message || 'Failed to initialize meeting');
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError('Failed to load Jitsi script');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      apiRef.current?.dispose();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [roomName, jwt, appId, userName, userEmail, isModerator, onMeetingEnd]);

  return (
    <div className="w-full h-[600px] relative border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading meeting...</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{status}</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 z-10 p-6">
          <AlertCircle className="w-12 h-12 mb-4" />
          <div className="font-bold mb-2 text-center">Error: {error}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">{status}</div>
          {error.includes('could not obtain public key') && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg max-w-md text-sm text-gray-700 dark:text-gray-300 mb-4">
              <strong className="text-red-600 dark:text-red-400">How to fix:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to <a href="https://8x8.vc" target="_blank" className="text-blue-600 dark:text-blue-400 underline">https://8x8.vc</a></li>
                <li>Navigate to API Keys section</li>
                <li>Copy your API Key ID (format: vpaas-magic-cookie-xxx/yyyy)</li>
                <li>Add to .env.local: <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">JAAS_API_KEY_ID=vpaas-magic-cookie-xxx/yyyy</code></li>
                <li>Restart the server</li>
              </ol>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full bg-slate-900" />
    </div>
  );
}

export default function JaaSTestPage() {
  const { data: session } = useSession();
  const t = useTranslations();
  
  const [roomName, setRoomName] = useState('');
  const [jwt, setJwt] = useState('');
  const [appId, setAppId] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [meetingId, setMeetingId] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [configInfo, setConfigInfo] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notificationSent, setNotificationSent] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

  const [showMeeting, setShowMeeting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState<string>('');
  const [isEnding, setIsEnding] = useState(false);


  // Load config and users on mount
  useEffect(() => {
    fetch('/api/jaas/debug')
      .then(res => res.json())
      .then(data => setConfigInfo(data))
      .catch(err => console.error('Failed to load config:', err));

    // Fetch users for notification
    fetch('/api/users?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          // Filter only regular users (not admin/instructor)
          const regularUsers = data.data.filter((u: User) => u.role === 'user');
          setUsers(regularUsers);
        }
      })
      .catch(err => console.error('Failed to load users:', err));

  }, []);

  const createMeeting = async () => {
    setLoading(true);
    setError('');
    setTokenInfo('');
    setDebugInfo(null);
    setNotificationSent(false);

    try {
      const res = await fetch('/api/jaas/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSlug: 'test-course',
          lessonId: 'lesson-1',
          subject: 'Test Live Session',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to create meeting');
      }

      if (!data.meeting?.roomName || !data.meeting?.jwt || !data.meeting?.appId) {
        throw new Error('Invalid meeting data received');
      }

      setRoomName(data.meeting.roomName);
      setJwt(data.meeting.jwt);
      setAppId(data.meeting.appId);
      setIsModerator(data.meeting.isModerator || false);
      setMeetingId(data.meeting.id);
      setDebugInfo(data.debug);
      setShowMeeting(true);
      setTokenInfo(`Meeting created successfully! You are the moderator.`);

      // Generate join URL for students
      const url = `${window.location.origin}/dashboard/user/join-meeting?room=${encodeURIComponent(data.meeting.roomName)}&course=test-course&lesson=lesson-1&subject=Test%20Live%20Session`;
      setJoinUrl(url);


    } catch (err: any) {
      console.error('Error:', err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testToken = async () => {
    setLoading(true);
    setError('');
    setTokenInfo('');
    setDebugInfo(null);

    try {
      const res = await fetch('/api/jaas/token');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to get token');
      }

      setDebugInfo(data.debug);
      setTokenInfo(`Token generated! Length: ${data.token?.length || 0} chars | Moderator: ${data.isModerator ? 'Yes' : 'No'}`);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const sendNotifications = async () => {
    if (!roomName || selectedUsers.length === 0) return;

    try {
      const res = await fetch('/api/notifications/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          roomName: roomName,
          courseSlug: 'test-course',
          lessonId: 'lesson-1',
          subject: 'Test Live Session',
          joinUrl: joinUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send notifications');
      }

      setNotificationSent(true);
      
      // Reset after 3 seconds
      setTimeout(() => setNotificationSent(false), 3000);
    } catch (err: any) {
      console.error('Error sending notifications:', err);
      setError(err.message || 'Failed to send notifications');
    }
  };

  const copyJoinUrl = () => {
    navigator.clipboard.writeText(joinUrl);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          <Video className="inline-block w-8 h-8 mr-2 text-blue-600" />
          JaaS Test & Control Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create meetings, test JWT tokens, and send notifications to users
        </p>
      </div>

      {/* Configuration Status */}
      {configInfo && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Configuration Status</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">App ID:</span>
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {configInfo.config?.appId || <span className="text-red-500">Not set</span>}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">API Key ID:</span>
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {configInfo.config?.apiKeyId || <span className="text-red-500">Not set</span>}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Private Key:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {configInfo.config?.privateKeyLength ? (
                  <span className="text-green-600 dark:text-green-400">✓ Loaded ({configInfo.config.privateKeyLength} chars)</span>
                ) : (
                  <span className="text-red-500">Not loaded</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Key File:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {configInfo.keyFile?.exists ? (
                  <span className="text-green-600 dark:text-green-400">✓ Found</span>
                ) : (
                  <span className="text-red-500">✗ Not found</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <a 
              href="/api/jaas/debug" 
              target="_blank" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              View Full Debug Info
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-300">Error</h3>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {tokenInfo && !error && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-300">Success</h3>
            <p className="text-green-700 dark:text-green-400 text-sm">{tokenInfo}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-4">
        <button 
          onClick={testToken}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Settings className="w-5 h-5" />
          )}
          Test Token Generation
        </button>
        
        <button 
          onClick={createMeeting}
          disabled={loading || showMeeting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {showMeeting ? 'Meeting Active' : 'Create & Join Meeting'}
        </button>
      </div>

      {/* Meeting Display */}
      {showMeeting && (
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Live Meeting
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Room: <code className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{roomName}</code>
                  <span className="ml-3 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                    Moderator
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!meetingId) return;
                    setIsEnding(true);
                    try {
                      const res = await fetch(`/api/jaas/meetings/${meetingId}/end`, {
                        method: 'POST',
                      });
                      if (res.ok) {
                        setShowMeeting(false);
                        setTokenInfo('Meeting ended successfully');
                      } else {
                        const data = await res.json();
                        setError(data.error || 'Failed to end meeting');
                      }
                    } catch (err: any) {
                      setError(err.message || 'Error ending meeting');
                    } finally {
                      setIsEnding(false);
                    }
                  }}
                  disabled={isEnding}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition"
                >
                  {isEnding ? 'Ending...' : 'End Meeting'}
                </button>
                <button
                  onClick={() => setShowMeeting(false)}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

            </div>
            
            <JitsiMeetingInline
              roomName={roomName}
              jwt={jwt}
              appId={appId}
              userName={session?.user?.name || 'Instructor'}
              userEmail={session?.user?.email || ''}
              isModerator={true}
              meetingId={meetingId}
              onMeetingEnd={() => {
                setShowMeeting(false);
                setTokenInfo('Meeting ended');
              }}
            />

          </div>
        </div>
      )}

      {/* User Notification Section */}
      {showMeeting && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Join URL */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-green-600" />
              Student Join URL
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg mb-4 break-all text-sm text-gray-700 dark:text-gray-300">
              {joinUrl}
            </div>
            <button
              onClick={copyJoinUrl}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              <Copy className="w-4 h-4" />
              Copy Join URL
            </button>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Share this URL with students or send notifications below
            </p>
          </div>

          {/* User Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-600" />
              Send Notifications
            </h3>
            
            <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
              {users.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              ) : (
                users.map(user => (
                  <label 
                    key={user._id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 last:border-0 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <button
              onClick={sendNotifications}
              disabled={selectedUsers.length === 0 || notificationSent}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg transition"
            >
              {notificationSent ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Notifications Sent!
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Notify {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
            
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Selected users will see a notification popup on their dashboard
            </p>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">JWT Debug Info</h3>
          <pre className="text-xs overflow-auto bg-white dark:bg-slate-900 p-3 rounded border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
