import { EnhancedNASAClient, EnhancedUSGSClient, APIError, APIHealthMonitor } from '../../src/utils/enhanced-api.js';

// Mock fetch globally
global.fetch = jest.fn();

// Mock MeteorMadnessConfig
jest.mock('../../src/config.js', () => ({
  MeteorMadnessConfig: {
    NASA: {
      NEO_API_KEY: 'test-nasa-key',
      NEO_BASE_URL: 'https://api.nasa.gov/neo/rest/v1',
      DONKI_BASE_URL: 'https://api.nasa.gov/DONKI',
      EONET_BASE_URL: 'https://eonet.gsfc.nasa.gov/api/v2.1',
    },
    USGS: {
      EARTHQUAKE_API: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
      ELEVATION_API: 'https://nationalmap.gov/epqs/pqs.php',
      WATER_API: 'https://waterservices.usgs.gov/nwis',
    },
  },
}));

describe('APIError', () => {
  test('should create APIError with message and status code', () => {
    const error = new APIError('Test error', 404, { detail: 'Not found' });
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.data).toEqual({ detail: 'Not found' });
    expect(error.name).toBe('APIError');
    expect(error.timestamp).toBeDefined();
  });

  test('should serialize to JSON correctly', () => {
    const error = new APIError('Test error', 500);
    const json = error.toJSON();
    
    expect(json.name).toBe('APIError');
    expect(json.message).toBe('Test error');
    expect(json.statusCode).toBe(500);
    expect(json.data).toBeNull();
    expect(json.timestamp).toBeDefined();
  });
});

describe('EnhancedNASAClient', () => {
  let client;
  const mockFetch = fetch;

  beforeEach(() => {
    client = new EnhancedNASAClient();
    mockFetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(client.apiKey).toBe('test-nasa-key');
      expect(client.baseURL).toBe('https://api.nasa.gov/neo/rest/v1');
      expect(client.maxRetries).toBe(3);
      expect(client.retryDelay).toBe(1000);
      expect(client.timeout).toBe(10000);
      expect(client.rateLimit).toBe(60);
    });

    test('should initialize with custom options', () => {
      const customClient = new EnhancedNASAClient({
        apiKey: 'custom-key',
        maxRetries: 5,
        retryDelay: 2000,
        timeout: 20000,
        rateLimit: 120,
      });
      
      expect(customClient.apiKey).toBe('custom-key');
      expect(customClient.maxRetries).toBe(5);
      expect(customClient.retryDelay).toBe(2000);
      expect(customClient.timeout).toBe(20000);
      expect(customClient.rateLimit).toBe(120);
    });
  });

  describe('requestWithRetry', () => {
    test('should make successful request and cache result', async () => {
      const mockData = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should return cached result on subsequent requests', async () => {
      const mockData = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      // First request
      await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
        ttl: 60000,
      });

      // Second request should use cache
      const result = await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
        ttl: 60000,
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const mockData = { data: 'test' };
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockData,
        });

      const result = await client.requestWithRetry('https://api.test.com');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should throw error after all retries fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.requestWithRetry('https://api.test.com')).rejects.toThrow('All 3 retry attempts failed');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      });

      await expect(client.requestWithRetry('https://api.test.com')).rejects.toThrow('HTTP 404: Not Found');
    });

    test('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ data: 'test' }),
          }), 15000);
        })
      );

      const promise = client.requestWithRetry('https://api.test.com');
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(10000);
      
      await expect(promise).rejects.toThrow('Request timeout');
    });
  });

  describe('makeRequest', () => {
    test('should add API key to parameters', async () => {
      const mockData = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      await client.makeRequest('https://api.test.com', { param1: 'value1' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=test-nasa-key'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'MeteorMastery/1.0',
          }),
        })
      );
    });

    test('should handle different response types', async () => {
      const mockText = 'test response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockText,
      });

      const result = await client.makeRequest('https://api.test.com', {}, { responseType: 'text' });

      expect(result).toBe(mockText);
    });
  });

  describe('NEO methods', () => {
    test('getNeoFeedEnhanced should fetch NEO feed data', async () => {
      const mockData = { near_earth_objects: {} };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getNeoFeedEnhanced('2023-01-01', '2023-01-02');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/neo/rest/v1/feed')
      );
    });

    test('getNeoLookupEnhanced should fetch specific asteroid data', async () => {
      const mockData = { id: '123', name: 'Test Asteroid' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getNeoLookupEnhanced('123');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/neo/rest/v1/neo/123')
      );
    });

    test('getNeoBrowseEnhanced should fetch browse data', async () => {
      const mockData = { near_earth_objects: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await client.getNeoBrowseEnhanced();

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/neo/rest/v1/neo/browse')
      );
    });

    test('getMultipleAsteroids should fetch multiple asteroids', async () => {
      const mockData1 = { id: '123', name: 'Asteroid 1' };
      const mockData2 = { id: '456', name: 'Asteroid 2' };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockData1,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockData2,
        });

      const results = await client.getMultipleAsteroids(['123', '456']);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
    });
  });

  describe('subscribeToNeoUpdates', () => {
    test('should call callback with data on successful update', async () => {
      const mockData = { near_earth_objects: {} };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const callback = jest.fn();
      const unsubscribe = client.subscribeToNeoUpdates(callback, 1000);

      // Wait for first call
      await Promise.resolve();
      jest.advanceTimersByTime(0);

      expect(callback).toHaveBeenCalledWith(null, mockData);

      unsubscribe();
    });

    test('should call callback with error on failed update', async () => {
      const error = new Error('API Error');
      mockFetch.mockRejectedValue(error);

      const callback = jest.fn();
      const unsubscribe = client.subscribeToNeoUpdates(callback, 1000);

      // Wait for first call
      await Promise.resolve();
      jest.advanceTimersByTime(0);

      expect(callback).toHaveBeenCalledWith(error, null);

      unsubscribe();
    });
  });

  describe('cache management', () => {
    test('generateCacheKey should create cache key', () => {
      const key = client.generateCacheKey('/test', { param: 'value' }, {});
      expect(key).toBe('/test:{"param":"value"}');
    });

    test('generateCacheKey should use custom cache key', () => {
      const key = client.generateCacheKey('/test', {}, { cacheKey: 'custom-key' });
      expect(key).toBe('custom-key');
    });

    test('getFromCache should return cached data within TTL', () => {
      const data = { test: 'data' };
      client.setCache('test-key', data, 60000);
      
      const result = client.getFromCache('test-key', 60000);
      expect(result).toEqual(data);
    });

    test('getFromCache should return null for expired cache', () => {
      const data = { test: 'data' };
      client.setCache('test-key', data, 60000);
      
      // Fast-forward time beyond TTL
      jest.advanceTimersByTime(70000);
      
      const result = client.getFromCache('test-key', 60000);
      expect(result).toBeNull();
    });

    test('clearCache should remove specific cache entry', () => {
      client.setCache('test-key-1', { data: 1 }, 60000);
      client.setCache('test-key-2', { data: 2 }, 60000);
      
      client.clearCache('test-key-1');
      
      expect(client.getFromCache('test-key-1', 60000)).toBeNull();
      expect(client.getFromCache('test-key-2', 60000)).toEqual({ data: 2 });
    });

    test('clearCache should remove all cache entries', () => {
      client.setCache('test-key-1', { data: 1 }, 60000);
      client.setCache('test-key-2', { data: 2 }, 60000);
      
      client.clearCache();
      
      expect(client.getFromCache('test-key-1', 60000)).toBeNull();
      expect(client.getFromCache('test-key-2', 60000)).toBeNull();
    });
  });

  describe('utility methods', () => {
    test('calculateRetryDelay should calculate exponential backoff', () => {
      const delay1 = client.calculateRetryDelay(1);
      const delay2 = client.calculateRetryDelay(2);
      const delay3 = client.calculateRetryDelay(3);
      
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay3).toBeGreaterThanOrEqual(4000);
    });

    test('delay should wait for specified time', async () => {
      const promise = client.delay(1000);
      jest.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });

    test('parseResponse should handle different response types', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ data: 'json' }),
        text: jest.fn().mockResolvedValue('text'),
        blob: jest.fn().mockResolvedValue(new Blob()),
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      };

      await expect(client.parseResponse(mockResponse, 'json')).resolves.toEqual({ data: 'json' });
      await expect(client.parseResponse(mockResponse, 'text')).resolves.toBe('text');
      await expect(client.parseResponse(mockResponse, 'blob')).resolves.toBeInstanceOf(Blob);
      await expect(client.parseResponse(mockResponse, 'arrayBuffer')).resolves.toBeInstanceOf(ArrayBuffer);
      await expect(client.parseResponse(mockResponse, 'unknown')).resolves.toEqual({ data: 'json' });
    });

    test('parseErrorResponse should handle error responses', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ error: 'API error' }),
        statusText: 'Bad Request',
      };

      const result = await client.parseErrorResponse(mockResponse);
      expect(result).toEqual({ error: 'API error' });
    });

    test('parseErrorResponse should handle non-JSON error responses', async () => {
      const mockResponse = {
        json: jest.fn().mockRejectedValue(new Error('Not JSON')),
        statusText: 'Bad Request',
      };

      const result = await client.parseErrorResponse(mockResponse);
      expect(result).toEqual({ message: 'Bad Request' });
    });
  });
});

describe('EnhancedUSGSClient', () => {
  let client;
  const mockFetch = fetch;

  beforeEach(() => {
    client = new EnhancedUSGSClient();
    mockFetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(client.earthquakeURL).toBe('https://earthquake.usgs.gov/fdsnws/event/1/query');
      expect(client.elevationURL).toBe('https://nationalmap.gov/epqs/pqs.php');
      expect(client.waterURL).toBe('https://waterservices.usgs.gov/nwis');
      expect(client.maxRetries).toBe(2);
    });

    test('should initialize with custom options', () => {
      const customClient = new EnhancedUSGSClient({
        maxRetries: 5,
        earthquakeURL: 'https://custom.earthquake.api',
      });
      
      expect(customClient.maxRetries).toBe(5);
      expect(customClient.earthquakeURL).toBe('https://custom.earthquake.api');
    });
  });

  describe('requestWithRetry', () => {
    test('should make successful request and cache result', async () => {
      const mockData = { features: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should return cached result on subsequent requests', async () => {
      const mockData = { features: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // First request
      await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
        ttl: 60000,
      });

      // Second request should use cache
      const result = await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
        ttl: 60000,
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure', async () => {
      const mockData = { features: [] };
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });

      const result = await client.requestWithRetry('https://api.test.com', {});

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should throw error after all retries fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.requestWithRetry('https://api.test.com', {})).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('buildUrl', () => {
    test('should build URL with parameters', () => {
      const url = client.buildUrl('https://api.test.com', {
        param1: 'value1',
        param2: 'value2',
      });

      expect(url).toContain('param1=value1');
      expect(url).toContain('param2=value2');
    });
  });

  describe('getEarthquakesEnhanced', () => {
    test('should fetch earthquake data with default parameters', async () => {
      const mockData = { features: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.getEarthquakesEnhanced();

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('earthquake.usgs.gov')
      );
    });

    test('should fetch earthquake data with custom parameters', async () => {
      const mockData = { features: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.getEarthquakesEnhanced(
        '2023-01-01',
        '2023-01-02',
        5.0
      );

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('minmagnitude=5')
      );
    });
  });

  describe('delay', () => {
    test('should wait for specified time', async () => {
      const promise = client.delay(1000);
      jest.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });
  });
});

describe('APIHealthMonitor', () => {
  let monitor;
  const mockFetch = fetch;

  beforeEach(() => {
    monitor = new APIHealthMonitor(['https://api1.test.com', 'https://api2.test.com']);
    mockFetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (monitor) {
      monitor.stopMonitoring();
    }
  });

  describe('constructor', () => {
    test('should initialize with endpoints and default options', () => {
      expect(monitor.endpoints).toEqual(['https://api1.test.com', 'https://api2.test.com']);
      expect(monitor.interval).toBe(30000);
    });

    test('should initialize with custom options', () => {
      const customMonitor = new APIHealthMonitor(['https://api.test.com'], {
        interval: 60000,
      });
      
      expect(customMonitor.interval).toBe(60000);
    });
  });

  describe('checkHealth', () => {
    test('should check health of all endpoints and mark healthy ones', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await monitor.checkHealth();

      const status = monitor.getStatus();
      expect(status.size).toBe(2);
      expect(status.get('https://api1.test.com').status).toBe('healthy');
      expect(status.get('https://api2.test.com').status).toBe('healthy');
    });

    test('should mark degraded endpoints', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      await monitor.checkHealth();

      const status = monitor.getStatus();
      expect(status.get('https://api1.test.com').status).toBe('degraded');
      expect(status.get('https://api2.test.com').status).toBe('degraded');
    });

    test('should mark down endpoints on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await monitor.checkHealth();

      const status = monitor.getStatus();
      expect(status.get('https://api1.test.com').status).toBe('down');
      expect(status.get('https://api1.test.com').error).toBe('Network error');
    });
  });

  describe('startMonitoring and stopMonitoring', () => {
    test('should start and stop monitoring', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      monitor.startMonitoring();
      
      // Check that initial health check was performed
      await Promise.resolve();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      monitor.stopMonitoring();
      
      // Advance time and ensure no more calls are made
      jest.advanceTimersByTime(30000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStatus', () => {
    test('should return status map', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await monitor.checkHealth();
      const status = monitor.getStatus();

      expect(status).toBeInstanceOf(Map);
      expect(status.size).toBe(2);
    });
  });
});