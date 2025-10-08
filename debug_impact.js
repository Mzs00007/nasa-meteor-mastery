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

console.log('Testing complete impact calculation...');

// Test atmospheric entry simulation directly
const entryResults = engine.simulateAtmosphericEntry(tunguska);
console.log('\nEntry results:');
console.log(`Final mass: ${entryResults.finalMass} kg`);
console.log(`Final velocity: ${entryResults.finalVelocity} km/s`);
console.log(`Impact occurred: ${entryResults.impactOccurred}`);

// Test impact effects calculation
const impactResults = engine.calculateImpactEffects(entryResults, tunguska.angle);
console.log('\nImpact results:');
console.log(`Type: ${impactResults.type}`);
console.log(`Impact energy: ${impactResults.impactEnergy} J`);
console.log(`TNT equivalent: ${impactResults.tntEquivalent} megatons`);

// Test complete calculation
const completeResults = engine.calculateComprehensiveImpact(tunguska);
console.log('\nComplete results:');
console.log(`TNT equivalent: ${completeResults.tntEquivalent} megatons`);
console.log(`Impact energy: ${completeResults.impactEnergy} J`);
console.log(`Final mass: ${completeResults.finalMass} kg`);
console.log(`Impact occurred: ${completeResults.impactOccurred}`);