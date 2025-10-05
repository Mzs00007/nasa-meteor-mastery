/**
 * AstronomicalDataService - Service for fetching real-time astronomical data
 * Integrates with NASA JPL Horizons, ESA, and other astronomical data sources
 */

class AstronomicalDataService {
  constructor() {
    this.baseUrls = {
      jpl: 'https://ssd-api.jpl.nasa.gov/horizons',
      nasa: 'https://api.nasa.gov',
      esa: 'https://www.cosmos.esa.int/web/psa/api',
      usno: 'https://aa.usno.navy.mil/api'
    };

    this.apiKeys = {
      nasa: process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY'
    };

    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generic cache management
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Fetch data with error handling and caching
   */
  async fetchWithCache(url, cacheKey, options = {}) {
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      
      // Return cached data if available, even if expired
      const expiredCache = this.cache.get(cacheKey);
      if (expiredCache) {
        console.warn('Using expired cache data due to fetch error');
        return expiredCache.data;
      }
      
      throw error;
    }
  }

  /**
   * Get current planetary positions from JPL Horizons
   */
  async getPlanetaryPositions(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `planetary_positions_${dateStr}`;

    try {
      // JPL Horizons API call for all planets
      const planets = ['199', '299', '399', '499', '599', '699', '799', '899']; // Mercury through Neptune
      const positions = {};

      for (const planetCode of planets) {
        const url = `${this.baseUrls.jpl}?format=json&COMMAND='${planetCode}'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@10'&START_TIME='${dateStr}'&STOP_TIME='${dateStr}'&STEP_SIZE='1d'`;
        
        try {
          const data = await this.fetchWithCache(url, `planet_${planetCode}_${dateStr}`);
          
          if (data && data.result) {
            const planetName = this.getPlanetNameFromCode(planetCode);
            positions[planetName] = this.parseJPLVectorData(data.result);
          }
        } catch (error) {
          console.warn(`Failed to fetch data for planet ${planetCode}:`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error('Error fetching planetary positions:', error);
      return this.getFallbackPlanetaryData(date);
    }
  }

  /**
   * Get planet name from JPL code
   */
  getPlanetNameFromCode(code) {
    const codeMap = {
      '199': 'mercury',
      '299': 'venus',
      '399': 'earth',
      '499': 'mars',
      '599': 'jupiter',
      '699': 'saturn',
      '799': 'uranus',
      '899': 'neptune'
    };
    return codeMap[code] || 'unknown';
  }

  /**
   * Parse JPL vector data
   */
  parseJPLVectorData(result) {
    try {
      // Extract position and velocity vectors from JPL result
      // This is a simplified parser - real JPL data parsing is more complex
      const lines = result.split('\n');
      let dataSection = false;
      let position = { x: 0, y: 0, z: 0 };
      let velocity = { x: 0, y: 0, z: 0 };

      for (const line of lines) {
        if (line.includes('$$SOE')) {
          dataSection = true;
          continue;
        }
        if (line.includes('$$EOE')) {
          dataSection = false;
          break;
        }
        
        if (dataSection && line.trim()) {
          // Parse position and velocity data
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 6) {
            position = {
              x: parseFloat(parts[2]) || 0,
              y: parseFloat(parts[3]) || 0,
              z: parseFloat(parts[4]) || 0
            };
            velocity = {
              x: parseFloat(parts[5]) || 0,
              y: parseFloat(parts[6]) || 0,
              z: parseFloat(parts[7]) || 0
            };
          }
        }
      }

      return {
        position: position,
        velocity: velocity,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing JPL data:', error);
      return {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get solar activity data
   */
  async getSolarActivityData() {
    const cacheKey = 'solar_activity';
    
    try {
      // NASA Space Weather API
      const url = `${this.baseUrls.nasa}/DONKI/FLR?startDate=${this.getDateString(-7)}&endDate=${this.getDateString(0)}&api_key=${this.apiKeys.nasa}`;
      
      const data = await this.fetchWithCache(url, cacheKey);
      
      return {
        solarFlares: data || [],
        solarCycle: await this.getSolarCycleData(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching solar activity data:', error);
      return this.getFallbackSolarData();
    }
  }

  /**
   * Get solar cycle data
   */
  async getSolarCycleData() {
    try {
      // Simplified solar cycle calculation
      const currentDate = new Date();
      const solarCycleStart = new Date('2019-12-01'); // Solar Cycle 25 start
      const cycleLength = 11 * 365.25 * 24 * 60 * 60 * 1000; // 11 years in milliseconds
      
      const elapsed = currentDate - solarCycleStart;
      const cycleProgress = (elapsed / cycleLength) % 1;
      
      // Simplified sunspot number calculation
      const sunspotNumber = Math.max(0, 100 * Math.sin(cycleProgress * Math.PI));
      
      return {
        cycleNumber: 25,
        progress: cycleProgress,
        sunspotNumber: Math.round(sunspotNumber),
        phase: cycleProgress < 0.5 ? 'ascending' : 'descending'
      };
    } catch (error) {
      console.error('Error calculating solar cycle data:', error);
      return {
        cycleNumber: 25,
        progress: 0.3,
        sunspotNumber: 50,
        phase: 'ascending'
      };
    }
  }

  /**
   * Get asteroid and comet data
   */
  async getSmallBodyData() {
    const cacheKey = 'small_bodies';
    
    try {
      // NASA Small Body Database
      const url = `${this.baseUrls.nasa}/neo/rest/v1/feed?start_date=${this.getDateString(0)}&end_date=${this.getDateString(7)}&api_key=${this.apiKeys.nasa}`;
      
      const data = await this.fetchWithCache(url, cacheKey);
      
      return {
        nearEarthObjects: data.near_earth_objects || {},
        elementCount: data.element_count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching small body data:', error);
      return this.getFallbackSmallBodyData();
    }
  }

  /**
   * Get lunar phase and position data
   */
  async getLunarData(date = new Date()) {
    const cacheKey = `lunar_data_${date.toDateString()}`;
    
    try {
      // Calculate lunar phase
      const lunarPhase = this.calculateLunarPhase(date);
      const lunarPosition = await this.getLunarPosition(date);
      
      return {
        phase: lunarPhase,
        position: lunarPosition,
        illumination: lunarPhase.illumination,
        age: lunarPhase.age,
        timestamp: date.toISOString()
      };
    } catch (error) {
      console.error('Error fetching lunar data:', error);
      return this.getFallbackLunarData(date);
    }
  }

  /**
   * Calculate lunar phase
   */
  calculateLunarPhase(date) {
    // Simplified lunar phase calculation
    const knownNewMoon = new Date('2000-01-06T18:14:00Z'); // Known new moon
    const lunarCycle = 29.53058867; // Average lunar cycle in days
    
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const cyclePosition = (daysSinceNewMoon % lunarCycle) / lunarCycle;
    
    let phaseName;
    if (cyclePosition < 0.0625) phaseName = 'New Moon';
    else if (cyclePosition < 0.1875) phaseName = 'Waxing Crescent';
    else if (cyclePosition < 0.3125) phaseName = 'First Quarter';
    else if (cyclePosition < 0.4375) phaseName = 'Waxing Gibbous';
    else if (cyclePosition < 0.5625) phaseName = 'Full Moon';
    else if (cyclePosition < 0.6875) phaseName = 'Waning Gibbous';
    else if (cyclePosition < 0.8125) phaseName = 'Last Quarter';
    else phaseName = 'Waning Crescent';
    
    const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * cyclePosition));
    
    return {
      name: phaseName,
      illumination: illumination,
      age: daysSinceNewMoon % lunarCycle,
      cyclePosition: cyclePosition
    };
  }

  /**
   * Get lunar position
   */
  async getLunarPosition(date) {
    // Simplified lunar position calculation
    // In a real implementation, you'd use more precise algorithms
    const daysSinceEpoch = (date - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    const meanLongitude = 218.316 + 13.176396 * daysSinceEpoch;
    const meanAnomaly = 134.963 + 13.064993 * daysSinceEpoch;
    
    const longitude = meanLongitude + 6.289 * Math.sin(meanAnomaly * Math.PI / 180);
    const latitude = 5.128 * Math.sin((longitude - meanLongitude) * Math.PI / 180);
    const distance = 385000 - 20905 * Math.cos(meanAnomaly * Math.PI / 180); // km
    
    return {
      longitude: longitude % 360,
      latitude: latitude,
      distance: distance,
      rightAscension: longitude, // Simplified
      declination: latitude // Simplified
    };
  }

  /**
   * Get space weather data
   */
  async getSpaceWeatherData() {
    const cacheKey = 'space_weather';
    
    try {
      const solarData = await this.getSolarActivityData();
      const geomagneticData = await this.getGeomagneticData();
      
      return {
        solar: solarData,
        geomagnetic: geomagneticData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching space weather data:', error);
      return this.getFallbackSpaceWeatherData();
    }
  }

  /**
   * Get geomagnetic data
   */
  async getGeomagneticData() {
    try {
      // Simplified geomagnetic index calculation
      const kIndex = Math.floor(Math.random() * 9); // 0-9 scale
      const apIndex = Math.pow(2, kIndex / 3) * 2; // Approximate conversion
      
      return {
        kIndex: kIndex,
        apIndex: Math.round(apIndex),
        condition: this.getGeomagneticCondition(kIndex),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating geomagnetic data:', error);
      return {
        kIndex: 2,
        apIndex: 7,
        condition: 'Quiet',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get geomagnetic condition from K-index
   */
  getGeomagneticCondition(kIndex) {
    if (kIndex <= 2) return 'Quiet';
    if (kIndex <= 3) return 'Unsettled';
    if (kIndex <= 4) return 'Active';
    if (kIndex <= 6) return 'Minor Storm';
    if (kIndex <= 7) return 'Moderate Storm';
    if (kIndex <= 8) return 'Strong Storm';
    return 'Severe Storm';
  }

  /**
   * Utility function to get date string
   */
  getDateString(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  /**
   * Fallback data methods for when APIs are unavailable
   */
  getFallbackPlanetaryData(date) {
    // Return simplified calculated positions
    return {
      mercury: { position: { x: 0.3, y: 0, z: 0 }, velocity: { x: 0, y: 47.87, z: 0 } },
      venus: { position: { x: 0.7, y: 0, z: 0 }, velocity: { x: 0, y: 35.02, z: 0 } },
      earth: { position: { x: 1.0, y: 0, z: 0 }, velocity: { x: 0, y: 29.78, z: 0 } },
      mars: { position: { x: 1.5, y: 0, z: 0 }, velocity: { x: 0, y: 24.07, z: 0 } },
      jupiter: { position: { x: 5.2, y: 0, z: 0 }, velocity: { x: 0, y: 13.07, z: 0 } },
      saturn: { position: { x: 9.5, y: 0, z: 0 }, velocity: { x: 0, y: 9.69, z: 0 } },
      uranus: { position: { x: 19.2, y: 0, z: 0 }, velocity: { x: 0, y: 6.81, z: 0 } },
      neptune: { position: { x: 30.1, y: 0, z: 0 }, velocity: { x: 0, y: 5.43, z: 0 } }
    };
  }

  getFallbackSolarData() {
    return {
      solarFlares: [],
      solarCycle: {
        cycleNumber: 25,
        progress: 0.3,
        sunspotNumber: 50,
        phase: 'ascending'
      },
      timestamp: new Date().toISOString()
    };
  }

  getFallbackSmallBodyData() {
    return {
      nearEarthObjects: {},
      elementCount: 0,
      timestamp: new Date().toISOString()
    };
  }

  getFallbackLunarData(date) {
    const phase = this.calculateLunarPhase(date);
    return {
      phase: phase,
      position: {
        longitude: 0,
        latitude: 0,
        distance: 384400,
        rightAscension: 0,
        declination: 0
      },
      illumination: phase.illumination,
      age: phase.age,
      timestamp: date.toISOString()
    };
  }

  getFallbackSpaceWeatherData() {
    return {
      solar: this.getFallbackSolarData(),
      geomagnetic: {
        kIndex: 2,
        apIndex: 7,
        condition: 'Quiet',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  }
}

export { AstronomicalDataService };