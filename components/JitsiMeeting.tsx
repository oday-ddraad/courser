'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';

interface JitsiMeetingProps {
  roomName: string;
  jwt: string;
  appId: string;
  userName?: string;
  userEmail?: string;
  isModerator?: boolean;
  height?: string;
  onMeetingEnd?: () => void;
  meetingId?: string;
}

// Jitsi Settings interface
interface JitsiSettings {
  resolution: number;
  maxVideoHeight: number;
  maxVideoWidth: number;
  startWithVideoMuted: boolean;
  startWithAudioMuted: boolean;
  enableNoAudioDetection: boolean;
  enableNoisyMicDetection: boolean;
  disableSimulcast: boolean;
  enableLayerSuspension: boolean;
  p2pEnabled: boolean;
  prejoinPageEnabled: boolean;
  showJitsiWatermark: boolean;
  showBrandWatermark: boolean;
  disableVideoBackground: boolean;
  numberOfVisibleTiles: number;
  maxTileViewColumns: number;
  filmStripMaxHeight: number;
  analyticsDisabled: boolean;
  disableDeepLinking: boolean;
  disableInviteFunctions: boolean;
  doNotStoreRoom: boolean;
  toolbarButtons: string[];
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

// Default optimized settings for low CPU/memory usage
const defaultSettings: JitsiSettings = {
  resolution: 240,
  maxVideoHeight: 360,
  maxVideoWidth: 640,
  startWithVideoMuted: true,
  startWithAudioMuted: true,
  enableNoAudioDetection: true,
  enableNoisyMicDetection: true,
  disableSimulcast: true,
  enableLayerSuspension: true,
  p2pEnabled: true,
  prejoinPageEnabled: false,
  showJitsiWatermark: false,
  showBrandWatermark: false,
  disableVideoBackground: true,
  numberOfVisibleTiles: 2,
  maxTileViewColumns: 1,
  filmStripMaxHeight: 60,
  analyticsDisabled: true,
  disableDeepLinking: true,
  disableInviteFunctions: true,
  doNotStoreRoom: true,
  toolbarButtons: [
    'microphone',
    'camera',
    'desktop',  // Screen sharing
    'hangup',
    'chat',
    'fullscreen',
    'tileview',
  ],
};

// Memoized component to prevent unnecessary re-renders
function JitsiMeeting({
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
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const isInitializedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [isEnding, setIsEnding] = useState(false);

  // Memoized end meeting callback
  const endMeeting = useCallback(async () => {
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
  }, [meetingId, isModerator, onMeetingEnd]);

  // Memoized handle end meeting
  const handleEndMeeting = useCallback(() => {
    if (confirm('Are you sure you want to end this meeting for all participants?')) {
      apiRef.current?.executeCommand('hangup');
      endMeeting();
    }
  }, [endMeeting]);

  // Memoized onMeetingEnd callback
  const handleMeetingEnd = useCallback(() => {
    onMeetingEnd?.();
  }, [onMeetingEnd]);

  useEffect(() => {
    // Prevent double initialization
    if (isInitializedRef.current) {
      console.log('JitsiMeeting: Already initialized, skipping');
      return;
    }

    if (!appId || !jwt) {
      console.error('JitsiMeeting: Missing required parameters', { appId: !!appId, jwt: !!jwt });
      setError(`Missing required parameters: ${!appId ? 'appId ' : ''}${!jwt ? 'jwt' : ''}`);
      setIsLoading(false);
      return;
    }

    // Validate appId format
    if (!appId.includes('vpaas-magic-cookie')) {
      console.error('JitsiMeeting: Invalid appId format:', appId);
      setError(`Invalid JaaS appId format. Expected format: vpaas-magic-cookie-xxx`);
      setIsLoading(false);
      return;
    }

    // Clean room name - remove appId prefix if present
    let cleanRoom = roomName;
    if (cleanRoom.includes(`${appId}/`)) {
      cleanRoom = cleanRoom.split(`${appId}/`)[1];
    }
    const fullRoomName = `${appId}/${cleanRoom}`;

    // Wait for container to be available with retry logic
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds total (50 * 100ms)
    
    const initializeWhenReady = () => {
      if (!containerRef.current) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`JitsiMeeting: Waiting for container... attempt ${retryCount}/${maxRetries}`);
          setTimeout(initializeWhenReady, 100);
          return;
        }
        console.error('JitsiMeeting: Container ref not available after max retries');
        setError('Meeting container not available - please refresh the page');
        setIsLoading(false);
        return;
      }
      
      console.log('JitsiMeeting: Container available, starting initialization');
      startInitialization();
    };

    // Start the initialization process
    initializeWhenReady();

    function startInitialization() {
      if (isInitializedRef.current) {
        console.log('JitsiMeeting: Already initialized, skipping');
        return;
      }
      
      isInitializedRef.current = true;
      console.log('JitsiMeeting: Initializing with appId:', appId);
      console.log('JitsiMeeting: Full room name:', fullRoomName);
      setStatus('Loading Jitsi script...');

      const scriptUrl = `https://8x8.vc/${appId}/external_api.js`;
      console.log('JitsiMeeting: Loading script from:', scriptUrl);
      
      // Check if API is already available (script loaded previously)
      if (window.JitsiMeetExternalAPI) {
        console.log('JitsiMeeting: API already available, initializing directly');
        initializeJitsi();
        return;
      }
      
      // Check if script tag already exists
      const existingScript = document.querySelector(`script[src="${scriptUrl}"]`) as HTMLScriptElement;
      
      if (existingScript) {
        // Script tag exists but API not loaded yet, wait for it
        console.log('JitsiMeeting: Script tag exists, waiting for API to load...');
        let checkCount = 0;
        const maxChecks = 100; // 10 seconds
        
        const checkApiAvailable = setInterval(() => {
          checkCount++;
          if (window.JitsiMeetExternalAPI) {
            clearInterval(checkApiAvailable);
            console.log('JitsiMeeting: API now available, initializing');
            initializeJitsi();
          } else if (checkCount >= maxChecks) {
            clearInterval(checkApiAvailable);
            console.error('JitsiMeeting: API failed to load after timeout');
            setError('Jitsi API failed to load. Please check your JaaS configuration.');
            setIsLoading(false);
            isInitializedRef.current = false;
          }
        }, 100);
        
        return;
      }
      
      // Script doesn't exist, create and load it
      console.log('JitsiMeeting: Creating new script tag');
      const script = document.createElement('script');
      scriptRef.current = script;
      script.src = scriptUrl;
      script.async = true;
      
      script.onload = () => {
        console.log('JitsiMeeting: Script loaded, waiting for API initialization...');
        // Wait for API to be available after script loads
        let checkCount = 0;
        const maxChecks = 50; // 5 seconds
        
        const checkApiLoaded = setInterval(() => {
          checkCount++;
          if (window.JitsiMeetExternalAPI) {
            clearInterval(checkApiLoaded);
            console.log('JitsiMeeting: API available after script load');
            initializeJitsi();
          } else if (checkCount >= maxChecks) {
            clearInterval(checkApiLoaded);
            console.error('JitsiMeeting: API not available after script load');
            setError('Jitsi API failed to initialize. Please refresh the page.');
            setIsLoading(false);
            isInitializedRef.current = false;
          }
        }, 100);
      };
      
      script.onerror = (e) => {
        console.error('JitsiMeeting: Failed to load script', e);
        setError(`Failed to load Jitsi script from ${scriptUrl}. Please check your JaaS configuration.`);
        setIsLoading(false);
        isInitializedRef.current = false;
      };
      
      document.body.appendChild(script);
    }

    function initializeJitsi() {
      console.log('JitsiMeeting: Checking JitsiMeetExternalAPI availability');
      
      if (!containerRef.current) {
        console.error('JitsiMeeting: Container ref not available during initialization');
        setError('Meeting container not available');
        setIsLoading(false);
        isInitializedRef.current = false;
        return;
      }

      if (!window.JitsiMeetExternalAPI) {
        console.error('JitsiMeeting: JitsiMeetExternalAPI not available on window');
        setError('Jitsi API not loaded. The script may have failed to load or the appId may be invalid.');
        setIsLoading(false);
        isInitializedRef.current = false;
        return;
      }

      console.log('JitsiMeeting: JitsiMeetExternalAPI available, creating meeting');

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
            // Ultra-low bandwidth mode
            prejoinPageEnabled: defaultSettings.prejoinPageEnabled,
            startWithAudioMuted: defaultSettings.startWithAudioMuted,
            startWithVideoMuted: defaultSettings.startWithVideoMuted,
            
            // Very low resolution for minimal CPU usage
            resolution: defaultSettings.resolution,
            constraints: {
              video: {
                height: { ideal: defaultSettings.resolution, max: defaultSettings.maxVideoHeight },
                width: { ideal: Math.round(defaultSettings.resolution * 16 / 9), max: defaultSettings.maxVideoWidth }
              }
            },
            
            // Disable all resource-intensive features
            disableSimulcast: defaultSettings.disableSimulcast,
            enableLayerSuspension: defaultSettings.enableLayerSuspension,
            
            // Optimize audio
            enableNoAudioDetection: defaultSettings.enableNoAudioDetection,
            enableNoisyMicDetection: defaultSettings.enableNoisyMicDetection,
            
            // Disable all unnecessary features
            disableDeepLinking: defaultSettings.disableDeepLinking,
            disableInviteFunctions: defaultSettings.disableInviteFunctions,
            doNotStoreRoom: defaultSettings.doNotStoreRoom,
            disableProfile: true,
            disableReactions: true,
            disablePolls: true,
            disableRaiseHand: true,
            disableVirtualBackground: true,
            disableVideoBackground: true,
            
            // Enable screen sharing
            desktopSharingEnabled: true,
            desktopSharingChromeExtId: null, // Use getDisplayMedia API (modern browsers)
            desktopSharingChromeDisabled: false,
            desktopSharingFirefoxExtId: null,
            desktopSharingFirefoxDisabled: false,
            desktopSharingSourceDevice: null,
            desktopSharingSources: ['screen', 'window', 'tab'],
            disableDesktopSharing: false,
            
            // P2P for better performance with few participants
            p2p: {
              enabled: defaultSettings.p2pEnabled,
              stunServers: [
                { urls: 'stun:stun.l.google.com:19302' }
              ]
            },
            
            // Disable all analytics
            analytics: {
              disabled: defaultSettings.analyticsDisabled
            },
            
            // Minimal tile view
            tileView: {
              numberOfVisibleTiles: defaultSettings.numberOfVisibleTiles
            },
            
            // Disable recording and streaming
            liveStreamingEnabled: false,
            recordingEnabled: false,
            
            // Disable transcription
            transcribingEnabled: false,
            
            // Minimal UI
            disableChatSmileys: true,
            disableFocusIndicator: true,
            disableLocalVideoFlip: true,
            disableRemoteVideoMenu: true,
            disableShowMoreStats: true,
          },
          interfaceConfigOverwrite: {
            // Hide all branding
            SHOW_JITSI_WATERMARK: defaultSettings.showJitsiWatermark,
            SHOW_WATERMARK_FOR_GUESTS: defaultSettings.showJitsiWatermark,
            SHOW_BRAND_WATERMARK: defaultSettings.showBrandWatermark,
            SHOW_POWERED_BY: false,
            
            // Disable all animations
            DISABLE_VIDEO_BACKGROUND: defaultSettings.disableVideoBackground,
            DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
            DISABLE_FOCUS_INDICATOR: true,
            DISABLE_TRANSCRIPTION_SUBTITLES: true,
            
            // Minimal toolbar - only essentials
            TOOLBAR_BUTTONS: defaultSettings.toolbarButtons,
            
            // Very small filmstrip
            FILM_STRIP_MAX_HEIGHT: defaultSettings.filmStripMaxHeight,
            TILE_VIEW_MAX_COLUMNS: defaultSettings.maxTileViewColumns,
            
            // Disable features
            HIDE_KICK_BUTTON_FOR_GUESTS: true,
            MOBILE_APP_PROMO: false,
            PROVIDER_NAME: '',
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI('8x8.vc', options);

        apiRef.current.addEventListener('videoConferenceJoined', () => {
          setIsLoading(false);
          setStatus('Connected');
        });

        apiRef.current.addEventListener('videoConferenceLeft', handleMeetingEnd);
        apiRef.current.addEventListener('readyToClose', handleMeetingEnd);

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
        }, 15000);

      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to initialize meeting';
        setError(errorMessage);
        setIsLoading(false);
        isInitializedRef.current = false;
      }
    }

    // Cleanup function
    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi API:', e);
        }
        apiRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [roomName, jwt, appId, userName, userEmail, isModerator, meetingId, isLoading, handleMeetingEnd, endMeeting]);

  // Prevent rendering if already has error
  if (error) {
    return (
      <div style={{ width: '100%', height, position: 'relative', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 16px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

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

// Export memoized version to prevent re-renders
export default memo(JitsiMeeting);
