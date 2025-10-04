/**
 * Advanced Simulation Engine for Meteor Impact Analysis
 * Implements sophisticated atmospheric modeling, entry dynamics, and impact calculations
 */

class AdvancedSimulationEngine {
  constructor() {
    // Physical constants
    this.EARTH_RADIUS = 6371000; // meters
    this.GRAVITY = 9.81; // m/s²
    this.ATMOSPHERE_SCALE_HEIGHT = 8400; // meters
    this.SEA_LEVEL_DENSITY = 1.225; // kg/m³

    // Material properties
    this.materialProperties = {
      iron: {
        density: 7870, // kg/m³
        strength: 500e6, // Pa (tensile strength)
        meltingPoint: 1811, // K
        heatCapacity: 449, // J/kg·K
        thermalConductivity: 80.4, // W/m·K
        ablationCoeff: 0.1,
        fragmentationThreshold: 1e6, // Pa
      },
      stone: {
        density: 3500,
        strength: 100e6,
        meltingPoint: 1473,
        heatCapacity: 790,
        thermalConductivity: 2.5,
        ablationCoeff: 0.05,
        fragmentationThreshold: 5e5,
      },
      ice: {
        density: 917,
        strength: 5e6,
        meltingPoint: 273,
        heatCapacity: 2108,
        thermalConductivity: 2.22,
        ablationCoeff: 0.8,
        fragmentationThreshold: 1e5,
      },
      carbonaceous: {
        density: 2200,
        strength: 50e6,
        meltingPoint: 1200,
        heatCapacity: 1000,
        thermalConductivity: 1.5,
        ablationCoeff: 0.3,
        fragmentationThreshold: 2e5,
      },
    };

    // Atmospheric layers
    this.atmosphericLayers = [
      { altitude: 0, temperature: 288.15, pressure: 101325 }, // Sea level
      { altitude: 11000, temperature: 216.65, pressure: 22632 }, // Tropopause
      { altitude: 20000, temperature: 216.65, pressure: 5474 }, // Stratosphere
      { altitude: 32000, temperature: 228.65, pressure: 868 }, // Stratosphere
      { altitude: 47000, temperature: 270.65, pressure: 110 }, // Stratopause
      { altitude: 51000, temperature: 270.65, pressure: 66 }, // Mesosphere
      { altitude: 71000, temperature: 214.65, pressure: 4 }, // Mesosphere
      { altitude: 85000, temperature: 186.87, pressure: 0.37 }, // Mesopause
      { altitude: 100000, temperature: 195.08, pressure: 0.032 }, // Thermosphere
    ];
  }

  /**
   * Run comprehensive simulation with advanced parameters
   */
  async runAdvancedSimulation(params) {
    const {
      diameter,
      velocity,
      angle,
      composition,
      targetLocation = { lat: 0, lng: 0 },
      atmosphericDensity = 1.0, // multiplier for standard atmosphere
      entryAltitude = 100000, // meters
      fragmentationModel = 'pancake',
      ablationModel = 'detailed',
      shockwaveModel = 'advanced',
    } = params;

    console.log('🚀 Starting advanced simulation with parameters:', params);

    // Calculate initial conditions
    const mass = this.calculateMass(diameter, composition);
    const material = this.materialProperties[composition];

    // Atmospheric entry simulation
    const entryResults = await this.simulateAtmosphericEntry({
      mass,
      diameter,
      velocity,
      angle,
      material,
      atmosphericDensity,
      entryAltitude,
      fragmentationModel,
      ablationModel,
    });

    // Impact calculations
    const impactResults = await this.calculateImpactEffects({
      ...entryResults,
      targetLocation,
      shockwaveModel,
    });

    // Environmental effects
    const environmentalEffects = await this.calculateEnvironmentalEffects({
      ...impactResults,
      composition,
      targetLocation,
    });

    // Compile comprehensive results
    const results = {
      simulationId: this.generateSimulationId(),
      timestamp: new Date().toISOString(),
      inputParameters: params,

      // Entry phase results
      entryPhase: entryResults,

      // Impact results
      impactPhase: impactResults,

      // Environmental effects
      environmentalEffects,

      // Summary statistics
      summary: {
        impactEnergy: impactResults.kineticEnergy,
        craterDiameter: impactResults.crater.diameter,
        airburstAltitude: entryResults.airburstAltitude,
        fragmentCount: entryResults.fragments.length,
        devastationRadius: environmentalEffects.devastationRadius,
        tsunamiRisk: environmentalEffects.tsunamiRisk,
      },
    };

    console.log('✅ Advanced simulation completed:', results.summary);
    return results;
  }

  /**
   * Simulate atmospheric entry with detailed physics
   */
  async simulateAtmosphericEntry(params) {
    const {
      mass,
      diameter,
      velocity,
      angle,
      material,
      atmosphericDensity,
      entryAltitude,
    } = params;

    let currentMass = mass;
    let currentVelocity = velocity * 1000; // Convert to m/s
    let currentAltitude = entryAltitude;
    let currentDiameter = diameter;

    const trajectory = [];
    const fragments = [];
    let airburstAltitude = null;
    let maxDynamicPressure = 0;

    const timeStep = 0.1; // seconds
    const entryAngleRad = (angle * Math.PI) / 180;

    // Simulation loop
    while (currentAltitude > 0 && currentMass > 0.01 * mass) {
      // Atmospheric conditions
      const atmosphere = this.getAtmosphericConditions(
        currentAltitude,
        atmosphericDensity
      );

      // Dynamic pressure
      const dynamicPressure =
        0.5 * atmosphere.density * currentVelocity * currentVelocity;
      maxDynamicPressure = Math.max(maxDynamicPressure, dynamicPressure);

      // Drag force
      const dragCoeff = this.calculateDragCoefficient(
        currentVelocity,
        atmosphere
      );
      const crossSectionalArea = Math.PI * (currentDiameter / 2) ** 2;
      const dragForce = dragCoeff * dynamicPressure * crossSectionalArea;

      // Deceleration
      const deceleration = dragForce / currentMass;

      // Heat transfer and ablation
      const heatFlux = this.calculateHeatFlux(
        currentVelocity,
        atmosphere.density
      );
      const ablationRate = this.calculateAblationRate(heatFlux, material);

      // Mass loss due to ablation
      const surfaceArea = Math.PI * currentDiameter * currentDiameter;
      const massLoss = ablationRate * surfaceArea * timeStep;
      currentMass = Math.max(0, currentMass - massLoss);

      // Update diameter (assuming spherical)
      if (currentMass > 0) {
        currentDiameter = Math.pow(
          (6 * currentMass) / (Math.PI * material.density),
          1 / 3
        );
      }

      // Check for fragmentation
      if (
        dynamicPressure > material.fragmentationThreshold &&
        currentMass > 0.1 * mass
      ) {
        const fragmentationResult = this.simulateFragmentation(
          currentMass,
          currentDiameter,
          dynamicPressure,
          material
        );

        if (fragmentationResult.occurred) {
          fragments.push(...fragmentationResult.fragments);
          airburstAltitude = currentAltitude;

          // Continue with largest fragment
          const largestFragment = fragmentationResult.fragments.reduce(
            (max, frag) => (frag.mass > max.mass ? frag : max)
          );
          currentMass = largestFragment.mass;
          currentDiameter = largestFragment.diameter;
        }
      }

      // Update velocity and position
      currentVelocity = Math.max(0, currentVelocity - deceleration * timeStep);
      currentAltitude -= currentVelocity * Math.sin(entryAngleRad) * timeStep;

      // Record trajectory point
      trajectory.push({
        time: trajectory.length * timeStep,
        altitude: currentAltitude,
        velocity: currentVelocity,
        mass: currentMass,
        diameter: currentDiameter,
        dynamicPressure,
        temperature: this.calculateSurfaceTemperature(heatFlux, material),
      });

      // Safety check
      if (trajectory.length > 10000) {
        break;
      }
    }

    return {
      trajectory,
      fragments,
      airburstAltitude,
      maxDynamicPressure,
      finalMass: currentMass,
      finalVelocity: currentVelocity,
      finalDiameter: currentDiameter,
      impactOccurred: currentAltitude <= 0 && currentMass > 0,
    };
  }

  /**
   * Calculate impact effects with advanced modeling
   */
  async calculateImpactEffects(entryResults) {
    if (!entryResults.impactOccurred) {
      return {
        type: 'airburst',
        kineticEnergy: 0,
        crater: { diameter: 0, depth: 0 },
        shockwave: { overpressure: [], radius: [] },
      };
    }

    const { finalMass, finalVelocity, finalDiameter } = entryResults;

    // Kinetic energy at impact
    const kineticEnergy = 0.5 * finalMass * finalVelocity * finalVelocity;

    // Crater formation
    const crater = this.calculateCraterDimensions(
      finalMass,
      finalVelocity,
      finalDiameter
    );

    // Shockwave propagation
    const shockwave = this.calculateShockwaveEffects(kineticEnergy);

    // Seismic effects
    const seismic = this.calculateSeismicEffects(kineticEnergy);

    return {
      type: 'impact',
      kineticEnergy,
      crater,
      shockwave,
      seismic,
      ejectaVolume: crater.ejectaVolume,
      thermalEffects: this.calculateThermalEffects(kineticEnergy),
    };
  }

  /**
   * Calculate environmental effects
   */
  async calculateEnvironmentalEffects(impactResults) {
    const { kineticEnergy, crater } = impactResults;

    // Convert energy to TNT equivalent (1 ton TNT = 4.184e9 J)
    const tntEquivalent = kineticEnergy / 4.184e9;

    // Devastation radius (based on overpressure thresholds)
    const devastationRadius = Math.pow(tntEquivalent / 1000, 1 / 3) * 1000; // meters

    // Tsunami risk assessment
    const tsunamiRisk = this.assessTsunamiRisk(kineticEnergy, crater);

    // Climate effects
    const climateEffects = this.assessClimateEffects(
      kineticEnergy,
      crater.ejectaVolume
    );

    return {
      devastationRadius,
      tsunamiRisk,
      climateEffects,
      tntEquivalent,
      radiationDose: this.calculateRadiationEffects(kineticEnergy),
      atmosphericDisturbance:
        this.calculateAtmosphericDisturbance(kineticEnergy),
    };
  }

  // Helper methods for calculations

  calculateMass(diameter, composition) {
    const volume = (4 / 3) * Math.PI * Math.pow(diameter / 2, 3);
    const density = this.materialProperties[composition].density;
    return volume * density;
  }

  getAtmosphericConditions(altitude, densityMultiplier = 1.0) {
    // Interpolate atmospheric conditions based on altitude
    let layer = this.atmosphericLayers[0];
    for (let i = 1; i < this.atmosphericLayers.length; i++) {
      if (altitude <= this.atmosphericLayers[i].altitude) {
        const lower = this.atmosphericLayers[i - 1];
        const upper = this.atmosphericLayers[i];
        const ratio =
          (altitude - lower.altitude) / (upper.altitude - lower.altitude);

        layer = {
          temperature:
            lower.temperature + ratio * (upper.temperature - lower.temperature),
          pressure:
            lower.pressure *
            Math.exp(
              (-ratio * (upper.altitude - lower.altitude)) /
                this.ATMOSPHERE_SCALE_HEIGHT
            ),
        };
        break;
      }
    }

    // Calculate density using ideal gas law
    const density =
      (layer.pressure / (287 * layer.temperature)) * densityMultiplier;

    return {
      density,
      temperature: layer.temperature,
      pressure: layer.pressure,
    };
  }

  calculateDragCoefficient(velocity, atmosphere) {
    // Simplified drag coefficient model
    const mach = velocity / Math.sqrt(1.4 * 287 * atmosphere.temperature);

    if (mach < 0.8) {
      return 0.47;
    } // Subsonic sphere
    else if (mach < 1.2) {
      return 0.47 + (0.3 * (mach - 0.8)) / 0.4;
    } // Transonic
    else if (mach < 3.0) {
      return 0.77 - (0.1 * (mach - 1.2)) / 1.8;
    } // Supersonic
    return 0.67; // Hypersonic
  }

  calculateHeatFlux(velocity, density) {
    // Stagnation point heat flux (simplified)
    return 1.83e-4 * Math.sqrt(density) * Math.pow(velocity, 3);
  }

  calculateAblationRate(heatFlux, material) {
    // Mass ablation rate per unit area
    return (
      (material.ablationCoeff * heatFlux) /
      (material.heatCapacity * material.meltingPoint)
    );
  }

  calculateSurfaceTemperature(heatFlux, material) {
    // Simplified surface temperature calculation
    return Math.min(
      material.meltingPoint * 2,
      300 + heatFlux / (material.thermalConductivity * 1000)
    );
  }

  simulateFragmentation(mass, diameter, dynamicPressure, material) {
    const fragmentationOccurred =
      dynamicPressure > material.fragmentationThreshold;

    if (!fragmentationOccurred) {
      return { occurred: false, fragments: [] };
    }

    // Simple fragmentation model - break into multiple pieces
    const fragmentCount = Math.min(
      10,
      Math.floor(dynamicPressure / material.fragmentationThreshold)
    );
    const fragments = [];

    for (let i = 0; i < fragmentCount; i++) {
      const fragmentMass = (mass * (0.1 + 0.8 * Math.random())) / fragmentCount;
      const fragmentDiameter = Math.pow(
        (6 * fragmentMass) / (Math.PI * material.density),
        1 / 3
      );

      fragments.push({
        mass: fragmentMass,
        diameter: fragmentDiameter,
        velocity: 0.8 + 0.4 * Math.random(), // Relative velocity factor
      });
    }

    return { occurred: true, fragments };
  }

  calculateCraterDimensions(mass, velocity, diameter) {
    // Simplified crater scaling laws
    const kineticEnergy = 0.5 * mass * velocity * velocity;
    const craterDiameter = 1.8 * Math.pow(kineticEnergy / 4.184e9, 0.25) * 1000; // meters
    const craterDepth = craterDiameter * 0.2;
    const ejectaVolume =
      Math.PI * Math.pow(craterDiameter / 2, 2) * craterDepth;

    return {
      diameter: craterDiameter,
      depth: craterDepth,
      ejectaVolume,
    };
  }

  calculateShockwaveEffects(kineticEnergy) {
    const tntEquivalent = kineticEnergy / 4.184e9;
    const distances = [100, 500, 1000, 5000, 10000, 50000]; // meters

    const overpressures = distances.map(distance => {
      // Simplified blast wave scaling
      const scaledDistance = distance / Math.pow(tntEquivalent, 1 / 3);
      return 6.7 / Math.pow(scaledDistance, 1.3) + 1; // kPa
    });

    return {
      radius: distances,
      overpressure: overpressures,
    };
  }

  calculateSeismicEffects(kineticEnergy) {
    // Simplified seismic magnitude calculation
    const magnitude = Math.log10(kineticEnergy / 1e9) / 1.5;

    return {
      magnitude: Math.max(0, magnitude),
      duration: Math.sqrt(kineticEnergy / 1e12) * 10, // seconds
    };
  }

  calculateThermalEffects(kineticEnergy) {
    const fireball = {
      radius: Math.pow(kineticEnergy / 4.184e9, 0.4) * 100, // meters
      duration: Math.pow(kineticEnergy / 4.184e9, 0.2) * 2, // seconds
      temperature: 5000 + Math.log10(kineticEnergy / 1e12) * 1000, // K
    };

    return { fireball };
  }

  assessTsunamiRisk(kineticEnergy, crater) {
    // Simplified tsunami risk assessment
    const waveHeight = Math.sqrt(kineticEnergy / 1e15) * 10; // meters
    const risk =
      waveHeight > 1 ? 'high' : waveHeight > 0.1 ? 'moderate' : 'low';

    return {
      risk,
      estimatedWaveHeight: waveHeight,
      affectedCoastlineRadius: waveHeight * 1000, // km
    };
  }

  assessClimateEffects(kineticEnergy, ejectaVolume) {
    const dustMass = ejectaVolume * 2500; // kg (assuming rock density)
    const globalCooling = Math.log10(dustMass / 1e12) * 0.5; // degrees C

    return {
      globalCooling: Math.max(0, globalCooling),
      dustCloudDuration: Math.sqrt(dustMass / 1e12) * 30, // days
      ozoneDamage:
        kineticEnergy > 1e18
          ? 'severe'
          : kineticEnergy > 1e15
            ? 'moderate'
            : 'minimal',
    };
  }

  calculateRadiationEffects(kineticEnergy) {
    // Simplified radiation dose calculation
    return {
      dose: Math.log10(kineticEnergy / 1e12) * 10, // mSv
      radius: Math.sqrt(kineticEnergy / 1e15) * 1000, // meters
    };
  }

  calculateAtmosphericDisturbance(kineticEnergy) {
    return {
      shockwaveAltitude: Math.sqrt(kineticEnergy / 1e12) * 50000, // meters
      ionosphericDisturbance: kineticEnergy > 1e15 ? 'severe' : 'moderate',
      duration: Math.sqrt(kineticEnergy / 1e12) * 3600, // seconds
    };
  }

  generateSimulationId() {
    return `sim_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const advancedSimulationEngine = new AdvancedSimulationEngine();
export default advancedSimulationEngine;
