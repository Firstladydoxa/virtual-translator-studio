// ========================================
// ONLINE DESIGNERS DASHBOARD
// Component: OnlineDesigners.tsx
// Shows connected CEP panels and triggers
// ========================================

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './OnlineDesigners.css';

interface Designer {
  userId: string;
  name: string;
  role: string;
  documentName: string | null;
  hasDocument: boolean;
  connectedAt: string;
}

interface OnlineDesignersProps {
  token: string;
}

const OnlineDesigners: React.FC<OnlineDesignersProps> = ({ token }) => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringExport, setTriggeringExport] = useState<string | null>(null);
  const [triggeringImport, setTriggeringImport] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const API_URL = 'https://ministryprogs.tniglobal.org';

  // Fetch online designers
  const fetchDesigners = async () => {
    try {
      const response = await fetch(`${API_URL}/api/card-translation/designers/online`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDesigners(data.designers);
      } else {
        showMessage('Failed to load designers', 'error');
      }
    } catch (error) {
      console.error('Error fetching designers:', error);
      showMessage('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Setup Socket.io for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchDesigners();

    // Setup Socket.io connection
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✓ Connected to backend via Socket.io');
    });

    // Real-time designer status updates
    newSocket.on('designer:status', (data) => {
      console.log('Designer status update:', data);

      setDesigners(prev => {
        if (data.online) {
          // Add or update designer
          const exists = prev.find(d => d.userId === data.userId);
          if (exists) {
            return prev.map(d => d.userId === data.userId ? { ...d, ...data } : d);
          } else {
            return [...prev, data as Designer];
          }
        } else {
          // Remove designer
          return prev.filter(d => d.userId !== data.userId);
        }
      });
    });

    // Export complete notification
    newSocket.on('designer:export-complete', (data) => {
      console.log('Export complete:', data);
      showMessage(
        `✓ ${data.name} exported "${data.title}" (${data.layersFound} layers)`,
        'success'
      );
      setTriggeringExport(null);
    });

    // Export error notification
    newSocket.on('designer:export-error', (data) => {
      console.log('Export error:', data);
      showMessage(`✗ Export failed for ${data.name}: ${data.error}`, 'error');
      setTriggeringExport(null);
    });

    // Import complete notification
    newSocket.on('designer:import-complete', (data) => {
      console.log('Import complete:', data);
      showMessage(
        `✓ ${data.name} imported ${data.language.toUpperCase()} (${data.layersUpdated} layers)`,
        'success'
      );
      setTriggeringImport(null);
    });

    // Import error notification
    newSocket.on('designer:import-error', (data) => {
      console.log('Import error:', data);
      showMessage(`✗ Import failed for ${data.name}: ${data.error}`, 'error');
      setTriggeringImport(null);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [token]);

  // Trigger export on designer's CEP panel
  const triggerExport = async (designerId: string, designerName: string) => {
    setTriggeringExport(designerId);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/card-translation/trigger-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ designerId })
      });

      const data = await response.json();

      if (data.success) {
        showMessage(`📤 Export command sent to ${designerName}`, 'info');
      } else {
        showMessage(data.error || 'Failed to trigger export', 'error');
        setTriggeringExport(null);
      }
    } catch (error) {
      console.error('Error triggering export:', error);
      showMessage('Network error', 'error');
      setTriggeringExport(null);
    }
  };

  // Trigger import on designer's CEP panel
  const triggerImport = async (designerId: string, designerName: string) => {
    const scriptId = prompt('Enter Script ID:');
    if (!scriptId) return;

    const language = prompt('Enter language code (e.g., de, fr, es):');
    if (!language) return;

    setTriggeringImport(designerId);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/card-translation/trigger-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ designerId, scriptId, language })
      });

      const data = await response.json();

      if (data.success) {
        showMessage(`📥 Import command sent to ${designerName}`, 'info');
      } else {
        showMessage(data.error || 'Failed to trigger import', 'error');
        setTriggeringImport(null);
      }
    } catch (error) {
      console.error('Error triggering import:', error);
      showMessage('Network error', 'error');
      setTriggeringImport(null);
    }
  };

  // Show message helper
  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="online-designers">
        <div className="loading">Loading designers...</div>
      </div>
    );
  }

  return (
    <div className="online-designers">
      <div className="header">
        <h2>Online Designers</h2>
        <div className="status">
          <span className="led online"></span>
          <span>{designers.length} connected</span>
        </div>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {designers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💻</div>
          <p>No designers connected</p>
          <small>Designers must open the CEP panel in Photoshop</small>
        </div>
      ) : (
        <div className="designers-grid">
          {designers.map(designer => (
            <div key={designer.userId} className="designer-card">
              <div className="designer-header">
                <div className="designer-info">
                  <h3>{designer.name}</h3>
                  <span className="role-badge">{designer.role}</span>
                </div>
                <span className="led online pulse"></span>
              </div>

              <div className="designer-details">
                <div className="detail-row">
                  <span className="label">Document:</span>
                  <span className="value">
                    {designer.hasDocument ? (
                      <strong>{designer.documentName}</strong>
                    ) : (
                      <em>None open</em>
                    )}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Connected:</span>
                  <span className="value">
                    {new Date(designer.connectedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="designer-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => triggerExport(designer.userId, designer.name)}
                  disabled={!designer.hasDocument || triggeringExport === designer.userId}
                >
                  {triggeringExport === designer.userId ? (
                    <>⏳ Exporting...</>
                  ) : (
                    <>📤 Request Export</>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => triggerImport(designer.userId, designer.name)}
                  disabled={!designer.hasDocument || triggeringImport === designer.userId}
                >
                  {triggeringImport === designer.userId ? (
                    <>⏳ Importing...</>
                  ) : (
                    <>📥 Trigger Import</>
                  )}
                </button>
              </div>

              {!designer.hasDocument && (
                <div className="warning">
                  ⚠️ Designer must open a Photoshop document first
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="info-panel">
        <h3>How It Works</h3>
        <ol>
          <li>Designer opens Photoshop and activates CEP panel (Window → Extensions → Card Translation)</li>
          <li>Designer enters API key and connects to backend</li>
          <li>Designer opens a PSD document with text layers</li>
          <li>Admin clicks "Request Export" to extract text layers remotely</li>
          <li>Translators translate the content in web app</li>
          <li>Admin clicks "Trigger Import" to update PSD with translations</li>
        </ol>
      </div>
    </div>
  );
};

export default OnlineDesigners;
