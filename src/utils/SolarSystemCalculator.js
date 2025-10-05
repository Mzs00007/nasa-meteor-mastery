/**
 * SolarSystemCalculator - Utility for precise astronomical calculations and orbital mechanics
 * Implements real-time planetary positions, orbital elements, and celestial mechanics
 * Enhanced with live data integration and accurate astronomical algorithms
 */

import { AstronomicalDataService } from '../services/AstronomicalDataService.js';

class SolarSystemCalculator {
  constructor() {
    // Astronomical constants
    this.AU = 149597870.7; // Astronomical Unit in kilometers
    this.EARTH_RADIUS = 6371; // Earth radius in kilometers
    this.SUN_RADIUS = 695700; // Sun radius in kilometers
    this.GRAVITATIONAL_CONSTANT = 6.67430e-11; // m³/kg⋅s²
    this.SUN_MASS = 1.989e30; // kg
    this.LIGHT_SPEED = 299792458; // Speed of light in m/s
    
    // Julian date constants
    this.J2000 = 2451545.0; // Julian date for J2000.0 epoch
    this.DAYS_PER_CENTURY = 36525;
    
    // Initialize astronomical data service
    this.astronomicalDataService = new AstronomicalDataService();
    
    // Cache for live data
    this.liveDataCache = new Map();
    this.lastLiveDataUpdate = null;
    this.liveDataUpdateInterval = 5 * 60 * 1000; // 5 minutes
    
    // Enhanced orbital elements for planets with perturbations (J2000.0 epoch)
    this.planetaryElements = {
      mercury: {
        a: 0.38709927,      // Semi-major axis (AU)
        e: 0.20563593,      // Eccentricity
        i: 7.00497902,      // Inclination (degrees)
        L: 252.25032350,    // Mean longitude (degrees)
        longPeri: 77.45779628,  // Longitude of perihelion (degrees)
        longNode: 48.33076593,  // Longitude of ascending node (degrees)
        // Rates of change per century
        aDot: 0.00000037,
        eDot: 0.00001906,
        iDot: -0.00594749,
        LDot: 149472.67411175,
        longPeriDot: 0.16047689,
        longNodeDot: -0.12534081,
        // Additional terms for higher accuracy
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      },
      venus: {
        a: 0.72333566,
        e: 0.00677672,
        i: 3.39467605,
        L: 181.97909950,
        longPeri: 131.60246718,
        longNode: 76.67984255,
        aDot: 0.00000390,
        eDot: -0.00004107,
        iDot: -0.00078890,
        LDot: 58517.81538729,
        longPeriDot: 0.00268329,
        longNodeDot: -0.27769418,
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      },
      earth: {
        a: 1.00000261,
        e: 0.01671123,
        i: -0.00001531,
        L: 100.46457166,
        longPeri: 102.93768193,
        longNode: 0.0,
        aDot: 0.00000562,
        eDot: -0.00004392,
        iDot: -0.01294668,
        LDot: 35999.37244981,
        longPeriDot: 0.32327364,
        longNodeDot: 0.0,
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      },
      mars: {
        a: 1.52371034,
        e: 0.09339410,
        i: 1.84969142,
        L: -4.55343205,
        longPeri: -23.94362959,
        longNode: 49.55953891,
        aDot: 0.00001847,
        eDot: 0.00007882,
        iDot: -0.00813131,
        LDot: 19140.30268499,
        longPeriDot: 0.44441088,
        longNodeDot: -0.29257343,
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      },
      jupiter: {
        a: 5.20288700,
        e: 0.04838624,
        i: 1.30439695,
        L: 34.39644051,
        longPeri: 14.72847983,
        longNode: 100.47390909,
        aDot: -0.00011607,
        eDot: -0.00013253,
        iDot: -0.00183714,
        LDot: 3034.74612775,
        longPeriDot: 0.21252668,
        longNodeDot: 0.20469106,
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      },
      saturn: {
        a: 9.53667594,
        e: 0.05386179,
        i: 2.48599187,
        L: 49.95424423,
        longPeri: 92.59887831,
        longNode: 113.66242448,
        aDot: -0.00125060,
        eDot: -0.00050991,
        iDot: 0.00193609,
        LDot: 1222.49362201,
        longPeriDot: -0.41897216,
        longNodeDot: -0.28867794,
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      },
      uranus: {
        a: 19.18916464,
        e: 0.04725744,
        i: 0.77263783,
        L: 313.23810451,
        longPeri: 170.95427630,
        longNode: 74.01692503,
        aDot: -0.00196176,
        eDot: -0.00004397,
        iDot: -0.00242939,
        LDot: 428.48202785,
        longPeriDot: 0.40805281,
        longNodeDot: 0.04240589,
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      },
      neptune: {
        a: 30.06992276,
        e: 0.00859048,
        i: 1.77004347,
        L: -55.12002969,
        longPeri: 44.96476227,
        longNode: 131.78422574,
        aDot: 0.00026291,
        eDot: 0.00005105,
        iDot: 0.00035372,
        LDot: 218.45945325,
        longPeriDot: -0.32241464,
        longNodeDot: -0.00508664,
        b: 0.00000000,
        c: 0.00000000,
        s: 0.00000000,
        f: 0.00000000
      }
    };

    // Enhanced physical properties with atmospheric and magnetic data
    this.planetaryData = {
      mercury: {
        radius: 2439.7,        // km
        mass: 3.3011e23,       // kg
        rotationPeriod: 58.646, // Earth days
        axialTilt: 0.034,      // degrees
        albedo: 0.142,
        atmosphere: false,
        magneticField: 0.0033, // Relative to Earth
        density: 5427,         // kg/m³
        escapeVelocity: 4.25,  // km/s
        surfaceGravity: 3.7,   // m/s²
        meanTemperature: 440,  // K
        minTemperature: 100,   // K
        maxTemperature: 700    // K
      },
      venus: {
        radius: 6051.8,
        mass: 4.8675e24,
        rotationPeriod: -243.025, // Retrograde rotation
        axialTilt: 177.36,
        albedo: 0.689,
        atmosphere: true,
        atmosphereComposition: { CO2: 96.5, N2: 3.5 },
        magneticField: 0.000015,
        density: 5243,
        escapeVelocity: 10.36,
        surfaceGravity: 8.87,
        meanTemperature: 737,
        surfacePressure: 92 // bars
      },
      earth: {
        radius: 6371.0,
        mass: 5.9724e24,
        rotationPeriod: 0.99726968, // Sidereal day
        axialTilt: 23.4392811,
        albedo: 0.306,
        atmosphere: true,
        atmosphereComposition: { N2: 78.08, O2: 20.95, Ar: 0.93, CO2: 0.04 },
        magneticField: 1.0,
        density: 5514,
        escapeVelocity: 11.19,
        surfaceGravity: 9.807,
        meanTemperature: 288,
        surfacePressure: 1.013 // bars
      },
      mars: {
        radius: 3389.5,
        mass: 6.4171e23,
        rotationPeriod: 1.025957,
        axialTilt: 25.19,
        albedo: 0.170,
        atmosphere: true,
        atmosphereComposition: { CO2: 95.32, N2: 2.7, Ar: 1.6 },
        magneticField: 0.0001,
        density: 3933,
        escapeVelocity: 5.03,
        surfaceGravity: 3.71,
        meanTemperature: 210,
        surfacePressure: 0.006 // bars
      },
      jupiter: {
        radius: 69911,
        mass: 1.8982e27,
        rotationPeriod: 0.41354,
        axialTilt: 3.13,
        albedo: 0.538,
        atmosphere: true,
        atmosphereComposition: { H2: 89.8, He: 10.2 },
        magneticField: 19.5,
        density: 1326,
        escapeVelocity: 59.5,
        surfaceGravity: 24.79,
        meanTemperature: 165,
        rings: true,
        majorMoons: ['Io', 'Europa', 'Ganymede', 'Callisto']
      },
      saturn: {
        radius: 58232,
        mass: 5.6834e26,
        rotationPeriod: 0.44401,
        axialTilt: 26.73,
        albedo: 0.499,
        atmosphere: true,
        atmosphereComposition: { H2: 96.3, He: 3.25 },
        magneticField: 0.7,
        density: 687,
        escapeVelocity: 35.5,
        surfaceGravity: 10.44,
        meanTemperature: 134,
        rings: true,
        majorMoons: ['Mimas', 'Enceladus', 'Tethys', 'Dione', 'Rhea', 'Titan', 'Iapetus']
      },
      uranus: {
        radius: 25362,
        mass: 8.6810e25,
        rotationPeriod: -0.71833, // Retrograde rotation
        axialTilt: 97.77,
        albedo: 0.488,
        atmosphere: true,
        atmosphereComposition: { H2: 82.5, He: 15.2, CH4: 2.3 },
        magneticField: 0.23,
        density: 1271,
        escapeVelocity: 21.3,
        surfaceGravity: 8.69,
        meanTemperature: 76,
        rings: true,
        majorMoons: ['Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon']
      },
      neptune: {
        radius: 24622,
        mass: 1.0243e26,
        rotationPeriod: 0.6713,
        axialTilt: 28.32,
        albedo: 0.442,
        atmosphere: true,
        atmosphereComposition: { H2: 80.0, He: 19.0, CH4: 1.0 },
        magneticField: 0.14,
        density: 1638,
        escapeVelocity: 23.5,
        surfaceGravity: 11.15,
        meanTemperature: 72,
        rings: true,
        majorMoons: ['Triton', 'Nereid']
      }
    };
  }

  /**
   * Convert calendar date to Julian Date
   */
  dateToJulianDate(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();

    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;

    let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

    let jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

    return jd;
  }

  /**
   * Calculate centuries since J2000.0
   */
  centuriesSinceJ2000(julianDate) {
    return (julianDate - this.J2000) / this.DAYS_PER_CENTURY;
  }

  /**
   * Normalize angle to 0-360 degrees
   */
  normalizeAngle(angle) {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }

  /**
   * Convert degrees to radians
   */
  degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * Convert radians to degrees
   */
  radToDeg(radians) {
    return radians * 180 / Math.PI;
  }

  /**
   * Calculate orbital elements for a given date
   */
  getOrbitalElements(planet, date) {
    const jd = this.dateToJulianDate(date);
    const T = this.centuriesSinceJ2000(jd);
    const elements = this.planetaryElements[planet];

    if (!elements) {
      throw new Error(`Unknown planet: ${planet}`);
    }

    return {
      a: elements.a + elements.aDot * T,
      e: elements.e + elements.eDot * T,
      i: this.normalizeAngle(elements.i + elements.iDot * T),
      L: this.normalizeAngle(elements.L + elements.LDot * T),
      longPeri: this.normalizeAngle(elements.longPeri + elements.longPeriDot * T),
      longNode: this.normalizeAngle(elements.longNode + elements.longNodeDot * T)
    };
  }

  /**
   * Solve Kepler's equation using Newton-Raphson method
   */
  solveKeplersEquation(M, e, tolerance = 1e-8) {
    let E = M; // Initial guess
    let delta = 1;
    let iterations = 0;
    const maxIterations = 100;

    while (Math.abs(delta) > tolerance && iterations < maxIterations) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
      iterations++;
    }

    return E;
  }

  /**
   * Calculate heliocentric position of a planet
   */
  calculateHeliocentricPosition(planet, date) {
    const elements = this.getOrbitalElements(planet, date);
    
    // Calculate mean anomaly
    const M = this.degToRad(this.normalizeAngle(elements.L - elements.longPeri));
    
    // Solve Kepler's equation for eccentric anomaly
    const E = this.solveKeplersEquation(M, elements.e);
    
    // Calculate true anomaly
    const nu = 2 * Math.atan2(
      Math.sqrt(1 + elements.e) * Math.sin(E / 2),
      Math.sqrt(1 - elements.e) * Math.cos(E / 2)
    );
    
    // Calculate distance from sun
    const r = elements.a * (1 - elements.e * Math.cos(E));
    
    // Calculate position in orbital plane
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    
    // Convert orbital elements to radians
    const i_rad = this.degToRad(elements.i);
    const omega_rad = this.degToRad(elements.longPeri - elements.longNode);
    const Omega_rad = this.degToRad(elements.longNode);
    
    // Transform to heliocentric coordinates
    const cos_omega = Math.cos(omega_rad);
    const sin_omega = Math.sin(omega_rad);
    const cos_i = Math.cos(i_rad);
    const sin_i = Math.sin(i_rad);
    const cos_Omega = Math.cos(Omega_rad);
    const sin_Omega = Math.sin(Omega_rad);
    
    const x = (cos_omega * cos_Omega - sin_omega * sin_Omega * cos_i) * x_orb +
              (-sin_omega * cos_Omega - cos_omega * sin_Omega * cos_i) * y_orb;
    
    const y = (cos_omega * sin_Omega + sin_omega * cos_Omega * cos_i) * x_orb +
              (-sin_omega * sin_Omega + cos_omega * cos_Omega * cos_i) * y_orb;
    
    const z = (sin_omega * sin_i) * x_orb + (cos_omega * sin_i) * y_orb;
    
    return {
      x: x,
      y: y,
      z: z,
      distance: r,
      trueAnomaly: this.radToDeg(nu),
      eccentricAnomaly: this.radToDeg(E),
      meanAnomaly: this.radToDeg(M)
    };
  }

  /**
   * Calculate geocentric position (for Earth-based observations)
   */
  calculateGeocentricPosition(planet, date) {
    if (planet === 'earth') {
      return { x: 0, y: 0, z: 0, distance: 0 };
    }

    const planetPos = this.calculateHeliocentricPosition(planet, date);
    const earthPos = this.calculateHeliocentricPosition('earth', date);

    return {
      x: planetPos.x - earthPos.x,
      y: planetPos.y - earthPos.y,
      z: planetPos.z - earthPos.z,
      distance: Math.sqrt(
        Math.pow(planetPos.x - earthPos.x, 2) +
        Math.pow(planetPos.y - earthPos.y, 2) +
        Math.pow(planetPos.z - earthPos.z, 2)
      )
    };
  }

  /**
   * Calculate planet's rotation angle at given date
   */
  calculateRotationAngle(planet, date) {
    const data = this.planetaryData[planet];
    if (!data) return 0;

    const jd = this.dateToJulianDate(date);
    const daysSinceJ2000 = jd - this.J2000;
    
    // Calculate rotation based on rotation period
    const rotations = daysSinceJ2000 / data.rotationPeriod;
    const angle = (rotations % 1) * 360; // Get fractional part and convert to degrees
    
    return this.normalizeAngle(angle);
  }

  /**
   * Calculate orbital velocity at current position
   */
  calculateOrbitalVelocity(planet, date) {
    const elements = this.getOrbitalElements(planet, date);
    const position = this.calculateHeliocentricPosition(planet, date);
    
    // Standard gravitational parameter for the Sun (km³/s²)
    const mu = 1.32712442018e11;
    
    // Calculate velocity using vis-viva equation
    const r = position.distance * this.AU; // Convert AU to km
    const a = elements.a * this.AU; // Convert AU to km
    
    const v = Math.sqrt(mu * (2/r - 1/a));
    
    return v; // km/s
  }

  /**
   * Calculate phase angle (for inner planets as seen from Earth)
   */
  calculatePhaseAngle(planet, date) {
    if (planet === 'earth') return 0;

    const planetPos = this.calculateHeliocentricPosition(planet, date);
    const earthPos = this.calculateHeliocentricPosition('earth', date);

    // Vector from Sun to planet
    const sunToPlanet = { x: planetPos.x, y: planetPos.y, z: planetPos.z };
    
    // Vector from Sun to Earth
    const sunToEarth = { x: earthPos.x, y: earthPos.y, z: earthPos.z };
    
    // Vector from Earth to planet
    const earthToPlanet = {
      x: planetPos.x - earthPos.x,
      y: planetPos.y - earthPos.y,
      z: planetPos.z - earthPos.z
    };

    // Calculate phase angle using dot product
    const dotProduct = -(sunToPlanet.x * earthToPlanet.x + 
                        sunToPlanet.y * earthToPlanet.y + 
                        sunToPlanet.z * earthToPlanet.z);
    
    const sunToPlanetMag = Math.sqrt(sunToPlanet.x**2 + sunToPlanet.y**2 + sunToPlanet.z**2);
    const earthToPlanetMag = Math.sqrt(earthToPlanet.x**2 + earthToPlanet.y**2 + earthToPlanet.z**2);
    
    const cosPhase = dotProduct / (sunToPlanetMag * earthToPlanetMag);
    const phaseAngle = Math.acos(Math.max(-1, Math.min(1, cosPhase)));
    
    return this.radToDeg(phaseAngle);
  }

  /**
   * Calculate illuminated fraction (phase)
   */
  calculateIlluminatedFraction(planet, date) {
    const phaseAngle = this.degToRad(this.calculatePhaseAngle(planet, date));
    return (1 + Math.cos(phaseAngle)) / 2;
  }

  /**
   * Get all planetary positions for a given date
   */
  getAllPlanetaryPositions(date) {
    const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
    const positions = {};

    planets.forEach(planet => {
      positions[planet] = {
        heliocentric: this.calculateHeliocentricPosition(planet, date),
        geocentric: this.calculateGeocentricPosition(planet, date),
        rotation: this.calculateRotationAngle(planet, date),
        velocity: this.calculateOrbitalVelocity(planet, date),
        phase: this.calculatePhaseAngle(planet, date),
        illumination: this.calculateIlluminatedFraction(planet, date),
        physicalData: this.planetaryData[planet]
      };
    });

    return positions;
  }

  /**
   * Calculate next opposition/conjunction for outer planets
   */
  calculateNextOpposition(planet, fromDate) {
    // This is a simplified calculation - in reality, you'd need more complex algorithms
    const elements = this.getOrbitalElements(planet, fromDate);
    const earthElements = this.getOrbitalElements('earth', fromDate);
    
    // Synodic period calculation
    const planetPeriod = Math.sqrt(Math.pow(elements.a, 3)); // Kepler's 3rd law (years)
    const earthPeriod = 1; // Earth's period is 1 year
    
    const synodicPeriod = Math.abs(1 / (1/earthPeriod - 1/planetPeriod));
    
    return synodicPeriod * 365.25; // Convert to days
  }

  /**
   * Calculate apparent magnitude (simplified)
   */
  calculateApparentMagnitude(planet, date) {
    // Simplified magnitude calculation - real calculations are much more complex
    const position = this.calculateGeocentricPosition(planet, date);
    const phase = this.calculateIlluminatedFraction(planet, date);
    const data = this.planetaryData[planet];
    
    if (!data) return null;

    // Base magnitude at 1 AU distance and full phase
    const baseMagnitudes = {
      mercury: -0.42,
      venus: -4.40,
      mars: -2.94,
      jupiter: -9.40,
      saturn: -8.88,
      uranus: -7.19,
      neptune: -6.87
    };

    const baseMag = baseMagnitudes[planet];
    if (baseMag === undefined) return null;

    // Distance factor (5 * log10(distance))
    const distanceFactor = 5 * Math.log10(position.distance);
    
    // Phase factor (simplified)
    const phaseFactor = -2.5 * Math.log10(phase);
    
    return baseMag + distanceFactor + phaseFactor;
  }

  /**
   * Get live planetary positions with real-time data integration
   */
  async getLivePlanetaryPositions(date = new Date()) {
    try {
      // Check if we need to update live data
      const now = Date.now();
      if (!this.lastLiveDataUpdate || 
          (now - this.lastLiveDataUpdate) > this.liveDataUpdateInterval) {
        
        // Fetch live data from astronomical services
        const liveData = await this.astronomicalDataService.getPlanetaryPositions(date);
        this.liveDataCache.set('planetary_positions', liveData);
        this.lastLiveDataUpdate = now;
      }

      // Get cached live data
      const liveData = this.liveDataCache.get('planetary_positions') || {};
      
      // Calculate positions for all planets
      const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
      const positions = {};

      for (const planet of planets) {
        // Use live data if available, otherwise fall back to calculated positions
        if (liveData[planet]) {
          positions[planet] = {
            ...this.calculateHeliocentricPosition(planet, date),
            livePosition: liveData[planet].position,
            liveVelocity: liveData[planet].velocity,
            isLiveData: true
          };
        } else {
          positions[planet] = {
            ...this.calculateHeliocentricPosition(planet, date),
            isLiveData: false
          };
        }

        // Add additional calculated properties
        positions[planet].rotationAngle = this.calculateRotationAngle(planet, date);
        positions[planet].orbitalVelocity = this.calculateOrbitalVelocity(planet, date);
        positions[planet].phaseAngle = this.calculatePhaseAngle(planet, date);
        positions[planet].illuminatedFraction = this.calculateIlluminatedFraction(planet, date);
        positions[planet].apparentMagnitude = this.calculateApparentMagnitude(planet, date);
      }

      return positions;
    } catch (error) {
      console.error('Error getting live planetary positions:', error);
      // Fall back to calculated positions
      return this.getAllPlanetaryPositions(date);
    }
  }

  /**
   * Get enhanced solar data with live solar activity
   */
  async getLiveSolarData(date = new Date()) {
    try {
      const solarData = await this.astronomicalDataService.getSolarActivityData();
      
      return {
        position: { x: 0, y: 0, z: 0 }, // Sun is at the center
        radius: this.SUN_RADIUS,
        mass: this.SUN_MASS,
        rotationAngle: this.calculateSolarRotationAngle(date),
        solarCycle: solarData.solarCycle,
        solarFlares: solarData.solarFlares,
        coronalMassEjections: solarData.coronalMassEjections || [],
        sunspotNumber: solarData.solarCycle.sunspotNumber,
        solarWindSpeed: this.calculateSolarWindSpeed(solarData),
        magneticFieldStrength: this.calculateSolarMagneticField(solarData),
        timestamp: solarData.timestamp
      };
    } catch (error) {
      console.error('Error getting live solar data:', error);
      return this.getFallbackSolarData(date);
    }
  }

  /**
   * Calculate solar rotation angle (differential rotation)
   */
  calculateSolarRotationAngle(date) {
    const jd = this.dateToJulianDate(date);
    const daysSinceJ2000 = jd - this.J2000;
    
    // Solar rotation period varies by latitude
    // Equatorial: ~25.4 days, Polar: ~35 days
    // Using average rotation period of ~27 days
    const solarRotationPeriod = 27.0;
    const rotations = daysSinceJ2000 / solarRotationPeriod;
    
    return this.normalizeAngle((rotations % 1) * 360);
  }

  /**
   * Calculate solar wind speed based on solar activity
   */
  calculateSolarWindSpeed(solarData) {
    const baseSolarWind = 400; // km/s typical speed
    const activityFactor = solarData.solarCycle.sunspotNumber / 100;
    
    return baseSolarWind + (activityFactor * 200); // Can reach 800+ km/s during high activity
  }

  /**
   * Calculate solar magnetic field strength
   */
  calculateSolarMagneticField(solarData) {
    const baseField = 1.0; // Gauss at solar surface
    const cycleModulation = Math.sin(solarData.solarCycle.progress * Math.PI);
    
    return baseField * (1 + cycleModulation * 0.5);
  }

  /**
   * Get live lunar data with accurate phase and position
   */
  async getLiveLunarData(date = new Date()) {
    try {
      const lunarData = await this.astronomicalDataService.getLunarData(date);
      
      return {
        position: this.calculateLunarPosition(date),
        phase: lunarData.phase,
        illumination: lunarData.illumination,
        age: lunarData.age,
        distance: lunarData.position.distance,
        angularDiameter: this.calculateLunarAngularDiameter(lunarData.position.distance),
        libration: this.calculateLunarLibration(date),
        tides: this.calculateTidalEffects(date, lunarData.position),
        timestamp: lunarData.timestamp
      };
    } catch (error) {
      console.error('Error getting live lunar data:', error);
      return this.getFallbackLunarData(date);
    }
  }

  /**
   * Calculate lunar position relative to Earth
   */
  calculateLunarPosition(date) {
    // Simplified lunar position calculation
    const jd = this.dateToJulianDate(date);
    const daysSinceJ2000 = jd - this.J2000;
    
    // Lunar orbital elements (simplified)
    const meanLongitude = 218.316 + 13.176396 * daysSinceJ2000;
    const meanAnomaly = 134.963 + 13.064993 * daysSinceJ2000;
    const meanDistance = 93.272 + 13.229350 * daysSinceJ2000;
    
    const longitude = meanLongitude + 6.289 * Math.sin(this.degToRad(meanAnomaly));
    const latitude = 5.128 * Math.sin(this.degToRad(meanDistance));
    const distance = 385000 - 20905 * Math.cos(this.degToRad(meanAnomaly)); // km
    
    // Convert to Cartesian coordinates
    const lonRad = this.degToRad(longitude);
    const latRad = this.degToRad(latitude);
    
    return {
      x: distance * Math.cos(latRad) * Math.cos(lonRad) / this.AU,
      y: distance * Math.cos(latRad) * Math.sin(lonRad) / this.AU,
      z: distance * Math.sin(latRad) / this.AU,
      distance: distance,
      longitude: longitude,
      latitude: latitude
    };
  }

  /**
   * Calculate lunar angular diameter
   */
  calculateLunarAngularDiameter(distance) {
    const lunarRadius = 1737.4; // km
    return 2 * Math.atan(lunarRadius / distance) * 180 / Math.PI * 3600; // arcseconds
  }

  /**
   * Calculate lunar libration
   */
  calculateLunarLibration(date) {
    // Simplified libration calculation
    const jd = this.dateToJulianDate(date);
    const daysSinceJ2000 = jd - this.J2000;
    
    const longitude = 6.3 * Math.sin(this.degToRad(13.176396 * daysSinceJ2000));
    const latitude = 6.9 * Math.sin(this.degToRad(13.064993 * daysSinceJ2000));
    
    return { longitude, latitude };
  }

  /**
   * Calculate tidal effects
   */
  calculateTidalEffects(date, lunarPosition) {
    const distance = lunarPosition.distance;
    const lunarMass = 7.342e22; // kg
    
    // Simplified tidal force calculation
    const tidalForce = (2 * this.GRAVITATIONAL_CONSTANT * lunarMass * this.EARTH_RADIUS) / 
                      Math.pow(distance * 1000, 3);
    
    return {
      force: tidalForce,
      range: tidalForce * 1e12, // Approximate tidal range in meters
      type: distance < 356500 ? 'spring' : distance > 406700 ? 'neap' : 'normal'
    };
  }

  /**
   * Get space weather data
   */
  async getSpaceWeatherData() {
    try {
      return await this.astronomicalDataService.getSpaceWeatherData();
    } catch (error) {
      console.error('Error getting space weather data:', error);
      return this.getFallbackSpaceWeatherData();
    }
  }

  /**
   * Calculate light travel time corrections
   */
  calculateLightTimeCorrection(distance) {
    // Distance in AU, return time in minutes
    return (distance * this.AU * 1000) / this.LIGHT_SPEED / 60;
  }

  /**
   * Get comprehensive astronomical data for a given date
   */
  async getComprehensiveAstronomicalData(date = new Date()) {
    try {
      const [
        planetaryPositions,
        solarData,
        lunarData,
        spaceWeather
      ] = await Promise.all([
        this.getLivePlanetaryPositions(date),
        this.getLiveSolarData(date),
        this.getLiveLunarData(date),
        this.getSpaceWeatherData()
      ]);

      return {
        date: date.toISOString(),
        julianDate: this.dateToJulianDate(date),
        planets: planetaryPositions,
        sun: solarData,
        moon: lunarData,
        spaceWeather: spaceWeather,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting comprehensive astronomical data:', error);
      throw error;
    }
  }

  /**
   * Fallback methods for when live data is unavailable
   */
  getFallbackSolarData(date) {
    return {
      position: { x: 0, y: 0, z: 0 },
      radius: this.SUN_RADIUS,
      mass: this.SUN_MASS,
      rotationAngle: this.calculateSolarRotationAngle(date),
      solarCycle: { cycleNumber: 25, progress: 0.3, sunspotNumber: 50, phase: 'ascending' },
      solarFlares: [],
      coronalMassEjections: [],
      sunspotNumber: 50,
      solarWindSpeed: 400,
      magneticFieldStrength: 1.0,
      timestamp: date.toISOString()
    };
  }

  getFallbackLunarData(date) {
    const position = this.calculateLunarPosition(date);
    const phase = this.astronomicalDataService.calculateLunarPhase(date);
    
    return {
      position: position,
      phase: phase,
      illumination: phase.illumination,
      age: phase.age,
      distance: position.distance,
      angularDiameter: this.calculateLunarAngularDiameter(position.distance),
      libration: this.calculateLunarLibration(date),
      tides: this.calculateTidalEffects(date, position),
      timestamp: date.toISOString()
    };
  }

  getFallbackSpaceWeatherData() {
    return {
      solar: this.getFallbackSolarData(new Date()),
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

export { SolarSystemCalculator };