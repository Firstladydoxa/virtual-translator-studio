// ========================================
// CARD TRANSLATION DASHBOARD
// Component: CardTranslationDashboard.tsx
// Main hub for card translation features
// ========================================

import React, { useState } from 'react';
import OnlineDesigners from './OnlineDesigners';
import CardScriptsList from './CardScriptsList';
import ApiKeyManagement from './ApiKeyManagement';
import './CardTranslationDashboard.css';

interface CardTranslationDashboardProps {
  token: string;
  userRole: string;
}

const CardTranslationDashboard: React.FC<CardTranslationDashboardProps> = ({ token, userRole }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scripts' | 'apikey' | 'designers'>('dashboard');

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isDesigner = userRole === 'designer';

  return (
    <div className="card-translation-dashboard">
      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Overview
        </button>
        {isAdmin && (
          <button
            className={`tab ${activeTab === 'designers' ? 'active' : ''}`}
            onClick={() => setActiveTab('designers')}
          >
            💻 Online Designers
          </button>
        )}
        <button
          className={`tab ${activeTab === 'scripts' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          📄 Card Scripts
        </button>
        {(isAdmin || isDesigner) && (
          <button
            className={`tab ${activeTab === 'apikey' ? 'active' : ''}`}
            onClick={() => setActiveTab('apikey')}
          >
            🔑 API Key
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="overview-section">
            <div className="welcome-card">
              <h1>🎨 Card Translation System</h1>
              <p className="subtitle">Zero-touch automation for Photoshop card designs</p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🖥️</div>
                <h3>CEP Panel</h3>
                <p>Photoshop extension with WebSocket connection for real-time automation</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Zero-Touch Export</h3>
                <p>Admins trigger exports remotely - designers don't click anything</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌍</div>
                <h3>Multi-Language</h3>
                <p>Translate card designs into any language with automatic layer updates</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔄</div>
                <h3>Auto-Import</h3>
                <p>Translations automatically applied to PSD files via remote commands</p>
              </div>
            </div>

            <div className="workflow-section">
              <h2>📖 Workflow</h2>
              <div className="workflow-steps">
                <div className="workflow-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Designer Setup</h4>
                    <p>Install CEP panel, generate API key, connect to backend</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Remote Export</h4>
                    <p>Admin triggers export, CEP panel auto-extracts text layers</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Translation</h4>
                    <p>Translators work on content in web app</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Auto-Import</h4>
                    <p>Admin triggers import, PSD layers updated automatically</p>
                  </div>
                </div>
              </div>
            </div>

            {isDesigner && (
              <div className="quick-action-card designer">
                <h3>👤 Designer Quick Actions</h3>
                <p>Get started with the Card Translation system:</p>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => setActiveTab('apikey')}>
                    🔑 Generate API Key
                  </button>
                  <a
                    href="https://github.com/Adobe-CEP/CEP-Resources"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn secondary"
                  >
                    📥 Download CEP Resources
                  </a>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="quick-action-card admin">
                <h3>👑 Admin Quick Actions</h3>
                <p>Manage card translation workflows:</p>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => setActiveTab('designers')}>
                    💻 View Online Designers
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('scripts')}>
                    📄 View Card Scripts
                  </button>
                </div>
              </div>
            )}

            <div className="documentation-links">
              <h3>📚 Documentation</h3>
              <ul>
                <li>
                  <a href="/CARD_TRANSLATION_QUICKSTART.md" target="_blank">
                    Quick Start Guide
                  </a>
                </li>
                <li>
                  <a href="/CARD_TRANSLATION_COMPLETE.md" target="_blank">
                    Complete Implementation Details
                  </a>
                </li>
                <li>
                  <a href="/card-translation-cep/build/README.md" target="_blank">
                    CEP Panel Build Instructions
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'designers' && isAdmin && (
          <OnlineDesigners token={token} />
        )}

        {activeTab === 'scripts' && (
          <CardScriptsList token={token} userRole={userRole} />
        )}

        {activeTab === 'apikey' && (isAdmin || isDesigner) && (
          <ApiKeyManagement token={token} userRole={userRole} />
        )}
      </div>
    </div>
  );
};

export default CardTranslationDashboard;
