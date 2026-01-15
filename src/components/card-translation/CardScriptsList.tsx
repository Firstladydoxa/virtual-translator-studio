// ========================================
// CARD SCRIPTS MANAGEMENT
// Component: CardScriptsList.tsx
// Admin/Translator view of all card scripts
// ========================================

import React, { useState, useEffect } from 'react';
import './CardScriptsList.css';

interface CardScript {
  _id: string;
  title: string;
  description: string;
  englishContent: Array<{
    key: string;
    text: string;
    order: number;
  }>;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  metadata?: {
    psdFilename?: string;
    layerCount?: number;
  };
}

interface CardScriptsListProps {
  token: string;
  userRole: string;
}

const CardScriptsList: React.FC<CardScriptsListProps> = ({ token, userRole }) => {
  const [scripts, setScripts] = useState<CardScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<CardScript | null>(null);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/card-translation/scripts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setScripts(data.scripts);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffa726';
      case 'in_progress': return '#42a5f5';
      case 'completed': return '#66bb6a';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return <div className="card-scripts-loading">Loading scripts...</div>;
  }

  return (
    <div className="card-scripts-list">
      <div className="header">
        <h2>Card Scripts</h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{scripts.length}</span>
            <span className="stat-label">Total Scripts</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {scripts.filter(s => s.status === 'pending').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {scripts.filter(s => s.status === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {scripts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <p>No card scripts yet</p>
          <small>Scripts will appear here when designers export from Photoshop</small>
        </div>
      ) : (
        <div className="scripts-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Layers</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map(script => (
                <tr key={script._id}>
                  <td>
                    <div className="script-title">
                      {script.title}
                      {script.metadata?.psdFilename && (
                        <small>{script.metadata.psdFilename}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="layer-count">
                      {script.englishContent.length}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(script.status) }}
                    >
                      {getStatusLabel(script.status)}
                    </span>
                  </td>
                  <td>{script.createdBy.name}</td>
                  <td>{new Date(script.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-view"
                      onClick={() => setSelectedScript(script)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedScript && (
        <div className="modal-overlay" onClick={() => setSelectedScript(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedScript.title}</h3>
              <button className="modal-close" onClick={() => setSelectedScript(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="script-details">
                <p><strong>Description:</strong> {selectedScript.description}</p>
                <p><strong>Status:</strong> {getStatusLabel(selectedScript.status)}</p>
                <p><strong>Created by:</strong> {selectedScript.createdBy.name}</p>
                <p><strong>Created:</strong> {new Date(selectedScript.createdAt).toLocaleString()}</p>
              </div>
              <div className="content-preview">
                <h4>Text Layers ({selectedScript.englishContent.length})</h4>
                <div className="layers-list">
                  {selectedScript.englishContent.map((item, index) => (
                    <div key={index} className="layer-item">
                      <div className="layer-key">{item.key}</div>
                      <div className="layer-text">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardScriptsList;
