import React from 'react';
import '../styles/Home.css';

const Home: React.FC = () => {
  return (
    <div className="about-container">

      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="about-hero-content">
          <div className="about-hero-badge">🌍 Multilingual Broadcasting Platform</div>
          <h1 className="about-hero-title">
            Translate Live.<br />
            <span className="about-hero-accent">From Anywhere.</span>
          </h1>
          <p className="about-hero-subtitle">
            Loveworld Translators Virtual Studio puts a professional broadcast translation
            workspace in your pocket — works on any device, any browser, no download required.
          </p>
          <div className="about-hero-pills">
            <span className="about-pill">🎙️ Real-time Audio</span>
            <span className="about-pill">📡 Live Streaming</span>
            <span className="about-pill">📱 Mobile Ready</span>
            <span className="about-pill">🔒 Secure</span>
          </div>
        </div>
      </section>

      {/* ── STUDIOS ── */}
      <section className="about-section">
        <div className="about-section-header">
          <h2>Your Studios</h2>
          <p>Everything you need to deliver flawless live translation</p>
        </div>
        <div className="studios-grid">

          <div className="studio-card studio-card--purple">
            <div className="studio-card-icon">🎚️</div>
            <h3>Audio Mix Studio</h3>
            <p>
              Go live in seconds. Connect your microphone, choose your language and start
              broadcasting. Three professional mixing modes let you blend your voice with the
              original source audio — effortlessly.
            </p>
            <ul className="studio-card-list">
              <li>✦ Translation Only — your voice front and center</li>
              <li>✦ Mix Mode — blend source + translation at your ratio</li>
              <li>✦ Source Only — pass original audio through untouched</li>
            </ul>
            <div className="studio-card-tag">Primary Studio</div>
          </div>

          <div className="studio-card studio-card--blue">
            <div className="studio-card-icon">🔄</div>
            <h3>Pivot Translation Studio</h3>
            <p>
              Translate from a relay language. Tune in to a French, Spanish, German, Hindi
              or English feed and broadcast your interpretation simultaneously — source volume
              and mic output controlled independently.
            </p>
            <ul className="studio-card-list">
              <li>✦ Built-in relay video player</li>
              <li>✦ Independent volume for monitor &amp; mic</li>
              <li>✦ Real-time relay switching</li>
            </ul>
            <div className="studio-card-tag">Relay Studio</div>
          </div>

          <div className="studio-card studio-card--teal">
            <div className="studio-card-icon">🤟</div>
            <h3>Sign Language Studio</h3>
            <p>
              A split-screen workspace built for sign language interpreters. Your source feed
              on the left, your camera on the right — both composited into a single broadcast
              stream, live.
            </p>
            <ul className="studio-card-list">
              <li>✦ Split-screen composite broadcast</li>
              <li>✦ Mirror mode for natural self-view</li>
              <li>✦ Multi-camera selection</li>
            </ul>
            <div className="studio-card-tag">Sign Studio</div>
          </div>

          <div className="studio-card studio-card--pink">
            <div className="studio-card-icon">📡</div>
            <h3>Monitor Live</h3>
            <p>
              A real-time command centre for supervisors. Every active translation channel
              on one screen — watch streams, verify quality and confirm all languages are on
              air before and during events.
            </p>
            <ul className="studio-card-list">
              <li>✦ All channels at a glance</li>
              <li>✦ 🟢 🟡 🔴 live status per translator</li>
              <li>✦ Watch any stream directly in-browser</li>
            </ul>
            <div className="studio-card-tag">Supervision</div>
          </div>

        </div>
      </section>

      {/* ── STATUS INDICATOR EXPLAINER ── */}
      <section className="about-status-section">
        <div className="about-section-header">
          <h2>Always Know Who's On Air</h2>
          <p>Colour-coded status visible across every screen in real time</p>
        </div>
        <div className="status-row">
          <div className="status-item status-item--green">
            <span className="status-dot" />
            <div>
              <strong>Online &amp; Broadcasting</strong>
              <span>Translator is live and actively streaming</span>
            </div>
          </div>
          <div className="status-item status-item--yellow">
            <span className="status-dot" />
            <div>
              <strong>Connected — Standby</strong>
              <span>Logged in but not yet broadcasting</span>
            </div>
          </div>
          <div className="status-item status-item--red">
            <span className="status-dot" />
            <div>
              <strong>Offline</strong>
              <span>Translator has disconnected</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="about-section about-section--alt">
        <div className="about-section-header">
          <h2>Built for Translators on the Move</h2>
          <p>No studio? No problem.</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-tile">
            <div className="benefit-tile-icon">📱</div>
            <h4>Any Device</h4>
            <p>Phone, tablet, laptop — the studio adapts to your screen with a fully responsive interface.</p>
          </div>
          <div className="benefit-tile">
            <div className="benefit-tile-icon">🌐</div>
            <h4>Any Browser</h4>
            <p>Chrome, Edge, Firefox, Safari — no plugins, no app stores, nothing to install.</p>
          </div>
          <div className="benefit-tile">
            <div className="benefit-tile-icon">🏠</div>
            <h4>From Anywhere</h4>
            <p>Home, office, behind the scenes at a crusade — as long as you have internet you're ready.</p>
          </div>
          <div className="benefit-tile">
            <div className="benefit-tile-icon">⚡</div>
            <h4>Ultra-Low Latency</h4>
            <p>Advanced real-time streaming delivers sub-second audio so your translation stays perfectly in sync.</p>
          </div>
          <div className="benefit-tile">
            <div className="benefit-tile-icon">🔔</div>
            <h4>Push Notifications</h4>
            <p>Get notified of session starts, schedule changes and admin alerts — even when the tab is closed.</p>
          </div>
          <div className="benefit-tile">
            <div className="benefit-tile-icon">⏱️</div>
            <h4>Automatic Time Tracking</h4>
            <p>Session duration is logged automatically the moment you go live — no manual timesheets.</p>
          </div>
        </div>
      </section>

      {/* ── QUICK START ── */}
      <section className="about-section">
        <div className="about-section-header">
          <h2>Up &amp; Running in 3 Steps</h2>
          <p>Start translating in under a minute</p>
        </div>
        <div className="steps-row">
          <div className="step-tile">
            <div className="step-tile-num">1</div>
            <h4>Open the Menu</h4>
            <p>Tap ☰ in the top bar and choose your studio from the sidebar.</p>
          </div>
          <div className="step-tile-arrow">→</div>
          <div className="step-tile">
            <div className="step-tile-num">2</div>
            <h4>Allow Microphone</h4>
            <p>Your browser will ask for mic access — tap Allow once and you're set.</p>
          </div>
          <div className="step-tile-arrow">→</div>
          <div className="step-tile">
            <div className="step-tile-num">3</div>
            <h4>Go Live</h4>
            <p>Click <strong>Go Live</strong> and start translating to the world.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="about-footer-cta">
        <h2>Ready to Translate?</h2>
        <p>Open the menu and launch your studio — your audience is waiting.</p>
        <div className="about-footer-cta-icons">
          <span>🎚️</span><span>🔄</span><span>🤟</span><span>📡</span>
        </div>
      </section>

    </div>
  );
};
export default Home;
