/**
 * Comprehensive API Service Manager
 * Handles all NASA and partner APIs with unified interface
 * Implements caching, rate limiting, error handling, and retry logic
 */

import { NASA_API_CONFIG, buildAPIUrl, getEndpointConfig } from '../config/nasa-api-config.js';

class ComprehensiveAPIService {
  constructor() {
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.hourlyRequestCount = 0;
    this.lastHourReset = Date.now();
    this.circuitBreakers = new Map();
    
    // Initialize cleanup interval
    this.startCacheCleanup();
    this.startHourlyReset();
  }

  /**
   * Generic API request method with comprehensive error handling
   */
  async makeRequest(apiName, endpoint = '', params = {}, options = {}) {
    const config = getEndpointConfig(apiName);
    const fullUrl = config.BASE_URL + endpoint;
    const cacheKey = this.generateCacheKey(fullUrl, params);
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey, config.CACHE_TTL);
    if (cachedData && !options.forceRefresh) {
      return cachedData;
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(apiName)) {
      throw new Error(`Circuit breaker open for ${apiName}. Service temporarily unavailable.`);
    }

    // Rate limiting
    await this.enforceRateLimit();

    try {
      const url = buildAPIUrl(fullUrl, params, config.REQUIRES_API_KEY);
      const response = await this.fetchWithRetry(url, options);
      
      // Cache successful response
      this.setCache(cacheKey, response, config.CACHE_TTL);
      this.resetCircuitBreaker(apiName);
      
      return response;
    } catch (error) {
      this.handleCircuitBreaker(apiName, error);
      throw error;
    }
  }

  /**
   * APOD - Astronomy Picture of the Day
   */
  async getAPOD(date = null, options = {}) {
    const params = {};
    if (date) params.date = date;
    
    return this.makeRequest('APOD', '', params, options);
  }

  /**
   * NeoWs - Near Earth Object Web Service
   */
  async getNeoFeed(startDate, endDate, options = {}) {
    const params = {
      start_date: startDate,
      end_date: endDate,
    };
    
    return this.makeRequest('NEOWS', '/feed', params, options);
  }

  async getNeoBrowse(page = 0, size = 20, options = {}) {
    const params = { page, size };
    return this.makeRequest('NEOWS', '/neo/browse', params, options);
  }

  async getNeoLookup(asteroidId, options = {}) {
    return this.makeRequest('NEOWS', `/neo/${asteroidId}`, {}, options);
  }

  async getNeoStats(options = {}) {
    return this.makeRequest('NEOWS', '/stats', {}, options);
  }

  /**
   * DONKI - Space Weather Database (via backend proxy)
   */
  async getSpaceWeatherNotifications(type = 'all', startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `http://localhost:5000/api/donki/notifications${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // Handle backend proxy response format
      return data.data || data;
    } catch (error) {
      console.error('Error fetching space weather notifications:', error);
      throw error;
    }
  }

  async getSolarFlares(startDate = null, endDate = null, options = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `http://localhost:5000/api/donki/flares${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching solar flares from URL:', url);
      
      const response = await fetch(url);
      console.log('Solar flares response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Solar flares response data:', data);
      
      return data.data || data; // Handle backend wrapper format
    } catch (error) {
      console.error('Error fetching solar flares:', error);
      throw error;
    }
  }

  async getCoronalMassEjections(startDate = null, endDate = null, options = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `http://localhost:5000/api/donki/cme${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching CME from URL:', url);
      
      const response = await fetch(url);
      console.log('CME response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('CME response data:', data);
      
      return data.data || data; // Handle backend wrapper format
    } catch (error) {
      console.error('Error fetching coronal mass ejections:', error);
      throw error;
    }
  }

  async getGeomagneticStorms(startDate = null, endDate = null, options = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `http://localhost:5000/api/donki/storms${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching geomagnetic storms from URL:', url);
      
      const response = await fetch(url);
      console.log('Geomagnetic storms response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Geomagnetic storms response data:', data);
      
      return data.data || data; // Handle backend wrapper format
    } catch (error) {
      console.error('Error fetching geomagnetic storms:', error);
      throw error;
    }
  }

  /**
   * EONET - Natural Event Tracker
   */
  async getNaturalEvents(status = 'open', limit = 100, days = 20, options = {}) {
    try {
      const params = new URLSearchParams({ status, limit, days });
      const url = `https://eonet.gsfc.nasa.gov/api/v3/events?${params}`;
      console.log('Fetching natural events from:', url);
      
      const response = await fetch(url);
      console.log('Natural events response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Natural events data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching natural events:', error);
      throw error;
    }
  }

  async getEventCategories(options = {}) {
    try {
      const url = 'https://eonet.gsfc.nasa.gov/api/v3/categories';
      console.log('Fetching event categories from:', url);
      
      const response = await fetch(url);
      console.log('Event categories response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Event categories data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching event categories:', error);
      throw error;
    }
  }

  async getEventSources(options = {}) {
    return this.makeRequest('EONET', '/sources', {}, options);
  }

  /**
   * EPIC - Earth Polychromatic Imaging Camera
   */
  async getEPICImages(date = null, options = {}) {
    const endpoint = date ? `/natural/date/${date}` : '/natural/images';
    return this.makeRequest('EPIC', endpoint, {}, options);
  }

  async getEPICAvailableDates(options = {}) {
    return this.makeRequest('EPIC', '/natural/available', {}, options);
  }

  /**
   * Mars APIs
   */
  async getMarsWeather(options = {}) {
    return this.makeRequest('MARS_INSIGHT', '', {}, options);
  }

  async getMarsRoverPhotos(rover = 'curiosity', sol = null, earthDate = null, camera = null, options = {}) {
    const params = {};
    if (sol) params.sol = sol;
    if (earthDate) params.earth_date = earthDate;
    if (camera) params.camera = camera;
    
    return this.makeRequest('MARS_ROVER', `/rovers/${rover}/photos`, params, options);
  }

  async getMarsRoverManifest(rover = 'curiosity', options = {}) {
    return this.makeRequest('MARS_ROVER', `/manifests/${rover}`, {}, options);
  }

  /**
   * NASA Image and Video Library
   */
  async searchNASALibrary(query, mediaType = 'image', yearStart = null, yearEnd = null, options = {}) {
    const params = { q: query, media_type: mediaType };
    if (yearStart) params.year_start = yearStart;
    if (yearEnd) params.year_end = yearEnd;
    
    return this.makeRequest('NASA_LIBRARY', '/search', params, options);
  }

  /**
   * Exoplanet Archive
   */
  async getExoplanets(query = 'select * from ps', format = 'json', options = {}) {
    const params = { query, format };
    return this.makeRequest('EXOPLANET', '', params, options);
  }

  /**
   * Techport - NASA Technology Projects
   */
  async getTechportProjects(options = {}) {
    return this.makeRequest('TECHPORT', '/projects', {}, options);
  }

  async getTechportProject(projectId, options = {}) {
    return this.makeRequest('TECHPORT', `/projects/${projectId}`, {}, options);
  }

  /**
   * Partner APIs - USGS Earthquake
   */
  async getEarthquakes(starttime = null, endtime = null, minmagnitude = 4.5, limit = 100, options = {}) {
    const params = {
      format: 'geojson',
      limit,
      minmagnitude,
    };
    if (starttime) params.starttime = starttime;
    if (endtime) params.endtime = endtime;
    
    return this.makeRequest('USGS_EARTHQUAKE', '/query', params, options);
  }

  /**
   * USGS Elevation
   */
  async getElevation(lat, lon, units = 'Meters', options = {}) {
    const params = {
      x: lon,
      y: lat,
      units,
      output: 'json',
    };
    
    return this.makeRequest('USGS_ELEVATION', '/pqs.php', params, options);
  }

  /**
   * Satellite Situation Center
   */
  async getSatellitePositions(satellites, startTime, endTime, options = {}) {
    const params = {
      satellites: Array.isArray(satellites) ? satellites.join(',') : satellites,
      startTime,
      endTime,
    };
    
    return this.makeRequest('SSC', '/locations', params, options);
  }

  /**
   * Solar System Dynamics
   */
  async getHorizonsData(body, startTime, endTime, options = {}) {
    const params = {
      command: body,
      start_time: startTime,
      stop_time: endTime,
      step_size: '1d',
    };
    
    return this.makeRequest('SSD', '/horizons_api.py', params, options);
  }

  /**
   * Partner APIs - Aliases for PartnerAPIsExplorer compatibility
   */
  async getUSGSEarthquakes(minMagnitude = 4.5, timeRange = 'week', options = {}) {
    try {
      // Calculate date range based on timeRange
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const params = new URLSearchParams({
        format: 'geojson',
        starttime: startDate.toISOString().split('T')[0],
        endtime: endDate.toISOString().split('T')[0],
        minmagnitude: minMagnitude,
        limit: 100
      });

      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;
      console.log('Fetching USGS earthquakes from:', url);
      
      const response = await fetch(url);
      console.log('USGS earthquakes response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('USGS earthquakes data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching USGS earthquakes:', error);
      throw error;
    }
  }

  async getUSGSElevation(lat, lon, units = 'Meters', options = {}) {
    try {
      const params = new URLSearchParams({
        x: lon,
        y: lat,
        units: units,
        output: 'json'
      });

      const url = `https://nationalmap.gov/epqs/pqs.php?${params}`;
      console.log('Fetching USGS elevation from:', url);
      
      const response = await fetch(url);
      console.log('USGS elevation response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('USGS elevation data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching USGS elevation:', error);
      throw error;
    }
  }

  async getWeatherData(location, options = {}) {
    try {
      // This is a placeholder for weather data - you would need to integrate with a weather API
      // For now, return mock data to prevent errors
      console.log('Fetching weather data for location:', location);
      
      const mockWeatherData = {
        location: location,
        temperature: Math.round(Math.random() * 30 + 10), // Random temp between 10-40°C
        humidity: Math.round(Math.random() * 100),
        windSpeed: Math.round(Math.random() * 20),
        description: 'Partly cloudy',
        timestamp: new Date().toISOString()
      };
      
      console.log('Weather data (mock):', mockWeatherData);
      return mockWeatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  generateCacheKey(url, params) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    return `${url}:${JSON.stringify(sortedParams)}`;
  }

  getFromCache(key, ttl) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCache(key, data, ttl) {
    // Implement LRU cache behavior
    if (this.cache.size >= NASA_API_CONFIG.CACHE_CONFIG.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > value.ttl) {
          this.cache.delete(key);
        }
      }
    }, NASA_API_CONFIG.CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * Rate limiting
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < NASA_API_CONFIG.RATE_LIMITS.MIN_INTERVAL) {
      const delay = NASA_API_CONFIG.RATE_LIMITS.MIN_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
    this.hourlyRequestCount++;
  }

  startHourlyReset() {
    setInterval(() => {
      this.hourlyRequestCount = 0;
      this.lastHourReset = Date.now();
    }, 60 * 60 * 1000); // Reset every hour
  }

  /**
   * Circuit breaker pattern
   */
  isCircuitBreakerOpen(apiName) {
    const breaker = this.circuitBreakers.get(apiName);
    if (!breaker) return false;
    
    const now = Date.now();
    if (now - breaker.lastFailure > NASA_API_CONFIG.ERROR_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
      this.circuitBreakers.delete(apiName);
      return false;
    }
    
    return breaker.failures >= NASA_API_CONFIG.ERROR_CONFIG.MAX_CONSECUTIVE_ERRORS;
  }

  handleCircuitBreaker(apiName, error) {
    const breaker = this.circuitBreakers.get(apiName) || { failures: 0, lastFailure: 0 };
    breaker.failures++;
    breaker.lastFailure = Date.now();
    this.circuitBreakers.set(apiName, breaker);
  }

  resetCircuitBreaker(apiName) {
    this.circuitBreakers.delete(apiName);
  }

  /**
   * HTTP request with retry logic (temporarily simplified for debugging)
   */
  async fetchWithRetry(url, options = {}) {
    try {
      console.log('fetchWithRetry called with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        ...options,
      });

      console.log('fetchWithRetry response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('fetchWithRetry JSON data received:', data);
        return data;
      } else {
        const text = await response.text();
        console.log('fetchWithRetry text data received:', text);
        return text;
      }
    } catch (error) {
      console.error('fetchWithRetry error:', error);
      throw error;
    }
  }

  /**
   * Batch requests with concurrency control
   */
  async batchRequests(requests, concurrency = 5) {
    const results = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(request => request())
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      hourlyRequests: this.hourlyRequestCount,
      cacheSize: this.cache.size,
      circuitBreakers: Array.from(this.circuitBreakers.keys()),
      lastHourReset: this.lastHourReset,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Reset circuit breakers
   */
  resetAllCircuitBreakers() {
    this.circuitBreakers.clear();
  }
}

// Create singleton instance
const comprehensiveAPIService = new ComprehensiveAPIService();

// Export the service
export default comprehensiveAPIService;

// Export specific methods for easier use
export const {
  getAPOD,
  getNeoFeed,
  getNeoBrowse,
  getNeoLookup,
  getNeoStats,
  getSpaceWeatherNotifications,
  getSolarFlares,
  getCoronalMassEjections,
  getGeomagneticStorms,
  getNaturalEvents,
  getEventCategories,
  getEventSources,
  getEPICImages,
  getEPICAvailableDates,
  getMarsWeather,
  getMarsRoverPhotos,
  getMarsRoverManifest,
  searchNASALibrary,
  getExoplanets,
  getTechportProjects,
  getTechportProject,
  getEarthquakes,
  getElevation,
  getSatellitePositions,
  getHorizonsData,
  getUSGSEarthquakes,
  getUSGSElevation,
  getWeatherData,
  getStats,
  clearCache,
  resetAllCircuitBreakers,
} = comprehensiveAPIService;