// React Hook for WebSocket Integration
// Provides easy access to real-time NASA data streams
import { useState, useEffect, useCallback, useRef } from 'react';

import webSocketService from '../services/websocket-service';

// Main WebSocket hook
export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      // Connect to WebSocket service
      webSocketService.connect();

      // Subscribe to connection status updates
      const unsubscribe = webSocketService.subscribe(
        'connection_status',
        status => {
          setConnectionStatus(status.status);
          if (status.error) {
            setError(status.error);
          } else {
            setError(null);
          }
        }
      );

      // Subscribe to connection errors
      const unsubscribeError = webSocketService.subscribe(
        'connection_error',
        errorData => {
          setError(errorData.error);
        }
      );

      // Check initial connection status
      const initialStatus = webSocketService.getConnectionStatus();
      if (initialStatus && initialStatus.status) {
        setConnectionStatus(initialStatus.status);
      }

      isInitialized.current = true;

      return () => {
        unsubscribe();
        unsubscribeError();
      };
    }
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setConnectionStatus('disconnected');
  }, []);

  const getStats = useCallback(() => {
    return webSocketService.getStats();
  }, []);

  return {
    connectionStatus,
    error,
    disconnect,
    getStats,
    isConnected: connectionStatus === 'connected',
  };
};

// Hook for ISS and satellite data
export const useISSData = () => {
  const [issPosition, setIssPosition] = useState(null);
  const [advancedIssData, setAdvancedIssData] = useState(null);
  const [starlinkData, setStarlinkData] = useState(null);
  const [spaceDebris, setSpaceDebris] = useState(null);
  const [satellitePasses, setSatellitePasses] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      webSocketService.subscribe('iss_position', data => {
        setIssPosition(data);
        setLoading(false);
      }),
      webSocketService.subscribe('advanced_iss_data', data => {
        setAdvancedIssData(data);
      }),
      webSocketService.subscribe('starlink_constellation', data => {
        setStarlinkData(data);
      }),
      webSocketService.subscribe('space_debris', data => {
        setSpaceDebris(data);
      }),
      webSocketService.subscribe('satellite_passes', data => {
        setSatellitePasses(data);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return {
    issPosition,
    advancedIssData,
    starlinkData,
    spaceDebris,
    satellitePasses,
    loading,
  };
};

// Hook for NASA comprehensive data
export const useNASAData = () => {
  const [neoData, setNeoData] = useState(null);
  const [marsWeather, setMarsWeather] = useState(null);
  const [earthImagery, setEarthImagery] = useState(null);
  const [epicImages, setEpicImages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      webSocketService.subscribe('comprehensive_neo_data', data => {
        setNeoData(data);
        setLoading(false);
      }),
      webSocketService.subscribe('mars_weather', data => {
        setMarsWeather(data);
      }),
      webSocketService.subscribe('earth_imagery', data => {
        setEarthImagery(data);
      }),
      webSocketService.subscribe('epic_images', data => {
        setEpicImages(data);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return {
    neoData,
    marsWeather,
    earthImagery,
    epicImages,
    loading,
  };
};

// Hook for space weather data
export const useSpaceWeather = () => {
  const [spaceWeather, setSpaceWeather] = useState(null);
  const [solarActivity, setSolarActivity] = useState(null);
  const [geomagneticData, setGeomagneticData] = useState(null);
  const [auroraForecast, setAuroraForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      webSocketService.subscribe('detailed_space_weather', data => {
        setSpaceWeather(data);
        setLoading(false);
      }),
      webSocketService.subscribe('solar_activity_detailed', data => {
        setSolarActivity(data);
      }),
      webSocketService.subscribe('geomagnetic_data', data => {
        setGeomagneticData(data);
      }),
      webSocketService.subscribe('aurora_forecast', data => {
        setAuroraForecast(data);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return {
    spaceWeather,
    solarActivity,
    geomagneticData,
    auroraForecast,
    loading,
  };
};

// Hook for Earth observation data
export const useEarthObservation = () => {
  const [satelliteImagery, setSatelliteImagery] = useState(null);
  const [environmentalIndicators, setEnvironmentalIndicators] = useState(null);
  const [naturalDisasters, setNaturalDisasters] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      webSocketService.subscribe('satellite_imagery', data => {
        setSatelliteImagery(data);
        setLoading(false);
      }),
      webSocketService.subscribe('environmental_indicators', data => {
        setEnvironmentalIndicators(data);
      }),
      webSocketService.subscribe('natural_disasters', data => {
        setNaturalDisasters(data);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return {
    satelliteImagery,
    environmentalIndicators,
    naturalDisasters,
    loading,
  };
};

// Hook for mission control telemetry
export const useMissionControl = () => {
  const [telemetry, setTelemetry] = useState(null);
  const [orbitalMechanics, setOrbitalMechanics] = useState(null);
  const [realTimeEvents, setRealTimeEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      webSocketService.subscribe('mission_control_telemetry', data => {
        setTelemetry(data);
        setLoading(false);
      }),
      webSocketService.subscribe('orbital_mechanics', data => {
        setOrbitalMechanics(data);
      }),
      webSocketService.subscribe('real_time_events', data => {
        setRealTimeEvents(prevEvents => {
          // Keep only the last 50 events to prevent memory issues
          const newEvents = [...prevEvents, ...data.events];
          return newEvents.slice(-50);
        });
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const clearEvents = useCallback(() => {
    setRealTimeEvents([]);
  }, []);

  return {
    telemetry,
    orbitalMechanics,
    realTimeEvents,
    loading,
    clearEvents,
  };
};

// Hook for legacy data streams (backward compatibility)
export const useLegacyData = () => {
  const [neoData, setNeoData] = useState(null);
  const [spaceWeather, setSpaceWeather] = useState(null);
  const [seismicData, setSeismicData] = useState(null);
  const [solarActivity, setSolarActivity] = useState(null);
  const [atmosphericData, setAtmosphericData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      webSocketService.subscribe('neo_data', data => {
        setNeoData(data);
        setLoading(false);
      }),
      webSocketService.subscribe('space_weather', data => {
        setSpaceWeather(data);
      }),
      webSocketService.subscribe('seismic_data', data => {
        setSeismicData(data);
      }),
      webSocketService.subscribe('solar_activity', data => {
        setSolarActivity(data);
      }),
      webSocketService.subscribe('atmospheric_data', data => {
        setAtmosphericData(data);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return {
    neoData,
    spaceWeather,
    seismicData,
    solarActivity,
    atmosphericData,
    loading,
  };
};

// Hook for custom data subscriptions
export const useCustomWebSocketData = (eventType, initialValue = null) => {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe(eventType, newData => {
      setData(newData);
      setLoading(false);
      setError(null);
    });

    // Check if we have cached data
    const cachedData = webSocketService.getCachedData(eventType);
    if (cachedData) {
      setData(cachedData.data);
      setLoading(false);
    }

    return unsubscribe;
  }, [eventType]);

  const requestUpdate = useCallback(() => {
    webSocketService.requestData(eventType);
  }, [eventType]);

  return {
    data,
    loading,
    error,
    requestUpdate,
  };
};

// Hook for WebSocket service control
export const useWebSocketControl = () => {
  const updateInterval = useCallback((streamType, interval) => {
    webSocketService.updateStreamInterval(streamType, interval);
  }, []);

  const requestData = useCallback(dataType => {
    webSocketService.requestData(dataType);
  }, []);

  const clearCache = useCallback(() => {
    webSocketService.clearCache();
  }, []);

  const getAllCachedData = useCallback(() => {
    return webSocketService.getAllCachedData();
  }, []);

  return {
    updateInterval,
    requestData,
    clearCache,
    getAllCachedData,
  };
};
