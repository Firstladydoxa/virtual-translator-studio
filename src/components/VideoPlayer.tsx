import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import './VideoPlayer.css';

interface VideoPlayerProps {
  url: string;
  title: string;
  onPlay?: () => void;
  className?: string;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, onPlay, className, autoPlay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isOutputVideo, setIsOutputVideo] = useState(false);
  const [streamAvailable, setStreamAvailable] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Check if this is the output video
    const isOutput = title.toLowerCase().includes('output') || title.toLowerCase().includes('translation');
    setIsOutputVideo(isOutput);
  }, [title]);

  useEffect(() => {
    if (!videoRef.current || !url) return;

    const video = videoRef.current;
    setStreamAvailable(true); // Reset on URL change

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: false,
        capLevelToPlayerSize: true
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(`${title} video manifest loaded`);
        setStreamAvailable(true);
        
        // Autoplay if requested (for source video)
        if (autoPlay && videoRef.current) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
            console.log(`${title} autoplayed successfully`);
          }).catch(err => {
            console.log(`${title} autoplay blocked by browser:`, err);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          // Don't log errors for output video - it's expected to fail until stream starts
          if (title.toLowerCase().includes('output') || title.toLowerCase().includes('translation')) {
            console.log(`${title} not available yet (stream may not have started)`);
            setStreamAvailable(false);
            return;
          }
          
          console.error(`${title} HLS error:`, data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, destroying HLS instance');
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      
      // Autoplay for Safari
      if (autoPlay) {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.log('Autoplay blocked:', err);
        });
      }
    }

    // Add event listeners for play/pause
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, title, autoPlay]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          onPlay?.();
        }).catch(err => {
          console.error('Play error:', err);
        });
      }
    }
  };

  return (
    <div className={`video-player ${className || ''}`}>
      <h3>{title}</h3>
      {isOutputVideo && !streamAvailable && (
        <div className="stream-info">
          <p>⏳ Stream not available yet. Start translating to see output.</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        muted={autoPlay} 
        onClick={handlePlayClick}
        className={className || "video-element"}
      />
      <button onClick={handlePlayClick} className="btn-play">
        {isPlaying ? '⏸ Stop' : '▶ Play'}
      </button>
    </div>
  );
};

export default VideoPlayer;
