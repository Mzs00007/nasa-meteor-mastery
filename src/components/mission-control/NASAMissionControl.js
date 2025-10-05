import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useWebSocket } from '../../hooks/useWebSocket';
import './NASAMissionControl.css';

const NASAMissionControl = () => {
  const navigate = useNavigate();
  const { isConnected, data } = useWebSocket();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [missionStatus, setMissionStatus] = useState('NOMINAL');
  const [selectedLayout, setSelectedLayout] = useState('multi-monitor');
  const [alertLevel, setAlertLevel] = useState('GREEN');
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Data states for different systems
  const [telemetryData, setTelemetryData] = useState(null);
  const [issData, setISSData] = useState(null);
  const [spaceWeatherData, setSpaceWeatherData] = useState(null);
  const [satelliteData, setSatelliteData] = useState(null);
  const [asteroidData, setAsteroidData] = useState(null);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Process WebSocket data
  useEffect(() => {
    if (data) {
      switch (data.type) {
        case 'telemetry_update':
          setTelemetryData(data.data);
          break;
        case 'iss_position':
          setISSData(data.data);
          break;
        case 'space_weather_update':
        case 'detailed_space_weather':
          setSpaceWeatherData(data.data);
          break;
        case 'starlink_constellation':
        case 'satellite_passes':
          setSatelliteData(data.data);
          break;
        case 'asteroid_data':
        case 'neo_data':
          setAsteroidData(data.data);
          break;
        default:
          break;
      }
    }
  }, [data]);

  // Monitor system health and generate alerts
  useEffect(() => {
    const alerts = [];

    if (spaceWeatherData) {
      if (spaceWeatherData.kp_index > 5) {
        alerts.push({
          id: 'space-weather-1',
          level: 'WARNING',
          system: 'Space Weather',
          message: `High geomagnetic activity detected (Kp: ${spaceWeatherData.kp_index})`,
          timestamp: new Date(),
        });
      }

      if (spaceWeatherData.solar_wind_speed > 600) {
        alerts.push({
          id: 'space-weather-2',
          level: 'CAUTION',
          system: 'Space Weather',
          message: `Elevated solar wind speed: ${spaceWeatherData.solar_wind_speed} km/s`,
          timestamp: new Date(),
        });
      }
    }

    if (telemetryData && telemetryData.spacecraft) {
      if (telemetryData.spacecraft.power?.battery_charge < 20) {
        alerts.push({
          id: 'power-1',
          level: 'WARNING',
          system: 'Power',
          message: `Low battery charge: ${telemetryData.spacecraft.power.battery_charge}%`,
          timestamp: new Date(),
        });
      }

      if (telemetryData.spacecraft.thermal?.cpu_temperature > 80) {
        alerts.push({
          id: 'thermal-1',
          level: 'CAUTION',
          system: 'Thermal',
          message: `High CPU temperature: ${telemetryData.spacecraft.thermal.cpu_temperature}°C`,
          timestamp: new Date(),
        });
      }
    }

    setActiveAlerts(alerts);

    // Determine overall alert level
    if (alerts.some(alert => alert.level === 'CRITICAL')) {
      setAlertLevel('RED');
      setMissionStatus('CRITICAL');
    } else if (alerts.some(alert => alert.level === 'WARNING')) {
      setAlertLevel('YELLOW');
      setMissionStatus('CAUTION');
    } else if (alerts.some(alert => alert.level === 'CAUTION')) {
      setAlertLevel('YELLOW');
      setMissionStatus('NOMINAL');
    } else {
      setAlertLevel('GREEN');
      setMissionStatus('NOMINAL');
    }
  }, [spaceWeatherData, telemetryData]);

  const formatTime = date => {
    return `${date.toISOString().replace('T', ' ').substring(0, 19)} UTC`;
  };

  const getAlertColor = level => {
    switch (level) {
      case 'CRITICAL':
        return '#ff0000';
      case 'WARNING':
        return '#ff8800';
      case 'CAUTION':
        return '#ffff00';
      default:
        return '#00ff88';
    }
  };

  const navigateToSystem = system => {
    switch (system) {
      case 'iss':
        navigate('/iss-tracking');
        break;
      case 'satellites':
        navigate('/satellite-tracking');
        break;
      case 'space-weather':
        navigate('/space-weather');
        break;
      case 'orbital-mechanics':
        navigate('/orbital-mechanics');
        break;
      case 'asteroid-tracking':
        navigate('/asteroid-tracking');
        break;
      default:
        break;
    }
  };

  const handleSystemPanelKeyPress = (e, system) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigateToSystem(system);
    }
  };

  const renderSystemPanel = (title, system, data, icon) => (
    <div 
      className='system-panel' 
      onClick={() => navigateToSystem(system)}
      onKeyDown={(e) => handleSystemPanelKeyPress(e, system)}
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${title} system`}
    >
      <div className='panel-header'>
        <div className='panel-title'>
          <span className='panel-icon'>{icon}</span>
          <h3>{title}</h3>
        </div>
        <div className='panel-status'>
          <div className={`status-indicator ${data ? 'online' : 'offline'}`}>
            <div className='status-dot' />
            {data ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </div>
      <div className='panel-content'>
        {data ? (
          <div className='data-display'>{renderSystemData(system, data)}</div>
        ) : (
          <div className='no-data'>No data available</div>
        )}
      </div>
      <div className='panel-footer'>
        <button
          className='detail-btn'
          title={`View detailed information and controls for ${title}`}
        >
          View Details →
        </button>
      </div>
    </div>
  );

  const renderSystemData = (system, data) => {
    switch (system) {
      case 'iss':
        return (
          <div className='data-grid'>
            <div className='data-item'>
              <span className='label'>Latitude:</span>
              <span className='value'>{data.latitude?.toFixed(4)}°</span>
            </div>
            <div className='data-item'>
              <span className='label'>Longitude:</span>
              <span className='value'>{data.longitude?.toFixed(4)}°</span>
            </div>
            <div className='data-item'>
              <span className='label'>Altitude:</span>
              <span className='value'>{data.altitude?.toFixed(2)} km</span>
            </div>
            <div className='data-item'>
              <span className='label'>Velocity:</span>
              <span className='value'>{data.velocity?.toFixed(2)} km/s</span>
            </div>
          </div>
        );
      case 'space-weather':
        return (
          <div className='data-grid'>
            <div className='data-item'>
              <span className='label'>Solar Wind:</span>
              <span className='value'>
                {data.solar_wind_speed || 'N/A'} km/s
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>Kp Index:</span>
              <span className='value'>{data.kp_index || 'N/A'}</span>
            </div>
            <div className='data-item'>
              <span className='label'>X-ray Flux:</span>
              <span className='value'>{data.xray_flux || 'N/A'}</span>
            </div>
            <div className='data-item'>
              <span className='label'>Proton Flux:</span>
              <span className='value'>{data.proton_flux || 'N/A'}</span>
            </div>
          </div>
        );
      case 'satellites':
        return (
          <div className='data-grid'>
            <div className='data-item'>
              <span className='label'>Starlink Active:</span>
              <span className='value'>{data.starlink_count || 0}</span>
            </div>
            <div className='data-item'>
              <span className='label'>GPS Satellites:</span>
              <span className='value'>{data.gps_count || 0}</span>
            </div>
            <div className='data-item'>
              <span className='label'>Weather Sats:</span>
              <span className='value'>{data.weather_count || 0}</span>
            </div>
            <div className='data-item'>
              <span className='label'>Debris Objects:</span>
              <span className='value'>{data.debris_count || 0}</span>
            </div>
          </div>
        );
      default:
        return (
          <div className='data-grid'>
            <div className='data-item'>
              <span className='label'>Status:</span>
              <span className='value'>Operational</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className='nasa-mission-control'>
      {/* Mission Control Header */}
      <div className='mission-header'>
        <div className='header-left'>
          <div className='nasa-logo'>
            <span className='logo-text'>NASA</span>
          </div>
          <div className='mission-info'>
            <h1 className='mission-title'>MISSION CONTROL CENTER</h1>
            <p className='mission-subtitle'>Meteor Mastery Operations</p>
          </div>
        </div>

        <div className='header-center'>
          <div className='mission-clock'>
            <div className='time-display'>
              <span className='time-label'>MISSION TIME</span>
              <span className='time-value'>{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>

        <div className='header-right'>
          <div className='mission-status'>
            <div className='status-display'>
              <span className='status-label'>MISSION STATUS</span>
              <span className={`status-value ${missionStatus?.toLowerCase()}`}>
                {missionStatus}
              </span>
            </div>
          </div>

          <div className='alert-level'>
            <div className='alert-display'>
              <span className='alert-label'>ALERT LEVEL</span>
              <div
                className='alert-indicator'
                style={{ backgroundColor: getAlertColor(alertLevel) }}
              >
                {alertLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Controls */}
      <div className='layout-controls'>
        <div className='control-group'>
          <label>Layout:</label>
          <select
            value={selectedLayout}
            onChange={e => setSelectedLayout(e.target.value)}
            className='layout-selector'
          >
            <option value='multi-monitor'>Multi-Monitor</option>
            <option value='single-screen'>Single Screen</option>
            <option value='compact'>Compact View</option>
            <option value='overview'>Overview</option>
          </select>
        </div>

        <div className='connection-status'>
          <div
            className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}
          >
            <div className='connection-dot' />
            <span>Telemetry {isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`mission-content ${selectedLayout}`}>
        {/* System Panels Grid */}
        <div className='systems-grid'>
          {renderSystemPanel('ISS Tracking', 'iss', issData, '🛰️')}

          {renderSystemPanel(
            'Space Weather',
            'space-weather',
            spaceWeatherData,
            '☀️'
          )}

          {renderSystemPanel(
            'Satellite Constellations',
            'satellites',
            satelliteData,
            '🌐'
          )}

          {renderSystemPanel(
            'Orbital Mechanics',
            'orbital-mechanics',
            telemetryData,
            '🪐'
          )}

          {renderSystemPanel(
            'Asteroid Tracking',
            'asteroid-tracking',
            asteroidData,
            '☄️'
          )}

          {/* Spacecraft Telemetry Panel */}
          <div className='system-panel telemetry-panel'>
            <div className='panel-header'>
              <div className='panel-title'>
                <span className='panel-icon'>🚀</span>
                <h3>Spacecraft Telemetry</h3>
              </div>
              <div className='panel-status'>
                <div
                  className={`status-indicator ${telemetryData ? 'online' : 'offline'}`}
                >
                  <div className='status-dot' />
                  {telemetryData ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
            </div>
            <div className='panel-content'>
              {telemetryData?.spacecraft ? (
                <div className='telemetry-grid'>
                  <div className='telemetry-section'>
                    <h4>Power System</h4>
                    <div className='data-item'>
                      <span className='label'>Battery:</span>
                      <span className='value'>
                        {telemetryData.spacecraft.power?.battery_charge?.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                    <div className='data-item'>
                      <span className='label'>Solar Array:</span>
                      <span className='value'>
                        {telemetryData.spacecraft.power?.solar_array_voltage?.toFixed(
                          1
                        )}
                        V
                      </span>
                    </div>
                  </div>

                  <div className='telemetry-section'>
                    <h4>Thermal</h4>
                    <div className='data-item'>
                      <span className='label'>CPU Temp:</span>
                      <span className='value'>
                        {telemetryData.spacecraft.thermal?.cpu_temperature?.toFixed(
                          1
                        )}
                        °C
                      </span>
                    </div>
                    <div className='data-item'>
                      <span className='label'>Battery Temp:</span>
                      <span className='value'>
                        {telemetryData.spacecraft.thermal?.battery_temperature?.toFixed(
                          1
                        )}
                        °C
                      </span>
                    </div>
                  </div>

                  <div className='telemetry-section'>
                    <h4>Attitude</h4>
                    <div className='data-item'>
                      <span className='label'>Roll:</span>
                      <span className='value'>
                        {telemetryData.spacecraft.attitude?.roll?.toFixed(1)}°
                      </span>
                    </div>
                    <div className='data-item'>
                      <span className='label'>Pitch:</span>
                      <span className='value'>
                        {telemetryData.spacecraft.attitude?.pitch?.toFixed(1)}°
                      </span>
                    </div>
                    <div className='data-item'>
                      <span className='label'>Yaw:</span>
                      <span className='value'>
                        {telemetryData.spacecraft.attitude?.yaw?.toFixed(1)}°
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='no-data'>No telemetry data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        {activeAlerts.length > 0 && (
          <div className='alerts-panel'>
            <div className='alerts-header'>
              <h3>🚨 Active Alerts</h3>
              <span className='alert-count'>{activeAlerts.length}</span>
            </div>
            <div className='alerts-list'>
              {activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.level?.toLowerCase()}`}
                >
                  <div className='alert-header'>
                    <span className='alert-system'>{alert.system}</span>
                    <span className='alert-level'>{alert.level}</span>
                    <span className='alert-time'>
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className='alert-message'>{alert.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className='mission-footer'>
        <div className='footer-left'>
          <span className='footer-item'>
            <strong>Ground Station:</strong> Houston, TX
          </span>
          <span className='footer-item'>
            <strong>Uplink:</strong> {isConnected ? 'NOMINAL' : 'LOST'}
          </span>
        </div>

        <div className='footer-center'>
          <span className='footer-item'>
            <strong>Active Systems:</strong>{' '}
            {
              [issData, spaceWeatherData, satelliteData, telemetryData].filter(
                Boolean
              ).length
            }
            /4
          </span>
        </div>

        <div className='footer-right'>
          <span className='footer-item'>
            <strong>Data Rate:</strong> {isConnected ? '2.4 Mbps' : '0 Mbps'}
          </span>
          <span className='footer-item'>
            <strong>Latency:</strong> {isConnected ? '45ms' : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NASAMissionControl;
