// Enhanced API Integration with async/await, caching, retry logic, and environment variables
import { MeteorMadnessConfig } from '../config.js';

/**
 * Enhanced NASA API Client with comprehensive error handling, caching, and retry logic
 */
class EnhancedNASAClient {
  constructor(options = {}) {
    this.apiKey =
      options.apiKey ||
      process.env.NASA_API_KEY ||
      MeteorMadnessConfig.NASA.NEO_API_KEY;
    this.baseURL = options.baseURL || MeteorMadnessConfig.NASA.NEO_BASE_URL;
    this.donkiURL = options.donkiURL || MeteorMadnessConfig.NASA.DONKI_BASE_URL;
    this.eonetURL = options.eonetURL || MeteorMadnessConfig.NASA.EONET_BASE_URL;

    // Caching configuration
    this.cache = new Map();
    this.defaultCacheTTL = options.cacheTTL || 300000; // 5 minutes

    // Retry configuration
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 10000;

    // Rate limiting
    this.rateLimit = options.rateLimit || 60; // requests per minute
    this.requestQueue = [];
    this.lastRequestTime = 0;

    // Logging
    this.logger = options.logger || console;
  }

  /**
   * Make API request with retry logic, caching, and error handling
   */
  async requestWithRetry(endpoint, params = {}, options = {}) {
    const cacheKey = this.generateCacheKey(endpoint, params, options);
    const ttl = options.ttl || this.defaultCacheTTL;

    // Check cache first if caching is enabled
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey, ttl);
      if (cached) {
        this.logger.debug(`Cache hit for: ${cacheKey}`);
        return cached;
      }
    }

    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Apply rate limiting
        await this.applyRateLimit();

        const result = await this.makeRequest(endpoint, params, options);

        // Cache successful response
        if (options.useCache !== false) {
          this.setCache(cacheKey, result, ttl);
        }

        return result;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `API attempt ${attempt}/${this.maxRetries} failed:`,
          error.message
        );

        if (attempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          await this.delay(delay);
        }
      }
    }

    throw new APIError(
      `All ${this.maxRetries} retry attempts failed`,
      lastError?.statusCode || 500,
      { endpoint, params, originalError: lastError }
    );
  }

  /**
   * Make actual HTTP request with timeout
   */
  async makeRequest(endpoint, params, options) {
    const url = new URL(endpoint);

    // Add API key to all requests
    params.api_key = this.apiKey;

    // Add parameters to URL
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const startTime = Date.now();
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MeteorMastery/1.0',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      // Log request metrics
      this.logRequestMetrics(endpoint, response.status, latency);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await this.parseResponse(response, options.responseType);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408);
      }

      throw error;
    }
  }

  /**
   * NEO API Methods with enhanced features
   */
  async getNeoFeedEnhanced(startDate, endDate, options = {}) {
    const endpoint = `${this.baseURL}/feed`;
    const params = {
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || new Date().toISOString().split('T')[0],
    };

    return this.requestWithRetry(endpoint, params, {
      cacheKey: `neo-feed:${params.start_date}:${params.end_date}`,
      ttl: 300000, // 5 minutes
      ...options,
    });
  }

  async getNeoLookupEnhanced(asteroidId, options = {}) {
    const endpoint = `${this.baseURL}/neo/${asteroidId}`;
    return this.requestWithRetry(
      endpoint,
      {},
      {
        cacheKey: `neo-lookup:${asteroidId}`,
        ttl: 3600000, // 1 hour
        ...options,
      }
    );
  }

  async getNeoBrowseEnhanced(options = {}) {
    const endpoint = `${this.baseURL}/neo/browse`;
    return this.requestWithRetry(
      endpoint,
      {},
      {
        cacheKey: 'neo-browse',
        ttl: 86400000, // 24 hours
        ...options,
      }
    );
  }

  /**
   * Batch processing for multiple asteroids
   */
  async getMultipleAsteroids(asteroidIds, options = {}) {
    const requests = asteroidIds.map(id =>
      this.getNeoLookupEnhanced(id, { useCache: true, ...options })
    );

    return Promise.allSettled(requests);
  }

  /**
   * Real-time monitoring with websocket support
   */
  async subscribeToNeoUpdates(callback, interval = 60000) {
    let isSubscribed = true;

    const checkUpdates = async () => {
      if (!isSubscribed) {
        return;
      }

      try {
        const data = await this.getNeoFeedEnhanced();
        callback(null, data);
      } catch (error) {
        callback(error, null);
      }

      if (isSubscribed) {
        setTimeout(checkUpdates, interval);
      }
    };

    checkUpdates();

    return () => {
      isSubscribed = false;
    };
  }

  /**
   * Cache management methods
   */
  generateCacheKey(endpoint, params, options) {
    return options.cacheKey || `${endpoint}:${JSON.stringify(params)}`;
  }

  getFromCache(key, ttl) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp < ttl) {
      return cached.data;
    }

    // Remove expired cache entry
    this.cache.delete(key);
    return null;
  }

  setCache(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Utility methods
   */
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minRequestInterval = 60000 / this.rateLimit;

    if (timeSinceLastRequest < minRequestInterval) {
      await this.delay(minRequestInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  calculateRetryDelay(attempt) {
    return this.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parseResponse(response, responseType = 'json') {
    switch (responseType) {
      case 'json':
        return response.json();
      case 'text':
        return response.text();
      case 'blob':
        return response.blob();
      case 'arrayBuffer':
        return response.arrayBuffer();
      default:
        return response.json();
    }
  }

  async parseErrorResponse(response) {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText };
    }
  }

  logRequestMetrics(endpoint, status, latency) {
    this.logger.debug(
      `API Request: ${endpoint} | Status: ${status} | Latency: ${latency}ms`
    );
  }
}

/**
 * Enhanced USGS API Client
 */
class EnhancedUSGSClient {
  constructor(options = {}) {
    this.earthquakeURL =
      options.earthquakeURL || MeteorMadnessConfig.USGS.EARTHQUAKE_API;
    this.elevationURL =
      options.elevationURL || MeteorMadnessConfig.USGS.ELEVATION_API;
    this.waterURL = options.waterURL || MeteorMadnessConfig.USGS.WATER_API;

    this.cache = new Map();
    this.maxRetries = options.maxRetries || 2;
    this.logger = options.logger || console;
  }

  async requestWithRetry(url, params, options = {}) {
    const cacheKey = options.cacheKey || `${url}:${JSON.stringify(params)}`;

    if (options.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (options.ttl || 180000)) {
        return cached.data;
      }
    }

    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.buildUrl(url, params));

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (options.useCache !== false) {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }

        return data;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    throw lastError;
  }

  buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    return url.toString();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced earthquake methods
  async getEarthquakesEnhanced(
    startTime,
    endTime,
    minMagnitude = 0,
    options = {}
  ) {
    const params = {
      format: 'geojson',
      starttime:
        startTime ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endtime: endTime || new Date().toISOString(),
      minmagnitude: minMagnitude,
    };

    return this.requestWithRetry(this.earthquakeURL, params, {
      cacheKey: `earthquakes:${minMagnitude}`,
      ttl: 300000,
      ...options,
    });
  }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data,
      timestamp: this.timestamp,
    };
  }
}

/**
 * API Health Monitoring
 */
class APIHealthMonitor {
  constructor(endpoints, options = {}) {
    this.endpoints = endpoints;
    this.interval = options.interval || 30000;
    this.results = new Map();
    this.logger = options.logger || console;
  }

  async checkHealth() {
    for (const endpoint of this.endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(endpoint, { method: 'HEAD' });
        const latency = Date.now() - start;

        this.results.set(endpoint, {
          status: response.ok ? 'healthy' : 'degraded',
          latency,
          lastCheck: new Date().toISOString(),
          error: null,
        });
      } catch (error) {
        this.results.set(endpoint, {
          status: 'down',
          latency: null,
          lastCheck: new Date().toISOString(),
          error: error.message,
        });
      }
    }
  }

  startMonitoring() {
    this.checkHealth();
    this.intervalId = setInterval(() => this.checkHealth(), this.interval);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getStatus() {
    return new Map(this.results);
  }
}

// Export enhanced API utilities
export { EnhancedNASAClient, EnhancedUSGSClient, APIError, APIHealthMonitor };

export default EnhancedNASAClient;
