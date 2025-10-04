import * as THREE from 'three';

export class PhysicsEngine {
  constructor() {
    // Physical constants
    this.EARTH_RADIUS = 6.371e6; // meters
    this.EARTH_MASS = 5.972e24; // kg
    this.GRAVITATIONAL_CONSTANT = 6.674e-11; // m³/kg⋅s²
    this.ATMOSPHERE_HEIGHT = 100000; // meters (100 km)
    this.AIR_DENSITY_SEA_LEVEL = 1.225; // kg/m³
    this.SCALE_FACTOR = 1e-6; // Scale for visualization
    
    // Atmospheric layers for realistic entry simulation
    this.atmosphericLayers = [
      { altitude: 0, density: 1.225, temperature: 288.15 },      // Sea level
      { altitude: 11000, density: 0.364, temperature: 216.65 },  // Tropopause
      { altitude: 20000, density: 0.088, temperature: 216.65 },  // Stratosphere
      { altitude: 32000, density: 0.014, temperature: 228.65 },  // Stratosphere
      { altitude: 47000, density: 0.002, temperature: 270.65 },  // Stratopause
      { altitude: 51000, density: 0.001, temperature: 270.65 },  // Mesosphere
      { altitude: 71000, density: 0.0001, temperature: 214.65 }, // Mesosphere
      { altitude: 85000, density: 0.00001, temperature: 186.87 }, // Mesopause
      { altitude: 100000, density: 0.000001, temperature: 195.08 } // Thermosphere
    ];
  }

  // Calculate asteroid mass from diameter and composition
  calculateMass(diameter, composition) {
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    
    let density;
    switch (composition) {
      case 'metallic':
        density = 7800; // kg/m³ (iron-nickel)
        break;
      case 'icy':
        density = 917; // kg/m³ (water ice)
        break;
      default: // rocky
        density = 2600; // kg/m³ (silicate rock)
    }
    
    return volume * density;
  }

  // Calculate trajectory points for visualization
  calculateTrajectory(startPosition, velocity, angle, targetLocation) {
    const points = [];
    const angleRad = (angle * Math.PI) / 180;
    
    // Convert to scaled coordinates
    const start = new THREE.Vector3(
      startPosition.x,
      startPosition.y,
      startPosition.z
    );
    
    // Calculate initial velocity components
    const vx = velocity * Math.cos(angleRad) * this.SCALE_FACTOR;
    const vy = -velocity * Math.sin(angleRad) * this.SCALE_FACTOR; // Negative for downward
    const vz = 0;
    
    // Simulate trajectory with gravity
    const timeStep = 0.1; // seconds
    const maxTime = 1000; // seconds
    
    let currentPos = start.clone();
    let currentVel = new THREE.Vector3(vx, vy, vz);
    
    for (let t = 0; t < maxTime; t += timeStep) {
      points.push(currentPos.clone());
      
      // Calculate gravitational acceleration
      const distanceToCenter = currentPos.length();
      const scaledEarthRadius = this.EARTH_RADIUS * this.SCALE_FACTOR;
      
      if (distanceToCenter <= scaledEarthRadius) {
        break; // Impact occurred
      }
      
      // Gravitational force (simplified for visualization)
      const gravityMagnitude = (this.GRAVITATIONAL_CONSTANT * this.EARTH_MASS) / 
                              Math.pow(distanceToCenter / this.SCALE_FACTOR, 2);
      const gravityDirection = currentPos.clone().normalize().multiplyScalar(-1);
      const gravityAccel = gravityDirection.multiplyScalar(gravityMagnitude * this.SCALE_FACTOR);
      
      // Update velocity and position
      currentVel.add(gravityAccel.multiplyScalar(timeStep));
      currentPos.add(currentVel.clone().multiplyScalar(timeStep));
    }
    
    return points;
  }

  // Update asteroid position during simulation
  updateAsteroidPosition(currentPosition, velocity, deltaTime) {
    const position = currentPosition.clone();
    
    // Calculate gravitational acceleration
    const distanceToCenter = position.length();
    const scaledEarthRadius = this.EARTH_RADIUS * this.SCALE_FACTOR;
    
    if (distanceToCenter <= scaledEarthRadius) {
      return position; // Impact occurred
    }
    
    // Simplified gravity calculation for real-time simulation
    const gravityMagnitude = (this.GRAVITATIONAL_CONSTANT * this.EARTH_MASS) / 
                            Math.pow(distanceToCenter / this.SCALE_FACTOR, 2);
    const gravityDirection = position.clone().normalize().multiplyScalar(-1);
    const gravityAccel = gravityDirection.multiplyScalar(gravityMagnitude * this.SCALE_FACTOR);
    
    // Update position with gravity
    const velocityVector = new THREE.Vector3(0, 0, -velocity * this.SCALE_FACTOR);
    velocityVector.add(gravityAccel.multiplyScalar(deltaTime));
    position.add(velocityVector.multiplyScalar(deltaTime));
    
    return position;
  }

  // Calculate impact energy in Joules
  calculateImpactEnergy(mass, velocity) {
    return 0.5 * mass * Math.pow(velocity, 2);
  }

  // Calculate impact energy in TNT equivalent
  calculateTNTEquivalent(energy) {
    const TNT_ENERGY = 4.184e9; // Joules per ton of TNT
    return energy / TNT_ENERGY;
  }

  // Calculate crater diameter using scaling laws
  calculateCraterDiameter(energy, targetDensity = 2600) {
    // Simplified crater scaling law
    const K1 = 1.8; // Scaling constant
    const energyMT = energy / 4.184e15; // Convert to megatons
    
    return K1 * Math.pow(energyMT / targetDensity, 0.25) * 1000; // meters
  }

  // Simulate atmospheric entry effects
  simulateAtmosphericEntry(asteroid) {
    const { mass, velocity, diameter, composition } = asteroid;
    const radius = diameter / 2;
    const crossSectionalArea = Math.PI * Math.pow(radius, 2);
    
    // Drag coefficient (sphere)
    const dragCoefficient = 0.47;
    
    // Entry simulation
    let currentVelocity = velocity;
    let currentMass = mass;
    let altitude = 100000; // Start at 100 km
    
    const entryData = [];
    
    while (altitude > 0 && currentVelocity > 0) {
      // Get atmospheric density at current altitude
      const density = this.getAtmosphericDensity(altitude);
      
      // Calculate drag force
      const dragForce = 0.5 * density * Math.pow(currentVelocity, 2) * 
                       crossSectionalArea * dragCoefficient;
      
      // Calculate deceleration
      const deceleration = dragForce / currentMass;
      
      // Calculate heating and ablation
      const dynamicPressure = 0.5 * density * Math.pow(currentVelocity, 2);
      const heatingRate = this.calculateHeatingRate(currentVelocity, density, radius);
      
      // Mass loss due to ablation (simplified)
      const ablationRate = this.calculateAblationRate(heatingRate, composition);
      const massLoss = ablationRate * 0.1; // Time step
      
      // Update values
      currentVelocity -= deceleration * 0.1;
      currentMass = Math.max(0, currentMass - massLoss);
      altitude -= currentVelocity * 0.1;
      
      entryData.push({
        altitude,
        velocity: currentVelocity,
        mass: currentMass,
        dynamicPressure,
        heatingRate,
        dragForce
      });
      
      // Break if asteroid is completely ablated
      if (currentMass <= 0) {
        break;
      }
    }
    
    return {
      finalVelocity: currentVelocity,
      finalMass: currentMass,
      entryData,
      survived: currentMass > 0 && altitude <= 0
    };
  }

  // Get atmospheric density at given altitude
  getAtmosphericDensity(altitude) {
    // Find appropriate atmospheric layer
    for (let i = 0; i < this.atmosphericLayers.length - 1; i++) {
      const layer = this.atmosphericLayers[i];
      const nextLayer = this.atmosphericLayers[i + 1];
      
      if (altitude >= layer.altitude && altitude < nextLayer.altitude) {
        // Linear interpolation between layers
        const factor = (altitude - layer.altitude) / (nextLayer.altitude - layer.altitude);
        return layer.density + (nextLayer.density - layer.density) * factor;
      }
    }
    
    // Above atmosphere
    if (altitude >= 100000) {
      return 0.000001; // Very thin
    }
    
    // Below sea level (shouldn't happen)
    return this.atmosphericLayers[0].density;
  }

  // Calculate heating rate during atmospheric entry
  calculateHeatingRate(velocity, density, radius) {
    // Simplified heating calculation (W/m²)
    const heatingCoefficient = 1.83e-4;
    return heatingCoefficient * density * Math.pow(velocity, 3) / Math.sqrt(radius);
  }

  // Calculate ablation rate based on heating and composition
  calculateAblationRate(heatingRate, composition) {
    let ablationCoefficient;
    
    switch (composition) {
      case 'icy':
        ablationCoefficient = 2.5e-6; // kg/s per W/m²
        break;
      case 'rocky':
        ablationCoefficient = 1.0e-6;
        break;
      case 'metallic':
        ablationCoefficient = 0.5e-6;
        break;
      default:
        ablationCoefficient = 1.0e-6;
    }
    
    return heatingRate * ablationCoefficient;
  }

  // Calculate seismic effects
  calculateSeismicEffects(energy, distance) {
    // Simplified seismic magnitude calculation
    const magnitude = (Math.log10(energy) - 4.8) / 1.5;
    
    // Calculate ground acceleration at distance
    const peakAcceleration = Math.pow(10, magnitude - 3.5) / Math.pow(distance, 1.5);
    
    return {
      magnitude: Math.max(0, magnitude),
      peakAcceleration,
      mercalliIntensity: this.magnitudeToMercalli(magnitude)
    };
  }

  // Convert magnitude to Mercalli intensity
  magnitudeToMercalli(magnitude) {
    if (magnitude < 2) return 'I';
    if (magnitude < 3) return 'II-III';
    if (magnitude < 4) return 'IV';
    if (magnitude < 5) return 'V-VI';
    if (magnitude < 6) return 'VII-VIII';
    if (magnitude < 7) return 'IX';
    if (magnitude < 8) return 'X';
    if (magnitude < 9) return 'XI';
    return 'XII';
  }

  // Calculate thermal effects
  calculateThermalEffects(energy, distance) {
    // Fireball radius (simplified)
    const fireballRadius = 440 * Math.pow(energy / 4.184e15, 0.4); // meters
    
    // Thermal radiation (simplified)
    const thermalFlux = energy / (4 * Math.PI * Math.pow(distance, 2));
    
    // Burn radius calculations
    const firstDegreeBurnRadius = fireballRadius * 2.5;
    const secondDegreeBurnRadius = fireballRadius * 2.0;
    const thirdDegreeBurnRadius = fireballRadius * 1.5;
    
    return {
      fireballRadius,
      thermalFlux,
      burnRadii: {
        first: firstDegreeBurnRadius,
        second: secondDegreeBurnRadius,
        third: thirdDegreeBurnRadius
      }
    };
  }

  // Calculate atmospheric blast effects
  calculateBlastEffects(energy, distance) {
    // Overpressure calculation (simplified)
    const scaledDistance = distance / Math.pow(energy / 4.184e15, 1/3);
    
    let overpressure;
    if (scaledDistance < 0.1) {
      overpressure = 1000; // kPa
    } else if (scaledDistance < 1) {
      overpressure = 100 / Math.pow(scaledDistance, 2);
    } else {
      overpressure = 10 / Math.pow(scaledDistance, 1.5);
    }
    
    // Damage assessment
    let damageLevel;
    if (overpressure > 100) {
      damageLevel = 'Total destruction';
    } else if (overpressure > 35) {
      damageLevel = 'Severe structural damage';
    } else if (overpressure > 10) {
      damageLevel = 'Moderate structural damage';
    } else if (overpressure > 3) {
      damageLevel = 'Light structural damage';
    } else {
      damageLevel = 'Broken windows';
    }
    
    return {
      overpressure,
      damageLevel,
      scaledDistance
    };
  }

  // Calculate ejecta distribution
  calculateEjectaDistribution(energy, craterDiameter) {
    const ejectaData = [];
    const maxRange = craterDiameter * 20; // Maximum ejecta range
    
    // Calculate ejecta for different size ranges
    const sizeRanges = [
      { min: 0.001, max: 0.01, name: 'Fine particles' },
      { min: 0.01, max: 0.1, name: 'Small fragments' },
      { min: 0.1, max: 1, name: 'Medium fragments' },
      { min: 1, max: 10, name: 'Large fragments' },
      { min: 10, max: 100, name: 'Boulders' }
    ];
    
    sizeRanges.forEach(range => {
      const velocity = Math.sqrt(2 * energy / 1e12) / range.max; // Simplified
      const range_km = (velocity * velocity * Math.sin(2 * Math.PI / 4)) / 9.81 / 1000;
      
      ejectaData.push({
        sizeRange: range.name,
        minSize: range.min,
        maxSize: range.max,
        velocity,
        range: Math.min(range_km, maxRange / 1000)
      });
    });
    
    return ejectaData;
  }

  // Calculate global climate effects for large impacts
  calculateClimateEffects(energy, craterDiameter) {
    const energyMT = energy / 4.184e15; // Megatons
    
    if (energyMT < 1000) {
      return {
        dustInjection: 'Minimal',
        temperatureChange: 0,
        duration: 0,
        globalEffects: 'None'
      };
    }
    
    // Dust injection into atmosphere
    const dustMass = craterDiameter * craterDiameter * 1000; // Simplified
    const stratosphericDust = dustMass * 0.1; // 10% reaches stratosphere
    
    // Temperature change estimation
    const temperatureChange = -Math.log10(energyMT / 1000) * 2; // Simplified
    const duration = Math.sqrt(energyMT / 1000) * 30; // Days
    
    let globalEffects;
    if (energyMT > 1e6) {
      globalEffects = 'Mass extinction event';
    } else if (energyMT > 1e5) {
      globalEffects = 'Global climate disruption';
    } else if (energyMT > 1e4) {
      globalEffects = 'Regional climate effects';
    } else {
      globalEffects = 'Local climate effects';
    }
    
    return {
      dustInjection: `${(stratosphericDust / 1e9).toFixed(2)} billion tons`,
      temperatureChange: Math.max(-10, temperatureChange),
      duration: Math.min(365, duration),
      globalEffects
    };
  }

  // Comprehensive impact analysis
  performImpactAnalysis(asteroidParams) {
    const { diameter, velocity, composition, mass } = asteroidParams;
    
    // Calculate impact energy
    const energy = this.calculateImpactEnergy(mass, velocity);
    const tntEquivalent = this.calculateTNTEquivalent(energy);
    
    // Atmospheric entry simulation
    const entryResults = this.simulateAtmosphericEntry(asteroidParams);
    
    // Crater formation
    const craterDiameter = this.calculateCraterDiameter(energy);
    
    // Various effects at different distances
    const distances = [1, 10, 100, 1000, 10000]; // km
    const effects = distances.map(distance => ({
      distance,
      seismic: this.calculateSeismicEffects(energy, distance * 1000),
      thermal: this.calculateThermalEffects(energy, distance * 1000),
      blast: this.calculateBlastEffects(energy, distance * 1000)
    }));
    
    // Ejecta distribution
    const ejectaDistribution = this.calculateEjectaDistribution(energy, craterDiameter);
    
    // Climate effects
    const climateEffects = this.calculateClimateEffects(energy, craterDiameter);
    
    return {
      energy,
      tntEquivalent,
      entryResults,
      craterDiameter,
      effects,
      ejectaDistribution,
      climateEffects,
      impactClassification: this.classifyImpact(tntEquivalent)
    };
  }

  // Classify impact based on energy
  classifyImpact(tntEquivalent) {
    if (tntEquivalent < 1) {
      return 'Negligible';
    } else if (tntEquivalent < 1000) {
      return 'Local damage';
    } else if (tntEquivalent < 1e6) {
      return 'City-killer';
    } else if (tntEquivalent < 1e9) {
      return 'Regional devastation';
    } else if (tntEquivalent < 1e12) {
      return 'Global catastrophe';
    } else {
      return 'Extinction-level event';
    }
  }
}