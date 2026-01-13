import React from 'react';
import { useAppStore } from '../store/useAppStore';
import '../styles/Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPage, onNavigate }) => {
  const { user, logout } = useAppStore();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isDesigner = user?.role === 'designer';

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'monitorlive', label: 'Monitor Live', icon: '📡' },
    { id: 'studiotest', label: 'Translation Studio (Audio Mix)', icon: '🎚️' },
    // Translation Studio menu item removed - using Studio Test exclusively
  ];

  // Add Card Translation for all users (designers, admins, translators)
  menuItems.push({ id: 'card-translation', label: 'Card Translation', icon: '🎨' });

  // Add admin menu items for admin/superadmin users
  if (isAdmin) {
    menuItems.push({ id: 'manage-source', label: 'Manage Source Link', icon: '🔗' });
    menuItems.push({ id: 'admin', label: 'Admin Dashboard', icon: '👑' });
  }

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <h3>{user?.fullname || user?.username}</h3>
            <p>{user?.email}</p>
            {user?.role && (
              <span className={`role-badge role-${user.role}`}>
                {user.role}
              </span>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
