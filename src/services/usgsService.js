import axios from 'axios';

class USGSService {
  constructor() {
    this.apiKey = process.env.REACT_APP_USGS_API_KEY || 'anonymous';
    this.earthquakeAPI =
      window.MeteorMadnessConfig?.USGS?.EARTHQUAKE_API ||
      'https://earthquake.usgs.gov/fdsnws/event/1/query';
    this.elevationAPI =
      window.MeteorMadnessConfig?.USGS?.ELEVATION_API ||
      'https://nationalmap.gov/epqs/pqs.php';
    this.waterAPI =
      window.MeteorMadnessConfig?.USGS?.WATER_API ||
      'https://waterservices.usgs.gov/nwis';

    // Axios instance with default config
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('USGS API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Earthquake Data Methods
  async getEarthquakes(startTime, endTime, minMagnitude = 2.5, limit = 100) {
    try {
      const response = await this.client.get(this.earthquakeAPI, {
        params: {
          format: 'geojson',
          starttime: startTime,
          endtime: endTime,
          minmagnitude: minMagnitude,
          limit: limit,
          orderby: 'time',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Earthquake Data');
    }
  }

  async getRecentEarthquakes(days = 30, minMagnitude = 4.0) {
    const endTime = new Date().toISOString();
    const startTime = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    return this.getEarthquakes(startTime, endTime, minMagnitude);
  }

  async getSignificantEarthquakes() {
    return this.getEarthquakes(
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString(),
      6.0,
      50
    );
  }

  // Elevation Data Methods
  async getElevation(lat, lon, units = 'METERS') {
    try {
      const response = await this.client.get(this.elevationAPI, {
        params: {
          x: lon,
          y: lat,
          units: units,
          output: 'json',
        },
      });

      if (
        response.data.USGS_Elevation_Point_Query_Service &&
        response.data.USGS_Elevation_Point_Query_Service.Elevation_Query
      ) {
        return response.data.USGS_Elevation_Point_Query_Service.Elevation_Query;
      }

      throw new Error('Invalid elevation data format');
    } catch (error) {
      throw this.handleError(error, 'Elevation Data');
    }
  }

  async getElevationProfile(points, units = 'METERS') {
    try {
      const elevations = await Promise.all(
        points.map(async point => {
          const elevation = await this.getElevation(
            point.lat,
            point.lon,
            units
          );
          return {
            ...point,
            elevation: elevation.Elevation,
            units: elevation.Units,
          };
        })
      );

      return elevations;
    } catch (error) {
      throw this.handleError(error, 'Elevation Profile');
    }
  }

  // Water Data Methods
  async getWaterData(siteNumbers, parameterCd = '00060') {
    try {
      const response = await this.client.get(this.waterAPI, {
        params: {
          format: 'json',
          sites: siteNumbers.join(','),
          parameterCd: parameterCd,
          siteStatus: 'all',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Water Data');
    }
  }

  // Geological and Terrain Data
  async getGeologicalData(lat, lon, radiusKm = 50) {
    try {
      // Get earthquakes in area
      const earthquakes = await this.getEarthquakes(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        1.0,
        100
      );

      // Get elevation data
      const elevation = await this.getElevation(lat, lon);

      // Filter earthquakes within radius
      const nearbyQuakes = earthquakes.features.filter(feature => {
        const quakeLat = feature.geometry.coordinates[1];
        const quakeLon = feature.geometry.coordinates[0];
        return this.calculateDistance(lat, lon, quakeLat, quakeLon) <= radiusKm;
      });

      return {
        elevation: elevation,
        earthquakes: {
          total: earthquakes.features.length,
          nearby: nearbyQuakes.length,
          features: nearbyQuakes.slice(0, 10),
        },
        coordinates: { lat, lon },
      };
    } catch (error) {
      throw this.handleError(error, 'Geological Data');
    }
  }

  // Utility Methods
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  handleError(error, context) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      `Failed to fetch ${context} data`;

    console.error(`USGS Service Error (${context}):`, errorMessage);

    return new Error(errorMessage);
  }

  // API Status Check
  async checkAPIStatus() {
    try {
      const response = await this.client.get(this.earthquakeAPI, {
        params: {
          format: 'geojson',
          starttime: '2024-01-01',
          endtime: '2024-01-02',
          minmagnitude: 2.5,
          limit: 1,
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Additional methods for data download service
  async getTerrainData(region) {
    try {
      const { bounds, center } = region;

      // Get elevation data for terrain analysis
      const elevationData = await this.getElevation(center.lat, center.lon);

      // Get geological data (simplified for now)
      const geologicalData = {
        rockType: 'sedimentary', // This would come from USGS geological surveys
        soilType: 'clay-loam', // This would come from USGS soil surveys
        waterTable: 'moderate', // This would come from USGS water data
        slope: this.calculateSlope(bounds),
        aspect: this.calculateAspect(bounds),
      };

      return {
        elevation: elevationData,
        geological: geologicalData,
        region: region,
        source: 'USGS',
      };
    } catch (error) {
      throw this.handleError(error, 'Terrain Data');
    }
  }

  async getHydrologyData(region) {
    try {
      const { bounds } = region;

      // Get water sites in the region
      const waterSites = await this.getWaterSitesInRegion(bounds);

      // Get stream flow data for the sites
      const streamFlowData = [];
      for (const site of waterSites.slice(0, 10)) {
        // Limit to 10 sites
        try {
          const flowData = await this.getWaterData([site.siteNumber]);
          streamFlowData.push({
            site: site,
            data: flowData,
          });
        } catch (error) {
          console.warn(`Failed to get flow data for site ${site.siteNumber}`);
        }
      }

      return {
        waterSites,
        streamFlow: streamFlowData,
        region: region,
        source: 'USGS',
      };
    } catch (error) {
      throw this.handleError(error, 'Hydrology Data');
    }
  }

  async getWaterSitesInRegion(bounds) {
    try {
      const response = await this.client.get(
        'https://waterservices.usgs.gov/nwis/site/',
        {
          params: {
            format: 'json',
            bBox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
            siteType: 'ST', // Stream sites
            hasDataTypeCd: 'dv', // Daily values
            siteStatus: 'active',
          },
        }
      );

      return response.data.value?.timeSeries || [];
    } catch (error) {
      throw this.handleError(error, 'Water Sites');
    }
  }

  async getLandCoverData(region) {
    try {
      // This would integrate with USGS Land Cover data
      // For now, we'll return a placeholder structure
      return {
        landCoverTypes: [
          { type: 'forest', percentage: 35 },
          { type: 'agriculture', percentage: 25 },
          { type: 'urban', percentage: 20 },
          { type: 'water', percentage: 10 },
          { type: 'grassland', percentage: 10 },
        ],
        resolution: '30m',
        year: 2021,
        region: region,
        source: 'USGS NLCD',
      };
    } catch (error) {
      throw this.handleError(error, 'Land Cover Data');
    }
  }

  async getGeologicalData(region) {
    try {
      // This would integrate with USGS geological surveys
      // For now, we'll return a placeholder structure
      return {
        rockFormations: [
          { type: 'sedimentary', age: 'Cenozoic', percentage: 60 },
          { type: 'igneous', age: 'Mesozoic', percentage: 25 },
          { type: 'metamorphic', age: 'Paleozoic', percentage: 15 },
        ],
        faultLines: [],
        mineralDeposits: [],
        region: region,
        source: 'USGS Geological Survey',
      };
    } catch (error) {
      throw this.handleError(error, 'Geological Data');
    }
  }

  async getSoilData(region) {
    try {
      // This would integrate with USGS/NRCS soil data
      // For now, we'll return a placeholder structure
      return {
        soilTypes: [
          { type: 'clay', percentage: 40, drainageClass: 'poor' },
          { type: 'loam', percentage: 35, drainageClass: 'moderate' },
          { type: 'sand', percentage: 25, drainageClass: 'good' },
        ],
        pH: 6.5,
        organicMatter: 3.2,
        region: region,
        source: 'USGS/NRCS Soil Survey',
      };
    } catch (error) {
      throw this.handleError(error, 'Soil Data');
    }
  }

  async getTopographicData(region) {
    try {
      const { bounds, center } = region;

      // Get elevation data for multiple points
      const elevationGrid = await this.getElevationGrid(bounds, 10); // 10x10 grid

      // Calculate topographic metrics
      const metrics = this.calculateTopographicMetrics(elevationGrid);

      return {
        elevationGrid,
        metrics,
        region: region,
        source: 'USGS DEM',
      };
    } catch (error) {
      throw this.handleError(error, 'Topographic Data');
    }
  }

  async getElevationGrid(bounds, gridSize) {
    const { north, south, east, west } = bounds;
    const latStep = (north - south) / gridSize;
    const lonStep = (east - west) / gridSize;

    const grid = [];

    for (let i = 0; i <= gridSize; i++) {
      const row = [];
      for (let j = 0; j <= gridSize; j++) {
        const lat = south + i * latStep;
        const lon = west + j * lonStep;

        try {
          const elevation = await this.getElevation(lat, lon);
          row.push({
            lat,
            lon,
            elevation: elevation.elevation || 0,
          });
        } catch (error) {
          row.push({
            lat,
            lon,
            elevation: 0,
          });
        }
      }
      grid.push(row);
    }

    return grid;
  }

  // Utility methods for terrain analysis
  calculateSlope(bounds) {
    // Simplified slope calculation
    // In a real implementation, this would use DEM data
    return Math.random() * 30; // 0-30 degrees
  }

  calculateAspect(bounds) {
    // Simplified aspect calculation
    // In a real implementation, this would use DEM data
    const aspects = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return aspects[Math.floor(Math.random() * aspects.length)];
  }

  calculateTopographicMetrics(elevationGrid) {
    const elevations = elevationGrid.flat().map(point => point.elevation);

    return {
      minElevation: Math.min(...elevations),
      maxElevation: Math.max(...elevations),
      meanElevation: elevations.reduce((a, b) => a + b, 0) / elevations.length,
      relief: Math.max(...elevations) - Math.min(...elevations),
      roughness: this.calculateRoughness(elevations),
    };
  }

  calculateRoughness(elevations) {
    // Simplified roughness calculation
    let totalVariation = 0;
    for (let i = 1; i < elevations.length; i++) {
      totalVariation += Math.abs(elevations[i] - elevations[i - 1]);
    }
    return totalVariation / elevations.length;
  }
}

// Create singleton instance
export const usgsService = new USGSService();
export default usgsService;
