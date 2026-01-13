import React, { useEffect, useRef, useState } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import { Device, Transport, Consumer } from 'mediasoup-client/lib/types';
import './WebRTCPlayer.css';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : 'https://ministryprogs.tniglobal.org';

interface WebRTCPlayerProps {
  producerUserId: string;
  title: string;
  className?: string;
  autoPlay?: boolean;
  defaultMuted?: boolean; // Add option to mute by default
  externalMuted?: boolean; // External control of mute state
  onMuteChange?: (muted: boolean) => void; // Callback when mute changes
  externalVolume?: number; // External control of volume (0-1)
  onVolumeChange?: (volume: number) => void; // Callback when volume changes
}

const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({ 
  producerUserId, 
  title, 
  className, 
  autoPlay = true,
  defaultMuted = true, // Mute by default to prevent echo for translator
  externalMuted,
  onMuteChange,
  externalVolume,
  onVolumeChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [volume, setVolume] = useState(externalVolume !== undefined ? externalVolume : 0.7);
  
  const deviceRef = useRef<Device | null>(null);
  const consumerTransportRef = useRef<Transport | null>(null);
  const consumersRef = useRef<Consumer[]>([]);

  const token = localStorage.getItem('token');

  const request = async (endpoint: string, method: string = 'GET', body?: any) => {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  };

  const connectToStream = async () => {
    try {
      console.log('🔌 Connecting to WebRTC stream for producer:', producerUserId);

      // Add a delay to ensure producer is fully initialized
      console.log('⏳ Waiting 2 seconds for producer to initialize...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Initialize device
      const { rtpCapabilities } = await request('/webrtc/router-capabilities');
      deviceRef.current = new mediasoupClient.Device();
      await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });

      console.log('✅ Device loaded');

      // Create consumer transport
      const transportParams = await request('/webrtc/create-consumer-transport', 'POST');
      consumerTransportRef.current = deviceRef.current.createRecvTransport(transportParams);

      // Handle transport events
      consumerTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await request('/webrtc/connect-transport', 'POST', {
            transportId: consumerTransportRef.current!.id,
            dtlsParameters
          });
          callback();
          console.log('✅ Consumer transport connected');
        } catch (error) {
          console.error('❌ Error connecting consumer transport:', error);
          errback(error as Error);
        }
      });

      console.log('✅ Consumer transport created');

      // Create consumers
      const { consumers } = await request('/webrtc/consume', 'POST', {
        producerUserId,
        rtpCapabilities: deviceRef.current.rtpCapabilities
      });

      if (!consumers || consumers.length === 0) {
        throw new Error('No active stream from this translator');
      }

      console.log(`✅ Got ${consumers.length} consumers`);

      // Create MediaStream for video element
      const stream = new MediaStream();

      // Consume each track
      for (const consumerData of consumers) {
        const consumer = await consumerTransportRef.current.consume({
          id: consumerData.id,
          producerId: consumerData.producerId,
          kind: consumerData.kind,
          rtpParameters: consumerData.rtpParameters,
        });

        consumersRef.current.push(consumer);
        
        // CRITICAL: Verify track is in correct state
        const track = consumer.track;
        console.log(`📊 ${consumer.kind} track state:`, {
          id: track.id,
          kind: track.kind,
          readyState: track.readyState,
          enabled: track.enabled,
          muted: track.muted,
          label: track.label
        });
        
        // Ensure track is enabled
        track.enabled = true;
        
        stream.addTrack(track);
        console.log(`✅ Consuming ${consumer.kind}, ID:`, consumer.id);

        // Resume consumer
        await request('/webrtc/resume-consumer', 'POST', {
          consumerId: consumer.id
        });

        console.log(`▶️ ${consumer.kind} consumer resumed`);
      }
      
      // Verify final stream state
      console.log('📺 Final stream state:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          readyState: t.readyState,
          enabled: t.enabled,
          muted: t.muted
        }))
      });

      // Attach stream to video element
      if (videoRef.current) {
        console.log('📺 Attaching stream to video element');
        const videoElement = videoRef.current;
        
        // Set video element properties BEFORE assigning srcObject
        videoElement.muted = defaultMuted; // Muted by default to prevent echo
        videoElement.volume = volume;
        videoElement.autoplay = autoPlay;
        videoElement.controls = false;
        videoElement.playsInline = true;
        
        // Assign the stream
        videoElement.srcObject = stream;
        
        console.log('📺 Video element configured:', {
          srcObject: !!videoElement.srcObject,
          readyState: videoElement.readyState,
          paused: videoElement.paused,
          muted: videoElement.muted,
          autoplay: videoElement.autoplay
        });
        
        // Wait for video to be ready - use canplay instead of loadedmetadata
        await new Promise<void>((resolve) => {
          // Check if already ready
          if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
            console.log('✅ Video already ready (readyState=' + videoElement.readyState + ')');
            resolve();
            return;
          }
          
          const timeout = setTimeout(() => {
            console.log('⏱️ Video ready timeout, readyState:', videoElement.readyState);
            resolve();
          }, 5000);
          
          const onCanPlay = () => {
            clearTimeout(timeout);
            videoElement.removeEventListener('canplay', onCanPlay);
            console.log('✅ Video can play (readyState=' + videoElement.readyState + ')');
            resolve();
          };
          
          videoElement.addEventListener('canplay', onCanPlay);
        });
        
        // Try to play
        if (autoPlay) {
          try {
            await videoElement.play();
            setIsPlaying(true);
            console.log('✅ Video autoplay started');
          } catch (playError) {
            console.warn('⚠️ Autoplay failed:', playError);
            // Autoplay blocked - user will need to click play button
          }
        }
      }

      setIsConnected(true);
      setError(null);
      console.log('🎉 Successfully connected to WebRTC stream!');
      console.log('📊 Final state: isConnected=true, error=null, consumers=', consumersRef.current.length);
      
      // Force a state update to ensure re-render
      setTimeout(() => {
        setIsConnected(true);
        console.log('🔄 State update forced for re-render');
      }, 100);

    } catch (error: any) {
      console.error('❌ Error connecting to WebRTC stream:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        producerUserId
      });
      setError(error.message || 'Failed to connect to stream');
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting WebRTC stream...');

    // Close consumers
    consumersRef.current.forEach(consumer => consumer.close());
    consumersRef.current = [];

    // Close transport
    if (consumerTransportRef.current) {
      consumerTransportRef.current.close();
      consumerTransportRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    deviceRef.current = null;
    setIsConnected(false);
    setIsPlaying(false);
  };

  const handlePlayClick = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play:', error);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      // Notify parent component
      if (onMuteChange) {
        onMuteChange(newMutedState);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    // Notify parent component
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };

  // Sync with external volume control
  useEffect(() => {
    if (externalVolume !== undefined && externalVolume !== volume) {
      setVolume(externalVolume);
      if (videoRef.current) {
        videoRef.current.volume = externalVolume;
      }
    }
  }, [externalVolume]);

  // Sync with external mute control
  useEffect(() => {
    if (externalMuted !== undefined && externalMuted !== isMuted) {
      setIsMuted(externalMuted);
      if (videoRef.current) {
        videoRef.current.muted = externalMuted;
      }
    }
  }, [externalMuted]);

  // Update video element when muted state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (producerUserId && token) {
      console.log('🔄 Attempting to connect, producerUserId:', producerUserId);
      connectToStream();
    }

    return () => {
      disconnect();
    };
  }, [producerUserId]);

  console.log('🎬 WebRTCPlayer render:', { isConnected, error, isPlaying, producerUserId });

  return (
    <div className={`webrtc-player ${className || ''}`}>
      <h3>{title}</h3>
      
      {error && (
        <div className="stream-error">
          ⚠️ {error}
        </div>
      )}
      
      {!isConnected && !error && (
        <div className="stream-loading">
          🔄 Connecting to stream...
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={className || "video-element"}
        style={{ width: '100%', background: '#000' }}
      />
      
      <div className="player-controls">
        <button onClick={handlePlayClick} className="btn-control">
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button onClick={toggleMute} className="btn-control">
          {isMuted ? '🔇 Unmute (Monitor)' : '🔊 Mute'}
        </button>
        
        {!isMuted && (
          <div className="volume-control">
            <label>🔊 Volume: {Math.round(volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
        )}
      </div>
      
      {isConnected && (
        <div className="stream-status">
          🟢 Live - {isMuted ? '(Muted - no echo)' : '(Monitoring output)'}
        </div>
      )}
    </div>
  );
};

export default WebRTCPlayer;
