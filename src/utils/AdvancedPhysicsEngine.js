/**
 * Advanced Physics Engine for Accurate Asteroid Impact Calculations
 * Based on scientific models from Collins et al. (2005), Holsapple & Schmidt (1987)
 * and NASA's impact effect calculator
 */

export class AdvancedPhysicsEngine {
  constructor() {
    // Physical constants
    this.CONSTANTS = {
      GRAVITY: 9.81, // m/s²
      TNT_ENERGY: 4.184e9, // J/ton TNT
      EARTH_RADIUS: 6.371e6, // meters
      ATMOSPHERE_SCALE_HEIGHT: 8400, // meters
      SOUND_SPEED: 343, // m/s
      STEFAN_BOLTZMANN: 5.67e-8, // W/(m²·K⁴)
      CRATER_DEPTH_RATIO: 0.2, // depth/diameter ratio
    };

    // Material properties
    this.MATERIALS = {
      iron: { density: 7800, strength: 500e6, meltingPoint: 1811 },
      stone: { density: 3500, strength: 100e6, meltingPoint: 1473 },
      ice: { density: 917, strength: 5e6, meltingPoint: 273 },
      carbonaceous: { density: 2000, strength: 50e6, meltingPoint: 1200 }
    };

    // Target properties (Earth's crust)
    this.TARGET = {
      density: 2500, // kg/m³
      strength: 50e6, // Pa
      gravity: 9.81 // m/s²
    };
  }

  /**
   * Calculate comprehensive impact effects with advanced modeling
   */
  calculateComprehensiveImpact(asteroidParams) {
    const { diameter, velocity, composition, angle, mass } = asteroidParams;
    
    // Calculate basic properties
    const asteroidMass = mass || this.calculateAsteroidMass(diameter, composition);
    const kineticEnergy = this.calculateKineticEnergy(asteroidMass, velocity);
    
    // Atmospheric entry simulation
    const entryResults = this.simulateAtmosphericEntry(asteroidParams);
    
    // Impact calculations
    const impactResults = this.calculateImpactEffects(entryResults, angle);
    
    // Energy dissipation zones
    const energyZones = this.calculateEnergyDissipationZones(impactResults);
    
    // Environmental effects
    const environmentalEffects = this.calculateEnvironmentalEffects(impactResults);
    
    return {
      asteroidMass,
      kineticEnergy,
      entryResults,
      impactResults,
      energyZones,
      environmentalEffects,
      impactClassification: this.classifyImpact(kineticEnergy),
      // Flatten commonly used properties for compatibility
      tntEquivalent: impactResults.tntEquivalent,
      impactEnergy: impactResults.impactEnergy,
      crater: impactResults.crater,
      seismicMagnitude: impactResults.seismicMagnitude,
      thermalEffects: impactResults.thermalEffects,
      blastEffects: impactResults.blastEffects,
      ejectaEffects: impactResults.ejectaEffects,
      // Atmospheric entry properties
      finalMass: entryResults.finalMass,
      finalVelocity: entryResults.finalVelocity,
      impactOccurred: entryResults.impactOccurred,
      airburstAltitude: entryResults.airburstAltitude
    };
  }

  /**
   * Calculate asteroid mass based on diameter and composition
   */
  calculateAsteroidMass(diameter, composition) {
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const density = this.MATERIALS[composition]?.density || 3500;
    return volume * density;
  }

  /**
   * Calculate kinetic energy
   */
  calculateKineticEnergy(mass, velocity) {
    const velocityMS = velocity * 1000; // Convert km/s to m/s
    return 0.5 * mass * Math.pow(velocityMS, 2);
  }

  /**
   * Simulate atmospheric entry with fragmentation and ablation
   */
  simulateAtmosphericEntry(asteroidParams) {
    const { diameter, velocity, composition, angle } = asteroidParams;
    const material = this.MATERIALS[composition] || this.MATERIALS.stone;
    
    let currentMass = this.calculateAsteroidMass(diameter, composition);
    let currentVelocity = velocity * 1000; // m/s
    let currentDiameter = diameter;
    let altitude = 100000; // Start at 100km
    
    const entryAngleRad = (angle * Math.PI) / 180;
    const trajectoryStep = 100; // meters
    
    const trajectory = [];
    let maxEnergyDepositionAltitude = null;
    
    while (altitude > 0 && currentMass > 0) {
      // Atmospheric density at altitude
      const atmosphereDensity = 1.225 * Math.exp(-altitude / this.CONSTANTS.ATMOSPHERE_SCALE_HEIGHT);
      
      // Dynamic pressure
      const dynamicPressure = 0.5 * atmosphereDensity * Math.pow(currentVelocity, 2);
      
      // More realistic fragmentation for large objects
      if (dynamicPressure > material.strength) {
        // Fragmentation occurs, but less aggressive for large objects
        const sizeFactor = Math.min(1, diameter / 50); // Larger objects fragment less
        const fragmentationFactor = Math.min(0.05, dynamicPressure / material.strength * 0.005 / sizeFactor);
        currentMass *= (1 - fragmentationFactor);
        currentDiameter *= Math.pow(1 - fragmentationFactor, 1/3);
      }
      
      // More realistic ablation for large objects
      const ablationRate = this.calculateAblationRate(currentVelocity, atmosphereDensity, material);
      const sizeFactor = Math.min(1, diameter / 50); // Larger objects ablate less per unit surface area
      const massLoss = ablationRate * trajectoryStep / Math.sin(entryAngleRad) / sizeFactor;
      currentMass = Math.max(0, currentMass - massLoss);
      
      // Deceleration due to drag
      const dragCoefficient = 1.3; // Typical for irregular objects
      const crossSectionalArea = Math.PI * Math.pow(currentDiameter / 2, 2);
      const dragForce = 0.5 * dragCoefficient * atmosphereDensity * Math.pow(currentVelocity, 2) * crossSectionalArea;
      const deceleration = dragForce / currentMass;
      
      currentVelocity = Math.max(0, currentVelocity - deceleration * (trajectoryStep / currentVelocity));
      
      trajectory.push({
        altitude,
        velocity: currentVelocity / 1000, // km/s
        mass: currentMass,
        diameter: currentDiameter,
        dynamicPressure
      });
      
      // Track where maximum energy deposition occurs
      if (dynamicPressure > material.strength && !maxEnergyDepositionAltitude) {
        maxEnergyDepositionAltitude = altitude;
      }
      
      altitude -= trajectoryStep / Math.sin(entryAngleRad);
      
      // Stop simulation if velocity becomes too low
      if (currentVelocity < 1000) break; // 1 km/s minimum
    }
    
    // Determine if this is an airburst or ground impact
    // Consider it an airburst if:
    // 1. Maximum energy deposition occurred above 2km altitude, OR
    // 2. Less than 10% of original mass remains, OR
    // 3. Object was completely destroyed in atmosphere
    const originalMass = this.calculateAsteroidMass(asteroidParams.diameter, asteroidParams.composition);
    const massRetentionRatio = currentMass / originalMass;
    const isAirburst = maxEnergyDepositionAltitude > 2000 || massRetentionRatio < 0.1 || currentMass <= 0;
    
    return {
      trajectory,
      finalMass: currentMass,
      finalVelocity: currentVelocity / 1000, // km/s
      finalDiameter: currentDiameter,
      impactOccurred: !isAirburst && currentMass > 0 && altitude <= 0,
      airburstAltitude: maxEnergyDepositionAltitude || (currentMass <= 0 ? altitude + trajectoryStep : null)
    };
  }

  /**
   * Calculate ablation rate during atmospheric entry
   */
  calculateAblationRate(velocity, atmosphereDensity, material) {
    // More realistic ablation model based on heat transfer
    const heatTransferCoeff = 0.01; // Reduced heat transfer coefficient for more realistic ablation
    const specificHeat = 1000; // J/(kg·K)
    const latentHeat = 2e6; // J/kg - energy to vaporize
    
    // Heat flux calculation
    const heatFlux = heatTransferCoeff * atmosphereDensity * Math.pow(velocity, 3);
    
    // Total energy needed to ablate material (heat + vaporize)
    const ablationEnergy = specificHeat * (material.meltingPoint - 300) + latentHeat;
    
    // Return ablation rate in kg/m
    return Math.max(0, heatFlux / ablationEnergy);
  }

  /**
   * Calculate impact effects with advanced crater scaling
   */
  calculateImpactEffects(entryResults, angle) {
    if (!entryResults.impactOccurred) {
      return this.calculateAirburstEffects(entryResults);
    }

    const { finalMass, finalVelocity, finalDiameter } = entryResults;
    const impactEnergy = this.calculateKineticEnergy(finalMass, finalVelocity);
    const angleRad = (angle * Math.PI) / 180;

    // Crater formation using Holsapple & Schmidt scaling laws
    const crater = this.calculateCraterFormation(finalMass, finalVelocity, angle);
    
    // Seismic effects
    const seismicMagnitude = this.calculateSeismicMagnitude(impactEnergy);
    
    // Thermal effects
    const thermalEffects = this.calculateThermalEffects(impactEnergy);
    
    // Blast wave effects
    const blastEffects = this.calculateBlastEffects(impactEnergy);
    
    // Ejecta distribution
    const ejectaEffects = this.calculateEjectaEffects(crater, impactEnergy);

    return {
      type: 'impact',
      impactEnergy,
      crater,
      seismicMagnitude,
      thermalEffects,
      blastEffects,
      ejectaEffects,
      tntEquivalent: impactEnergy / this.CONSTANTS.TNT_ENERGY / 1e6 // Megatons
    };
  }

  /**
   * Calculate crater formation using advanced scaling laws
   */
  calculateCraterFormation(mass, velocity, angle) {
    const impactEnergy = this.calculateKineticEnergy(mass, velocity);
    const angleRad = (angle * Math.PI) / 180;
    
    // Effective energy accounting for impact angle
    const effectiveEnergy = impactEnergy * Math.pow(Math.sin(angleRad), 2/3);
    
    // Crater diameter using Holsapple & Schmidt (1987) scaling
    const impactorDensity = mass / ((4/3) * Math.PI * Math.pow(velocity * 1000 / 2, 3));
    const scalingParameter = Math.pow(impactorDensity / this.TARGET.density, 1/3);
    
    const diameter = 2 * Math.pow(
      effectiveEnergy / (this.TARGET.density * Math.pow(this.CONSTANTS.GRAVITY, 2)),
      1/3
    ) * scalingParameter;
    
    const depth = diameter * this.CONSTANTS.CRATER_DEPTH_RATIO;
    const volume = (Math.PI / 12) * Math.pow(diameter, 2) * depth;
    const rimHeight = depth * 0.1;
    
    // Ejecta calculations
    const ejectaVolume = volume * 2; // Typically 2x crater volume
    const ejectaMass = ejectaVolume * this.TARGET.density;
    
    return {
      diameter,
      depth,
      volume,
      rimHeight,
      ejectaVolume,
      ejectaMass
    };
  }

  /**
   * Calculate energy dissipation zones with realistic modeling
   */
  calculateEnergyDissipationZones(impactResults) {
    const { impactEnergy, crater, type } = impactResults;
    const energyMegatons = impactEnergy / (this.CONSTANTS.TNT_ENERGY * 1e6);
    
    // Handle airburst scenarios without crater formation
    if (type === 'airburst' || !crater) {
      const blastRadius = Math.pow(energyMegatons, 0.33) * 1000; // meters
      return {
        totalDestruction: {
          radius: blastRadius * 0.3,
          energy: impactEnergy * 0.6,
          effects: ['Airburst blast', 'Thermal radiation', 'Overpressure'],
          color: '#ff4500',
          opacity: 0.8
        },
        severeDestruction: {
          radius: blastRadius * 0.6,
          energy: impactEnergy * 0.3,
          effects: ['Structural damage', 'Burns', 'Debris'],
          color: '#ff6600',
          opacity: 0.6
        },
        moderateDestruction: {
          radius: blastRadius,
          energy: impactEnergy * 0.1,
          effects: ['Window breakage', 'Minor injuries'],
          color: '#ff9900',
          opacity: 0.4
        }
      };
    }
    
    return {
      // Total destruction zone (crater + immediate vicinity)
      totalDestruction: {
        radius: crater.diameter / 2 + crater.rimHeight,
        energy: impactEnergy * 0.4, // 40% of energy in crater formation
        effects: ['Complete vaporization', 'Crater formation', 'Shock metamorphism'],
        color: '#ff0000',
        opacity: 0.9
      },
      
      // Severe destruction (ejecta blanket)
      severeDestruction: {
        radius: crater.diameter * 2.5,
        energy: impactEnergy * 0.25, // 25% of energy in ejecta
        effects: ['Ejecta blanket', 'Building collapse', 'Severe burns'],
        color: '#ff4500',
        opacity: 0.7
      },
      
      // Moderate destruction (thermal radiation)
      moderateDestruction: {
        radius: Math.pow(energyMegatons, 0.41) * 850, // meters
        energy: impactEnergy * 0.15, // 15% of energy in thermal radiation
        effects: ['Third-degree burns', 'Fires', 'Structural damage'],
        color: '#ff8c00',
        opacity: 0.5
      },
      
      // Light destruction (blast wave)
      lightDestruction: {
        radius: Math.pow(energyMegatons, 0.33) * 2100, // meters
        energy: impactEnergy * 0.1, // 10% of energy in blast wave
        effects: ['Broken windows', 'Light injuries', 'Hearing damage'],
        color: '#ffa500',
        opacity: 0.3
      },
      
      // Seismic effects
      seismicZone: {
        radius: Math.pow(energyMegatons, 0.5) * 50000, // meters
        energy: impactEnergy * 0.05, // 5% of energy in seismic waves
        effects: ['Ground shaking', 'Landslides', 'Structural resonance'],
        color: '#8b4513',
        opacity: 0.2
      },
      
      // Atmospheric effects
      atmosphericZone: {
        radius: Math.pow(energyMegatons, 0.6) * 100000, // meters
        energy: impactEnergy * 0.05, // 5% of energy in atmospheric disturbance
        effects: ['Pressure waves', 'Sound damage', 'Atmospheric heating'],
        color: '#87ceeb',
        opacity: 0.1
      }
    };
  }

  /**
   * Calculate seismic magnitude
   */
  calculateSeismicMagnitude(energy) {
    // Gutenberg-Richter relation for impact events
    return 0.67 * Math.log10(energy) - 5.87;
  }

  /**
   * Calculate thermal effects
   */
  calculateThermalEffects(energy) {
    const energyMegatons = energy / (this.CONSTANTS.TNT_ENERGY * 1e6);
    
    return {
      fireballRadius: Math.pow(energyMegatons, 0.4) * 120, // meters
      thermalRadiationRadius: Math.pow(energyMegatons, 0.41) * 850, // meters
      ignitionRadius: Math.pow(energyMegatons, 0.41) * 1200, // meters
      peakTemperature: Math.pow(energyMegatons, 0.25) * 5000, // Kelvin
      thermalPulse: energy * 0.35 // 35% of energy as thermal radiation
    };
  }

  /**
   * Calculate blast effects
   */
  calculateBlastEffects(energy) {
    const energyMegatons = energy / (this.CONSTANTS.TNT_ENERGY * 1e6);
    
    return {
      blastRadius5psi: Math.pow(energyMegatons, 0.33) * 2100, // 5 psi overpressure
      blastRadius1psi: Math.pow(energyMegatons, 0.33) * 4600, // 1 psi overpressure
      windSpeed: Math.pow(energyMegatons, 0.33) * 70, // m/s
      overpressurePeak: Math.pow(energyMegatons, 0.33) * 20, // psi
      blastEnergy: energy * 0.5 // 50% of energy in blast wave
    };
  }

  /**
   * Calculate ejecta effects
   */
  calculateEjectaEffects(crater, energy) {
    const ejectaVelocity = Math.sqrt(2 * this.CONSTANTS.GRAVITY * crater.depth);
    const maxRange = Math.pow(ejectaVelocity, 2) / this.CONSTANTS.GRAVITY;
    
    return {
      ejectaVelocity,
      maxRange,
      ejectaBlanketThickness: crater.depth * 0.1,
      ejectaDistribution: this.calculateEjectaDistribution(crater, maxRange)
    };
  }

  /**
   * Calculate ejecta distribution
   */
  calculateEjectaDistribution(crater, maxRange) {
    const zones = [];
    const numZones = 10;
    
    for (let i = 0; i < numZones; i++) {
      const distance = (maxRange / numZones) * (i + 1);
      const thickness = crater.depth * 0.1 * Math.exp(-distance / (maxRange * 0.3));
      
      zones.push({
        distance,
        thickness,
        particleSize: crater.diameter * 0.01 * Math.exp(-distance / (maxRange * 0.5))
      });
    }
    
    return zones;
  }

  /**
   * Calculate environmental effects
   */
  calculateEnvironmentalEffects(impactResults) {
    const { impactEnergy, crater } = impactResults;
    const energyMegatons = impactEnergy / (this.CONSTANTS.TNT_ENERGY * 1e6);
    
    return {
      dustCloudRadius: Math.pow(energyMegatons, 0.5) * 10000, // meters
      dustCloudHeight: Math.pow(energyMegatons, 0.4) * 5000, // meters
      climateEffects: {
        temperatureChange: -Math.log10(energyMegatons) * 0.5, // °C
        durationMonths: Math.pow(energyMegatons, 0.2) * 6
      },
      ozoneDepletion: Math.min(50, energyMegatons * 0.1), // percentage
      radiationExposure: energyMegatons * 0.01 // rem
    };
  }

  /**
   * Classify impact severity
   */
  classifyImpact(energy) {
    const energyMegatons = energy / (this.CONSTANTS.TNT_ENERGY * 1e6);
    
    if (energyMegatons < 0.001) return { level: 'Minimal', color: '#90EE90' };
    if (energyMegatons < 0.1) return { level: 'Local', color: '#FFD700' };
    if (energyMegatons < 10) return { level: 'Regional', color: '#FFA500' };
    if (energyMegatons < 1000) return { level: 'Continental', color: '#FF4500' };
    if (energyMegatons < 100000) return { level: 'Global', color: '#FF0000' };
    return { level: 'Extinction', color: '#8B0000' };
  }

  /**
   * Calculate airburst effects for objects that don't reach the ground
   */
  calculateAirburstEffects(entryResults) {
    const { trajectory, airburstAltitude } = entryResults;
    
    // Find the point of maximum energy deposition (where most energy is released)
    let maxEnergyPoint = null;
    let maxEnergyDeposition = 0;
    
    for (let i = 0; i < trajectory.length; i++) {
      const point = trajectory[i];
      // Energy deposition rate is proportional to mass * velocity^3 * atmospheric density
      const altitude = point.altitude;
      const atmosphereDensity = 1.225 * Math.exp(-altitude / this.CONSTANTS.ATMOSPHERE_SCALE_HEIGHT);
      const energyDeposition = point.mass * Math.pow(point.velocity * 1000, 3) * atmosphereDensity;
      
      if (energyDeposition > maxEnergyDeposition) {
        maxEnergyDeposition = energyDeposition;
        maxEnergyPoint = point;
      }
    }
    
    // Use the kinetic energy at the point of maximum energy deposition
    // This represents the energy available for the airburst explosion
    const airburstEnergy = maxEnergyPoint ? 
      0.5 * maxEnergyPoint.mass * Math.pow(maxEnergyPoint.velocity * 1000, 2) : 
      0;
    
    return {
      type: 'airburst',
      airburstAltitude,
      airburstEnergy,
      impactEnergy: airburstEnergy, // Add for consistency
      blastRadius: Math.pow(airburstEnergy / 1e12, 0.33) * 1000, // meters
      thermalRadius: Math.pow(airburstEnergy / 1e12, 0.4) * 800, // meters
      tntEquivalent: airburstEnergy / this.CONSTANTS.TNT_ENERGY / 1e6 // Megatons
    };
  }
}

export default AdvancedPhysicsEngine;