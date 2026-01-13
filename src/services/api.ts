import axios from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Language,
} from '../types';

const getApiUrl = (): string => {
  const hostname = window.location.hostname;
  
  // Development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Production
  if (hostname === 'programs.tniglobal.org') {
    return 'https://ministryprogs.tniglobal.org';
  }
  
  // Fallback for other domains
  return `${window.location.protocol}//${hostname}:3001`;
};

export const apiUrl = getApiUrl();

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // First try to get from localStorage for compatibility
  let token = localStorage.getItem('token');
  
  // If not in localStorage, try to import from store
  if (!token) {
    try {
      // Dynamic import to avoid circular dependencies
      const { useAppStore } = require('../store/useAppStore');
      token = useAppStore.getState().token;
    } catch (e) {
      console.warn('Could not get token from store:', e);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post('/register', data);
    return response.data;
  },

  verify: async () => {
    const response = await api.get('/verify');
    return response.data;
  },
};

export const languageService = {
  getLanguages: async (): Promise<Language[]> => {
    const response = await axios.get(
      'https://mediathek.tniglobal.org/api/rorlanguagesDropdown'
    );
    return response.data.data;
  },
};

export const streamingService = {
  startStream: async () => {
    const response = await api.post('/streaming/start');
    return response.data;
  },

  stopStream: async () => {
    const response = await api.post('/streaming/stop');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/streaming/status');
    return response.data;
  },
};

export default api;
