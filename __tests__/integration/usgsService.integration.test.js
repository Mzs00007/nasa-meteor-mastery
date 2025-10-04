import axios from 'axios';

import USGSService from '../../src/services/usgsService';

// Mock axios for controlled testing
jest.mock('axios');
const mockedAxios = axios;

describe('USGS Service Integration Tests', () => {
  let usgsService;

  beforeEach(() => {
    usgsService = new USGSService();
    jest.clearAllMocks();

    // Mock successful axios create
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
    });
  });

  afterEach(() => {
    // Clear cache after each test
    usgsService.cache.clear();
  });

  describe('Service Configuration', () => {
    test('should initialize with correct default values', () => {
      expect(usgsService.baseURL).toBe(
        'https://earthquake.usgs.gov/fdsnws/event/1'
      );
      expect(usgsService.geoJsonURL).toBe(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'
      );
      expect(usgsService.rateLimits.requestsPerMinute).toBe(60);
      expect(usgsService.rateLimits.minInterval).toBe(1000);
    });

    test('should have proper cache configuration', () => {
      expect(usgsService.cache).toBeDefined();
      expect(usgsService.cacheTTL).toBe(300000); // 5 minutes
    });
  });

  describe('Earthquake Data API', () => {
    const mockEarthquakeResponse = {
      data: {
        type: 'FeatureCollection',
        metadata: {
          generated: 1704110400000,
          url: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
          title: 'USGS Earthquakes',
          status: 200,
          api: '1.10.3',
          count: 2,
        },
        features: [
          {
            type: 'Feature',
            properties: {
              mag: 4.5,
              place: '10km NE of Example City',
              time: 1704110400000,
              updated: 1704110400000,
              tz: null,
              url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us1000test',
              detail:
                'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us1000test',
              felt: 25,
              cdi: 3.4,
              mmi: 4.2,
              alert: 'green',
              status: 'reviewed',
              tsunami: 0,
              sig: 312,
              net: 'us',
              code: '1000test',
              ids: ',us1000test,',
              sources: ',us,',
              types:
                ',cap,dyfi,general-link,geoserve,impact-link,losspager,moment-tensor,nearby-cities,origin,phase-data,shakemap,',
              nst: 45,
              dmin: 0.123,
              rms: 0.45,
              gap: 67,
              magType: 'mw',
              type: 'earthquake',
              title: 'M 4.5 - 10km NE of Example City',
            },
            geometry: {
              type: 'Point',
              coordinates: [-122.1234, 37.5678, 10.5],
            },
            id: 'us1000test',
          },
        ],
      },
    };

    test('should fetch earthquake data successfully', async () => {
      usgsService.client.get.mockResolvedValue(mockEarthquakeResponse);

      const result = await usgsService.getEarthquakes();

      expect(usgsService.client.get).toHaveBeenCalledWith('/query', {
        params: {
          format: 'geojson',
          starttime: expect.any(String),
          endtime: expect.any(String),
          minmagnitude: 2.5,
          limit: 100,
        },
      });
      expect(result).toEqual(mockEarthquakeResponse.data);
    });

    test('should handle custom parameters', async () => {
      usgsService.client.get.mockResolvedValue(mockEarthquakeResponse);

      const params = {
        minmagnitude: 5.0,
        maxmagnitude: 8.0,
        starttime: '2024-01-01',
        endtime: '2024-01-02',
        latitude: 37.5,
        longitude: -122.1,
        maxradiuskm: 100,
        limit: 50,
      };

      await usgsService.getEarthquakes(params);

      expect(usgsService.client.get).toHaveBeenCalledWith('/query', {
        params: {
          format: 'geojson',
          ...params,
        },
      });
    });

    test('should cache earthquake responses', async () => {
      usgsService.client.get.mockResolvedValue(mockEarthquakeResponse);

      // First call
      await usgsService.getEarthquakes();

      // Second call should use cache
      await usgsService.getEarthquakes();

      expect(usgsService.client.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Significant Earthquakes API', () => {
    const mockSignificantResponse = {
      data: {
        type: 'FeatureCollection',
        metadata: {
          generated: 1704110400000,
          url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
          title: 'USGS Significant Earthquakes, Past Month',
          status: 200,
          api: '1.10.3',
          count: 1,
        },
        features: [
          {
            type: 'Feature',
            properties: {
              mag: 7.2,
              place: 'Pacific Ocean',
              time: 1704110400000,
              updated: 1704110400000,
              tz: null,
              url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us2000test',
              detail:
                'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us2000test',
              felt: 1500,
              cdi: 6.8,
              mmi: 7.1,
              alert: 'red',
              status: 'reviewed',
              tsunami: 1,
              sig: 1250,
              net: 'us',
              code: '2000test',
              ids: ',us2000test,',
              sources: ',us,',
              types:
                ',cap,dyfi,general-link,geoserve,impact-link,losspager,moment-tensor,nearby-cities,origin,phase-data,shakemap,tsunami,',
              nst: 125,
              dmin: 2.456,
              rms: 0.89,
              gap: 23,
              magType: 'mw',
              type: 'earthquake',
              title: 'M 7.2 - Pacific Ocean',
            },
            geometry: {
              type: 'Point',
              coordinates: [-150.1234, 35.5678, 25.8],
            },
            id: 'us2000test',
          },
        ],
      },
    };

    test('should fetch significant earthquakes successfully', async () => {
      mockedAxios.get.mockResolvedValue(mockSignificantResponse);

      const result = await usgsService.getSignificantEarthquakes('month');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson'
      );
      expect(result).toEqual(mockSignificantResponse.data);
    });

    test('should handle different time periods', async () => {
      mockedAxios.get.mockResolvedValue(mockSignificantResponse);

      await usgsService.getSignificantEarthquakes('week');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson'
      );
    });

    test('should default to day period', async () => {
      mockedAxios.get.mockResolvedValue(mockSignificantResponse);

      await usgsService.getSignificantEarthquakes();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson'
      );
    });
  });

  describe('Earthquake by Magnitude API', () => {
    test('should fetch earthquakes by magnitude successfully', async () => {
      const mockMagnitudeResponse = {
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockMagnitudeResponse);

      const result = await usgsService.getEarthquakesByMagnitude('4.5', 'day');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'
      );
      expect(result).toEqual(mockMagnitudeResponse.data);
    });

    test('should handle different magnitude thresholds', async () => {
      const mockResponse = {
        data: { type: 'FeatureCollection', features: [] },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await usgsService.getEarthquakesByMagnitude('2.5', 'week');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson'
      );
    });
  });

  describe('Earthquake Details API', () => {
    const mockDetailResponse = {
      data: {
        type: 'Feature',
        properties: {
          mag: 6.1,
          place: 'Detailed earthquake location',
          time: 1704110400000,
          updated: 1704110400000,
          tz: null,
          url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us3000test',
          detail:
            'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us3000test',
          felt: 500,
          cdi: 5.2,
          mmi: 5.8,
          alert: 'yellow',
          status: 'reviewed',
          tsunami: 0,
          sig: 650,
          net: 'us',
          code: '3000test',
          ids: ',us3000test,',
          sources: ',us,',
          types:
            ',cap,dyfi,general-link,geoserve,impact-link,losspager,moment-tensor,nearby-cities,origin,phase-data,shakemap,',
          nst: 85,
          dmin: 1.234,
          rms: 0.67,
          gap: 45,
          magType: 'mw',
          type: 'earthquake',
          title: 'M 6.1 - Detailed earthquake location',
        },
        geometry: {
          type: 'Point',
          coordinates: [-118.1234, 34.5678, 15.2],
        },
        id: 'us3000test',
      },
    };

    test('should fetch earthquake details successfully', async () => {
      usgsService.client.get.mockResolvedValue(mockDetailResponse);

      const result = await usgsService.getEarthquakeDetails('us3000test');

      expect(usgsService.client.get).toHaveBeenCalledWith('/query', {
        params: {
          format: 'geojson',
          eventid: 'us3000test',
        },
      });
      expect(result).toEqual(mockDetailResponse.data);
    });

    test('should handle invalid earthquake ID', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { error: 'Event not found' },
        },
      };
      usgsService.client.get.mockRejectedValue(errorResponse);

      await expect(
        usgsService.getEarthquakeDetails('invalid-id')
      ).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const startTime = Date.now();

      // Mock successful responses
      usgsService.client.get.mockResolvedValue({ data: {} });

      // Make two consecutive requests
      await usgsService.getEarthquakes();
      await usgsService.getEarthquakes({ minmagnitude: 3.0 });

      const endTime = Date.now();
      const timeDiff = endTime - startTime;

      // Should have waited at least the minimum interval
      expect(timeDiff).toBeGreaterThanOrEqual(
        usgsService.rateLimits.minInterval - 100
      );
    });

    test('should track request counts', async () => {
      usgsService.client.get.mockResolvedValue({ data: {} });

      const initialCount = usgsService.requestCount;
      await usgsService.getEarthquakes();

      expect(usgsService.requestCount).toBe(initialCount + 1);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      usgsService.client.get.mockRejectedValue(networkError);

      await expect(usgsService.getEarthquakes()).rejects.toThrow(
        'Network Error'
      );
    });

    test('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 400,
          data: { error: 'Bad Request' },
        },
      };
      usgsService.client.get.mockRejectedValue(apiError);

      await expect(usgsService.getEarthquakes()).rejects.toThrow();
    });

    test('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };
      usgsService.client.get.mockRejectedValue(timeoutError);

      await expect(usgsService.getEarthquakes()).rejects.toThrow(
        'timeout of 30000ms exceeded'
      );
    });
  });

  describe('Cache Management', () => {
    test('should clear expired cache entries', async () => {
      usgsService.client.get.mockResolvedValue({ data: { test: 'data' } });

      // Add entry to cache with old timestamp
      const cacheKey = 'test-key';
      usgsService.cache.set(cacheKey, {
        data: { test: 'data' },
        timestamp: Date.now() - 1000000, // Old timestamp
      });

      // Should not use expired cache
      await usgsService.getEarthquakes();

      expect(usgsService.client.get).toHaveBeenCalled();
    });

    test('should use valid cache entries', async () => {
      const cacheKey = usgsService.getCacheKey('earthquakes', {});
      const cachedData = { test: 'cached-data' };

      usgsService.cache.set(cacheKey, {
        data: cachedData,
        timestamp: Date.now(),
      });

      const result = await usgsService.getEarthquakes();

      expect(result).toEqual(cachedData);
      expect(usgsService.client.get).not.toHaveBeenCalled();
    });
  });

  describe('Data Processing', () => {
    test('should process earthquake data correctly', async () => {
      const mockResponse = {
        data: {
          type: 'FeatureCollection',
          features: [
            {
              properties: {
                mag: 4.5,
                place: 'Test Location',
                time: 1704110400000,
                alert: 'green',
              },
              geometry: {
                coordinates: [-122.1234, 37.5678, 10.5],
              },
            },
          ],
        },
      };

      usgsService.client.get.mockResolvedValue(mockResponse);

      const result = await usgsService.getEarthquakes();
      const feature = result.features[0];

      expect(feature.properties.mag).toBe(4.5);
      expect(feature.properties.place).toBe('Test Location');
      expect(feature.geometry.coordinates).toHaveLength(3);
    });
  });

  describe('Service Statistics', () => {
    test('should provide service statistics', () => {
      const stats = usgsService.getServiceStats();

      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('rateLimits');
      expect(stats).toHaveProperty('lastRequestTime');
    });

    test('should track cache hit ratio', async () => {
      usgsService.client.get.mockResolvedValue({ data: {} });

      // First request (cache miss)
      await usgsService.getEarthquakes();

      // Second request (cache hit)
      await usgsService.getEarthquakes();

      const stats = usgsService.getServiceStats();
      expect(stats.cacheHitRatio).toBeGreaterThan(0);
    });
  });

  describe('Parameter Validation', () => {
    test('should validate magnitude parameters', async () => {
      usgsService.client.get.mockResolvedValue({ data: {} });

      await expect(
        usgsService.getEarthquakesByMagnitude('invalid', 'day')
      ).rejects.toThrow();
    });

    test('should validate time period parameters', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });

      await expect(
        usgsService.getSignificantEarthquakes('invalid')
      ).rejects.toThrow();
    });

    test('should validate coordinate parameters', async () => {
      usgsService.client.get.mockResolvedValue({ data: {} });

      const invalidParams = {
        latitude: 'invalid',
        longitude: -122.1,
      };

      await expect(usgsService.getEarthquakes(invalidParams)).rejects.toThrow();
    });
  });
});
