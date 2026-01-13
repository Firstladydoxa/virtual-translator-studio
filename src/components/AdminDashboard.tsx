import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import './AdminDashboard.css';

interface User {
  _id: string;
  username: string;
  fullname: string;
  email: string;
  country: string;
  role: 'translator' | 'admin' | 'superadmin';
  isActive: boolean;
  translationLanguage: {
    label: string;
    value: string;
  };
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Array<{ _id: string; count: number }>;
}

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      showMessage(error.message, 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }

      showMessage('User role updated successfully', 'success');
      await fetchUsers();
      await fetchStats();
    } catch (error: any) {
      console.error('Error updating role:', error);
      showMessage(error.message, 'error');
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user: ${email}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      showMessage('User deleted successfully', 'success');
      await fetchUsers();
      await fetchStats();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showMessage(error.message, 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(user =>
        user.fullname.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.country.toLowerCase().includes(term) ||
        user.translationLanguage.label.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  const isSuperadmin = currentUser?.role === 'superadmin';

  return (
    <div className="admin-dashboard">
      {message && (
        <div className={`message-notification message-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="dashboard-header">
        <h1>👑 Admin Dashboard</h1>
        <p className="user-info">
          Logged in as: <strong>{currentUser?.fullname}</strong> ({currentUser?.role})
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p className="stat-number">{stats.activeUsers}</p>
          </div>
          {stats.usersByRole.map(role => (
            <div key={role._id} className="stat-card">
              <h3>{role._id.charAt(0).toUpperCase() + role._id.slice(1)}s</h3>
              <p className="stat-number">{role.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <div className="users-section">
        <div className="section-header">
          <h2>👥 Users Management</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search users by name, email, username, country, or language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {filteredUsers.length === 0 ? (
          <div className="no-results">
            <p>🔍 No users found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Country</th>
                <th>Language</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.fullname}</td>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>{user.country}</td>
                  <td>{user.translationLanguage.label}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {isSuperadmin && user._id !== currentUser?.id && (
                      <>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user._id, e.target.value)}
                          className="role-select"
                        >
                          <option value="translator">Translator</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                        <button
                          onClick={() => deleteUser(user._id, user.email)}
                          className="btn-delete"
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {!isSuperadmin && (
                      <span className="no-action">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
