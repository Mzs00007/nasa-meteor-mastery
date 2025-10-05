import axios from 'axios';

class NASAService {
  constructor() {
    this.apiKey =
      window.MeteorMadnessConfig?.NASA?.NEO_API_KEY ||
      process.env.REACT_APP_NEO_API_KEY ||
      'DEMO_KEY';
    this.baseURL =
      window.MeteorMadnessConfig?.NASA?.NEO_BASE_URL ||
      'https://api.nasa.gov/neo/rest/v1';
    this.donkiURL =
      window.MeteorMadnessConfig?.NASA?.DONKI_BASE_URL ||
      'https://api.nasa.gov/DONKI';
    this.eonetURL =
      window.MeteorMadnessConfig?.NASA?.EONET_BASE_URL ||
      'https://eonet.gsfc.nasa.gov/api/v3';

    // Rate limiting configuration
    this.isDemoKey = this.apiKey === 'DEMO_KEY';
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.hourlyRequestCount = 0;
    this.dailyRequestCount = 0;
    this.lastHourReset = Date.now();
    this.lastDayReset = Date.now();

    // Rate limits for DEMO_KEY vs real API key
    this.rateLimits = this.isDemoKey
      ? {
          requestsPerHour: 30,
          requestsPerDay: 50,
          minInterval: 2000, // 2 seconds between requests
        }
      : {
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          minInterval: 100, // 100ms between requests
        };

    // Enhanced caching
    this.cache = new Map();
    this.cacheConfig = {
      neoFeed: 15 * 60 * 1000, // 15 minutes
      neoBrowse: 30 * 60 * 1000, // 30 minutes
      neoLookup: 60 * 60 * 1000, // 1 hour
      spaceWeather: 10 * 60 * 1000, // 10 minutes
    };

    // Axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor to add API key
    this.client.interceptors.request.use(
      config => {
        config.params = {
          ...config.params,
          api_key: this.apiKey,
        };
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        return Promise.reject(error);
      }
    );
  }

  // Rate limiting and caching methods
  resetCountersIfNeeded() {
    const now = Date.now();

    // Reset hourly counter
    if (now - this.lastHourReset > 60 * 60 * 1000) {
      this.hourlyRequestCount = 0;
      this.lastHourReset = now;
    }

    // Reset daily counter
    if (now - this.lastDayReset > 24 * 60 * 60 * 1000) {
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
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${paramString}`;
  }

  getCachedData(cacheKey, ttl) {
    // Check memory cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`Using memory cached data for ${cacheKey}`);
      return cached.data;
    }

    // Check localStorage for persistent cache
    try {
      const persistentCached = localStorage.getItem(`nasa_cache_${cacheKey}`);
      if (persistentCached) {
        const parsed = JSON.parse(persistentCached);
        if (Date.now() - parsed.timestamp < ttl) {
          console.log(`Using persistent cached data for ${cacheKey}`);
          // Also store in memory cache for faster access
          this.cache.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Error reading from localStorage cache:', error);
    }

    return null;
  }

  setCachedData(cacheKey, data) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };

    // Store in memory cache
    this.cache.set(cacheKey, cacheEntry);

    // Store in persistent cache for important data
    if (this.shouldPersistCache(cacheKey)) {
      try {
        localStorage.setItem(
          `nasa_cache_${cacheKey}`,
          JSON.stringify(cacheEntry)
        );
      } catch (error) {
        console.warn('Error writing to localStorage cache:', error);
        // If localStorage is full, clean up old entries
        this.cleanupPersistentCache();
      }
    }

    // Clean up old memory cache entries (keep last 100)
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, entries.length - 100).forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  shouldPersistCache(cacheKey) {
    // Persist important data types that are expensive to fetch
    return (
      cacheKey.includes('/neo/') ||
      cacheKey.includes('/feed') ||
      cacheKey.includes('/browse')
    );
  }

  cleanupPersistentCache() {
    try {
      const cacheKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nasa_cache_')) {
          cacheKeys.push(key);
        }
      }

      // Sort by timestamp and remove oldest entries
      const cacheEntries = cacheKeys
        .map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            return { key, timestamp: data.timestamp };
          } catch {
            return { key, timestamp: 0 };
          }
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25% of entries
      const toRemove = Math.floor(cacheEntries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(cacheEntries[i].key);
      }

      console.log(`Cleaned up ${toRemove} old cache entries`);
    } catch (error) {
      console.warn('Error cleaning up persistent cache:', error);
    }
  }

  // Preload commonly used data
  async preloadCache() {
    if (!this.canMakeRequest()) {
      console.log('Cannot preload cache due to rate limits');
      return;
    }

    try {
      console.log('Preloading commonly used data...');

      // Preload today's NEO feed
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Only preload if not already cached
      const feedCacheKey = this.getCacheKey('/neo/feed', {
        start_date: today,
        end_date: tomorrowStr,
      });
      if (!this.getCachedData(feedCacheKey, this.cacheConfig.neoFeed)) {
        await this.getNeoFeed(today, tomorrowStr);
      }

      // Preload browse data
      const browseCacheKey = this.getCacheKey('/neo/browse');
      if (!this.getCachedData(browseCacheKey, this.cacheConfig.neoBrowse)) {
        await this.getNeoBrowse();
      }

      console.log('Cache preloading completed');
    } catch (error) {
      console.warn('Error preloading cache:', error);
    }
  }

  async makeRateLimitedRequest(requestFn, cacheKey, ttl) {
    // Check cache first
    const cachedData = this.getCachedData(cacheKey, ttl);
    if (cachedData) {
      return cachedData;
    }

    // Check if we can make the request immediately
    if (this.canMakeRequest()) {
      return this.executeRequest(requestFn, cacheKey);
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        requestFn,
        cacheKey,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  async executeRequest(requestFn, cacheKey, maxRetries = 3) {
    let lastError;
    console.log(`[nasaService] executeRequest called with cacheKey: ${cacheKey}, maxRetries: ${maxRetries}`);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[nasaService] Making API request for ${cacheKey} (attempt ${attempt + 1}/${maxRetries + 1})`
        );
        this.lastRequestTime = Date.now();
        this.hourlyRequestCount++;
        this.dailyRequestCount++;

        const response = await requestFn();

        // Cache successful responses
        if (response && response.data) {
          this.setCachedData(cacheKey, response.data);
          return response.data;
        }

        return response;
      } catch (error) {
        lastError = error;

        // Don't retry on certain error types
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('Authentication/Authorization error, not retrying');
          throw error;
        }

        // For 429 errors or server errors, use exponential backoff
        if (attempt < maxRetries && this.shouldRetry(error)) {
          const delay = this.calculateBackoffDelay(
            attempt,
            error.response?.status
          );
          console.warn(
            `Request failed (${error.response?.status || error.message}), retrying in ${delay}ms...`
          );
          await this.sleep(delay);
          continue;
        }

        // Handle rate limits for final attempt
        if (error.response?.status === 429) {
          console.warn('Rate limit exceeded, will retry later');
          // Wait longer before next request
          this.lastRequestTime = Date.now() + 60000; // Wait 1 minute
        }

        // If we've exhausted retries, throw the last error
        console.error(`[nasaService] Request failed after ${maxRetries + 1} attempts for cacheKey: ${cacheKey}`);
        console.error(`[nasaService] Final error:`, error);
        throw error;
      }
    }

    throw lastError;
  }

  shouldRetry(error) {
    // Retry on rate limits, server errors, and network errors
    const status = error.response?.status;
    return (
      status === 429 || // Rate limit
      status === 500 || // Internal server error
      status === 502 || // Bad gateway
      status === 503 || // Service unavailable
      status === 504 || // Gateway timeout
      !status // Network error
    );
  }

  calculateBackoffDelay(attempt, statusCode) {
    // Base delay starts at 1 second
    let baseDelay = 1000;

    // For rate limits, use longer delays
    if (statusCode === 429) {
      baseDelay = this.isDemoKey ? 60000 : 30000; // 1 minute for demo key, 30 seconds for real key
    }

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add up to 10% jitter

    return Math.min(exponentialDelay + jitter, 300000); // Cap at 5 minutes
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      if (!this.canMakeRequest()) {
        // Wait until we can make the next request
        const waitTime = Math.max(
          this.rateLimits.minInterval - (Date.now() - this.lastRequestTime),
          1000
        );
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const { requestFn, cacheKey, resolve, reject } =
        this.requestQueue.shift();

      try {
        const result = await this.executeRequest(requestFn, cacheKey);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  // NEO (Near Earth Objects) API Methods
  async getNeoFeed(startDate, endDate) {
    const params = { start_date: startDate, end_date: endDate };
    const cacheKey = this.getCacheKey('/feed', params);

    const requestFn = () => this.client.get('/feed', { params });

    try {
      return await this.makeRateLimitedRequest(
        requestFn,
        cacheKey,
        this.cacheConfig.neoFeed
      );
    } catch (error) {
      const fallbackData = this.getDemoNeoFeed();
      return this.handleErrorWithFallback(error, 'NEO Feed', fallbackData);
    }
  }

  async getNeoLookup(asteroidId) {
    const cacheKey = this.getCacheKey(`/neo/${asteroidId}`);

    const requestFn = () => this.client.get(`/neo/${asteroidId}`);

    try {
      return await this.makeRateLimitedRequest(
        requestFn,
        cacheKey,
        this.cacheConfig.neoLookup
      );
    } catch (error) {
      return this.handleErrorWithFallback(
        error,
        'NEO Lookup',
        this.getDemoNeoLookup(asteroidId)
      );
    }
  }

  async getNeoBrowse() {
    const cacheKey = this.getCacheKey('/neo/browse');

    const requestFn = () => this.client.get('/neo/browse');

    try {
      return await this.makeRateLimitedRequest(
        requestFn,
        cacheKey,
        this.cacheConfig.neoBrowse
      );
    } catch (error) {
      return this.handleErrorWithFallback(
        error,
        'NEO Browse',
        this.getDemoNeoBrowse()
      );
    }
  }

  // DONKI (Space Weather) API Methods
  async getSolarFlares(startDate, endDate) {
    try {
      const response = await axios.get(`${this.donkiURL}/FLR`, {
        params: {
          startDate,
          endDate,
          api_key: this.apiKey,
        },
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
          api_key: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Coronal Mass Ejections');
    }
  }

  // EONET (Earth Observatory) API Methods
  async getNaturalEvents(category = null, status = 'open') {
    try {
      const response = await axios.get(`${this.eonetURL}/events`, {
        params: {
          category: category,
          status: status,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Natural Events');
    }
  }

  // Planetary Data and Imagery
  async getPlanetaryData(body = 'earth') {
    try {
      const response = await axios.get('https://api.nasa.gov/planetary/apod', {
        params: {
          api_key: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Planetary Data');
    }
  }

  async getEarthImagery(lat, lon, date, dim = 0.025) {
    try {
      const response = await axios.get(
        'https://api.nasa.gov/planetary/earth/imagery',
        {
          params: {
            lat,
            lon,
            date,
            dim,
            api_key: this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Earth Imagery');
    }
  }

  // Texture and Asset Loading from NASA Sources
  async loadPlanetTextures() {
    const textures = {
      earth: {
        baseColor:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004400/a004448/earth_lights_4096.jpg',
        normalMap:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004400/a004448/earth_normal_4096.jpg',
        specularMap:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004400/a004448/earth_specular_4096.jpg',
        cloudMap:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004400/a004448/earth_clouds_4096.jpg',
      },
      mars: {
        baseColor:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004362/mars_4k_color.jpg',
        normalMap:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004362/mars_4k_normal.jpg',
        specularMap:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004362/mars_4k_specular.jpg',
      },
      moon: {
        baseColor:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004766/moon_4k.jpg',
        normalMap:
          'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004766/moon_4k_normal.jpg',
      },
    };

    return textures;
  }

  async loadAsteroidTextures() {
    const textures = {
      metallic: {
        baseColor:
          'https://images-assets.nasa.gov/image/PIA18881/PIA18881~orig.jpg',
        normalMap:
          'https://images-assets.nasa.gov/image/PIA18881/PIA18881~medium.jpg',
        roughnessMap:
          'https://images-assets.nasa.gov/image/PIA18881/PIA18881~small.jpg',
      },
      carbonaceous: {
        baseColor:
          'https://images-assets.nasa.gov/image/PIA21074/PIA21074~orig.jpg',
        normalMap:
          'https://images-assets.nasa.gov/image/PIA21074/PIA21074~medium.jpg',
      },
      stony: {
        baseColor:
          'https://images-assets.nasa.gov/image/PIA21073/PIA21073~orig.jpg',
        normalMap:
          'https://images-assets.nasa.gov/image/PIA21073/PIA21073~medium.jpg',
      },
    };

    return textures;
  }

  // Utility Methods
  handleError(error, context) {
    const errorMessage =
      error.response?.data?.error_message ||
      error.message ||
      `Failed to fetch ${context} data`;

    return new Error(errorMessage);
  }

  handleErrorWithFallback(error, context, fallbackData) {
    // Handle rate limit errors more gracefully
    if (error.response?.status === 429) {
      // Only log rate limit errors at debug level to reduce console noise
      console.debug(`${context}: Rate limit exceeded, using cached/demo data`);
      return fallbackData;
    }

    // Handle demo key limitations gracefully
    if (this.isDemoKey && error.response?.status >= 400) {
      console.debug(`${context}: Demo API key limitation, using fallback data`);
      return fallbackData;
    }

    // For network errors or other issues, log but don't spam console
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.debug(`${context}: Network connectivity issue, using fallback data`);
      return fallbackData;
    }

    // For other errors, log once but use fallback data
    console.warn(`${context}: API temporarily unavailable, using fallback data`);
    return fallbackData;
  }

  // Demo data methods for fallback
  getDemoNeoFeed() {
    const today = new Date().toISOString().split('T')[0];
    return {
      element_count: 8,
      near_earth_objects: {
        [today]: [
          {
            id: '2024001',
            name: '(2024 AA1)',
            estimated_diameter: {
              meters: {
                estimated_diameter_min: 45,
                estimated_diameter_max: 120,
              },
            },
            is_potentially_hazardous_asteroid: true,
            close_approach_data: [
              {
                close_approach_date: today,
                relative_velocity: {
                  kilometers_per_second: '18.5',
                },
                miss_distance: {
                  kilometers: '4500000',
                  astronomical: '0.03',
                  lunar: '11.7',
                },
              },
            ],
          },
          {
            id: '2024002',
            name: '(2024 BB2)',
            estimated_diameter: {
              meters: {
                estimated_diameter_min: 80,
                estimated_diameter_max: 200,
              },
            },
            is_potentially_hazardous_asteroid: false,
            close_approach_data: [
              {
                close_approach_date: today,
                relative_velocity: {
                  kilometers_per_second: '22.1',
                },
                miss_distance: {
                  kilometers: '7800000',
                  astronomical: '0.052',
                  lunar: '20.3',
                },
              },
            ],
          },
        ],
      },
    };
  }

  getDemoNeoBrowse() {
    return {
      near_earth_objects: [
        {
          id: '2024003',
          name: '(2024 CC3)',
          estimated_diameter: {
            meters: {
              estimated_diameter_min: 150,
              estimated_diameter_max: 350,
            },
          },
          is_potentially_hazardous_asteroid: true,
          orbital_data: {
            orbit_class: {
              orbit_class_type: 'Apollo',
            },
          },
        },
        {
          id: '2024004',
          name: '(2024 DD4)',
          estimated_diameter: {
            meters: {
              estimated_diameter_min: 60,
              estimated_diameter_max: 140,
            },
          },
          is_potentially_hazardous_asteroid: false,
          orbital_data: {
            orbit_class: {
              orbit_class_type: 'Amor',
            },
          },
        },
      ],
    };
  }

  getDemoNeoLookup(asteroidId) {
    return {
      id: asteroidId,
      name: `Demo Asteroid ${asteroidId}`,
      estimated_diameter: {
        meters: {
          estimated_diameter_min: 100,
          estimated_diameter_max: 250,
        },
      },
      is_potentially_hazardous_asteroid: Math.random() > 0.7,
      orbital_data: {
        orbit_class: {
          orbit_class_type: ['Apollo', 'Amor', 'Aten'][
            Math.floor(Math.random() * 3)
          ],
        },
      },
      close_approach_data: [
        {
          close_approach_date: new Date().toISOString().split('T')[0],
          relative_velocity: {
            kilometers_per_second: (Math.random() * 20 + 10).toFixed(1),
          },
          miss_distance: {
            kilometers: (Math.random() * 10000000 + 1000000).toFixed(0),
            astronomical: (Math.random() * 0.1 + 0.01).toFixed(3),
            lunar: (Math.random() * 40 + 5).toFixed(1),
          },
        },
      ],
    };
  }

  // Rate limit status methods
  getRateLimitStatus() {
    this.resetCountersIfNeeded();
    return {
      isDemoKey: this.isDemoKey,
      hourlyRequestsRemaining:
        this.rateLimits.requestsPerHour - this.hourlyRequestCount,
      dailyRequestsRemaining:
        this.rateLimits.requestsPerDay - this.dailyRequestCount,
      queueLength: this.requestQueue.length,
      canMakeRequest: this.canMakeRequest(),
      nextRequestAvailable: this.lastRequestTime + this.rateLimits.minInterval,
    };
  }

  // API Status Check
  async checkAPIStatus() {
    try {
      const response = await this.client.get('/feed', {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-02',
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get API Key Status
  getAPIKeyStatus() {
    return this.apiKey !== 'DEMO_KEY';
  }

  // Additional methods for data download service
  async getNEOFeed(startDate, endDate) {
    return this.getNeoFeed(startDate, endDate);
  }

  async getNEOLookup() {
    return this.getNeoBrowse();
  }

  async getSpaceWeatherData() {
    try {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const startDate = lastWeek.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const [solarFlares, cme] = await Promise.all([
        this.getSolarFlares(startDate, endDate),
        this.getCoronalMassEjections(startDate, endDate),
      ]);

      return {
        solarFlares,
        coronalMassEjections: cme,
        timeRange: { start: startDate, end: endDate },
      };
    } catch (error) {
      throw this.handleError(error, 'Space Weather Data');
    }
  }

  async getAsteroidData() {
    try {
      const browse = await this.getNeoBrowse();
      return browse;
    } catch (error) {
      throw this.handleError(error, 'Asteroid Data');
    }
  }

  async getEPICImages() {
    try {
      const response = await axios.get(
        'https://api.nasa.gov/EPIC/api/natural',
        {
          params: {
            api_key: this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'EPIC Images');
    }
  }

  async getMarsWeather() {
    try {
      const response = await axios.get(
        'https://api.nasa.gov/insight_weather/',
        {
          params: {
            api_key: this.apiKey,
            feedtype: 'json',
            ver: '1.0',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Mars Weather');
    }
  }

  async getEarthAssets(lat, lon, date, dim = 0.025) {
    try {
      const response = await axios.get(
        'https://api.nasa.gov/planetary/earth/assets',
        {
          params: {
            lat,
            lon,
            date,
            dim,
            api_key: this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Earth Assets');
    }
  }

  async getExoplanetData() {
    try {
      // Using NASA Exoplanet Archive
      const response = await axios.get(
        'https://exoplanetarchive.ipac.caltech.edu/TAP/sync',
        {
          params: {
            query:
              'select top 100 pl_name,hostname,discoverymethod,disc_year,pl_orbper,pl_bmasse from ps where default_flag=1',
            format: 'json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Exoplanet Data');
    }
  }

  async getTechTransferData() {
    try {
      const response = await axios.get(
        'https://api.nasa.gov/techtransfer/patent/',
        {
          params: {
            api_key: this.apiKey,
            engine: 'patent',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Tech Transfer Data');
    }
  }

  async getImageAndVideoLibrary(query = 'asteroid') {
    try {
      const response = await axios.get('https://images-api.nasa.gov/search', {
        params: {
          q: query,
          media_type: 'image,video',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Image and Video Library');
    }
  }

  async getSoundLibrary(query = 'space') {
    try {
      const response = await axios.get('https://images-api.nasa.gov/search', {
        params: {
          q: query,
          media_type: 'audio',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Sound Library');
    }
  }

  async getGeneLab(study_id = null) {
    try {
      const baseUrl =
        'https://genelab-data.ndc.nasa.gov/genelab/data/study/data';
      const url = study_id ? `${baseUrl}/${study_id}` : baseUrl;

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'GeneLab Data');
    }
  }

  async getEarthObservationData(
    dataset = 'MODIS_Terra_CorrectedReflectance_TrueColor'
  ) {
    try {
      const response = await axios.get(
        'https://worldview.earthdata.nasa.gov/api/v1/snapshots',
        {
          params: {
            REQUEST: 'GetSnapshot',
            LAYERS: dataset,
            CRS: 'EPSG:4326',
            TIME: new Date().toISOString().split('T')[0],
            BBOX: '-180,-90,180,90',
            FORMAT: 'image/jpeg',
            WIDTH: 1024,
            HEIGHT: 512,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Earth Observation Data');
    }
  }
}

// Create singleton instance
export const nasaService = new NASAService();
export default nasaService;
