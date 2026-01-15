// ========================================
// API KEY MANAGEMENT FOR DESIGNERS
// Component: ApiKeyManagement.tsx
// Allow designers to generate/view/revoke API keys
// ========================================

import React, { useState, useEffect } from 'react';
import './ApiKeyManagement.css';

interface ApiKeyManagementProps {
  token: string;
  userRole: string;
}

const ApiKeyManagement: React.FC<ApiKeyManagementProps> = ({ token, userRole }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showKey, setShowKey] = useState(false);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    // For now, we'll just set loading to false
    // In production, you'd fetch the user's existing API key status
    setLoading(false);
  };

  const generateApiKey = async () => {
    setGenerating(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/card-translation/generate-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setApiKey(data.apiKey);
        setShowKey(true);
        setMessage({ text: '✓ API key generated successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to generate API key', type: 'error' });
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const revokeApiKey = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to revoke your API key? This will disconnect your CEP panel.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/card-translation/revoke-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setApiKey(null);
        setShowKey(false);
        setMessage({ text: '✓ API key revoked successfully', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to revoke API key', type: 'error' });
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setMessage({ text: '✓ API key copied to clipboard!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="api-key-loading">Loading...</div>;
  }

  // Only allow designers and admins
  if (userRole !== 'designer' && userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="api-key-management">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only designers can generate API keys for the CEP panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-key-management">
      <div className="header">
        <h2>🔑 API Key Management</h2>
        <p className="subtitle">Manage your API key for Photoshop CEP panel connection</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="api-key-section">
        {!apiKey ? (
          <div className="no-key-state">
            <div className="icon">🔓</div>
            <h3>No API Key</h3>
            <p>Generate an API key to connect your Photoshop CEP panel to the backend.</p>
            <button
              className="btn-generate"
              onClick={generateApiKey}
              disabled={generating}
            >
              {generating ? '⏳ Generating...' : '🔑 Generate API Key'}
            </button>
          </div>
        ) : (
          <div className="key-display">
            <h3>Your API Key</h3>
            <div className="key-container">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                className="key-input"
              />
              <button className="btn-toggle" onClick={() => setShowKey(!showKey)}>
                {showKey ? '🙈' : '👁️'}
              </button>
              <button className="btn-copy" onClick={copyToClipboard}>
                📋 Copy
              </button>
            </div>
            <div className="key-actions">
              <button className="btn-revoke" onClick={revokeApiKey}>
                🗑️ Revoke Key
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="instructions">
        <h3>📖 How to Use Your API Key</h3>
        <ol>
          <li>
            <strong>Install CEP Panel:</strong> Install the Card Translation extension in Photoshop
            <ul>
              <li>Download from admin or build from source</li>
              <li>Enable debug mode in Photoshop</li>
              <li>Restart Photoshop</li>
            </ul>
          </li>
          <li>
            <strong>Open Panel:</strong> Window → Extensions → Card Translation
          </li>
          <li>
            <strong>Enter API Key:</strong> Paste your API key in the panel
          </li>
          <li>
            <strong>Connect:</strong> Click "Connect" button
          </li>
          <li>
            <strong>Start Working:</strong> Open a PSD file and the panel will auto-connect
          </li>
        </ol>
      </div>

      <div className="security-notice">
        <h4>🔒 Security Notice</h4>
        <p>
          • Keep your API key secure - don't share it with others<br/>
          • Your API key is stored securely on the server<br/>
          • Revoke your key immediately if compromised<br/>
          • Generate a new key if needed at any time
        </p>
      </div>
    </div>
  );
};

export default ApiKeyManagement;
