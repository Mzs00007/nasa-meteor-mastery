import { useState, useEffect, useCallback } from 'react';

import webSocketService from '../services/websocket-service';

/**
 * Custom hook for meteorological simulation data
 * Provides real-time weather simulation data, statistics, and extreme event monitoring
 */
export const useMeteorologicalData = () => {
  const [simulationData, setSimulationData] = useState(null);
  const [extremeEvents, setExtremeEvents] = useState([]);
  const [weatherStats, setWeatherStats] = useState(null);
  const [climateForecast, setClimateForecast] = useState(null);
  const [atmosphericConditions, setAtmosphericConditions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Handle meteorological simulation data
  const handleSimulationData = useCallback(data => {
    setSimulationData(data);
    setLastUpdate(new Date());
    setIsLoading(false);
    setError(null);
  }, []);

  // Handle extreme weather events
  const handleExtremeEvents = useCallback(data => {
    setExtremeEvents(data);
    setLastUpdate(new Date());
  }, []);

  // Handle weather statistics
  const handleWeatherStats = useCallback(data => {
    setWeatherStats(data);
    setLastUpdate(new Date());
  }, []);

  // Handle climate forecast
  const handleClimateForecast = useCallback(data => {
    setClimateForecast(data);
    setLastUpdate(new Date());
  }, []);

  // Handle atmospheric conditions
  const handleAtmosphericConditions = useCallback(data => {
    setAtmosphericConditions(data);
    setLastUpdate(new Date());
  }, []);

  // Handle connection errors
  const handleConnectionError = useCallback(error => {
    console.error('❌ Meteorological data connection error:', error);
    setError(error.error || 'Connection error');
    setIsLoading(false);
  }, []);

  // Request simulation data
  const requestSimulation = useCallback(parameters => {
    webSocketService.requestData('meteorological_simulation', parameters);
  }, []);

  // Request extreme weather analysis
  const requestExtremeWeatherAnalysis = useCallback((region, timeframe) => {
    webSocketService.requestData('extreme_weather_events', {
      region,
      timeframe,
    });
  }, []);

  // Request weather statistics
  const requestWeatherStatistics = useCallback(parameters => {
    webSocketService.requestData('weather_statistics', parameters);
  }, []);

  // Request climate forecast
  const requestClimateForecast = useCallback((region, duration) => {
    webSocketService.requestData('climate_forecast', { region, duration });
  }, []);

  useEffect(() => {
    // Subscribe to all meteorological data streams
    webSocketService.subscribe(
      'meteorological_simulation',
      handleSimulationData
    );
    webSocketService.subscribe('extreme_weather_events', handleExtremeEvents);
    webSocketService.subscribe('weather_statistics', handleWeatherStats);
    webSocketService.subscribe('climate_forecast', handleClimateForecast);
    webSocketService.subscribe(
      'atmospheric_conditions',
      handleAtmosphericConditions
    );
    webSocketService.subscribe('connection_error', handleConnectionError);

    // Check for cached data
    const cachedSimulation = webSocketService.getCachedData(
      'meteorological_simulation'
    );
    const cachedEvents = webSocketService.getCachedData(
      'extreme_weather_events'
    );
    const cachedStats = webSocketService.getCachedData('weather_statistics');
    const cachedForecast = webSocketService.getCachedData('climate_forecast');
    const cachedAtmospheric = webSocketService.getCachedData(
      'atmospheric_conditions'
    );

    if (cachedSimulation) {
      setSimulationData(cachedSimulation);
      setIsLoading(false);
    }

    if (cachedEvents) {
      setExtremeEvents(cachedEvents);
    }

    if (cachedStats) {
      setWeatherStats(cachedStats);
    }

    if (cachedForecast) {
      setClimateForecast(cachedForecast);
    }

    if (cachedAtmospheric) {
      setAtmosphericConditions(cachedAtmospheric);
    }

    // Cleanup subscriptions
    return () => {
      webSocketService.unsubscribe(
        'meteorological_simulation',
        handleSimulationData
      );
      webSocketService.unsubscribe(
        'extreme_weather_events',
        handleExtremeEvents
      );
      webSocketService.unsubscribe('weather_statistics', handleWeatherStats);
      webSocketService.unsubscribe('climate_forecast', handleClimateForecast);
      webSocketService.unsubscribe(
        'atmospheric_conditions',
        handleAtmosphericConditions
      );
      webSocketService.unsubscribe('connection_error', handleConnectionError);
    };
  }, [
    handleSimulationData,
    handleExtremeEvents,
    handleWeatherStats,
    handleClimateForecast,
    handleAtmosphericConditions,
    handleConnectionError,
  ]);

  return {
    // Data states
    simulationData,
    extremeEvents,
    weatherStats,
    climateForecast,
    atmosphericConditions,

    // Status states
    isLoading,
    error,
    lastUpdate,

    // Action functions
    requestSimulation,
    requestExtremeWeatherAnalysis,
    requestWeatherStatistics,
    requestClimateForecast,

    // Utility functions
    hasData: Boolean(
      simulationData ||
        extremeEvents?.length ||
        weatherStats ||
        climateForecast ||
        atmosphericConditions
    ),
    isConnected: webSocketService.getConnectionStatus().isConnected,
  };
};

export default useMeteorologicalData;
