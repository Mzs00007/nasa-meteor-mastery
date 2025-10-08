import React, { useState, useEffect } from 'react';
import './AdvancedAnalyticsDashboard.css';

// Mock data generator for real-time simulation
const generateMockData = () => ({
  asteroidTracking: {
    totalTracked: Math.floor(Math.random() * 50) + 28000,
    newDetections: Math.floor(Math.random() * 10) + 5,
    highRisk: Math.floor(Math.random() * 5) + 2,
    accuracy: (Math.random() * 2 + 98).toFixed(1)
  },
  systemHealth: {
    telescopes: Math.floor(Math.random() * 10) + 85,
    dataProcessing: Math.floor(Math.random() * 5) + 92,
    networkStatus: Math.floor(Math.random() * 8) + 88,
    storage: Math.floor(Math.random() * 15) + 75
  },
  missionStats: {
    uptime: (Math.random() * 2 + 98.5).toFixed(2),
    dataProcessed: (Math.random() * 50 + 1200).toFixed(1),
    alertsGenerated: Math.floor(Math.random() * 20) + 45,
    successfulPredictions: Math.floor(Math.random() * 5) + 95
  },
  threatAssessment: {
    currentThreats: Math.floor(Math.random() * 3) + 1,
    riskLevel: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
    nextApproach: Math.floor(Math.random() * 30) + 1,
    impactProbability: (Math.random() * 0.01).toFixed(4)
  }
});

const MetricCard = ({ title, value, unit, trend, status }) => (
  <div className="metric-card">
    <div className="metric-header">
      <h3>{title}</h3>
      <div className={`status-indicator ${status}`}></div>
    </div>
    <div className="metric-value">
      <span className="value">{value}</span>
      <span className="unit">{unit}</span>
    </div>
    {trend && (
      <div className={`trend ${trend > 0 ? 'positive' : 'negative'}`}>
        {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const SystemStatusPanel = ({ data }) => (
  <div className="system-status-panel">
    <h2>System Health</h2>
    <div className="status-grid">
      <div className="status-item">
        <span className="status-label">Telescopes</span>
        <div className="status-bar">
          <div 
            className="status-fill" 
            style={{ width: `${data.telescopes}%` }}
          ></div>
        </div>
        <span className="status-value">{data.telescopes}%</span>
      </div>
      <div className="status-item">
        <span className="status-label">Data Processing</span>
        <div className="status-bar">
          <div 
            className="status-fill" 
            style={{ width: `${data.dataProcessing}%` }}
          ></div>
        </div>
        <span className="status-value">{data.dataProcessing}%</span>
      </div>
      <div className="status-item">
        <span className="status-label">Network</span>
        <div className="status-bar">
          <div 
            className="status-fill" 
            style={{ width: `${data.networkStatus}%` }}
          ></div>
        </div>
        <span className="status-value">{data.networkStatus}%</span>
      </div>
      <div className="status-item">
        <span className="status-label">Storage</span>
        <div className="status-bar">
          <div 
            className="status-fill" 
            style={{ width: `${data.storage}%` }}
          ></div>
        </div>
        <span className="status-value">{data.storage}%</span>
      </div>
    </div>
  </div>
);

const ThreatAssessmentPanel = ({ data }) => (
  <div className="threat-assessment-panel">
    <h2>Threat Assessment</h2>
    <div className="threat-grid">
      <div className="threat-item">
        <span className="threat-label">Current Threats</span>
        <span className="threat-value">{data.currentThreats}</span>
      </div>
      <div className="threat-item">
        <span className="threat-label">Risk Level</span>
        <span className={`threat-value risk-${data.riskLevel.toLowerCase()}`}>
          {data.riskLevel}
        </span>
      </div>
      <div className="threat-item">
        <span className="threat-label">Next Approach</span>
        <span className="threat-value">{data.nextApproach} days</span>
      </div>
      <div className="threat-item">
        <span className="threat-label">Impact Probability</span>
        <span className="threat-value">{data.impactProbability}%</span>
      </div>
    </div>
  </div>
);

const AdvancedAnalyticsDashboard = () => {
  const [data, setData] = useState(generateMockData());
  const [activeTab, setActiveTab] = useState('overview');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        setData(generateMockData());
      }, 3000); // Update every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="advanced-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Advanced Analytics Center</h1>
          <p>Real-time monitoring and threat assessment</p>
        </div>
        <div className="header-controls">
          <button 
            className={`live-toggle ${isLive ? 'active' : ''}`}
            onClick={() => setIsLive(!isLive)}
          >
            <div className="live-indicator"></div>
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          Tracking
        </button>
        <button 
          className={`nav-tab ${activeTab === 'systems' ? 'active' : ''}`}
          onClick={() => setActiveTab('systems')}
        >
          Systems
        </button>
        <button 
          className={`nav-tab ${activeTab === 'threats' ? 'active' : ''}`}
          onClick={() => setActiveTab('threats')}
        >
          Threats
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <MetricCard 
                title="Total Tracked"
                value={data.asteroidTracking.totalTracked.toLocaleString()}
                unit="NEOs"
                status="active"
              />
              <MetricCard 
                title="New Detections"
                value={data.asteroidTracking.newDetections}
                unit="today"
                trend={Math.random() > 0.5 ? 5 : -2}
                status="active"
              />
              <MetricCard 
                title="System Uptime"
                value={data.missionStats.uptime}
                unit="%"
                status="active"
              />
              <MetricCard 
                title="Detection Accuracy"
                value={data.asteroidTracking.accuracy}
                unit="%"
                status="active"
              />
            </div>
            <div className="panels-grid">
              <SystemStatusPanel data={data.systemHealth} />
              <ThreatAssessmentPanel data={data.threatAssessment} />
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="tracking-tab">
            <div className="metrics-grid">
              <MetricCard 
                title="High Risk Objects"
                value={data.asteroidTracking.highRisk}
                unit="NEOs"
                status="warning"
              />
              <MetricCard 
                title="Data Processed"
                value={data.missionStats.dataProcessed}
                unit="TB"
                status="active"
              />
              <MetricCard 
                title="Successful Predictions"
                value={data.missionStats.successfulPredictions}
                unit="%"
                status="active"
              />
              <MetricCard 
                title="Alerts Generated"
                value={data.missionStats.alertsGenerated}
                unit="today"
                status="active"
              />
            </div>
          </div>
        )}

        {activeTab === 'systems' && (
          <div className="systems-tab">
            <SystemStatusPanel data={data.systemHealth} />
            <div className="system-details">
              <h3>System Performance Metrics</h3>
              <div className="performance-grid">
                <div className="performance-item">
                  <span>CPU Usage</span>
                  <span>67%</span>
                </div>
                <div className="performance-item">
                  <span>Memory Usage</span>
                  <span>82%</span>
                </div>
                <div className="performance-item">
                  <span>Disk I/O</span>
                  <span>45%</span>
                </div>
                <div className="performance-item">
                  <span>Network Throughput</span>
                  <span>1.2 GB/s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="threats-tab">
            <ThreatAssessmentPanel data={data.threatAssessment} />
            <div className="threat-details">
              <h3>Detailed Threat Analysis</h3>
              <div className="threat-list">
                <div className="threat-entry">
                  <span className="threat-name">2024 XY-47</span>
                  <span className="threat-distance">0.05 AU</span>
                  <span className="threat-size">~150m</span>
                  <span className="threat-risk risk-medium">MEDIUM</span>
                </div>
                <div className="threat-entry">
                  <span className="threat-name">2024 AB-12</span>
                  <span className="threat-distance">0.12 AU</span>
                  <span className="threat-size">~85m</span>
                  <span className="threat-risk risk-low">LOW</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;