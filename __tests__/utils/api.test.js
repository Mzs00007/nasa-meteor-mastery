/**
 * @jest-environment node
 */

// Mock window object for node environment
global.window = {};

// Import the api file to load classes to window
require('../../src/utils/api.js');

// Get classes from window object
const NASAClient = global.NASAClient || window.NASAClient;
const USGSClient = global.USGSClient || window.USGSClient;
const APIUtils = global.APIUtils || window.APIUtils;

// Mock fetch globally
global.fetch = jest.fn();

describe('NASAClient', () => {
  let nasaClient;

  beforeEach(() => {
    nasaClient = new NASAClient('test-api-key');
    fetch.mockClear();
  });

  describe('constructor', () => {
    test('should initialize with default API key', () => {
      const client = new NASAClient();
      expect(client.apiKey).toBe('DEMO_KEY');
    });

    test('should initialize with custom API key', () => {
      expect(nasaClient.apiKey).toBe('test-api-key');
      expect(nasaClient.baseURL).toBe('https://api.nasa.gov/neo/rest/v1');
      expect(nasaClient.donkiURL).toBe('https://api.nasa.gov/DONKI');
      expect(nasaClient.eonetURL).toBe('https://eonet.gsfc.nasa.gov/api/v2.1');
    });
  });

  describe('request method', () => {
    test('should make successful API request', async () => {
      const mockResponse = { data: 'test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await nasaClient.request('https://api.test.com', { param: 'value' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.test.com/?param=value&api_key=test-api-key')
      );
      expect(result).toEqual(mockResponse);
    });

    test('should handle HTTP errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(nasaClient.request('https://api.test.com')).rejects.toThrow('HTTP 404: Not Found');
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(nasaClient.request('https://api.test.com')).rejects.toThrow('Network error');
    });
  });

  describe('NEO methods', () => {
    test('getNeoFeed should fetch NEO feed data', async () => {
      const mockData = { near_earth_objects: {} };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await nasaClient.getNeoFeed('2023-01-01', '2023-01-02');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/neo/rest/v1/feed')
      );
      expect(result).toEqual(mockData);
    });

    test('getNeoLookup should fetch specific asteroid data', async () => {
      const mockData = { id: '123', name: 'Test Asteroid' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await nasaClient.getNeoLookup('123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/neo/rest/v1/neo/123')
      );
      expect(result).toEqual(mockData);
    });

    test('getNeoBrowse should fetch NEO browse data', async () => {
      const mockData = { near_earth_objects: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await nasaClient.getNeoBrowse();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/neo/rest/v1/neo/browse')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('DONKI methods', () => {
    test('getSolarFlares should fetch solar flare data', async () => {
      const mockData = [{ flrID: '123' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await nasaClient.getSolarFlares('2023-01-01', '2023-01-02');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/DONKI/FLR')
      );
      expect(result).toEqual(mockData);
    });

    test('getCoronalMassEjections should fetch CME data', async () => {
      const mockData = [{ activityID: '123' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await nasaClient.getCoronalMassEjections('2023-01-01', '2023-01-02');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/DONKI/CME')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('EONET methods', () => {
    test('getNaturalEvents should fetch natural events data', async () => {
      const mockData = { events: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await nasaClient.getNaturalEvents(30);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('eonet.gsfc.nasa.gov/api/v2.1/events')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('asteroid data methods', () => {
    test('getAsteroidData should parse asteroid data successfully', async () => {
      const mockApiData = {
        id: '123',
        name: 'Test Asteroid',
        estimated_diameter: {
          meters: { estimated_diameter_max: 150 }
        },
        close_approach_data: [{
          relative_velocity: { kilometers_per_second: 17.5 },
          miss_distance: { kilometers: 4500000 },
          close_approach_date_full: '2023-12-15 08:30:00'
        }],
        orbital_data: {
          orbit_class: { orbit_class_type: 'Apollo' }
        },
        is_potentially_hazardous_asteroid: true
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiData,
      });

      const result = await nasaClient.getAsteroidData('123');

      expect(result).toEqual({
        id: '123',
        name: 'Test Asteroid',
        diameter: 150,
        velocity: 17.5,
        missDistance: 4500000,
        orbitClass: 'Apollo',
        hazard: true,
        nextApproach: '2023-12-15 08:30:00'
      });
    });

    test('getAsteroidData should return demo data on API error', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await nasaClient.getAsteroidData('123');

      expect(result).toEqual({
        id: 'demo-001',
        name: 'Demo Asteroid 2023',
        diameter: 150,
        velocity: 17.5,
        missDistance: 4500000,
        orbitClass: 'Apollo',
        hazard: true,
        nextApproach: '2023-12-15 08:30:00'
      });
    });

    test('parseAsteroidData should handle missing data gracefully', () => {
      const incompleteData = {
        id: '123',
        name: 'Test Asteroid'
      };

      const result = nasaClient.parseAsteroidData(incompleteData);

      expect(result).toEqual({
        id: '123',
        name: 'Test Asteroid',
        diameter: 0,
        velocity: 0,
        missDistance: 0,
        orbitClass: 'Unknown',
        hazard: undefined,
        nextApproach: undefined
      });
    });
  });
});

describe('USGSClient', () => {
  let usgsClient;

  beforeEach(() => {
    usgsClient = new USGSClient();
    fetch.mockClear();
  });

  describe('constructor', () => {
    test('should initialize with correct URLs', () => {
      expect(usgsClient.earthquakeURL).toBe('https://earthquake.usgs.gov/fdsnws/event/1/query');
      expect(usgsClient.elevationURL).toBe('https://nationalmap.gov/epqs/pqs.php');
      expect(usgsClient.waterURL).toBe('https://waterservices.usgs.gov/nwis');
    });
  });

  describe('request method', () => {
    test('should make successful API request', async () => {
      const mockResponse = { data: 'test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await usgsClient.request('https://api.test.com', { param: 'value' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.test.com/?param=value')
      );
      expect(result).toEqual(mockResponse);
    });

    test('should handle HTTP errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(usgsClient.request('https://api.test.com')).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('earthquake methods', () => {
    test('getEarthquakes should fetch earthquake data', async () => {
      const mockData = { features: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await usgsClient.getEarthquakes('2023-01-01', '2023-01-02', 5.0);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('earthquake.usgs.gov')
      );
      expect(result).toEqual(mockData);
    });

    test('getEarthquakeHistory should fetch historical earthquake data', async () => {
      const mockData = { features: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await usgsClient.getEarthquakeHistory(40.7128, -74.0060, 100);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('earthquake.usgs.gov')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('elevation methods', () => {
    test('getElevation should fetch elevation data', async () => {
      const mockData = { elevation: 100 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await usgsClient.getElevation(40.7128, -74.0060);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('nationalmap.gov/epqs/pqs.php')
      );
      expect(result).toEqual(mockData);
    });

    test('getElevationProfile should fetch elevation for multiple points', async () => {
      const mockData = { elevation: 100 };
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const points = [
        { latitude: 40.7128, longitude: -74.0060 },
        { latitude: 40.7589, longitude: -73.9851 }
      ];

      const result = await usgsClient.getElevationProfile(points);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([mockData, mockData]);
    });
  });

  describe('water data methods', () => {
    test('getWaterData should fetch water data', async () => {
      const mockData = { waterData: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await usgsClient.getWaterData(40.7128, -74.0060, 10);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('waterservices.usgs.gov/nwis')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('tsunami risk assessment', () => {
    test('assessTsunamiRisk should calculate risk correctly', async () => {
      const mockElevation = { elevation: 5 };
      const mockEarthquakes = { features: [1, 2, 3, 4, 5, 6] };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockElevation,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEarthquakes,
        });

      const result = await usgsClient.assessTsunamiRisk({
        latitude: 40.7128,
        longitude: -74.0060
      });

      expect(result.elevation).toEqual(mockElevation);
      expect(result.historicalQuakes).toBe(6);
      expect(result.riskLevel).toBe('High');
    });

    test('calculateTsunamiRisk should return correct risk levels', () => {
      // High risk: low elevation
      expect(usgsClient.calculateTsunamiRisk(5, { features: [] })).toBe('High');

      // Medium risk: moderate elevation with seismic history
      expect(usgsClient.calculateTsunamiRisk(30, { features: [1, 2, 3, 4, 5, 6] })).toBe('Medium');

      // Low risk: high elevation
      expect(usgsClient.calculateTsunamiRisk(100, { features: [] })).toBe('Low');

      // Low risk: moderate elevation with low seismic activity
      expect(usgsClient.calculateTsunamiRisk(30, { features: [1, 2] })).toBe('Low');
    });
  });
});

describe('APIUtils', () => {
  beforeEach(() => {
    APIUtils.cache.clear();
    fetch.mockClear();
  });

  describe('client creation', () => {
    test('createNASAClient should create NASAClient instance', () => {
      const client = APIUtils.createNASAClient('test-key');
      expect(client).toBeInstanceOf(NASAClient);
      expect(client.apiKey).toBe('test-key');
    });

    test('createUSGSClient should create USGSClient instance', () => {
      const client = APIUtils.createUSGSClient();
      expect(client).toBeInstanceOf(USGSClient);
    });
  });

  describe('cache management', () => {
    test('cachedRequest should cache successful requests', async () => {
      const mockData = { data: 'test' };
      const requestFn = jest.fn().mockResolvedValue(mockData);

      const result1 = await APIUtils.cachedRequest('test-key', requestFn, 1000);
      const result2 = await APIUtils.cachedRequest('test-key', requestFn, 1000);

      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
    });

    test('cachedRequest should refresh expired cache', async () => {
      const mockData = { data: 'test' };
      const requestFn = jest.fn().mockResolvedValue(mockData);

      await APIUtils.cachedRequest('test-key', requestFn, 1);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 2));
      
      await APIUtils.cachedRequest('test-key', requestFn, 1);

      expect(requestFn).toHaveBeenCalledTimes(2);
    });

    test('cachedRequest should return stale data on error if available', async () => {
      const mockData = { data: 'test' };
      const requestFn = jest.fn()
        .mockResolvedValueOnce(mockData)
        .mockRejectedValueOnce(new Error('API Error'));

      // First request succeeds and caches data
      const result1 = await APIUtils.cachedRequest('test-key', requestFn, 1);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 2));
      
      // Second request fails but returns stale data
      const result2 = await APIUtils.cachedRequest('test-key', requestFn, 1);

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
    });
  });

  describe('rate limiting', () => {
    test('rateLimit should enforce delay between calls', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const rateLimitedFn = APIUtils.rateLimit(mockFn, 100);

      const promise1 = rateLimitedFn();
      const promise2 = rateLimitedFn();

      const result1 = await promise1;
      await expect(promise2).rejects.toThrow('Rate limit exceeded');

      expect(result1).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    test('withErrorHandling should handle successful requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await APIUtils.withErrorHandling(mockFn);
      
      expect(result).toBe('success');
    });

    test('withErrorHandling should return fallback on error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('API Error'));
      
      const result = await APIUtils.withErrorHandling(mockFn, 'fallback');
      
      expect(result).toBe('fallback');
    });

    test('withErrorHandling should throw error when no fallback', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('API Error'));
      
      await expect(APIUtils.withErrorHandling(mockFn)).rejects.toThrow('API Error');
    });
  });

  describe('batch requests', () => {
    test('batchRequests should process requests in batches', async () => {
      const requests = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.resolve('result3'),
        () => Promise.reject(new Error('error')),
        () => Promise.resolve('result5'),
      ];

      const results = await APIUtils.batchRequests(requests, 2);

      expect(results).toHaveLength(5);
      expect(results[0].status).toBe('fulfilled');
      expect(results[0].value).toBe('result1');
      expect(results[3].status).toBe('rejected');
      expect(results[3].reason.message).toBe('error');
    });
  });
});