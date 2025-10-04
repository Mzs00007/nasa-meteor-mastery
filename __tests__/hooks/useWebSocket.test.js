/**
 * @jest-environment node
 */

import { renderHook, act } from '@testing-library/react';
import {
  useWebSocket,
  useISSData,
  useNASAData,
  useSpaceWeather,
  useEarthObservation,
  useMissionControl,
  useLegacyData,
  useCustomWebSocketData,
  useWebSocketControl,
} from '../../src/hooks/useWebSocket';

// Mock the websocket service
const mockWebSocketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  getConnectionStatus: jest.fn(),
  getStats: jest.fn(),
  getCachedData: jest.fn(),
  requestData: jest.fn(),
  updateStreamInterval: jest.fn(),
  clearCache: jest.fn(),
  getAllCachedData: jest.fn(),
};

jest.mock('../../src/services/websocket-service', () => ({
  __esModule: true,
  default: mockWebSocketService,
}));

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocketService.subscribe.mockReturnValue(jest.fn()); // Mock unsubscribe function
    mockWebSocketService.getConnectionStatus.mockReturnValue({ status: 'disconnected' });
    mockWebSocketService.getStats.mockReturnValue({
      connectionTime: Date.now(),
      messagesReceived: 0,
      reconnectCount: 0,
    });
  });

  describe('useWebSocket', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.error).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.getStats).toBe('function');
    });

    it('should connect to WebSocket service on mount', () => {
      renderHook(() => useWebSocket());

      expect(mockWebSocketService.connect).toHaveBeenCalledTimes(1);
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'connection_status',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'connection_error',
        expect.any(Function)
      );
      expect(mockWebSocketService.getConnectionStatus).toHaveBeenCalledTimes(1);
    });

    it('should update connection status when service notifies', () => {
      let connectionStatusCallback;
      mockWebSocketService.subscribe.mockImplementation((event, callback) => {
        if (event === 'connection_status') {
          connectionStatusCallback = callback;
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        connectionStatusCallback({ status: 'connected' });
      });

      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle connection errors', () => {
      let connectionStatusCallback, connectionErrorCallback;
      mockWebSocketService.subscribe.mockImplementation((event, callback) => {
        if (event === 'connection_status') {
          connectionStatusCallback = callback;
        } else if (event === 'connection_error') {
          connectionErrorCallback = callback;
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useWebSocket());

      act(() => {
        connectionStatusCallback({ status: 'connected', error: 'Connection failed' });
      });

      expect(result.current.error).toBe('Connection failed');

      act(() => {
        connectionErrorCallback({ error: 'Network error' });
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should disconnect when disconnect function is called', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.disconnect();
      });

      expect(mockWebSocketService.disconnect).toHaveBeenCalledTimes(1);
      expect(result.current.connectionStatus).toBe('disconnected');
    });

    it('should return stats when getStats is called', () => {
      const mockStats = { connectionTime: Date.now(), messagesReceived: 5 };
      mockWebSocketService.getStats.mockReturnValue(mockStats);

      const { result } = renderHook(() => useWebSocket());

      const stats = result.current.getStats();
      expect(stats).toEqual(mockStats);
      expect(mockWebSocketService.getStats).toHaveBeenCalledTimes(1);
    });

    it('should cleanup subscriptions on unmount', () => {
      const unsubscribeMock = jest.fn();
      mockWebSocketService.subscribe.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => useWebSocket());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(2); // Two subscriptions
    });
  });

  describe('useISSData', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useISSData());

      expect(result.current.issPosition).toBeNull();
      expect(result.current.advancedIssData).toBeNull();
      expect(result.current.starlinkData).toBeNull();
      expect(result.current.spaceDebris).toBeNull();
      expect(result.current.satellitePasses).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should subscribe to ISS data streams', () => {
      renderHook(() => useISSData());

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'iss_position',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'advanced_iss_data',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'starlink_constellation',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'space_debris',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'satellite_passes',
        expect.any(Function)
      );
    });

    it('should update ISS position and set loading to false', () => {
      let issPositionCallback;
      mockWebSocketService.subscribe.mockImplementation((event, callback) => {
        if (event === 'iss_position') {
          issPositionCallback = callback;
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useISSData());

      const mockIssData = { latitude: 45.0, longitude: -75.0, altitude: 408 };

      act(() => {
        issPositionCallback(mockIssData);
      });

      expect(result.current.issPosition).toEqual(mockIssData);
      expect(result.current.loading).toBe(false);
    });

    it('should update advanced ISS data', () => {
      let advancedIssCallback;
      mockWebSocketService.subscribe.mockImplementation((event, callback) => {
        if (event === 'advanced_iss_data') {
          advancedIssCallback = callback;
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useISSData());

      const mockAdvancedData = { velocity: 7.66, crew: 7 };

      act(() => {
        advancedIssCallback(mockAdvancedData);
      });

      expect(result.current.advancedIssData).toEqual(mockAdvancedData);
    });
  });

  describe('useNASAData', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useNASAData());

      expect(result.current.neoData).toBeNull();
      expect(result.current.marsWeather).toBeNull();
      expect(result.current.earthImagery).toBeNull();
      expect(result.current.epicImages).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should subscribe to NASA data streams', () => {
      renderHook(() => useNASAData());

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'comprehensive_neo_data',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'mars_weather',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'earth_imagery',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'epic_images',
        expect.any(Function)
      );
    });

    it('should update NEO data and set loading to false', () => {
      let neoDataCallback;
      mockWebSocketService.subscribe.mockImplementation((event, callback) => {
        if (event === 'comprehensive_neo_data') {
          neoDataCallback = callback;
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useNASAData());

      const mockNeoData = { asteroids: [], totalCount: 0 };

      act(() => {
        neoDataCallback(mockNeoData);
      });

      expect(result.current.neoData).toEqual(mockNeoData);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('useSpaceWeather', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSpaceWeather());

      expect(result.current.spaceWeather).toBeNull();
      expect(result.current.solarActivity).toBeNull();
      expect(result.current.geomagneticData).toBeNull();
      expect(result.current.auroraForecast).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should subscribe to space weather data streams', () => {
      renderHook(() => useSpaceWeather());

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'detailed_space_weather',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'solar_activity_detailed',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'geomagnetic_data',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'aurora_forecast',
        expect.any(Function)
      );
    });
  });

  describe('useEarthObservation', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useEarthObservation());

      expect(result.current.satelliteImagery).toBeNull();
      expect(result.current.environmentalIndicators).toBeNull();
      expect(result.current.naturalDisasters).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should subscribe to Earth observation data streams', () => {
      renderHook(() => useEarthObservation());

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'satellite_imagery',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'environmental_indicators',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'natural_disasters',
        expect.any(Function)
      );
    });
  });

  describe('useMissionControl', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useMissionControl());

      expect(result.current.telemetry).toBeNull();
      expect(result.current.orbitalMechanics).toBeNull();
      expect(result.current.realTimeEvents).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(typeof result.current.clearEvents).toBe('function');
    });

    it('should subscribe to mission control data streams', () => {
      renderHook(() => useMissionControl());

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'mission_control_telemetry',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'orbital_mechanics',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'real_time_events',
        expect.any(Function)
      );
    });

    it('should handle real-time events and limit to 50 events', () => {
      let realTimeEventsCallback;
      mockWebSocketService.subscribe.mockImplementation((event, callback) => {
        if (event === 'real_time_events') {
          realTimeEventsCallback = callback;
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useMissionControl());

      // Add 60 events to test the 50-event limit
      const events = Array.from({ length: 60 }, (_, i) => ({ id: i, message: `Event ${i}` }));

      act(() => {
        realTimeEventsCallback({ events });
      });

      expect(result.current.realTimeEvents).toHaveLength(50);
      expect(result.current.realTimeEvents[0].id).toBe(10); // First 10 should be removed
      expect(result.current.realTimeEvents[49].id).toBe(59);
    });

    it('should clear events when clearEvents is called', () => {
      const { result } = renderHook(() => useMissionControl());

      act(() => {
        result.current.clearEvents();
      });

      expect(result.current.realTimeEvents).toEqual([]);
    });
  });

  describe('useLegacyData', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useLegacyData());

      expect(result.current.neoData).toBeNull();
      expect(result.current.spaceWeather).toBeNull();
      expect(result.current.seismicData).toBeNull();
      expect(result.current.solarActivity).toBeNull();
      expect(result.current.atmosphericData).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should subscribe to legacy data streams', () => {
      renderHook(() => useLegacyData());

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'neo_data',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'space_weather',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'seismic_data',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'solar_activity',
        expect.any(Function)
      );
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'atmospheric_data',
        expect.any(Function)
      );
    });
  });

  describe('useCustomWebSocketData', () => {
    it('should initialize with provided initial value', () => {
      const initialValue = { test: 'data' };
      const { result } = renderHook(() => useCustomWebSocketData('custom_event', initialValue));

      expect(result.current.data).toEqual(initialValue);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.requestUpdate).toBe('function');
    });

    it('should subscribe to custom event type', () => {
      renderHook(() => useCustomWebSocketData('custom_event'));

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
        'custom_event',
        expect.any(Function)
      );
      expect(mockWebSocketService.getCachedData).toHaveBeenCalledWith('custom_event');
    });

    it('should update data when new data is received', () => {
      let customEventCallback;
      mockWebSocketService.subscribe.mockImplementation((event, callback) => {
        if (event === 'custom_event') {
          customEventCallback = callback;
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useCustomWebSocketData('custom_event'));

      const newData = { updated: 'data' };

      act(() => {
        customEventCallback(newData);
      });

      expect(result.current.data).toEqual(newData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should use cached data if available', () => {
      const cachedData = { data: { cached: 'data' } };
      mockWebSocketService.getCachedData.mockReturnValue(cachedData);

      const { result } = renderHook(() => useCustomWebSocketData('custom_event'));

      expect(result.current.data).toEqual(cachedData.data);
      expect(result.current.loading).toBe(false);
    });

    it('should request update when requestUpdate is called', () => {
      const { result } = renderHook(() => useCustomWebSocketData('custom_event'));

      act(() => {
        result.current.requestUpdate();
      });

      expect(mockWebSocketService.requestData).toHaveBeenCalledWith('custom_event');
    });
  });

  describe('useWebSocketControl', () => {
    it('should provide control functions', () => {
      const { result } = renderHook(() => useWebSocketControl());

      expect(typeof result.current.updateInterval).toBe('function');
      expect(typeof result.current.requestData).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
      expect(typeof result.current.getAllCachedData).toBe('function');
    });

    it('should call updateStreamInterval when updateInterval is called', () => {
      const { result } = renderHook(() => useWebSocketControl());

      act(() => {
        result.current.updateInterval('neo_data', 5000);
      });

      expect(mockWebSocketService.updateStreamInterval).toHaveBeenCalledWith('neo_data', 5000);
    });

    it('should call requestData when requestData is called', () => {
      const { result } = renderHook(() => useWebSocketControl());

      act(() => {
        result.current.requestData('space_weather');
      });

      expect(mockWebSocketService.requestData).toHaveBeenCalledWith('space_weather');
    });

    it('should call clearCache when clearCache is called', () => {
      const { result } = renderHook(() => useWebSocketControl());

      act(() => {
        result.current.clearCache();
      });

      expect(mockWebSocketService.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should return cached data when getAllCachedData is called', () => {
      const mockCachedData = { neo_data: { test: 'data' } };
      mockWebSocketService.getAllCachedData.mockReturnValue(mockCachedData);

      const { result } = renderHook(() => useWebSocketControl());

      const cachedData = result.current.getAllCachedData();

      expect(cachedData).toEqual(mockCachedData);
      expect(mockWebSocketService.getAllCachedData).toHaveBeenCalledTimes(1);
    });
  });
});