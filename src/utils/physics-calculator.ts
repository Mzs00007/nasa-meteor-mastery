// TypeScript Physics Calculator with comprehensive type definitions and optimized calculations

/**
 * Physics Constants and Type Definitions
 */

export interface PhysicsConstants {
  G: number; // Gravitational constant (m³ kg⁻¹ s⁻²)
  EARTH_RADIUS: number; // meters
  EARTH_MASS: number; // kg
  ESCAPE_VELOCITY: number; // m/s
  ATMOSPHERE_HEIGHT: number; // meters
  JOULES_TO_MEGATONS: number; // 1 megaton = 4.184e15 joules
  MEGATONS_TO_HIROSHIMA: number; // 1 megaton = ~67 Hiroshima bombs
  DENSITIES: Record<string, number>; // Material densities (kg/m³)
}

export interface AsteroidParams {
  diameter: number; // meters
  density?: number; // kg/m³
  densityType?: 'stony' | 'iron' | 'carbonaceous' | 'icy';
  velocity: number; // km/s
  angle: number; // degrees
  composition?: string;
}

export interface ImpactResult {
  energy: number; // Joules
  energyMegatons: number; // Megatons of TNT
  crater: {
    diameter: number; // meters
    depth: number; // meters
    volume: number; // m³
  };
  seismicMagnitude: number;
  airburst?: {
    overpressure: number; // kPa
    thermalRadiation: number; // W/m²
    blastRadius: number; // meters
  };
  tsunami?: {
    waveHeight: number; // meters
    runupHeight: number; // meters
    inundationDistance: number; // meters
  };
}

export interface OrbitalParameters {
  semiMajorAxis: number; // meters
  eccentricity: number;
  inclination: number; // degrees
  period: number; // seconds
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface DeflectionResult {
  deflection: number; // meters
  missDistance: number; // degrees
}

export interface KineticImpactorResult {
  deltaV: number; // m/s
  efficiency: number;
}

/**
 * Physics Calculator Class
 */
export class PhysicsCalculator {
  private constants: PhysicsConstants;

  constructor() {
    this.constants = {
      G: 6.6743e-11,
      EARTH_RADIUS: 6371000,
      EARTH_MASS: 5.972e24,
      ESCAPE_VELOCITY: 11200,
      ATMOSPHERE_HEIGHT: 100000,
      JOULES_TO_MEGATONS: 4.184e15,
      MEGATONS_TO_HIROSHIMA: 0.015,
      DENSITIES: {
        stony: 3000,
        iron: 7800,
        carbonaceous: 2000,
        icy: 900,
      },
    };
  }

  /**
   * Calculate asteroid mass
   */
  calculateMass(diameter: number, densityType: string = 'stony'): number {
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const density =
      this.constants.DENSITIES[densityType] || this.constants.DENSITIES.stony;
    return volume * density;
  }

  /**
   * Calculate kinetic energy
   */
  calculateKineticEnergy(mass: number, velocity: number): number {
    return 0.5 * mass * Math.pow(velocity, 2);
  }

  /**
   * Convert energy to megatons of TNT
   */
  energyToMegatons(energyJoules: number): number {
    return energyJoules / this.constants.JOULES_TO_MEGATONS;
  }

  /**
   * Calculate comprehensive impact results
   */
  calculateImpact(params: AsteroidParams): ImpactResult {
    const mass = this.calculateMass(params.diameter, params.densityType);
    const velocityMs = params.velocity * 1000; // Convert km/s to m/s
    const energy = this.calculateKineticEnergy(mass, velocityMs);
    const energyMegatons = this.energyToMegatons(energy);

    const crater = this.calculateCraterSize(energyMegatons, params.angle);
    const seismicMagnitude = this.calculateSeismicMagnitude(energyMegatons);

    const result: ImpactResult = {
      energy,
      energyMegatons,
      crater,
      seismicMagnitude,
    };

    // Add airburst effects if altitude is provided
    if (params.composition === 'icy') {
      result.airburst = this.calculateAirburstEffects(
        params.diameter,
        params.velocity,
        params.densityType!,
        10000
      );
    }

    return result;
  }

  /**
   * Calculate crater size (empirical formula)
   */
  calculateCraterSize(
    energyMegatons: number,
    impactAngle: number = 45
  ): ImpactResult['crater'] {
    const angleFactor = Math.sin((impactAngle * Math.PI) / 180);
    const diameter = 100 * Math.pow(energyMegatons, 0.294) * angleFactor;
    const depth = diameter / 5;
    const volume = (Math.PI / 6) * Math.pow(diameter, 2) * depth;

    return { diameter, depth, volume };
  }

  /**
   * Calculate seismic magnitude
   */
  calculateSeismicMagnitude(energyMegatons: number, depth: number = 0): number {
    const magnitude = 0.67 * Math.log10(energyMegatons * 1e6) + 3.5;
    const depthAdjustment = depth < 1000 ? 0.5 : 0;
    return Math.min(magnitude + depthAdjustment, 10.0);
  }

  /**
   * Calculate airburst effects
   */
  calculateAirburstEffects(
    diameter: number,
    velocity: number,
    densityType: string,
    altitude: number
  ): ImpactResult['airburst'] {
    const mass = this.calculateMass(diameter, densityType);
    const energy = this.calculateKineticEnergy(mass, velocity * 1000);
    const energyMegatons = this.energyToMegatons(energy);

    return {
      overpressure: this.calculateOverpressure(energyMegatons, altitude),
      thermalRadiation: this.calculateThermalRadiation(
        energyMegatons,
        altitude
      ),
      blastRadius: this.calculateBlastRadius(energyMegatons, altitude),
    };
  }

  private calculateOverpressure(
    energyMegatons: number,
    altitude: number
  ): number {
    const scaledDistance = altitude / Math.pow(energyMegatons, 1 / 3);
    return 1000 / (scaledDistance + 1);
  }

  private calculateThermalRadiation(
    energyMegatons: number,
    altitude: number
  ): number {
    const distance = Math.max(altitude, 1000);
    return (energyMegatons * 1e6) / (4 * Math.PI * Math.pow(distance, 2));
  }

  private calculateBlastRadius(
    energyMegatons: number,
    altitude: number
  ): number {
    return 1000 * Math.pow(energyMegatons, 0.33) * (1 - altitude / 20000);
  }

  /**
   * Calculate tsunami effects for ocean impacts
   */
  calculateTsunamiEffects(
    energyMegatons: number,
    waterDepth: number,
    distanceFromShore: number
  ): ImpactResult['tsunami'] {
    const waveHeight = this.calculateWaveHeight(energyMegatons, waterDepth);
    const runupHeight = this.calculateRunupHeight(
      waveHeight,
      distanceFromShore
    );

    return {
      waveHeight,
      runupHeight,
      inundationDistance: this.calculateInundationDistance(runupHeight, 0.01),
    };
  }

  private calculateWaveHeight(
    energyMegatons: number,
    waterDepth: number
  ): number {
    return 10 * Math.pow(energyMegatons, 0.33) * Math.sqrt(waterDepth / 1000);
  }

  private calculateRunupHeight(
    waveHeight: number,
    distanceFromShore: number
  ): number {
    return waveHeight * Math.exp(-0.001 * distanceFromShore);
  }

  private calculateInundationDistance(
    runupHeight: number,
    coastalSlope: number
  ): number {
    return runupHeight / coastalSlope;
  }

  /**
   * Orbital mechanics calculations
   */
  calculateOrbitalParameters(
    position: Vector3D,
    velocity: Vector3D
  ): OrbitalParameters {
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

    const specificEnergy =
      v ** 2 / 2 - (this.constants.G * this.constants.EARTH_MASS) / r;
    const semiMajorAxis =
      (-this.constants.G * this.constants.EARTH_MASS) / (2 * specificEnergy);

    return {
      semiMajorAxis,
      eccentricity: this.calculateEccentricity(position, velocity),
      inclination: this.calculateInclination(position, velocity),
      period: this.calculateOrbitalPeriod(semiMajorAxis),
    };
  }

  private calculateEccentricity(
    position: Vector3D,
    velocity: Vector3D
  ): number {
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const h = this.calculateSpecificAngularMomentum(position, velocity);
    const hMag = Math.sqrt(h.x ** 2 + h.y ** 2 + h.z ** 2);

    return Math.sqrt(
      1 +
        (2 *
          hMag ** 2 *
          (v ** 2 / 2 - (this.constants.G * this.constants.EARTH_MASS) / r)) /
          Math.pow(this.constants.G * this.constants.EARTH_MASS, 2)
    );
  }

  private calculateInclination(position: Vector3D, velocity: Vector3D): number {
    const h = this.calculateSpecificAngularMomentum(position, velocity);
    return (
      (Math.acos(h.z / Math.sqrt(h.x ** 2 + h.y ** 2 + h.z ** 2)) * 180) /
      Math.PI
    );
  }

  private calculateSpecificAngularMomentum(
    position: Vector3D,
    velocity: Vector3D
  ): Vector3D {
    return {
      x: position.y * velocity.z - position.z * velocity.y,
      y: position.z * velocity.x - position.x * velocity.z,
      z: position.x * velocity.y - position.y * velocity.x,
    };
  }

  private calculateOrbitalPeriod(semiMajorAxis: number): number {
    return (
      2 *
      Math.PI *
      Math.sqrt(
        Math.pow(semiMajorAxis, 3) /
          (this.constants.G * this.constants.EARTH_MASS)
      )
    );
  }

  /**
   * Mitigation strategy calculations
   */
  calculateDeflectionEffect(
    impulse: number,
    timeBeforeImpact: number,
    asteroidMass: number
  ): DeflectionResult {
    const acceleration = impulse / asteroidMass;
    const deflection = 0.5 * acceleration * Math.pow(timeBeforeImpact, 2);

    return {
      deflection,
      missDistance:
        ((deflection / this.constants.EARTH_RADIUS) * 180) / Math.PI,
    };
  }

  calculateKineticImpactorEffect(
    projectileMass: number,
    projectileVelocity: number,
    asteroidMass: number
  ): KineticImpactorResult {
    const momentumTransfer = 0.5;
    const deltaV =
      (projectileMass * projectileVelocity * momentumTransfer) / asteroidMass;

    return { deltaV, efficiency: momentumTransfer };
  }

  /**
   * Utility methods
   */
  getConstants(): PhysicsConstants {
    return { ...this.constants };
  }

  validateAsteroidParams(params: AsteroidParams): string[] {
    const errors: string[] = [];

    if (params.diameter <= 0) {
      errors.push('Diameter must be positive');
    }

    if (params.velocity <= 0) {
      errors.push('Velocity must be positive');
    }

    if (params.angle < 0 || params.angle > 90) {
      errors.push('Impact angle must be between 0 and 90 degrees');
    }

    return errors;
  }
}

// Export singleton instance
export const physicsCalculator = new PhysicsCalculator();
