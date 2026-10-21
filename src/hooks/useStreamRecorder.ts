import { useState, useRef, useCallback, useEffect } from 'react';
import { recordingStore } from '../services/recordingStore';

export interface FinishedRecording {
  id: string;
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  startedAt: number;
  language: string;
}

type RecorderStatus = 'idle' | 'recording' | 'paused';

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

/**
 * Records a clone of the translator's microphone track. It is fully independent of the
 * live stream, so starting/stopping a recording never affects the broadcast.
 */
export const useStreamRecorder = () => {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const idRef = useRef('');
  const metaRef = useRef({ startedAt: 0, language: '', mimeType: '' });
  const finishRef = useRef<((r: FinishedRecording | null) => void) | null>(null);
  const baseMsRef = useRef(0);
  const segmentStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMs = useCallback(() => baseMsRef.current + (segmentStartRef.current ? Date.now() - segmentStartRef.current : 0), []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    segmentStartRef.current = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => setElapsed(Math.floor(currentMs() / 1000)), 500);
  }, [currentMs, stopTimer]);

  const releaseTrack = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.onended = null;
      trackRef.current.stop();
      trackRef.current = null;
    }
  }, []);

  const start = useCallback(async (source: MediaStream | null, language: string): Promise<boolean> => {
    if (recorderRef.current) return false;
    setError(null);

    const liveTrack = source?.getAudioTracks().find((t) => t.readyState === 'live');
    if (!liveTrack) {
      setError('No active microphone. Please select a microphone first.');
      return false;
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('Recording is not supported on this device or browser.');
      return false;
    }

    const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const track = liveTrack.clone();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(new MediaStream([track]), mimeType ? { mimeType, audioBitsPerSecond: 96000 } : undefined);
    } catch (e: any) {
      track.stop();
      setError(e?.message || 'Could not start recording.');
      return false;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const effectiveMime = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0];
    idRef.current = id;
    metaRef.current = { startedAt: Date.now(), language, mimeType: effectiveMime };
    chunksRef.current = [];
    baseMsRef.current = 0;
    segmentStartRef.current = 0;
    trackRef.current = track;
    recorderRef.current = recorder;

    // Persistence is best-effort: a storage failure must never interrupt recording.
    recordingStore
      .create({ id, mimeType: effectiveMime, language, startedAt: metaRef.current.startedAt, durationSeconds: 0, status: 'recording' })
      .catch((e) => console.warn('Recording backup unavailable:', e));

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
        recordingStore.appendChunk(id, event.data).catch(() => undefined);
      }
    };

    recorder.onerror = () => setError('Recording error. Your audio up to this point was kept.');

    recorder.onstop = () => {
      const durationSeconds = Math.round(currentMs() / 1000);
      const blob = new Blob(chunksRef.current, { type: effectiveMime });
      stopTimer();
      releaseTrack();
      recorderRef.current = null;
      segmentStartRef.current = 0;
      setStatus('idle');
      setElapsed(0);
      const result = blob.size > 0
        ? { id, blob, mimeType: effectiveMime, durationSeconds, startedAt: metaRef.current.startedAt, language }
        : null;
      recordingStore.updateMeta(id, { durationSeconds, status: 'stopped' }).catch(() => undefined);
      finishRef.current?.(result);
      finishRef.current = null;
    };

    // Microphone unplugged / permission revoked: finalise what we have
    track.onended = () => {
      setError('Microphone disconnected. Recording stopped and your audio was kept.');
      if (recorder.state !== 'inactive') recorder.stop();
    };

    recorder.start(1000);
    setElapsed(0);
    setStatus('recording');
    startTimer();
    return true;
  }, [currentMs, startTimer, stopTimer, releaseTrack]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.pause();
      baseMsRef.current = currentMs();
      segmentStartRef.current = 0;
      stopTimer();
      setStatus('paused');
    }
  }, [currentMs, stopTimer]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'paused') {
      recorder.resume();
      startTimer();
      setStatus('recording');
    }
  }, [startTimer]);

  const stop = useCallback((): Promise<FinishedRecording | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return Promise.resolve(null);
    return new Promise((resolve) => {
      finishRef.current = resolve;
      recorder.stop();
    });
  }, []);

  // On unmount (e.g. leaving the page) finalise the file; the local backup stays recoverable.
  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      stopTimer();
    };
  }, [stopTimer]);

  return { status, elapsed, error, activeId: status === 'idle' ? '' : idRef.current, start, pause, resume, stop, clearError: () => setError(null) };
};
