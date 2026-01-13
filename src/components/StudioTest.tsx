import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import VideoPlayer from './VideoPlayer';
import WebRTCPlayer from './WebRTCPlayer';
import AudioControls from './AudioControls';
import LiveStatusIndicator from './LiveStatusIndicator';
import { streamingService } from '../services/api';
import webrtcService from '../services/webrtcService';
import './StudioTest.css';

const StudioTest: React.FC = () => {
  
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
  const [sourceVideoUrl, setSourceVideoUrl] = useState('https://2nbyjxnbl53k-hls-live.5centscdn.com/RTV/59a49be6dc0f146c57cd9ee54da323b1.sdp/playlist.m3u8'); // Default URL
  
  // Audio volume controls
  const [sourceVolume, setSourceVolume] = useState(0.3); // 30% for preaching (low)
  const [translatorVolume, setTranslatorVolume] = useState(1.0); // 100% for translator
  const [outputVolume, setOutputVolume] = useState(0.7); // 70% for output playback
  
  // Audio mute controls for source and output
  const [sourceAudioMuted, setSourceAudioMuted] = useState(false);
  const [outputAudioMuted, setOutputAudioMuted] = useState(true); // Muted by default
  
  // Profile picture capture
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraCaptureRef = useRef<HTMLVideoElement | null>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const outputPlayerRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceGainNodeRef = useRef<GainNode | null>(null);
  const translatorGainNodeRef = useRef<GainNode | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const connectionMonitorRef = useRef<number | null>(null);
  const outputCheckIntervalRef = useRef<number | null>(null);
  const chunkCounterRef = useRef(0);
  const firstChunkSentRef = useRef(false);
  const isTranslatingRef = useRef(false);

  const outputVideoUrl = getWatchUrl();
  const language = getTranslationLanguage();

  // Fetch source video URL from backend
  useEffect(() => {
    const fetchSourceVideoUrl = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://ministryprogs.tniglobal.org/api/settings/source-video-url', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSourceVideoUrl(data.sourceVideoUrl);
          console.log('✅ Source video URL loaded:', data.sourceVideoUrl);
        } else {
          console.warn('Failed to fetch source video URL, using default');
        }
      } catch (error) {
        console.error('Error fetching source video URL:', error);
        console.log('Using default source video URL');
      }
    };

    fetchSourceVideoUrl();
  }, []);

  const showMessage = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  // Update audio volumes in real-time
  useEffect(() => {
    if (sourceGainNodeRef.current) {
      sourceGainNodeRef.current.gain.value = sourceVolume;
      console.log('🔊 Source volume updated:', sourceVolume);
    }
    if (translatorGainNodeRef.current) {
      translatorGainNodeRef.current.gain.value = translatorVolume;
      console.log('🎤 Translator volume updated:', translatorVolume);
    }
  }, [sourceVolume, translatorVolume]);

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
    const maxChecks = 40;

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
        setOutputVideoKey(prev => prev + 1);
        showMessage('Output stream is live!', 'success');
        
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
        showMessage(`Waiting for stream... (${consecutiveChecks * 3}s elapsed)`, 'info');
      }
    }, 3000);
  }, [checkOutputStreamAvailability, setOutputStreamAvailable, setLiveStatus, showMessage, outputVideoUrl]);

  const stopOutputStreamMonitoring = useCallback(() => {
    if (outputCheckIntervalRef.current) {
      clearInterval(outputCheckIntervalRef.current);
      outputCheckIntervalRef.current = null;
    }
  }, []);

  // Stop translation function - defined first so it can be called by startTranslating
  const stopTranslating = useCallback(async () => {
    console.log('🛑 stopTranslating called');
    setIsTranslating(false);
    isTranslatingRef.current = false;
    setLiveStatus('offline');
    setOutputStreamAvailable(false);
    
    // Track translation session end
    try {
      const token = localStorage.getItem('token');
      await fetch('https://ministryprogs.tniglobal.org/api/translator/stop-translating', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('🛑 Translation session ended and tracked');
    } catch (trackError) {
      console.error('Failed to track translation end:', trackError);
    }
    
    // Stop WebRTC
    if (webrtcService.isProducing()) {
      await webrtcService.stopProducing();
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    sourceGainNodeRef.current = null;
    translatorGainNodeRef.current = null;
    mixedStreamRef.current = null;
    
    showMessage('Translation stopped', 'info');
  }, [setIsTranslating, setLiveStatus, setOutputStreamAvailable, showMessage]);

  const startTranslating = async () => {
    if (!mediaStreamRef.current) {
      showMessage('Please select a microphone first', 'error');
      return;
    }
    try {
      setIsTranslating(true);
      isTranslatingRef.current = true;
      setLiveStatus('connecting');
      setOutputStreamAvailable(false);
      showMessage('Starting WebRTC translation with audio mixing...', 'info');

      // Track translation session start
      try {
        const token = localStorage.getItem('token');
        await fetch('https://ministryprogs.tniglobal.org/api/translator/start-translating', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Translation session tracked');
      } catch (trackError) {
        console.error('Failed to track translation session:', trackError);
      }

      // Get source video element
      const sourceVideo = document.querySelector('video.source-video') as HTMLVideoElement;
      
      if (!sourceVideo || sourceVideo.readyState < 2) {
        showMessage('Source video not ready. Please wait.', 'error');
        setIsTranslating(false);
        isTranslatingRef.current = false;
        return;
      }

      // Create canvas for video capture
      const canvas = document.createElement('canvas');
      canvas.width = sourceVideo.videoWidth || 640;
      canvas.height = sourceVideo.videoHeight || 480;
      canvasRef.current = canvas;

      const ctx = canvas.getContext('2d');

      console.log('🎥 Setting up canvas capture...');
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      const captureFrame = () => {
        if (sourceVideo.readyState === 4 && ctx && isTranslatingRef.current) {
          ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(captureFrame);
        }
      };

      captureFrame();

      // Create AudioContext for mixing
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      console.log('🎚️ Setting up audio mixing...');

      // Get source video audio
      // @ts-ignore - captureStream exists on HTMLMediaElement
      const sourceMediaStream = sourceVideo.captureStream ? sourceVideo.captureStream() : sourceVideo.mozCaptureStream();
      const sourceAudioTrack = sourceMediaStream.getAudioTracks()[0];
      
      if (!sourceAudioTrack) {
        console.warn('⚠️ No audio track from source video!');
        showMessage('Warning: Source video has no audio track', 'error');
        stopTranslating();
        return;
      }

      // Get translator microphone audio
      const translatorAudioTrack = mediaStreamRef.current.getAudioTracks()[0];
      
      if (!translatorAudioTrack) {
        console.warn('⚠️ No translator audio track!');
        showMessage('Warning: No microphone audio', 'error');
        stopTranslating();
        return;
      }

      // Create audio sources
      const sourceAudioStream = new MediaStream([sourceAudioTrack]);
      const translatorAudioStream = new MediaStream([translatorAudioTrack]);
      
      const sourceAudioSource = audioContext.createMediaStreamSource(sourceAudioStream);
      const translatorAudioSource = audioContext.createMediaStreamSource(translatorAudioStream);

      // Create gain nodes for volume control
      const sourceGain = audioContext.createGain();
      const translatorGain = audioContext.createGain();
      
      sourceGain.gain.value = sourceVolume;
      translatorGain.gain.value = translatorVolume;
      
      sourceGainNodeRef.current = sourceGain;
      translatorGainNodeRef.current = translatorGain;

      // Connect audio nodes
      sourceAudioSource.connect(sourceGain);
      translatorAudioSource.connect(translatorGain);

      // Create destination for mixed audio
      const audioDestination = audioContext.createMediaStreamDestination();
      
      sourceGain.connect(audioDestination);
      translatorGain.connect(audioDestination);

      console.log('✓ Audio mixing configured');
      console.log('  Source volume:', sourceVolume);
      console.log('  Translator volume:', translatorVolume);

      // Get canvas video stream
      const canvasStream = canvas.captureStream(30);
      console.log('🎬 Canvas stream created, tracks:', canvasStream.getTracks().length);
      
      // Add mixed audio to canvas stream
      const mixedAudioTrack = audioDestination.stream.getAudioTracks()[0];
      canvasStream.addTrack(mixedAudioTrack);
      
      mixedStreamRef.current = canvasStream;
      
      console.log('🎤 Mixed audio track added, total tracks:', canvasStream.getTracks().length);

      // Initialize WebRTC
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      webrtcService.setToken(token);
      
      console.log('🚀 Initializing WebRTC device...');
      await webrtcService.initializeDevice();
      
      console.log('📡 Creating producer transport...');
      await webrtcService.createProducerTransport();
      
      console.log('🎥 Starting to produce media...');
      await webrtcService.produceMedia(canvasStream);
      
      console.log('✅ WebRTC producers created, giving them time to stabilize...');
      
      // Give the producers time to stabilize before consumers try to connect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLiveStatus('online');
      setOutputStreamAvailable(true);
      showMessage('WebRTC streaming started! Ultra-low latency <500ms', 'success');
      
      console.log('✅ WebRTC translation started successfully!');

    } catch (error: any) {
      console.error('Error starting translation:', error);
      showMessage('Error starting translation: ' + error.message, 'error');
      stopTranslating();
    }
  };

  const handleMicrophoneChange = (stream: MediaStream | null) => {
    mediaStreamRef.current = stream;
  };

  // Preset volume controls
  const setPreachingMode = () => {
    setSourceVolume(0.2);  // 20% source (low)
    setTranslatorVolume(1.0); // 100% translator
    // Translation mode: Unmute source (to hear original), mute output (prevent echo)
    setSourceAudioMuted(false);
    setOutputAudioMuted(true);
    showMessage('Translation mode: Translator voice prioritized', 'info');
  };

  const setSingingMode = () => {
    setSourceVolume(1.0);  // 100% source (full)
    setTranslatorVolume(0.0); // 0% translator (muted)
    // Source Media mode: Mute source (not translating), unmute output (monitor final)
    setSourceAudioMuted(true);
    setOutputAudioMuted(false);
    showMessage('Source Media mode: Original audio prioritized', 'info');
  };

  const setBalancedMode = () => {
    setSourceVolume(0.5);  // 50% source
    setTranslatorVolume(0.8); // 80% translator
    // Balanced mode: Unmute source, mute output (still translating)
    setSourceAudioMuted(false);
    setOutputAudioMuted(true);
    showMessage('Balanced mode: Both audios mixed', 'info');
  };

  // Profile picture capture functions
  const startCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' }, 
        audio: false 
      });
      
      setShowCameraCapture(true);
      
      // Set video source after modal is rendered
      setTimeout(() => {
        if (cameraCaptureRef.current) {
          cameraCaptureRef.current.srcObject = stream;
          cameraCaptureRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      showMessage('Failed to access camera. Please check permissions.', 'error');
    }
  };

  const capturePhoto = async () => {
    if (!cameraCaptureRef.current || !photoCanvasRef.current) {
      showMessage('Camera not ready. Please try again.', 'error');
      return;
    }

    const video = cameraCaptureRef.current;
    const canvas = photoCanvasRef.current;
    
    // Check if video is ready
    if (video.readyState < 2) {
      showMessage('Camera is still loading. Please wait.', 'error');
      return;
    }
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      // Upload to server
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://ministryprogs.tniglobal.org/api/translator/profile-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ imageData })
        });
        
        if (response.ok) {
          showMessage('✅ Live picture captured successfully!', 'success');
          closeCameraCapture();
        } else {
          showMessage('Failed to save picture. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        showMessage('Network error. Could not save picture.', 'error');
      }
    }
  };

  const closeCameraCapture = () => {
    if (cameraCaptureRef.current?.srcObject) {
      const stream = cameraCaptureRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      cameraCaptureRef.current.srcObject = null;
    }
    setShowCameraCapture(false);
  };

  useEffect(() => {
    return () => {
      // Only cleanup if not currently translating
      // Use ref to get current value, not closure value
      if (!isTranslatingRef.current) {
        console.log('🧹 Component unmounting - cleaning up (not translating)');
        stopTranslating();
      } else {
        console.log('⏸️ Component unmounting but still translating - skipping cleanup');
      }
    };
  }, []);  // Empty dependency array - only cleanup on unmount

  // Control source video mute state
  useEffect(() => {
    const sourceVideo = document.querySelector('video.source-video') as HTMLVideoElement;
    if (sourceVideo) {
      sourceVideo.muted = sourceAudioMuted;
      sourceVideoRef.current = sourceVideo;
      console.log('🔊 Source video muted:', sourceAudioMuted);
    }
  }, [sourceAudioMuted]);
  return (
    <div className="studio-test">
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="studio-info-bar">
        <div className="translation-info">
          <h3>Translation Language: {language}</h3>
          <p className="language-subtitle">Live Translation Session - Audio Mixing Mode</p>
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
            {outputStreamAvailable && user?.id ? (
              <WebRTCPlayer
                producerUserId={user.id}
                title="Your Translation Output"
                className="output-video"
                autoPlay={true}
                defaultMuted={true}
                externalMuted={outputAudioMuted}
                onMuteChange={setOutputAudioMuted}
                externalVolume={outputVolume}
                onVolumeChange={setOutputVolume}
              />
            ) : (
              <div className="video-placeholder">
                <p>⏳ Waiting for stream...</p>
                <p>Click "Start Translating" to begin WebRTC streaming</p>
              </div>
            )}
          </div>
        </div>

        {outputStreamAvailable && user?.id && (
          <div className="audio-info-tip">
            💡 <strong>Audio Tip:</strong> Output is muted by default to prevent echo. 
            Unmute to monitor your translation output if needed.
          </div>
        )}
        <div className="controls-section">
          {/* Audio Mixing Controls */}
          <div className="audio-mixer-section">
            <h3>🎚️ Audio Mixing Controls</h3>
            <p className="mixer-description">
              Adjust audio levels for Translation mode (translator loud) or Source Media Mode (original audio loud)
            </p>
            
            <div className="mixer-presets">
              <button 
                onClick={setPreachingMode}
                className="btn-preset btn-preaching"
              >
                🎤 Translation Mode
              </button>
              <button 
                onClick={setBalancedMode}
                className="btn-preset btn-balanced"
              >
                ⚖️ Balanced Mode
              </button>
              <button 
                onClick={setSingingMode}
                className="btn-preset btn-singing"
              >
                🎵 Source Media Mode
              </button>
            </div>

            <div className="volume-controls">
              <div className="volume-control">
                <label htmlFor="sourceVolume">
                  🔊 Source Audio Volume: {Math.round(sourceVolume * 100)}%
                </label>
                <input
                  id="sourceVolume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sourceVolume}
                  onChange={(e) => setSourceVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                  style={{
                    background: `linear-gradient(to right, 
                      ${sourceVolume === 0 ? '#9e9e9e' : 
                        sourceVolume < 0.3 ? '#2196f3' : 
                        sourceVolume < 0.7 ? '#ff9800' : '#9c27b0'} 0%, 
                      ${sourceVolume === 0 ? '#9e9e9e' : 
                        sourceVolume < 0.3 ? '#2196f3' : 
                        sourceVolume < 0.7 ? '#ff9800' : '#9c27b0'} ${sourceVolume * 100}%, 
                      #e0e0e0 ${sourceVolume * 100}%, 
                      #e0e0e0 100%)`
                  }}
                />
                <span className="volume-label" style={{
                  background: sourceVolume === 0 ? '#9e9e9e' : 
                             sourceVolume < 0.3 ? '#2196f3' : 
                             sourceVolume < 0.7 ? '#ff9800' : '#9c27b0',
                  color: 'white'
                }}>
                  {sourceVolume === 0 ? 'Muted' : 
                   sourceVolume < 0.3 ? 'Low (Preaching)' :
                   sourceVolume < 0.7 ? 'Medium (Balanced)' : 'High (Singing)'}
                </span>
              </div>

              <div className="volume-control">
                <label htmlFor="translatorVolume">
                  🎤 Translator Volume: {Math.round(translatorVolume * 100)}%
                </label>
                <input
                  id="translatorVolume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={translatorVolume}
                  onChange={(e) => setTranslatorVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                  style={{
                    background: `linear-gradient(to right, 
                      ${translatorVolume === 0 ? '#9e9e9e' : 
                        translatorVolume < 0.3 ? '#ff5722' : 
                        translatorVolume < 0.7 ? '#4caf50' : '#2196f3'} 0%, 
                      ${translatorVolume === 0 ? '#9e9e9e' : 
                        translatorVolume < 0.3 ? '#ff5722' : 
                        translatorVolume < 0.7 ? '#4caf50' : '#2196f3'} ${translatorVolume * 100}%, 
                      #e0e0e0 ${translatorVolume * 100}%, 
                      #e0e0e0 100%)`
                  }}
                />
                <span className="volume-label" style={{
                  background: translatorVolume === 0 ? '#9e9e9e' : 
                             translatorVolume < 0.3 ? '#ff5722' : 
                             translatorVolume < 0.7 ? '#4caf50' : '#2196f3',
                  color: 'white'
                }}>
                  {translatorVolume === 0 ? 'Muted' : 
                   translatorVolume < 0.3 ? 'Low (Singing)' :
                   translatorVolume < 0.7 ? 'Medium (Balanced)' : 'High (Preaching)'}
                </span>
              </div>

              <div className="volume-control">
                <label htmlFor="outputVolume">
                  🔊 Output Monitor Volume: {Math.round(outputVolume * 100)}%
                </label>
                <input
                  id="outputVolume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={outputVolume}
                  onChange={(e) => setOutputVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                  style={{
                    background: `linear-gradient(to right, 
                      ${outputVolume === 0 ? '#9e9e9e' : '#4caf50'} 0%, 
                      ${outputVolume === 0 ? '#9e9e9e' : '#4caf50'} ${outputVolume * 100}%, 
                      #e0e0e0 ${outputVolume * 100}%, 
                      #e0e0e0 100%)`
                  }}
                />
                <span className="volume-label" style={{
                  background: outputVolume === 0 ? '#9e9e9e' : '#4caf50',
                  color: 'white'
                }}>
                  {outputVolume === 0 ? 'Muted' : 
                   outputVolume < 0.3 ? 'Low' :
                   outputVolume < 0.7 ? 'Medium' : 'High'}
                </span>
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>
                  Synced with output screen volume control
                </small>
              </div>
            </div>
          </div>

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
              {isTranslating && (
                <button
                  onClick={startCameraCapture}
                  className="btn-camera btn-large"
                  title="Take picture while translating live"
                >
                  📷 Take Picture
                </button>
              )}
            </div>
            <div className="stream-status">
              Status: {isTranslating ? 
                (outputStreamAvailable ? 'Translation Active - Stream Live ✓' : 'Starting Stream...') : 
                'Ready to Translate'}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <div className="camera-modal-overlay" onClick={closeCameraCapture}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-header">
              <h3>📷 Take Live Picture</h3>
              <button className="close-modal-btn" onClick={closeCameraCapture}>✕</button>
            </div>
            <div className="camera-preview">
              <video ref={cameraCaptureRef} autoPlay playsInline></video>
              <canvas ref={photoCanvasRef} style={{ display: 'none' }}></canvas>
            </div>
            <div className="camera-actions">
              <button onClick={capturePhoto} className="btn-capture">
                📸 Capture Photo
              </button>
              <button onClick={closeCameraCapture} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioTest;
