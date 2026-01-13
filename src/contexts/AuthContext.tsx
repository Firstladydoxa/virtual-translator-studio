import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { User, StreamingDetails, RegisterRequest } from '../types';
import { useAppStore } from '../store/useAppStore';

interface AuthContextType {
  user: User | null;
  streamingDetails: StreamingDetails | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Get state and actions from store
  const {
    user,
    token,
    streamingDetails,
    login: storeLogin,
    logout: storeLogout,
    setUser,
    setToken,
    setStreamingDetails
  } = useAppStore();

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const data = await authService.verify();
          setUser(data.user);
          if (data.streamingDetails) {
            setStreamingDetails(data.streamingDetails);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          storeLogout();
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []); // Only run once on mount

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    storeLogin(data.user, data.token, data.streamingDetails);
  };

  const register = async (registerData: RegisterRequest) => {
    await authService.register(registerData);
  };

  const logout = () => {
    storeLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        streamingDetails,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
