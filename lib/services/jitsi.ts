// Jitsi as a Component (JaaC) Service
// This service handles Jitsi integration for live streaming within the website

interface JitsiMeetingOptions {
  roomName: string;
  userDisplayName?: string;
  userEmail?: string;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  subject?: string;
}

interface JitsiConfig {
  domain: string;
  appId?: string;
  token?: string;
}

class JitsiService {
  private config: JitsiConfig;

  constructor() {
    this.config = {
      domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
      appId: process.env.JITSI_APP_ID,
      token: process.env.JITSI_TOKEN,
    };
  }

  /**
   * Generate a Jitsi meeting room name
   */
  generateRoomName(courseSlug: string, lessonId: string, prefix: string = 'course'): string {
    const sanitizedCourse = courseSlug.replace(/[^a-zA-Z0-9]/g, '-');
    const sanitizedLesson = lessonId.toString().slice(-8);
    return `${prefix}-${sanitizedCourse}-${sanitizedLesson}`;
  }

  /**
   * Get Jitsi meeting URL
   */
  getMeetingUrl(roomName: string): string {
    return `https://${this.config.domain}/${roomName}`;
  }

  /**
   * Get Jitsi embed URL with parameters
   */
  getEmbedUrl(options: JitsiMeetingOptions): string {
    const params = new URLSearchParams();
    
    if (options.userDisplayName) {
      params.append('userInfo.displayName', options.userDisplayName);
    }
    
    if (options.userEmail) {
      params.append('userInfo.email', options.userEmail);
    }
    
    if (options.startWithAudioMuted !== undefined) {
      params.append('config.startWithAudioMuted', options.startWithAudioMuted.toString());
    }
    
    if (options.startWithVideoMuted !== undefined) {
      params.append('config.startWithVideoMuted', options.startWithVideoMuted.toString());
    }
    
    if (options.subject) {
      params.append('config.subject', options.subject);
    }

    const baseUrl = `https://${this.config.domain}/${options.roomName}`;
    const queryString = params.toString();
    
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Get Jitsi IFrame API configuration
   */
  getIFrameConfig(options: JitsiMeetingOptions): any {
    return {
      roomName: options.roomName,
      width: '100%',
      height: '100%',
      parentNode: undefined, // Will be set in component
      configOverwrite: {
        startWithAudioMuted: options.startWithAudioMuted ?? true,
        startWithVideoMuted: options.startWithVideoMuted ?? true,
        subject: options.subject,
        hideConferenceSubject: false,
        hideConferenceTimer: false,
        hideParticipantsStats: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#1a1a1a',
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'invite',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone',
          'security',
        ],
      },
      userInfo: {
        displayName: options.userDisplayName,
        email: options.userEmail,
      },
    };
  }

  /**
   * Check if a meeting is currently active
   * Note: This is a placeholder - actual implementation would require
   * Jitsi Prosody or external API integration
   */
  async isMeetingActive(roomName: string): Promise<boolean> {
    // In a real implementation, you would check with your Jitsi server
    // or use the Jitsi Meet External API to check room status
    return true;
  }

  /**
   * Schedule a live stream
   */
  scheduleLiveStream(courseId: string, lessonId: string, scheduledTime: Date): {
    roomName: string;
    scheduledTime: Date;
    joinUrl: string;
  } {
    const roomName = this.generateRoomName(courseId, lessonId);
    
    return {
      roomName,
      scheduledTime,
      joinUrl: this.getMeetingUrl(roomName),
    };
  }
}

// Export singleton instance
export const jitsiService = new JitsiService();

// Export class for testing or custom instances
export { JitsiService };

// Default export
export default jitsiService;
