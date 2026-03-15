/**
 * RelayStudio — Relay Interpretation Studio
 *
 * "Relay interpretation" (also called pivot interpretation) is used when a translator
 * cannot work directly from the source language. They listen to an intermediate (relay/pivot)
 * language feed — e.g. French — and interpret from that into their target dialect or language.
 *
 * This studio replaces the fixed source video with a relay language selector dropdown,
 * so translators can pick the intermediate language they understand best.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import VideoPlayer from './VideoPlayer';
import WebRTCPlayer from './WebRTCPlayer';
import AudioControls from './AudioControls';
import LiveStatusIndicator from './LiveStatusIndicator';
import webrtcService from '../services/webrtcService';
import './StudioTest.css';

interface RelayLanguageOption {
  label: string;
  value: string;
  flag: string;
  url: string;
  type: 'hls' | 'embed';
}

const RELAY_LANGUAGES: RelayLanguageOption[] = [
  {
    label: 'French',
    value: 'french',
    flag: '🇫🇷',
    url: 'https://tni-out.ceflixcdn.com/translations/french/playlist.m3u8',
    type: 'hls',
  },
  {
    label: 'German',
    value: 'german',
    flag: '🇩🇪',
    url: 'https://tni-out.ceflixcdn.com/translations/german/playlist.m3u8',
    type: 'hls',
  },
  {
    label: 'Hindi',
    value: 'hindi',
    flag: '🇮🇳',
    url: 'https://embed.ceflix.org/video/1861648',
    type: 'embed',
  },
  {
    label: 'Spanish',
    value: 'spanish',
    flag: '🇪🇸',
    url: 'https://tni-out.ceflixcdn.com/translations/spanish/playlist.m3u8',
    type: 'hls',
  },
];

const RelayStudio: React.FC = () => {
  const API_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : 'https://ministryprogs.tniglobal.org';

  const {
    user,
    liveStatus,
    outputStreamAvailable,
    setLiveStatus,
    setOutputStreamAvailable,
    isTranslating,
    setIsTranslating,
    getTranslationLanguage,
  } = useAppStore();

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');

  // Relay language selection — French is the default pivot language
  const [selectedRelay, setSelectedRelay] = useState<RelayLanguageOption>(RELAY_LANGUAGES[0]);

  // Time tracking
  const [trackingStatus, setTrackingStatus] = useState<string>('Checking...');
  const [requestId, setRequestId] = useState<string | null>(null);

  // Audio volumes: "source" = relay feed, "translator" = interpreter's mic
  const [sourceVolume, setSourceVolume] = useState(0.1);      // Relay feed low by default
  const [translatorVolume, setTranslatorVolume] = useState(0.9); // Interpreter voice dominant
  const [outputVolume, setOutputVolume] = useState(0.7);

  const [sourceAudioMuted, setSourceAudioMuted] = useState(false);
  const [outputAudioMuted, setOutputAudioMuted] = useState(true); // muted to prevent echo

  const [showCameraCapture, setShowCameraCapture] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceGainNodeRef = useRef<GainNode | null>(null);
  const translatorGainNodeRef = useRef<GainNode | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const isTranslatingRef = useRef(false);
  const cameraCaptureRef = useRef<HTMLVideoElement | null>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const language = getTranslationLanguage();

  // ─── Tracking setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!user?.id) {
        setTrackingStatus('Please login to use time tracking');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/ts/assignments/my-active`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setRequestId(data.data[0].requestId._id);
            setTrackingStatus('Time tracking enabled');
          } else {
            setRequestId(null);
            setTrackingStatus('No active assignment');
          }
        } else {
          setRequestId('pending');
          setTrackingStatus('Time tracking enabled (fallback)');
        }
      } catch {
        setRequestId('pending');
        setTrackingStatus('Time tracking enabled (fallback)');
      }
    };
    fetchAssignment();
  }, [language, user, API_URL]);

  const showMessage = useCallback(
    (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      setMessage(msg);
      setMessageType(type);
      setTimeout(() => setMessage(''), 5000);
    },
    []
  );

  // ─── Real-time gain updates ───────────────────────────────────────────────────
  useEffect(() => {
    if (sourceGainNodeRef.current) sourceGainNodeRef.current.gain.value = sourceVolume;
    if (translatorGainNodeRef.current) translatorGainNodeRef.current.gain.value = translatorVolume;
  }, [sourceVolume, translatorVolume]);

  // ─── Relay source video mute sync ────────────────────────────────────────────
  useEffect(() => {
    const relayVideo = document.querySelector('video.relay-source-video') as HTMLVideoElement;
    if (relayVideo) relayVideo.muted = sourceAudioMuted;
  }, [sourceAudioMuted]);

  // ─── Microphone change handler ────────────────────────────────────────────────
  const handleMicrophoneChange = useCallback(async (stream: MediaStream | null) => {
    mediaStreamRef.current = stream;
    if (stream) console.log('🎤 Microphone stream updated:', stream.getTracks().map((t) => t.label));
  }, []);

  // ─── Volume sync (source + translator always = 100%) ─────────────────────────
  const handleSourceVolumeChange = (v: number) => {
    setSourceVolume(v);
    setTranslatorVolume(parseFloat((1.0 - v).toFixed(2)));
  };
  const handleTranslatorVolumeChange = (v: number) => {
    setTranslatorVolume(v);
    setSourceVolume(parseFloat((1.0 - v).toFixed(2)));
  };

  // ─── Preset modes ────────────────────────────────────────────────────────────
  const setTranslationMode = () => {
    setSourceVolume(0.1);
    setTranslatorVolume(0.9);
    setSourceAudioMuted(false);
    setOutputAudioMuted(true);
    showMessage('Translation mode: Your voice prioritized (90%/10%)', 'info');
  };
  const setBalancedMode = () => {
    setSourceVolume(0.4);
    setTranslatorVolume(0.6);
    setSourceAudioMuted(false);
    setOutputAudioMuted(true);
    showMessage('Balanced mode: Both audios mixed (40%/60%)', 'info');
  };
  const setListenMode = () => {
    setSourceVolume(0.9);
    setTranslatorVolume(0.1);
    setSourceAudioMuted(false);
    setOutputAudioMuted(false);
    showMessage('Listen mode: Relay feed prioritized — use to study the relay language', 'info');
  };

  // ─── Stop translating ─────────────────────────────────────────────────────────
  const stopTranslating = useCallback(async () => {
    console.log('🛑 RelayStudio stopTranslating called');
    setIsTranslating(false);
    isTranslatingRef.current = false;
    setLiveStatus('offline');
    setOutputStreamAvailable(false);

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/translator/stop-translating`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (requestId && language) {
        const tr = await fetch(`${API_URL}/api/ts/time-tracking/auto-end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, language }),
        });
        if (tr.ok) setTrackingStatus('Auto-tracking ended');
      }
    } catch (e) {
      console.error('Failed to track session end:', e);
    }

    if (webrtcService.isProducing()) {
      await webrtcService.stopProducing();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    sourceGainNodeRef.current = null;
    translatorGainNodeRef.current = null;
    mixedStreamRef.current = null;

    showMessage('Relay interpretation stopped', 'info');
  }, [
    API_URL,
    language,
    requestId,
    setIsTranslating,
    setLiveStatus,
    setOutputStreamAvailable,
    showMessage,
  ]);

  // ─── Start translating ────────────────────────────────────────────────────────
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
      showMessage('Starting relay interpretation studio with audio mixing...', 'info');

      // Track session start
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/translator/start-translating`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (requestId && language) {
          const tr = await fetch(`${API_URL}/api/ts/time-tracking/auto-start`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, language }),
          });
          if (tr.ok) setTrackingStatus('Auto-tracking active');
        }
      } catch (e) {
        console.error('Failed to track session start:', e);
      }

      // Set up AudioContext and translator (interpreter) mic
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const translatorAudioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (!translatorAudioTrack) {
        showMessage('No microphone audio detected. Please check permissions.', 'error');
        setIsTranslating(false);
        isTranslatingRef.current = false;
        return;
      }

      const translatorGain = audioContext.createGain();
      translatorGain.gain.value = translatorVolume;
      translatorGainNodeRef.current = translatorGain;

      const audioDestination = audioContext.createMediaStreamDestination();
      const translatorAudioSource = audioContext.createMediaStreamSource(
        new MediaStream([translatorAudioTrack])
      );
      translatorAudioSource.connect(translatorGain);
      translatorGain.connect(audioDestination);

      // ── Canvas & relay audio depend on source type ──────────────────────────
      let canvas: HTMLCanvasElement;

      if (selectedRelay.type === 'hls') {
        // For HLS relay feed: capture video frames + mix relay audio with translator mic
        const relayVideo = document.querySelector('video.relay-source-video') as HTMLVideoElement;
        if (!relayVideo) {
          showMessage('Relay video element not found. Please refresh the page.', 'error');
          setIsTranslating(false);
          isTranslatingRef.current = false;
          return;
        }

        // Wait up to 8 seconds for the relay stream to be ready
        if (relayVideo.readyState < 2) {
          showMessage('Relay video is loading, please wait a moment...', 'info');
          const ready = await new Promise<boolean>((resolve) => {
            if (relayVideo.readyState >= 2) { resolve(true); return; }
            let attempts = 0;
            const interval = setInterval(() => {
              attempts++;
              if (relayVideo.readyState >= 2) { clearInterval(interval); resolve(true); }
              else if (attempts >= 16) { clearInterval(interval); resolve(false); }
            }, 500);
          });
          if (!ready) {
            showMessage('Relay video not ready. Check your internet connection.', 'error');
            setIsTranslating(false);
            isTranslatingRef.current = false;
            return;
          }
        }

        // Mix relay feed audio into the output stream
        const relayMediaStream = (relayVideo as any).captureStream
          ? (relayVideo as any).captureStream()
          : (relayVideo as any).mozCaptureStream();
        const relayAudioTrack = relayMediaStream.getAudioTracks()[0];
        if (relayAudioTrack) {
          const sourceGain = audioContext.createGain();
          sourceGain.gain.value = sourceVolume;
          sourceGainNodeRef.current = sourceGain;
          audioContext
            .createMediaStreamSource(new MediaStream([relayAudioTrack]))
            .connect(sourceGain);
          sourceGain.connect(audioDestination);
        } else {
          console.warn('⚠️ No audio track from relay video — interpreter voice only in output');
        }

        // Capture relay video frames onto canvas
        canvas = document.createElement('canvas');
        canvas.width = relayVideo.videoWidth || 640;
        canvas.height = relayVideo.videoHeight || 480;
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d');
        const captureFrame = () => {
          if (relayVideo.readyState === 4 && ctx && isTranslatingRef.current) {
            ctx.drawImage(relayVideo, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(captureFrame);
          }
        };
        captureFrame();

      } else {
        // For embed sources (e.g. Hindi): static caption canvas + interpreter mic only
        // The embed iframe is for listening only — interpreter uses headphones to avoid feedback
        canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, 640, 480);

          ctx.fillStyle = '#F06292';
          ctx.font = 'bold 26px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🎙️ Live Relay Interpretation', 320, 160);

          ctx.fillStyle = '#ffffff';
          ctx.font = '22px Arial';
          ctx.fillText(
            `${selectedRelay.flag} ${selectedRelay.label} → ${language || 'Your Language'}`,
            320,
            220
          );

          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.font = '17px Arial';
          ctx.fillText('Your interpretation is being streamed live', 320, 280);

          ctx.fillStyle = '#4CAF50';
          ctx.font = 'bold 18px Arial';
          ctx.fillText('● LIVE', 320, 340);
        }

        showMessage(
          `Embed relay — use headphones! Your voice is being streamed (relay audio is for listening only).`,
          'info'
        );
      }

      // Add mixed audio to canvas stream and produce via WebRTC
      const canvasStream = canvas.captureStream(30);
      const mixedAudioTrack = audioDestination.stream.getAudioTracks()[0];
      canvasStream.addTrack(mixedAudioTrack);
      mixedStreamRef.current = canvasStream;

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token. Please login again.');

      webrtcService.setToken(token);
      console.log('🚀 Initializing streaming device...');
      await webrtcService.initializeDevice();

      console.log('📡 Creating transport...');
      await webrtcService.createProducerTransport();

      console.log('🎥 Starting stream...');
      await webrtcService.produceMedia(canvasStream);

      // Allow producers to stabilize before consumers connect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setLiveStatus('online');
      setOutputStreamAvailable(true);
      showMessage('Relay interpretation studio live! Your translation is now streaming.', 'success');
      console.log('✅ Relay interpretation started successfully!');
    } catch (error: any) {
      console.error('Error starting relay translation:', error);
      let msg = error.message || 'Failed to start interpretation';
      if (msg.includes('token')) msg = 'Session expired. Please refresh and login again.';
      showMessage(`Error: ${msg}`, 'error');
      setIsTranslating(false);
      isTranslatingRef.current = false;
      setLiveStatus('offline');
    }
  };

  // ─── Camera capture ───────────────────────────────────────────────────────────
  const startCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      setShowCameraCapture(true);
      setTimeout(() => {
        if (cameraCaptureRef.current) {
          cameraCaptureRef.current.srcObject = stream;
          cameraCaptureRef.current.play().catch(console.error);
        }
      }, 100);
    } catch {
      showMessage('Failed to access camera. Please check permissions.', 'error');
    }
  };

  const capturePhoto = async () => {
    if (!cameraCaptureRef.current || !photoCanvasRef.current) {
      showMessage('Camera not ready. Please try again.', 'error');
      return;
    }
    const video = cameraCaptureRef.current;
    if (video.readyState < 2) {
      showMessage('Camera is still loading.', 'error');
      return;
    }
    const canvas = photoCanvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/translator/profile-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageData }),
        });
        if (res.ok) {
          showMessage('✅ Live picture captured!', 'success');
          closeCameraCapture();
        } else {
          showMessage('Failed to save picture. Please try again.', 'error');
        }
      } catch {
        showMessage('Network error. Could not save picture.', 'error');
      }
    }
  };

  const closeCameraCapture = () => {
    if (cameraCaptureRef.current?.srcObject) {
      (cameraCaptureRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      cameraCaptureRef.current.srcObject = null;
    }
    setShowCameraCapture(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isTranslatingRef.current) stopTranslating();
    };
  }, []); // eslint-disable-line

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="studio-test">
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <div className="studio-info-bar">
        <div className="translation-info">
          <h3>Translation Language: {language}</h3>
          <p className="language-subtitle">
            🔄 Pivot Translation Mode — Listening via{' '}
            {selectedRelay.flag} {selectedRelay.label}
          </p>
        </div>
        <LiveStatusIndicator status={liveStatus} />
      </div>

      {/* ── Relay Language Selector ─────────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          border: '1px solid rgba(240,98,146,0.4)',
        }}
      >
        <div style={{ color: 'white', flex: '1 1 200px' }}>
          <strong style={{ fontSize: '16px' }}>🌐 Pivot Language</strong>
          <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.75 }}>
            Select the intermediate language you understand and will interpret from
          </p>
        </div>

        <select
          value={selectedRelay.value}
          onChange={(e) => {
            if (isTranslating) {
              showMessage('Stop translating before changing the relay language.', 'error');
              return;
            }
            const lang = RELAY_LANGUAGES.find((l) => l.value === e.target.value);
            if (lang) setSelectedRelay(lang);
          }}
          disabled={isTranslating}
          style={{
            padding: '10px 18px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '2px solid #F06292',
            background: isTranslating ? '#444' : '#1a1a2e',
            color: 'white',
            cursor: isTranslating ? 'not-allowed' : 'pointer',
            minWidth: '200px',
          }}
        >
          {RELAY_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value} style={{ background: '#1a1a2e' }}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>

        {selectedRelay.type === 'embed' && (
          <div
            style={{
              background: 'rgba(255,152,0,0.2)',
              border: '1px solid #FF9800',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#FFE0B2',
              fontSize: '13px',
              flex: '1 1 250px',
            }}
          >
            ⚠️ <strong>Embed source:</strong> Use headphones to avoid audio feedback.
            Your microphone voice will be streamed; the relay audio is for your ears only.
          </div>
        )}
      </div>

      <div className="studio-content">
        <div className="video-section">
          {/* ── Relay source feed (left panel) ──────────────────────────────── */}
          <div className="video-container">
            {selectedRelay.type === 'hls' ? (
              <VideoPlayer
                url={selectedRelay.url}
                title={`${selectedRelay.flag} ${selectedRelay.label} — Relay Feed`}
                className="relay-source-video"
                autoPlay={true}
                externalVolume={sourceVolume}
                onVolumeChange={handleSourceVolumeChange}
              />
            ) : (
              <div
                style={{
                  background: 'rgba(0,0,0,0.8)',
                  borderRadius: '12px',
                  padding: '15px',
                  height: '100%',
                  minHeight: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '10px' }}>
                  {selectedRelay.flag} {selectedRelay.label} — Relay Feed
                </h3>
                <iframe
                  src={selectedRelay.url}
                  style={{
                    width: '100%',
                    flex: 1,
                    border: 'none',
                    borderRadius: '8px',
                    minHeight: '260px',
                  }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title={`${selectedRelay.label} relay feed`}
                />
              </div>
            )}
          </div>

          {/* ── Translation output (right panel) ────────────────────────────── */}
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
                <p>Click "Start Translating" to begin streaming</p>
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
          {/* ── Audio Mixing Controls ──────────────────────────────────────── */}
          <div className="audio-mixer-section">
            <h3>🎚️ Audio Mixing Controls</h3>
            <p className="mixer-description">
              Adjust levels between the relay feed audio and your interpreter voice
            </p>

            <div className="mixer-presets">
              <button onClick={setTranslationMode} className="btn-preset btn-preaching">
                🎤 Translation Mode
              </button>
              <button onClick={setBalancedMode} className="btn-preset btn-balanced">
                ⚖️ Balanced Mode
              </button>
              <button onClick={setListenMode} className="btn-preset btn-singing">
                👂 Listen Mode
              </button>
            </div>

            <div className="volume-controls">
              {/* Relay feed volume */}
              <div className="volume-control">
                <label htmlFor="relayFeedVolume">
                  🔊 Relay Feed Volume: {Math.round(sourceVolume * 100)}%
                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                    (Your voice: {Math.round(translatorVolume * 100)}%)
                  </span>
                </label>
                <input
                  id="relayFeedVolume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sourceVolume}
                  onChange={(e) => handleSourceVolumeChange(parseFloat(e.target.value))}
                  className="volume-slider"
                  style={{
                    background: `linear-gradient(to right,
                      ${sourceVolume === 0 ? '#9e9e9e' : sourceVolume < 0.3 ? '#2196f3' : sourceVolume < 0.7 ? '#ff9800' : '#9c27b0'} 0%,
                      ${sourceVolume === 0 ? '#9e9e9e' : sourceVolume < 0.3 ? '#2196f3' : sourceVolume < 0.7 ? '#ff9800' : '#9c27b0'} ${sourceVolume * 100}%,
                      #e0e0e0 ${sourceVolume * 100}%, #e0e0e0 100%)`,
                  }}
                />
                <span
                  className="volume-label"
                  style={{
                    background:
                      sourceVolume === 0
                        ? '#9e9e9e'
                        : sourceVolume < 0.3
                        ? '#2196f3'
                        : sourceVolume < 0.7
                        ? '#ff9800'
                        : '#9c27b0',
                    color: 'white',
                  }}
                >
                  {sourceVolume === 0
                    ? 'Muted'
                    : sourceVolume < 0.3
                    ? 'Low'
                    : sourceVolume < 0.7
                    ? 'Medium'
                    : 'High'}
                </span>
              </div>

              {/* Interpreter voice volume */}
              <div className="volume-control">
                <label htmlFor="interpreterVolume">
                  🎤 Your Voice Volume: {Math.round(translatorVolume * 100)}%
                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                    (Relay feed: {Math.round(sourceVolume * 100)}%)
                  </span>
                </label>
                <input
                  id="interpreterVolume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={translatorVolume}
                  onChange={(e) => handleTranslatorVolumeChange(parseFloat(e.target.value))}
                  className="volume-slider"
                  style={{
                    background: `linear-gradient(to right,
                      ${translatorVolume === 0 ? '#9e9e9e' : translatorVolume < 0.3 ? '#ff5722' : translatorVolume < 0.7 ? '#4caf50' : '#2196f3'} 0%,
                      ${translatorVolume === 0 ? '#9e9e9e' : translatorVolume < 0.3 ? '#ff5722' : translatorVolume < 0.7 ? '#4caf50' : '#2196f3'} ${translatorVolume * 100}%,
                      #e0e0e0 ${translatorVolume * 100}%, #e0e0e0 100%)`,
                  }}
                />
                <span
                  className="volume-label"
                  style={{
                    background:
                      translatorVolume === 0
                        ? '#9e9e9e'
                        : translatorVolume < 0.3
                        ? '#ff5722'
                        : translatorVolume < 0.7
                        ? '#4caf50'
                        : '#2196f3',
                    color: 'white',
                  }}
                >
                  {translatorVolume === 0
                    ? 'Muted'
                    : translatorVolume < 0.3
                    ? 'Low'
                    : translatorVolume < 0.7
                    ? 'Medium'
                    : 'High'}
                </span>
              </div>

              {/* Output monitor volume */}
              <div className="volume-control">
                <label htmlFor="relayOutputVolume">
                  🔊 Output Volume: {Math.round(outputVolume * 100)}%
                </label>
                <input
                  id="relayOutputVolume"
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
                      #e0e0e0 ${outputVolume * 100}%, #e0e0e0 100%)`,
                  }}
                />
                <span
                  className="volume-label"
                  style={{ background: outputVolume === 0 ? '#9e9e9e' : '#4caf50', color: 'white' }}
                >
                  {outputVolume === 0
                    ? 'Muted'
                    : outputVolume < 0.3
                    ? 'Low'
                    : outputVolume < 0.7
                    ? 'Medium'
                    : 'High'}
                </span>
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>
                  Synced with output screen volume control
                </small>
              </div>
            </div>
          </div>

          <AudioControls onMicrophoneChange={handleMicrophoneChange} isActive={isTranslating} />

          {/* ── Translation Controls ─────────────────────────────────────────── */}
          <div className="translation-controls">
            <h3>Translation Controls</h3>
            <div className="button-group">
              <button
                onClick={startTranslating}
                disabled={isTranslating}
                className="btn-primary btn-large"
              >
                {isTranslating ? 'Interpreting...' : 'Start Translating'}
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
                  title="Take picture while live"
                >
                  📷 Take Picture
                </button>
              )}
            </div>
            <div className="stream-status">
              Status:{' '}
              {isTranslating
                ? outputStreamAvailable
                  ? 'Relay Interpretation Active — Stream Live ✓'
                  : 'Starting Stream...'
                : 'Ready to Interpret'}
            </div>
          </div>

          {/* ── Automatic Time Tracking ──────────────────────────────────────── */}
          <div className="time-tracking-controls">
            <h3>⏱️ Automatic Time Tracking</h3>
            <div className="tracking-status-info">
              <span className="status-badge status-ready">✅ Enabled</span>
            </div>
            <div className="tracking-info">
              <p style={{ fontSize: '14px', color: '#333', marginTop: '10px', lineHeight: '1.6' }}>
                ⚡ <strong>Smart Automatic Tracking:</strong> Your interpretation time is
                automatically tracked when you click "Start Translating".
              </p>
              <ul style={{ fontSize: '13px', color: '#666', marginTop: '8px', paddingLeft: '20px' }}>
                <li>✅ Starts tracking when you begin interpreting</li>
                <li>✅ Stops tracking when you end your session</li>
                <li>✅ Calculates your compensation automatically</li>
              </ul>
              <p style={{ fontSize: '12px', color: '#007bff', marginTop: '12px', fontStyle: 'italic' }}>
                💰 No manual clocking needed — just start interpreting and the system handles everything!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Camera Capture Modal ─────────────────────────────────────────────── */}
      {showCameraCapture && (
        <div className="camera-modal-overlay" onClick={closeCameraCapture}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-header">
              <h3>📷 Take Live Picture</h3>
              <button className="close-modal-btn" onClick={closeCameraCapture}>
                ✕
              </button>
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

export default RelayStudio;
