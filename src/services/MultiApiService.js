/**
 * Multi-API Service for Meteor Impact Simulation
 * Integrates data from NASA, USGS, ESA, and other sources
 */

class MultiApiService {
  constructor() {
    this.apiKeys = {
      nasa: 'DEMO_KEY', // Replace with actual NASA API key
      usgs: null, // USGS APIs are typically free
      esa: null, // ESA APIs vary by service
    };

    this.baseUrls = {
      nasa: {
        neo: 'https://api.nasa.gov/neo/rest/v1',
        asteroids: 'https://api.nasa.gov/planetary/asteroids',
        earth: 'https://api.nasa.gov/planetary/earth',
      },
      usgs: {
        earthquakes: 'https://earthquake.usgs.gov/fdsnws/event/1',
        landsat: 'https://landsatlook.usgs.gov/sat-api',
      },
      esa: {
        space: 'https://sscweb.gsfc.nasa.gov/WS/sscr/2',
        sentinel: 'https://scihub.copernicus.eu/dhus',
      },
      external: {
        openstreetmap: 'https://nominatim.openstreetmap.org',
        geonames: 'http://api.geonames.org',
      },
    };
  }

  /**
   * Get Near Earth Objects from NASA
   */
  async getNearEarthObjects(startDate = null, endDate = null) {
    try {
      const start = startDate || new Date().toISOString().split('T')[0];
      const end =
        endDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

      const response = await fetch(
        `${this.baseUrls.nasa.neo}/feed?start_date=${start}&end_date=${end}&api_key=${this.apiKeys.nasa}`
      );

      if (!response.ok) {
        throw new Error(`NASA NEO API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processNeoData(data);
    } catch (error) {
      console.warn('NASA NEO API failed:', error);
      return this.getFallbackNeoData();
    }
  }

  /**
   * Get historical earthquake data from USGS
   */
  async getHistoricalEarthquakes(
    latitude,
    longitude,
    radiusKm = 100,
    minMagnitude = 4.0
  ) {
    try {
      const response = await fetch(
        `${this.baseUrls.usgs.earthquakes}/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradiuskm=${radiusKm}&minmagnitude=${minMagnitude}&limit=50`
      );

      if (!response.ok) {
        throw new Error(`USGS Earthquake API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processEarthquakeData(data);
    } catch (error) {
      console.warn('USGS Earthquake API failed:', error);
      return this.getFallbackEarthquakeData();
    }
  }

  /**
   * Get location information from multiple sources
   */
  async getLocationInfo(latitude, longitude) {
    const results = await Promise.allSettled([
      this.getOSMLocationInfo(latitude, longitude),
      this.getGeonamesLocationInfo(latitude, longitude),
    ]);

    // Combine results from successful API calls
    const locationData = {
      latitude,
      longitude,
      country: null,
      region: null,
      city: null,
      population: null,
      timezone: null,
      elevation: null,
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        Object.assign(locationData, result.value);
      }
    });

    return locationData;
  }

  /**
   * Get OpenStreetMap location data
   */
  async getOSMLocationInfo(latitude, longitude) {
    try {
      const response = await fetch(
        `${this.baseUrls.external.openstreetmap}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        country: data.address?.country,
        region: data.address?.state || data.address?.region,
        city: data.address?.city || data.address?.town || data.address?.village,
        displayName: data.display_name,
      };
    } catch (error) {
      console.warn('OSM API failed:', error);
      return null;
    }
  }

  /**
   * Get Geonames location data
   */
  async getGeonamesLocationInfo(latitude, longitude) {
    try {
      // Note: Geonames requires registration for username
      const response = await fetch(
        `${this.baseUrls.external.geonames}/findNearbyPlaceNameJSON?lat=${latitude}&lng=${longitude}&username=demo`
      );

      if (!response.ok) {
        throw new Error(`Geonames API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.geonames && data.geonames.length > 0) {
        const place = data.geonames[0];
        return {
          population: place.population,
          timezone: place.timezone?.timeZoneId,
          elevation: place.elevation,
        };
      }
      return null;
    } catch (error) {
      console.warn('Geonames API failed:', error);
      return null;
    }
  }

  /**
   * Get enhanced impact calculations using multiple data sources
   */
  async getEnhancedImpactData(meteorParams, locationData) {
    try {
      // Get historical earthquake data for comparison
      const earthquakes = await this.getHistoricalEarthquakes(
        meteorParams.latitude,
        meteorParams.longitude,
        200,
        3.0
      );

      // Get population data
      const location = await this.getLocationInfo(
        meteorParams.latitude,
        meteorParams.longitude
      );

      // Enhanced calculations
      const enhancedData = {
        ...this.calculateBasicImpact(meteorParams),
        historicalContext: earthquakes,
        locationContext: location,
        riskAssessment: this.calculateRiskAssessment(
          meteorParams,
          location,
          earthquakes
        ),
        comparisons: this.getHistoricalComparisons(meteorParams),
      };

      return enhancedData;
    } catch (error) {
      console.error('Enhanced impact calculation failed:', error);
      return this.calculateBasicImpact(meteorParams);
    }
  }

  /**
   * Process NASA NEO data
   */
  processNeoData(data) {
    const neos = [];
    Object.values(data.near_earth_objects || {}).forEach(dayObjects => {
      dayObjects.forEach(neo => {
        neos.push({
          id: neo.id,
          name: neo.name,
          diameter: {
            min: neo.estimated_diameter?.meters?.estimated_diameter_min || 0,
            max: neo.estimated_diameter?.meters?.estimated_diameter_max || 0,
          },
          velocity:
            neo.close_approach_data?.[0]?.relative_velocity
              ?.meters_per_second || 0,
          distance: neo.close_approach_data?.[0]?.miss_distance?.meters || 0,
          date: neo.close_approach_data?.[0]?.close_approach_date,
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
        });
      });
    });
    return neos;
  }

  /**
   * Process USGS earthquake data
   */
  processEarthquakeData(data) {
    return (
      data.features?.map(feature => ({
        magnitude: feature.properties.mag,
        location: feature.properties.place,
        time: new Date(feature.properties.time),
        coordinates: feature.geometry.coordinates,
        depth: feature.geometry.coordinates[2],
        url: feature.properties.url,
      })) || []
    );
  }

  /**
   * Calculate basic impact parameters
   */
  calculateBasicImpact(params) {
    const diameter = params.diameter; // meters
    const velocity = params.velocity; // m/s
    const density = params.density || 3000; // kg/m³
    const angle = (params.angle * Math.PI) / 180; // convert to radians

    // Calculate mass
    const volume = (4 / 3) * Math.PI * Math.pow(diameter / 2, 3);
    const mass = volume * density;

    // Calculate kinetic energy
    const kineticEnergy = 0.5 * mass * Math.pow(velocity, 2);

    // Calculate TNT equivalent (1 ton TNT = 4.184 × 10^9 J)
    const tntEquivalent = kineticEnergy / 4.184e9;

    // Calculate crater diameter (simplified formula)
    const craterDiameter =
      1.8 *
      Math.pow(kineticEnergy / 4.184e12, 0.25) *
      Math.pow(Math.sin(angle), 1 / 3);

    // Calculate blast radius
    const blastRadius = Math.pow(tntEquivalent / 1000, 1 / 3) * 2.5;

    // Calculate seismic magnitude
    const seismicMagnitude = Math.log10(kineticEnergy) - 4.8;

    return {
      kineticEnergy,
      tntEquivalent,
      craterDiameter: craterDiameter * 1000, // convert to meters
      blastRadius: blastRadius * 1000, // convert to meters
      seismicMagnitude: Math.max(0, seismicMagnitude),
      mass,
      volume,
    };
  }

  /**
   * Calculate risk assessment
   */
  calculateRiskAssessment(meteorParams, locationData, earthquakeHistory) {
    const impact = this.calculateBasicImpact(meteorParams);
    const population = locationData?.population || 0;

    // Estimate casualties based on blast radius and population density
    const affectedArea = Math.PI * Math.pow(impact.blastRadius / 1000, 2); // km²
    const populationDensity = population / 100; // rough estimate
    const estimatedCasualties = Math.min(
      population,
      affectedArea * populationDensity * 0.1
    );

    // Risk level based on energy release
    let riskLevel = 'Low';
    if (impact.tntEquivalent > 1000) {
      riskLevel = 'Extreme';
    } else if (impact.tntEquivalent > 100) {
      riskLevel = 'High';
    } else if (impact.tntEquivalent > 10) {
      riskLevel = 'Moderate';
    }

    return {
      riskLevel,
      estimatedCasualties: Math.round(estimatedCasualties),
      affectedArea,
      populationAtRisk: population,
      economicImpact: this.estimateEconomicImpact(impact, locationData),
    };
  }

  /**
   * Get historical comparisons
   */
  getHistoricalComparisons(meteorParams) {
    const impact = this.calculateBasicImpact(meteorParams);

    const historicalEvents = [
      { name: 'Tunguska Event (1908)', energy: 1.5e16, tnt: 3.6e6 },
      { name: 'Chelyabinsk (2013)', energy: 4.2e14, tnt: 1e5 },
      { name: 'Barringer Crater', energy: 2.5e15, tnt: 6e5 },
      { name: 'Chicxulub (Dinosaur Killer)', energy: 4.2e23, tnt: 1e11 },
    ];

    return historicalEvents.map(event => ({
      ...event,
      comparison: impact.kineticEnergy / event.energy,
      description: this.getComparisonDescription(
        impact.kineticEnergy / event.energy
      ),
    }));
  }

  /**
   * Get comparison description
   */
  getComparisonDescription(ratio) {
    if (ratio > 1) {
      return `${ratio.toFixed(1)}x more powerful`;
    } else if (ratio > 0.1) {
      return `${(ratio * 100).toFixed(0)}% as powerful`;
    }
    return `Much smaller than`;
  }

  /**
   * Estimate economic impact
   */
  estimateEconomicImpact(impact, locationData) {
    // Simplified economic impact estimation
    const gdpPerCapita = 50000; // USD, rough global average
    const population = locationData?.population || 0;
    const affectedArea = Math.PI * Math.pow(impact.blastRadius / 1000, 2);

    return {
      estimatedDamage: affectedArea * population * gdpPerCapita * 0.01, // USD
      recoveryTime: Math.min(10, Math.max(1, impact.tntEquivalent / 1000)), // years
      infrastructureDamage:
        impact.blastRadius > 5000
          ? 'Severe'
          : impact.blastRadius > 1000
            ? 'Moderate'
            : 'Minor',
    };
  }

  /**
   * Fallback data when APIs fail
   */
  getFallbackNeoData() {
    return [
      {
        id: 'fallback-1',
        name: 'Sample NEO 1',
        diameter: { min: 100, max: 200 },
        velocity: 15000,
        distance: 1000000,
        date: new Date().toISOString().split('T')[0],
        isPotentiallyHazardous: false,
      },
    ];
  }

  getFallbackEarthquakeData() {
    return [
      {
        magnitude: 5.5,
        location: 'Sample Historical Event',
        time: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        coordinates: [0, 0, 10],
        depth: 10,
        url: '#',
      },
    ];
  }
}

export default new MultiApiService();
