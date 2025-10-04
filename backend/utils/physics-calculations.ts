// TypeScript Physics Calculations for Backend with comprehensive type definitions

/**
 * Type Definitions
 */

export interface AsteroidParams {
  diameter: number; // meters
  density: number; // kg/m³
  velocity: number; // km/s
  angle: number; // degrees
  composition?: string;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
}

export interface ImpactLocation {
  lat: number; // latitude
  lng: number; // longitude
}

export interface SimulationResult {
  id: string;
  timestamp: Date;
  asteroidParams: AsteroidParams;
  trajectory: TrajectoryPoint[];
  impactLocation: ImpactLocation;
  impactEnergy: number; // megatons of TNT
  craterDiameter: number; // meters
}

/**
 * Physics Constants
 */
const PHYSICS_CONSTANTS = {
  G: 6.67430e-11, // Gravitational constant (m³ kg⁻¹ s⁻²)
  EARTH_RADIUS: 6371000, // meters
  EARTH_MASS: 5.972e24, // kg
  JOULES_TO_MEGATONS: 4.184e15, // 1 megaton = 4.184e15 joules
  DENSITIES: {
    stony: 3000,
    iron: 7800,
    carbonaceous: 2000,
    icy: 900
  }
};

/**
 * Calculate impact energy from asteroid parameters
 */
export function calculateEnergyFromParams(
  diameter: number,
  density: number,
  velocity: number,
  angle: number
): number {
  // Validate input parameters
  const validationErrors = validateAsteroidParams({ diameter, density, velocity, angle });
  if (validationErrors.length > 0) {
    throw new Error(`Invalid asteroid parameters: ${validationErrors.join(', ')}`);
  }

  // Convert diameter from meters to kilometers
  const radiusKm = diameter / 2000;
  
  // Calculate volume in cubic kilometers
  const volumeKm3 = (4/3) * Math.PI * Math.pow(radiusKm, 3);
  
  // Calculate mass in kilograms
  const massKg = volumeKm3 * density * 1e12;
  
  // Calculate kinetic energy in joules (1/2 * m * v^2)
  const velocityMs = velocity * 1000; // Convert km/s to m/s
  const kineticEnergyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  
  // Apply angle factor (vertical impact has maximum energy transfer)
  const angleFactor = Math.sin(angle * Math.PI / 180);
  
  // Convert to megatons of TNT (1 megaton = 4.184e15 joules)
  const energyMegatons = (kineticEnergyJoules * Math.pow(angleFactor, 2)) / PHYSICS_CONSTANTS.JOULES_TO_MEGATONS;
  
  return energyMegatons;
}

/**
 * Calculate trajectory points for 3D visualization
 */
export function calculateTrajectory(asteroidParams: AsteroidParams): TrajectoryPoint[] {
  const { velocity, angle } = asteroidParams;
  const points: TrajectoryPoint[] = [];
  
  // Simple trajectory calculation (would be more complex in reality)
  const steps = 100;
  const timeStep = 0.1; // seconds
  
  // Initial position (far from Earth)
  let x = -1000;
  let y = 0;
  let z = 500;
  
  // Calculate velocity components
  const vx = velocity * Math.cos(angle * Math.PI / 180);
  const vz = -velocity * Math.sin(angle * Math.PI / 180);
  
  // Generate trajectory points
  for (let i = 0; i < steps; i++) {
    points.push({ x, y, z });
    
    // Update position
    x += vx * timeStep;
    z += vz * timeStep;
    
    // Add some curvature to the trajectory
    y = 0.0001 * Math.pow(x + 1000, 2);
    
    // Stop if we hit the "ground"
    if (z < 0) break;
  }
  
  return points;
}

/**
 * Calculate crater diameter based on impact energy
 */
export function calculateCraterDiameter(impactEnergyMegatons: number): number {
  // Simplified formula based on energy scaling
  return Math.pow(impactEnergyMegatons, 1/3) * 0.015 * 1000; // in meters
}

/**
 * Generate random impact location
 */
export function generateImpactLocation(): ImpactLocation {
  return {
    lat: parseFloat((Math.random() * 140 - 70).toFixed(4)), // -70 to +70 latitude
    lng: parseFloat((Math.random() * 340 - 170).toFixed(4)) // -170 to +170 longitude
  };
}

/**
 * Validate asteroid parameters
 */
export function validateAsteroidParams(params: AsteroidParams): string[] {
  const errors: string[] = [];

  if (params.diameter <= 0) {
    errors.push('Diameter must be positive');
  }

  if (params.density <= 0) {
    errors.push('Density must be positive');
  }

  if (params.velocity <= 0) {
    errors.push('Velocity must be positive');
  }

  if (params.angle < 0 || params.angle > 90) {
    errors.push('Impact angle must be between 0 and 90 degrees');
  }

  // Additional validation for realistic values
  if (params.diameter > 100000) { // 100km maximum
    errors.push('Diameter too large (max 100km)');
  }

  if (params.velocity > 300) { // 300 km/s maximum (unrealistically high)
    errors.push('Velocity too high (max 300 km/s)');
  }

  return errors;
}

/**
 * Calculate comprehensive impact simulation
 */
export function runImpactSimulation(asteroidParams: AsteroidParams): Omit<SimulationResult, 'id' | 'timestamp'> {
  // Validate parameters
  const validationErrors = validateAsteroidParams(asteroidParams);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid simulation parameters: ${validationErrors.join(', ')}`);
  }

  // Calculate trajectory
  const trajectory = calculateTrajectory(asteroidParams);
  
  // Generate impact location
  const impactLocation = generateImpactLocation();
  
  // Calculate impact energy
  const { diameter, density, velocity, angle } = asteroidParams;
  const impactEnergy = calculateEnergyFromParams(diameter, density, velocity, angle);
  
  // Calculate crater diameter
  const craterDiameter = calculateCraterDiameter(impactEnergy);

  return {
    asteroidParams,
    trajectory,
    impactLocation,
    impactEnergy,
    craterDiameter
  };
}

/**
 * Convert energy to equivalent comparisons
 */
export function energyToComparisons(energyMegatons: number): {
  hiroshimaBombs: number;
  tsarBombas: number;
  ktTNT: number;
} {
  return {
    hiroshimaBombs: energyMegatons / 0.015, // 1 Hiroshima bomb = 0.015 megatons
    tsarBombas: energyMegatons / 50, // Tsar Bomba = 50 megatons
    ktTNT: energyMegatons * 1000 // Convert to kilotons
  };
}

/**
 * Calculate airburst effects for atmospheric entry
 */
export function calculateAirburstEffects(
  diameter: number,
  velocity: number,
  density: number,
  altitude: number
): {
  burstEnergy: number;
  overpressure: number; // kPa
  thermalRadiation: number; // W/m²
  blastRadius: number; // meters
} {
  const impactEnergy = calculateEnergyFromParams(diameter, density, velocity, 90); // Vertical impact
  
  // Simplified airburst calculations
  const scaledDistance = altitude / Math.pow(impactEnergy, 1/3);
  const overpressure = 1000 / (scaledDistance + 1);
  const thermalRadiation = (impactEnergy * 1e6) / (4 * Math.PI * Math.pow(altitude, 2));
  const blastRadius = 1000 * Math.pow(impactEnergy, 0.33) * (1 - altitude / 20000);

  return {
    burstEnergy: impactEnergy,
    overpressure,
    thermalRadiation,
    blastRadius
  };
}

/**
 * Export constants for external use
 */
export { PHYSICS_CONSTANTS };