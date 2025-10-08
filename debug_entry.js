import { AdvancedPhysicsEngine } from './src/utils/AdvancedPhysicsEngine.js';

const engine = new AdvancedPhysicsEngine();

// Tunguska event parameters
const tunguska = {
  diameter: 60, // meters
  velocity: 20, // km/s
  composition: 'stone',
  angle: 45, // degrees
  altitude: 100000 // meters
};

console.log('Testing atmospheric entry simulation...');
console.log('Tunguska parameters:', tunguska);

// Calculate initial mass
const initialMass = engine.calculateAsteroidMass(tunguska.diameter, tunguska.composition);
console.log(`Initial mass: ${initialMass} kg`);

// Test atmospheric entry simulation directly
const entryResults = engine.simulateAtmosphericEntry(tunguska);
console.log('\nAtmospheric entry results:');
console.log(`Final mass: ${entryResults.finalMass} kg`);
console.log(`Final velocity: ${entryResults.finalVelocity} km/s`);
console.log(`Impact occurred: ${entryResults.impactOccurred}`);
console.log(`Airburst altitude: ${entryResults.airburstAltitude} m`);
console.log(`Trajectory points: ${entryResults.trajectory.length}`);

// Show first few trajectory points
console.log('\nFirst 5 trajectory points:');
for (let i = 0; i < Math.min(5, entryResults.trajectory.length); i++) {
  const point = entryResults.trajectory[i];
  console.log(`  ${i}: Alt=${point.altitude}m, Vel=${point.velocity}km/s, Mass=${point.mass}kg`);
}

// Show last few trajectory points
console.log('\nLast 5 trajectory points:');
const start = Math.max(0, entryResults.trajectory.length - 5);
for (let i = start; i < entryResults.trajectory.length; i++) {
  const point = entryResults.trajectory[i];
  console.log(`  ${i}: Alt=${point.altitude}m, Vel=${point.velocity}km/s, Mass=${point.mass}kg`);
}