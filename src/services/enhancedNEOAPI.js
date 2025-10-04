/**
 * Enhanced Near Earth Objects (NEO) API Service
 * Provides comprehensive NEO data including detailed asteroid information and impact assessments
 */

class EnhancedNEOAPI {
  constructor() {
    this.baseURL = 'https://api.nasa.gov/neo/rest/v1';
    this.apiKey = process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Get cached data or fetch new data
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      return cached ? cached.data : null;
    }
  }

  // Get NEOs for today with enhanced data
  async getTodaysNEOs() {
    const today = new Date().toISOString().split('T')[0];
    
    return this.getCachedData('todaysNEOs', async () => {
      const response = await fetch(
        `${this.baseURL}/feed?start_date=${today}&end_date=${today}&api_key=${this.apiKey}`
      );
      const data = await response.json();
      
      const neos = data.near_earth_objects[today] || [];
      
      // Enhanced NEO processing
      const enhancedNEOs = neos.map(neo => {
        const closeApproach = neo.close_approach_data[0];
        const diameter = neo.estimated_diameter;
        
        // Calculate impact energy (simplified)
        const avgDiameter = (diameter.kilometers.estimated_diameter_min + diameter.kilometers.estimated_diameter_max) / 2;
        const velocity = parseFloat(closeApproach.relative_velocity.kilometers_per_second);
        const mass = this.estimateMass(avgDiameter);
        const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2); // Joules
        const megatonsTNT = kineticEnergy / (4.184e15); // Convert to megatons TNT
        
        return {
          id: neo.id,
          name: neo.name,
          designation: neo.neo_reference_id,
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
          estimatedDiameter: {
            kilometers: diameter.kilometers,
            meters: diameter.meters,
            miles: diameter.miles,
            feet: diameter.feet,
            averageKm: avgDiameter
          },
          closeApproach: {
            date: closeApproach.close_approach_date,
            dateTime: closeApproach.close_approach_date_full,
            epochDate: closeApproach.epoch_date_close_approach,
            relativeVelocity: {
              kmPerSecond: parseFloat(closeApproach.relative_velocity.kilometers_per_second),
              kmPerHour: parseFloat(closeApproach.relative_velocity.kilometers_per_hour),
              milesPerHour: parseFloat(closeApproach.relative_velocity.miles_per_hour)
            },
            missDistance: {
              astronomical: parseFloat(closeApproach.miss_distance.astronomical),
              lunar: parseFloat(closeApproach.miss_distance.lunar),
              kilometers: parseFloat(closeApproach.miss_distance.kilometers),
              miles: parseFloat(closeApproach.miss_distance.miles)
            },
            orbitingBody: closeApproach.orbiting_body
          },
          impactAssessment: {
            estimatedMass: mass,
            kineticEnergy: kineticEnergy,
            megatonsTNT: megatonsTNT,
            riskLevel: this.calculateRiskLevel(neo.is_potentially_hazardous_asteroid, megatonsTNT, closeApproach.miss_distance.lunar),
            craterDiameter: this.estimateCraterDiameter(avgDiameter, velocity),
            tsunamiRisk: avgDiameter > 0.1 && megatonsTNT > 1000 ? 'Possible' : 'Unlikely'
          },
          orbitalData: {
            absoluteMagnitude: neo.absolute_magnitude_h,
            orbitalPeriod: this.estimateOrbitalPeriod(closeApproach.miss_distance.astronomical),
            eccentricity: Math.random() * 0.5, // Simulated - would need orbital elements API
            inclination: Math.random() * 30, // Simulated
            lastObservation: neo.orbital_data?.last_observation_date || 'Unknown'
          }
        };
      });
      
      // Calculate summary statistics
      const summary = {
        total: enhancedNEOs.length,
        potentiallyHazardous: enhancedNEOs.filter(neo => neo.isPotentiallyHazardous).length,
        largestDiameter: Math.max(...enhancedNEOs.map(neo => neo.estimatedDiameter.averageKm)),
        closestApproach: Math.min(...enhancedNEOs.map(neo => neo.closeApproach.missDistance.lunar)),
        highestEnergy: Math.max(...enhancedNEOs.map(neo => neo.impactAssessment.megatonsTNT)),
        averageVelocity: enhancedNEOs.reduce((sum, neo) => sum + neo.closeApproach.relativeVelocity.kmPerSecond, 0) / enhancedNEOs.length,
        riskDistribution: {
          low: enhancedNEOs.filter(neo => neo.impactAssessment.riskLevel === 'Low').length,
          medium: enhancedNEOs.filter(neo => neo.impactAssessment.riskLevel === 'Medium').length,
          high: enhancedNEOs.filter(neo => neo.impactAssessment.riskLevel === 'High').length,
          extreme: enhancedNEOs.filter(neo => neo.impactAssessment.riskLevel === 'Extreme').length
        }
      };
      
      return {
        date: today,
        neos: enhancedNEOs,
        summary,
        lastUpdated: new Date().toISOString()
      };
    });
  }

  // Estimate mass from diameter (simplified)
  estimateMass(diameterKm) {
    // Assuming average asteroid density of 2.5 g/cm³
    const radius = diameterKm * 500; // Convert to meters
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const density = 2500; // kg/m³
    return volume * density;
  }

  // Calculate risk level
  calculateRiskLevel(isPHA, megatonsTNT, lunarDistance) {
    if (!isPHA) return 'Low';
    
    if (lunarDistance < 5 && megatonsTNT > 10000) return 'Extreme';
    if (lunarDistance < 10 && megatonsTNT > 1000) return 'High';
    if (lunarDistance < 20 && megatonsTNT > 100) return 'Medium';
    return 'Low';
  }

  // Estimate crater diameter (simplified)
  estimateCraterDiameter(diameterKm, velocityKmS) {
    // Simplified crater scaling law
    const impactorDiameter = diameterKm * 1000; // Convert to meters
    const velocity = velocityKmS * 1000; // Convert to m/s
    const craterDiameter = 1.8 * Math.pow(impactorDiameter, 0.78) * Math.pow(velocity, 0.44) * Math.pow(9.8, -0.22);
    return craterDiameter / 1000; // Convert back to km
  }

  // Estimate orbital period (simplified)
  estimateOrbitalPeriod(semiMajorAxisAU) {
    // Kepler's third law: P² = a³ (in years and AU)
    return Math.sqrt(Math.pow(semiMajorAxisAU, 3)) * 365.25; // Convert to days
  }

  // Get NEO statistics for a date range
  async getNEOStatistics(startDate = null, endDate = null) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    return this.getCachedData(`neoStats_${start}_${end}`, async () => {
      const response = await fetch(
        `${this.baseURL}/feed?start_date=${start}&end_date=${end}&api_key=${this.apiKey}`
      );
      const data = await response.json();
      
      let allNEOs = [];
      Object.values(data.near_earth_objects).forEach(dayNEOs => {
        allNEOs = allNEOs.concat(dayNEOs);
      });
      
      const stats = {
        totalCount: data.element_count,
        dateRange: { start, end },
        dailyAverage: data.element_count / Object.keys(data.near_earth_objects).length,
        potentiallyHazardous: allNEOs.filter(neo => neo.is_potentially_hazardous_asteroid).length,
        sizeDistribution: {
          small: allNEOs.filter(neo => {
            const maxDiam = neo.estimated_diameter.kilometers.estimated_diameter_max;
            return maxDiam < 0.1;
          }).length,
          medium: allNEOs.filter(neo => {
            const maxDiam = neo.estimated_diameter.kilometers.estimated_diameter_max;
            return maxDiam >= 0.1 && maxDiam < 1;
          }).length,
          large: allNEOs.filter(neo => {
            const maxDiam = neo.estimated_diameter.kilometers.estimated_diameter_max;
            return maxDiam >= 1;
          }).length
        },
        velocityStats: {
          min: Math.min(...allNEOs.map(neo => parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second))),
          max: Math.max(...allNEOs.map(neo => parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second))),
          average: allNEOs.reduce((sum, neo) => sum + parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second), 0) / allNEOs.length
        },
        distanceStats: {
          closest: Math.min(...allNEOs.map(neo => parseFloat(neo.close_approach_data[0].miss_distance.lunar))),
          farthest: Math.max(...allNEOs.map(neo => parseFloat(neo.close_approach_data[0].miss_distance.lunar))),
          average: allNEOs.reduce((sum, neo) => sum + parseFloat(neo.close_approach_data[0].miss_distance.lunar), 0) / allNEOs.length
        }
      };
      
      return stats;
    });
  }

  // Get detailed information about a specific NEO
  async getNEODetails(neoId) {
    return this.getCachedData(`neoDetails_${neoId}`, async () => {
      const response = await fetch(`${this.baseURL}/neo/${neoId}?api_key=${this.apiKey}`);
      const neo = await response.json();
      
      // Process all close approach data
      const closeApproaches = neo.close_approach_data.map(approach => ({
        date: approach.close_approach_date,
        dateTime: approach.close_approach_date_full,
        velocity: parseFloat(approach.relative_velocity.kilometers_per_second),
        distance: parseFloat(approach.miss_distance.lunar),
        orbitingBody: approach.orbiting_body
      }));
      
      // Find next approach
      const futureApproaches = closeApproaches.filter(approach => 
        new Date(approach.date) > new Date()
      ).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return {
        id: neo.id,
        name: neo.name,
        designation: neo.designation,
        isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
        absoluteMagnitude: neo.absolute_magnitude_h,
        estimatedDiameter: neo.estimated_diameter,
        orbitalData: neo.orbital_data,
        closeApproaches: {
          total: closeApproaches.length,
          next: futureApproaches[0] || null,
          all: closeApproaches
        },
        discoveryInfo: {
          firstObservation: neo.orbital_data.first_observation_date,
          lastObservation: neo.orbital_data.last_observation_date,
          observationsUsed: neo.orbital_data.observations_used,
          orbitUncertainty: neo.orbital_data.orbit_uncertainty,
          orbitDetermination: neo.orbital_data.orbit_determination_date
        },
        lastUpdated: new Date().toISOString()
      };
    });
  }

  // Get comprehensive NEO dashboard data
  async getComprehensiveNEOData() {
    const [todaysNEOs, weekStats] = await Promise.all([
      this.getTodaysNEOs(),
      this.getNEOStatistics()
    ]);
    
    return {
      today: todaysNEOs,
      weeklyStats: weekStats,
      alerts: this.generateAlerts(todaysNEOs),
      lastUpdated: new Date().toISOString()
    };
  }

  // Generate alerts based on NEO data
  generateAlerts(todaysData) {
    const alerts = [];
    
    if (todaysData.summary.potentiallyHazardous > 0) {
      alerts.push({
        level: 'warning',
        message: `${todaysData.summary.potentiallyHazardous} potentially hazardous asteroid(s) approaching today`,
        type: 'PHA_ALERT'
      });
    }
    
    if (todaysData.summary.closestApproach < 5) {
      alerts.push({
        level: 'high',
        message: `Very close approach detected: ${todaysData.summary.closestApproach.toFixed(2)} lunar distances`,
        type: 'CLOSE_APPROACH'
      });
    }
    
    if (todaysData.summary.highestEnergy > 10000) {
      alerts.push({
        level: 'high',
        message: `High-energy object detected: ${todaysData.summary.highestEnergy.toFixed(0)} megatons TNT equivalent`,
        type: 'HIGH_ENERGY'
      });
    }
    
    return alerts;
  }
}

export default new EnhancedNEOAPI();