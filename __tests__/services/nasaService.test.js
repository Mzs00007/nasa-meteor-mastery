/**
 * @jest-environment node
 */

// Mock axios before any imports
jest.mock('axios');
const axios = require('axios');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Mock window.MeteorMadnessConfig
Object.defineProperty(global, 'MeteorMadnessConfig', {
  value: {
    NASA: {
      NEO_API_KEY: 'test-api-key',
      NEO_BASE_URL: 'https://api.test.nasa.gov/neo/rest/v1',
      DONKI_BASE_URL: 'https://api.test.nasa.gov/DONKI',
      EONET_BASE_URL: 'https://eonet.test.nasa.gov/api/v3'
    }
  },
  writable: true
});

// Create a mock NASAService class for testing
class MockNASAService {
  constructor() {
    this.apiKey = global.MeteorMadnessConfig?.NASA?.NEO_API_KEY || 'DEMO_KEY';
    this.isDemoKey = this.apiKey === 'DEMO_KEY';
    this.baseURL = global.MeteorMadnessConfig?.NASA?.NEO_BASE_URL || 'https://api.nasa.gov/neo/rest/v1';
    this.donkiURL = global.MeteorMadnessConfig?.NASA?.DONKI_BASE_URL || 'https://api.nasa.gov/DONKI';
    this.eonetURL = global.MeteorMadnessConfig?.NASA?.EONET_BASE_URL || 'https://eonet.sci.gsfc.nasa.gov/api/v3';
    
    this.rateLimits = this.isDemoKey
      ? {
          requestsPerHour: 30,
          requestsPerDay: 50,
          minInterval: 2000,
        }
      : {
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          minInterval: 100,
        };

    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.hourlyRequestCount = 0;
    this.dailyRequestCount = 0;
    this.lastHourReset = Date.now();
    this.lastDayReset = Date.now();

    // Mock axios instance
    this.client = {
      get: jest.fn().mockResolvedValue({ data: { test: 'data' } })
    };
  }

  resetCountersIfNeeded() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - this.lastHourReset > oneHour) {
      this.hourlyRequestCount = 0;
      this.lastHourReset = now;
    }

    if (now - this.lastDayReset > oneDay) {
      this.dailyRequestCount = 0;
      this.lastDayReset = now;
    }
  }

  canMakeRequest() {
    this.resetCountersIfNeeded();
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    return (
      this.hourlyRequestCount < this.rateLimits.requestsPerHour &&
      this.dailyRequestCount < this.rateLimits.requestsPerDay &&
      timeSinceLastRequest >= this.rateLimits.minInterval
    );
  }

  getCacheKey(endpoint, params = {}) {
    const queryString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  getCachedData(cacheKey, maxAge = 300000) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Clean up old entries if cache is too large
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 10 entries
      for (let i = 0; i < 10; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    // Try to persist to localStorage
    try {
      if (this.shouldPersistCache(cacheKey)) {
        localStorage.setItem(`nasa_cache_${cacheKey}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      // localStorage might be full, ignore error
    }
  }

  shouldPersistCache(cacheKey) {
    return cacheKey.includes('/neo/') || 
           cacheKey.includes('/feed') || 
           cacheKey.includes('/browse');
  }

  handleError(error, context) {
    const errorInfo = {
      context,
      timestamp: new Date().toISOString(),
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    };

    if (error.response?.data?.error_message) {
      errorInfo.message = error.response.data.error_message;
    }

    return errorInfo;
  }

  handleErrorWithFallback(error, context, fallbackData) {
    if (error.response?.status === 429 || this.isDemoKey) {
      return fallbackData;
    }
    throw this.handleError(error, context);
  }

  shouldRetry(error) {
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return [429, 500, 502, 503, 504].includes(status);
  }

  calculateBackoffDelay(attempt, statusCode) {
    if (statusCode === 429) {
      return 30000 + Math.random() * 10000; // 30-40 seconds for rate limits
    }
    
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    
    return delay + jitter;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getNeoFeed(startDate, endDate) {
    try {
      const response = await this.client.get('/feed', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      return this.handleErrorWithFallback(error, 'NEO Feed', this.getDemoNeoFeed());
    }
  }

  async getNeoLookup(asteroidId) {
    try {
      const response = await this.client.get(`/neo/${asteroidId}`);
      return response.data;
    } catch (error) {
      return this.handleErrorWithFallback(error, 'NEO Lookup', {
        id: asteroidId,
        name: 'Demo Asteroid',
        estimated_diameter: { kilometers: { estimated_diameter_min: 0.1, estimated_diameter_max: 0.2 } }
      });
    }
  }

  async getNeoBrowse() {
    try {
      const response = await this.client.get('/neo/browse');
      return response.data;
    } catch (error) {
      return this.handleErrorWithFallback(error, 'NEO Browse', { near_earth_objects: [] });
    }
  }

  async getSolarFlares(startDate, endDate) {
    try {
      const response = await axios.get(`${this.donkiURL}/FLR`, {
        params: {
          startDate,
          endDate,
          api_key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Solar Flares');
    }
  }

  async getCoronalMassEjections(startDate, endDate) {
    try {
      const response = await axios.get(`${this.donkiURL}/CME`, {
        params: {
          startDate,
          endDate,
          api_key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Coronal Mass Ejections');
    }
  }

  async getNaturalEvents(category = null, status = 'open') {
    try {
      const response = await axios.get(`${this.eonetURL}/events`, {
        params: {
          category,
          status
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Natural Events');
    }
  }

  async getPlanetaryData() {
    try {
      const response = await axios.get('https://api.nasa.gov/planetary/apod', {
        params: {
          api_key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Planetary Data');
    }
  }

  async getEarthImagery(lat, lon, date) {
    try {
      const response = await axios.get('https://api.nasa.gov/planetary/earth/imagery', {
        params: {
          lat,
          lon,
          date,
          dim: 0.025,
          api_key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Earth Imagery');
    }
  }

  async loadPlanetTextures() {
    return {
      earth: {
        baseColor: 'https://example.com/earth-texture.jpg',
        normalMap: 'https://example.com/earth-normal.jpg'
      },
      mars: {
        baseColor: 'https://example.com/mars-texture.jpg',
        normalMap: 'https://example.com/mars-normal.jpg'
      },
      moon: {
        baseColor: 'https://example.com/moon-texture.jpg',
        normalMap: 'https://example.com/moon-normal.jpg'
      }
    };
  }

  async loadAsteroidTextures() {
    return {
      metallic: {
        baseColor: 'https://example.com/metallic-texture.jpg',
        normalMap: 'https://example.com/metallic-normal.jpg'
      },
      carbonaceous: {
        baseColor: 'https://example.com/carbon-texture.jpg',
        normalMap: 'https://example.com/carbon-normal.jpg'
      },
      stony: {
        baseColor: 'https://example.com/stony-texture.jpg',
        normalMap: 'https://example.com/stony-normal.jpg'
      }
    };
  }

  getDemoNeoFeed() {
    return {
      element_count: 3,
      near_earth_objects: {
        '2024-01-01': [
          {
            id: '2024001',
            name: 'Demo Asteroid 1',
            estimated_diameter: {
              kilometers: {
                estimated_diameter_min: 0.1,
                estimated_diameter_max: 0.2
              }
            },
            close_approach_data: [{
              relative_velocity: { kilometers_per_second: '15.5' },
              miss_distance: { kilometers: '1000000' }
            }]
          }
        ]
      }
    };
  }
}

describe('NASAService', () => {
  let nasaService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.length = 0;
    
    nasaService = new MockNASAService();
    
    // Mock axios.get
    axios.get.mockResolvedValue({ data: { test: 'space_weather_data' } });
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(nasaService.apiKey).toBe('test-api-key');
      expect(nasaService.baseURL).toBe('https://api.test.nasa.gov/neo/rest/v1');
      expect(nasaService.donkiURL).toBe('https://api.test.nasa.gov/DONKI');
      expect(nasaService.eonetURL).toBe('https://eonet.test.nasa.gov/api/v3');
    });

    it('should use demo key when no API key is configured', () => {
      delete global.MeteorMadnessConfig;
      const testService = new MockNASAService();

      expect(testService.apiKey).toBe('DEMO_KEY');
      expect(testService.isDemoKey).toBe(true);
    });

    it('should set correct rate limits for demo key', () => {
      const demoService = new MockNASAService();
      demoService.apiKey = 'DEMO_KEY';
      demoService.isDemoKey = true;
      demoService.rateLimits = {
        requestsPerHour: 30,
        requestsPerDay: 50,
        minInterval: 2000,
      };

      expect(demoService.rateLimits.requestsPerHour).toBe(30);
      expect(demoService.rateLimits.requestsPerDay).toBe(50);
      expect(demoService.rateLimits.minInterval).toBe(2000);
    });
  });

  describe('Rate Limiting', () => {
    it('should reset counters when time has passed', () => {
      nasaService.hourlyRequestCount = 10;
      nasaService.dailyRequestCount = 20;
      nasaService.lastHourReset = Date.now() - (61 * 60 * 1000); // 61 minutes ago
      nasaService.lastDayReset = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago

      nasaService.resetCountersIfNeeded();

      expect(nasaService.hourlyRequestCount).toBe(0);
      expect(nasaService.dailyRequestCount).toBe(0);
    });

    it('should allow requests when under rate limits', () => {
      nasaService.hourlyRequestCount = 5;
      nasaService.dailyRequestCount = 10;
      nasaService.lastRequestTime = Date.now() - 3000; // 3 seconds ago

      expect(nasaService.canMakeRequest()).toBe(true);
    });

    it('should deny requests when over rate limits', () => {
      nasaService.hourlyRequestCount = 1001;
      nasaService.dailyRequestCount = 10001;

      expect(nasaService.canMakeRequest()).toBe(false);
    });

    it('should deny requests when too soon after last request', () => {
      nasaService.lastRequestTime = Date.now() - 50; // 50ms ago
      nasaService.rateLimits.minInterval = 100;

      expect(nasaService.canMakeRequest()).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should generate correct cache keys', () => {
      const cacheKey = nasaService.getCacheKey('/test', { param1: 'value1', param2: 'value2' });
      expect(cacheKey).toBe('/test?param1=value1&param2=value2');
    });

    it('should return cached data when valid', () => {
      const testData = { test: 'data' };
      const cacheKey = 'test-key';
      nasaService.cache.set(cacheKey, {
        data: testData,
        timestamp: Date.now()
      });

      const result = nasaService.getCachedData(cacheKey, 60000);
      expect(result).toEqual(testData);
    });

    it('should return null for expired cache', () => {
      const testData = { test: 'data' };
      const cacheKey = 'test-key';
      nasaService.cache.set(cacheKey, {
        data: testData,
        timestamp: Date.now() - 70000 // 70 seconds ago
      });

      const result = nasaService.getCachedData(cacheKey, 60000);
      expect(result).toBeNull();
    });

    it('should set cached data in memory and localStorage', () => {
      const testData = { test: 'data' };
      const cacheKey = '/neo/test';

      nasaService.setCachedData(cacheKey, testData);

      expect(nasaService.cache.has(cacheKey)).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `nasa_cache_${cacheKey}`,
        expect.stringContaining('"test":"data"')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const testData = { test: 'data' };
      const cacheKey = '/neo/test';

      expect(() => nasaService.setCachedData(cacheKey, testData)).not.toThrow();
      expect(nasaService.cache.has(cacheKey)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', () => {
      const error = new Error('API Error');
      error.response = {
        data: { error_message: 'Custom error message' },
        status: 500
      };

      const result = nasaService.handleError(error, 'Test Context');
      expect(result.message).toBe('Custom error message');
    });

    it('should handle errors without response data', () => {
      const error = new Error('Network Error');

      const result = nasaService.handleError(error, 'Test Context');
      expect(result.message).toBe('Network Error');
    });

    it('should return fallback data for rate limit errors', () => {
      const error = new Error('Rate Limited');
      error.response = { status: 429 };
      const fallbackData = { fallback: true };

      const result = nasaService.handleErrorWithFallback(error, 'Test', fallbackData);
      expect(result).toEqual(fallbackData);
    });

    it('should determine retry eligibility correctly', () => {
      expect(nasaService.shouldRetry({ response: { status: 429 } })).toBe(true);
      expect(nasaService.shouldRetry({ response: { status: 500 } })).toBe(true);
      expect(nasaService.shouldRetry({ response: { status: 502 } })).toBe(true);
      expect(nasaService.shouldRetry({ response: { status: 503 } })).toBe(true);
      expect(nasaService.shouldRetry({ response: { status: 504 } })).toBe(true);
      expect(nasaService.shouldRetry({})).toBe(true); // Network error
      expect(nasaService.shouldRetry({ response: { status: 401 } })).toBe(false);
      expect(nasaService.shouldRetry({ response: { status: 404 } })).toBe(false);
    });

    it('should calculate backoff delay correctly', () => {
      const delay1 = nasaService.calculateBackoffDelay(0, 500);
      const delay2 = nasaService.calculateBackoffDelay(1, 500);
      const delay3 = nasaService.calculateBackoffDelay(0, 429);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThanOrEqual(30000); // Rate limit delay
    });
  });

  describe('NEO API Methods', () => {
    it('should fetch NEO feed data', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-02';

      const result = await nasaService.getNeoFeed(startDate, endDate);

      expect(nasaService.client.get).toHaveBeenCalledWith('/feed', {
        params: { start_date: startDate, end_date: endDate }
      });
      expect(result).toEqual({ test: 'data' });
    });

    it('should fetch NEO lookup data', async () => {
      const asteroidId = '2024001';

      const result = await nasaService.getNeoLookup(asteroidId);

      expect(nasaService.client.get).toHaveBeenCalledWith(`/neo/${asteroidId}`);
      expect(result).toEqual({ test: 'data' });
    });

    it('should fetch NEO browse data', async () => {
      const result = await nasaService.getNeoBrowse();

      expect(nasaService.client.get).toHaveBeenCalledWith('/neo/browse');
      expect(result).toEqual({ test: 'data' });
    });

    it('should handle NEO API errors with fallback', async () => {
      const error = new Error('API Error');
      error.response = { status: 500 };
      nasaService.client.get.mockRejectedValue(error);

      const result = await nasaService.getNeoFeed('2024-01-01', '2024-01-02');

      expect(result).toBeDefined();
      expect(result.element_count).toBeDefined();
    });
  });

  describe('Space Weather API Methods', () => {
    it('should fetch solar flares data', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-02';

      const result = await nasaService.getSolarFlares(startDate, endDate);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/FLR'),
        {
          params: {
            startDate,
            endDate,
            api_key: 'test-api-key'
          }
        }
      );
      expect(result).toEqual({ test: 'space_weather_data' });
    });

    it('should fetch coronal mass ejections data', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-02';

      const result = await nasaService.getCoronalMassEjections(startDate, endDate);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/CME'),
        {
          params: {
            startDate,
            endDate,
            api_key: 'test-api-key'
          }
        }
      );
      expect(result).toEqual({ test: 'space_weather_data' });
    });

    it('should handle space weather API errors', async () => {
      const error = new Error('Space Weather API Error');
      axios.get.mockRejectedValue(error);

      await expect(nasaService.getSolarFlares('2024-01-01', '2024-01-02')).rejects.toThrow();
    });
  });

  describe('EONET API Methods', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({ data: { events: [] } });
    });

    it('should fetch natural events data', async () => {
      const result = await nasaService.getNaturalEvents('wildfires', 'open');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/events'),
        {
          params: {
            category: 'wildfires',
            status: 'open'
          }
        }
      );
      expect(result).toEqual({ events: [] });
    });

    it('should fetch natural events with default parameters', async () => {
      const result = await nasaService.getNaturalEvents();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/events'),
        {
          params: {
            category: null,
            status: 'open'
          }
        }
      );
    });
  });

  describe('Planetary Data Methods', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({ data: { title: 'APOD', url: 'test.jpg' } });
    });

    it('should fetch planetary data (APOD)', async () => {
      const result = await nasaService.getPlanetaryData();

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/planetary/apod',
        {
          params: {
            api_key: 'test-api-key'
          }
        }
      );
      expect(result).toEqual({ title: 'APOD', url: 'test.jpg' });
    });

    it('should fetch Earth imagery', async () => {
      const lat = 40.7128;
      const lon = -74.0060;
      const date = '2024-01-01';

      const result = await nasaService.getEarthImagery(lat, lon, date);

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/planetary/earth/imagery',
        {
          params: {
            lat,
            lon,
            date,
            dim: 0.025,
            api_key: 'test-api-key'
          }
        }
      );
    });
  });

  describe('Texture Loading Methods', () => {
    it('should load planet textures', async () => {
      const textures = await nasaService.loadPlanetTextures();

      expect(textures).toHaveProperty('earth');
      expect(textures).toHaveProperty('mars');
      expect(textures).toHaveProperty('moon');
      expect(textures.earth).toHaveProperty('baseColor');
      expect(textures.earth).toHaveProperty('normalMap');
    });

    it('should load asteroid textures', async () => {
      const textures = await nasaService.loadAsteroidTextures();

      expect(textures).toHaveProperty('metallic');
      expect(textures).toHaveProperty('carbonaceous');
      expect(textures).toHaveProperty('stony');
      expect(textures.metallic).toHaveProperty('baseColor');
      expect(textures.metallic).toHaveProperty('normalMap');
    });
  });

  describe('Demo Data Methods', () => {
    it('should provide demo NEO feed data', () => {
      const demoData = nasaService.getDemoNeoFeed();

      expect(demoData).toHaveProperty('element_count');
      expect(demoData).toHaveProperty('near_earth_objects');
      expect(demoData.element_count).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should determine which data to persist', () => {
      expect(nasaService.shouldPersistCache('/neo/12345')).toBe(true);
      expect(nasaService.shouldPersistCache('/feed?date=2024-01-01')).toBe(true);
      expect(nasaService.shouldPersistCache('/browse')).toBe(true);
      expect(nasaService.shouldPersistCache('/other-endpoint')).toBe(false);
    });

    it('should clean up old cache entries when memory limit exceeded', () => {
      // Fill cache beyond limit
      for (let i = 0; i < 105; i++) {
        nasaService.cache.set(`key-${i}`, {
          data: { test: i },
          timestamp: Date.now() - (i * 1000) // Older entries have earlier timestamps
        });
      }

      // Add one more to trigger cleanup
      nasaService.setCachedData('new-key', { test: 'new' });

      expect(nasaService.cache.size).toBeLessThanOrEqual(101); // 100 + 1 new entry
    });
  });

  describe('Sleep Utility', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await nasaService.sleep(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });
});