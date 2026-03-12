'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface YouTubePrivacyPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  start?: number;
  onEnded?: () => void;
}

/**
 * Privacy-focused YouTube player component
 * Uses standard YouTube embed with privacy parameters
 * - Hides related videos (rel=0)
 * - Minimal branding (modestbranding=1)
 * - No annotations (iv_load_policy=3)
 */
export default function YouTubePrivacyPlayer({ 
  videoId, 
  title, 
  className = '',
  autoplay = false,
  start = 0,
  onEnded
}: YouTubePrivacyPlayerProps) {
  const [error, setError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build embed URL with privacy parameters
  const buildEmbedUrl = useCallback(() => {
    if (!videoId) return '';
    
    // Use youtube-nocookie.com for privacy (no tracking cookies)
    const params = new URLSearchParams({
      rel: '0',              // No related videos
      controls: '1',         // Show controls
      disablekb: '0',        // Enable keyboard controls
      fs: '1',               // Allow fullscreen
      iv_load_policy: '3',   // Hide video annotations
      cc_load_policy: '0',   // Don't show closed captions by default
      playsinline: '1',      // Play inline on mobile
    });

    if (autoplay) params.set('autoplay', '1');
    if (start > 0) params.set('start', start.toString());

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, autoplay, start]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [videoId]);

  // Listen for video end events via postMessage
  useEffect(() => {
    if (!onEnded) return;

    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (!event.origin.includes('youtube.com')) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange' && data.info === 0) {
          onEnded();
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded]);

  if (!videoId) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No video available</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Failed to load video</p>
          <p className="text-sm text-gray-500">Video ID: {videoId}</p>
          <a 
            href={`https://www.youtube-nocookie.com/embed/${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-blue-600 hover:underline text-sm"
          >
            Open on YouTube
          </a>
        </div>
      </div>
    );
  }

  const embedUrl = buildEmbedUrl();

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ minHeight: '200px' }}>
      {isReady && (
        <>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={title || "Video player"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full absolute inset-0"
          />
        </>
      )}
      
      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}

// Utility function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s?]+)/,
    /youtu\.be\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Component for displaying YouTube thumbnail with play button
interface YouTubeThumbnailProps {
  videoId: string;
  title?: string;
  onClick?: () => void;
  className?: string;
}

export function YouTubeThumbnail({ videoId, title, onClick, className = '' }: YouTubeThumbnailProps) {
  if (!videoId) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No thumbnail</p>
      </div>
    );
  }

  return (
    <div
      className={`relative cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title || "YouTube video thumbnail"}
        className="w-full h-full object-cover rounded-lg"
        onError={(e) => {
          // Fallback to lower quality thumbnail
          const target = e.target as HTMLImageElement;
          if (target.src.includes('maxresdefault')) {
            target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
