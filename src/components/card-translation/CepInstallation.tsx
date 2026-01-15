// ========================================
// CEP PANEL INSTALLATION GUIDE
// Component: CepInstallation.tsx
// Download and installation instructions
// ========================================

import React, { useState } from 'react';
import './CepInstallation.css';

interface CepInstallationProps {
  token: string;
}

const CepInstallation: React.FC<CepInstallationProps> = ({ token }) => {
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

  const handleDownload = () => {
    setDownloadStatus('Preparing download...');
    
    // Direct download link to the CEP panel
    const downloadUrl = `${API_URL}/downloads/card-translation-cep.zip`;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'card-translation-cep.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloadStatus('Download started! Check your downloads folder.');
    
    setTimeout(() => {
      setDownloadStatus(null);
    }, 5000);
  };

  return (
    <div className="cep-installation">
      <div className="installation-header">
        <h1>📥 Install CEP Panel for Photoshop</h1>
        <p className="subtitle">
          Follow these simple steps to install the Card Translation CEP panel on your computer
        </p>
      </div>

      {/* Download Section */}
      <div className="download-section">
        <div className="download-card">
          <div className="download-icon">📦</div>
          <h2>Download CEP Panel</h2>
          <p>Click the button below to download the Card Translation CEP extension package</p>
          
          <button className="download-btn" onClick={handleDownload}>
            <span className="btn-icon">⬇️</span>
            Download Card Translation CEP
            <span className="file-size">(~2 MB)</span>
          </button>
          
          {downloadStatus && (
            <div className="download-status">
              ✓ {downloadStatus}
            </div>
          )}
        </div>
      </div>

      {/* System Requirements */}
      <div className="requirements-section">
        <h2>💻 System Requirements</h2>
        <div className="requirements-grid">
          <div className="requirement-card">
            <div className="req-icon">🖥️</div>
            <h3>Operating System</h3>
            <ul>
              <li>Windows 10/11 (64-bit)</li>
              <li>macOS 10.14 or later</li>
            </ul>
          </div>
          <div className="requirement-card">
            <div className="req-icon">🎨</div>
            <h3>Adobe Photoshop</h3>
            <ul>
              <li>Photoshop CC 2018 or later</li>
              <li>Photoshop 2023, 2024, 2025</li>
            </ul>
          </div>
          <div className="requirement-card">
            <div className="req-icon">🌐</div>
            <h3>Network</h3>
            <ul>
              <li>Internet connection required</li>
              <li>Access to ministryprogs.tniglobal.org</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="installation-steps">
        <h2>📋 Installation Instructions</h2>
        
        <div className="step-container">
          <div className="step-header">
            <div className="step-number">1</div>
            <h3>Download the CEP Panel</h3>
          </div>
          <div className="step-content">
            <p>Click the download button above to get the <code>card-translation-cep.zip</code> file.</p>
            <div className="step-note">
              💡 The file will be saved to your default Downloads folder
            </div>
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <div className="step-number">2</div>
            <h3>Extract the ZIP File</h3>
          </div>
          <div className="step-content">
            <p>Right-click the downloaded ZIP file and select "Extract All" or use your preferred extraction tool.</p>
            <div className="os-specific">
              <div className="os-instructions">
                <strong>Windows:</strong>
                <ul>
                  <li>Right-click → Extract All</li>
                  <li>Choose a destination folder</li>
                  <li>Click Extract</li>
                </ul>
              </div>
              <div className="os-instructions">
                <strong>macOS:</strong>
                <ul>
                  <li>Double-click the ZIP file</li>
                  <li>It will automatically extract</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <div className="step-number">3</div>
            <h3>Locate CEP Extensions Folder</h3>
          </div>
          <div className="step-content">
            <p>Find your Photoshop CEP extensions folder based on your operating system:</p>
            <div className="path-boxes">
              <div className="path-box">
                <strong>🪟 Windows:</strong>
                <code className="path-code">
                  C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\
                </code>
                <button 
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\');
                    alert('Path copied to clipboard!');
                  }}
                >
                  📋 Copy
                </button>
              </div>
              <div className="path-box">
                <strong>🍎 macOS:</strong>
                <code className="path-code">
                  /Library/Application Support/Adobe/CEP/extensions/
                </code>
                <button 
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('/Library/Application Support/Adobe/CEP/extensions/');
                    alert('Path copied to clipboard!');
                  }}
                >
                  📋 Copy
                </button>
              </div>
            </div>
            <div className="step-note warning">
              ⚠️ You may need administrator privileges to access this folder
            </div>
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <div className="step-number">4</div>
            <h3>Copy CEP Folder to Extensions</h3>
          </div>
          <div className="step-content">
            <p>Copy the extracted <code>card-translation-cep</code> folder into the CEP extensions folder.</p>
            <div className="step-visual">
              <div className="folder-structure">
                <div className="folder-item">📁 extensions/</div>
                <div className="folder-item nested">📁 card-translation-cep/</div>
                <div className="folder-item nested-2">📄 manifest.xml</div>
                <div className="folder-item nested-2">📁 client/</div>
                <div className="folder-item nested-2">📁 host/</div>
                <div className="folder-item nested-2">📁 icons/</div>
              </div>
            </div>
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <div className="step-number">5</div>
            <h3>Enable Debug Mode (First Time Only)</h3>
          </div>
          <div className="step-content">
            <p>For CEP panels to work, you need to enable debug mode in Photoshop:</p>
            <div className="os-specific">
              <div className="os-instructions">
                <strong>Windows:</strong>
                <ol>
                  <li>Open Registry Editor (Win + R, type <code>regedit</code>)</li>
                  <li>Navigate to: <code>HKEY_CURRENT_USER\Software\Adobe\CSXS.11</code></li>
                  <li>Create a new String Value named <code>PlayerDebugMode</code></li>
                  <li>Set its value to <code>1</code></li>
                </ol>
              </div>
              <div className="os-instructions">
                <strong>macOS:</strong>
                <ol>
                  <li>Open Terminal</li>
                  <li>Run: <code>defaults write com.adobe.CSXS.11 PlayerDebugMode 1</code></li>
                  <li>Press Enter</li>
                </ol>
              </div>
            </div>
            <div className="step-note">
              💡 CSXS.11 is for Photoshop 2023+. Use CSXS.10 for CC 2022, CSXS.9 for CC 2020-2021
            </div>
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <div className="step-number">6</div>
            <h3>Restart Photoshop</h3>
          </div>
          <div className="step-content">
            <p>Close and restart Adobe Photoshop completely for the changes to take effect.</p>
            <div className="step-note success">
              ✓ The CEP panel will now be available in Photoshop
            </div>
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <div className="step-number">7</div>
            <h3>Open the CEP Panel in Photoshop</h3>
          </div>
          <div className="step-content">
            <p>In Photoshop, go to:</p>
            <div className="menu-path">
              <span className="menu-item">Window</span>
              <span className="menu-arrow">→</span>
              <span className="menu-item">Extensions</span>
              <span className="menu-arrow">→</span>
              <span className="menu-item">Card Translation</span>
            </div>
            <div className="step-visual">
              <img 
                src="/assets/cep-menu-location.png" 
                alt="CEP Menu Location" 
                className="instruction-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <div className="step-number">8</div>
            <h3>Connect with API Key</h3>
          </div>
          <div className="step-content">
            <p>Generate your API key from the "API Key" tab and paste it into the CEP panel to connect.</p>
            <div className="step-note success">
              🎉 You're all set! The panel will now communicate with the backend server.
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="troubleshooting-section">
        <h2>🔧 Troubleshooting</h2>
        <div className="troubleshooting-grid">
          <div className="trouble-card">
            <h3>❌ Panel doesn't appear in Photoshop</h3>
            <ul>
              <li>Verify the folder is in the correct CEP extensions location</li>
              <li>Check that debug mode is enabled (Step 5)</li>
              <li>Restart Photoshop completely</li>
              <li>Check Photoshop version (CC 2018 or later required)</li>
            </ul>
          </div>
          <div className="trouble-card">
            <h3>🔌 Connection Failed</h3>
            <ul>
              <li>Verify your internet connection</li>
              <li>Check that you have a valid API key</li>
              <li>Ensure firewall isn't blocking the connection</li>
              <li>Try regenerating your API key</li>
            </ul>
          </div>
          <div className="trouble-card">
            <h3>⚠️ Permission Denied</h3>
            <ul>
              <li>Run as Administrator (Windows)</li>
              <li>Use sudo command (macOS)</li>
              <li>Check folder permissions</li>
              <li>Contact your IT department if on corporate network</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Video Tutorial Section */}
      <div className="video-section">
        <h2>🎥 Video Tutorial</h2>
        <div className="video-placeholder">
          <p>📹 Video installation guide coming soon!</p>
          <p className="small-text">
            For now, follow the step-by-step instructions above
          </p>
        </div>
      </div>

      {/* Support Section */}
     
    </div>
  );
};

export default CepInstallation;
