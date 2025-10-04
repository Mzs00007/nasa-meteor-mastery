// Real-Time Status Indicator Component
// Shows WebSocket connection status and data stream health
import React, { useState, useEffect } from 'react';

import { useWebSocket } from '../hooks/useWebSocket';
import './RealTimeStatusIndicator.css';

const RealTimeStatusIndicator = ({
  position = 'top-right',
  showDetails = false,
}) => {
  const { connectionStatus, error, isConnected, getStats } = useWebSocket();
  const [stats, setStats] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (showDetails) {
      const interval = setInterval(() => {
        setStats(getStats());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showDetails, getStats]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#00ff00';
      case 'connecting':
        return '#ffff00';
      case 'reconnecting':
        return '#ff8800';
      case 'disconnected':
        return '#ff0000';
      default:
        return '#888888';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'LIVE DATA ACTIVE';
      case 'connecting':
        return 'CONNECTING...';
      case 'reconnecting':
        return 'RECONNECTING...';
      case 'disconnected':
        return 'OFFLINE';
      default:
        return 'UNKNOWN';
    }
  };

  const formatUptime = seconds => {
    if (!seconds) {
      return '00:00:00';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`real-time-status-indicator ${position} ${isExpanded ? 'expanded' : ''}`}
    >
      <div
        className='status-main'
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        style={{ cursor: showDetails ? 'pointer' : 'default' }}
      >
        <div
          className='status-dot'
          style={{ backgroundColor: getStatusColor() }}
        />
        <span className='status-text'>{getStatusText()}</span>
        {showDetails && (
          <span className='expand-icon'>{isExpanded ? '▼' : '▶'}</span>
        )}
      </div>

      {showDetails && isExpanded && stats && (
        <div className='status-details'>
          <div className='status-section'>
            <h4>Connection Info</h4>
            <div className='status-item'>
              <span>Status:</span>
              <span style={{ color: getStatusColor() }}>
                {connectionStatus.toUpperCase()}
              </span>
            </div>
            <div className='status-item'>
              <span>Uptime:</span>
              <span>{formatUptime(stats.uptime)}</span>
            </div>
            <div className='status-item'>
              <span>Reconnects:</span>
              <span>{stats.reconnects}</span>
            </div>
          </div>

          <div className='status-section'>
            <h4>Data Streams</h4>
            <div className='status-item'>
              <span>Active Streams:</span>
              <span>{stats.activeStreams}</span>
            </div>
            <div className='status-item'>
              <span>Messages Received:</span>
              <span>{stats.messagesReceived}</span>
            </div>
            <div className='status-item'>
              <span>Cache Size:</span>
              <span>{stats.cacheSize} items</span>
            </div>
          </div>

          <div className='status-section'>
            <h4>Performance</h4>
            <div className='status-item'>
              <span>Avg Latency:</span>
              <span>{stats.averageLatency}ms</span>
            </div>
            <div className='status-item'>
              <span>Data Rate:</span>
              <span>{stats.dataRate} msg/sec</span>
            </div>
            <div className='status-item'>
              <span>Last Update:</span>
              <span>
                {stats.lastUpdate
                  ? new Date(stats.lastUpdate).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
          </div>

          {error && (
            <div className='status-section error'>
              <h4>Error</h4>
              <div className='error-message'>{error}</div>
            </div>
          )}
        </div>
      )}

      {error && !showDetails && (
        <div className='status-error-simple'>⚠️ {error}</div>
      )}
    </div>
  );
};

export default RealTimeStatusIndicator;
