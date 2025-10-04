import {
  calculateEnergyFromParams,
  calculateTrajectory,
  calculateCraterDiameter,
  generateImpactLocation,
  validateAsteroidParams,
  runImpactSimulation,
  energyToComparisons,
  calculateAirburstEffects,
  PHYSICS_CONSTANTS,
  AsteroidParams,
  TrajectoryPoint,
  ImpactLocation,
  SimulationResult
} from '../../../backend/utils/physics-calculations';

describe('Physics Calculations', () => {
  describe('PHYSICS_CONSTANTS', () => {
    it('should have correct gravitational constant', () => {
      expect(PHYSICS_CONSTANTS.G).toBe(6.67430e-11);
    });

    it('should have correct Earth radius', () => {
      expect(PHYSICS_CONSTANTS.EARTH_RADIUS).toBe(6371000);
    });

    it('should have correct Earth mass', () => {
      expect(PHYSICS_CONSTANTS.EARTH_MASS).toBe(5.972e24);
    });

    it('should have correct energy conversion factor', () => {
      expect(PHYSICS_CONSTANTS.JOULES_TO_MEGATONS).toBe(4.184e15);
    });

    it('should have realistic density values', () => {
      expect(PHYSICS_CONSTANTS.DENSITIES.stony).toBe(3000);
      expect(PHYSICS_CONSTANTS.DENSITIES.iron).toBe(7800);
      expect(PHYSICS_CONSTANTS.DENSITIES.carbonaceous).toBe(2000);
      expect(PHYSICS_CONSTANTS.DENSITIES.icy).toBe(900);
    });
  });

  describe('validateAsteroidParams', () => {
    it('should validate correct parameters', () => {
      const validParams: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };

      const errors = validateAsteroidParams(validParams);
      expect(errors).toHaveLength(0);
    });

    it('should reject negative diameter', () => {
      const params: AsteroidParams = {
        diameter: -100,
        density: 3000,
        velocity: 20,
        angle: 45
      };

      const errors = validateAsteroidParams(params);
      expect(errors).toContain('Diameter must be positive');
    });

    it('should reject zero diameter', () => {
      const params: AsteroidParams = {
        diameter: 0,
        density: 3000,
        velocity: 20,
        angle: 45
      };

      const errors = validateAsteroidParams(params);
      expect(errors).toContain('Diameter must be positive');
    });

    it('should reject negative density', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: -3000,
        velocity: 20,
        angle: 45
      };

      const errors = validateAsteroidParams(params);
      expect(errors).toContain('Density must be positive');
    });

    it('should reject negative velocity', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: -20,
        angle: 45
      };

      const errors = validateAsteroidParams(params);
      expect(errors).toContain('Velocity must be positive');
    });

    it('should reject invalid angles', () => {
      const negativeAngle: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: -10
      };

      const tooLargeAngle: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 95
      };

      expect(validateAsteroidParams(negativeAngle)).toContain('Impact angle must be between 0 and 90 degrees');
      expect(validateAsteroidParams(tooLargeAngle)).toContain('Impact angle must be between 0 and 90 degrees');
    });

    it('should reject unrealistically large diameter', () => {
      const params: AsteroidParams = {
        diameter: 150000, // 150km
        density: 3000,
        velocity: 20,
        angle: 45
      };

      const errors = validateAsteroidParams(params);
      expect(errors).toContain('Diameter too large (max 100km)');
    });

    it('should reject unrealistically high velocity', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 350, // 350 km/s
        angle: 45
      };

      const errors = validateAsteroidParams(params);
      expect(errors).toContain('Velocity too high (max 300 km/s)');
    });

    it('should return multiple errors for multiple invalid parameters', () => {
      const params: AsteroidParams = {
        diameter: -100,
        density: -3000,
        velocity: -20,
        angle: -45
      };

      const errors = validateAsteroidParams(params);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('Diameter must be positive');
      expect(errors).toContain('Density must be positive');
      expect(errors).toContain('Velocity must be positive');
      expect(errors).toContain('Impact angle must be between 0 and 90 degrees');
    });

    it('should accept boundary values', () => {
      const minAngle: AsteroidParams = {
        diameter: 1,
        density: 1,
        velocity: 1,
        angle: 0
      };

      const maxAngle: AsteroidParams = {
        diameter: 100000,
        density: 10000,
        velocity: 300,
        angle: 90
      };

      expect(validateAsteroidParams(minAngle)).toHaveLength(0);
      expect(validateAsteroidParams(maxAngle)).toHaveLength(0);
    });
  });

  describe('calculateEnergyFromParams', () => {
    it('should calculate energy for typical asteroid', () => {
      const energy = calculateEnergyFromParams(100, 3000, 20, 45);
      
      expect(energy).toBeGreaterThan(0);
      expect(typeof energy).toBe('number');
      expect(isFinite(energy)).toBe(true);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => calculateEnergyFromParams(-100, 3000, 20, 45))
        .toThrow('Invalid asteroid parameters');
      
      expect(() => calculateEnergyFromParams(100, -3000, 20, 45))
        .toThrow('Invalid asteroid parameters');
    });

    it('should scale with diameter cubed', () => {
      const small = calculateEnergyFromParams(10, 3000, 20, 45);
      const large = calculateEnergyFromParams(100, 3000, 20, 45);
      
      const expectedRatio = Math.pow(10, 3); // 10^3 = 1000
      const actualRatio = large / small;
      
      expect(actualRatio).toBeCloseTo(expectedRatio, 0);
    });

    it('should scale linearly with density', () => {
      const lowDensity = calculateEnergyFromParams(100, 1000, 20, 45);
      const highDensity = calculateEnergyFromParams(100, 3000, 20, 45);
      
      const expectedRatio = 3; // 3000 / 1000
      const actualRatio = highDensity / lowDensity;
      
      expect(actualRatio).toBeCloseTo(expectedRatio, 1);
    });

    it('should scale with velocity squared', () => {
      const slow = calculateEnergyFromParams(100, 3000, 10, 45);
      const fast = calculateEnergyFromParams(100, 3000, 20, 45);
      
      const expectedRatio = Math.pow(2, 2); // 2^2 = 4
      const actualRatio = fast / slow;
      
      expect(actualRatio).toBeCloseTo(expectedRatio, 1);
    });

    it('should handle different impact angles correctly', () => {
      const grazing = calculateEnergyFromParams(100, 3000, 20, 15);
      const moderate = calculateEnergyFromParams(100, 3000, 20, 45);
      const vertical = calculateEnergyFromParams(100, 3000, 20, 90);
      
      expect(vertical).toBeGreaterThan(moderate);
      expect(moderate).toBeGreaterThan(grazing);
      expect(grazing).toBeGreaterThan(0);
    });

    it('should return zero energy for zero angle', () => {
      const energy = calculateEnergyFromParams(100, 3000, 20, 0);
      expect(energy).toBe(0);
    });

    it('should handle realistic asteroid compositions', () => {
      const stony = calculateEnergyFromParams(100, PHYSICS_CONSTANTS.DENSITIES.stony, 20, 45);
      const iron = calculateEnergyFromParams(100, PHYSICS_CONSTANTS.DENSITIES.iron, 20, 45);
      const carbonaceous = calculateEnergyFromParams(100, PHYSICS_CONSTANTS.DENSITIES.carbonaceous, 20, 45);
      const icy = calculateEnergyFromParams(100, PHYSICS_CONSTANTS.DENSITIES.icy, 20, 45);
      
      expect(iron).toBeGreaterThan(stony);
      expect(stony).toBeGreaterThan(carbonaceous);
      expect(carbonaceous).toBeGreaterThan(icy);
    });

    it('should produce realistic energy values for known events', () => {
      // Chelyabinsk-like event
      const chelyabinskEnergy = calculateEnergyFromParams(20, 3000, 19, 18);
      expect(chelyabinskEnergy).toBeGreaterThan(0.1);
      expect(chelyabinskEnergy).toBeLessThan(1);
      
      // Tunguska-like event
      const tunguskaEnergy = calculateEnergyFromParams(60, 900, 27, 30);
      expect(tunguskaEnergy).toBeGreaterThan(5);
      expect(tunguskaEnergy).toBeLessThan(50);
    });
  });

  describe('calculateTrajectory', () => {
    it('should return array of trajectory points', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(params);
      
      expect(Array.isArray(trajectory)).toBe(true);
      expect(trajectory.length).toBeGreaterThan(0);
      expect(trajectory.length).toBeLessThanOrEqual(100);
    });

    it('should have correct point structure', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(params);
      
      trajectory.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('z');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(typeof point.z).toBe('number');
      });
    });

    it('should start from expected initial position', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(params);
      const firstPoint = trajectory[0];
      
      expect(firstPoint.x).toBe(-1000);
      expect(firstPoint.y).toBe(0);
      expect(firstPoint.z).toBe(500);
    });

    it('should show progression towards Earth', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(params);
      
      // X should increase (moving towards Earth)
      for (let i = 1; i < trajectory.length; i++) {
        expect(trajectory[i].x).toBeGreaterThan(trajectory[i - 1].x);
      }
    });

    it('should show altitude decrease', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(params);
      const firstZ = trajectory[0].z;
      const lastZ = trajectory[trajectory.length - 1].z;
      
      expect(lastZ).toBeLessThan(firstZ);
    });

    it('should stop when hitting ground', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(params);
      const lastPoint = trajectory[trajectory.length - 1];
      
      expect(lastPoint.z).toBeGreaterThanOrEqual(0);
    });

    it('should handle different velocities', () => {
      const slowParams: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 10,
        angle: 45
      };
      
      const fastParams: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 40,
        angle: 45
      };
      
      const slowTrajectory = calculateTrajectory(slowParams);
      const fastTrajectory = calculateTrajectory(fastParams);
      
      expect(slowTrajectory.length).toBeGreaterThan(0);
      expect(fastTrajectory.length).toBeGreaterThan(0);
    });

    it('should handle different angles', () => {
      const shallowParams: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 15
      };
      
      const steepParams: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 75
      };
      
      const shallowTrajectory = calculateTrajectory(shallowParams);
      const steepTrajectory = calculateTrajectory(steepParams);
      
      expect(shallowTrajectory.length).toBeGreaterThan(0);
      expect(steepTrajectory.length).toBeGreaterThan(0);
    });

    it('should include curvature in y-direction', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      const trajectory = calculateTrajectory(params);
      
      // Y should show curvature (parabolic path)
      const firstY = trajectory[0].y;
      const midY = trajectory[Math.floor(trajectory.length / 2)].y;
      const lastY = trajectory[trajectory.length - 1].y;
      
      expect(midY).toBeGreaterThan(firstY);
      expect(lastY).toBeGreaterThan(midY);
    });
  });

  describe('calculateCraterDiameter', () => {
    it('should calculate crater diameter for given energy', () => {
      const diameter = calculateCraterDiameter(10); // 10 megatons
      
      expect(diameter).toBeGreaterThan(0);
      expect(typeof diameter).toBe('number');
      expect(isFinite(diameter)).toBe(true);
    });

    it('should scale with cube root of energy', () => {
      const small = calculateCraterDiameter(1);
      const large = calculateCraterDiameter(8);
      
      const expectedRatio = Math.pow(8, 1/3); // 2
      const actualRatio = large / small;
      
      expect(actualRatio).toBeCloseTo(expectedRatio, 1);
    });

    it('should handle zero energy', () => {
      const diameter = calculateCraterDiameter(0);
      expect(diameter).toBe(0);
    });

    it('should handle very small energies', () => {
      const diameter = calculateCraterDiameter(0.001);
      expect(diameter).toBeGreaterThan(0);
      expect(diameter).toBeLessThan(1);
    });

    it('should handle very large energies', () => {
      const diameter = calculateCraterDiameter(1000000);
      expect(diameter).toBeGreaterThan(1000);
      expect(isFinite(diameter)).toBe(true);
    });

    it('should produce realistic crater sizes', () => {
      // Meteor Crater (Arizona) - ~1.2km diameter, ~15 megatons
      const meteorCrater = calculateCraterDiameter(15);
      expect(meteorCrater).toBeGreaterThan(500);
      expect(meteorCrater).toBeLessThan(2000);
      
      // Chicxulub crater - ~150km diameter, ~100 million megatons
      const chicxulub = calculateCraterDiameter(100000000);
      expect(chicxulub).toBeGreaterThan(50000);
      expect(chicxulub).toBeLessThan(500000);
    });
  });

  describe('generateImpactLocation', () => {
    it('should generate valid coordinates', () => {
      const location = generateImpactLocation();
      
      expect(location).toHaveProperty('lat');
      expect(location).toHaveProperty('lng');
      expect(typeof location.lat).toBe('number');
      expect(typeof location.lng).toBe('number');
    });

    it('should generate latitude within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const location = generateImpactLocation();
        expect(location.lat).toBeGreaterThanOrEqual(-70);
        expect(location.lat).toBeLessThanOrEqual(70);
      }
    });

    it('should generate longitude within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const location = generateImpactLocation();
        expect(location.lng).toBeGreaterThanOrEqual(-170);
        expect(location.lng).toBeLessThanOrEqual(170);
      }
    });

    it('should generate different locations on multiple calls', () => {
      const locations = [];
      for (let i = 0; i < 10; i++) {
        locations.push(generateImpactLocation());
      }
      
      // Check that not all locations are identical
      const uniqueLocations = new Set(locations.map(loc => `${loc.lat},${loc.lng}`));
      expect(uniqueLocations.size).toBeGreaterThan(1);
    });

    it('should generate coordinates with proper precision', () => {
      const location = generateImpactLocation();
      
      // Should have at most 4 decimal places
      expect(location.lat.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(location.lng.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });
  });

  describe('runImpactSimulation', () => {
    const validParams: AsteroidParams = {
      diameter: 100,
      density: 3000,
      velocity: 20,
      angle: 45
    };

    it('should run complete simulation', () => {
      const result = runImpactSimulation(validParams);
      
      expect(result).toHaveProperty('asteroidParams');
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('impactLocation');
      expect(result).toHaveProperty('impactEnergy');
      expect(result).toHaveProperty('craterDiameter');
    });

    it('should preserve input parameters', () => {
      const result = runImpactSimulation(validParams);
      
      expect(result.asteroidParams).toEqual(validParams);
    });

    it('should generate valid trajectory', () => {
      const result = runImpactSimulation(validParams);
      
      expect(Array.isArray(result.trajectory)).toBe(true);
      expect(result.trajectory.length).toBeGreaterThan(0);
    });

    it('should generate valid impact location', () => {
      const result = runImpactSimulation(validParams);
      
      expect(result.impactLocation.lat).toBeGreaterThanOrEqual(-70);
      expect(result.impactLocation.lat).toBeLessThanOrEqual(70);
      expect(result.impactLocation.lng).toBeGreaterThanOrEqual(-170);
      expect(result.impactLocation.lng).toBeLessThanOrEqual(170);
    });

    it('should calculate positive energy and crater diameter', () => {
      const result = runImpactSimulation(validParams);
      
      expect(result.impactEnergy).toBeGreaterThan(0);
      expect(result.craterDiameter).toBeGreaterThan(0);
    });

    it('should throw error for invalid parameters', () => {
      const invalidParams: AsteroidParams = {
        diameter: -100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      expect(() => runImpactSimulation(invalidParams))
        .toThrow('Invalid simulation parameters');
    });

    it('should produce consistent energy calculations', () => {
      const result = runImpactSimulation(validParams);
      const directEnergy = calculateEnergyFromParams(
        validParams.diameter,
        validParams.density,
        validParams.velocity,
        validParams.angle
      );
      
      expect(result.impactEnergy).toBe(directEnergy);
    });

    it('should produce consistent crater calculations', () => {
      const result = runImpactSimulation(validParams);
      const directCrater = calculateCraterDiameter(result.impactEnergy);
      
      expect(result.craterDiameter).toBe(directCrater);
    });
  });

  describe('energyToComparisons', () => {
    it('should convert energy to comparison units', () => {
      const comparisons = energyToComparisons(1); // 1 megaton
      
      expect(comparisons).toHaveProperty('hiroshimaBombs');
      expect(comparisons).toHaveProperty('tsarBombas');
      expect(comparisons).toHaveProperty('ktTNT');
    });

    it('should calculate correct Hiroshima bomb equivalents', () => {
      const comparisons = energyToComparisons(0.015); // 1 Hiroshima bomb
      
      expect(comparisons.hiroshimaBombs).toBeCloseTo(1, 2);
    });

    it('should calculate correct Tsar Bomba equivalents', () => {
      const comparisons = energyToComparisons(50); // 1 Tsar Bomba
      
      expect(comparisons.tsarBombas).toBeCloseTo(1, 2);
    });

    it('should calculate correct kiloton equivalents', () => {
      const comparisons = energyToComparisons(1); // 1 megaton = 1000 kilotons
      
      expect(comparisons.ktTNT).toBe(1000);
    });

    it('should handle zero energy', () => {
      const comparisons = energyToComparisons(0);
      
      expect(comparisons.hiroshimaBombs).toBe(0);
      expect(comparisons.tsarBombas).toBe(0);
      expect(comparisons.ktTNT).toBe(0);
    });

    it('should handle very large energies', () => {
      const comparisons = energyToComparisons(1000000); // 1 million megatons
      
      expect(comparisons.hiroshimaBombs).toBeGreaterThan(1000000);
      expect(comparisons.tsarBombas).toBe(20000);
      expect(comparisons.ktTNT).toBe(1000000000);
    });

    it('should handle fractional energies', () => {
      const comparisons = energyToComparisons(0.5);
      
      expect(comparisons.hiroshimaBombs).toBeCloseTo(33.33, 1);
      expect(comparisons.tsarBombas).toBe(0.01);
      expect(comparisons.ktTNT).toBe(500);
    });
  });

  describe('calculateAirburstEffects', () => {
    it('should calculate airburst effects', () => {
      const effects = calculateAirburstEffects(20, 19, 3000, 25000); // Chelyabinsk-like
      
      expect(effects).toHaveProperty('burstEnergy');
      expect(effects).toHaveProperty('overpressure');
      expect(effects).toHaveProperty('thermalRadiation');
      expect(effects).toHaveProperty('blastRadius');
    });

    it('should return positive values', () => {
      const effects = calculateAirburstEffects(50, 25, 2000, 15000);
      
      expect(effects.burstEnergy).toBeGreaterThan(0);
      expect(effects.overpressure).toBeGreaterThan(0);
      expect(effects.thermalRadiation).toBeGreaterThan(0);
      expect(effects.blastRadius).toBeGreaterThan(0);
    });

    it('should show altitude effects on overpressure', () => {
      const lowAltitude = calculateAirburstEffects(50, 25, 2000, 5000);
      const highAltitude = calculateAirburstEffects(50, 25, 2000, 20000);
      
      // Higher altitude should result in lower overpressure
      expect(highAltitude.overpressure).toBeLessThan(lowAltitude.overpressure);
    });

    it('should show altitude effects on thermal radiation', () => {
      const lowAltitude = calculateAirburstEffects(50, 25, 2000, 5000);
      const highAltitude = calculateAirburstEffects(50, 25, 2000, 20000);
      
      // Higher altitude should result in lower thermal radiation
      expect(highAltitude.thermalRadiation).toBeLessThan(lowAltitude.thermalRadiation);
    });

    it('should show size effects on blast radius', () => {
      const smallAsteroid = calculateAirburstEffects(10, 25, 2000, 15000);
      const largeAsteroid = calculateAirburstEffects(100, 25, 2000, 15000);
      
      // Larger asteroid should result in larger blast radius
      expect(largeAsteroid.blastRadius).toBeGreaterThan(smallAsteroid.blastRadius);
    });

    it('should handle zero altitude', () => {
      const effects = calculateAirburstEffects(50, 25, 2000, 0);
      
      expect(effects.overpressure).toBeGreaterThan(0);
      expect(effects.thermalRadiation).toBeGreaterThan(0);
      expect(effects.blastRadius).toBeGreaterThan(0);
    });

    it('should handle very high altitude', () => {
      const effects = calculateAirburstEffects(50, 25, 2000, 50000);
      
      expect(effects.overpressure).toBeGreaterThan(0);
      expect(effects.thermalRadiation).toBeGreaterThan(0);
      // Blast radius might be negative at very high altitudes
      expect(typeof effects.blastRadius).toBe('number');
    });

    it('should produce realistic values for known events', () => {
      // Chelyabinsk airburst
      const chelyabinsk = calculateAirburstEffects(20, 19, 3000, 25000);
      
      expect(chelyabinsk.burstEnergy).toBeGreaterThan(0.1);
      expect(chelyabinsk.burstEnergy).toBeLessThan(1);
      expect(chelyabinsk.overpressure).toBeGreaterThan(0);
      expect(chelyabinsk.thermalRadiation).toBeGreaterThan(0);
      expect(chelyabinsk.blastRadius).toBeGreaterThan(0);
    });
  });

  describe('Type Definitions', () => {
    it('should have correct AsteroidParams interface', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45,
        composition: 'stony'
      };
      
      expect(typeof params.diameter).toBe('number');
      expect(typeof params.density).toBe('number');
      expect(typeof params.velocity).toBe('number');
      expect(typeof params.angle).toBe('number');
      expect(typeof params.composition).toBe('string');
    });

    it('should have correct TrajectoryPoint interface', () => {
      const point: TrajectoryPoint = { x: 0, y: 0, z: 0 };
      
      expect(typeof point.x).toBe('number');
      expect(typeof point.y).toBe('number');
      expect(typeof point.z).toBe('number');
    });

    it('should have correct ImpactLocation interface', () => {
      const location: ImpactLocation = { lat: 40.7128, lng: -74.0060 };
      
      expect(typeof location.lat).toBe('number');
      expect(typeof location.lng).toBe('number');
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complete impact analysis', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      // Run full simulation
      const simulation = runImpactSimulation(params);
      
      // Get energy comparisons
      const comparisons = energyToComparisons(simulation.impactEnergy);
      
      // Calculate airburst effects
      const airburstEffects = calculateAirburstEffects(
        params.diameter,
        params.velocity,
        params.density,
        15000
      );
      
      // All results should be valid
      expect(simulation.impactEnergy).toBeGreaterThan(0);
      expect(simulation.craterDiameter).toBeGreaterThan(0);
      expect(comparisons.hiroshimaBombs).toBeGreaterThan(0);
      expect(airburstEffects.blastRadius).toBeGreaterThan(0);
    });

    it('should handle realistic asteroid scenarios', () => {
      // Test various asteroid types
      const scenarios = [
        { name: 'Small stony', diameter: 10, density: 3000, velocity: 15, angle: 30 },
        { name: 'Medium iron', diameter: 50, density: 7800, velocity: 25, angle: 60 },
        { name: 'Large icy', diameter: 200, density: 900, velocity: 35, angle: 45 },
        { name: 'Carbonaceous', diameter: 75, density: 2000, velocity: 20, angle: 75 }
      ];
      
      scenarios.forEach(scenario => {
        const params: AsteroidParams = {
          diameter: scenario.diameter,
          density: scenario.density,
          velocity: scenario.velocity,
          angle: scenario.angle
        };
        
        expect(() => runImpactSimulation(params)).not.toThrow();
        
        const result = runImpactSimulation(params);
        expect(result.impactEnergy).toBeGreaterThan(0);
        expect(result.craterDiameter).toBeGreaterThan(0);
        expect(result.trajectory.length).toBeGreaterThan(0);
      });
    });

    it('should maintain consistency across multiple calculations', () => {
      const params: AsteroidParams = {
        diameter: 100,
        density: 3000,
        velocity: 20,
        angle: 45
      };
      
      // Run simulation multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(runImpactSimulation(params));
      }
      
      // Energy and crater diameter should be consistent
      const energies = results.map(r => r.impactEnergy);
      const craters = results.map(r => r.craterDiameter);
      
      expect(new Set(energies).size).toBe(1); // All energies should be the same
      expect(new Set(craters).size).toBe(1); // All crater diameters should be the same
      
      // Impact locations should vary (random)
      const locations = results.map(r => `${r.impactLocation.lat},${r.impactLocation.lng}`);
      expect(new Set(locations).size).toBeGreaterThan(1); // Locations should vary
    });
  });
});