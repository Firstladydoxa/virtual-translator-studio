import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { languageService } from '../services/api';
import { Language } from '../types';
import { countries } from '../data/countries';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();

  const fieldRefs = {
    fullname: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    country: useRef<HTMLSelectElement>(null),
    language: useRef<HTMLSelectElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const langs = await languageService.getLanguages();
      setLanguages(langs);
    } catch (err) {
      console.error('Failed to load languages:', err);
      setError('Failed to load language options');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error as user fixes it
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side field validation
    const errors: Record<string, string> = {};
    if (!formData.fullname.trim() || formData.fullname.trim().length < 2)
      errors.fullname = 'Full name is required (at least 2 characters).';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'A valid email address is required.';
    if (!formData.country)
      errors.country = 'Please select your country.';
    if (!formData.language)
      errors.language = languages.length === 0
        ? 'Language list is still loading — please wait and try again.'
        : 'Please select your translation language.';
    if (!formData.password || formData.password.length < 6)
      errors.password = 'Password must be at least 6 characters.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to and focus the first invalid field
      const firstField = (['fullname', 'email', 'country', 'language', 'password'] as const)
        .find(f => errors[f]);
      if (firstField) {
        const ref = fieldRefs[firstField].current;
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          ref.focus();
        }
      }
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Auto-generate username from email (part before @), minimum 3 characters
      const emailPrefix = formData.email.split('@')[0];
      const username = emailPrefix.length >= 3 ? emailPrefix : (emailPrefix + '___').slice(0, 3);
      
      await register({
        ...formData,
        username
      });
      setSuccess('Registration successful! Please login with your credentials.');
      setTimeout(() => {
        onShowLogin();
      }, 2000);
    } catch (err: any) {
      // Extract the actual validation message from the server response
      const serverErrors = err.response?.data?.errors;
      const serverError = err.response?.data?.error;
      if (serverErrors && serverErrors.length > 0) {
        setError(serverErrors.map((e: any) => e.msg).join('. '));
      } else if (serverError) {
        setError(serverError);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
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
          
          <div className={`form-group${fieldErrors.fullname ? ' field-error' : ''}`}>
            <label htmlFor="fullname">Full Name <span className="required-star">*</span></label>
            <input
              ref={fieldRefs.fullname}
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
            {fieldErrors.fullname && <span className="field-error-hint">{fieldErrors.fullname}</span>}
          </div>

          <div className={`form-group${fieldErrors.email ? ' field-error' : ''}`}>
            <label htmlFor="email">Email <span className="required-star">*</span></label>
            <input
              ref={fieldRefs.email}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
            {fieldErrors.email && <span className="field-error-hint">{fieldErrors.email}</span>}
          </div>

          <div className={`form-group${fieldErrors.country ? ' field-error' : ''}`}>
            <label htmlFor="country">Country <span className="required-star">*</span></label>
            <select
              ref={fieldRefs.country}
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select your country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {fieldErrors.country && <span className="field-error-hint">{fieldErrors.country}</span>}
          </div>

          <div className={`form-group${fieldErrors.language ? ' field-error' : ''}`}>
            <label htmlFor="language">Translation Language <span className="required-star">*</span></label>
            <select
              ref={fieldRefs.language}
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select translation language</option>
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            {fieldErrors.language && <span className="field-error-hint">{fieldErrors.language}</span>}
          </div>

          <div className={`form-group${fieldErrors.password ? ' field-error' : ''}`}>
            <label htmlFor="password">Password <span className="required-star">*</span></label>
            <input
              ref={fieldRefs.password}
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
            {fieldErrors.password && <span className="field-error-hint">{fieldErrors.password}</span>}
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
