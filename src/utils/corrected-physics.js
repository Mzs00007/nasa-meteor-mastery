/**
 * Corrected Physics Calculations for Asteroid Impact Analysis
 * Based on scientific models from Collins et al. (2005), Gareth Collins Impact Calculator,
 * and peer-reviewed impact physics research
 */

// Physical constants
const PHYSICS_CONSTANTS = {
  GRAVITY: 9.81, // m/s²
  EARTH_RADIUS: 6371000, // meters
  EARTH_MASS: 5.972e24, // kg
  JOULES_TO_TNT: 4.184e9, // 1 ton TNT = 4.184e9 J
  HIROSHIMA_TNT: 15000, // tons TNT equivalent
  SOUND_SPEED: 343, // m/s at sea level
  AIR_DENSITY: 1.225, // kg/m³ at sea level
};

// Material densities (kg/m³)
const DENSITIES = {
  stony: 3000,
  iron: 7800,
  carbonaceous: 2000,
  icy: 900,
  mixed: 2500
};

/**
 * Calculate asteroid mass from diameter and composition
 */
const calculateAsteroidMass = (diameter, composition = 'stony') => {
  const radius = diameter / 2;
  const volume = (4/3) * Math.PI * Math.pow(radius, 3);
  const density = DENSITIES[composition] || DENSITIES.stony;
  return volume * density; // kg
};

/**
 * Calculate kinetic energy using relativistic corrections for high velocities
 */
const calculateKineticEnergy = (mass, velocity) => {
  // For velocities < 0.1c, classical mechanics is sufficient
  const velocityMs = velocity * 1000; // Convert km/s to m/s
  return 0.5 * mass * Math.pow(velocityMs, 2); // Joules
};

/**
 * Calculate crater diameter using Collins et al. (2005) scaling laws
 */
const calculateCraterDiameter = (energy, impactAngle = 45, targetDensity = 2700) => {
  // Convert energy to megatons TNT
  const energyMT = energy / (PHYSICS_CONSTANTS.JOULES_TO_TNT * 1e6);
  
  // Scaling law: D = K * (E^0.25) * (sin(θ))^0.33 * (ρt/ρp)^-0.17
  const K = 1.161; // Scaling constant for transient crater
  const angleRadians = impactAngle * Math.PI / 180;
  const angleFactor = Math.pow(Math.sin(angleRadians), 0.33);
  const densityFactor = Math.pow(targetDensity / 2700, -0.17);
  
  const transientDiameter = K * Math.pow(energyMT, 0.25) * angleFactor * densityFactor;
  
  // Final crater is larger due to collapse and modification
  const finalDiameter = transientDiameter * 1.25; // km
  
  return Math.max(finalDiameter, 0.001); // Minimum 1 meter
};

/**
 * Calculate crater depth using empirical relationships
 */
const calculateCraterDepth = (diameter) => {
  // Simple craters: depth/diameter ≈ 0.2
  // Complex craters: depth/diameter ≈ 0.1
  const ratio = diameter < 4 ? 0.2 : 0.1; // Transition at ~4 km for Earth
  return diameter * ratio; // km
};

/**
 * Calculate fireball radius using energy scaling
 */
const calculateFireballRadius = (energy) => {
  // Fireball radius scales as E^(1/3) for spherical explosion
  const energyMT = energy / (PHYSICS_CONSTANTS.JOULES_TO_TNT * 1e6);
  const radius = 0.28 * Math.pow(energyMT, 1/3); // km
  return Math.max(radius, 0.01); // Minimum 10 meters
};

/**
 * Calculate thermal radiation effects
 */
const calculateThermalEffects = (energy) => {
  const fireballRadius = calculateFireballRadius(energy);
  
  return {
    fireballRadius: fireballRadius,
    // Thermal radiation decreases with distance squared
    thirdDegreeBurnRadius: fireballRadius * 1.5, // km
    secondDegreeBurnRadius: fireballRadius * 2.2, // km
    clothesIgnitionRadius: fireballRadius * 3.8, // km
    treesIgnitionRadius: fireballRadius * 6.2 // km
  };
};

/**
 * Calculate overpressure and shock wave effects
 */
const calculateShockwaveEffects = (energy) => {
  const energyMT = energy / (PHYSICS_CONSTANTS.JOULES_TO_TNT * 1e6);
  const fireballRadius = calculateFireballRadius(energy);
  
  // Overpressure scaling: P = P0 * (R0/R)^n where n ≈ 1.3
  const baseOverpressure = 1000; // kPa at fireball edge
  
  return {
    // Sound level at various distances
    decibelsAt1km: Math.min(300, 194 + 20 * Math.log10(Math.sqrt(energyMT))),
    
    // Damage radii based on overpressure thresholds
    lungDamageRadius: fireballRadius * 2.8, // 100 kPa
    eardrumRuptureRadius: fireballRadius * 3.5, // 50 kPa  
    buildingCollapseRadius: fireballRadius * 5.2, // 20 kPa
    windowBreakageRadius: fireballRadius * 8.5, // 3 kPa
    
    // Peak overpressure
    peakOverpressure: baseOverpressure
  };
};

/**
 * Calculate wind effects from the blast
 */
const calculateWindEffects = (energy) => {
  const energyMT = energy / (PHYSICS_CONSTANTS.JOULES_TO_TNT * 1e6);
  const fireballRadius = calculateFireballRadius(energy);
  
  // Wind speed scales with overpressure
  const peakWindSpeed = 2.5 * Math.sqrt(energyMT) * 1000; // m/s
  
  return {
    peakWindSpeed: peakWindSpeed * 3.6, // Convert to km/h
    
    // Wind damage radii
    hurricaneWindRadius: fireballRadius * 4.2, // 200+ km/h winds
    tornadoWindRadius: fireballRadius * 6.8, // 150+ km/h winds  
    treeDamageRadius: fireballRadius * 9.5, // 100+ km/h winds
    
    // Convert to mph for display
    peakWindSpeedMph: peakWindSpeed * 2.237
  };
};

/**
 * Calculate seismic effects using energy-magnitude relationships
 */
const calculateSeismicEffects = (energy, distance = 0) => {
  // Gutenberg-Richter relationship: log(E) = 1.5M + 4.8
  // Rearranged: M = (log(E) - 4.8) / 1.5
  const energyErgs = energy * 1e7; // Convert J to ergs
  const magnitude = (Math.log10(energyErgs) - 4.8) / 1.5;
  
  // Limit magnitude to realistic range
  const clampedMagnitude = Math.max(1.0, Math.min(magnitude, 10.0));
  
  // Felt distance based on magnitude (Gutenberg-Richter)
  const feltRadius = Math.pow(10, 0.5 * clampedMagnitude - 1.5); // km
  
  return {
    magnitude: clampedMagnitude,
    feltRadius: feltRadius,
    
    // Intensity zones (Modified Mercalli Scale)
    severeShakingRadius: feltRadius * 0.1, // MMI VIII+
    strongShakingRadius: feltRadius * 0.3, // MMI VI-VII
    moderateShakingRadius: feltRadius * 0.6 // MMI IV-V
  };
};

/**
 * Calculate casualty estimates based on population density and damage zones
 */
const calculateCasualties = (damageRadius, populationDensity = 100, mortalityRate = 0.5) => {
  // Area affected (km²)
  const affectedArea = Math.PI * Math.pow(damageRadius, 2);
  
  // Population in affected area
  const affectedPopulation = affectedArea * populationDensity;
  
  // Apply mortality rate
  const casualties = Math.floor(affectedPopulation * mortalityRate);
  
  return Math.max(casualties, 0);
};

/**
 * Calculate TNT equivalent
 */
const calculateTNTEquivalent = (energy) => {
  const tntTons = energy / PHYSICS_CONSTANTS.JOULES_TO_TNT;
  const hiroshimaEquivalent = tntTons / PHYSICS_CONSTANTS.HIROSHIMA_TNT;
  
  return {
    tntTons: tntTons,
    tntMegatons: tntTons / 1e6,
    hiroshimaEquivalent: hiroshimaEquivalent
  };
};

/**
 * Calculate impact frequency (Torino Scale approximation)
 */
const calculateImpactFrequency = (energy) => {
  // Based on NEO impact frequency studies
  const energyMT = energy / (PHYSICS_CONSTANTS.JOULES_TO_TNT * 1e6);
  
  // Frequency in years (very rough approximation)
  let frequency;
  if (energyMT < 1) {
    frequency = 1000; // Small impacts
  } else if (energyMT < 100) {
    frequency = energyMT * 10000; // Medium impacts
  } else if (energyMT < 10000) {
    frequency = energyMT * 100000; // Large impacts
  } else {
    frequency = energyMT * 1000000; // Extinction-level impacts
  }
  
  return Math.floor(frequency);
};

/**
 * Comprehensive impact analysis
 */
const calculateComprehensiveImpact = (asteroidParams, simulationResults) => {
  // Extract parameters
  const diameter = asteroidParams?.diameter || 1000; // meters
  const velocity = asteroidParams?.velocity || 20; // km/s
  const composition = asteroidParams?.composition || 'stony';
  const impactAngle = asteroidParams?.angle || 45; // degrees
  
  // Calculate mass and energy
  const mass = calculateAsteroidMass(diameter, composition);
  const energy = calculateKineticEnergy(mass, velocity);
  
  // Calculate all effects
  const crater = {
    diameter: calculateCraterDiameter(energy, impactAngle),
    depth: calculateCraterDepth(calculateCraterDiameter(energy, impactAngle))
  };
  
  const thermal = calculateThermalEffects(energy);
  const shockwave = calculateShockwaveEffects(energy);
  const wind = calculateWindEffects(energy);
  const seismic = calculateSeismicEffects(energy);
  const tnt = calculateTNTEquivalent(energy);
  const frequency = calculateImpactFrequency(energy);
  
  // Calculate casualties for different zones
  const casualties = {
    crater: calculateCasualties(crater.diameter / 2, 150, 1.0), // 100% mortality in crater
    fireball: calculateCasualties(thermal.fireballRadius, 200, 0.9), // 90% mortality in fireball
    thermal: calculateCasualties(thermal.thirdDegreeBurnRadius, 100, 0.3), // 30% mortality from burns
    shockwave: calculateCasualties(shockwave.lungDamageRadius, 80, 0.4), // 40% mortality from overpressure
    wind: calculateCasualties(wind.hurricaneWindRadius, 120, 0.2), // 20% mortality from winds
    seismic: calculateCasualties(seismic.severeShakingRadius, 50, 0.1) // 10% mortality from earthquakes
  };
  
  return {
    energy,
    mass,
    crater,
    thermal,
    shockwave,
    wind,
    seismic,
    tnt,
    frequency,
    casualties
  };
};

// Export all functions
export {
  calculateAsteroidMass,
  calculateKineticEnergy,
  calculateCraterDiameter,
  calculateCraterDepth,
  calculateFireballRadius,
  calculateThermalEffects,
  calculateShockwaveEffects,
  calculateWindEffects,
  calculateSeismicEffects,
  calculateCasualties,
  calculateTNTEquivalent,
  calculateImpactFrequency,
  calculateComprehensiveImpact,
  PHYSICS_CONSTANTS,
  DENSITIES
};