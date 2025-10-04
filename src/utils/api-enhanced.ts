// Enhanced API Utilities with TypeScript, caching, retry logic, and environment variables
// Using global configuration from config.js
const MeteorMadnessConfig = (window as any).MeteorMadnessConfig || {
  NASA: {
    NEO_API_KEY: 'DEMO_KEY',
    NEO_BASE_URL: 'https://api.nasa.gov/neo/rest/v1',
    DONKI_BASE_URL: 'https://api.nasa.gov/DONKI',
    EONET_BASE_URL: 'https://eonet.gsfc.nasa.gov/api/v2.1',
  },
};

interface APIRequestOptions {
  useCache?: boolean;
  cacheKey?: string;
  ttl?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface RateLimiterOptions {
  requestsPerMinute?: number;
  burstCapacity?: number;
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  halfOpenAttempts?: number;
}

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data: any = null
  ) {
    super(message);
    this.name = 'APIError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data,
      timestamp: new Date().toISOString(),
    };
  }
}

class EnhancedNASAClient {
  private apiKey: string;
  private baseURL: string;
  private donkiURL: string;
  private eonetURL: string;
  private cache: Map<string, CacheEntry>;
  private retryAttempts: number;
  private retryDelay: number;
  private timeout: number;

  constructor(
    options: {
      apiKey?: string;
      baseURL?: string;
      donkiURL?: string;
      eonetURL?: string;
      cache?: Map<string, CacheEntry>;
      retryAttempts?: number;
      retryDelay?: number;
      timeout?: number;
    } = {}
  ) {
    this.apiKey = options.apiKey || MeteorMadnessConfig.NASA.NEO_API_KEY;
    this.baseURL = options.baseURL || MeteorMadnessConfig.NASA.NEO_BASE_URL;
    this.donkiURL = options.donkiURL || MeteorMadnessConfig.NASA.DONKI_BASE_URL;
    this.eonetURL = options.eonetURL || MeteorMadnessConfig.NASA.EONET_BASE_URL;
    this.cache = options.cache || new Map();
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 10000;
  }

  async requestWithRetry<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: APIRequestOptions = {}
  ): Promise<T> {
    const cacheKey =
      options.cacheKey || `${endpoint}:${JSON.stringify(params)}`;
    const ttl = options.ttl || 300000; // 5 minutes default

    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey, ttl);
      if (cached) {
        return cached as T;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.makeRequest<T>(endpoint, params, options);

        // Cache successful response
        if (options.useCache !== false) {
          this.setCache(cacheKey, result, ttl);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay + Math.random() * 1000);
        }
      }
    }

    throw lastError || new APIError('All retry attempts failed', 500);
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any>,
    options: APIRequestOptions
  ): Promise<T> {
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
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: options.headers || {},
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await this.parseResponse<T>(response, options.responseType);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError('Request timeout', 408);
      }

      throw error;
    }
  }

  private async parseResponse<T>(
    response: Response,
    responseType: APIRequestOptions['responseType'] = 'json'
  ): Promise<T> {
    switch (responseType) {
      case 'json':
        return await response.json();
      case 'text':
        return (await response.text()) as T;
      case 'blob':
        return (await response.blob()) as T;
      case 'arrayBuffer':
        return (await response.arrayBuffer()) as T;
      default:
        return await response.json();
    }
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText };
    }
  }

  private getFromCache(key: string, ttl: number): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp < ttl) {
      return cached.data;
    }

    // Remove expired cache entry
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // NEO API Methods with enhanced caching and error handling
  async getNeoFeedEnhanced(
    startDate?: string,
    endDate?: string,
    options: APIRequestOptions = {}
  ): Promise<any> {
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

  async getNeoLookupEnhanced(
    asteroidId: string,
    options: APIRequestOptions = {}
  ): Promise<any> {
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

  // Batch processing for multiple asteroids
  async getMultipleAsteroids(
    asteroidIds: string[],
    options: APIRequestOptions = {}
  ): Promise<PromiseSettledResult<any>[]> {
    const requests = asteroidIds.map(id =>
      this.getNeoLookupEnhanced(id, { useCache: true, ...options })
    );

    return Promise.allSettled(requests);
  }

  // Real-time monitoring with websocket support
  subscribeToNeoUpdates(
    callback: (error: Error | null, data: any) => void,
    interval: number = 60000
  ): () => void {
    let isSubscribed = true;

    const checkUpdates = async () => {
      if (!isSubscribed) return;

      try {
        const data = await this.getNeoFeedEnhanced();
        callback(null, data);
      } catch (error) {
        callback(error as Error, null);
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
}

class EnhancedUSGSClient {
  private earthquakeURL: string;
  private elevationURL: string;
  private waterURL: string;
  private cache: Map<string, CacheEntry>;
  private retryAttempts: number;

  constructor(
    options: {
      earthquakeURL?: string;
      elevationURL?: string;
      waterURL?: string;
      cache?: Map<string, CacheEntry>;
      retryAttempts?: number;
    } = {}
  ) {
    this.earthquakeURL =
      options.earthquakeURL || MeteorMadnessConfig.USGS.EARTHQUAKE_API;
    this.elevationURL =
      options.elevationURL || MeteorMadnessConfig.USGS.ELEVATION_API;
    this.waterURL = options.waterURL || MeteorMadnessConfig.USGS.WATER_API;
    this.cache = options.cache || new Map();
    this.retryAttempts = options.retryAttempts || 2;
  }

  async requestWithRetry<T>(
    url: string,
    params: Record<string, any> = {},
    options: APIRequestOptions = {}
  ): Promise<T> {
    const cacheKey = options.cacheKey || `${url}:${JSON.stringify(params)}`;

    if (options.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (options.ttl || 180000)) {
        return cached.data as T;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
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
            ttl: options.ttl || 180000,
          });
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryAttempts) {
          await this.delay(1000 * attempt);
        }
      }
    }

    throw lastError || new APIError('All retry attempts failed', 500);
  }

  private buildUrl(baseUrl: string, params: Record<string, any>): string {
    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    return url.toString();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getEarthquakesWithRetry(
    startTime?: string,
    endTime?: string,
    minMagnitude: number = 0,
    options: APIRequestOptions = {}
  ): Promise<any> {
    const params = {
      format: 'geojson',
      starttime:
        startTime ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endtime: endTime || new Date().toISOString(),
      minmagnitude: minMagnitude,
    };

    return this.requestWithRetry(this.earthquakeURL, params, options);
  }
}

// Enhanced API Utilities with comprehensive features
const EnhancedAPIUtils = {
  // Rate limiting with token bucket algorithm
  createRateLimiter(options: RateLimiterOptions = {}) {
    const requestsPerMinute = options.requestsPerMinute || 60;
    const burstCapacity = options.burstCapacity || requestsPerMinute;

    let tokens = burstCapacity;
    let lastRefill = Date.now();

    return async <T>(fn: () => Promise<T>): Promise<T> => {
      const now = Date.now();
      const elapsed = now - lastRefill;
      const newTokens = elapsed * (requestsPerMinute / 60000);

      if (newTokens > 0) {
        tokens = Math.min(burstCapacity, tokens + newTokens);
        lastRefill = now;
      }

      if (tokens < 1) {
        throw new APIError('Rate limit exceeded', 429);
      }

      tokens--;
      return fn();
    };
  },

  // Circuit breaker pattern
  createCircuitBreaker<T>(
    fn: (...args: any[]) => Promise<T>,
    options: CircuitBreakerOptions = {}
  ) {
    const {
      failureThreshold = 5,
      resetTimeout = 30000,
      halfOpenAttempts = 3,
    } = options;

    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    let failureCount = 0;
    let nextAttempt = 0;
    let halfOpenCount = 0;

    return async (...args: any[]): Promise<T> => {
      if (state === 'OPEN') {
        if (Date.now() > nextAttempt) {
          state = 'HALF_OPEN';
          halfOpenCount = 0;
        } else {
          throw new APIError('Circuit breaker open', 503);
        }
      }

      try {
        const result = await fn(...args);

        if (state === 'HALF_OPEN') {
          halfOpenCount++;
          if (halfOpenCount >= halfOpenAttempts) {
            state = 'CLOSED';
            failureCount = 0;
          }
        }

        return result;
      } catch (error) {
        if (state === 'HALF_OPEN') {
          state = 'OPEN';
          nextAttempt = Date.now() + resetTimeout;
          throw error;
        }

        failureCount++;

        if (failureCount >= failureThreshold) {
          state = 'OPEN';
          nextAttempt = Date.now() + resetTimeout;
        }

        throw error;
      }
    };
  },

  // Request deduplication
  createDeduplicator() {
    const pending = new Map<string, Promise<any>>();

    return async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
      if (pending.has(key)) {
        return pending.get(key) as Promise<T>;
      }

      const promise = fn();
      pending.set(key, promise);

      try {
        return await promise;
      } finally {
        pending.delete(key);
      }
    };
  },

  // Health check monitoring
  async monitorAPIHealth(endpoints: string[], interval: number = 30000) {
    const results = new Map<
      string,
      {
        status: 'healthy' | 'degraded' | 'down';
        latency: number | null;
        lastCheck: string;
        error?: string;
      }
    >();

    const checkHealth = async () => {
      for (const endpoint of endpoints) {
        try {
          const start = Date.now();
          const response = await fetch(endpoint, { method: 'HEAD' });
          const latency = Date.now() - start;

          results.set(endpoint, {
            status: response.ok ? 'healthy' : 'degraded',
            latency,
            lastCheck: new Date().toISOString(),
          });
        } catch (error) {
          results.set(endpoint, {
            status: 'down',
            latency: null,
            lastCheck: new Date().toISOString(),
            error: (error as Error).message,
          });
        }
      }
    };

    await checkHealth();
    const intervalId = setInterval(checkHealth, interval);

    return {
      getStatus: () => new Map(results),
      stop: () => clearInterval(intervalId),
    };
  },

  // Comprehensive logging
  createAPILogger(
    options: {
      level?: 'info' | 'warn' | 'error';
      includeHeaders?: boolean;
      includeBody?: boolean;
    } = {}
  ) {
    const {
      level = 'info',
      includeHeaders = false,
      includeBody = false,
    } = options;

    return {
      logRequest: (req: Request) => {
        console.log(`[API] ${req.method} ${req.url}`, {
          headers: includeHeaders ? req.headers : undefined,
          body: includeBody ? req.body : undefined,
        });
      },

      logResponse: (res: Response, latency: number) => {
        console.log(`[API] ${res.status} ${latency}ms`);
      },

      logError: (error: Error, context: Record<string, any> = {}) => {
        console.error(`[API Error] ${error.message}`, {
          error: error instanceof APIError ? error.toJSON() : error,
          context,
        });
      },
    };
  },
};

// Export enhanced API utilities
export { EnhancedNASAClient, EnhancedUSGSClient, EnhancedAPIUtils, APIError };

export default EnhancedAPIUtils;
