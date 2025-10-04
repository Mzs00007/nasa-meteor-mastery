import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useWebSocket } from '../../hooks/useWebSocket';
import './SpaceWeatherMonitor.css';

const SpaceWeatherMonitor = () => {
  // State for space weather data
  const [spaceWeatherData, setSpaceWeatherData] = useState(null);
  const [solarActivity, setSolarActivity] = useState(null);
  const [geomagneticData, setGeomagneticData] = useState(null);
  const [auroraForecast, setAuroraForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedDataType, setSelectedDataType] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Chart references
  const solarWindChartRef = useRef(null);
  const xrayFluxChartRef = useRef(null);
  const kpIndexChartRef = useRef(null);

  // WebSocket connection
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  // Space weather scale classifications
  const GEOMAGNETIC_SCALES = {
    G0: {
      level: 'No Storm',
      color: '#4CAF50',
      description: 'Normal conditions',
    },
    G1: {
      level: 'Minor',
      color: '#FFC107',
      description: 'Weak power grid fluctuations',
    },
    G2: {
      level: 'Moderate',
      color: '#FF9800',
      description: 'High-latitude power systems affected',
    },
    G3: {
      level: 'Strong',
      color: '#FF5722',
      description: 'Power systems voltage corrections required',
    },
    G4: {
      level: 'Severe',
      color: '#F44336',
      description: 'Possible widespread voltage control problems',
    },
    G5: {
      level: 'Extreme',
      color: '#9C27B0',
      description: 'Complete HF radio blackout',
    },
  };

  const SOLAR_RADIATION_SCALES = {
    S0: {
      level: 'No Storm',
      color: '#4CAF50',
      description: 'Normal conditions',
    },
    S1: {
      level: 'Minor',
      color: '#FFC107',
      description: 'Minor impacts on HF radio',
    },
    S2: {
      level: 'Moderate',
      color: '#FF9800',
      description: 'Small effects on polar flights',
    },
    S3: {
      level: 'Strong',
      color: '#FF5722',
      description: 'Radiation hazard avoidance recommended',
    },
    S4: {
      level: 'Severe',
      color: '#F44336',
      description: 'Unavoidable radiation hazard',
    },
    S5: {
      level: 'Extreme',
      color: '#9C27B0',
      description: 'Unavoidable high radiation hazard',
    },
  };

  const RADIO_BLACKOUT_SCALES = {
    R0: {
      level: 'No Blackout',
      color: '#4CAF50',
      description: 'Normal conditions',
    },
    R1: {
      level: 'Minor',
      color: '#FFC107',
      description: 'Weak HF radio degradation',
    },
    R2: {
      level: 'Moderate',
      color: '#FF9800',
      description: 'Limited HF radio blackout',
    },
    R3: {
      level: 'Strong',
      color: '#FF5722',
      description: 'Wide area HF radio blackout',
    },
    R4: {
      level: 'Severe',
      color: '#F44336',
      description: 'HF radio blackout on entire sunlit side',
    },
    R5: {
      level: 'Extreme',
      color: '#9C27B0',
      description: 'Complete HF radio blackout',
    },
  };

  // Subscribe to WebSocket data streams
  useEffect(() => {
    if (isConnected) {
      const handlers = {
        space_weather_update: data => {
          setSpaceWeatherData(data);
          setIsLoading(false);
        },
        solar_activity_detailed: data => {
          setSolarActivity(data);
        },
        geomagnetic_data: data => {
          setGeomagneticData(data);
        },
        aurora_forecast: data => {
          setAuroraForecast(data);
        },
        space_weather_alerts: data => {
          setAlerts(data.alerts || []);
        },
      };

      // Subscribe to all space weather data streams
      Object.entries(handlers).forEach(([event, handler]) => {
        subscribe(event, handler);
      });

      return () => {
        Object.keys(handlers).forEach(event => {
          unsubscribe(event);
        });
      };
    }
  }, [isConnected, subscribe, unsubscribe]);

  // Format timestamp for display
  const formatTimestamp = useCallback(timestamp => {
    return new Date(timestamp).toLocaleString();
  }, []);

  // Get severity color for alerts
  const getAlertSeverityColor = useCallback(severity => {
    const colors = {
      extreme: '#9C27B0',
      severe: '#F44336',
      strong: '#FF5722',
      moderate: '#FF9800',
      minor: '#FFC107',
      normal: '#4CAF50',
    };
    return colors[severity] || '#757575';
  }, []);

  // Get space weather scale info
  const getScaleInfo = useCallback((scale, type) => {
    const scales = {
      geomagnetic: GEOMAGNETIC_SCALES,
      solar_radiation: SOLAR_RADIATION_SCALES,
      radio_blackout: RADIO_BLACKOUT_SCALES,
    };
    return (
      scales[type]?.[scale] || {
        level: 'Unknown',
        color: '#757575',
        description: 'No data',
      }
    );
  }, []);

  // Render current conditions overview
  const renderOverview = () => (
    <div className='space-weather-overview'>
      <div className='overview-grid'>
        {/* Overall Status */}
        <div className='status-card'>
          <h3>Overall Status</h3>
          <div
            className={`status-indicator ${spaceWeatherData?.overall_status || 'normal'}`}
          >
            <div className='status-dot' />
            <span>
              {(spaceWeatherData?.overall_status || 'normal').toUpperCase()}
            </span>
          </div>
          <p className='status-description'>
            {spaceWeatherData?.overall_status === 'severe' &&
              'Severe space weather conditions detected'}
            {spaceWeatherData?.overall_status === 'active' &&
              'Active space weather conditions'}
            {spaceWeatherData?.overall_status === 'minor' &&
              'Minor space weather activity'}
            {spaceWeatherData?.overall_status === 'normal' &&
              'Normal space weather conditions'}
          </p>
        </div>

        {/* Solar Activity */}
        <div className='activity-card'>
          <h3>Solar Activity</h3>
          <div className='activity-data'>
            <div className='data-item'>
              <span className='label'>X-ray Class:</span>
              <span className='value'>
                {solarActivity?.current_xray_class || 'A'}
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>Flares (24h):</span>
              <span className='value'>
                {solarActivity?.flare_count_24h || 0}
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>Sunspot Number:</span>
              <span className='value'>
                {solarActivity?.sunspot_number || 'N/A'}
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>Activity Level:</span>
              <span
                className={`value activity-${solarActivity?.activity_level || 'low'}`}
              >
                {(solarActivity?.activity_level || 'low').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Geomagnetic Activity */}
        <div className='activity-card'>
          <h3>Geomagnetic Activity</h3>
          <div className='activity-data'>
            <div className='data-item'>
              <span className='label'>Kp Index:</span>
              <span className='value'>
                {geomagneticData?.current_kp?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>Storm Level:</span>
              <span className='value'>
                {geomagneticData?.storm_level || 'None'}
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>Dst Index:</span>
              <span className='value'>
                {geomagneticData?.dst_index || 'N/A'} nT
              </span>
            </div>
          </div>
        </div>

        {/* Solar Wind */}
        <div className='activity-card'>
          <h3>Solar Wind</h3>
          <div className='activity-data'>
            <div className='data-item'>
              <span className='label'>Speed:</span>
              <span className='value'>
                {spaceWeatherData?.solar_wind_speed?.toFixed(0) || 'N/A'} km/s
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>Density:</span>
              <span className='value'>
                {spaceWeatherData?.solar_wind_density?.toFixed(1) || 'N/A'}{' '}
                p/cm³
              </span>
            </div>
            <div className='data-item'>
              <span className='label'>IMF:</span>
              <span className='value'>
                {spaceWeatherData?.interplanetary_magnetic_field?.toFixed(1) ||
                  'N/A'}{' '}
                nT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Space Weather Scales */}
      <div className='weather-scales'>
        <h3>NOAA Space Weather Scales</h3>
        <div className='scales-grid'>
          {spaceWeatherData?.space_weather_scale &&
            Object.entries(spaceWeatherData.space_weather_scale).map(
              ([type, scale]) => {
                const scaleInfo = getScaleInfo(scale.level, type);
                return (
                  <div key={type} className='scale-card'>
                    <h4>{type.replace('_', ' ').toUpperCase()}</h4>
                    <div
                      className='scale-indicator'
                      style={{ backgroundColor: scaleInfo.color }}
                    >
                      {scale.level}
                    </div>
                    <p className='scale-description'>{scaleInfo.description}</p>
                  </div>
                );
              }
            )}
        </div>
      </div>
    </div>
  );

  // Render alerts panel
  const renderAlerts = () => (
    <div className='alerts-panel'>
      <h3>Active Alerts & Warnings</h3>
      {alerts.length > 0 ? (
        <div className='alerts-list'>
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`alert-item severity-${alert.severity}`}
            >
              <div className='alert-header'>
                <span className='alert-type'>{alert.type}</span>
                <span className='alert-time'>
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
              <div className='alert-message'>{alert.message}</div>
              {alert.impact && (
                <div className='alert-impact'>
                  <strong>Impact:</strong> {alert.impact}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className='no-alerts'>
          <div className='no-alerts-icon'>✓</div>
          <p>No active space weather alerts</p>
        </div>
      )}
    </div>
  );

  // Render aurora forecast
  const renderAuroraForecast = () => (
    <div className='aurora-forecast'>
      <h3>Aurora Forecast</h3>
      {auroraForecast ? (
        <div className='aurora-data'>
          <div className='aurora-activity'>
            <span className='label'>Current Activity:</span>
            <span className={`value activity-${auroraForecast.activity_level}`}>
              {auroraForecast.activity_level?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          <div className='aurora-visibility'>
            <span className='label'>Visibility Latitude:</span>
            <span className='value'>
              {auroraForecast.visibility_latitude || 'N/A'}°
            </span>
          </div>
          <div className='aurora-forecast-text'>
            <p>{auroraForecast.forecast_text || 'No forecast available'}</p>
          </div>
        </div>
      ) : (
        <div className='no-data'>Aurora forecast data not available</div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className='space-weather-monitor loading'>
        <div className='loading-content'>
          <div className='loading-spinner' />
          <p>Loading space weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-weather-monitor'>
      <div className='monitor-header'>
        <h1>Space Weather Monitor</h1>
        <div className='header-controls'>
          <div className='data-type-selector'>
            <label>View:</label>
            <select
              value={selectedDataType}
              onChange={e => setSelectedDataType(e.target.value)}
            >
              <option value='overview'>Overview</option>
              <option value='solar'>Solar Activity</option>
              <option value='geomagnetic'>Geomagnetic</option>
              <option value='radiation'>Radiation</option>
              <option value='aurora'>Aurora</option>
            </select>
          </div>
          <div className='time-range-selector'>
            <label>Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={e => setSelectedTimeRange(e.target.value)}
            >
              <option value='1h'>1 Hour</option>
              <option value='6h'>6 Hours</option>
              <option value='24h'>24 Hours</option>
              <option value='7d'>7 Days</option>
            </select>
          </div>
          <div className='connection-status'>
            <div
              className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}
            />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      <div className='monitor-content'>
        {selectedDataType === 'overview' && renderOverview()}

        {selectedDataType === 'solar' && (
          <div className='solar-activity-panel'>
            <h2>Solar Activity Details</h2>
            <div className='solar-charts'>
              <div className='chart-container'>
                <h3>X-ray Flux</h3>
                <div ref={xrayFluxChartRef} className='chart-placeholder'>
                  X-ray flux chart will be rendered here
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDataType === 'geomagnetic' && (
          <div className='geomagnetic-panel'>
            <h2>Geomagnetic Activity</h2>
            <div className='geomagnetic-charts'>
              <div className='chart-container'>
                <h3>Kp Index</h3>
                <div ref={kpIndexChartRef} className='chart-placeholder'>
                  Kp index chart will be rendered here
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDataType === 'radiation' && (
          <div className='radiation-panel'>
            <h2>Radiation Environment</h2>
            <div className='radiation-data'>
              <div className='radiation-levels'>
                <h3>Current Radiation Levels</h3>
                <div className='radiation-item'>
                  <span className='label'>Cosmic Ray Intensity:</span>
                  <span className='value'>Normal</span>
                </div>
                <div className='radiation-item'>
                  <span className='label'>Proton Flux:</span>
                  <span className='value'>Low</span>
                </div>
                <div className='radiation-item'>
                  <span className='label'>Electron Flux:</span>
                  <span className='value'>Moderate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDataType === 'aurora' && renderAuroraForecast()}

        {/* Always show alerts if there are any */}
        {alerts.length > 0 && (
          <div className='alerts-section'>{renderAlerts()}</div>
        )}
      </div>

      <div className='monitor-footer'>
        <div className='data-sources'>
          <span>Data Sources: NOAA SWPC, NASA, ESA</span>
        </div>
        <div className='last-update'>
          <span>
            Last Update:{' '}
            {spaceWeatherData?.timestamp
              ? formatTimestamp(spaceWeatherData.timestamp)
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SpaceWeatherMonitor;
