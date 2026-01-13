import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, StreamingDetails, LiveStatus } from '../types';

interface AppState {
  // User data
  user: User | null;
  streamingDetails: StreamingDetails | null;
  token: string | null;
  
  // Translation session state
  isTranslating: boolean;
  liveStatus: LiveStatus;
  outputStreamAvailable: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setStreamingDetails: (details: StreamingDetails | null) => void;
  setToken: (token: string | null) => void;
  setIsTranslating: (status: boolean) => void;
  setLiveStatus: (status: LiveStatus) => void;
  setOutputStreamAvailable: (available: boolean) => void;
  
  // Combined actions
  login: (user: User, token: string, streamingDetails: StreamingDetails) => void;
  logout: () => void;
  
  // Computed getters
  getTranslationLanguage: () => string;
  getWatchUrl: () => string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      streamingDetails: null,
      token: null,
      isTranslating: false,
      liveStatus: 'offline',
      outputStreamAvailable: false,
      
      // Setters
      setUser: (user) => set({ user }),
      setStreamingDetails: (details) => set({ streamingDetails: details }),
      setToken: (token) => set({ token }),
      setIsTranslating: (status) => set({ isTranslating: status }),
      setLiveStatus: (status) => set({ liveStatus: status }),
      setOutputStreamAvailable: (available) => set({ outputStreamAvailable: available }),
      
      // Combined actions
      login: (user, token, streamingDetails) => {
        set({
          user,
          token,
          streamingDetails,
          liveStatus: 'offline',
          isTranslating: false,
          outputStreamAvailable: false
        });
        // Also save to localStorage for compatibility
        localStorage.setItem('token', token);
      },
      
      logout: () => {
        // Call logout API to mark user as disconnected
        const token = localStorage.getItem('token');
        if (token) {
          fetch('https://ministryprogs.tniglobal.org/api/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).catch(err => console.error('Logout API error:', err));
        }
        
        set({
          user: null,
          token: null,
          streamingDetails: null,
          liveStatus: 'offline',
          isTranslating: false,
          outputStreamAvailable: false
        });
        // Also remove from localStorage
        localStorage.removeItem('token');
      },
      
      // Computed getters
      getTranslationLanguage: () => {
        const state = get();
        const language = state.streamingDetails?.language || 
                        state.user?.language?.value || 
                        'unknown';
        return language.charAt(0).toUpperCase() + language.slice(1);
      },
      
      getWatchUrl: () => {
        const state = get();
        const language = state.streamingDetails?.language || 
                        state.user?.language?.value || 
                        'english';
        return state.streamingDetails?.watchUrl || 
               `https://tni-out.ceflixcdn.com/translations/${language}/playlist.m3u8`;
      }
    }),
    {
      name: 'translation-app-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user data, not session state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        streamingDetails: state.streamingDetails
      })
    }
  )
);
