/**
 * ADMIN TIME TRACKING DASHBOARD
 * Monitor translator hours, payments, and approve tracking records
 */

import React, { useState, useEffect } from 'react';
import './AdminTimeTracking.css';

interface Session {
  autoStartTime?: string;
  autoEndTime?: string;
  autoTrackedHours?: number;
  manualClockIn?: string;
  manualClockOut?: string;
  manualTrackedHours?: number;
  calculatedHours: number;
  sessionType: string;
  isActive: boolean;
  notes?: string;
}

interface TimeTracking {
  _id: string;
  translatorId: {
    _id: string;
    fullname: string;
    email: string;
    translationLanguage?: { label: string; value: string };
  };
  requestId: {
    _id: string;
    programTitle: string;
    startDate: string;
    endDate: string;
  };
  language: string;
  sessions: Session[];
  totalAutoHours: number;
  totalManualHours: number;
  totalCalculatedHours: number;
  currentAutoHours?: number;
  currentManualHours?: number;
  currentCalculatedHours?: number;
  hasActiveSession?: boolean;
  hourlyRate: number;
  totalEarnings: number;
  translatorShare: number;
  serviceShare: number;
  paymentStatus: 'pending' | 'approved' | 'paid' | 'disputed';
  adminAdjustedHours?: number;
  adjustmentReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProgramSummary {
  requestId: string;
  programTitle: string;
  startDate: string;
  endDate: string;
  status: string;
  totalTranslators: number;
  totalHours: number;
  totalEarnings: number;
  totalTranslatorShare: number;
  totalServiceShare: number;
  languages: string[];
  trackings: TimeTracking[];
}

interface ProgramListItem {
  _id: string;
  programTitle: string;
  startDate: string;
  endDate: string;
  requestStatus: string;
  targetLanguages: Array<{language: string; translatorId?: any}>;
  clientId: {
    fullName?: string;
    companyName?: string;
  };
}

const AdminTimeTracking: React.FC = () => {
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [programsList, setProgramsList] = useState<ProgramListItem[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<TimeTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [activeTab, setActiveTab] = useState<'programs' | 'pending'>('programs');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingTracking, setAdjustingTracking] = useState<TimeTracking | null>(null);
  const [adjustHours, setAdjustHours] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ministryprogs.tniglobal.org';

  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPendingPayments(), loadProgramsList()]);
      showMessage('Time tracking data loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('Failed to load time tracking data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProgramsList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ts/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch programs list');

      const data = await response.json();
      // Filter for programs that are in progress or completed (likely to have tracking data)
      const filteredPrograms = (data.data?.requests || []).filter((r: ProgramListItem) => 
        ['in_progress', 'completed', 'confirmed'].includes(r.requestStatus)
      );
      setProgramsList(filteredPrograms);
    } catch (error) {
      console.error('Error loading programs list:', error);
    }
  };

  const loadPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ts/time-tracking/pending-payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch pending payments');

      const data = await response.json();
      setPendingPayments(data.data?.trackings || []);
    } catch (error) {
      console.error('Error loading pending payments:', error);
      throw error;
    }
  };

  const loadProgramTracking = async (reqId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ts/time-tracking/request/${reqId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch program tracking');

      const data = await response.json();
      const { trackings, aggregated } = data.data;

      // Format the data for display
      if (trackings && trackings.length > 0) {
        // Calculate totals using current hours for active sessions
        let totalHours = 0;
        let totalEarnings = 0;
        let totalTranslatorShare = 0;
        let totalServiceShare = 0;

        trackings.forEach((t: TimeTracking) => {
          // Use current hours for active sessions, otherwise use stored hours
          const hours = t.hasActiveSession 
            ? (t.adminAdjustedHours || t.currentCalculatedHours || 0)
            : (t.adminAdjustedHours || t.totalCalculatedHours);
          
          totalHours += hours;
          
          // Recalculate earnings based on current hours
          const earnings = hours * t.hourlyRate;
          totalEarnings += earnings;
          totalTranslatorShare += earnings * 0.25; // 25% to translator
          totalServiceShare += earnings * 0.75; // 75% to service
        });

        const programData: ProgramSummary = {
          requestId: reqId,
          programTitle: trackings[0].requestId?.programTitle || 'Unknown Program',
          startDate: trackings[0].requestId?.startDate || new Date().toISOString(),
          endDate: trackings[0].requestId?.endDate || new Date().toISOString(),
          status: 'in_progress',
          totalTranslators: trackings.length,
          totalHours: totalHours,
          totalEarnings: totalEarnings,
          totalTranslatorShare: totalTranslatorShare,
          totalServiceShare: totalServiceShare,
          languages: aggregated?.hoursByLanguage ? Object.keys(aggregated.hoursByLanguage) : [],
          trackings: trackings
        };
        setSelectedProgram(programData);
        showMessage('Program tracking loaded successfully', 'success');
      } else {
        showMessage('No tracking data found for this program', 'info');
      }
    } catch (error) {
      console.error('Error loading program tracking:', error);
      showMessage('Failed to load program tracking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProgram = (reqId: string) => {
    loadProgramTracking(reqId);
  };

  const handleStopTracking = async (tracking: TimeTracking) => {
    if (!window.confirm(`Stop tracking for ${tracking.translatorId.fullname} - ${tracking.language}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ts/time-tracking/${tracking._id}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to stop tracking');

      showMessage('Tracking session stopped successfully', 'success');
      
      // Reload the program tracking to refresh data
      if (selectedProgram) {
        loadProgramTracking(selectedProgram.requestId);
      }
      loadPendingPayments();
    } catch (error) {
      console.error('Error stopping tracking:', error);
      showMessage('Failed to stop tracking session', 'error');
    }
  };

  const adjustHoursHandler = async () => {
    if (!adjustingTracking || !adjustHours || !adjustReason) {
      showMessage('Please enter hours and reason', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ts/time-tracking/${adjustingTracking._id}/adjust`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hours: parseFloat(adjustHours),
          reason: adjustReason
        })
      });

      if (!response.ok) throw new Error('Failed to adjust hours');

      showMessage('Hours adjusted successfully', 'success');
      setAdjustModalOpen(false);
      setAdjustingTracking(null);
      setAdjustHours('');
      setAdjustReason('');
      await loadData();
    } catch (error) {
      console.error('Error adjusting hours:', error);
      showMessage('Failed to adjust hours', 'error');
    }
  };

  const approvePayment = async (trackingId: string) => {
    if (!window.confirm('Are you sure you want to approve this payment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ts/time-tracking/${trackingId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to approve payment');

      showMessage('Payment approved successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error approving payment:', error);
      showMessage('Failed to approve payment', 'error');
    }
  };

  const exportToCSV = (trackings: TimeTracking[]) => {
    const headers = ['Translator', 'Email', 'Language', 'Program', 'Auto Hours', 'Manual Hours', 'Total Hours', 'Hourly Rate', 'Total Earnings', 'Translator Share (25%)', 'Service Share (75%)', 'Payment Status'];
    const rows = trackings.map(t => [
      t.translatorId.fullname,
      t.translatorId.email,
      t.language,
      t.requestId.programTitle,
      t.totalAutoHours.toFixed(2),
      t.totalManualHours.toFixed(2),
      (t.adminAdjustedHours || t.totalCalculatedHours).toFixed(2),
      `$${t.hourlyRate}`,
      `$${t.totalEarnings.toFixed(2)}`,
      `$${t.translatorShare.toFixed(2)}`,
      `$${t.serviceShare.toFixed(2)}`,
      t.paymentStatus
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'paid': return 'status-paid';
      case 'disputed': return 'status-disputed';
      default: return '';
    }
  };

  const filteredPayments = pendingPayments.filter(t =>
    t.translatorId.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.translatorId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.requestId.programTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-time-tracking">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading time tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-time-tracking">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>⏱️ Time Tracking Dashboard</h1>
          <p className="subtitle">Monitor translator hours and manage payments</p>
        </div>
        <button className="btn-export" onClick={() => exportToCSV(pendingPayments)}>
          📥 Export All to CSV
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'programs' ? 'active' : ''}`}
          onClick={() => setActiveTab('programs')}
        >
          📊 By Program
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          💰 Pending Payments ({pendingPayments.length})
        </button>
      </div>

      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <div className="tab-content">
          {!selectedProgram ? (
            <>
              <div className="info-box">
                <h3>📋 Select a Program</h3>
                <p>Choose from the list of translation programs below to view time tracking details.</p>
              </div>

              {loadingPrograms ? (
                <div className="loading-spinner">Loading programs...</div>
              ) : programsList.length === 0 ? (
                <div className="empty-state">
                  <p>No programs with tracking data found.</p>
                </div>
              ) : (
                <div className="programs-grid">
                  {programsList.map(program => (
                    <div 
                      key={program._id}
                      className="program-card"
                      onClick={() => handleSelectProgram(program._id)}
                    >
                      <div className="program-card-header">
                        <h3>{program.programTitle}</h3>
                        <span className={`status-badge status-${program.requestStatus}`}>
                          {program.requestStatus}
                        </span>
                      </div>
                      <div className="program-card-body">
                        <p className="program-meta">
                          📅 {formatDate(program.startDate)} → {formatDate(program.endDate)}
                        </p>
                        <p className="program-meta">
                          🌍 {program.targetLanguages.map(l => l.language).join(', ')}
                        </p>
                        {program.clientId && (
                          <p className="program-meta">
                            👤 {program.clientId.fullName || program.clientId.companyName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="program-details">
              <div className="program-header">
                <div>
                  <button 
                    className="btn-back"
                    onClick={() => setSelectedProgram(null)}
                  >
                    ← Back to Programs
                  </button>
                  <h2>{selectedProgram.programTitle}</h2>
                  <p className="program-meta">
                    📅 {formatDate(selectedProgram.startDate)} • 
                    👥 {selectedProgram.totalTranslators} translator(s) • 
                    🌍 {selectedProgram.languages.join(', ')}
                  </p>
                </div>
                <button className="btn-export-small" onClick={() => exportToCSV(selectedProgram.trackings)}>
                  📥 Export
                </button>
              </div>

              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-icon">⏱️</div>
                  <div>
                    <div className="summary-value">{selectedProgram.totalHours.toFixed(1)} hrs</div>
                    <div className="summary-label">Total Hours</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">💵</div>
                  <div>
                    <div className="summary-value">${selectedProgram.totalEarnings.toFixed(2)}</div>
                    <div className="summary-label">Total Earnings</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">👨‍💼</div>
                  <div>
                    <div className="summary-value">${selectedProgram.totalTranslatorShare.toFixed(2)}</div>
                    <div className="summary-label">Translator Share (25%)</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">🏢</div>
                  <div>
                    <div className="summary-value">${selectedProgram.totalServiceShare.toFixed(2)}</div>
                    <div className="summary-label">Service Share (75%)</div>
                  </div>
                </div>
              </div>

              {/* Translator Tracking Table */}
              <div className="tracking-table">
                <h3>📋 Translator Details</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Translator</th>
                      <th>Language</th>
                      <th>Auto Hours</th>
                      <th>Manual Hours</th>
                      <th>Total Hours</th>
                      <th>Earnings</th>
                      <th>Share (25%)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProgram.trackings.map(tracking => (
                      <tr key={tracking._id}>
                        <td>
                          <strong>{tracking.translatorId.fullname}</strong>
                          <br />
                          <small>{tracking.translatorId.email}</small>
                        </td>
                        <td>{tracking.language}</td>
                        <td>
                          {tracking.hasActiveSession ? (
                            <span title="Active session - real-time hours">
                              {(tracking.currentAutoHours || 0).toFixed(2)} ⏱️
                            </span>
                          ) : (
                            (tracking.totalAutoHours || 0).toFixed(2)
                          )}
                        </td>
                        <td>
                          {tracking.hasActiveSession ? (
                            <span title="Active session - real-time hours">
                              {(tracking.currentManualHours || 0).toFixed(2)} ⏱️
                            </span>
                          ) : (
                            (tracking.totalManualHours || 0).toFixed(2)
                          )}
                        </td>
                        <td>
                          <strong>
                            {tracking.hasActiveSession ? (
                              <span title="Active session - real-time hours" style={{color: '#2196F3'}}>
                                {(tracking.adminAdjustedHours || tracking.currentCalculatedHours || 0).toFixed(2)} ⏱️
                              </span>
                            ) : (
                              (tracking.adminAdjustedHours || tracking.totalCalculatedHours).toFixed(2)
                            )}
                          </strong>
                          {tracking.adminAdjustedHours && (
                            <span className="adjusted-badge" title={tracking.adjustmentReason}>
                              ✏️ Adjusted
                            </span>
                          )}
                        </td>
                        <td>
                          ${tracking.hasActiveSession
                            ? ((tracking.adminAdjustedHours || tracking.currentCalculatedHours || 0) * tracking.hourlyRate).toFixed(2)
                            : tracking.totalEarnings.toFixed(2)
                          }
                        </td>
                        <td>
                          <strong>
                            ${tracking.hasActiveSession
                              ? ((tracking.adminAdjustedHours || tracking.currentCalculatedHours || 0) * tracking.hourlyRate * 0.25).toFixed(2)
                              : tracking.translatorShare.toFixed(2)
                            }
                          </strong>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(tracking.paymentStatus)}`}>
                            {tracking.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {tracking.hasActiveSession && (
                              <button
                                className="btn-icon"
                                style={{backgroundColor: '#dc2626', color: 'white', marginRight: '5px'}}
                                onClick={() => handleStopTracking(tracking)}
                                title="Stop tracking session"
                              >
                                ⏹️ Stop
                              </button>
                            )}
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setAdjustingTracking(tracking);
                                setAdjustHours((tracking.adminAdjustedHours || tracking.totalCalculatedHours).toString());
                                setAdjustReason(tracking.adjustmentReason || '');
                                setAdjustModalOpen(true);
                              }}
                              title="Adjust hours"
                            >
                              ✏️
                            </button>
                            {tracking.paymentStatus === 'pending' && (
                              <button
                                className="btn-icon btn-approve"
                                onClick={() => approvePayment(tracking._id)}
                                title="Approve payment"
                              >
                                ✅
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Payments Tab */}
      {activeTab === 'pending' && (
        <div className="tab-content">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Search by translator name, email, program, or language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {filteredPayments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3>No Pending Payments</h3>
              <p>All time tracking records have been reviewed and approved.</p>
            </div>
          ) : (
            <div className="payments-grid">
              {filteredPayments.map(tracking => (
                <div key={tracking._id} className="payment-card">
                  <div className="payment-header">
                    <div>
                      <h3>{tracking.translatorId.fullname}</h3>
                      <p className="payment-meta">{tracking.translatorId.email}</p>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(tracking.paymentStatus)}`}>
                      {tracking.paymentStatus}
                    </span>
                  </div>

                  <div className="payment-details">
                    <div className="payment-row">
                      <span>🎬 Program:</span>
                      <strong>{tracking.requestId.programTitle}</strong>
                    </div>
                    <div className="payment-row">
                      <span>🌍 Language:</span>
                      <strong>{tracking.language}</strong>
                    </div>
                    <div className="payment-row">
                      <span>⚡ Auto Hours:</span>
                      <span>
                        {tracking.hasActiveSession ? (
                          <span title="Active session - real-time hours" style={{color: '#2196F3'}}>
                            {formatDuration(tracking.currentAutoHours || 0)} ⏱️
                          </span>
                        ) : (
                          formatDuration(tracking.totalAutoHours)
                        )}
                      </span>
                    </div>
                    <div className="payment-row">
                      <span>👆 Manual Hours:</span>
                      <span>
                        {tracking.hasActiveSession ? (
                          <span title="Active session - real-time hours" style={{color: '#2196F3'}}>
                            {formatDuration(tracking.currentManualHours || 0)} ⏱️
                          </span>
                        ) : (
                          formatDuration(tracking.totalManualHours)
                        )}
                      </span>
                    </div>
                    <div className="payment-row highlight">
                      <span>⏱️ Total Hours:</span>
                      <strong>
                        {tracking.hasActiveSession ? (
                          <span title="Active session - real-time hours" style={{color: '#2196F3'}}>
                            {formatDuration(tracking.adminAdjustedHours || tracking.currentCalculatedHours || 0)} ⏱️
                          </span>
                        ) : (
                          formatDuration(tracking.adminAdjustedHours || tracking.totalCalculatedHours)
                        )}
                      </strong>
                    </div>
                    <div className="payment-row">
                      <span>💵 Total Earnings:</span>
                      <strong>
                        ${tracking.hasActiveSession 
                          ? ((tracking.adminAdjustedHours || tracking.currentCalculatedHours || 0) * tracking.hourlyRate).toFixed(2)
                          : tracking.totalEarnings.toFixed(2)
                        }
                      </strong>
                    </div>
                    <div className="payment-row highlight">
                      <span>👨‍💼 Translator Share (25%):</span>
                      <strong className="share-amount">
                        ${tracking.hasActiveSession
                          ? ((tracking.adminAdjustedHours || tracking.currentCalculatedHours || 0) * tracking.hourlyRate * 0.25).toFixed(2)
                          : tracking.translatorShare.toFixed(2)
                        }
                      </strong>
                    </div>
                  </div>

                  {tracking.adminAdjustedHours && (
                    <div className="adjustment-notice">
                      <strong>✏️ Admin Adjusted:</strong> {tracking.adjustmentReason}
                    </div>
                  )}

                  <div className="payment-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setAdjustingTracking(tracking);
                        setAdjustHours((tracking.adminAdjustedHours || tracking.totalCalculatedHours).toString());
                        setAdjustReason(tracking.adjustmentReason || '');
                        setAdjustModalOpen(true);
                      }}
                    >
                      ✏️ Adjust Hours
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => approvePayment(tracking._id)}
                    >
                      ✅ Approve Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Adjust Hours Modal */}
      {adjustModalOpen && adjustingTracking && (
        <div className="modal-overlay" onClick={() => setAdjustModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Adjust Hours</h2>
              <button className="modal-close" onClick={() => setAdjustModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <p><strong>Translator:</strong> {adjustingTracking.translatorId.fullname}</p>
                <p><strong>Program:</strong> {adjustingTracking.requestId.programTitle}</p>
                <p><strong>Language:</strong> {adjustingTracking.language}</p>
                <p><strong>Current Hours:</strong> Auto: {adjustingTracking.totalAutoHours.toFixed(2)}, Manual: {adjustingTracking.totalManualHours.toFixed(2)}, Total: {adjustingTracking.totalCalculatedHours.toFixed(2)}</p>
              </div>

              <div className="form-group">
                <label>Adjusted Hours:</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={adjustHours}
                  onChange={(e) => setAdjustHours(e.target.value)}
                  placeholder="Enter adjusted hours"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Reason for Adjustment:</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Explain why hours were adjusted (required)"
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="earnings-preview">
                <p><strong>💰 Earnings Preview:</strong></p>
                <p>Total: ${(parseFloat(adjustHours || '0') * adjustingTracking.hourlyRate).toFixed(2)}</p>
                <p>Translator Share (25%): <strong>${(parseFloat(adjustHours || '0') * adjustingTracking.hourlyRate * 0.25).toFixed(2)}</strong></p>
                <p>Service Share (75%): ${(parseFloat(adjustHours || '0') * adjustingTracking.hourlyRate * 0.75).toFixed(2)}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setAdjustModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={adjustHoursHandler}>
                💾 Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimeTracking;
