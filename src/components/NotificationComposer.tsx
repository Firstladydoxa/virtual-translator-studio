// ========================================
// NOTIFICATION COMPOSER (ADMIN)
// Interface for composing and sending notifications
// ========================================

import React, { useState, useEffect } from 'react';
import './NotificationComposer.css';

interface User {
  _id: string;
  username: string;
  fullname: string;
  email: string;
  language: string;
  country: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  title: string;
  message: string;
  variables: string[];
}

interface NotificationComposerProps {
  token: string;
}

const NotificationComposer: React.FC<NotificationComposerProps> = ({ token }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [targetingMode, setTargetingMode] = useState<'all' | 'language' | 'country' | 'specific'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateVariables, setTemplateVariables] = useState<{ [key: string]: string }>({});
  const [actionType, setActionType] = useState<'none' | 'url' | 'page'>('none');
  const [actionUrl, setActionUrl] = useState('');
  const [actionPage, setActionPage] = useState('');
  const [sound, setSound] = useState(true);
  const [badge, setBadge] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

  // Fetch users
  useEffect(() => {
    fetchUsers();
    fetchTemplates();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setTitle(template.title);
        setMessage(template.message);
        setType(template.type);
        
        // Initialize template variables
        const vars: { [key: string]: string } = {};
        template.variables.forEach(v => {
          vars[v] = '';
        });
        setTemplateVariables(vars);
      }
    } else {
      setTemplateVariables({});
    }
  };

  // Replace template variables
  const processTemplateMessage = () => {
    let processedMessage = message;
    Object.keys(templateVariables).forEach(key => {
      const value = templateVariables[key] || `[${key}]`;
      processedMessage = processedMessage.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return processedMessage;
  };

  // Send notification
  const handleSend = async () => {
    setSending(true);
    setResult(null);

    try {
      const targeting: any = {};
      
      if (targetingMode === 'all') {
        targeting.all = true;
      } else if (targetingMode === 'language') {
        targeting.language = selectedLanguage;
      } else if (targetingMode === 'country') {
        targeting.country = selectedCountry;
      } else if (targetingMode === 'specific') {
        targeting.specificUsers = selectedUsers;
      }

      const action: any = { type: actionType };
      if (actionType === 'url') action.url = actionUrl;
      if (actionType === 'page') action.page = actionPage;

      const processedMessage = selectedTemplate ? processTemplateMessage() : message;

      const response = await fetch(`${API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          message: processedMessage,
          type,
          priority,
          targeting,
          action,
          sound,
          badge,
          template: selectedTemplate || undefined,
          templateData: selectedTemplate ? templateVariables : undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({ 
          success: true, 
          message: `Notification sent to ${data.recipients} recipients!` 
        });
        
        // Reset form
        setTitle('');
        setMessage('');
        setSelectedTemplate('');
        setTemplateVariables({});
        setActionType('none');
        setActionUrl('');
        setActionPage('');
        setSelectedUsers([]);
      } else {
        setResult({ 
          success: false, 
          message: data.error || 'Failed to send notification' 
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setResult({ 
        success: false, 
        message: 'Network error. Please try again.' 
      });
    } finally {
      setSending(false);
    }
  };

  // Get unique languages and countries
  const languages = Array.from(new Set(users.map(u => u.language).filter(Boolean)));
  const countries = Array.from(new Set(users.map(u => u.country).filter(Boolean)));

  return (
    <div className="notification-composer">
      <div className="composer-header">
        <h2>📢 Send Notification</h2>
        <p>Compose and send push notifications to translators</p>
      </div>

      <div className="composer-content">
        {/* Template Selection */}
        <div className="composer-section">
          <label>Use Template (Optional)</label>
          <select 
            value={selectedTemplate} 
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="composer-select"
          >
            <option value="">Custom Message</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Template Variables */}
        {selectedTemplate && Object.keys(templateVariables).length > 0 && (
          <div className="composer-section template-variables">
            <label>Template Variables</label>
            {Object.keys(templateVariables).map(varName => (
              <div key={varName} className="variable-input">
                <label>{varName}:</label>
                <input
                  type="text"
                  value={templateVariables[varName]}
                  onChange={(e) => setTemplateVariables({
                    ...templateVariables,
                    [varName]: e.target.value
                  })}
                  placeholder={`Enter ${varName}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="composer-section">
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="composer-input"
            maxLength={100}
          />
        </div>

        {/* Message */}
        <div className="composer-section">
          <label>Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message"
            className="composer-textarea"
            rows={4}
            maxLength={500}
          />
          <small>{message.length}/500 characters</small>
        </div>

        {/* Preview */}
        {selectedTemplate && (
          <div className="message-preview">
            <strong>Preview:</strong>
            <div className="preview-content">{processTemplateMessage()}</div>
          </div>
        )}

        {/* Type and Priority */}
        <div className="composer-row">
          <div className="composer-section">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="composer-select">
              <option value="general">General</option>
              <option value="assignment">Assignment</option>
              <option value="deadline">Deadline</option>
              <option value="approval">Approval</option>
              <option value="rejection">Rejection</option>
              <option value="announcement">Announcement</option>
              <option value="stream">Stream</option>
              <option value="comment">Comment</option>
              <option value="payment">Payment</option>
            </select>
          </div>

          <div className="composer-section">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="composer-select">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Targeting */}
        <div className="composer-section">
          <label>Send To *</label>
          <div className="targeting-options">
            <label className="radio-option">
              <input
                type="radio"
                name="targeting"
                value="all"
                checked={targetingMode === 'all'}
                onChange={() => setTargetingMode('all')}
              />
              All Translators
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="targeting"
                value="language"
                checked={targetingMode === 'language'}
                onChange={() => setTargetingMode('language')}
              />
              By Language
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="targeting"
                value="country"
                checked={targetingMode === 'country'}
                onChange={() => setTargetingMode('country')}
              />
              By Country
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="targeting"
                value="specific"
                checked={targetingMode === 'specific'}
                onChange={() => setTargetingMode('specific')}
              />
              Specific Users
            </label>
          </div>

          {targetingMode === 'language' && (
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="composer-select">
              <option value="">Select Language</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          )}

          {targetingMode === 'country' && (
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="composer-select">
              <option value="">Select Country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          )}

          {targetingMode === 'specific' && (
            <select 
              multiple 
              value={selectedUsers} 
              onChange={(e) => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))}
              className="composer-select user-select"
              size={8}
            >
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.fullname || user.username} ({user.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action */}
        <div className="composer-section">
          <label>Action (Optional)</label>
          <select value={actionType} onChange={(e) => setActionType(e.target.value as any)} className="composer-select">
            <option value="none">None</option>
            <option value="url">Open URL</option>
            <option value="page">Navigate to Page</option>
          </select>

          {actionType === 'url' && (
            <input
              type="url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="https://example.com"
              className="composer-input"
            />
          )}

          {actionType === 'page' && (
            <input
              type="text"
              value={actionPage}
              onChange={(e) => setActionPage(e.target.value)}
              placeholder="translations, monitor-live, etc."
              className="composer-input"
            />
          )}
        </div>

        {/* Options */}
        <div className="composer-section">
          <label>Options</label>
          <div className="checkbox-options">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => setSound(e.target.checked)}
              />
              Play Sound
            </label>

            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={badge}
                onChange={(e) => setBadge(e.target.checked)}
              />
              Update Badge Count
            </label>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`result-message ${result.success ? 'success' : 'error'}`}>
            {result.message}
          </div>
        )}

        {/* Send Button */}
        <div className="composer-actions">
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={sending || !title || !message}
          >
            {sending ? '📤 Sending...' : '📤 Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationComposer;
