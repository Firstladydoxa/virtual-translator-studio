import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { languageService } from '../services/api';
import { Language } from '../types';
import './RegisterForm.css';

interface RegisterFormProps {
  onShowLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onShowLogin }) => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    country: '',
    language: '',
    password: ''
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const langs = await languageService.getLanguages();
      setLanguages(langs);
      setFilteredLanguages(langs);
    } catch (err) {
      console.error('Failed to load languages:', err);
      setError('Failed to load language options');
    }
  };

  const handleLanguageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setLanguageSearch(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredLanguages([]);
      setShowLanguageDropdown(false);
    } else if (searchTerm.trim().length < 2) {
      // Require at least 2 characters to show results
      setFilteredLanguages([]);
      setShowLanguageDropdown(false);
    } else {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchTokens = searchLower.split(/\s+/).filter(Boolean);

      // Stricter filter: every search token must match start-of-word or start-of-value
      const filtered = languages.filter(lang => {
        const labelLower = lang.label.toLowerCase();
        const valueLower = lang.value.toLowerCase();

        // Normalize label: remove leading symbols, split into words
        const cleanLabel = labelLower.replace(/^[^a-z0-9]+/, '');
        const labelWords = cleanLabel.split(/[\s\-_']+/).map(word => word.replace(/^[^a-z0-9]+/, ''));
        const valueWords = valueLower.split('_');

        // Each search token must match start of some word in label or value
        return searchTokens.every(token => {
          if (!token) return true;
          const matchesLabel = labelWords.some(word => word.startsWith(token));
          const matchesValue = valueLower.startsWith(token) || valueWords.some(word => word.startsWith(token));
          return matchesLabel || matchesValue;
        });
      });

      setFilteredLanguages(filtered);
      setShowLanguageDropdown(true);
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setFormData({
      ...formData,
      language: lang.value
    });
    setLanguageSearch(lang.label);
    setShowLanguageDropdown(false);
  };

  const handleLanguageInputFocus = () => {
    // Only show dropdown if there's a search term with results
    if (languageSearch.trim().length >= 2 && filteredLanguages.length > 0) {
      setShowLanguageDropdown(true);
    }
  };

  const handleLanguageInputBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      setShowLanguageDropdown(false);
    }, 200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.language) {
      setError('Please select a translation language');
      setLoading(false);
      return;
    }

    try {
      // Auto-generate username from email (part before @)
      const username = formData.email.split('@')[0];
      
      await register({
        ...formData,
        username
      });
      setSuccess('Registration successful! Please login with your credentials.');
      setTimeout(() => {
        onShowLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register as Translator</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="fullname">Full Name</label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Enter your country"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="language">Translation Language</label>
            <div className="language-search-container">
              <input
                type="text"
                id="language"
                name="language-search"
                value={languageSearch}
                onChange={handleLanguageSearch}
                onFocus={handleLanguageInputFocus}
                onBlur={handleLanguageInputBlur}
                placeholder="Search for a language... (min 2 characters)"
                required={!formData.language}
                disabled={loading}
                autoComplete="off"
              />
              {showLanguageDropdown && filteredLanguages.length > 0 && languageSearch.trim().length >= 2 && (
                <div className="language-dropdown">
                  {filteredLanguages.map((lang) => (
                    <div
                      key={lang.value}
                      className={`language-option ${formData.language === lang.value ? 'selected' : ''}`}
                      onClick={() => handleLanguageSelect(lang)}
                    >
                      {lang.label}
                    </div>
                  ))}
                </div>
              )}
              {showLanguageDropdown && filteredLanguages.length === 0 && languageSearch.trim().length >= 2 && (
                <div className="language-dropdown">
                  <div className="language-option no-results">
                    No languages found
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>

          <p className="auth-switch">
            Already have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onShowLogin(); }}>
              Login here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
