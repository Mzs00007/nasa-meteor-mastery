/**
 * Calculate impact energy from asteroid parameters
 * @param {number} diameter - Asteroid diameter in meters
 * @param {number} density - Asteroid density in kg/m³
 * @param {number} velocity - Asteroid velocity in km/s
 * @param {number} angle - Impact angle in degrees
 * @returns {number} Impact energy in megatons of TNT
 */
exports.calculateEnergyFromParams = (diameter, density, velocity, angle) => {
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
  const energyMegatons = (kineticEnergyJoules * Math.pow(angleFactor, 2)) / 4.184e15;
  
  return energyMegatons;
};

/**
 * Calculate trajectory points for 3D visualization
 * @param {Object} asteroidParams - Asteroid parameters
 * @returns {Array} Array of trajectory points
 */
exports.calculateTrajectory = (asteroidParams) => {
  const { velocity, angle } = asteroidParams;
  const points = [];
  
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
};