/**
 * Visualization Data Integration Service
 * Connects downloaded geographical and astronomical data with visualization components
 */

import dataCacheService from './dataCacheService';
import dataDownloadService from './dataDownloadService';

class VisualizationDataIntegration {
  constructor() {
    this.dataSubscribers = new Map();
    this.updateCallbacks = new Map();
    this.dataCache = new Map();
    this.refreshIntervals = new Map();
  }

  /**
   * Subscribe a visualization component to data updates
   * @param {string} componentId - Unique identifier for the component
   * @param {Array} dataTypes - Types of data the component needs
   * @param {Function} updateCallback - Function to call when data updates
   */
  subscribeToData(componentId, dataTypes, updateCallback) {
    this.dataSubscribers.set(componentId, dataTypes);
    this.updateCallbacks.set(componentId, updateCallback);

    // Immediately fetch initial data
    this.fetchDataForComponent(componentId);
  }

  /**
   * Unsubscribe a component from data updates
   * @param {string} componentId - Component identifier
   */
  unsubscribeFromData(componentId) {
    this.dataSubscribers.delete(componentId);
    this.updateCallbacks.delete(componentId);

    // Clear any refresh intervals
    if (this.refreshIntervals.has(componentId)) {
      clearInterval(this.refreshIntervals.get(componentId));
      this.refreshIntervals.delete(componentId);
    }
  }

  /**
   * Fetch data for a specific component
   * @param {string} componentId - Component identifier
   */
  async fetchDataForComponent(componentId) {
    const dataTypes = this.dataSubscribers.get(componentId);
    const updateCallback = this.updateCallbacks.get(componentId);

    if (!dataTypes || !updateCallback) {
      return;
    }

    try {
      const componentData = {};

      for (const dataType of dataTypes) {
        const data = await this.fetchDataByType(dataType);
        componentData[dataType] = data;
      }

      // Cache the data
      this.dataCache.set(componentId, componentData);

      // Notify the component
      updateCallback(componentData);
    } catch (error) {
      console.error(`Error fetching data for component ${componentId}:`, error);
    }
  }

  /**
   * Fetch data by type using the appropriate service method
   * @param {Object} dataType - Data type configuration
   */
  async fetchDataByType(dataType) {
    const { type, params = {} } = dataType;

    switch (type) {
      case 'elevation':
        return await dataDownloadService.downloadElevationData(
          params.bounds || { north: 45, south: 35, east: -110, west: -120 }
        );

      case 'neoData':
        return await dataDownloadService.downloadNEOData(
          params.startDate || new Date().toISOString().split('T')[0],
          params.endDate ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
        );

      case 'spaceWeather':
        return await dataDownloadService.downloadSpaceWeatherData(
          params.startDate ||
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          params.endDate || new Date().toISOString().split('T')[0]
        );

      case 'asteroidData':
        return await dataDownloadService.downloadAsteroidData(
          params.asteroidId
        );

      case 'epicImages':
        return await dataDownloadService.downloadEPICImages(
          params.date || new Date().toISOString().split('T')[0]
        );

      case 'marsWeather':
        return await dataDownloadService.downloadMarsWeather();

      case 'earthAssets':
        return await dataDownloadService.downloadEarthAssets(
          params.lat || 40.7128,
          params.lon || -74.006,
          params.date || new Date().toISOString().split('T')[0]
        );

      case 'exoplanetData':
        return await dataDownloadService.downloadExoplanetData(
          params.query || 'confirmed'
        );

      case 'terrainData':
        return await dataDownloadService.downloadTerrainData(
          params.bounds || { north: 45, south: 35, east: -110, west: -120 }
        );

      case 'waterSites':
        return await dataDownloadService.downloadWaterSites(
          params.bounds || { north: 45, south: 35, east: -110, west: -120 }
        );

      case 'landCover':
        return await dataDownloadService.downloadLandCoverData(
          params.bounds || { north: 45, south: 35, east: -110, west: -120 }
        );

      case 'geologicalData':
        return await dataDownloadService.downloadGeologicalData(
          params.bounds || { north: 45, south: 35, east: -110, west: -120 }
        );

      case 'soilData':
        return await dataDownloadService.downloadSoilData(
          params.bounds || { north: 45, south: 35, east: -110, west: -120 }
        );

      case 'topographicData':
        return await dataDownloadService.downloadTopographicData(
          params.bounds || { north: 45, south: 35, east: -110, west: -120 }
        );

      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }

  /**
   * Set up automatic data refresh for a component
   * @param {string} componentId - Component identifier
   * @param {number} intervalMs - Refresh interval in milliseconds
   */
  setupAutoRefresh(componentId, intervalMs = 300000) {
    // Default 5 minutes
    if (this.refreshIntervals.has(componentId)) {
      clearInterval(this.refreshIntervals.get(componentId));
    }

    const interval = setInterval(() => {
      this.fetchDataForComponent(componentId);
    }, intervalMs);

    this.refreshIntervals.set(componentId, interval);
  }

  /**
   * Get cached data for a component
   * @param {string} componentId - Component identifier
   */
  getCachedData(componentId) {
    return this.dataCache.get(componentId);
  }

  /**
   * Transform NEO data for orbital mechanics visualization
   * @param {Object} neoData - Raw NEO data
   */
  transformNEODataForOrbitalViz(neoData) {
    if (!neoData || !neoData.near_earth_objects) {
      return [];
    }

    const asteroids = [];

    Object.values(neoData.near_earth_objects)
      .flat()
      .forEach((neo, index) => {
        const orbitalData = neo.orbital_data;
        if (!orbitalData) {
          return;
        }

        asteroids.push({
          id: neo.id,
          name: neo.name,
          diameter:
            neo.estimated_diameter?.kilometers?.estimated_diameter_average || 1,
          orbitalElements: {
            semiMajorAxis:
              parseFloat(orbitalData.semi_major_axis) * 149597870.7, // Convert AU to km
            eccentricity: parseFloat(orbitalData.eccentricity),
            inclination: (parseFloat(orbitalData.inclination) * Math.PI) / 180, // Convert to radians
            argumentOfPeriapsis:
              (parseFloat(orbitalData.periapsis_argument) * Math.PI) / 180,
            longitudeOfAscendingNode:
              (parseFloat(orbitalData.ascending_node_longitude) * Math.PI) /
              180,
            meanAnomaly: (parseFloat(orbitalData.mean_anomaly) * Math.PI) / 180,
            period: parseFloat(orbitalData.orbital_period) * 24 * 3600, // Convert days to seconds
            perihelion:
              parseFloat(orbitalData.perihelion_distance) * 149597870.7,
            aphelion: parseFloat(orbitalData.aphelion_distance) * 149597870.7,
          },
          closeApproachData: neo.close_approach_data?.[0] || null,
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
        });
      });

    return asteroids;
  }

  /**
   * Transform elevation data for impact map visualization
   * @param {Object} elevationData - Raw elevation data
   * @param {Object} bounds - Geographic bounds
   */
  transformElevationDataForImpactMap(elevationData, bounds) {
    if (!elevationData || !elevationData.elevations) {
      return null;
    }

    return {
      type: 'elevation',
      bounds: bounds,
      data: elevationData.elevations,
      resolution: elevationData.resolution || 30, // meters per pixel
      noDataValue: elevationData.noDataValue || -9999,
      statistics: {
        min: Math.min(
          ...elevationData.elevations.filter(
            e => e !== elevationData.noDataValue
          )
        ),
        max: Math.max(
          ...elevationData.elevations.filter(
            e => e !== elevationData.noDataValue
          )
        ),
        mean:
          elevationData.elevations
            .filter(e => e !== elevationData.noDataValue)
            .reduce((sum, val) => sum + val, 0) /
          elevationData.elevations.filter(e => e !== elevationData.noDataValue)
            .length,
      },
    };
  }

  /**
   * Transform space weather data for visualization
   * @param {Object} spaceWeatherData - Raw space weather data
   */
  transformSpaceWeatherDataForViz(spaceWeatherData) {
    if (!spaceWeatherData) {
      return null;
    }

    const transformed = {
      solarFlares: [],
      coronalMassEjections: [],
      geomagneticStorms: [],
      solarEnergeticParticles: [],
    };

    // Transform solar flares
    if (spaceWeatherData.solarFlares) {
      transformed.solarFlares = spaceWeatherData.solarFlares.map(flare => ({
        id: flare.flrID,
        beginTime: new Date(flare.beginTime),
        peakTime: new Date(flare.peakTime),
        endTime: new Date(flare.endTime),
        classType: flare.classType,
        sourceLocation: flare.sourceLocation,
        activeRegionNum: flare.activeRegionNum,
        intensity: this.getFlareIntensity(flare.classType),
      }));
    }

    // Transform CMEs
    if (spaceWeatherData.coronalMassEjections) {
      transformed.coronalMassEjections =
        spaceWeatherData.coronalMassEjections.map(cme => ({
          id: cme.activityID,
          startTime: new Date(cme.startTime),
          sourceLocation: cme.sourceLocation,
          note: cme.note,
          speed: cme.speed,
          type: cme.type,
          isMostAccurate: cme.isMostAccurate,
        }));
    }

    return transformed;
  }

  /**
   * Get flare intensity based on class type
   * @param {string} classType - Solar flare class (A, B, C, M, X)
   */
  getFlareIntensity(classType) {
    if (!classType) {
      return 1;
    }

    const baseClass = classType.charAt(0).toUpperCase();
    const magnitude = parseFloat(classType.substring(1)) || 1;

    const classMultipliers = { A: 1, B: 10, C: 100, M: 1000, X: 10000 };
    return (classMultipliers[baseClass] || 1) * magnitude;
  }

  /**
   * Create data layers for OpenLayers map
   * @param {Object} data - Transformed data
   * @param {string} layerType - Type of layer to create
   */
  createMapLayer(data, layerType) {
    // This method would create OpenLayers layers based on the data
    // Implementation depends on the specific visualization requirements
    return null; // Placeholder
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return dataCacheService.getStats();
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.dataCache.clear();
    return dataCacheService.clearCache();
  }

  /**
   * Preload common data for better performance
   */
  async preloadCommonData() {
    try {
      // Preload NEO data for the next week
      await dataDownloadService.preloadData();

      // Preload elevation data for common impact zones
      const commonZones = [
        { north: 45, south: 35, east: -110, west: -120 }, // Western US
        { north: 55, south: 45, east: 10, west: -5 }, // Western Europe
        { north: 40, south: 30, east: 140, west: 130 }, // Japan
      ];

      for (const zone of commonZones) {
        await dataDownloadService.downloadElevationData(zone);
      }

      console.log('Common data preloaded successfully');
    } catch (error) {
      console.error('Error preloading common data:', error);
    }
  }
}

// Create and export singleton instance
const visualizationDataIntegration = new VisualizationDataIntegration();
export default visualizationDataIntegration;
