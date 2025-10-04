/**
 * Comprehensive Data Download Service
 * Integrates with NASA and USGS APIs to download geographical and astronomical data
 * for enhanced visualization and modeling capabilities
 */

import { dataCacheService } from './dataCacheService.js';
import { nasaService } from './nasaService.js';
import { usgsService } from './usgsService.js';

class DataDownloadService {
  constructor() {
    this.downloadQueue = [];
    this.activeDownloads = new Map();
    this.downloadHistory = [];
    this.cache = new Map();
    this.maxConcurrentDownloads = 5;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    // Data categories
    this.dataCategories = {
      GEOGRAPHICAL: 'geographical',
      ASTRONOMICAL: 'astronomical',
      METEOROLOGICAL: 'meteorological',
      SEISMIC: 'seismic',
      SATELLITE: 'satellite',
    };

    // Initialize event listeners
    this.eventListeners = new Map();
  }

  /**
   * Download geographical data for a specific region
   * @param {Object} region - Region definition with bounds
   * @param {Array} dataTypes - Types of geographical data to download
   * @returns {Promise<Object>} Downloaded geographical data
   */
  async downloadGeographicalData(
    region,
    dataTypes = ['elevation', 'terrain', 'satellite']
  ) {
    const downloadId = this.generateDownloadId('geo', region);

    try {
      this.emit('downloadStarted', {
        id: downloadId,
        type: 'geographical',
        region,
      });

      const results = {};

      // Download elevation data
      if (dataTypes.includes('elevation')) {
        results.elevation = await this.downloadElevationData(region);
      }

      // Download terrain data
      if (dataTypes.includes('terrain')) {
        results.terrain = await this.downloadTerrainData(region);
      }

      // Download satellite imagery
      if (dataTypes.includes('satellite')) {
        results.satellite = await this.downloadSatelliteImagery(region);
      }

      // Download weather patterns
      if (dataTypes.includes('weather')) {
        results.weather = await this.downloadWeatherPatterns(region);
      }

      // Download seismic data
      if (dataTypes.includes('seismic')) {
        results.seismic = await this.downloadSeismicData(region);
      }

      // Cache the results
      this.cacheData(downloadId, results);

      this.emit('downloadCompleted', { id: downloadId, data: results });
      return results;
    } catch (error) {
      this.emit('downloadError', { id: downloadId, error: error.message });
      throw error;
    }
  }

  /**
   * Download astronomical data for impact modeling
   * @param {Object} parameters - Astronomical data parameters
   * @returns {Promise<Object>} Downloaded astronomical data
   */
  async downloadAstronomicalData(parameters = {}) {
    const downloadId = this.generateDownloadId('astro', parameters);

    try {
      this.emit('downloadStarted', {
        id: downloadId,
        type: 'astronomical',
        parameters,
      });

      const results = {};

      // Download NEO data
      results.neoData = await this.downloadNEOData(parameters);

      // Download planetary positions
      results.planetaryPositions =
        await this.downloadPlanetaryPositions(parameters);

      // Download space weather data
      results.spaceWeather = await this.downloadSpaceWeatherData(parameters);

      // Download solar activity data
      results.solarActivity = await this.downloadSolarActivityData(parameters);

      // Download asteroid and comet data
      results.asteroidData = await this.downloadAsteroidData(parameters);

      // Cache the results
      this.cacheData(downloadId, results);

      this.emit('downloadCompleted', { id: downloadId, data: results });
      return results;
    } catch (error) {
      this.emit('downloadError', { id: downloadId, error: error.message });
      throw error;
    }
  }

  /**
   * Download elevation data using USGS APIs
   */
  async downloadElevationData(region) {
    try {
      const { north, south, east, west } = region.bounds;

      // Check cache first
      const cacheKey = `${north}_${south}_${east}_${west}`;
      const cachedData = await dataCacheService.get('usgs-elevation', cacheKey);

      if (cachedData) {
        this.emit('downloadCompleted', {
          type: 'elevation',
          data: cachedData,
          region,
          fromCache: true,
        });
        return cachedData;
      }

      // Create a grid of points for elevation sampling
      const gridSize = 50; // 50x50 grid
      const latStep = (north - south) / gridSize;
      const lonStep = (east - west) / gridSize;

      const elevationPoints = [];

      for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
          const lat = south + i * latStep;
          const lon = west + j * lonStep;

          try {
            const elevation = await usgsService.getElevation(lat, lon);
            elevationPoints.push({
              lat,
              lon,
              elevation: elevation.elevation || 0,
              units: elevation.units || 'meters',
            });
          } catch (error) {
            // Continue with other points if one fails
            console.warn(
              `Failed to get elevation for ${lat}, ${lon}:`,
              error.message
            );
          }
        }
      }

      const result = {
        type: 'elevation',
        region,
        points: elevationPoints,
        gridSize,
        downloadedAt: new Date().toISOString(),
      };

      // Cache the data
      await dataCacheService.set('usgs-elevation', cacheKey, result);

      return result;
    } catch (error) {
      throw new Error(`Failed to download elevation data: ${error.message}`);
    }
  }

  /**
   * Download terrain data and topographical information
   */
  async downloadTerrainData(region) {
    try {
      // Get terrain characteristics using USGS data
      const terrainData = await usgsService.getTerrainData(region);

      return {
        type: 'terrain',
        region,
        characteristics: terrainData,
        downloadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to download terrain data: ${error.message}`);
    }
  }

  /**
   * Download satellite imagery for the region
   */
  async downloadSatelliteImagery(region) {
    try {
      const { center } = region;

      // Download Earth imagery from NASA
      const earthImagery = await nasaService.getEarthImagery(
        center.lat,
        center.lon,
        { dim: 0.5, date: new Date().toISOString().split('T')[0] }
      );

      return {
        type: 'satellite',
        region,
        imagery: earthImagery,
        downloadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to download satellite imagery: ${error.message}`);
    }
  }

  /**
   * Download weather patterns for the region
   */
  async downloadWeatherPatterns(region) {
    try {
      // This would integrate with weather APIs
      // For now, we'll create a placeholder structure
      return {
        type: 'weather',
        region,
        patterns: {
          temperature: await this.getTemperatureData(region),
          precipitation: await this.getPrecipitationData(region),
          windPatterns: await this.getWindPatterns(region),
          atmosphericPressure: await this.getAtmosphericPressure(region),
        },
        downloadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to download weather patterns: ${error.message}`);
    }
  }

  /**
   * Download seismic data for the region
   */
  async downloadSeismicData(region) {
    try {
      const { bounds } = region;
      const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endTime = new Date();

      const earthquakeData = await usgsService.getEarthquakes({
        starttime: startTime.toISOString().split('T')[0],
        endtime: endTime.toISOString().split('T')[0],
        minlatitude: bounds.south,
        maxlatitude: bounds.north,
        minlongitude: bounds.west,
        maxlongitude: bounds.east,
        minmagnitude: 2.0,
      });

      return {
        type: 'seismic',
        region,
        earthquakes: earthquakeData,
        timeRange: { start: startTime, end: endTime },
        downloadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to download seismic data: ${error.message}`);
    }
  }

  /**
   * Download Near Earth Object (NEO) data
   */
  async downloadNEOData(parameters) {
    try {
      const startDate =
        parameters.startDate || new Date().toISOString().split('T')[0];
      const endDate =
        parameters.endDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

      this.emit('downloadStarted', {
        type: 'neo',
        startDate,
        endDate,
      });

      // Check cache first
      const cacheKey = `${startDate}_${endDate}`;
      const cachedData = await dataCacheService.get('nasa-neo', cacheKey);

      if (cachedData) {
        this.emit('downloadCompleted', {
          type: 'neo',
          data: cachedData,
          startDate,
          endDate,
          fromCache: true,
        });
        return cachedData;
      }

      const neoFeed = await nasaService.getNEOFeed(startDate, endDate);
      const neoLookup = await nasaService.getNEOLookup();

      const result = {
        type: 'neo',
        feed: neoFeed,
        lookup: neoLookup,
        timeRange: { start: startDate, end: endDate },
        downloadedAt: new Date().toISOString(),
      };

      // Cache the data
      await dataCacheService.set('nasa-neo', cacheKey, result);

      this.emit('downloadCompleted', {
        type: 'neo',
        data: result,
        startDate,
        endDate,
        fromCache: false,
      });

      return result;
    } catch (error) {
      this.emit('downloadError', {
        type: 'neo',
        error: error.message,
        startDate: parameters.startDate,
        endDate: parameters.endDate,
      });
      throw new Error(`Failed to download NEO data: ${error.message}`);
    }
  }

  /**
   * Download planetary positions and orbital data
   */
  async downloadPlanetaryPositions(parameters) {
    try {
      // This would integrate with JPL Horizons API
      const planetaryData = await nasaService.getPlanetaryData();

      return {
        type: 'planetary',
        positions: planetaryData,
        epoch: parameters.epoch || new Date().toISOString(),
        downloadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to download planetary positions: ${error.message}`
      );
    }
  }

  /**
   * Download space weather data
   */
  async downloadSpaceWeatherData(parameters = {}) {
    try {
      const startDate =
        parameters.startDate ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
      const endDate =
        parameters.endDate || new Date().toISOString().split('T')[0];

      this.emit('downloadStarted', {
        type: 'space-weather',
        startDate,
        endDate,
      });

      // Check cache first
      const cacheKey = `${startDate}_${endDate}`;
      const cachedData = await dataCacheService.get(
        'nasa-space-weather',
        cacheKey
      );

      if (cachedData) {
        this.emit('downloadCompleted', {
          type: 'space-weather',
          data: cachedData,
          startDate,
          endDate,
          fromCache: true,
        });
        return cachedData;
      }

      const spaceWeatherData = await nasaService.getSpaceWeatherData(
        startDate,
        endDate
      );

      const result = {
        type: 'space-weather',
        data: spaceWeatherData,
        startDate,
        endDate,
        timestamp: new Date(),
      };

      // Cache the data
      await dataCacheService.set('nasa-space-weather', cacheKey, result);

      this.emit('downloadCompleted', {
        type: 'space-weather',
        data: result,
        startDate,
        endDate,
        fromCache: false,
      });

      return result;
    } catch (error) {
      this.emit('downloadError', {
        type: 'space-weather',
        error: error.message,
        startDate: parameters.startDate,
        endDate: parameters.endDate,
      });
      throw new Error(
        `Failed to download space weather data: ${error.message}`
      );
    }
  }

  /**
   * Download solar activity data
   */
  async downloadSolarActivityData(parameters) {
    try {
      const solarFlares = await nasaService.getSolarFlares();
      const coronalMassEjections = await nasaService.getCoronalMassEjections();

      return {
        type: 'solarActivity',
        solarFlares,
        coronalMassEjections,
        downloadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to download solar activity data: ${error.message}`
      );
    }
  }

  /**
   * Download asteroid and comet data
   */
  async downloadAsteroidData(parameters) {
    try {
      const asteroids = await nasaService.getAsteroidData();

      return {
        type: 'asteroids',
        data: asteroids,
        downloadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to download asteroid data: ${error.message}`);
    }
  }

  /**
   * Weather data helper methods
   */
  async getTemperatureData(region) {
    // Placeholder for temperature data integration
    return { source: 'weather_api', data: [] };
  }

  async getPrecipitationData(region) {
    // Placeholder for precipitation data integration
    return { source: 'weather_api', data: [] };
  }

  async getWindPatterns(region) {
    // Placeholder for wind pattern data integration
    return { source: 'weather_api', data: [] };
  }

  async getAtmosphericPressure(region) {
    // Placeholder for atmospheric pressure data integration
    return { source: 'weather_api', data: [] };
  }

  /**
   * Utility methods
   */
  generateDownloadId(type, parameters) {
    const timestamp = Date.now();
    const hash = this.hashParameters(parameters);
    return `${type}_${hash}_${timestamp}`;
  }

  hashParameters(parameters) {
    return btoa(JSON.stringify(parameters))
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 8);
  }

  cacheData(id, data) {
    this.cache.set(id, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.cacheExpiry,
    });
  }

  getCachedData(id) {
    const cached = this.cache.get(id);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(id);
    return null;
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Download management
   */
  getDownloadHistory() {
    return this.downloadHistory;
  }

  getActiveDownloads() {
    return Array.from(this.activeDownloads.values());
  }

  cancelDownload(downloadId) {
    if (this.activeDownloads.has(downloadId)) {
      this.activeDownloads.delete(downloadId);
      this.emit('downloadCancelled', { id: downloadId });
      return true;
    }
    return false;
  }

  clearCache() {
    this.cache.clear();
    this.emit('cacheCleared');
  }

  /**
   * Get download statistics
   */
  getDownloadStats() {
    const downloads = this.downloadHistory;
    const totalSize = downloads.reduce(
      (sum, download) => sum + (download.size || 0),
      0
    );

    return {
      totalDownloads: downloads.length,
      totalSize: this.formatSize(totalSize),
      byType: this.getDownloadsByType(downloads),
      recentDownloads: downloads
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10),
      cache: dataCacheService.getStats(),
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return dataCacheService.getStats();
  }

  /**
   * Clear cache by category
   */
  async clearCacheByCategory(category = null) {
    if (category) {
      await dataCacheService.clearCategory(category);
      this.emit('cacheCleared', { category });
    } else {
      await dataCacheService.clearAll();
      this.emit('cacheCleared', { category: 'all' });
    }
  }

  /**
   * Configure cache settings
   */
  configureCaching(options = {}) {
    dataCacheService.configure(options);
    this.emit('cacheConfigured', options);
  }

  /**
   * Preload commonly used data
   */
  async preloadData() {
    try {
      this.emit('preloadStarted');

      // Preload current NEO data
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      await this.downloadNEOData({ startDate: today, endDate: nextWeek });

      // Preload current space weather
      await this.downloadSpaceWeatherData();

      this.emit('preloadCompleted');
    } catch (error) {
      this.emit('preloadError', { error: error.message });
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Group downloads by type
   */
  getDownloadsByType(downloads) {
    return downloads.reduce((acc, download) => {
      const type = download.type || 'unknown';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});
  }

  /**
   * Batch download operations
   */
  async batchDownload(requests) {
    const results = [];

    for (const request of requests) {
      try {
        let result;

        if (request.type === 'geographical') {
          result = await this.downloadGeographicalData(
            request.region,
            request.dataTypes
          );
        } else if (request.type === 'astronomical') {
          result = await this.downloadAstronomicalData(request.parameters);
        }

        results.push({ success: true, data: result, request });
      } catch (error) {
        results.push({ success: false, error: error.message, request });
      }
    }

    return results;
  }
}

// Create singleton instance
export const dataDownloadService = new DataDownloadService();
export default dataDownloadService;
