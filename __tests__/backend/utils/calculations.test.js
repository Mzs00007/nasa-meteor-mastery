const { calculateEnergyFromParams, calculateTrajectory } = require('../../../backend/utils/calculations');

describe('Backend Calculations', () => {
  describe('calculateEnergyFromParams', () => {
    it('should calculate energy correctly for typical asteroid parameters', () => {
      const diameter = 100; // meters
      const density = 3000; // kg/m³ (stony asteroid)
      const velocity = 20; // km/s
      const angle = 45; // degrees
      
      const energy = calculateEnergyFromParams(diameter, density, velocity, angle);
      
      expect(energy).toBeGreaterThan(0);
      expect(typeof energy).toBe('number');
      expect(isFinite(energy)).toBe(true);
    });

    it('should calculate energy for different asteroid sizes', () => {
      const density = 3000;
      const velocity = 20;
      const angle = 45;
      
      const smallAsteroid = calculateEnergyFromParams(10, density, velocity, angle);
      const mediumAsteroid = calculateEnergyFromParams(100, density, velocity, angle);
      const largeAsteroid = calculateEnergyFromParams(1000, density, velocity, angle);
      
      // Energy should increase with size (cubic relationship)
      expect(mediumAsteroid).toBeGreaterThan(smallAsteroid);
      expect(largeAsteroid).toBeGreaterThan(mediumAsteroid);
      
      // Check approximate cubic scaling
      const sizeRatio = 10; // 100m / 10m
      const energyRatio = mediumAsteroid / smallAsteroid;
      expect(energyRatio).toBeCloseTo(Math.pow(sizeRatio, 3), 0);
    });

    it('should calculate energy for different densities', () => {
      const diameter = 100;
      const velocity = 20;
      const angle = 45;
      
      const icyAsteroid = calculateEnergyFromParams(diameter, 900, velocity, angle); // icy
      const stonyAsteroid = calculateEnergyFromParams(diameter, 3000, velocity, angle); // stony
      const ironAsteroid = calculateEnergyFromParams(diameter, 7800, velocity, angle); // iron
      
      // Energy should increase with density
      expect(stonyAsteroid).toBeGreaterThan(icyAsteroid);
      expect(ironAsteroid).toBeGreaterThan(stonyAsteroid);
      
      // Check linear scaling with density
      expect(stonyAsteroid / icyAsteroid).toBeCloseTo(3000 / 900, 1);
    });

    it('should calculate energy for different velocities', () => {
      const diameter = 100;
      const density = 3000;
      const angle = 45;
      
      const slowAsteroid = calculateEnergyFromParams(diameter, density, 10, angle);
      const fastAsteroid = calculateEnergyFromParams(diameter, density, 20, angle);
      const veryFastAsteroid = calculateEnergyFromParams(diameter, density, 40, angle);
      
      // Energy should increase with velocity squared
      expect(fastAsteroid).toBeGreaterThan(slowAsteroid);
      expect(veryFastAsteroid).toBeGreaterThan(fastAsteroid);
      
      // Check quadratic scaling with velocity
      const velocityRatio = 2; // 20 / 10
      const energyRatio = fastAsteroid / slowAsteroid;
      expect(energyRatio).toBeCloseTo(Math.pow(velocityRatio, 2), 1);
    });

    it('should calculate energy for different impact angles', () => {
      const diameter = 100;
      const density = 3000;
      const velocity = 20;
      
      const grazingImpact = calculateEnergyFromParams(diameter, density, velocity, 15); // 15 degrees
      const moderateImpact = calculateEnergyFromParams(diameter, density, velocity, 45); // 45 degrees
      const verticalImpact = calculateEnergyFromParams(diameter, density, velocity, 90); // 90 degrees
      
      // Energy should increase with impact angle (more vertical = more energy transfer)
      expect(moderateImpact).toBeGreaterThan(grazingImpact);
      expect(verticalImpact).toBeGreaterThan(moderateImpact);
      
      // Vertical impact should have maximum energy
      expect(verticalImpact).toBeCloseTo(
        calculateEnergyFromParams(diameter, density, velocity, 90),
        5
      );
    });

    it('should handle edge case angles', () => {
      const diameter = 100;
      const density = 3000;
      const velocity = 20;
      
      const zeroAngle = calculateEnergyFromParams(diameter, density, velocity, 0);
      const ninetyAngle = calculateEnergyFromParams(diameter, density, velocity, 90);
      
      // Zero angle should result in zero energy transfer
      expect(zeroAngle).toBe(0);
      
      // 90 degree angle should have maximum energy
      expect(ninetyAngle).toBeGreaterThan(0);
    });

    it('should handle very small asteroids', () => {
      const energy = calculateEnergyFromParams(1, 3000, 20, 45); // 1 meter diameter
      
      expect(energy).toBeGreaterThan(0);
      expect(energy).toBeLessThan(1); // Should be less than 1 megaton
    });

    it('should handle very large asteroids', () => {
      const energy = calculateEnergyFromParams(10000, 3000, 20, 45); // 10 km diameter
      
      expect(energy).toBeGreaterThan(1000000); // Should be millions of megatons
      expect(isFinite(energy)).toBe(true);
    });

    it('should handle extreme velocities', () => {
      const diameter = 100;
      const density = 3000;
      const angle = 45;
      
      const slowEnergy = calculateEnergyFromParams(diameter, density, 1, angle); // 1 km/s
      const fastEnergy = calculateEnergyFromParams(diameter, density, 100, angle); // 100 km/s
      
      expect(slowEnergy).toBeGreaterThan(0);
      expect(fastEnergy).toBeGreaterThan(slowEnergy);
      expect(isFinite(fastEnergy)).toBe(true);
    });

    it('should handle different density types realistically', () => {
      const diameter = 100;
      const velocity = 20;
      const angle = 45;
      
      // Test with realistic asteroid densities
      const carbonaceous = calculateEnergyFromParams(diameter, 2000, velocity, angle);
      const stony = calculateEnergyFromParams(diameter, 3000, velocity, angle);
      const iron = calculateEnergyFromParams(diameter, 7800, velocity, angle);
      
      expect(carbonaceous).toBeLessThan(stony);
      expect(stony).toBeLessThan(iron);
      
      // Iron should be about 2.6 times more energetic than carbonaceous
      expect(iron / carbonaceous).toBeCloseTo(7800 / 2000, 1);
    });

    it('should produce consistent results for same inputs', () => {
      const params = [100, 3000, 20, 45];
      
      const result1 = calculateEnergyFromParams(...params);
      const result2 = calculateEnergyFromParams(...params);
      const result3 = calculateEnergyFromParams(...params);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should handle zero and negative inputs gracefully', () => {
      // Zero diameter should result in zero energy
      expect(calculateEnergyFromParams(0, 3000, 20, 45)).toBe(0);
      
      // Zero velocity should result in zero energy
      expect(calculateEnergyFromParams(100, 3000, 0, 45)).toBe(0);
      
      // Zero density should result in zero energy
      expect(calculateEnergyFromParams(100, 0, 20, 45)).toBe(0);
      
      // Negative values should not throw errors
      expect(() => calculateEnergyFromParams(-100, 3000, 20, 45)).not.toThrow();
      expect(() => calculateEnergyFromParams(100, -3000, 20, 45)).not.toThrow();
      expect(() => calculateEnergyFromParams(100, 3000, -20, 45)).not.toThrow();
    });
  });

  describe('calculateTrajectory', () => {
    it('should calculate trajectory points for typical parameters', () => {
      const asteroidParams = {
        velocity: 20, // km/s
        angle: 45 // degrees
      };
      
      const trajectory = calculateTrajectory(asteroidParams);
      
      expect(Array.isArray(trajectory)).toBe(true);
      expect(trajectory.length).toBeGreaterThan(0);
      expect(trajectory.length).toBeLessThanOrEqual(100); // Should not exceed max steps
    });

    it('should return trajectory points with correct structure', () => {
      const asteroidParams = {
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(asteroidParams);
      
      trajectory.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('z');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(typeof point.z).toBe('number');
      });
    });

    it('should start trajectory from expected initial position', () => {
      const asteroidParams = {
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(asteroidParams);
      const firstPoint = trajectory[0];
      
      expect(firstPoint.x).toBe(-1000);
      expect(firstPoint.y).toBe(0);
      expect(firstPoint.z).toBe(500);
    });

    it('should show progression in x-direction', () => {
      const asteroidParams = {
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(asteroidParams);
      
      // X should increase over time (moving towards Earth)
      for (let i = 1; i < trajectory.length; i++) {
        expect(trajectory[i].x).toBeGreaterThan(trajectory[i - 1].x);
      }
    });

    it('should show decreasing z-values (altitude)', () => {
      const asteroidParams = {
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(asteroidParams);
      
      // Z should generally decrease (falling towards Earth)
      const firstZ = trajectory[0].z;
      const lastZ = trajectory[trajectory.length - 1].z;
      expect(lastZ).toBeLessThan(firstZ);
    });

    it('should stop when hitting ground (z < 0)', () => {
      const asteroidParams = {
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(asteroidParams);
      const lastPoint = trajectory[trajectory.length - 1];
      
      // Last point should be at or near ground level
      expect(lastPoint.z).toBeGreaterThanOrEqual(0);
      
      // If trajectory stopped early, it should be because z would go negative
      if (trajectory.length < 100) {
        expect(lastPoint.z).toBeLessThan(10); // Close to ground
      }
    });

    it('should handle different velocities', () => {
      const slowParams = { velocity: 10, angle: 45 };
      const fastParams = { velocity: 40, angle: 45 };
      
      const slowTrajectory = calculateTrajectory(slowParams);
      const fastTrajectory = calculateTrajectory(fastParams);
      
      expect(Array.isArray(slowTrajectory)).toBe(true);
      expect(Array.isArray(fastTrajectory)).toBe(true);
      
      // Both should have valid trajectories
      expect(slowTrajectory.length).toBeGreaterThan(0);
      expect(fastTrajectory.length).toBeGreaterThan(0);
    });

    it('should handle different angles', () => {
      const shallowParams = { velocity: 20, angle: 15 };
      const steepParams = { velocity: 20, angle: 75 };
      
      const shallowTrajectory = calculateTrajectory(shallowParams);
      const steepTrajectory = calculateTrajectory(steepParams);
      
      expect(Array.isArray(shallowTrajectory)).toBe(true);
      expect(Array.isArray(steepTrajectory)).toBe(true);
      
      // Steep angle should result in faster altitude loss
      const shallowLastZ = shallowTrajectory[shallowTrajectory.length - 1].z;
      const steepLastZ = steepTrajectory[steepTrajectory.length - 1].z;
      
      // This test might be sensitive to the specific implementation
      expect(steepLastZ).toBeLessThanOrEqual(shallowLastZ + 50); // Allow some tolerance
    });

    it('should handle zero velocity', () => {
      const params = { velocity: 0, angle: 45 };
      
      const trajectory = calculateTrajectory(params);
      
      expect(Array.isArray(trajectory)).toBe(true);
      expect(trajectory.length).toBeGreaterThan(0);
      
      // With zero velocity, x should not change much
      const firstX = trajectory[0].x;
      const lastX = trajectory[trajectory.length - 1].x;
      expect(Math.abs(lastX - firstX)).toBeLessThan(1);
    });

    it('should handle zero angle (horizontal trajectory)', () => {
      const params = { velocity: 20, angle: 0 };
      
      const trajectory = calculateTrajectory(params);
      
      expect(Array.isArray(trajectory)).toBe(true);
      expect(trajectory.length).toBeGreaterThan(0);
      
      // With zero angle, z should not change much initially
      const firstZ = trajectory[0].z;
      const secondZ = trajectory[1].z;
      expect(Math.abs(secondZ - firstZ)).toBeLessThan(Math.abs(trajectory[1].x - trajectory[0].x));
    });

    it('should handle 90-degree angle (vertical trajectory)', () => {
      const params = { velocity: 20, angle: 90 };
      
      const trajectory = calculateTrajectory(params);
      
      expect(Array.isArray(trajectory)).toBe(true);
      expect(trajectory.length).toBeGreaterThan(0);
      
      // With 90-degree angle, x should not change much
      const firstX = trajectory[0].x;
      const lastX = trajectory[trajectory.length - 1].x;
      expect(Math.abs(lastX - firstX)).toBeLessThan(50); // Allow some tolerance for curvature
    });

    it('should include curvature in y-direction', () => {
      const params = { velocity: 20, angle: 45 };
      
      const trajectory = calculateTrajectory(params);
      
      // Y should show some curvature (parabolic path)
      const firstY = trajectory[0].y;
      const midY = trajectory[Math.floor(trajectory.length / 2)].y;
      const lastY = trajectory[trajectory.length - 1].y;
      
      expect(midY).toBeGreaterThan(firstY);
      expect(lastY).toBeGreaterThan(midY);
    });

    it('should produce consistent results for same inputs', () => {
      const params = { velocity: 20, angle: 45 };
      
      const trajectory1 = calculateTrajectory(params);
      const trajectory2 = calculateTrajectory(params);
      
      expect(trajectory1.length).toBe(trajectory2.length);
      
      for (let i = 0; i < trajectory1.length; i++) {
        expect(trajectory1[i].x).toBe(trajectory2[i].x);
        expect(trajectory1[i].y).toBe(trajectory2[i].y);
        expect(trajectory1[i].z).toBe(trajectory2[i].z);
      }
    });

    it('should handle missing parameters gracefully', () => {
      // Test with missing velocity
      expect(() => calculateTrajectory({ angle: 45 })).not.toThrow();
      
      // Test with missing angle
      expect(() => calculateTrajectory({ velocity: 20 })).not.toThrow();
      
      // Test with empty object
      expect(() => calculateTrajectory({})).not.toThrow();
      
      // Test with null/undefined
      expect(() => calculateTrajectory(null)).not.toThrow();
      expect(() => calculateTrajectory(undefined)).not.toThrow();
    });

    it('should handle negative parameters', () => {
      const negativeVelocity = { velocity: -20, angle: 45 };
      const negativeAngle = { velocity: 20, angle: -45 };
      
      expect(() => calculateTrajectory(negativeVelocity)).not.toThrow();
      expect(() => calculateTrajectory(negativeAngle)).not.toThrow();
      
      const trajectory1 = calculateTrajectory(negativeVelocity);
      const trajectory2 = calculateTrajectory(negativeAngle);
      
      expect(Array.isArray(trajectory1)).toBe(true);
      expect(Array.isArray(trajectory2)).toBe(true);
    });

    it('should handle extreme values', () => {
      const extremeParams = { velocity: 1000, angle: 180 };
      
      expect(() => calculateTrajectory(extremeParams)).not.toThrow();
      
      const trajectory = calculateTrajectory(extremeParams);
      expect(Array.isArray(trajectory)).toBe(true);
      expect(trajectory.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complete impact scenario', () => {
      const diameter = 100;
      const density = 3000;
      const velocity = 20;
      const angle = 45;
      
      // Calculate energy
      const energy = calculateEnergyFromParams(diameter, density, velocity, angle);
      
      // Calculate trajectory
      const trajectory = calculateTrajectory({ velocity, angle });
      
      expect(energy).toBeGreaterThan(0);
      expect(trajectory.length).toBeGreaterThan(0);
      
      // Energy should be reasonable for this size asteroid
      expect(energy).toBeGreaterThan(0.1); // At least 0.1 megatons
      expect(energy).toBeLessThan(1000); // Less than 1000 megatons
      
      // Trajectory should show impact
      const lastPoint = trajectory[trajectory.length - 1];
      expect(lastPoint.z).toBeLessThan(100); // Should be near ground
    });

    it('should handle realistic asteroid scenarios', () => {
      // Chelyabinsk-like event
      const chelyabinskParams = {
        diameter: 20, // meters
        density: 3000, // kg/m³
        velocity: 19, // km/s
        angle: 18 // degrees (shallow)
      };
      
      const energy = calculateEnergyFromParams(
        chelyabinskParams.diameter,
        chelyabinskParams.density,
        chelyabinskParams.velocity,
        chelyabinskParams.angle
      );
      
      const trajectory = calculateTrajectory({
        velocity: chelyabinskParams.velocity,
        angle: chelyabinskParams.angle
      });
      
      // Should produce reasonable results
      expect(energy).toBeGreaterThan(0.01); // At least 0.01 megatons
      expect(energy).toBeLessThan(1); // Less than 1 megaton
      expect(trajectory.length).toBeGreaterThan(10);
    });

    it('should handle Tunguska-like event', () => {
      // Tunguska-like event
      const tunguskaParams = {
        diameter: 60, // meters
        density: 900, // kg/m³ (icy comet)
        velocity: 27, // km/s
        angle: 30 // degrees
      };
      
      const energy = calculateEnergyFromParams(
        tunguskaParams.diameter,
        tunguskaParams.density,
        tunguskaParams.velocity,
        tunguskaParams.angle
      );
      
      const trajectory = calculateTrajectory({
        velocity: tunguskaParams.velocity,
        angle: tunguskaParams.angle
      });
      
      // Should produce results in Tunguska range (10-15 megatons)
      expect(energy).toBeGreaterThan(5);
      expect(energy).toBeLessThan(50);
      expect(trajectory.length).toBeGreaterThan(10);
    });
  });
});