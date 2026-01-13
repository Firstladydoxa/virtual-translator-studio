import React from 'react';
import { LiveStatus } from '../types';
import './LiveStatusIndicator.css';

interface LiveStatusIndicatorProps {
  status: LiveStatus;
}

const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({ status }) => {
  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'LIVE';
      case 'connecting':
        return 'CONNECTING';
      case 'offline':
      default:
        return 'OFFLINE';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#44ff44';
      case 'connecting':
        return '#ffaa44';
      case 'offline':
      default:
        return '#ff4444';
    }
  };

  return (
    <div className="live-status">
      <div className={`indicator-dot ${status}`}></div>
      <span style={{ color: getStatusColor() }}>{getStatusText()}</span>
    </div>
  );
};

export default LiveStatusIndicator;
