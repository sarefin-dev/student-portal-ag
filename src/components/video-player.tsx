'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoId: string;
  blockId: string; // Used to track progress against the specific lesson block
  hostname?: string;
}

export function VideoPlayer({ videoId, blockId, hostname }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hostname) return;

    const videoSrc = `https://${hostname}/${videoId}/playlist.m3u8`;
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({ maxMaxBufferLength: 30 });
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [videoId, hostname]);

  // Setup Heartbeat tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !blockId) return;

    let interval: NodeJS.Timeout;

    const startHeartbeat = () => {
      interval = setInterval(() => {
        if (!video.paused && !video.ended) {
          fetch('/api/progress/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blockId,
              positionSeconds: video.currentTime,
              totalSeconds: video.duration || 0
            })
          }).catch(err => console.error("Heartbeat failed", err));
        }
      }, 10000); // 10 seconds heartbeat
    };

    const stopHeartbeat = () => clearInterval(interval);

    video.addEventListener('play', startHeartbeat);
    video.addEventListener('pause', stopHeartbeat);
    video.addEventListener('ended', stopHeartbeat);

    return () => {
      stopHeartbeat();
      video.removeEventListener('play', startHeartbeat);
      video.removeEventListener('pause', stopHeartbeat);
      video.removeEventListener('ended', stopHeartbeat);
    };
  }, [blockId]);

  if (!hostname) {
    return (
      <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
        <span className="text-white/50 text-sm">BUNNY_STREAM_CDN_HOSTNAME is not configured</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        controls
        className="h-full w-full outline-none"
        controlsList="nodownload"
        disablePictureInPicture
      />
    </div>
  );
}
