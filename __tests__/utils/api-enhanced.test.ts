import { EnhancedNASAClient, EnhancedUSGSClient, EnhancedAPIUtils, APIError } from '../../src/utils/api-enhanced';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window object with config
(global as any).window = {
  MeteorMadnessConfig: {
    NASA: {
      NEO_API_KEY: 'test-key',
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
};

describe('APIError', () => {
  test('should create APIError with message and status code', () => {
    const error = new APIError('Test error', 404, { detail: 'Not found' });
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.data).toEqual({ detail: 'Not found' });
    expect(error.name).toBe('APIError');
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
  let client: EnhancedNASAClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

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
      expect(client).toBeInstanceOf(EnhancedNASAClient);
    });

    test('should initialize with custom options', () => {
      const customClient = new EnhancedNASAClient({
        apiKey: 'custom-key',
        retryAttempts: 5,
        timeout: 20000,
      });
      
      expect(customClient).toBeInstanceOf(EnhancedNASAClient);
    });
  });

  describe('requestWithRetry', () => {
    test('should make successful request and cache result', async () => {
      const mockData = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

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
        json: async () => mockData,
      } as Response);

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
          json: async () => mockData,
        } as Response);

      const result = await client.requestWithRetry('https://api.test.com');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should throw error after all retries fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.requestWithRetry('https://api.test.com')).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ data: 'test' }),
          } as Response), 15000);
        })
      );

      const promise = client.requestWithRetry('https://api.test.com');
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(10000);
      
      await expect(promise).rejects.toThrow('Request timeout');
    });

    test('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      } as Response);

      await expect(client.requestWithRetry('https://api.test.com')).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('NEO methods', () => {
    test('getNeoFeedEnhanced should fetch NEO feed data', async () => {
      const mockData = { near_earth_objects: {} };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

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
        json: async () => mockData,
      } as Response);

      const result = await client.getNeoLookupEnhanced('123');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/neo/rest/v1/neo/123')
      );
    });

    test('getMultipleAsteroids should fetch multiple asteroids', async () => {
      const mockData1 = { id: '123', name: 'Asteroid 1' };
      const mockData2 = { id: '456', name: 'Asteroid 2' };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        } as Response);

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
        json: async () => mockData,
      } as Response);

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
    test('clearCache should remove specific cache entry', async () => {
      const mockData = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Make cached request
      await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
      });

      // Clear specific cache
      client.clearCache('test-key');

      // Next request should hit API again
      await client.requestWithRetry('https://api.test.com', {}, {
        useCache: true,
        cacheKey: 'test-key',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('clearCache should remove all cache entries', async () => {
      const mockData = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Make multiple cached requests
      await client.requestWithRetry('https://api.test.com/1', {}, {
        useCache: true,
        cacheKey: 'test-key-1',
      });
      await client.requestWithRetry('https://api.test.com/2', {}, {
        useCache: true,
        cacheKey: 'test-key-2',
      });

      // Clear all cache
      client.clearCache();

      // Next requests should hit API again
      await client.requestWithRetry('https://api.test.com/1', {}, {
        useCache: true,
        cacheKey: 'test-key-1',
      });
      await client.requestWithRetry('https://api.test.com/2', {}, {
        useCache: true,
        cacheKey: 'test-key-2',
      });

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});

describe('EnhancedUSGSClient', () => {
  let client: EnhancedUSGSClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new EnhancedUSGSClient();
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(client).toBeInstanceOf(EnhancedUSGSClient);
    });

    test('should initialize with custom options', () => {
      const customClient = new EnhancedUSGSClient({
        retryAttempts: 5,
      });
      
      expect(customClient).toBeInstanceOf(EnhancedUSGSClient);
    });
  });

  describe('requestWithRetry', () => {
    test('should make successful request', async () => {
      const mockData = { features: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.requestWithRetry('https://api.test.com');

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
        } as Response);

      const result = await client.requestWithRetry('https://api.test.com');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getEarthquakesWithRetry', () => {
    test('should fetch earthquake data with default parameters', async () => {
      const mockData = { features: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.getEarthquakesWithRetry();

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
      } as Response);

      const result = await client.getEarthquakesWithRetry(
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
});

describe('EnhancedAPIUtils', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createRateLimiter', () => {
    test('should allow requests within rate limit', async () => {
      const rateLimiter = EnhancedAPIUtils.createRateLimiter({
        requestsPerMinute: 60,
        burstCapacity: 10,
      });

      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await rateLimiter(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should reject requests exceeding rate limit', async () => {
      const rateLimiter = EnhancedAPIUtils.createRateLimiter({
        requestsPerMinute: 60,
        burstCapacity: 1,
      });

      const mockFn = jest.fn().mockResolvedValue('success');

      // First request should succeed
      await rateLimiter(mockFn);

      // Second request should fail
      await expect(rateLimiter(mockFn)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('createCircuitBreaker', () => {
    test('should allow requests when circuit is closed', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const circuitBreaker = EnhancedAPIUtils.createCircuitBreaker(mockFn, {
        failureThreshold: 3,
      });

      const result = await circuitBreaker();

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should open circuit after failure threshold', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));
      const circuitBreaker = EnhancedAPIUtils.createCircuitBreaker(mockFn, {
        failureThreshold: 2,
        resetTimeout: 1000,
      });

      // First two failures
      await expect(circuitBreaker()).rejects.toThrow('Service error');
      await expect(circuitBreaker()).rejects.toThrow('Service error');

      // Circuit should now be open
      await expect(circuitBreaker()).rejects.toThrow('Circuit breaker open');
    });

    test('should transition to half-open after reset timeout', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Service error'))
        .mockRejectedValueOnce(new Error('Service error'))
        .mockResolvedValueOnce('success');

      const circuitBreaker = EnhancedAPIUtils.createCircuitBreaker(mockFn, {
        failureThreshold: 2,
        resetTimeout: 1000,
        halfOpenAttempts: 1,
      });

      // Trigger circuit open
      await expect(circuitBreaker()).rejects.toThrow('Service error');
      await expect(circuitBreaker()).rejects.toThrow('Service error');

      // Fast-forward time to reset timeout
      jest.advanceTimersByTime(1000);

      // Should now allow one attempt in half-open state
      const result = await circuitBreaker();
      expect(result).toBe('success');
    });
  });

  describe('createDeduplicator', () => {
    test('should deduplicate identical requests', async () => {
      const deduplicator = EnhancedAPIUtils.createDeduplicator();
      const mockFn = jest.fn().mockResolvedValue('success');

      // Make multiple identical requests
      const promises = [
        deduplicator('key1', mockFn),
        deduplicator('key1', mockFn),
        deduplicator('key1', mockFn),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(['success', 'success', 'success']);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should not deduplicate different requests', async () => {
      const deduplicator = EnhancedAPIUtils.createDeduplicator();
      const mockFn = jest.fn().mockResolvedValue('success');

      // Make different requests
      const promises = [
        deduplicator('key1', mockFn),
        deduplicator('key2', mockFn),
        deduplicator('key3', mockFn),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(['success', 'success', 'success']);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('monitorAPIHealth', () => {
    test('should monitor API health and return status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response);

      const monitor = await EnhancedAPIUtils.monitorAPIHealth([
        'https://api1.test.com',
        'https://api2.test.com',
      ]);

      const status = monitor.getStatus();

      expect(status.size).toBe(2);
      expect(status.get('https://api1.test.com')?.status).toBe('healthy');
      expect(status.get('https://api2.test.com')?.status).toBe('healthy');

      monitor.stop();
    });

    test('should detect unhealthy APIs', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const monitor = await EnhancedAPIUtils.monitorAPIHealth([
        'https://api.test.com',
      ]);

      const status = monitor.getStatus();

      expect(status.get('https://api.test.com')?.status).toBe('down');
      expect(status.get('https://api.test.com')?.error).toBe('Network error');

      monitor.stop();
    });
  });

  describe('createAPILogger', () => {
    test('should create logger with default options', () => {
      const logger = EnhancedAPIUtils.createAPILogger();

      expect(logger.logRequest).toBeDefined();
      expect(logger.logResponse).toBeDefined();
      expect(logger.logError).toBeDefined();
    });

    test('should log requests, responses, and errors', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const logger = EnhancedAPIUtils.createAPILogger();

      const mockRequest = {
        method: 'GET',
        url: 'https://api.test.com',
        headers: {},
        body: null,
      } as Request;

      const mockResponse = {
        status: 200,
      } as Response;

      const mockError = new APIError('Test error', 500);

      logger.logRequest(mockRequest);
      logger.logResponse(mockResponse, 100);
      logger.logError(mockError);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});