import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import './MonitorLive.css';

interface Translator {
  id: string;
  fullname: string;
  language: string;
  country: string;
  profileImage?: string;
  isConnected: boolean;
  isTranslating: boolean;
  startedAt?: string;
}

type FilterStatus = 'all' | 'connected' | 'translating';

const MonitorLive: React.FC = () => {
  const { user } = useAppStore();
  const [translators, setTranslators] = useState<Translator[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTranslators();
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchActiveTranslators, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTranslators = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ministryprogs.tniglobal.org/webrtc/active-translators', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Use data from backend instead of mock
        setTranslators(data.translators || []);
      }
    } catch (error) {
      console.error('Error fetching translators:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="monitor-live">
        <h2>🔴 Live Translators Monitor</h2>
        <div className="loading">Loading active translators...</div>
      </div>
    );
  }

  const filteredTranslators = translators.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'connected') return t.isConnected || t.isTranslating;
    if (filter === 'translating') return t.isTranslating;
    return true;
  });

  // Translators who are translating are also connected
  const connectedCount = translators.filter(t => t.isConnected || t.isTranslating).length;
  const translatingCount = translators.filter(t => t.isTranslating).length;

  return (
    <div className="monitor-live">
      <div className="monitor-header">
        <h2>🔴 Live Translators Monitor</h2>
        <p className="subtitle">Real-time view of all active translation sessions</p>
        
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({translators.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'connected' ? 'active' : ''}`}
            onClick={() => setFilter('connected')}
          >
            🟢 Connected ({connectedCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'translating' ? 'active' : ''}`}
            onClick={() => setFilter('translating')}
          >
            🔴 Live Translating ({translatingCount})
          </button>
        </div>
        
        <div className="stats">
          <span className="stat-badge">
            <span className="pulse-dot"></span>
            {translatingCount} Connected and actively Translating
          </span>
          <span className="stat-badge-secondary">
            {connectedCount} Connected
          </span>
        </div>
      </div>

      {filteredTranslators.length === 0 ? (
        <div className="no-translators">
          <div className="no-translators-icon">📡</div>
          <h3>No {filter === 'translating' ? 'Active' : filter === 'connected' ? 'Connected' : 'Active'} Translators</h3>
          <p>There are currently no {filter === 'translating' ? 'live translation sessions' : filter === 'connected' ? 'connected translators' : 'translators online'}.</p>
          <p className="hint">{filter === 'all' ? 'Translators will appear here when they log in or start streaming.' : filter === 'connected' ? 'Translators will appear when they log in to the app.' : 'Translators will appear when they start translating.'}</p>
        </div>
      ) : (
        <div className="translators-grid">
          {filteredTranslators.map((translator) => (
            <div key={translator.id} className="translator-card">
              <div className="status-badges">
                {translator.isConnected && (
                  <div className="badge-connected">
                    <span className="badge-dot green"></span>
                    Connected
                  </div>
                )}
                {translator.isTranslating && (
                  <div className="badge-translating">
                    <span className="badge-dot red pulse"></span>
                    Live Translating
                  </div>
                )}
              </div>
              
              <div className="translator-image">
                {translator.profileImage ? (
                  <img src={translator.profileImage} alt={translator.fullname} />
                ) : (
                  <div 
                    className="translator-avatar"
                    style={{ backgroundColor: getAvatarColor(translator.fullname) }}
                  >
                    {getInitials(translator.fullname)}
                  </div>
                )}
              </div>

              <div className="translator-info">
                <h3 className="translator-name">{translator.fullname}</h3>
                <div className="translator-details">
                  <div className="detail-item">
                    <span className="detail-icon">🌐</span>
                    <span className="detail-text">{translator.language}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">{translator.country}</span>
                  </div>
                </div>
                {translator.startedAt && (
                  <div className="streaming-time">
                    Started: {new Date(translator.startedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button 
                  className="btn-watch"
                  onClick={() => {
                    // Navigate to watch page with translator's stream
                    window.open(`/watch/${translator.id}`, '_blank');
                  }}
                  title="Watch this translator's stream"
                >
                  <span>👁️</span> Watch Stream
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitorLive;
