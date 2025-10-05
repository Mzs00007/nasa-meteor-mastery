import React, { forwardRef, useImperativeHandle, useRef } from 'react';

// Enhanced Physical Constants
const PHYSICS_CONSTANTS = {
  // Universal Constants
  GRAVITY: 9.81, // m/s²
  EARTH_RADIUS: 6.371e6, // meters
  EARTH_MASS: 5.972e24, // kg
  GRAVITATIONAL_CONSTANT: 6.674e-11, // m³/kg⋅s²
  
  // Atmospheric Properties
  AIR_DENSITY_SEA_LEVEL: 1.225, // kg/m³
  SCALE_HEIGHT: 8400, // meters
  ATMOSPHERIC_PRESSURE_SEA_LEVEL: 101325, // Pa
  
  // Impact Physics
  SPEED_OF_SOUND: 343, // m/s at sea level
  SPECIFIC_HEAT_RATIO: 1.4, // for air
  
  // Energy Conversion
  TNT_ENERGY_DENSITY: 4.6e6, // J/kg
  JOULES_TO_MEGATONS: 4.184e15, // J/Mt
  
  // Crater Formation
  CRATER_SCALING_CONSTANT: 1.8,
  CRATER_DEPTH_RATIO: 0.2, // depth/diameter ratio
  
  // Seismic Constants
  SEISMIC_VELOCITY: 6000, // m/s (P-wave velocity in crust)
  
  // Population Density (global average)
  GLOBAL_POPULATION_DENSITY: 57, // people/km²
};

// Material Properties Database
const MATERIAL_PROPERTIES = {
  stone: {
    density: 3000, // kg/m³
    strength: 1e8, // Pa
    porosity: 0.1,
    fragmentationThreshold: 5e6, // Pa
    dragCoefficient: 0.47,
    heatCapacity: 1000, // J/kg⋅K
    thermalConductivity: 2.5, // W/m⋅K
    meltingPoint: 1473, // K
    vaporization: 3273, // K
  },
  iron: {
    density: 7800, // kg/m³
    strength: 2e8, // Pa
    porosity: 0.05,
    fragmentationThreshold: 1e7, // Pa
    dragCoefficient: 0.47,
    heatCapacity: 450, // J/kg⋅K
    thermalConductivity: 80, // W/m⋅K
    meltingPoint: 1811, // K
    vaporization: 3134, // K
  },
  'stony-iron': {
    density: 5400, // kg/m³
    strength: 1.5e8, // Pa
    porosity: 0.08,
    fragmentationThreshold: 7.5e6, // Pa
    dragCoefficient: 0.47,
    heatCapacity: 725, // J/kg⋅K
    thermalConductivity: 40, // W/m⋅K
    meltingPoint: 1642, // K
    vaporization: 3203, // K
  },
  carbonaceous: {
    density: 2200, // kg/m³
    strength: 5e7, // Pa
    porosity: 0.2,
    fragmentationThreshold: 2e6, // Pa
    dragCoefficient: 0.6,
    heatCapacity: 1200, // J/kg⋅K
    thermalConductivity: 1.5, // W/m⋅K
    meltingPoint: 1273, // K
    vaporization: 2773, // K
  },
};

const EnhancedPhysicsEngine = forwardRef((props, ref) => {
  const { meteorParams, onResultsUpdate, realTimeData = true } = props;
  const calculationCache = useRef(new Map());

  // Advanced atmospheric density calculation
  const calculateAtmosphericDensity = (altitude) => {
    if (altitude < 0) return PHYSICS_CONSTANTS.AIR_DENSITY_SEA_LEVEL;
    
    // Exponential atmosphere model with temperature variation
    const temperature = 288.15 - 0.0065 * Math.min(altitude, 11000); // K
    const pressure = PHYSICS_CONSTANTS.ATMOSPHERIC_PRESSURE_SEA_LEVEL * 
      Math.pow(temperature / 288.15, 5.256);
    
    return pressure / (287 * temperature); // Ideal gas law
  };

  // Enhanced drag force calculation with Mach number effects
  const calculateDragForce = (velocity, altitude, diameter, material) => {
    const density = calculateAtmosphericDensity(altitude);
    const area = Math.PI * Math.pow(diameter / 2, 2);
    const materialProps = MATERIAL_PROPERTIES[material] || MATERIAL_PROPERTIES.stone;
    
    // Mach number calculation
    const soundSpeed = Math.sqrt(PHYSICS_CONSTANTS.SPECIFIC_HEAT_RATIO * 287 * 
      (288.15 - 0.0065 * Math.min(altitude, 11000)));
    const machNumber = velocity / soundSpeed;
    
    // Drag coefficient varies with Mach number
    let dragCoeff = materialProps.dragCoefficient;
    if (machNumber > 1) {
      dragCoeff *= (1 + 0.2 * Math.pow(machNumber - 1, 0.5)); // Supersonic drag increase
    }
    
    return 0.5 * density * velocity * velocity * area * dragCoeff;
  };

  // Advanced atmospheric entry simulation
  const simulateAtmosphericEntry = (params, progressCallback) => {
    const {
      diameter,
      velocity: initialVelocity,
      angle,
      density: meteorDensity,
      composition,
      altitude: initialAltitude
    } = params;
    
    const material = MATERIAL_PROPERTIES[composition] || MATERIAL_PROPERTIES.stone;
    const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * meteorDensity;
    
    // Simulation parameters
    const dt = 0.01; // time step in seconds
    let altitude = initialAltitude;
    let velocity = initialVelocity;
    let currentMass = mass;
    let temperature = 250; // Initial temperature in K
    let time = 0;
    
    const trajectory = [];
    let fragmentationOccurred = false;
    let ablationRate = 0;
    
    while (altitude > 0 && velocity > 0) {
      // Calculate forces
      const dragForce = calculateDragForce(velocity, altitude, diameter, composition);
      const gravityForce = currentMass * PHYSICS_CONSTANTS.GRAVITY;
      
      // Net acceleration
      const acceleration = -(dragForce / currentMass) + 
        (gravityForce / currentMass) * Math.sin(Math.radians(angle));
      
      // Heating calculation
      const dynamicPressure = 0.5 * calculateAtmosphericDensity(altitude) * velocity * velocity;
      const heatingRate = 1e-8 * Math.pow(velocity, 3) * Math.sqrt(calculateAtmosphericDensity(altitude));
      temperature += heatingRate * dt / (currentMass * material.heatCapacity);
      
      // Ablation (mass loss due to heating)
      if (temperature > material.meltingPoint) {
        ablationRate = 1e-6 * Math.pow(velocity, 2) * calculateAtmosphericDensity(altitude);
        currentMass = Math.max(currentMass - ablationRate * dt, mass * 0.1); // Minimum 10% survives
      }
      
      // Fragmentation check
      if (dynamicPressure > material.fragmentationThreshold && !fragmentationOccurred) {
        fragmentationOccurred = true;
        // Fragmentation reduces effective diameter but increases drag
        diameter *= 0.7;
        currentMass *= 0.8;
      }
      
      // Update kinematics
      velocity += acceleration * dt;
      altitude -= velocity * Math.sin(Math.radians(angle)) * dt;
      time += dt;
      
      // Store trajectory point
      trajectory.push({
        time,
        altitude,
        velocity,
        mass: currentMass,
        temperature,
        dynamicPressure
      });
      
      // Progress callback
      if (progressCallback && time % 0.1 < dt) {
        const progress = Math.min((initialAltitude - altitude) / initialAltitude * 50, 50);
        progressCallback(progress, 'entry');
      }
      
      // Safety check
      if (time > 300) break; // Max 5 minutes simulation
    }
    
    return {
      finalVelocity: Math.max(velocity, 0),
      finalMass: currentMass,
      finalTemperature: temperature,
      trajectory,
      fragmentationOccurred,
      ablationMass: mass - currentMass,
      entryTime: time
    };
  };

  // Enhanced crater formation calculation
  const calculateCraterFormation = (impactVelocity, mass, angle, targetDensity = 2500) => {
    // Kinetic energy at impact
    const kineticEnergy = 0.5 * mass * impactVelocity * impactVelocity;
    
    // Effective energy (accounting for angle)
    const effectiveEnergy = kineticEnergy * Math.pow(Math.sin(Math.radians(angle)), 2/3);
    
    // Holsapple & Schmidt (1987) scaling laws
    const impactorDensity = mass / ((4/3) * Math.PI * Math.pow(meteorParams.diameter/2, 3));
    const scalingParameter = Math.pow(impactorDensity / targetDensity, 1/3);
    
    // Crater diameter (complex crater formation)
    const diameter = 2 * Math.pow(
      effectiveEnergy / (targetDensity * Math.pow(PHYSICS_CONSTANTS.GRAVITY, 2)),
      1/3
    ) * scalingParameter;
    
    // Crater depth
    const depth = diameter * PHYSICS_CONSTANTS.CRATER_DEPTH_RATIO;
    
    // Crater volume
    const volume = (Math.PI / 12) * diameter * diameter * depth;
    
    // Ejecta calculations
    const ejectaVolume = volume * 2; // Typically 2x crater volume
    const ejectaMass = ejectaVolume * targetDensity;
    
    return {
      diameter,
      depth,
      volume,
      ejectaVolume,
      ejectaMass,
      rimHeight: depth * 0.1
    };
  };

  // Advanced blast effects calculation
  const calculateBlastEffects = (energy, impactVelocity) => {
    // Convert to TNT equivalent
    const tntEquivalent = energy / PHYSICS_CONSTANTS.TNT_ENERGY_DENSITY / 1e9; // Megatons
    
    // Sedov-Taylor blast wave solution
    const blastConstant = 1.033; // For spherical blast in air
    const gamma = PHYSICS_CONSTANTS.SPECIFIC_HEAT_RATIO;
    
    // Characteristic blast radius
    const characteristicRadius = Math.pow(
      (blastConstant * energy) / 
      (PHYSICS_CONSTANTS.ATMOSPHERIC_PRESSURE_SEA_LEVEL * 
       Math.pow(gamma + 1, 2) / (2 * gamma)),
      1/3
    );
    
    // Damage radii for different overpressures
    const blastRadius = {
      lethal: characteristicRadius * Math.pow(20 / 1, 1/3), // 20 psi overpressure
      severe: characteristicRadius * Math.pow(5 / 1, 1/3),  // 5 psi overpressure
      moderate: characteristicRadius * Math.pow(2 / 1, 1/3), // 2 psi overpressure
      light: characteristicRadius * Math.pow(0.5 / 1, 1/3)   // 0.5 psi overpressure
    };
    
    // Thermal effects
    const thermalRadius = Math.pow(tntEquivalent * 1e6, 0.4) * 1000; // meters
    
    // Seismic effects
    const seismicMagnitude = Math.log10(energy / 1e9) / 1.5 - 3.2; // Richter scale
    
    return {
      blastRadius,
      thermalRadius,
      seismicMagnitude: Math.max(seismicMagnitude, 0),
      shockwaveSpeed: Math.sqrt(gamma * PHYSICS_CONSTANTS.ATMOSPHERIC_PRESSURE_SEA_LEVEL / 
        PHYSICS_CONSTANTS.AIR_DENSITY_SEA_LEVEL),
      overpressureAtDistance: (distance) => {
        if (distance <= 0) return Infinity;
        return PHYSICS_CONSTANTS.ATMOSPHERIC_PRESSURE_SEA_LEVEL * 
          Math.pow(characteristicRadius / distance, 3);
      }
    };
  };

  // Environmental effects calculation
  const calculateEnvironmentalEffects = (energy, craterData, impactLocation) => {
    const tntEquivalent = energy / PHYSICS_CONSTANTS.TNT_ENERGY_DENSITY / 1e9; // Megatons
    
    // Dust cloud formation
    const dustCloudRadius = Math.pow(tntEquivalent, 0.33) * 50000; // meters
    const dustCloudDuration = Math.pow(tntEquivalent, 0.25) * 24; // hours
    
    // Climate impact (for large impacts)
    let climateImpact = { temperature: 0, duration: 0 };
    if (tntEquivalent > 1000) { // Significant climate effects for >1000 Mt
      climateImpact = {
        temperature: -Math.log10(tntEquivalent) * 2, // °C cooling
        duration: Math.pow(tntEquivalent / 1000, 0.5) * 365 // days
      };
    }
    
    // Ozone depletion (for very large impacts)
    const ozoneDepletion = tntEquivalent > 10000 ? 
      Math.min(Math.log10(tntEquivalent / 10000) * 10, 50) : 0; // % depletion
    
    // Tsunami risk assessment
    const tsunamiRisk = impactLocation && 
      (Math.abs(impactLocation.latitude) < 60) && // Not polar
      (tntEquivalent > 100); // Significant energy
    
    return {
      dustCloud: {
        radius: dustCloudRadius,
        duration: dustCloudDuration
      },
      climateImpact,
      ozoneDepletion,
      tsunamiRisk,
      globalEffects: tntEquivalent > 1000000 // Mass extinction threshold
    };
  };

  // Casualty estimation with population density
  const calculateCasualties = (blastEffects, impactLocation, populationDensity = null) => {
    // Use provided density or estimate based on location
    const density = populationDensity || estimatePopulationDensity(impactLocation);
    
    // Calculate affected populations in each damage zone
    const casualties = {
      immediate: 0,
      shortTerm: 0,
      longTerm: 0,
      total: 0
    };
    
    // Lethal zone (90% fatality rate)
    const lethalArea = Math.PI * Math.pow(blastEffects.blastRadius.lethal / 1000, 2); // km²
    casualties.immediate += lethalArea * density * 0.9;
    
    // Severe damage zone (50% fatality rate, 30% injured)
    const severeArea = Math.PI * Math.pow(blastEffects.blastRadius.severe / 1000, 2) - lethalArea;
    casualties.immediate += severeArea * density * 0.5;
    casualties.shortTerm += severeArea * density * 0.3;
    
    // Moderate damage zone (10% fatality rate, 60% injured)
    const moderateArea = Math.PI * Math.pow(blastEffects.blastRadius.moderate / 1000, 2) - 
      Math.PI * Math.pow(blastEffects.blastRadius.severe / 1000, 2);
    casualties.immediate += moderateArea * density * 0.1;
    casualties.shortTerm += moderateArea * density * 0.6;
    
    // Light damage zone (1% fatality rate, 20% injured)
    const lightArea = Math.PI * Math.pow(blastEffects.blastRadius.light / 1000, 2) - 
      Math.PI * Math.pow(blastEffects.blastRadius.moderate / 1000, 2);
    casualties.immediate += lightArea * density * 0.01;
    casualties.longTerm += lightArea * density * 0.2;
    
    casualties.total = casualties.immediate + casualties.shortTerm + casualties.longTerm;
    
    return casualties;
  };

  // Population density estimation
  const estimatePopulationDensity = (location) => {
    if (!location) return PHYSICS_CONSTANTS.GLOBAL_POPULATION_DENSITY;
    
    const { latitude, longitude } = location;
    
    // Simple model based on latitude and known population centers
    let density = PHYSICS_CONSTANTS.GLOBAL_POPULATION_DENSITY;
    
    // Higher density in temperate zones
    if (Math.abs(latitude) < 60) {
      density *= 2;
    }
    
    // Lower density in polar regions
    if (Math.abs(latitude) > 70) {
      density *= 0.1;
    }
    
    // Ocean impacts (very low population)
    // This would need actual land/ocean detection
    // For now, assume 20% chance of ocean impact
    if (Math.random() < 0.2) {
      density *= 0.01;
    }
    
    return density;
  };

  // Economic damage estimation
  const calculateEconomicDamage = (casualties, blastEffects, impactLocation) => {
    // GDP per capita estimates (simplified)
    const gdpPerCapita = 15000; // USD, global average
    const infrastructureValue = 50000; // USD per person in affected area
    
    // Direct damage (infrastructure destruction)
    const totalAffectedArea = Math.PI * Math.pow(blastEffects.blastRadius.light / 1000, 2); // km²
    const populationDensity = estimatePopulationDensity(impactLocation);
    const affectedPopulation = totalAffectedArea * populationDensity;
    
    const directDamage = affectedPopulation * infrastructureValue;
    
    // Indirect damage (economic disruption)
    const indirectMultiplier = Math.min(casualties.total / 1000000, 10); // Max 10x multiplier
    const indirectDamage = directDamage * indirectMultiplier;
    
    return {
      direct: directDamage,
      indirect: indirectDamage,
      total: directDamage + indirectDamage
    };
  };

  // Main enhanced impact calculation
  const calculateEnhancedImpact = async (params, progressCallback) => {
    try {
      // Cache key for memoization
      const cacheKey = JSON.stringify(params);
      if (calculationCache.current.has(cacheKey)) {
        return calculationCache.current.get(cacheKey);
      }

      if (progressCallback) progressCallback(0, 'setup');

      // Phase 1: Atmospheric Entry Simulation
      const entryResults = simulateAtmosphericEntry(params, progressCallback);
      
      if (progressCallback) progressCallback(50, 'impact');

      // Phase 2: Impact Calculations
      const impactVelocity = entryResults.finalVelocity;
      const impactMass = entryResults.finalMass;
      const kineticEnergy = 0.5 * impactMass * impactVelocity * impactVelocity;

      // Phase 3: Crater Formation
      const craterData = calculateCraterFormation(
        impactVelocity, 
        impactMass, 
        params.angle
      );

      if (progressCallback) progressCallback(70, 'explosion');

      // Phase 4: Blast Effects
      const blastEffects = calculateBlastEffects(kineticEnergy, impactVelocity);

      // Phase 5: Environmental Effects
      const environmentalEffects = calculateEnvironmentalEffects(
        kineticEnergy, 
        craterData, 
        { latitude: params.latitude, longitude: params.longitude }
      );

      if (progressCallback) progressCallback(85, 'analysis');

      // Phase 6: Casualty and Economic Analysis
      const casualties = calculateCasualties(
        blastEffects, 
        { latitude: params.latitude, longitude: params.longitude }
      );

      const economicDamage = calculateEconomicDamage(
        casualties, 
        blastEffects, 
        { latitude: params.latitude, longitude: params.longitude }
      );

      if (progressCallback) progressCallback(100, 'complete');

      // Compile comprehensive results
      const results = {
        // Basic Impact Data
        energy: kineticEnergy,
        tntEquivalent: kineticEnergy / PHYSICS_CONSTANTS.TNT_ENERGY_DENSITY / 1e9, // Megatons
        craterDiameter: craterData.diameter,
        craterDepth: craterData.depth,
        blastRadius: blastEffects.blastRadius,
        
        // Advanced Physics
        seismicMagnitude: blastEffects.seismicMagnitude,
        shockwaveSpeed: blastEffects.shockwaveSpeed,
        temperature: entryResults.finalTemperature,
        pressure: blastEffects.overpressureAtDistance(1000), // Pressure at 1km
        
        // Environmental Effects
        atmosphericEffects: environmentalEffects,
        
        // Casualties and Damage
        casualties,
        economicDamage,
        
        // Debris and Secondary Effects
        debrisField: entryResults.trajectory,
        secondaryImpacts: [],
        tsunamiRisk: environmentalEffects.tsunamiRisk,
        
        // Entry Data
        entryResults,
        
        // Data Analysis
        confidence: 0.85 + (realTimeData ? 0.1 : 0), // Higher confidence with real-time data
        uncertaintyRange: {
          min: kineticEnergy * 0.7,
          max: kineticEnergy * 1.3
        },
        historicalComparison: getHistoricalComparison(kineticEnergy)
      };

      // Cache results
      calculationCache.current.set(cacheKey, results);

      return results;

    } catch (error) {
      console.error('Enhanced physics calculation error:', error);
      throw error;
    }
  };

  // Historical comparison function
  const getHistoricalComparison = (energy) => {
    const tntEquivalent = energy / PHYSICS_CONSTANTS.TNT_ENERGY_DENSITY / 1e9; // Megatons
    
    const historicalEvents = [
      { name: 'Hiroshima', energy: 0.015, year: 1945 },
      { name: 'Tunguska', energy: 15, year: 1908 },
      { name: 'Chelyabinsk', energy: 0.5, year: 2013 },
      { name: 'Chicxulub (estimated)', energy: 100000000, year: -66000000 },
      { name: 'Barringer Crater', energy: 10, year: -50000 }
    ];
    
    // Find closest historical event
    let closest = historicalEvents[0];
    let minDiff = Math.abs(Math.log10(tntEquivalent) - Math.log10(closest.energy));
    
    for (const event of historicalEvents) {
      const diff = Math.abs(Math.log10(tntEquivalent) - Math.log10(event.energy));
      if (diff < minDiff) {
        minDiff = diff;
        closest = event;
      }
    }
    
    return {
      event: closest,
      ratio: tntEquivalent / closest.energy,
      comparison: tntEquivalent > closest.energy ? 'larger' : 'smaller'
    };
  };

  // Utility function to convert degrees to radians
  Math.radians = (degrees) => degrees * (Math.PI / 180);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    calculateEnhancedImpact,
    calculateAtmosphericDensity,
    calculateDragForce,
    simulateAtmosphericEntry,
    calculateCraterFormation,
    calculateBlastEffects,
    calculateEnvironmentalEffects,
    calculateCasualties,
    calculateEconomicDamage,
    clearCache: () => calculationCache.current.clear()
  }));

  // Update results when parameters change
  React.useEffect(() => {
    if (onResultsUpdate && meteorParams) {
      // Debounce calculations
      const timeoutId = setTimeout(() => {
        calculateEnhancedImpact(meteorParams)
          .then(results => onResultsUpdate(results))
          .catch(error => console.error('Physics update error:', error));
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [meteorParams, onResultsUpdate]);

  // This component doesn't render anything visible
  return null;
});

EnhancedPhysicsEngine.displayName = 'EnhancedPhysicsEngine';

export default EnhancedPhysicsEngine;