// API Utilities for NASA and USGS Integration

class NASAClient {
  constructor(apiKey = 'DEMO_KEY') {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.nasa.gov/neo/rest/v1';
    this.donkiURL = 'https://api.nasa.gov/DONKI';
    this.eonetURL = 'https://eonet.gsfc.nasa.gov/api/v2.1';
  }

  async request(endpoint, params = {}) {
    const url = new URL(endpoint);

    // Add API key to all requests
    params.api_key = this.apiKey;

    // Add parameters to URL
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NASA API Request Failed:', error);
      throw error;
    }
  }

  // NEO (Near Earth Objects) Methods
  async getNeoFeed(startDate, endDate) {
    const endpoint = `${this.baseURL}/feed`;
    const params = {
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || new Date().toISOString().split('T')[0],
    };

    return this.request(endpoint, params);
  }

  async getNeoLookup(asteroidId) {
    const endpoint = `${this.baseURL}/neo/${asteroidId}`;
    return this.request(endpoint);
  }

  async getNeoBrowse() {
    const endpoint = `${this.baseURL}/neo/browse`;
    return this.request(endpoint);
  }

  // DONKI (Space Weather) Methods
  async getSolarFlares(startDate, endDate) {
    const endpoint = `${this.donkiURL}/FLR`;
    const params = {
      startDate: startDate,
      endDate: endDate,
    };

    return this.request(endpoint, params);
  }

  async getCoronalMassEjections(startDate, endDate) {
    const endpoint = `${this.donkiURL}/CME`;
    const params = {
      startDate: startDate,
      endDate: endDate,
    };

    return this.request(endpoint, params);
  }

  // EONET (Natural Events) Methods
  async getNaturalEvents(days = 30) {
    const endpoint = `${this.eonetURL}/events`;
    const params = {
      days: days,
    };

    return this.request(endpoint, params);
  }

  // Utility method to get specific asteroid data
  async getAsteroidData(asteroidId) {
    try {
      const data = await this.getNeoLookup(asteroidId);
      return this.parseAsteroidData(data);
    } catch (error) {
      console.warn('Using demo asteroid data due to API error');
      return this.getDemoAsteroidData();
    }
  }

  parseAsteroidData(data) {
    return {
      id: data.id,
      name: data.name,
      diameter: data.estimated_diameter?.meters?.estimated_diameter_max || 0,
      velocity:
        data.close_approach_data?.[0]?.relative_velocity
          ?.kilometers_per_second || 0,
      missDistance:
        data.close_approach_data?.[0]?.miss_distance?.kilometers || 0,
      orbitClass: data.orbital_data?.orbit_class?.orbit_class_type || 'Unknown',
      hazard: data.is_potentially_hazardous_asteroid,
      nextApproach: data.close_approach_data?.[0]?.close_approach_date_full,
    };
  }

  getDemoAsteroidData() {
    // Demo data for when API is unavailable
    return {
      id: 'demo-001',
      name: 'Demo Asteroid 2023',
      diameter: 150,
      velocity: 17.5,
      missDistance: 4500000,
      orbitClass: 'Apollo',
      hazard: true,
      nextApproach: '2023-12-15 08:30:00',
    };
  }
}

class USGSClient {
  constructor() {
    this.earthquakeURL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
    this.elevationURL = 'https://nationalmap.gov/epqs/pqs.php';
    this.waterURL = 'https://waterservices.usgs.gov/nwis';
  }

  async request(url, params = {}) {
    const urlObj = new URL(url);

    Object.keys(params).forEach(key => {
      urlObj.searchParams.append(key, params[key]);
    });

    try {
      const response = await fetch(urlObj.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('USGS API Request Failed:', error);
      throw error;
    }
  }

  // Earthquake Data Methods
  async getEarthquakes(startTime, endTime, minMagnitude = 0) {
    const params = {
      format: 'geojson',
      starttime:
        startTime ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endtime: endTime || new Date().toISOString(),
      minmagnitude: minMagnitude,
    };

    return this.request(this.earthquakeURL, params);
  }

  async getEarthquakeHistory(latitude, longitude, radiusKm = 100) {
    const params = {
      format: 'geojson',
      latitude: latitude,
      longitude: longitude,
      maxradiuskm: radiusKm,
      starttime: '1900-01-01',
      endtime: new Date().toISOString(),
    };

    return this.request(this.earthquakeURL, params);
  }

  // Elevation Data Methods
  async getElevation(latitude, longitude) {
    const params = {
      x: longitude,
      y: latitude,
      units: 'Meters',
      output: 'json',
    };

    return this.request(this.elevationURL, params);
  }

  async getElevationProfile(points) {
    // Get elevation for multiple points
    const promises = points.map(point =>
      this.getElevation(point.latitude, point.longitude)
    );

    return Promise.all(promises);
  }

  // Water Data Methods
  async getWaterData(latitude, longitude, radiusKm = 10) {
    const params = {
      format: 'json',
      lat: latitude,
      lon: longitude,
      radius: radiusKm,
    };

    return this.request(this.waterURL, params);
  }

  // Tsunami risk assessment
  async assessTsunamiRisk(coastalPoint) {
    const elevation = await this.getElevation(
      coastalPoint.latitude,
      coastalPoint.longitude
    );
    const earthquakes = await this.getEarthquakeHistory(
      coastalPoint.latitude,
      coastalPoint.longitude,
      500
    );

    return {
      elevation: elevation,
      historicalQuakes: earthquakes.features.length,
      riskLevel: this.calculateTsunamiRisk(elevation.elevation || elevation, earthquakes),
    };
  }

  calculateTsunamiRisk(elevation, earthquakes) {
    // Simple risk calculation based on elevation and seismic history
    if (elevation < 10) {
      return 'High';
    }
    if (elevation < 50 && earthquakes.features.length > 5) {
      return 'Medium';
    }
    return 'Low';
  }
}

// Utility functions for API management
const APIUtils = {
  // Create API clients
  createNASAClient: apiKey => new NASAClient(apiKey),
  createUSGSClient: () => new USGSClient(),

  // Cache management
  cache: new Map(),

  async cachedRequest(key, requestFn, ttl = 300000) {
    // 5 minutes default
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    try {
      const data = await requestFn();
      this.cache.set(key, {
        data: data,
        timestamp: now,
      });
      return data;
    } catch (error) {
      if (cached) {
        return cached.data; // Return stale data if available
      }
      throw error;
    }
  },

  // Rate limiting
  rateLimit: (fn, delay = 1000) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall < delay) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      lastCall = now;
      return fn(...args);
    };
  },

  // Error handling wrapper
  withErrorHandling: async (fn, fallback = null) => {
    try {
      return await fn();
    } catch (error) {
      console.error('API Error:', error);
      if (fallback) {
        return fallback;
      }
      throw error;
    }
  },

  // Batch requests
  batchRequests: async (requests, concurrency = 5) => {
    const results = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map(fn => fn()));
      results.push(...batchResults);
    }

    return results;
  },
};

// Export the API utilities
window.NASAClient = NASAClient;
window.USGSClient = USGSClient;
window.APIUtils = APIUtils;

// NASA and USGS API Utilities loaded silently
