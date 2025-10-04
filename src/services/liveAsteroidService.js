/**
 * Live Asteroid Data Service
 * Integrates real NASA API data for live asteroid tracking and simulation
 */

import { nasaService } from './nasaService';

class LiveAsteroidService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.updateInterval = null;
    this.subscribers = new Set();
    this.isUpdating = false;

    // Real-time data storage
    this.liveAsteroids = [];
    this.closeApproaches = [];
    this.potentiallyHazardous = [];

    // Auto-update configuration
    this.autoUpdateEnabled = true;
    this.updateFrequency = this.getOptimalUpdateFrequency();
    this.lastUpdateAttempt = 0;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 3;

    this.startAutoUpdate();
  }

  /**
   * Subscribe to live asteroid data updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);

    // Immediately send current data if available
    if (this.liveAsteroids.length > 0) {
      callback({
        asteroids: this.liveAsteroids,
        closeApproaches: this.closeApproaches,
        potentiallyHazardous: this.potentiallyHazardous,
        lastUpdate: this.lastUpdate,
      });
    }

    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data updates
   */
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Get optimal update frequency based on API key type and rate limits
   */
  getOptimalUpdateFrequency() {
    const rateLimitStatus = nasaService.getRateLimitStatus();

    if (rateLimitStatus.isDemoKey) {
      // For demo key, update much less frequently
      return 30 * 60 * 1000; // 30 minutes
    }
    // For real API key, can update more frequently
    return 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Check if we should attempt an update based on rate limits and error history
   */
  shouldAttemptUpdate() {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastUpdateAttempt;

    // If we've had consecutive errors, back off exponentially
    if (this.consecutiveErrors > 0) {
      const backoffTime = Math.min(
        this.updateFrequency * Math.pow(2, this.consecutiveErrors - 1),
        2 * 60 * 60 * 1000 // Max 2 hours
      );

      if (timeSinceLastAttempt < backoffTime) {
        console.log(
          `Backing off due to ${this.consecutiveErrors} consecutive errors. Next attempt in ${Math.round((backoffTime - timeSinceLastAttempt) / 1000)}s`
        );
        return false;
      }
    }

    // Check NASA service rate limit status
    const rateLimitStatus = nasaService.getRateLimitStatus();
    if (!rateLimitStatus.canMakeRequest) {
      console.log('Rate limit reached, skipping update');
      return false;
    }

    return true;
  }

  /**
   * Start automatic data updates
   */
  async startAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    console.log(
      `Starting auto-update with frequency: ${this.updateFrequency}ms`
    );

    // Preload cache if possible
    try {
      await this.nasaService.preloadCache();
    } catch (error) {
      console.warn('Error preloading cache:', error);
    }

    // Initial fetch
    this.fetchLiveAsteroidData();

    // Set up periodic updates with intelligent scheduling
    this.updateInterval = setInterval(
      () => {
        if (this.autoUpdateEnabled && this.shouldAttemptUpdate()) {
          this.fetchLiveAsteroidData();
        } else {
          console.log(
            'Skipping update due to rate limits or consecutive errors'
          );
        }
      },
      Math.min(this.updateFrequency / 4, 5 * 60 * 1000)
    ); // Check every 5 minutes or quarter of update frequency
  }

  /**
   * Stop automatic updates
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Fetch live asteroid data from NASA APIs
   */
  async fetchLiveAsteroidData() {
    if (this.isUpdating) {
      return this.getCachedData();
    }

    this.isUpdating = true;
    this.lastUpdateAttempt = Date.now();

    try {
      console.log('Fetching live asteroid data from NASA...');

      // Get today's date range
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startDate = today.toISOString().split('T')[0];
      const endDate = tomorrow.toISOString().split('T')[0];

      // Fetch NEO feed for today
      const neoFeed = await nasaService.getNeoFeed(startDate, endDate);

      // Fetch browse data for more asteroids
      const neoBrowse = await nasaService.getNeoBrowse();

      // Process and combine the data
      const processedData = this.processNASAData(neoFeed, neoBrowse);

      // Update internal storage
      this.liveAsteroids = processedData.asteroids;
      this.closeApproaches = processedData.closeApproaches;
      this.potentiallyHazardous = processedData.potentiallyHazardous;
      this.lastUpdate = new Date();

      // Cache the data
      this.setCachedData(processedData);

      // Reset error counter on successful update
      this.consecutiveErrors = 0;

      // Notify subscribers
      this.notifySubscribers({
        asteroids: this.liveAsteroids,
        closeApproaches: this.closeApproaches,
        potentiallyHazardous: this.potentiallyHazardous,
        lastUpdate: this.lastUpdate,
      });

      console.log(
        `Updated live asteroid data: ${this.liveAsteroids.length} asteroids`
      );

      return processedData;
    } catch (error) {
      console.error('Error fetching live asteroid data:', error);

      // Increment consecutive error counter
      this.consecutiveErrors++;

      // If we've hit max consecutive errors, temporarily disable auto-update
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.warn(
          `${this.consecutiveErrors} consecutive errors. Temporarily reducing update frequency.`
        );
        // Update frequency will be handled by exponential backoff in shouldAttemptUpdate
      }

      // Return cached data if available
      const cachedData = this.getCachedData();
      if (cachedData) {
        console.log('Using cached asteroid data due to API error');
        return cachedData;
      }

      // Return demo data as fallback
      return this.getDemoData();
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Process raw NASA API data into usable format
   */
  processNASAData(neoFeed, neoBrowse) {
    const asteroids = [];
    const closeApproaches = [];
    const potentiallyHazardous = [];

    // Process NEO feed data (today's close approaches)
    if (neoFeed && neoFeed.near_earth_objects) {
      Object.values(neoFeed.near_earth_objects)
        .flat()
        .forEach(neo => {
          const asteroid = this.processNEOData(neo);
          asteroids.push(asteroid);

          // Check for close approaches
          if (neo.close_approach_data && neo.close_approach_data.length > 0) {
            neo.close_approach_data.forEach(approach => {
              if (parseFloat(approach.miss_distance.astronomical) < 0.1) {
                // Within 0.1 AU
                closeApproaches.push({
                  ...asteroid,
                  approachDate: approach.close_approach_date,
                  missDistance: approach.miss_distance,
                  relativeVelocity: approach.relative_velocity,
                });
              }
            });
          }

          // Check if potentially hazardous
          if (neo.is_potentially_hazardous_asteroid) {
            potentiallyHazardous.push(asteroid);
          }
        });
    }

    // Process browse data for additional asteroids
    if (neoBrowse && neoBrowse.near_earth_objects) {
      neoBrowse.near_earth_objects.slice(0, 20).forEach(neo => {
        const asteroid = this.processNEOData(neo);

        // Avoid duplicates
        if (!asteroids.find(a => a.id === asteroid.id)) {
          asteroids.push(asteroid);

          if (neo.is_potentially_hazardous_asteroid) {
            potentiallyHazardous.push(asteroid);
          }
        }
      });
    }

    return {
      asteroids: asteroids.slice(0, 50), // Limit to 50 for performance
      closeApproaches: closeApproaches.slice(0, 10),
      potentiallyHazardous: potentiallyHazardous.slice(0, 15),
    };
  }

  /**
   * Process individual NEO data into standardized format
   */
  processNEOData(neo) {
    const diameter = neo.estimated_diameter?.meters;
    const avgDiameter = diameter
      ? (diameter.estimated_diameter_min + diameter.estimated_diameter_max) / 2
      : 100;

    // Get the most recent close approach data
    const latestApproach = neo.close_approach_data?.[0];

    return {
      id: neo.id,
      name: neo.name,
      designation: neo.designation,
      diameter: Math.round(avgDiameter),
      diameterRange: diameter
        ? {
            min: Math.round(diameter.estimated_diameter_min),
            max: Math.round(diameter.estimated_diameter_max),
          }
        : null,
      velocity: latestApproach
        ? parseFloat(latestApproach.relative_velocity.kilometers_per_second)
        : Math.random() * 30 + 10, // Fallback random velocity
      missDistance: latestApproach
        ? {
            km: parseFloat(latestApproach.miss_distance.kilometers),
            au: parseFloat(latestApproach.miss_distance.astronomical),
            lunar: parseFloat(latestApproach.miss_distance.lunar),
          }
        : null,
      approachDate: latestApproach?.close_approach_date,
      orbitingBody: latestApproach?.orbiting_body || 'Earth',
      isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid || false,
      absoluteMagnitude: neo.absolute_magnitude_h,
      orbitClass: neo.orbital_data?.orbit_class_type || 'Unknown',
      orbitPeriod: neo.orbital_data?.orbital_period
        ? parseFloat(neo.orbital_data.orbital_period)
        : null,
      eccentricity: neo.orbital_data?.eccentricity
        ? parseFloat(neo.orbital_data.eccentricity)
        : null,
      inclination: neo.orbital_data?.inclination
        ? parseFloat(neo.orbital_data.inclination)
        : null,
      nasaJplUrl: neo.nasa_jpl_url,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get a specific asteroid for simulation
   */
  getAsteroidForSimulation(asteroidId) {
    const asteroid = this.liveAsteroids.find(a => a.id === asteroidId);
    if (!asteroid) {
      throw new Error(`Asteroid ${asteroidId} not found in live data`);
    }

    // Convert to simulation parameters
    return {
      diameter: asteroid.diameter,
      velocity: asteroid.velocity,
      angle: Math.random() * 90, // Random entry angle
      composition: this.estimateComposition(asteroid),
      name: asteroid.name,
      realData: true,
      source: 'NASA NEO API',
      asteroidId: asteroid.id,
    };
  }

  /**
   * Estimate asteroid composition based on available data
   */
  estimateComposition(asteroid) {
    // Simple heuristic based on orbit class and magnitude
    if (
      asteroid.orbitClass?.includes('Apollo') ||
      asteroid.orbitClass?.includes('Aten')
    ) {
      return 'stone'; // Most common for near-Earth asteroids
    } else if (asteroid.absoluteMagnitude < 18) {
      return 'iron'; // Brighter objects often metallic
    }
    return 'ice'; // Dimmer objects might be more volatile-rich
  }

  /**
   * Get potentially hazardous asteroids for alerts
   */
  getPotentiallyHazardousAsteroids() {
    return this.potentiallyHazardous;
  }

  /**
   * Get close approaches for the next few days
   */
  getUpcomingCloseApproaches() {
    return this.closeApproaches.sort(
      (a, b) => new Date(a.approachDate) - new Date(b.approachDate)
    );
  }

  /**
   * Cache management
   */
  setCachedData(data) {
    this.cache.set('liveAsteroids', {
      data,
      timestamp: Date.now(),
    });
  }

  getCachedData() {
    const cached = this.cache.get('liveAsteroids');
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Demo data for when API is unavailable
   */
  getDemoData() {
    return {
      asteroids: [
        {
          id: 'demo-001',
          name: '2024 Demo A',
          diameter: 150,
          velocity: 18.5,
          isPotentiallyHazardous: true,
          orbitClass: 'Apollo',
          source: 'Demo Data',
        },
        {
          id: 'demo-002',
          name: '2024 Demo B',
          diameter: 89,
          velocity: 22.1,
          isPotentiallyHazardous: false,
          orbitClass: 'Amor',
          source: 'Demo Data',
        },
      ],
      closeApproaches: [],
      potentiallyHazardous: [],
    };
  }

  /**
   * Get current data status
   */
  getDataStatus() {
    return {
      isUpdating: this.isUpdating,
      lastUpdate: this.lastUpdate,
      asteroidCount: this.liveAsteroids.length,
      closeApproachCount: this.closeApproaches.length,
      hazardousCount: this.potentiallyHazardous.length,
      autoUpdateEnabled: this.autoUpdateEnabled,
      subscriberCount: this.subscribers.size,
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAutoUpdate();
    this.subscribers.clear();
    this.cache.clear();
  }
}

// Create singleton instance
export const liveAsteroidService = new LiveAsteroidService();
export default liveAsteroidService;
