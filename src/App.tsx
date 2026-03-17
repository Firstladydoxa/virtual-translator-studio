import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPassword from './components/ForgotPassword';
import TranslationStudio from './components/TranslationStudio';
import StudioTest from './components/StudioTest';
import RelayStudio from './components/RelayStudio';
import SignTranslationStudio from './components/SignTranslationStudio';
import AdminDashboard from './components/AdminDashboard';
import MonitorLive from './components/MonitorLive';
import ManageSourceLink from './components/ManageSourceLink';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import CardTranslationDashboard from './components/card-translation/CardTranslationDashboard';
import NotificationCenter from './components/NotificationCenter';
import oneSignalService from './services/oneSignalService';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('studiotest');

  // Initialize OneSignal once when user is authenticated
  useEffect(() => {
    let isSubscribed = true;
    
    if (isAuthenticated && token && !oneSignalService.isInitialized()) {
      oneSignalService.init().then(() => {
        if (!isSubscribed) return; // Component unmounted
        
        // Auto-subscribe if user hasn't been prompted yet
        const permission = oneSignalService.getPermissionStatus();
        if (permission === 'default') {
          // Show prompt after 5 seconds
          setTimeout(() => {
            if (isSubscribed) {
              oneSignalService.showPrompt();
            }
          }, 5000);
        } else if (permission === 'granted') {
          // Already granted, just subscribe
          oneSignalService.subscribe(token);
        }
      });
    }
    
    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated, not token

  // Update subscription token when it changes (but OneSignal already initialized)
  useEffect(() => {
    if (isAuthenticated && token && oneSignalService.isInitialized()) {
      const permission = oneSignalService.getPermissionStatus();
      if (permission === 'granted') {
        oneSignalService.subscribe(token);
      }
    }
  }, [token, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showForgotPassword) {
      return (
        <ForgotPassword 
          onBackToLogin={() => {
            setShowForgotPassword(false);
            setShowRegister(false);
          }} 
        />
      );
    }
    
    return showRegister ? (
      <RegisterForm onShowLogin={() => setShowRegister(false)} />
    ) : (
      <LoginForm 
        onShowRegister={() => setShowRegister(true)}
        onShowForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  return (
    <>
      <div className="app-header">
        <button className="menu-button" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
        <h1 className="app-title">
          <span className="app-title-line1">Translators</span>
          <span className="app-title-line2">Virtual Studio</span>
        </h1>
        <div className="app-header-actions">
          {token && <NotificationCenter token={token} />}
          <div className="user-badge">
            {user?.fullname || user?.username}
          </div>
        </div>
      </div>
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      
      <div className="app-content">
        {currentPage === 'home' && <Home />}
        {currentPage === 'monitorlive' && <MonitorLive />}
        {currentPage === 'studio' && <TranslationStudio />}
        {currentPage === 'studiotest' && <StudioTest />}
        {currentPage === 'relay-studio' && <RelayStudio />}
        {currentPage === 'sign-studio' && <SignTranslationStudio />}
        {currentPage === 'manage-source' && <ManageSourceLink />}
        {currentPage === 'admin' && <AdminDashboard />}
        {currentPage === 'card-translation' && (
          <CardTranslationDashboard 
            token={token || ''} 
            userRole={user?.role || 'translator'} 
          />
        )}
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
