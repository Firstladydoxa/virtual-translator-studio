import React, { useCallback, useEffect, useRef, useState } from 'react';
import { recordingService, ServerRecording, AdminRecordingList } from '../services/recordingService';
import './AdminRecordings.css';

const PAGE_SIZE = 20;

const formatDuration = (total: number) => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 * 1024
    ? `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
    : bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const formatLanguage = (text: string) =>
  text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const extensionFor = (mime: string) => (mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm');
const safeName = (text: string) => text.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';

const AdminRecordings: React.FC = () => {
  const [data, setData] = useState<AdminRecordingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busyId, setBusyId] = useState('');
  const [player, setPlayer] = useState<{ id: string; url: string } | null>(null);
  const requestRef = useRef(0);

  // Debounce the translator search so we don't query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError('');
    try {
      const result = await recordingService.adminList({ page, limit: PAGE_SIZE, q: query, language, from, to });
      if (requestId !== requestRef.current) return;
      setData(result);
    } catch (e: any) {
      if (requestId !== requestRef.current) return;
      setError(e?.response?.status === 403 ? 'You do not have permission to view recordings.' : 'Could not load recordings.');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [page, query, language, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (player) URL.revokeObjectURL(player.url);
    };
  }, [player]);

  const showNotice = (text: string, type: 'success' | 'error') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const handlePlay = async (rec: ServerRecording) => {
    if (player?.id === rec.id) {
      setPlayer(null);
      return;
    }
    setBusyId(rec.id);
    try {
      const blob = await recordingService.download(rec.id);
      setPlayer({ id: rec.id, url: URL.createObjectURL(blob) });
    } catch {
      showNotice('Could not load this recording.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleDownload = async (rec: ServerRecording) => {
    setBusyId(rec.id);
    try {
      const blob = await recordingService.download(rec.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName(rec.translatorName || '')}_${safeName(formatLanguage(rec.languageLabel || rec.language))}_${rec.createdAt.slice(0, 19).replace(/[:T]/g, '-')}.${extensionFor(rec.mimeType)}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      showNotice('Could not download this recording.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (rec: ServerRecording) => {
    const who = rec.translatorName || 'this translator';
    if (!window.confirm(`Permanently delete the recording of ${who} from ${new Date(rec.createdAt).toLocaleString()}? This cannot be undone.`)) return;
    setBusyId(rec.id);
    try {
      await recordingService.remove(rec.id);
      if (player?.id === rec.id) setPlayer(null);
      showNotice('Recording deleted.', 'success');
      // Step back a page if we just removed the last item of the current one
      if (data && data.recordings.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch {
      showNotice('Could not delete this recording.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setQuery('');
    setLanguage('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasFilters = !!(search || language || from || to);

  return (
    <div className="admin-recordings">
      {notice && <div className={`admin-rec-notice ${notice.type}`}>{notice.text}</div>}

      <div className="admin-rec-summary">
        <div className="admin-rec-stat">
          <span className="admin-rec-stat-value">{data ? data.total : '–'}</span>
          <span className="admin-rec-stat-label">Recordings</span>
        </div>
        <div className="admin-rec-stat">
          <span className="admin-rec-stat-value">{data ? formatDuration(data.totalDurationSeconds) : '–'}</span>
          <span className="admin-rec-stat-label">Total duration</span>
        </div>
        <div className="admin-rec-stat">
          <span className="admin-rec-stat-value">{data ? formatSize(data.totalSizeBytes) : '–'}</span>
          <span className="admin-rec-stat-label">Total size</span>
        </div>
      </div>

      <div className="admin-rec-filters">
        <input
          type="search"
          placeholder="Search translator name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search translator"
        />
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by language"
        >
          <option value="">All languages</option>
          {(data?.languages || []).map((l) => (
            <option key={l} value={l}>{formatLanguage(l)}</option>
          ))}
        </select>
        <label>
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </label>
        <label>
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </label>
        {hasFilters && <button className="admin-rec-reset" onClick={resetFilters}>Clear filters</button>}
      </div>

      {error && <div className="admin-rec-notice error">{error} <button onClick={load}>Retry</button></div>}

      <div className="admin-rec-table-wrap">
        <table className="admin-rec-table">
          <thead>
            <tr>
              <th>Translator</th>
              <th>Language</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr><td colSpan={6} className="admin-rec-empty">Loading recordings…</td></tr>
            )}
            {data && data.recordings.length === 0 && !loading && (
              <tr><td colSpan={6} className="admin-rec-empty">{hasFilters ? 'No recordings match your filters.' : 'No recordings yet.'}</td></tr>
            )}
            {data?.recordings.map((rec) => (
              <React.Fragment key={rec.id}>
                <tr className={busyId === rec.id ? 'busy' : ''}>
                  <td data-label="Translator">{rec.translatorName}</td>
                  <td data-label="Language">{formatLanguage(rec.languageLabel || rec.language || '—')}</td>
                  <td data-label="Date">{new Date(rec.createdAt).toLocaleString()}</td>
                  <td data-label="Duration">{formatDuration(rec.durationSeconds)}</td>
                  <td data-label="Size">{formatSize(rec.sizeBytes)}</td>
                  <td data-label="Actions" className="admin-rec-actions">
                    <button onClick={() => handlePlay(rec)} disabled={busyId === rec.id}>
                      {player?.id === rec.id ? '⏹ Close' : '▶ Play'}
                    </button>
                    <button onClick={() => handleDownload(rec)} disabled={busyId === rec.id}>⬇ Download</button>
                    <button className="danger" onClick={() => handleDelete(rec)} disabled={busyId === rec.id}>🗑 Delete</button>
                  </td>
                </tr>
                {player?.id === rec.id && (
                  <tr className="admin-rec-player-row">
                    <td colSpan={6}>
                      <audio src={player.url} controls autoPlay />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="admin-rec-pagination">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1 || loading}>‹ Previous</button>
          <span>Page {data.page} of {data.pages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= data.pages || loading}>Next ›</button>
        </div>
      )}
    </div>
  );
};

export default AdminRecordings;
