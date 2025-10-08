// Quick verification script for the energy calculation fix
import { AdvancedPhysicsEngine } from './src/utils/AdvancedPhysicsEngine.js';

const engine = new AdvancedPhysicsEngine();

// Tunguska event parameters
const tunguska = {
  diameter: 60, // meters
  velocity: 27000, // m/s (27 km/s)
  composition: 'stone',
  angle: 30, // degrees
  altitude: 8000 // meters
};

console.log('Testing Tunguska event parameters...');
console.log('Expected TNT equivalent: 5-30 megatons');

try {
  const result = engine.calculateComprehensiveImpact(tunguska);

  console.log('\n=== RESULTS ===');
  console.log(`TNT Equivalent: ${result.tntEquivalent || 0} megatons`);
  console.log(`Impact Energy: ${result.impactEnergy || 0} J`);
  console.log(`Final Mass: ${result.finalMass || 0} kg`);
  console.log(`Final Velocity: ${result.finalVelocity || 0} km/s`);
  console.log(`Impact Occurred: ${result.impactOccurred || false}`);
  console.log(`Airburst Altitude: ${result.airburstAltitude || 'N/A'} m`);

  console.log('\n=== VERIFICATION ===');
  const tntEquivalent = result.tntEquivalent || 0;
  const isInRange = tntEquivalent >= 5 && tntEquivalent <= 30;
  console.log(`TNT equivalent in expected range (5-30 MT): ${isInRange ? 'PASS' : 'FAIL'}`);
  
  if (isInRange) {
    console.log('✅ Energy calculation fix is working correctly!');
  } else {
    console.log('❌ Energy calculation still needs adjustment');
    console.log('Full result object:', JSON.stringify(result, null, 2));
  }

} catch (error) {
  console.error('Error during calculation:', error);
}