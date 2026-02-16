'use client';

import { useEffect, useRef, useState } from 'react';

interface JitsiMeetingProps {
  roomName: string;
  jwt: string;
  appId: string;
  userName?: string;
  userEmail?: string;
  isModerator?: boolean;
  height?: string;
  onMeetingEnd?: () => void;
  meetingId?: string; // For ending the meeting via API
}


declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeeting({
  roomName,
  jwt,
  appId,
  userName = 'Guest',
  userEmail = '',
  isModerator = false,
  height = '600px',
  onMeetingEnd,
  meetingId,
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [isEnding, setIsEnding] = useState(false);


  useEffect(() => {
    if (!appId) {
      setError('JaaS appId not provided');
      setIsLoading(false);
      return;
    }

    // Clean room name - remove appId prefix if present
    let cleanRoom = roomName;
    if (cleanRoom.includes(`${appId}/`)) {
      cleanRoom = cleanRoom.split(`${appId}/`)[1];
    }

    const fullRoomName = `${appId}/${cleanRoom}`;
    setStatus(`Loading Jitsi for room: ${fullRoomName}`);

    // Load Jitsi script
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
          },
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

        // Listen for hangup event to end meeting for moderator
        apiRef.current.addEventListener('hangup', () => {
          if (isModerator && meetingId) {
            endMeeting();
          }
        });


        apiRef.current.addEventListener('errorOccurred', (err: any) => {
          const errorMessage = typeof err.error === 'string' ? err.error : 
                               typeof err.error === 'object' && err.error?.message ? err.error.message :
                               'Meeting error occurred';
          setError(errorMessage);
          setIsLoading(false);
        });

        // Timeout fallback
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
          }
        }, 10000);

      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to initialize meeting';
        setError(errorMessage);
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
  }, [roomName, jwt, appId, userName, userEmail, isModerator, onMeetingEnd, meetingId]);

  // Function to end meeting via API
  const endMeeting = async () => {
    if (!meetingId || !isModerator) return;
    
    setIsEnding(true);
    try {
      const response = await fetch(`/api/jaas/meetings/${meetingId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Meeting ended:', data);
        onMeetingEnd?.();
      } else {
        const error = await response.json();
        console.error('Failed to end meeting:', error);
      }
    } catch (err) {
      console.error('Error ending meeting:', err);
    } finally {
      setIsEnding(false);
    }
  };

  // Handle manual end meeting button
  const handleEndMeeting = () => {
    if (confirm('Are you sure you want to end this meeting for all participants?')) {
      // Execute hangup command in Jitsi
      apiRef.current?.executeCommand('hangup');
      endMeeting();
    }
  };


  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
            zIndex: 10,
          }}
        >
          <div>Loading meeting...</div>
          <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>{status}</div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fee2e2',
            color: '#dc2626',
            zIndex: 10,
          }}
        >
          <div>
            <p>Error: {error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* End Meeting Button for Moderators */}
      {isModerator && meetingId && !isLoading && !error && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 20,
          }}
        >
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isEnding ? 'not-allowed' : 'pointer',
              opacity: isEnding ? 0.7 : 1,
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {isEnding ? 'Ending...' : 'End Meeting'}
          </button>
        </div>
      )}


      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#1a1a1a',
        }}
      />
    </div>
  );
}
