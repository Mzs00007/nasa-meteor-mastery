import axios from 'axios';

import NASAService from '../../src/services/nasaService';

// Mock axios for controlled testing
jest.mock('axios');
const mockedAxios = axios;

describe('NASA Service Integration Tests', () => {
  let nasaService;

  beforeEach(() => {
    nasaService = new NASAService();
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
    nasaService.cache.clear();
  });

  describe('API Configuration', () => {
    test('should initialize with correct default values', () => {
      expect(nasaService.apiKey).toBeDefined();
      expect(nasaService.baseURL).toBe('https://api.nasa.gov/neo/rest/v1');
      expect(nasaService.donkiURL).toBe('https://api.nasa.gov/DONKI');
      expect(nasaService.eonetURL).toBe('https://eonet.gsfc.nasa.gov/api/v3');
    });

    test('should detect demo key usage', () => {
      const demoService = new NASAService();
      expect(demoService.isDemoKey).toBe(true);
      expect(demoService.rateLimits.requestsPerHour).toBe(30);
    });

    test('should configure rate limits for demo key', () => {
      expect(nasaService.rateLimits.requestsPerHour).toBe(30);
      expect(nasaService.rateLimits.requestsPerDay).toBe(50);
      expect(nasaService.rateLimits.minInterval).toBe(2000);
    });
  });

  describe('NEO Feed API', () => {
    const mockNeoFeedResponse = {
      data: {
        links: { next: 'next-url', prev: 'prev-url', self: 'self-url' },
        element_count: 2,
        near_earth_objects: {
          '2024-01-01': [
            {
              id: '54016849',
              neo_reference_id: '54016849',
              name: '(2020 XL5)',
              nasa_jpl_url: 'http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=54016849',
              absolute_magnitude_h: 21.3,
              estimated_diameter: {
                kilometers: {
                  estimated_diameter_min: 0.1,
                  estimated_diameter_max: 0.3,
                },
              },
              is_potentially_hazardous_asteroid: false,
              close_approach_data: [
                {
                  close_approach_date: '2024-01-01',
                  close_approach_date_full: '2024-Jan-01 12:00',
                  epoch_date_close_approach: 1704110400000,
                  relative_velocity: { kilometers_per_second: '15.5' },
                  miss_distance: { kilometers: '7500000' },
                  orbiting_body: 'Earth',
                },
              ],
              is_sentry_object: false,
            },
          ],
        },
      },
    };

    test('should fetch NEO feed successfully', async () => {
      nasaService.client.get.mockResolvedValue(mockNeoFeedResponse);

      const result = await nasaService.getNeoFeed('2024-01-01', '2024-01-01');

      expect(nasaService.client.get).toHaveBeenCalledWith('/feed', {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-01',
          detailed: true,
        },
      });
      expect(result).toEqual(mockNeoFeedResponse.data);
    });

    test('should handle NEO feed API errors', async () => {
      const errorResponse = {
        response: {
          status: 429,
          data: { error_message: 'Rate limit exceeded' },
        },
      };
      nasaService.client.get.mockRejectedValue(errorResponse);

      await expect(
        nasaService.getNeoFeed('2024-01-01', '2024-01-01')
      ).rejects.toThrow('Rate limit exceeded');
    });

    test('should cache NEO feed responses', async () => {
      nasaService.client.get.mockResolvedValue(mockNeoFeedResponse);

      // First call
      await nasaService.getNeoFeed('2024-01-01', '2024-01-01');

      // Second call should use cache
      await nasaService.getNeoFeed('2024-01-01', '2024-01-01');

      expect(nasaService.client.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('NEO Browse API', () => {
    const mockNeoBrowseResponse = {
      data: {
        links: { next: 'next-url', prev: 'prev-url', self: 'self-url' },
        page: { size: 20, total_elements: 100, total_pages: 5, number: 0 },
        near_earth_objects: [
          {
            id: '2000433',
            neo_reference_id: '2000433',
            name: '433 Eros (A898 PA)',
            designation: '433',
            nasa_jpl_url: 'http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2000433',
            absolute_magnitude_h: 10.4,
            estimated_diameter: {
              kilometers: {
                estimated_diameter_min: 8.1,
                estimated_diameter_max: 18.1,
              },
            },
            is_potentially_hazardous_asteroid: false,
            is_sentry_object: false,
          },
        ],
      },
    };

    test('should fetch NEO browse data successfully', async () => {
      nasaService.client.get.mockResolvedValue(mockNeoBrowseResponse);

      const result = await nasaService.getNeoBrowse();

      expect(nasaService.client.get).toHaveBeenCalledWith('/neo/browse', {
        params: { page: 0, size: 20 },
      });
      expect(result).toEqual(mockNeoBrowseResponse.data);
    });

    test('should handle pagination parameters', async () => {
      nasaService.client.get.mockResolvedValue(mockNeoBrowseResponse);

      await nasaService.getNeoBrowse(2, 50);

      expect(nasaService.client.get).toHaveBeenCalledWith('/neo/browse', {
        params: { page: 2, size: 50 },
      });
    });
  });

  describe('NEO Lookup API', () => {
    const mockNeoLookupResponse = {
      data: {
        id: '3542519',
        neo_reference_id: '3542519',
        name: '(2010 PK9)',
        designation: '2010 PK9',
        nasa_jpl_url: 'http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=3542519',
        absolute_magnitude_h: 21.0,
        estimated_diameter: {
          kilometers: {
            estimated_diameter_min: 0.1,
            estimated_diameter_max: 0.3,
          },
        },
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [],
        orbital_data: {
          orbit_id: '658',
          orbit_determination_date: '2021-04-06 06:26:10',
          first_observation_date: '2010-08-13',
          last_observation_date: '2021-01-07',
          data_arc_in_days: 3799,
          observations_used: 94,
          orbit_uncertainty: '0',
          minimum_orbit_intersection: '.0921309',
          jupiter_tisserand_invariant: '4.938',
          epoch_osculation: '2460000.5',
          eccentricity: '.2369822',
          semi_major_axis: '1.2738',
          inclination: '8.34739',
          ascending_node_longitude: '47.69459',
          orbital_period: '525.5',
          perihelion_distance: '.9724',
          aphelion_distance: '1.5753',
          perihelion_argument: '117.81',
          perihelion_time: '2459945.954',
          mean_anomaly: '37.84',
          mean_motion: '.6851',
          equinox: 'J2000',
          orbit_class: {
            orbit_class_type: 'APO',
            orbit_class_description:
              "Near-Earth asteroid orbits which cross the Earth's orbit similar to that of 1862 Apollo",
            orbit_class_range:
              'a (semi-major axis) > 1.0 AU; q (perihelion) < 1.017 AU',
          },
        },
        is_sentry_object: false,
      },
    };

    test('should fetch NEO lookup data successfully', async () => {
      nasaService.client.get.mockResolvedValue(mockNeoLookupResponse);

      const result = await nasaService.getNeoLookup('3542519');

      expect(nasaService.client.get).toHaveBeenCalledWith('/neo/3542519');
      expect(result).toEqual(mockNeoLookupResponse.data);
    });

    test('should handle invalid NEO ID', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { error_message: 'NEO not found' },
        },
      };
      nasaService.client.get.mockRejectedValue(errorResponse);

      await expect(nasaService.getNeoLookup('invalid-id')).rejects.toThrow(
        'NEO not found'
      );
    });
  });

  describe('Space Weather API', () => {
    const mockSpaceWeatherResponse = {
      data: [
        {
          messageType: 'M',
          messageID: 'M20240101-001',
          messageURL: 'https://api.nasa.gov/DONKI/notifications',
          messageIssueTime: '2024-01-01T12:00:00Z',
          messageBody: 'Solar flare detected',
        },
      ],
    };

    test('should fetch space weather data successfully', async () => {
      // Mock the axios.get call for DONKI API
      mockedAxios.get.mockResolvedValue(mockSpaceWeatherResponse);

      const result = await nasaService.getSpaceWeather();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.nasa.gov/DONKI'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: nasaService.apiKey,
          }),
        })
      );
      expect(result).toEqual(mockSpaceWeatherResponse.data);
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits for demo key', async () => {
      const startTime = Date.now();

      // Mock successful responses
      nasaService.client.get.mockResolvedValue({ data: {} });

      // Make two consecutive requests
      await nasaService.getNeoFeed('2024-01-01', '2024-01-01');
      await nasaService.getNeoFeed('2024-01-02', '2024-01-02');

      const endTime = Date.now();
      const timeDiff = endTime - startTime;

      // Should have waited at least the minimum interval
      expect(timeDiff).toBeGreaterThanOrEqual(
        nasaService.rateLimits.minInterval - 100
      );
    });

    test('should track request counts', async () => {
      nasaService.client.get.mockResolvedValue({ data: {} });

      const initialCount = nasaService.requestCount;
      await nasaService.getNeoFeed('2024-01-01', '2024-01-01');

      expect(nasaService.requestCount).toBe(initialCount + 1);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      nasaService.client.get.mockRejectedValue(networkError);

      await expect(
        nasaService.getNeoFeed('2024-01-01', '2024-01-01')
      ).rejects.toThrow('Network Error');
    });

    test('should handle API key errors', async () => {
      const apiKeyError = {
        response: {
          status: 403,
          data: { error_message: 'Invalid API key' },
        },
      };
      nasaService.client.get.mockRejectedValue(apiKeyError);

      await expect(
        nasaService.getNeoFeed('2024-01-01', '2024-01-01')
      ).rejects.toThrow('Invalid API key');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };
      nasaService.client.get.mockRejectedValue(timeoutError);

      await expect(
        nasaService.getNeoFeed('2024-01-01', '2024-01-01')
      ).rejects.toThrow('timeout of 30000ms exceeded');
    });
  });

  describe('Cache Management', () => {
    test('should clear expired cache entries', async () => {
      nasaService.client.get.mockResolvedValue({ data: { test: 'data' } });

      // Add entry to cache with short TTL
      const cacheKey = 'test-key';
      nasaService.cache.set(cacheKey, {
        data: { test: 'data' },
        timestamp: Date.now() - 1000000, // Old timestamp
      });

      // Should not use expired cache
      await nasaService.getNeoFeed('2024-01-01', '2024-01-01');

      expect(nasaService.client.get).toHaveBeenCalled();
    });

    test('should use valid cache entries', async () => {
      const cacheKey = nasaService.getCacheKey('neoFeed', {
        start_date: '2024-01-01',
        end_date: '2024-01-01',
      });
      const cachedData = { test: 'cached-data' };

      nasaService.cache.set(cacheKey, {
        data: cachedData,
        timestamp: Date.now(),
      });

      const result = await nasaService.getNeoFeed('2024-01-01', '2024-01-01');

      expect(result).toEqual(cachedData);
      expect(nasaService.client.get).not.toHaveBeenCalled();
    });
  });

  describe('API Status', () => {
    test('should return correct API key status', () => {
      expect(nasaService.getAPIKeyStatus()).toBe(false); // Demo key
    });

    test('should provide service statistics', () => {
      const stats = nasaService.getServiceStats();

      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('rateLimits');
      expect(stats).toHaveProperty('apiKeyStatus');
    });
  });
});
