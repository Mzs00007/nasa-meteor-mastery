import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './real-time-data-feed.css';

const RealTimeDataFeed = ({ 
  onDataUpdate, 
  isActive = true, 
  updateInterval = 30000, // 30 seconds
  location = null 
}) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [dataStreams, setDataStreams] = useState({
    asteroids: { status: 'idle', lastUpdate: null, data: null },
    weather: { status: 'idle', lastUpdate: null, data: null },
    seismic: { status: 'idle', lastUpdate: null, data: null },
    atmospheric: { status: 'idle', lastUpdate: null, data: null },
    solar: { status: 'idle', lastUpdate: null, data: null }
  });
  const [errors, setErrors] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0
  });

  const intervalRefs = useRef({});
  const abortControllers = useRef({});
  const responseTimeTracker = useRef([]);

  // NASA API endpoints and configurations
  const API_ENDPOINTS = {
    asteroids: {
      url: 'https://api.nasa.gov/neo/rest/v1/feed',
      key: 'DEMO_KEY', // In production, use environment variable
      params: {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    },
    weather: {
      url: 'https://api.openweathermap.org/data/2.5/weather',
      key: 'DEMO_KEY', // In production, use environment variable
      params: location ? {
        lat: location.latitude,
        lon: location.longitude,
        appid: 'DEMO_KEY'
      } : null
    },
    seismic: {
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
      key: null,
      params: {}
    },
    atmospheric: {
      url: 'https://api.nasa.gov/planetary/apod',
      key: 'DEMO_KEY',
      params: {
        date: new Date().toISOString().split('T')[0]
      }
    },
    solar: {
      url: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json',
      key: null,
      params: {}
    }
  };

  // Generic API fetch function with error handling and timing
  const fetchData = useCallback(async (streamName, endpoint) => {
    const startTime = Date.now();
    
    try {
      // Create abort controller for this request
      abortControllers.current[streamName] = new AbortController();
      
      // Update stream status
      setDataStreams(prev => ({
        ...prev,
        [streamName]: { ...prev[streamName], status: 'loading' }
      }));

      // Build URL with parameters
      const url = new URL(endpoint.url);
      if (endpoint.params) {
        Object.entries(endpoint.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            url.searchParams.append(key, value);
          }
        });
      }

      // Add API key if required
      if (endpoint.key && endpoint.key !== 'DEMO_KEY') {
        url.searchParams.append('api_key', endpoint.key);
      }

      const response = await fetch(url.toString(), {
        signal: abortControllers.current[streamName].signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MeteorMadness/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Track response time
      responseTimeTracker.current.push(responseTime);
      if (responseTimeTracker.current.length > 100) {
        responseTimeTracker.current.shift();
      }

      // Process data based on stream type
      const processedData = processStreamData(streamName, data);

      // Update stream with successful data
      setDataStreams(prev => ({
        ...prev,
        [streamName]: {
          status: 'success',
          lastUpdate: new Date().toISOString(),
          data: processedData,
          responseTime
        }
      }));

      // Update statistics
      setStatistics(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests + 1,
        failedRequests: prev.failedRequests,
        averageResponseTime: responseTimeTracker.current.reduce((a, b) => a + b, 0) / responseTimeTracker.current.length
      }));

      // Notify parent component
      if (onDataUpdate) {
        onDataUpdate(streamName, processedData);
      }

      return processedData;

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Handle different error types
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Request cancelled';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Network error - check connection';
      }

      // Update stream with error
      setDataStreams(prev => ({
        ...prev,
        [streamName]: {
          ...prev[streamName],
          status: 'error',
          error: errorMessage,
          responseTime
        }
      }));

      // Add to error log
      setErrors(prev => [
        ...prev.slice(-9), // Keep last 10 errors
        {
          id: Date.now(),
          stream: streamName,
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      ]);

      // Update statistics
      setStatistics(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests,
        failedRequests: prev.failedRequests + 1,
        averageResponseTime: responseTimeTracker.current.reduce((a, b) => a + b, 0) / responseTimeTracker.current.length
      }));

      console.error(`Data feed error for ${streamName}:`, error);
      return null;
    }
  }, [onDataUpdate]);

  // Process different types of stream data
  const processStreamData = (streamName, rawData) => {
    switch (streamName) {
      case 'asteroids':
        return processAsteroidData(rawData);
      case 'weather':
        return processWeatherData(rawData);
      case 'seismic':
        return processSeismicData(rawData);
      case 'atmospheric':
        return processAtmosphericData(rawData);
      case 'solar':
        return processSolarData(rawData);
      default:
        return rawData;
    }
  };

  // Asteroid data processing
  const processAsteroidData = (data) => {
    if (!data.near_earth_objects) return null;

    const asteroids = [];
    Object.values(data.near_earth_objects).forEach(dayAsteroids => {
      dayAsteroids.forEach(asteroid => {
        asteroids.push({
          id: asteroid.id,
          name: asteroid.name,
          diameter: {
            min: asteroid.estimated_diameter?.kilometers?.estimated_diameter_min || 0,
            max: asteroid.estimated_diameter?.kilometers?.estimated_diameter_max || 0
          },
          velocity: parseFloat(asteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || 0),
          distance: parseFloat(asteroid.close_approach_data?.[0]?.miss_distance?.kilometers || 0),
          isPotentiallyHazardous: asteroid.is_potentially_hazardous_asteroid,
          closeApproachDate: asteroid.close_approach_data?.[0]?.close_approach_date,
          absoluteMagnitude: asteroid.absolute_magnitude_h
        });
      });
    });

    return {
      count: asteroids.length,
      asteroids: asteroids.slice(0, 10), // Limit to 10 most relevant
      nearestApproach: asteroids.reduce((nearest, current) => 
        current.distance < nearest.distance ? current : nearest, 
        asteroids[0] || { distance: Infinity }
      ),
      largestAsteroid: asteroids.reduce((largest, current) => 
        current.diameter.max > largest.diameter.max ? current : largest,
        asteroids[0] || { diameter: { max: 0 } }
      )
    };
  };

  // Weather data processing
  const processWeatherData = (data) => {
    if (!data.main) return null;

    return {
      temperature: data.main.temp - 273.15, // Convert from Kelvin to Celsius
      pressure: data.main.pressure, // hPa
      humidity: data.main.humidity, // %
      windSpeed: data.wind?.speed || 0, // m/s
      windDirection: data.wind?.deg || 0, // degrees
      visibility: data.visibility || 0, // meters
      cloudCover: data.clouds?.all || 0, // %
      weather: data.weather?.[0]?.description || 'unknown',
      location: data.name,
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon
      }
    };
  };

  // Seismic data processing
  const processSeismicData = (data) => {
    if (!data.features) return null;

    const earthquakes = data.features.map(feature => ({
      id: feature.id,
      magnitude: feature.properties.mag,
      location: feature.properties.place,
      time: new Date(feature.properties.time),
      coordinates: {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        depth: feature.geometry.coordinates[2]
      },
      type: feature.properties.type
    }));

    return {
      count: earthquakes.length,
      earthquakes: earthquakes.slice(0, 5), // Most recent 5
      largestMagnitude: Math.max(...earthquakes.map(eq => eq.magnitude || 0)),
      averageMagnitude: earthquakes.reduce((sum, eq) => sum + (eq.magnitude || 0), 0) / earthquakes.length
    };
  };

  // Atmospheric data processing
  const processAtmosphericData = (data) => {
    return {
      title: data.title,
      explanation: data.explanation,
      date: data.date,
      mediaType: data.media_type,
      url: data.url,
      hdurl: data.hdurl
    };
  };

  // Solar data processing
  const processSolarData = (data) => {
    if (!Array.isArray(data)) return null;

    const recentData = data.slice(-24); // Last 24 hours
    const fluxValues = recentData.map(item => parseFloat(item.flux));

    return {
      currentFlux: fluxValues[fluxValues.length - 1] || 0,
      averageFlux: fluxValues.reduce((a, b) => a + b, 0) / fluxValues.length,
      maxFlux: Math.max(...fluxValues),
      minFlux: Math.min(...fluxValues),
      trend: fluxValues.length > 1 ? 
        (fluxValues[fluxValues.length - 1] > fluxValues[fluxValues.length - 2] ? 'increasing' : 'decreasing') : 'stable',
      dataPoints: recentData.length
    };
  };

  // Start data feeds
  const startDataFeeds = useCallback(() => {
    if (!isActive) return;

    setConnectionStatus('connecting');

    Object.entries(API_ENDPOINTS).forEach(([streamName, endpoint]) => {
      // Skip weather if no location provided
      if (streamName === 'weather' && !location) return;

      // Initial fetch
      fetchData(streamName, endpoint);

      // Set up interval for continuous updates
      intervalRefs.current[streamName] = setInterval(() => {
        fetchData(streamName, endpoint);
      }, updateInterval);
    });

    setConnectionStatus('connected');
  }, [isActive, location, updateInterval, fetchData]);

  // Stop data feeds
  const stopDataFeeds = useCallback(() => {
    setConnectionStatus('disconnecting');

    // Clear all intervals
    Object.values(intervalRefs.current).forEach(intervalId => {
      if (intervalId) clearInterval(intervalId);
    });
    intervalRefs.current = {};

    // Abort any ongoing requests
    Object.values(abortControllers.current).forEach(controller => {
      if (controller) controller.abort();
    });
    abortControllers.current = {};

    // Reset stream statuses
    setDataStreams(prev => {
      const newStreams = {};
      Object.keys(prev).forEach(key => {
        newStreams[key] = { ...prev[key], status: 'idle' };
      });
      return newStreams;
    });

    setConnectionStatus('disconnected');
  }, []);

  // Effect to manage data feed lifecycle
  useEffect(() => {
    if (isActive) {
      startDataFeeds();
    } else {
      stopDataFeeds();
    }

    return () => {
      stopDataFeeds();
    };
  }, [isActive, startDataFeeds, stopDataFeeds]);

  // Manual refresh function
  const refreshStream = useCallback((streamName) => {
    const endpoint = API_ENDPOINTS[streamName];
    if (endpoint) {
      fetchData(streamName, endpoint);
    }
  }, [fetchData]);

  // Clear errors
  const clearErrors = () => {
    setErrors([]);
  };

  // Get stream status indicator
  const getStatusIndicator = (status) => {
    switch (status) {
      case 'loading': return { icon: '🔄', color: '#3b82f6', label: 'Loading' };
      case 'success': return { icon: '✅', color: '#22c55e', label: 'Active' };
      case 'error': return { icon: '❌', color: '#ef4444', label: 'Error' };
      default: return { icon: '⚪', color: '#6b7280', label: 'Idle' };
    }
  };

  // Format time since last update
  const formatTimeSince = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s ago` : `${seconds}s ago`;
  };

  return (
    <motion.div 
      className="real-time-data-feed"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="feed-header">
        <div className="feed-title">
          <h3>🛰️ Live Data Feed</h3>
          <div className={`connection-status ${connectionStatus}`}>
            <div className="status-dot"></div>
            <span>{connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}</span>
          </div>
        </div>
        
        <div className="feed-controls">
          <button 
            className="refresh-all-btn"
            onClick={() => Object.keys(API_ENDPOINTS).forEach(refreshStream)}
            disabled={connectionStatus !== 'connected'}
          >
            🔄 Refresh All
          </button>
          {errors.length > 0 && (
            <button className="clear-errors-btn" onClick={clearErrors}>
              🗑️ Clear Errors
            </button>
          )}
        </div>
      </div>

      <div className="data-streams">
        {Object.entries(dataStreams).map(([streamName, stream]) => {
          const status = getStatusIndicator(stream.status);
          
          return (
            <motion.div 
              key={streamName}
              className={`data-stream ${stream.status}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stream-header">
                <div className="stream-info">
                  <span className="stream-icon">{getStreamIcon(streamName)}</span>
                  <span className="stream-name">{streamName.charAt(0).toUpperCase() + streamName.slice(1)}</span>
                </div>
                
                <div className="stream-status">
                  <span className="status-icon" style={{ color: status.color }}>
                    {status.icon}
                  </span>
                  <span className="status-label">{status.label}</span>
                </div>
                
                <button 
                  className="refresh-stream-btn"
                  onClick={() => refreshStream(streamName)}
                  disabled={stream.status === 'loading'}
                >
                  🔄
                </button>
              </div>

              <div className="stream-content">
                {stream.status === 'loading' && (
                  <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <span>Fetching data...</span>
                  </div>
                )}

                {stream.status === 'error' && (
                  <div className="error-indicator">
                    <span className="error-message">{stream.error}</span>
                  </div>
                )}

                {stream.status === 'success' && stream.data && (
                  <div className="data-preview">
                    {renderStreamData(streamName, stream.data)}
                  </div>
                )}

                <div className="stream-meta">
                  <span className="last-update">
                    Last update: {formatTimeSince(stream.lastUpdate)}
                  </span>
                  {stream.responseTime && (
                    <span className="response-time">
                      Response: {stream.responseTime}ms
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Statistics Panel */}
      <div className="feed-statistics">
        <h4>📊 Feed Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Requests:</span>
            <span className="stat-value">{statistics.totalRequests}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Success Rate:</span>
            <span className="stat-value">
              {statistics.totalRequests > 0 
                ? ((statistics.successfulRequests / statistics.totalRequests) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Response:</span>
            <span className="stat-value">{Math.round(statistics.averageResponseTime)}ms</span>
          </div>
        </div>
      </div>

      {/* Error Log */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div 
            className="error-log"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4>⚠️ Recent Errors</h4>
            <div className="error-list">
              {errors.slice(-3).map(error => (
                <div key={error.id} className="error-item">
                  <span className="error-stream">{error.stream}</span>
                  <span className="error-message">{error.message}</span>
                  <span className="error-time">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Helper functions for rendering
  function getStreamIcon(streamName) {
    const icons = {
      asteroids: '☄️',
      weather: '🌤️',
      seismic: '🌍',
      atmospheric: '🌌',
      solar: '☀️'
    };
    return icons[streamName] || '📡';
  }

  function renderStreamData(streamName, data) {
    switch (streamName) {
      case 'asteroids':
        return (
          <div className="asteroid-data">
            <div className="data-item">
              <span>Near-Earth Objects:</span>
              <span>{data.count}</span>
            </div>
            {data.nearestApproach && (
              <div className="data-item">
                <span>Nearest Approach:</span>
                <span>{(data.nearestApproach.distance / 1000000).toFixed(2)} million km</span>
              </div>
            )}
          </div>
        );
      
      case 'weather':
        return (
          <div className="weather-data">
            <div className="data-item">
              <span>Temperature:</span>
              <span>{data.temperature.toFixed(1)}°C</span>
            </div>
            <div className="data-item">
              <span>Pressure:</span>
              <span>{data.pressure} hPa</span>
            </div>
            <div className="data-item">
              <span>Wind:</span>
              <span>{data.windSpeed.toFixed(1)} m/s</span>
            </div>
          </div>
        );
      
      case 'seismic':
        return (
          <div className="seismic-data">
            <div className="data-item">
              <span>Recent Events:</span>
              <span>{data.count}</span>
            </div>
            <div className="data-item">
              <span>Largest Magnitude:</span>
              <span>{data.largestMagnitude.toFixed(1)}</span>
            </div>
          </div>
        );
      
      case 'solar':
        return (
          <div className="solar-data">
            <div className="data-item">
              <span>X-ray Flux:</span>
              <span>{data.currentFlux.toExponential(2)}</span>
            </div>
            <div className="data-item">
              <span>Trend:</span>
              <span>{data.trend}</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="generic-data">
            <span>Data available</span>
          </div>
        );
    }
  }
};

export default RealTimeDataFeed;