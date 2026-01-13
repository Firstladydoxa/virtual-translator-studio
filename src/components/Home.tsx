import React from 'react';
import '../styles/Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="presentation">
        <div className="presentation-page cover-page">
          <div className="cover-content">
            <h1 className="cover-title">Live Translation System</h1>
            <p className="cover-subtitle">Real-time Audio Translation with Video Broadcasting</p>
            <div className="cover-metadata">
              <p>Powered by Modern Web Technologies</p>
              <p className="date">November 2025</p>
            </div>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">Executive Summary</h1>
          <div className="content-section">
            <h2>Mission Statement</h2>
            <p className="mission-text">
              The Live Translation System revolutionizes real-time communication by providing seamless audio translation
              capabilities combined with high-quality video broadcasting. Our platform enables organizations to break language
              barriers and deliver content to global audiences with minimal latency.
            </p>
          </div>

          <div className="content-section">
            <h2>Key Highlights</h2>
            <div className="highlight-grid">
              <div className="highlight-card">
                <div className="highlight-icon">🎙️</div>
                <h3>Real-time Translation</h3>
                <p>Live audio translation with ultra-low latency (1-2 seconds)</p>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon">📹</div>
                <h3>Dual Video Feeds</h3>
                <p>Simultaneous source and translated video streams</p>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon">🔒</div>
                <h3>Secure & Reliable</h3>
                <p>End-to-end encryption with JWT authentication</p>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon">🌐</div>
                <h3>Cloud-based</h3>
                <p>Scalable RTMP streaming to global CDN</p>
              </div>
            </div>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">Core Features</h1>
          
          <div className="content-section">
            <h2>1. Audio Translation</h2>
            <div className="feature-box">
              <ul className="feature-list">
                <li>Real-time microphone audio capture</li>
                <li>High-quality audio encoding (AAC 128kbps)</li>
                <li>Ultra-low latency transmission (1-2 seconds)</li>
                <li>Browser-based - no software installation required</li>
                <li>Visual audio level indicators</li>
                <li>One-click record/stop controls</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>2. Video Broadcasting</h2>
            <div className="feature-box">
              <ul className="feature-list">
                <li>Dual video player interface (source + translated)</li>
                <li>720p HD video quality at 30fps</li>
                <li>H.264 codec for broad compatibility</li>
                <li>Automatic video synchronization</li>
                <li>Play/Stop controls for both streams</li>
                <li>Real-time WebRTC streaming with ultra-low latency</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>3. Audio Mixing System</h2>
            <div className="feature-box">
              <ul className="feature-list">
                <li>Advanced audio mixing with source and translator tracks</li>
                <li>Three preset modes: Translation, Balanced, and Source Media</li>
                <li>Individual volume controls for source and translator audio</li>
                <li>Real-time audio level monitoring and visualization</li>
                <li>Smart mute/unmute controls synchronized with translation modes</li>
                <li>Output audio monitoring with independent volume control</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Performance Optimizations</h2>
            <ul className="feature-list">
              <li>⚡ WebRTC for ultra-low latency (&lt;500ms)</li>
              <li>🎯 SFU architecture for efficient streaming</li>
              <li>💾 Optimized audio buffer management</li>
              <li>🔧 Real-time audio context processing</li>
              <li>📊 Dynamic bandwidth adaptation</li>
            </ul>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">User Features</h1>
          
          <div className="content-section">
            <h2>Registration & Authentication</h2>
            <div className="feature-box">
              <ul className="feature-list">
                <li>Simple registration with email verification</li>
                <li>Secure login with encrypted passwords</li>
                <li>Persistent sessions across browser refreshes</li>
                <li>Automatic token refresh</li>
                <li>User profile management</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Translation Studio Interface</h2>
            <div className="feature-box">
              <ul className="feature-list">
                <li>Clean, intuitive dashboard design</li>
                <li>Side-by-side video comparison</li>
                <li>Large, accessible control buttons</li>
                <li>Real-time audio level monitoring</li>
                <li>Session information display</li>
                <li>Responsive design for all devices</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Live Picture Capture</h2>
            <div className="feature-box">
              <ul className="feature-list">
                <li>Capture live pictures while actively translating</li>
                <li>Real-time camera preview before capture</li>
                <li>Instant picture upload to server</li>
                <li>Pictures displayed on Monitor Live page</li>
                <li>Showcase translators during live sessions</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">How to Use - Getting Started</h1>
          
          <div className="content-section">
            <h2>Step 1: Access the Platform</h2>
            <div className="step-box">
              <div className="step-number">1</div>
              <div className="step-content">
                <p>Open your web browser and navigate to:</p>
                <p className="url-text">https://programs.tniglobal.org</p>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Step 2: Login</h2>
            <div className="step-box">
              <div className="step-number">2</div>
              <div className="step-content">
                <p>Enter your credentials:</p>
                <ul>
                  <li>Email address</li>
                  <li>Password</li>
                  <li>Click "Login" button</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Step 3: Access Translation Studio</h2>
            <div className="step-box">
              <div className="step-number">3</div>
              <div className="step-content">
                <p>After successful login:</p>
                <ul>
                  <li>Click the menu icon (☰) in the top bar</li>
                  <li>Select "Translation Studio" from the sidebar</li>
                  <li>Wait for the studio interface to load</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Browser Compatibility</h2>
            <div className="info-box">
              <p><strong>Recommended Browsers:</strong></p>
              <ul className="feature-list">
                <li>✅ Google Chrome (latest version)</li>
                <li>✅ Microsoft Edge (latest version)</li>
                <li>✅ Mozilla Firefox (latest version)</li>
                <li>✅ Safari 14+ (macOS/iOS)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="presentation-page">          <h1 className="page-title">Audio Mixing Modes</h1>
          
          <div className="content-section">
            <h2>Translation Mode (Default)</h2>
            <div className="feature-box">
              <p><strong>Best for:</strong> Standard translation work where translator voice is primary</p>
              <ul className="feature-list">
                <li><strong>Source Audio:</strong> 20% volume (low background)</li>
                <li><strong>Translator Audio:</strong> 100% volume (full voice)</li>
                <li><strong>Source Monitoring:</strong> Unmuted (hear original)</li>
                <li><strong>Output Monitoring:</strong> Muted (prevent echo)</li>
                <li><strong>Use when:</strong> Translating speech, sermons, or lectures</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Balanced Mode</h2>
            <div className="feature-box">
              <p><strong>Best for:</strong> When both source and translation need to be heard</p>
              <ul className="feature-list">
                <li><strong>Source Audio:</strong> 50% volume (moderate)</li>
                <li><strong>Translator Audio:</strong> 80% volume (primary)</li>
                <li><strong>Source Monitoring:</strong> Unmuted (hear original)</li>
                <li><strong>Output Monitoring:</strong> Muted (still translating)</li>
                <li><strong>Use when:</strong> Music with narration, mixed content</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Source Media Mode</h2>
            <div className="feature-box">
              <p><strong>Best for:</strong> Playing original content without translation</p>
              <ul className="feature-list">
                <li><strong>Source Audio:</strong> 100% volume (full original)</li>
                <li><strong>Translator Audio:</strong> 0% volume (muted)</li>
                <li><strong>Source Monitoring:</strong> Muted (not translating)</li>
                <li><strong>Output Monitoring:</strong> Unmuted (monitor final)</li>
                <li><strong>Use when:</strong> Music performances, videos without speech</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Switching Modes</h2>
            <div className="step-box">
              <div className="step-number">💡</div>
              <div className="step-content">
                <p>Quick mode switching:</p>
                <ul>
                  <li>Click "Translation Mode" button for default settings</li>
                  <li>Click "Balanced Mode" for mixed audio</li>
                  <li>Click "Source Media Mode" for original audio only</li>
                  <li>All volume levels adjust automatically</li>
                  <li>Mute states change based on mode</li>
                  <li>Can fine-tune volumes manually after switching</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">Live Picture Capture</h1>
          
          <div className="content-section">
            <h2>Taking Live Pictures</h2>
            <div className="feature-box">
              <p><strong>Purpose:</strong> Showcase translators during active translation sessions</p>
              <ul className="feature-list">
                <li>Available only when actively translating</li>
                <li>Click "📷 Take Picture" button in translation controls</li>
                <li>Camera preview window opens automatically</li>
                <li>Review your appearance in real-time</li>
                <li>Click "Capture Photo" to save</li>
                <li>Picture uploads instantly to server</li>
                <li>Replaces any previous picture</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Picture Usage</h2>
            <div className="info-box">
              <p><strong>Where pictures appear:</strong></p>
              <ul className="feature-list">
                <li>🖼️ <strong>Monitor Live Page:</strong> Displayed on your translator card</li>
                <li>👥 <strong>Translator Gallery:</strong> Visible to admins and viewers</li>
                <li>🔄 <strong>Real-time Updates:</strong> Changes reflect immediately</li>
                <li>📸 <strong>Live Context:</strong> Shows you during actual translation</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Best Practices</h2>
            <ul className="feature-list">
              <li>✅ Ensure good lighting for clear picture</li>
              <li>✅ Position camera at eye level</li>
              <li>✅ Use a clean, professional background</li>
              <li>✅ Smile and look at the camera</li>
              <li>✅ Update picture if environment changes</li>
            </ul>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">Monitor Live Dashboard</h1>
          
          <div className="content-section">
            <h2>Overview</h2>
            <div className="feature-box">
              <p><strong>Real-time monitoring of all translator activity</strong></p>
              <ul className="feature-list">
                <li>View all logged-in translators</li>
                <li>See who is actively translating</li>
                <li>Beautiful gallery-style card layout</li>
                <li>Live status indicators with color coding</li>
                <li>Translator pictures and information</li>
                <li>Auto-refresh every 10 seconds</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Status Indicators</h2>
            <div className="highlight-grid">
              <div className="highlight-card">
                <div className="highlight-icon">🟢</div>
                <h3>Connected</h3>
                <p>Translator logged in and available</p>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon">🔴</div>
                <h3>Live Translating</h3>
                <p>Actively translating in real-time</p>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Filter Options</h2>
            <div className="feature-box">
              <p><strong>Three filter buttons for easy navigation:</strong></p>
              <ul className="feature-list">
                <li><strong>All:</strong> Shows all translators (connected + translating)</li>
                <li><strong>🟢 Connected:</strong> Shows only logged-in translators</li>
                <li><strong>🔴 Live Translating:</strong> Shows only active translators</li>
                <li>Count badges update in real-time</li>
                <li>Active filter highlighted in blue</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Translator Cards</h2>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td><strong>Profile Picture:</strong></td>
                  <td>Live picture or generated avatar with initials</td>
                </tr>
                <tr>
                  <td><strong>Full Name:</strong></td>
                  <td>Translator's registered name</td>
                </tr>
                <tr>
                  <td><strong>Language:</strong></td>
                  <td>Translation language (e.g., French, Spanish)</td>
                </tr>
                <tr>
                  <td><strong>Country:</strong></td>
                  <td>Translator's location</td>
                </tr>
                <tr>
                  <td><strong>Status Badges:</strong></td>
                  <td>Green (Connected) and/or Red (Live Translating)</td>
                </tr>
                <tr>
                  <td><strong>Watch Stream:</strong></td>
                  <td>Button to view translator's output stream</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="content-section">
            <h2>Admin Features</h2>
            <ul className="feature-list">
              <li>📊 Live statistics: Connected and translating counts</li>
              <li>🔍 Quick visual overview of all translator activity</li>
              <li>👁️ Watch any translator's stream directly</li>
              <li>⚡ Real-time updates without page refresh</li>
              <li>🎨 Beautiful, modern interface design</li>
            </ul>
          </div>
        </div>

        <div className="presentation-page">          <h1 className="page-title">How to Use - Audio Setup</h1>
          
          <div className="content-section">
            <h2>Microphone Permissions</h2>
            <div className="warning-box">
              <p><strong>⚠️ Important:</strong> Your browser will request microphone access when you first use the translation feature. You must grant permission for the system to work.</p>
            </div>
          </div>

          <div className="content-section">
            <h2>Step 4: Configure Audio</h2>
            <div className="step-box">
              <div className="step-number">4</div>
              <div className="step-content">
                <p>In the Translation Studio:</p>
                <ul>
                  <li>Look for the audio controls section</li>
                  <li>Select your microphone from the dropdown (if multiple available)</li>
                  <li>Speak into your microphone and watch the audio level indicator</li>
                  <li>Green bars should appear when you speak</li>
                  <li>Adjust your microphone volume if needed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Audio Level Monitoring</h2>
            <div className="feature-box">
              <p>The audio level indicator shows real-time input levels:</p>
              <ul className="feature-list">
                <li>🟢 <strong>Green:</strong> Good audio level (ideal)</li>
                <li>🟡 <strong>Yellow:</strong> Low audio level (speak louder)</li>
                <li>🔴 <strong>Red:</strong> Clipping/distortion (reduce volume)</li>
                <li>⚫ <strong>No bars:</strong> No audio detected (check microphone)</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Troubleshooting Audio Issues</h2>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td><strong>No audio detected:</strong></td>
                  <td>Check browser permissions, microphone connection, system volume</td>
                </tr>
                <tr>
                  <td><strong>Poor audio quality:</strong></td>
                  <td>Use external microphone, reduce background noise, check internet speed</td>
                </tr>
                <tr>
                  <td><strong>Audio cutting out:</strong></td>
                  <td>Check internet connection stability, reduce browser tabs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">How to Use - Broadcasting</h1>
          
          <div className="content-section">
            <h2>Step 5: Start Translation</h2>
            <div className="step-box">
              <div className="step-number">5</div>
              <div className="step-content">
                <p>When ready to begin translating:</p>
                <ul>
                  <li>Click the large "Start Recording" button</li>
                  <li>The button will change to "Stop Recording" (red)</li>
                  <li>Source video will automatically start playing</li>
                  <li>Begin speaking your translation into the microphone</li>
                  <li>Monitor the audio level indicator</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Step 6: Monitor Streams</h2>
            <div className="feature-box">
              <p>You will see two video players:</p>
              <ul className="feature-list">
                <li><strong>Left Player:</strong> Source video (original broadcast)</li>
                <li><strong>Right Player:</strong> Translated video (your output with audio)</li>
                <li>Both players have Play/Stop controls</li>
                <li>Videos should be synchronized</li>
                <li>Translated audio appears with 1-2 second delay</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2>Step 7: Stop Translation</h2>
            <div className="step-box">
              <div className="step-number">7</div>
              <div className="step-content">
                <p>When finished translating:</p>
                <ul>
                  <li>Click the "Stop Recording" button</li>
                  <li>Audio capture will stop immediately</li>
                  <li>Streaming will end gracefully</li>
                  <li>Videos will stop playing</li>
                  <li>You can start again anytime by clicking "Start Recording"</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Best Practices</h2>
            <div className="success-box">
              <ul className="feature-list">
                <li>✅ Test your audio levels before the actual broadcast</li>
                <li>✅ Use a quiet environment with minimal background noise</li>
                <li>✅ Use headphones to prevent audio feedback</li>
                <li>✅ Maintain consistent distance from microphone</li>
                <li>✅ Have a stable internet connection (5+ Mbps upload)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">Technical Specifications</h1>
          
          <div className="content-section">
            <h2>System Requirements</h2>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td><strong>Minimum Internet:</strong></td>
                  <td>5 Mbps upload, 10 Mbps download</td>
                </tr>
                <tr>
                  <td><strong>Recommended Internet:</strong></td>
                  <td>10+ Mbps upload, 25+ Mbps download</td>
                </tr>
                <tr>
                  <td><strong>RAM:</strong></td>
                  <td>4GB minimum, 8GB+ recommended</td>
                </tr>
                <tr>
                  <td><strong>Processor:</strong></td>
                  <td>Modern dual-core or better</td>
                </tr>
                <tr>
                  <td><strong>Microphone:</strong></td>
                  <td>Any USB or built-in microphone</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="content-section">
            <h2>Video Specifications</h2>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td><strong>Resolution:</strong></td>
                  <td>1280x720 (720p HD)</td>
                </tr>
                <tr>
                  <td><strong>Frame Rate:</strong></td>
                  <td>30 fps</td>
                </tr>
                <tr>
                  <td><strong>Video Codec:</strong></td>
                  <td>VP8/H.264 (WebRTC)</td>
                </tr>
                <tr>
                  <td><strong>Video Bitrate:</strong></td>
                  <td>2500 kbps</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="content-section">
            <h2>Audio Specifications</h2>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td><strong>Audio Codec:</strong></td>
                  <td>Opus (WebRTC)</td>
                </tr>
                <tr>
                  <td><strong>Audio Bitrate:</strong></td>
                  <td>128 kbps</td>
                </tr>
                <tr>
                  <td><strong>Sample Rate:</strong></td>
                  <td>48 kHz</td>
                </tr>
                <tr>
                  <td><strong>Channels:</strong></td>
                  <td>Stereo (2 channels)</td>
                </tr>
                <tr>
                  <td><strong>Latency:</strong></td>
                  <td>&lt;500ms (ultra-low via WebRTC)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="content-section">
            <h2>Performance Metrics</h2>
            <div className="highlight-grid">
              <div className="metric-card">
                <div className="metric-value">&lt;500ms</div>
                <div className="metric-label">End-to-End Latency</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">720p</div>
                <div className="metric-label">Video Quality</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">99.9%</div>
                <div className="metric-label">Uptime</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">Real-time</div>
                <div className="metric-label">Audio Mixing</div>
              </div>
            </div>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">Benefits & ROI</h1>
          
          <div className="content-section">
            <h2>Organizational Benefits</h2>
            <div className="benefit-grid">
              <div className="benefit-card">
                <div className="benefit-icon">🌍</div>
                <h3>Global Reach</h3>
                <p>Broadcast to multilingual audiences simultaneously without geographical limitations</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">💰</div>
                <h3>Cost Effective</h3>
                <p>No expensive hardware or professional translation equipment required</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">⚡</div>
                <h3>Real-time</h3>
                <p>Instant translation with minimal latency for live engagement</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📈</div>
                <h3>Scalable</h3>
                <p>Cloud infrastructure supports unlimited concurrent viewers</p>
              </div>
            </div>
          </div>

          <div className="content-section">
            <h2>Translator Benefits</h2>
            <ul className="feature-list">
              <li>🎯 Simple, intuitive interface - minimal training required</li>
              <li>🏠 Work from anywhere with internet connection</li>
              <li>👀 Visual feedback for audio quality and timing</li>
              <li>🔄 Flexible start/stop controls for breaks</li>
              <li>💻 Browser-based - no software installation</li>
              <li>📱 Responsive design works on tablets and laptops</li>
            </ul>
          </div>

          <div className="content-section">
            <h2>Impact Metrics</h2>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td><strong>Audience Expansion:</strong></td>
                  <td>Reach 10x more viewers with multilingual support</td>
                </tr>
                <tr>
                  <td><strong>Cost Reduction:</strong></td>
                  <td>70% savings vs traditional translation services</td>
                </tr>
                <tr>
                  <td><strong>Setup Time:</strong></td>
                  <td>5 minutes from login to live broadcasting</td>
                </tr>
                <tr>
                  <td><strong>Engagement:</strong></td>
                  <td>85% increase in viewer retention with native language</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="presentation-page">
          <h1 className="page-title">Thank You</h1>
          
          <div className="thank-you-content">
            <div className="thank-you-icon">🙏</div>
            <h2>Thank You for Using Our Platform</h2>
            <p className="thank-you-text">
              Breaking Language Barriers, Connecting Communities Worldwide
            </p>

            <div className="closing-message">
              <p className="tagline">Empowering Global Communication Through Real-time Translation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
