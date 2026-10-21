import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useStreamRecorder, FinishedRecording } from '../hooks/useStreamRecorder';
import { recordingStore, LocalRecordingMeta } from '../services/recordingStore';
import { recordingService, ServerRecording } from '../services/recordingService';
import './RecordingControls.css';

interface RecordingControlsProps {
  getStream: () => MediaStream | null;
  language: string;
}

export const RECORDING_ENABLED = process.env.REACT_APP_RECORDING_ENABLED === 'true';

const formatTime = (total: number) => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const extensionFor = (mime: string) => (mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm');

const RecordingControls: React.FC<RecordingControlsProps> = ({ getStream, language }) => {
  const recorder = useStreamRecorder();
  const isNative = Capacitor.isNativePlatform();

  const [notice, setNotice] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [uploadingId, setUploadingId] = useState('');
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState<LocalRecordingMeta[]>([]);
  const [saved, setSaved] = useState<ServerRecording[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [player, setPlayer] = useState<{ id: string; url: string } | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (player) URL.revokeObjectURL(player.url);
    };
  }, [player]);

  const refreshPending = useCallback(async () => {
    try {
      const all = await recordingStore.list();
      if (mounted.current) setPending(all);
    } catch {
      if (mounted.current) setPending([]);
    }
  }, []);

  const refreshSaved = useCallback(async () => {
    try {
      const list = await recordingService.list();
      if (mounted.current) setSaved(list);
    } catch {
      if (mounted.current) setNotice({ text: 'Could not load your saved recordings.', type: 'error' });
    }
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    if (showSaved) refreshSaved();
  }, [showSaved, refreshSaved]);

  // Prevent accidental loss when closing the tab while recording
  useEffect(() => {
    if (recorder.status === 'idle') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [recorder.status]);

  const uploadBlob = async (id: string, blob: Blob, info: { durationSeconds: number; language: string; startedAt: number }) => {
    setUploadingId(id);
    setProgress(0);
    setNotice({ text: 'Saving your recording…', type: 'info' });
    try {
      await recordingService.upload(blob, info, setProgress);
      await recordingStore.remove(id).catch(() => undefined);
      if (!mounted.current) return;
      setNotice({ text: 'Recording saved successfully.', type: 'success' });
      if (showSaved) refreshSaved();
    } catch (e: any) {
      const serverMessage = e?.response?.data?.error;
      if (mounted.current) {
        setNotice({
          text: `${serverMessage || 'Upload failed.'} Your recording is kept on this device — you can retry below.`,
          type: 'error'
        });
      }
    } finally {
      if (mounted.current) setUploadingId('');
      refreshPending();
    }
  };

  const handleStart = async () => {
    setNotice(null);
    await recorder.start(getStream(), language);
    refreshPending();
  };

  const handleStop = async () => {
    const result: FinishedRecording | null = await recorder.stop();
    if (!result) {
      setNotice({ text: 'Nothing was recorded.', type: 'error' });
      return;
    }
    await uploadBlob(result.id, result.blob, result);
  };

  const handleRetry = async (meta: LocalRecordingMeta) => {
    const blob = await recordingStore.getBlob(meta.id);
    if (!blob) {
      setNotice({ text: 'This recording has no audio data and was removed.', type: 'error' });
      await recordingStore.remove(meta.id).catch(() => undefined);
      refreshPending();
      return;
    }
    await uploadBlob(meta.id, blob, meta);
  };

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleDownloadLocal = async (meta: LocalRecordingMeta) => {
    const blob = await recordingStore.getBlob(meta.id);
    if (blob) triggerDownload(blob, `recording-${new Date(meta.startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${extensionFor(meta.mimeType)}`);
  };

  const handleDiscardLocal = async (meta: LocalRecordingMeta) => {
    if (!window.confirm('Discard this unsaved recording? This cannot be undone.')) return;
    await recordingStore.remove(meta.id).catch(() => undefined);
    refreshPending();
  };

  const handlePlay = async (rec: ServerRecording) => {
    if (player?.id === rec.id) {
      setPlayer(null);
      return;
    }
    try {
      const blob = await recordingService.download(rec.id);
      setPlayer({ id: rec.id, url: URL.createObjectURL(blob) });
    } catch {
      setNotice({ text: 'Could not load this recording.', type: 'error' });
    }
  };

  const handleDownloadSaved = async (rec: ServerRecording) => {
    try {
      const blob = await recordingService.download(rec.id);
      triggerDownload(blob, `recording-${rec.createdAt.slice(0, 19).replace(/[:T]/g, '-')}.${extensionFor(rec.mimeType)}`);
    } catch {
      setNotice({ text: 'Could not download this recording.', type: 'error' });
    }
  };

  const handleDeleteSaved = async (rec: ServerRecording) => {
    if (!window.confirm('Delete this recording permanently?')) return;
    try {
      await recordingService.remove(rec.id);
      if (player?.id === rec.id) setPlayer(null);
      refreshSaved();
    } catch {
      setNotice({ text: 'Could not delete this recording.', type: 'error' });
    }
  };

  const busy = recorder.status !== 'idle';
  const unsaved = pending.filter((p) => p.id !== recorder.activeId && p.id !== uploadingId);

  return (
    <div className="recording-controls">
      <h3>My Recording</h3>
      <p className="recording-hint">Record your voice while translating. Independent from the live stream.</p>

      {busy ? (
        <div className="recording-active">
          <div className={`recording-indicator ${recorder.status === 'paused' ? 'paused' : ''}`}>
            <span className="recording-dot" />
            <span className="recording-time">{formatTime(recorder.elapsed)}</span>
            <span className="recording-state">{recorder.status === 'paused' ? 'Paused' : 'Recording'}</span>
          </div>
          <div className="recording-buttons">
            {recorder.status === 'recording' ? (
              <button className="rec-btn rec-btn-secondary" onClick={recorder.pause}>Pause</button>
            ) : (
              <button className="rec-btn rec-btn-secondary" onClick={recorder.resume}>Resume</button>
            )}
            <button className="rec-btn rec-btn-stop" onClick={handleStop}>Stop &amp; Save</button>
          </div>
        </div>
      ) : (
        <button className="rec-btn rec-btn-start" onClick={handleStart} disabled={!!uploadingId}>
          <span className="recording-dot" /> Start Recording
        </button>
      )}

      {uploadingId && (
        <div className="recording-progress" role="progressbar" aria-valuenow={progress}>
          <div className="recording-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      {(recorder.error || notice) && (
        <div className={`recording-notice ${recorder.error ? 'error' : notice!.type}`}>
          {recorder.error || notice!.text}
        </div>
      )}

      {unsaved.length > 0 && (
        <div className="recording-list">
          <h4>Unsaved recordings on this device</h4>
          {unsaved.map((rec) => (
            <div key={rec.id} className="recording-item">
              <div className="recording-item-info">
                {new Date(rec.startedAt).toLocaleString()} · {formatTime(rec.durationSeconds)}
              </div>
              <div className="recording-item-actions">
                <button onClick={() => handleRetry(rec)} disabled={!!uploadingId || busy}>Upload</button>
                {!isNative && <button onClick={() => handleDownloadLocal(rec)}>Download</button>}
                <button className="danger" onClick={() => handleDiscardLocal(rec)}>Discard</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="recording-toggle" onClick={() => setShowSaved((v) => !v)}>
        {showSaved ? 'Hide' : 'Show'} my saved recordings
      </button>

      {showSaved && (
        <div className="recording-list">
          {saved.length === 0 && <div className="recording-empty">No saved recordings yet.</div>}
          {saved.map((rec) => (
            <div key={rec.id} className="recording-item">
              <div className="recording-item-info">
                {new Date(rec.createdAt).toLocaleString()} · {formatTime(rec.durationSeconds)} · {formatSize(rec.sizeBytes)}
                {rec.language ? ` · ${rec.language}` : ''}
              </div>
              <div className="recording-item-actions">
                <button onClick={() => handlePlay(rec)}>{player?.id === rec.id ? 'Close' : 'Play'}</button>
                {!isNative && <button onClick={() => handleDownloadSaved(rec)}>Download</button>}
                <button className="danger" onClick={() => handleDeleteSaved(rec)}>Delete</button>
              </div>
              {player?.id === rec.id && <audio className="recording-player" src={player.url} controls autoPlay />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
