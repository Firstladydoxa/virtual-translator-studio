import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPassword from './components/ForgotPassword';
import TranslationStudio from './components/TranslationStudio';
import StudioTest from './components/StudioTest';
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
  const [currentPage, setCurrentPage] = useState('home');

  // Initialize OneSignal when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      oneSignalService.init().then(() => {
        // Auto-subscribe if user hasn't been prompted yet
        const permission = oneSignalService.getPermissionStatus();
        if (permission === 'default') {
          // Show prompt after 5 seconds
          setTimeout(() => {
            oneSignalService.showPrompt();
          }, 5000);
        } else if (permission === 'granted') {
          // Already granted, just subscribe
          oneSignalService.subscribe(token);
        }
      });
    }
  }, [isAuthenticated, token]);

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
        <h1 className="app-title">Live Translation System</h1>
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
