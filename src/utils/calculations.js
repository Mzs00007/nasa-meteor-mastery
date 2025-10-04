// Physics Calculations and Simulation Logic for Meteor Madness

class PhysicsCalculator {
  constructor() {
    this.constants = {
      G: 6.6743e-11, // Gravitational constant (m³ kg⁻¹ s⁻²)
      EARTH_RADIUS: 6371000, // meters
      EARTH_MASS: 5.972e24, // kg
      ESCAPE_VELOCITY: 11200, // m/s
      ATMOSPHERE_HEIGHT: 100000, // meters

      // Material densities (kg/m³)
      DENSITIES: {
        stony: 3000,
        iron: 7800,
        carbonaceous: 2000,
        icy: 900,
      },

      // Energy conversion
      JOULES_TO_MEGATONS: 4.184e15,
      MEGATONS_TO_HIROSHIMA: 0.015, // 1 megaton = ~67 Hiroshima bombs
    };
  }

  // Calculate asteroid mass
  calculateMass(diameter, densityType = 'stony') {
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const density =
      this.constants.DENSITIES[densityType] || this.constants.DENSITIES.stony;
    return volume * density;
  }

  // Calculate kinetic energy
  calculateKineticEnergy(mass, velocity) {
    return 0.5 * mass * Math.pow(velocity, 2);
  }

  // Convert energy to megatons of TNT
  energyToMegatons(energyJoules) {
    return energyJoules / this.constants.JOULES_TO_MEGATONS;
  }

  // Calculate crater size (empirical formula)
  calculateCraterSize(energyMegatons, impactAngle = 45) {
    // Simple empirical formula based on nuclear crater studies
    const angleFactor = Math.sin((impactAngle * Math.PI) / 180);
    const diameter = 100 * Math.pow(energyMegatons, 0.294) * angleFactor;
    const depth = diameter / 5; // Typical depth-to-diameter ratio

    return {
      diameter: diameter, // meters
      depth: depth, // meters
      volume: (Math.PI / 6) * Math.pow(diameter, 2) * depth, // m³
    };
  }

  // Calculate seismic magnitude
  calculateSeismicMagnitude(energyMegatons, depth = 0) {
    // Richter scale approximation based on energy release
    const magnitude = 0.67 * Math.log10(energyMegatons * 1e6) + 3.5;

    // Adjust for impact depth (shallow impacts create larger seismic waves)
    const depthAdjustment = depth < 1000 ? 0.5 : 0;

    return Math.min(magnitude + depthAdjustment, 10.0); // Cap at 10.0
  }

  // Calculate airburst effects
  calculateAirburstEffects(diameter, velocity, densityType, altitude) {
    const mass = this.calculateMass(diameter, densityType);
    const energy = this.calculateKineticEnergy(mass, velocity);
    const energyMegatons = this.energyToMegatons(energy);

    // Airburst overpressure and thermal radiation
    const overpressure = this.calculateOverpressure(energyMegatons, altitude);
    const thermalRadiation = this.calculateThermalRadiation(
      energyMegatons,
      altitude
    );

    return {
      energy: energy,
      energyMegatons: energyMegatons,
      overpressure: overpressure,
      thermalRadiation: thermalRadiation,
      blastRadius: this.calculateBlastRadius(energyMegatons, altitude),
    };
  }

  calculateOverpressure(energyMegatons, altitude) {
    // Simplified overpressure calculation
    const scaledDistance = altitude / Math.pow(energyMegatons, 1 / 3);
    return 1000 / (scaledDistance + 1); // kPa
  }

  calculateThermalRadiation(energyMegatons, altitude) {
    // Thermal radiation intensity
    const distance = Math.max(altitude, 1000); // meters
    return (energyMegatons * 1e6) / (4 * Math.PI * Math.pow(distance, 2)); // W/m²
  }

  calculateBlastRadius(energyMegatons, altitude) {
    // Blast effect radius
    return 1000 * Math.pow(energyMegatons, 0.33) * (1 - altitude / 20000);
  }

  // Calculate tsunami effects for ocean impacts
  calculateTsunamiEffects(energyMegatons, waterDepth, distanceFromShore) {
    const waveHeight = this.calculateWaveHeight(energyMegatons, waterDepth);
    const runupHeight = this.calculateRunupHeight(
      waveHeight,
      distanceFromShore
    );

    return {
      waveHeight: waveHeight,
      runupHeight: runupHeight,
      inundationDistance: this.calculateInundationDistance(
        runupHeight,
        0.01
      ),
    };
  }

  calculateWaveHeight(energyMegatons, waterDepth) {
    // Empirical wave height calculation
    return 10 * Math.pow(energyMegatons, 0.33) * Math.sqrt(waterDepth / 1000);
  }

  calculateRunupHeight(waveHeight, distanceFromShore) {
    // Wave runup on shore
    return waveHeight * Math.exp(-0.001 * distanceFromShore);
  }

  calculateInundationDistance(runupHeight, coastalSlope) {
    // Inundation distance inland
    return runupHeight / coastalSlope;
  }

  // Orbital mechanics calculations
  calculateOrbitalParameters(position, velocity) {
    // Calculate orbital elements from position and velocity vectors
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

    const specificEnergy =
      v ** 2 / 2 - (this.constants.G * this.constants.EARTH_MASS) / r;
    const semiMajorAxis =
      (-this.constants.G * this.constants.EARTH_MASS) / (2 * specificEnergy);

    return {
      semiMajorAxis: semiMajorAxis,
      eccentricity: this.calculateEccentricity(position, velocity),
      inclination: this.calculateInclination(position, velocity),
      period: this.calculateOrbitalPeriod(semiMajorAxis),
    };
  }

  calculateEccentricity(position, velocity) {
    // Simplified eccentricity calculation
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

    return Math.sqrt(
      1 +
        (2 *
          this.calculateSpecificAngularMomentum(position, velocity) ** 2 *
          (v ** 2 / 2 - (this.constants.G * this.constants.EARTH_MASS) / r)) /
          (this.constants.G * this.constants.EARTH_MASS) ** 2
    );
  }

  calculateInclination(position, velocity) {
    // Orbital inclination
    const h = this.calculateSpecificAngularMomentum(position, velocity);
    return (
      (Math.acos(h.z / Math.sqrt(h.x ** 2 + h.y ** 2 + h.z ** 2)) * 180) /
      Math.PI
    );
  }

  calculateSpecificAngularMomentum(position, velocity) {
    return {
      x: position.y * velocity.z - position.z * velocity.y,
      y: position.z * velocity.x - position.x * velocity.z,
      z: position.x * velocity.y - position.y * velocity.x,
    };
  }

  calculateOrbitalPeriod(semiMajorAxis) {
    // Kepler's third law
    return (
      2 *
      Math.PI *
      Math.sqrt(
        Math.pow(semiMajorAxis, 3) /
          (this.constants.G * this.constants.EARTH_MASS)
      )
    );
  }

  // Mitigation strategy calculations
  calculateDeflectionEffect(impulse, timeBeforeImpact, asteroidMass) {
    // Calculate deflection distance
    const acceleration = impulse / asteroidMass;
    const deflection = 0.5 * acceleration * Math.pow(timeBeforeImpact, 2);

    return {
      deflection: deflection,
      missDistance:
        ((deflection / this.constants.EARTH_RADIUS) * 180) / Math.PI, // degrees
    };
  }

  calculateKineticImpactorEffect(
    projectileMass,
    projectileVelocity,
    asteroidMass
  ) {
    // Momentum transfer efficiency
    const momentumTransfer = 0.5; // Typical for hypervelocity impacts
    const deltaV =
      (projectileMass * projectileVelocity * momentumTransfer) / asteroidMass;

    return {
      deltaV: deltaV,
      efficiency: momentumTransfer,
    };
  }

  calculateNuclearDeflection(yieldMegatons, distance, asteroidMass) {
    // Nuclear deflection calculation
    const energy = yieldMegatons * this.constants.JOULES_TO_MEGATONS;
    const impulse = Math.sqrt(2 * energy * asteroidMass);

    return {
      impulse: impulse,
      effectiveness: impulse / (asteroidMass * 1000), // m/s per kg
    };
  }
}

// Simulation engine for running impact scenarios
class ImpactSimulator {
  constructor() {
    this.physics = new PhysicsCalculator();
    this.currentScenario = null;
    this.results = {};
  }

  // Main simulation method
  async runSimulation(scenario) {
    this.currentScenario = scenario;
    this.results = {};

    try {
      // Calculate basic parameters
      this.calculateBasicParameters();

      // Calculate impact effects based on location
      this.calculateImpactEffects();

      // Calculate secondary effects
      this.calculateSecondaryEffects();

      // Calculate mitigation results if applicable
      if (scenario.mitigationStrategy) {
        this.calculateMitigationResults();
      }

      return this.formatResults();
    } catch (error) {
      console.error('Simulation error:', error);
      throw new Error('Failed to run simulation');
    }
  }

  calculateBasicParameters() {
    const { diameter, velocity, densityType } = this.currentScenario.asteroid;

    this.results.mass = this.physics.calculateMass(diameter, densityType);
    this.results.energy = this.physics.calculateKineticEnergy(
      this.results.mass,
      velocity
    );
    this.results.energyMegatons = this.physics.energyToMegatons(
      this.results.energy
    );
    this.results.hiroshimaEquivalents = this.results.energyMegatons / 0.015;
  }

  calculateImpactEffects() {
    const { impactLocation } = this.currentScenario;
    const { energyMegatons } = this.results;

    if (impactLocation.type === 'land') {
      this.calculateLandImpact();
    } else if (impactLocation.type === 'ocean') {
      this.calculateOceanImpact();
    } else if (impactLocation.type === 'atmosphere') {
      this.calculateAirburst();
    }
  }

  calculateLandImpact() {
    const { energyMegatons } = this.results;

    this.results.crater = this.physics.calculateCraterSize(energyMegatons);
    this.results.seismic =
      this.physics.calculateSeismicMagnitude(energyMegatons);
    this.results.thermalRadiation = this.physics.calculateThermalRadiation(
      energyMegatons,
      0
    );
    this.results.blastWave = this.physics.calculateOverpressure(
      energyMegatons,
      0
    );
  }

  calculateOceanImpact() {
    const { energyMegatons } = this.results;
    const { waterDepth } = this.currentScenario.impactLocation;

    this.results.tsunami = this.physics.calculateTsunamiEffects(
      energyMegatons,
      waterDepth,
      0
    );
    this.results.seismic =
      this.physics.calculateSeismicMagnitude(energyMegatons);
  }

  calculateAirburst() {
    const { diameter, velocity, densityType } = this.currentScenario.asteroid;
    const { altitude } = this.currentScenario.impactLocation;

    this.results.airburst = this.physics.calculateAirburstEffects(
      diameter,
      velocity,
      densityType,
      altitude
    );
  }

  calculateSecondaryEffects() {
    // Calculate environmental and societal impacts
    this.calculateEnvironmentalImpact();
    this.calculateEconomicImpact();
    this.calculateHumanImpact();
  }

  calculateEnvironmentalImpact() {
    const { energyMegatons } = this.results;

    this.results.environmental = {
      dustEjected: energyMegatons * 1e9, // kg
      climateEffect: this.calculateClimateEffect(energyMegatons),
      firestormRadius: this.calculateFirestormRadius(energyMegatons),
    };
  }

  calculateClimateEffect(energyMegatons) {
    // Simplified climate effect calculation
    if (energyMegatons > 10000) {
      return 'Global catastrophe';
    }
    if (energyMegatons > 1000) {
      return 'Regional climate disruption';
    }
    if (energyMegatons > 100) {
      return 'Local climate effects';
    }
    return 'Minimal climate impact';
  }

  calculateFirestormRadius(energyMegatons) {
    return 10 * Math.sqrt(energyMegatons); // km
  }

  calculateEconomicImpact() {
    const { energyMegatons } = this.results;
    const { populationDensity } = this.currentScenario.impactLocation;

    this.results.economic = {
      damageCost: energyMegatons * 1e9, // USD
      affectedArea: this.calculateAffectedArea(energyMegatons),
      infrastructureDamage:
        this.calculateInfrastructureDamage(populationDensity),
    };
  }

  calculateAffectedArea(energyMegatons) {
    return (
      Math.PI * Math.pow(this.physics.calculateBlastRadius(energyMegatons, 0) / 1000, 2)
    ); // km²
  }

  calculateInfrastructureDamage(populationDensity) {
    const area = this.calculateAffectedArea(this.results.energyMegatons);
    return area * populationDensity * 0.3; // 30% infrastructure destruction
  }

  calculateHumanImpact() {
    const { energyMegatons } = this.results;
    const { populationDensity } = this.currentScenario.impactLocation;
    const area = this.calculateAffectedArea(energyMegatons);

    this.results.human = {
      casualties: area * populationDensity * 0.5, // 50% casualty rate
      injuries: area * populationDensity * 0.3, // 30% injury rate
      displaced: area * populationDensity * 0.8, // 80% displacement
    };
  }

  calculateMitigationResults() {
    const { mitigationStrategy } = this.currentScenario;
    const { mass } = this.results;

    switch (mitigationStrategy.type) {
      case 'deflection':
        this.results.mitigation = this.physics.calculateDeflectionEffect(
          mitigationStrategy.impulse,
          mitigationStrategy.timeBeforeImpact,
          mass
        );
        break;

      case 'kinetic_impactor':
        this.results.mitigation = this.physics.calculateKineticImpactorEffect(
          mitigationStrategy.projectileMass,
          mitigationStrategy.projectileVelocity,
          mass
        );
        break;

      case 'nuclear':
        this.results.mitigation = this.physics.calculateNuclearDeflection(
          mitigationStrategy.yieldMegatons,
          mitigationStrategy.distance,
          mass
        );
        break;
    }
  }

  formatResults() {
    return {
      basic: this.results,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString(),
      scenario: this.currentScenario,
    };
  }

  generateSummary() {
    const { energyMegatons, hiroshimaEquivalents } = this.results;

    return {
      energy: `${energyMegatons.toFixed(1)} megatons TNT`,
      equivalent: `${hiroshimaEquivalents.toFixed(0)} Hiroshima bombs`,
      severity: this.assessSeverity(energyMegatons),
      warningTime: this.calculateWarningTime(),
    };
  }

  assessSeverity(energyMegatons) {
    if (energyMegatons > 10000) {
      return 'Extinction Level Event';
    }
    if (energyMegatons > 1000) {
      return 'Global Catastrophe';
    }
    if (energyMegatons > 100) {
      return 'Regional Disaster';
    }
    if (energyMegatons > 10) {
      return 'Local Catastrophe';
    }
    if (energyMegatons > 1) {
      return 'Significant Event';
    }
    return 'Minor Event';
  }

  calculateWarningTime() {
    // Simplified warning time calculation based on detection capabilities
    const { velocity } = this.currentScenario.asteroid;
    const detectionDistance = 0.1 * 149597870.7; // 0.1 AU in km

    return detectionDistance / velocity / 86400; // days
  }

  generateRecommendations() {
    const { energyMegatons } = this.results;

    const recommendations = [];

    if (energyMegatons > 1000) {
      recommendations.push('Global evacuation planning needed');
      recommendations.push('International cooperation required');
      recommendations.push('Long-term shelter construction');
    }

    if (this.currentScenario.impactLocation.type === 'ocean') {
      recommendations.push('Coastal evacuation advised');
      recommendations.push('Tsunami warning systems activation');
    }

    if (this.results.seismic > 7.0) {
      recommendations.push('Seismic retrofitting of critical infrastructure');
    }

    return recommendations;
  }
}

// Export the calculation utilities
window.PhysicsCalculator = PhysicsCalculator;
window.ImpactSimulator = ImpactSimulator;

// Physics Calculations and Simulation Logic loaded silently
