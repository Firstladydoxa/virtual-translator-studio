import React, { useState, useEffect } from 'react';
import './ManageSourceLink.css';

const ManageSourceLink: React.FC = () => {
  const [sourceVideoUrl, setSourceVideoUrl] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUrl();
  }, []);

  const fetchCurrentUrl = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://ministryprogs.tniglobal.org/api/settings/source-video-url', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch source video URL');
      }

      const data = await response.json();
      setSourceVideoUrl(data.sourceVideoUrl);
      setNewUrl(data.sourceVideoUrl);
      
      if (data.updatedAt) {
        setLastUpdated(new Date(data.updatedAt).toLocaleString());
      }
    } catch (error: any) {
      console.error('Error fetching source video URL:', error);
      showMessage('Failed to load current source video URL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newUrl.trim()) {
      showMessage('Please enter a valid URL', 'error');
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl);
    } catch (error) {
      showMessage('Please enter a valid URL format', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://ministryprogs.tniglobal.org/api/settings/source-video-url', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sourceVideoUrl: newUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update source video URL');
      }

      setSourceVideoUrl(data.sourceVideoUrl);
      setLastUpdated(new Date().toLocaleString());
      showMessage('Source video URL updated successfully! Changes will take effect immediately.', 'success');
    } catch (error: any) {
      console.error('Error updating source video URL:', error);
      showMessage(error.message || 'Failed to update source video URL', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNewUrl(sourceVideoUrl);
    showMessage('Changes discarded', 'info');
  };

  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const isUrlChanged = newUrl !== sourceVideoUrl;

  if (loading) {
    return (
      <div className="manage-source-link">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-source-link">
      <div className="page-header">
        <h1>🔗 Manage Source Link</h1>
        <p className="page-subtitle">Configure the source video URL for the translation studio</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="content-card">
        <div className="info-section">
          <h2>Current Configuration</h2>
          <div className="info-box">
            <div className="info-item">
              <label>Current Source Video URL:</label>
              <div className="current-url">{sourceVideoUrl}</div>
            </div>
            {lastUpdated && (
              <div className="info-item">
                <label>Last Updated:</label>
                <div className="last-updated">{lastUpdated}</div>
              </div>
            )}
          </div>
        </div>

        <div className="edit-section">
          <h2>Update Source Video URL</h2>
          <div className="form-group">
            <label htmlFor="sourceUrl">New Source Video URL:</label>
            <input
              id="sourceUrl"
              type="url"
              className="url-input"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/video/playlist.m3u8"
              disabled={saving}
            />
            <small className="help-text">
              Enter the complete URL including protocol (http:// or https://)
            </small>
          </div>

          <div className="button-group">
            <button
              onClick={handleSave}
              disabled={!isUrlChanged || saving}
              className={`btn-save ${isUrlChanged ? 'active' : ''}`}
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
            <button
              onClick={handleReset}
              disabled={!isUrlChanged || saving}
              className="btn-reset"
            >
              ↺ Discard Changes
            </button>
          </div>
        </div>

        <div className="usage-info">
          <h3>📌 Important Information</h3>
          <ul>
            <li>This URL will be used as the source video in the Translation Studio</li>
            <li>Changes take effect immediately for all translators</li>
            <li>Only admins and superadmins can modify this setting</li>
            <li>The URL should point to a valid HLS stream (.m3u8 file)</li>
            <li>Make sure the stream is accessible and working before saving</li>
          </ul>
        </div>

        <div className="test-section">
          <h3>🧪 Test Video Preview</h3>
          <p>Preview the video before saving:</p>
          <div className="video-preview">
            <video
              controls
              src={newUrl}
              className="preview-player"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSourceLink;
