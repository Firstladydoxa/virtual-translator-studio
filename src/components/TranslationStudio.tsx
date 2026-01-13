import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import VideoPlayer from './VideoPlayer';
import AudioControls from './AudioControls';
import LiveStatusIndicator from './LiveStatusIndicator';
import { streamingService } from '../services/api';
import './TranslationStudio.css';

const TranslationStudio: React.FC = () => {
  
  // Get state from store
  const {
    user,
    liveStatus,
    outputStreamAvailable,
    setLiveStatus,
    setOutputStreamAvailable,
    isTranslating,
    setIsTranslating,
    getTranslationLanguage,
    getWatchUrl
  } = useAppStore();
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [outputVideoKey, setOutputVideoKey] = useState(0);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const connectionMonitorRef = useRef<number | null>(null);
  const outputCheckIntervalRef = useRef<number | null>(null);
  const chunkCounterRef = useRef(0);
  const firstChunkSentRef = useRef(false);

  const sourceVideoUrl = 'https://2nbyjxnbl53k-hls-live.5centscdn.com/RTV/59a49be6dc0f146c57cd9ee54da323b1.sdp/playlist.m3u8';
  //'https://vcpout-sf01-altnetro.internetmultimediaonline.org/ext/ext1.smil/playlist.m3u8';
  //'https://2nbyjxnbl53k-hls-live.5centscdn.com/RTV/59a49be6dc0f146c57cd9ee54da323b1.sdp/playlist.m3u8';
  const outputVideoUrl = getWatchUrl();
  const language = getTranslationLanguage();

  const showMessage = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  // Check if output stream is actually available
  const checkOutputStreamAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(outputVideoUrl, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const available = response.ok && response.status === 200;
      
      if (available) {
        console.log('📺 Output stream check: AVAILABLE ✓ (HTTP 200)');
      } else {
        console.log(`📺 Output stream check: NOT AVAILABLE (HTTP ${response.status})`);
        console.log('   URL:', outputVideoUrl);
        console.log('   This is normal - stream takes 10-30 seconds to become available');
      }
      return available;
    } catch (error: any) {
      console.log('📺 Output stream check: NOT AVAILABLE ✗');
      console.log('   Error:', error.message);
      console.log('   URL:', outputVideoUrl);
      return false;
    }
  }, [outputVideoUrl]);

  // Start monitoring output stream availability
  const startOutputStreamMonitoring = useCallback(() => {
    if (outputCheckIntervalRef.current) {
      clearInterval(outputCheckIntervalRef.current);
    }

    let consecutiveChecks = 0;
    const maxChecks = 40; // Check for up to 120 seconds (3s intervals) - increased from 60s

    console.log('🔍 Starting output stream monitoring...');
    console.log('   Checking every 3 seconds for up to 2 minutes');
    console.log('   URL:', outputVideoUrl);

    outputCheckIntervalRef.current = window.setInterval(async () => {
      consecutiveChecks++;
      
      const available = await checkOutputStreamAvailability();
      setOutputStreamAvailable(available);
      
      if (available) {
        console.log('✓ Output stream is NOW AVAILABLE!');
        setLiveStatus('online');
        setOutputVideoKey(prev => prev + 1); // Refresh video player
        showMessage('Output stream is live!', 'success');
        
        // Stop checking once available
        if (outputCheckIntervalRef.current) {
          clearInterval(outputCheckIntervalRef.current);
          outputCheckIntervalRef.current = null;
        }
      } else if (consecutiveChecks >= maxChecks) {
        console.log('⚠ Output stream check timeout after', maxChecks * 3, 'seconds');
        console.log('⚠ Stream may still become available - check your RTMP settings');
        showMessage('Output stream not available yet. Check RTMP server connection.', 'error');
        if (outputCheckIntervalRef.current) {
          clearInterval(outputCheckIntervalRef.current);
          outputCheckIntervalRef.current = null;
        }
      } else if (consecutiveChecks % 10 === 0) {
        // Show progress every 30 seconds
        showMessage(`Waiting for stream... (${consecutiveChecks * 3}s elapsed)`, 'info');
      }
    }, 3000);
  }, [checkOutputStreamAvailability, setOutputStreamAvailable, setLiveStatus, showMessage, outputVideoUrl]);

  // Stop monitoring output stream
  const stopOutputStreamMonitoring = useCallback(() => {
    if (outputCheckIntervalRef.current) {
      clearInterval(outputCheckIntervalRef.current);
      outputCheckIntervalRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Use wss:// for HTTPS, ws:// for local development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'ws://localhost:3001'
        : `${protocol}//ministryprogs.tniglobal.org`;

      // Get token from store
      const { token } = useAppStore.getState();
      
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      console.log('🔌 Connecting to WebSocket:', apiUrl);
      console.log('🔐 Using token:', token.substring(0, 20) + '...');
      
      wsRef.current = new WebSocket(apiUrl);

      wsRef.current.onopen = () => {
        console.log('✓ WebSocket CONNECTED');
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
        console.log('📤 Sent auth message with token');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);

          if (message.type === 'auth') {
            if (message.success) {
              console.log('✓ WebSocket AUTHENTICATED');
              resolve();
            } else {
              reject(new Error('WebSocket authentication failed'));
            }
          } else if (message.type === 'error') {
            console.error('✗ WebSocket error:', message.message);
            // Only show critical errors, not chunk write errors (those are normal before stream starts)
            if (!message.message.includes('Failed to write stream data')) {
              showMessage('Streaming error: ' + message.message, 'error');
            }
          }
        } catch (e) {
          console.log('📦 Binary message received');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        if (isTranslating) {
          setLiveStatus('offline');
        }
        wsRef.current = null;
      };

      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }, [isTranslating, setLiveStatus, showMessage]);

  const startTranslating = async () => {
    if (!mediaStreamRef.current) {
      showMessage('Please select a microphone first', 'error');
      return;
    }

    try {
      setIsTranslating(true);
      chunkCounterRef.current = 0;
      setLiveStatus('connecting');
      setOutputStreamAvailable(false);
      showMessage('Starting translation...', 'info');

      // Connect WebSocket
      await connectWebSocket();

      // Create canvas for video capture
      const canvas = document.createElement('canvas');
      const sourceVideo = document.querySelector('video') as HTMLVideoElement;
      
      if (!sourceVideo || sourceVideo.readyState < 2) {
        showMessage('Source video not ready. Please wait.', 'error');
        stopTranslating();
        return;
      }

      canvas.width = sourceVideo.videoWidth || 640;
      canvas.height = sourceVideo.videoHeight || 480;
      canvasRef.current = canvas;

      const ctx = canvas.getContext('2d');

      console.log('🎥 Setting up canvas capture...');
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('Source video ready state:', sourceVideo.readyState);
      
      const captureFrame = () => {
        if (sourceVideo.readyState === 4 && ctx) {
          ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(captureFrame);
        }
      };

      captureFrame();

      // Create combined stream
      const canvasStream = canvas.captureStream(30);
      console.log('🎬 Canvas stream created, tracks:', canvasStream.getTracks().length);
      
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
        console.log('🎤 Audio track added, total tracks:', canvasStream.getTracks().length);
      } else {
        console.warn('⚠️ No audio track available!');
      }

      // Check MediaRecorder support
      const mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Browser does not support WebM recording. Please use Chrome or Firefox.');
      }

      console.log('✓ WebM codec supported');

      // Start RTMP stream on backend FIRST, before MediaRecorder starts
      console.log('🎬 Starting RTMP stream on backend...');
      try {
        const result = await streamingService.startStream();
        console.log('✓ RTMP stream started on backend');
        console.log('📺 Watch URL:', result.watchUrl);
        showMessage('RTMP stream started - waiting for output...', 'info');
        setLiveStatus('online');
        
        // Give FFmpeg a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error('❌ Failed to start RTMP stream:', error);
        console.error('   Response:', error.response?.data);
        const errorMsg = error.response?.data?.error || error.message;
        showMessage('Failed to start stream: ' + errorMsg, 'error');
        stopTranslating();
        return;
      }

      // Setup MediaRecorder AFTER FFmpeg is ready
      mediaRecorderRef.current = new MediaRecorder(canvasStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000
      });

      console.log('📹 MediaRecorder created, state:', mediaRecorderRef.current.state);

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          chunkCounterRef.current++;
          
          // Only log every 100th chunk to reduce console spam (every 10 seconds at 100ms timeslice)
          if (chunkCounterRef.current % 100 === 0) {
            console.log(`📹 Chunk #${chunkCounterRef.current}:`, event.data.size, 'bytes');
          }
          
          // Send chunk to WebSocket
          wsRef.current.send(event.data);
          
          // Start output stream monitoring after first chunk
          if (!firstChunkSentRef.current) {
            firstChunkSentRef.current = true;
            console.log('🎬 First chunk sent to FFmpeg!');
            startOutputStreamMonitoring();
          }
        } else {
          // Only log errors once, not for every failed chunk
          if (!wsRef.current && chunkCounterRef.current === 1) {
            console.error('✗ Cannot send chunk - WebSocket is NULL');
          } else if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN && chunkCounterRef.current === 1) {
            console.error('✗ WebSocket not ready - state:', wsRef.current.readyState);
          }
        }
      };

      mediaRecorderRef.current.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error);
        showMessage('Recording error: ' + event.error?.message, 'error');
        stopTranslating();
      };

      mediaRecorderRef.current.onstart = () => {
        console.log('✅ MediaRecorder STARTED, state:', mediaRecorderRef.current?.state);
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('⏹️ MediaRecorder STOPPED');
        setLiveStatus('offline');
      };

      // Start MediaRecorder with 100ms timeslice for balanced quality and latency
      // This provides good quality while maintaining reasonable audio sync
      console.log('🚀 Starting MediaRecorder with 100ms timeslice...');
      mediaRecorderRef.current.start(100);
      console.log('📹 MediaRecorder.start() called, state:', mediaRecorderRef.current.state);
      console.log('⏳ Stream starting...');
      
      // Note: RTMP stream will start after first chunk is sent (see ondataavailable handler)


    } catch (error: any) {
      console.error('Error starting translation:', error);
      showMessage('Error starting translation: ' + error.message, 'error');
      stopTranslating();
    }
  };

  const stopTranslating = useCallback(() => {
    setIsTranslating(false);
    setLiveStatus('offline');
    setOutputStreamAvailable(false);
    firstChunkSentRef.current = false;
    chunkCounterRef.current = 0;
    
    stopOutputStreamMonitoring();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    streamingService.stopStream().catch(console.error);
    
    showMessage('Translation stopped', 'info');
  }, [setIsTranslating, setLiveStatus, setOutputStreamAvailable, stopOutputStreamMonitoring, showMessage]);

  const startConnectionMonitoring = useCallback(() => {
    if (connectionMonitorRef.current) {
      clearInterval(connectionMonitorRef.current);
    }

    connectionMonitorRef.current = window.setInterval(() => {
      if (isTranslating) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Keep status as connecting until output is available
          if (!outputStreamAvailable) {
            setLiveStatus('connecting');
          }
        } else {
          setLiveStatus('offline');
          connectWebSocket().catch(console.error);
        }
      }
    }, 3000);
  }, [isTranslating, outputStreamAvailable, setLiveStatus, connectWebSocket]);

  const stopConnectionMonitoring = useCallback(() => {
    if (connectionMonitorRef.current) {
      clearInterval(connectionMonitorRef.current);
      connectionMonitorRef.current = null;
    }
  }, []);

  const handleMicrophoneChange = (stream: MediaStream | null) => {
    mediaStreamRef.current = stream;
  };

  useEffect(() => {
    return () => {
      stopTranslating();
      stopConnectionMonitoring();
    };
  }, [stopTranslating, stopConnectionMonitoring]);

  return (
    <div className="translation-studio">
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="studio-info-bar">
        <div className="translation-info">
          <h3>Translation Language: {language}</h3>
          <p className="language-subtitle">Live Translation Session</p>
        </div>
        <LiveStatusIndicator status={liveStatus} />
      </div>

      <div className="studio-content">
        <div className="video-section">
          <div className="video-container">
            <VideoPlayer
              url={sourceVideoUrl}
              title="Source Video"
              className="source-video"
              autoPlay={true}
            />
          </div>
          <div className="video-container">
            <VideoPlayer
              key={`output-${outputVideoKey}`}
              url={outputVideoUrl}
              title="Your Translation Output"
              className="output-video"
            />
          </div>
        </div>

        <div className="controls-section">
          <AudioControls
            onMicrophoneChange={handleMicrophoneChange}
            isActive={isTranslating}
          />

          <div className="translation-controls">
            <h3>Translation Controls</h3>
            <div className="button-group">
              <button
                onClick={startTranslating}
                disabled={isTranslating}
                className="btn-primary btn-large"
              >
                {isTranslating ? 'Translating...' : 'Start Translating'}
              </button>
              <button
                onClick={stopTranslating}
                disabled={!isTranslating}
                className="btn-danger btn-large"
              >
                Stop Streaming
              </button>
            </div>
            <div className="stream-status">
              Status: {isTranslating ? 
                (outputStreamAvailable ? 'Translation Active - Stream Live ✓' : 'Starting Stream...') : 
                'Ready to Translate'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationStudio;
