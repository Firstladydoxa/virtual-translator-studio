// ========================================
// NOTIFICATION CENTER COMPONENT
// In-app notification bell and list
// ========================================

import React, { useState, useEffect, useRef } from 'react';
import './NotificationCenter.css';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  sender?: {
    username: string;
    fullname: string;
  };
  createdAt: string;
  read: boolean;
  readAt?: string;
  action?: {
    type: string;
    url?: string;
    page?: string;
  };
}

interface NotificationCenterProps {
  token: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications/my-notifications?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark as clicked and handle action
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    // Mark as clicked
    try {
      await fetch(`${API_URL}/api/notifications/${notification._id}/clicked`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking as clicked:', error);
    }

    // Handle action
    if (notification.action) {
      if (notification.action.type === 'url' && notification.action.url) {
        window.open(notification.action.url, '_blank');
      } else if (notification.action.type === 'page' && notification.action.page) {
        // Navigate to page (you'll need to implement this based on your routing)
        window.location.href = `/${notification.action.page}`;
      }
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      assignment: '📋',
      deadline: '⏰',
      approval: '✅',
      rejection: '❌',
      announcement: '📢',
      stream: '🔴',
      comment: '💬',
      payment: '💰',
      general: '🔔'
    };
    return icons[type] || '🔔';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button 
        className="notification-bell" 
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn" 
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-meta">
                      {notification.sender && (
                        <span className="notification-sender">
                          From: {notification.sender.fullname || notification.sender.username}
                        </span>
                      )}
                      <span className="notification-time">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => deleteNotification(notification._id, e)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button onClick={() => {
                // Navigate to full notifications page
                window.location.href = '/notifications';
              }}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
