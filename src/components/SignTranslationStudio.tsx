/**
 * SignTranslationStudio — Sign Language Interpretation Studio
 *
 * Allows sign language translators to:
 *  1. Select a pivot language (including English) to watch the source feed.
 *  2. Start their camera to capture their sign language interpretation.
 *  3. View a split screen: source video on the left, their own camera on the right.
 *  4. Stream their sign language video live via WebRTC.
 *
 * The English feed URL is fetched dynamically from the admin-controlled settings API
 * (same source used by the Translation Studio). All other pivot language feeds use
 * the same HLS / embed URLs as the Pivot Translation Studio.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { useAppStore } from '../store/useAppStore';
import WebRTCPlayer from './WebRTCPlayer';
import AudioControls from './AudioControls';
import LiveStatusIndicator from './LiveStatusIndicator';
import webrtcService from '../services/webrtcService';
import './SignTranslationStudio.css';

// ─── Hardcoded fallback for English — same as TranslationStudio.tsx default ──
const ENGLISH_FALLBACK_URL =
  'https://2nbyjxnbl53k-hls-live.5centscdn.com/RTV/59a49be6dc0f146c57cd9ee54da323b1.sdp/playlist.m3u8';

interface PivotLanguageOption {
  label: string;
  value: string;
  flag: string;
  url: string;
  type: 'hls' | 'embed' | 'dynamic';
}

// English uses type 'dynamic' — URL is resolved at runtime from the settings API.
// Other entries are the same as RelayStudio.
const PIVOT_LANGUAGES: PivotLanguageOption[] = [
  {
    label: 'English',
    value: 'english',
    flag: '🇬🇧',
    url: ENGLISH_FALLBACK_URL, // overridden by fetchEnglishUrl()
    type: 'dynamic',
  },
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
    label: 'Spanish',
    value: 'spanish',
    flag: '🇪🇸',
    url: 'https://tni-out.ceflixcdn.com/translations/spanish/playlist.m3u8',
    type: 'hls',
  },
  {
    label: 'Hindi',
    value: 'hindi',
    flag: '🇮🇳',
    url: 'https://embed.ceflix.org/video/1861648',
    type: 'embed',
  },
];

const API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

const SignTranslationStudio: React.FC = () => {
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

  // ── Pivot language ────────────────────────────────────────────────────────
  const [pivotLanguages, setPivotLanguages] = useState<PivotLanguageOption[]>(PIVOT_LANGUAGES);
  const [selectedPivot, setSelectedPivot] = useState<PivotLanguageOption>(PIVOT_LANGUAGES[0]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // ── Source video (HLS player for pivot feed) ─────────────────────────────
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const sourceHlsRef = useRef<Hls | null>(null);
  const [sourceVideoReady, setSourceVideoReady] = useState(false);
  const [sourceVideoMuted, setSourceVideoMuted] = useState(true); // start muted for autoplay

  // ── Canvas composite (source + camera → broadcast stream) ────────────────
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeAnimFrameRef = useRef<number | null>(null);
  // Keep a ref to the captured stream so the audio track isn't garbage-collected
  const capturedSourceStreamRef = useRef<MediaStream | null>(null);
  // Fallback AudioContext (for embed / captureStream unavailable) — stored in ref to prevent GC
  const audioContextRef = useRef<AudioContext | null>(null);

  // ── Streaming / mic ───────────────────────────────────────────────────────
  const mediaStreamRef = useRef<MediaStream | null>(null);   // microphone (optional)
  const isTranslatingRef = useRef(false);
  const [outputVolume, setOutputVolume] = useState(0.7);
  const [outputAudioMuted, setOutputAudioMuted] = useState(true);

  // ── Source audio control ──────────────────────────────────────────────────
  const [sourceVolume, setSourceVolume] = useState(0.7);

  // ── Time tracking ─────────────────────────────────────────────────────────
  const [trackingStatus, setTrackingStatus] = useState<string>('Checking...');
  const [requestId, setRequestId] = useState<string | null>(null);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [isMirrored, setIsMirrored] = useState(true);

  const language = getTranslationLanguage();

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const showMessage = useCallback(
    (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      setMessage(msg);
      setMessageType(type);
      setTimeout(() => setMessage(''), 6000);
    },
    []
  );

  // ─── Fetch English source URL (admin-controlled) ──────────────────────────
  useEffect(() => {
    const fetchEnglishUrl = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          'https://ministryprogs.tniglobal.org/api/settings/source-video-url',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const dynamicUrl: string = data.sourceVideoUrl || ENGLISH_FALLBACK_URL;

          setPivotLanguages((prev) =>
            prev.map((lang) =>
              lang.value === 'english' ? { ...lang, url: dynamicUrl } : lang
            )
          );

          // Update currently selected English option if it's already active
          setSelectedPivot((prev) =>
            prev.value === 'english' ? { ...prev, url: dynamicUrl } : prev
          );
        }
      } catch {
        // Keep using the fallback URL — no action needed
        console.warn('⚠️ Could not fetch English source URL from settings — using fallback.');
      }
    };
    fetchEnglishUrl();
  }, []);

  // ─── Enumerate available cameras ─────────────────────────────────────────
  useEffect(() => {
    const enumerateCameras = async () => {
      try {
        // Request permission first so labels are populated
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((t) => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(cameras);
        if (cameras.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cameras[0].deviceId);
        }
      } catch {
        // Camera permission denied — handled at start-camera time
      }
    };
    enumerateCameras();
  }, []); // eslint-disable-line

  // ─── Time-tracking setup ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setTrackingStatus('Please login to use time tracking'); return; }
    const fetchAssignment = async () => {
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
  }, [user]);

  // ─── Camera: start ───────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: 1280, height: 720 }
          : { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      setCameraActive(true);

      // Attach to preview element — nextTick to allow DOM update
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found. Please connect a camera and try again.'
          : `Camera error: ${err.message}`;
      setCameraError(msg);
      showMessage(msg, 'error');
    }
  }, [selectedCameraId, showMessage]);

  // ─── Camera: stop ────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // ─── Camera device change ─────────────────────────────────────────────────
  const handleCameraChange = useCallback(
    async (deviceId: string) => {
      setSelectedCameraId(deviceId);
      if (cameraActive) {
        stopCamera();
        // brief delay then restart with new device
        setTimeout(async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: deviceId }, width: 1280, height: 720 },
              audio: false,
            });
            cameraStreamRef.current = stream;
            setCameraActive(true);
            setTimeout(() => {
              if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = stream;
                cameraVideoRef.current.play().catch(console.error);
              }
            }, 100);
          } catch (err: any) {
            showMessage(`Failed to switch camera: ${err.message}`, 'error');
          }
        }, 300);
      }
    },
    [cameraActive, stopCamera, showMessage]
  );

  // ─── Mic change (optional audio for stream) ───────────────────────────────
  const handleMicrophoneChange = useCallback((stream: MediaStream | null) => {
    mediaStreamRef.current = stream;
  }, []);

  // ─── Stop session ─────────────────────────────────────────────────────────
  const stopTranslating = useCallback(async () => {
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

    // Stop canvas composite animation loop
    if (compositeAnimFrameRef.current !== null) {
      cancelAnimationFrame(compositeAnimFrameRef.current);
      compositeAnimFrameRef.current = null;
    }
    compositeCanvasRef.current = null;
    capturedSourceStreamRef.current = null;

    // Close any fallback AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (webrtcService.isProducing()) {
      await webrtcService.stopProducing();
    }

    showMessage('Sign language interpretation stopped', 'info');
  }, [
    API_URL,
    language,
    requestId,
    setIsTranslating,
    setLiveStatus,
    setOutputStreamAvailable,
    showMessage,
  ]);

  // ─── Start streaming sign language video via WebRTC ───────────────────────
  const startTranslating = async () => {
    if (!cameraActive || !cameraStreamRef.current) {
      showMessage('Please start your camera first before going live.', 'error');
      return;
    }

    try {
      setIsTranslating(true);
      isTranslatingRef.current = true;
      setLiveStatus('connecting');
      setOutputStreamAvailable(false);
      showMessage('Starting sign language stream...', 'info');

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

      // ── Build composite canvas stream (source left | camera right) ───────
      // This is what viewers receive: both videos side by side in one stream.
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      compositeCanvasRef.current = canvas;
      const ctx = canvas.getContext('2d')!;
      const sourceVid = sourceVideoRef.current;
      const cameraVid = cameraVideoRef.current;
      const isEmbed = selectedPivot.type === 'embed';

      const drawFrame = () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1280, 720);

        // Left half — source feed
        if (!isEmbed && sourceVid && sourceVid.readyState >= 2) {
          ctx.drawImage(sourceVid, 0, 0, 640, 720);
        } else {
          ctx.fillStyle = '#0d1117';
          ctx.fillRect(0, 0, 640, 720);
          if (isEmbed) {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Source Feed', 320, 360);
          }
        }

        // Right half — translator's camera
        if (cameraVid && cameraVid.readyState >= 2) {
          ctx.drawImage(cameraVid, 640, 0, 640, 720);
        }

        // Divider line between left and right
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(640, 0);
        ctx.lineTo(640, 720);
        ctx.stroke();

        compositeAnimFrameRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Capture the canvas as a MediaStream (30 fps)
      const canvasStream = (canvas as any).captureStream(30) as MediaStream;
      const signStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((t) => signStream.addTrack(t));

      // ── Audio for the broadcast stream ─────────────────────────────────
      // Strategy: use element.captureStream() on the source <video>.
      // This has NO CORS restriction (unlike createMediaElementSource) and the
      // audio track lifetime is tied to the video element — no garbage-collection risk.
      let sourceAudioCaptured = false;
      if (!isEmbed && sourceVid && typeof (sourceVid as any).captureStream === 'function') {
        try {
          // Un-mute so the translator can hear the source and the captured stream has real audio
          sourceVid.muted = false;
          sourceVid.volume = sourceVolume;
          setSourceVideoMuted(false);  // sync the speaker icon in the UI

          const captured = (sourceVid as any).captureStream() as MediaStream;
          capturedSourceStreamRef.current = captured;  // prevent GC
          const audioTrack = captured.getAudioTracks()[0];
          if (audioTrack) {
            signStream.addTrack(audioTrack);
            sourceAudioCaptured = true;
          }
        } catch (err) {
          console.warn('captureStream() failed for source audio:', err);
        }
      }

      // Fallback: no source audio (embed or captureStream unavailable)
      if (!sourceAudioCaptured) {
        // Use mic if connected
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach((t) => signStream.addTrack(t));
        }
        // Still need at least one audio track for WebRTC — synthesise genuine silence.
        // Store the AudioContext in a ref so it isn't garbage-collected.
        if (signStream.getAudioTracks().length === 0) {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          const ac = audioContextRef.current;
          const dest = ac.createMediaStreamDestination();
          // Connect a silent gain node to keep the AudioContext active (no GC)
          const gain = ac.createGain();
          gain.gain.value = 0;
          gain.connect(dest);
          gain.connect(ac.destination);
          signStream.addTrack(dest.stream.getAudioTracks()[0]);
        }
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token. Please login again.');

      webrtcService.setToken(token);
      await webrtcService.initializeDevice();
      await webrtcService.createProducerTransport();
      await webrtcService.produceMedia(signStream);

      // Small stabilisation delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setLiveStatus('online');
      setOutputStreamAvailable(true);
      showMessage('🤟 Sign language stream is LIVE!', 'success');
    } catch (error: any) {
      console.error('Error starting sign stream:', error);
      let msg = error.message || 'Failed to start sign language stream';
      if (msg.includes('token')) msg = 'Session expired. Please refresh and login again.';
      showMessage(`Error: ${msg}`, 'error');
      setIsTranslating(false);
      isTranslatingRef.current = false;
      setLiveStatus('offline');
    }
  };

  // ─── HLS source video loader ──────────────────────────────────────────────
  useEffect(() => {
    const video = sourceVideoRef.current;
    const pivot = pivotLanguages.find((l) => l.value === selectedPivot.value) || selectedPivot;
    if (!video || !pivot.url || pivot.type === 'embed') return;

    // Tear down any previous instance
    if (sourceHlsRef.current) {
      sourceHlsRef.current.destroy();
      sourceHlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, capLevelToPlayerSize: true });
      hls.loadSource(pivot.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.volume = sourceVolume;
        video.muted = true;  // muted for autoplay policy
        video.play().then(() => {
          setSourceVideoReady(true);
        }).catch(() => {
          setSourceVideoReady(true); // still show unmute button even if play fails
        });
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
      sourceHlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = pivot.url;
      video.volume = sourceVolume;
      video.muted = true;
      video.play().then(() => setSourceVideoReady(true)).catch(() => setSourceVideoReady(true));
    }

    return () => {
      if (sourceHlsRef.current) {
        sourceHlsRef.current.destroy();
        sourceHlsRef.current = null;
      }
      setSourceVideoReady(false);
      setSourceVideoMuted(true);
    };
  // sourceVolume intentionally omitted — volume is synced by a separate effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pivotLanguages, selectedPivot]);

  // ─── Sync source volume slider → video element ───────────────────────────
  // captureStream() captures the video element's volume, so setting .volume here
  // automatically adjusts the audio flowing into the broadcast stream too.
  useEffect(() => {
    if (sourceVideoRef.current) {
      sourceVideoRef.current.volume = sourceVolume;
    }
  }, [sourceVolume]);

  // ─── Sync mute state → video element ──────────────────────────────────
  useEffect(() => {
    if (sourceVideoRef.current) {
      sourceVideoRef.current.muted = sourceVideoMuted;
    }
  }, [sourceVideoMuted]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
      if (isTranslatingRef.current) stopTranslating();
      if (sourceHlsRef.current) {
        sourceHlsRef.current.destroy();
        sourceHlsRef.current = null;
      }
    };
  }, []); // eslint-disable-line

  // ─── Resolve the effective URL for the current pivot language ─────────────
  // We look it up from the latest pivotLanguages state (English URL may be fetched)
  const effectivePivot = pivotLanguages.find((l) => l.value === selectedPivot.value) || selectedPivot;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="sign-studio">
      {message && <div className={`message ${messageType}`}>{message}</div>}

      {/* ── Info bar ───────────────────────────────────────────────────────── */}
      <div className="studio-info-bar">
        <div className="translation-info">
          <h3>Translation Language: {language}</h3>
          <p className="language-subtitle">
            🤟 Sign Language Studio — Source:{' '}
            {effectivePivot.flag} {effectivePivot.label}
          </p>
        </div>
        <LiveStatusIndicator status={liveStatus} />
      </div>

      {/* ── Pivot Language Selector ────────────────────────────────────────── */}
      <div className="sign-pivot-selector">
        <div className="pivot-label-block">
          <strong>🌐 Pivot / Source Language</strong>
          <p>Select the language feed you will watch and translate into sign language</p>
        </div>

        <select
          value={selectedPivot.value}
          onChange={(e) => {
            if (isTranslating) {
              showMessage('Stop streaming before changing the source language.', 'error');
              return;
            }
            const lang = pivotLanguages.find((l) => l.value === e.target.value);
            if (lang) setSelectedPivot(lang);
          }}
          disabled={isTranslating}
          className="pivot-dropdown"
        >
          {pivotLanguages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>

        {effectivePivot.type === 'embed' && (
          <div className="pivot-embed-warning">
            ⚠️ <strong>Embed source:</strong> Use headphones to avoid audio feedback.
          </div>
        )}
      </div>

      {/* ── Split Screen ──────────────────────────────────────────────────── */}
      <div className="sign-split-screen">

        {/* Left: Source feed */}
        <div className="split-panel split-panel--source">
          <div className="split-panel-header">
            <span className="split-panel-badge badge--source">
              {effectivePivot.flag} Source — {effectivePivot.label}
            </span>
            <div className="source-volume-inline">
              <button
                className="source-mute-btn"
                onClick={() => setSourceVideoMuted((m) => !m)}
                title={sourceVideoMuted ? 'Unmute source' : 'Mute source'}
              >
                {sourceVideoMuted ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sourceVideoMuted ? 0 : sourceVolume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setSourceVolume(v);
                  if (v > 0) setSourceVideoMuted(false);
                  else setSourceVideoMuted(true);
                }}
                className="inline-slider"
                title="Source volume"
              />
              <span>{sourceVideoMuted ? 'Muted' : `${Math.round(sourceVolume * 100)}%`}</span>
            </div>
          </div>

          {effectivePivot.type === 'embed' ? (
            <div className="embed-wrapper">
              <iframe
                src={effectivePivot.url}
                allow="autoplay; fullscreen"
                allowFullScreen
                title={`${effectivePivot.label} source feed`}
                className="source-embed"
              />
            </div>
          ) : (
            <div className="source-video-wrapper">
              {/* Loading placeholder shown before video starts */}
              {!sourceVideoReady && (
                <div className="source-loading-overlay">
                  <div className="source-loading-icon">⏳</div>
                  <p>Connecting to {effectivePivot.flag} {effectivePivot.label} feed…</p>
                </div>
              )}
              <video
                ref={sourceVideoRef}
                className="source-hls-video"
                playsInline
                muted
              />
            </div>
          )}
        </div>

        {/* Right: Translator's camera */}
        <div className="split-panel split-panel--camera">
          <div className="split-panel-header">
            <span className="split-panel-badge badge--sign">
              🤟 Your Sign Translation
            </span>
            <div className="camera-header-controls">
              {availableCameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="camera-device-select"
                  title="Select camera"
                  disabled={isTranslating}
                >
                  {availableCameras.map((cam, i) => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}
              <button
                className="mirror-btn"
                onClick={() => setIsMirrored((m) => !m)}
                title={isMirrored ? 'Disable mirror' : 'Enable mirror'}
              >
                {isMirrored ? '🪞 Mirrored' : '🪞 Normal'}
              </button>
            </div>
          </div>

          <div className="camera-preview-wrapper">
            {cameraActive ? (
              <>
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`camera-preview-video${isMirrored ? ' mirrored' : ''}`}
                />
              </>
            ) : (
              <div className="camera-placeholder">
                <div className="camera-placeholder-icon">📷</div>
                <p>Camera not started</p>
                <p className="camera-placeholder-hint">
                  Click <strong>"Start Camera"</strong> below to begin your sign language capture
                </p>
                {cameraError && (
                  <p className="camera-error-msg">{cameraError}</p>
                )}
              </div>
            )}
          </div>

          {/* Camera action buttons */}
          <div className="camera-action-bar">
            {!cameraActive ? (
              <button className="btn-start-camera" onClick={startCamera}>
                📷 Start Camera
              </button>
            ) : (
              <button className="btn-stop-camera" onClick={stopCamera} disabled={isTranslating}>
                ⏹ Stop Camera
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── Output stream monitor (shown once streaming) ───────────────────── */}
      {outputStreamAvailable && user?.id && (
        <div className="sign-output-monitor">
          <div className="output-monitor-header">
            <h4>📺 Your Live Output Stream <span className="live-badge">● LIVE</span></h4>
            <p className="output-monitor-hint">
              This is what your audience sees — source feed on the left, your sign translation on the right.
            </p>
          </div>
          {/* Output volume controls */}
          <div className="output-volume-row">
            <button
              className="output-mute-btn"
              onClick={() => setOutputAudioMuted((m) => !m)}
              title={outputAudioMuted ? 'Unmute output' : 'Mute output'}
            >
              {outputAudioMuted ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={outputAudioMuted ? 0 : outputVolume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setOutputVolume(v);
                if (v > 0) setOutputAudioMuted(false);
              }}
              className="inline-slider output-inline-slider"
              title="Output volume"
            />
            <span className="output-volume-pct">
              {outputAudioMuted ? 'Muted' : `${Math.round(outputVolume * 100)}%`}
            </span>
          </div>
          <div className="output-monitor-video">
            <WebRTCPlayer
              producerUserId={user.id}
              title="Sign Language Output"
              className="output-video"
              autoPlay={true}
              defaultMuted={true}
              externalMuted={outputAudioMuted}
              onMuteChange={setOutputAudioMuted}
              externalVolume={outputVolume}
              onVolumeChange={setOutputVolume}
            />
          </div>
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="controls-section">

        {/* Mic (optional) */}
        <AudioControls onMicrophoneChange={handleMicrophoneChange} isActive={isTranslating} />

        {/* Stream controls */}
        <div className="translation-controls">
          <h3>🤟 Sign Language Stream Controls</h3>

          {!cameraActive && (
            <p className="stream-warning">
              ⚠️ Start your camera first before going live.
            </p>
          )}

          <div className="button-group">
            <button
              onClick={startTranslating}
              disabled={isTranslating || !cameraActive}
              className="btn-primary btn-large"
            >
              {isTranslating ? '🤟 Streaming Live...' : '▶ Go Live'}
            </button>
            <button
              onClick={stopTranslating}
              disabled={!isTranslating}
              className="btn-danger btn-large"
            >
              ⏹ Stop Stream
            </button>
          </div>

          <div className="stream-status">
            Status:{' '}
            {isTranslating
              ? outputStreamAvailable
                ? '🤟 Sign Language Stream Active — LIVE ✓'
                : 'Connecting...'
              : cameraActive
              ? '📷 Camera Ready — Click "Go Live" to stream'
              : 'Ready — Start your camera to begin'}
          </div>

          <div className="stream-info-tips">
            <p>💡 <strong>Tips for sign language streaming:</strong></p>
            <ul>
              <li>Use good lighting — ensure your hands and face are clearly visible</li>
              <li>Position the camera so your full upper body and hands are in frame</li>
              <li>Use a plain background if possible for maximum visibility</li>
              <li>Mirror mode is enabled by default (natural for self-view)</li>
              <li>Your microphone is optional — add it if your sign language includes voicing</li>
            </ul>
          </div>
        </div>

        {/* Auto time tracking info */}
        <div className="time-tracking-controls">
          <h3>⏱️ Automatic Time Tracking</h3>
          <div className="tracking-status-info">
            <span className="status-badge status-ready">✅ Enabled</span>
            <span style={{ marginLeft: '12px', fontSize: '13px', color: '#555' }}>
              {trackingStatus}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#333', marginTop: '10px', lineHeight: '1.6' }}>
            ⚡ Your session time is automatically tracked when you click "Go Live".
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignTranslationStudio;
