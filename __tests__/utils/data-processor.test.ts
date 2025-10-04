import DataProcessor, {
  OrbitalParameters,
  ImpactParameters,
  ImpactResult,
  TrajectoryPoint,
} from '../../src/utils/data-processor';

describe('DataProcessor', () => {
  // Test data
  const mockOrbitalParams: OrbitalParameters = {
    semiMajorAxis: 7000, // km
    eccentricity: 0.1,
    inclination: 45, // degrees
    longitudeOfAscendingNode: 90, // degrees
    argumentOfPeriapsis: 30, // degrees
    meanAnomaly: 0, // degrees
  };

  const mockImpactParams: ImpactParameters = {
    diameter: 100, // meters
    density: 3500, // kg/m³ (stony)
    velocity: 20, // km/s
    angle: 45, // degrees
  };

  describe('calculateOrbitalPosition', () => {
    it('should calculate orbital position correctly', () => {
      const result = DataProcessor.calculateOrbitalPosition(mockOrbitalParams);
      
      expect(result).toHaveProperty('position');
      expect(result).toHaveProperty('velocity');
      expect(result.position).toHaveLength(3);
      expect(result.velocity).toHaveLength(3);
      
      // Position should be finite numbers
      result.position.forEach(coord => {
        expect(coord).toEqual(expect.any(Number));
        expect(isFinite(coord)).toBe(true);
      });
      
      result.velocity.forEach(vel => {
        expect(vel).toEqual(expect.any(Number));
        expect(isFinite(vel)).toBe(true);
      });
    });

    it('should handle time parameter correctly', () => {
      const result1 = DataProcessor.calculateOrbitalPosition(mockOrbitalParams, 0);
      const result2 = DataProcessor.calculateOrbitalPosition(mockOrbitalParams, 3600); // 1 hour
      
      // Positions should be different after time has passed
      expect(result1.position).not.toEqual(result2.position);
    });

    it('should handle circular orbit (e=0)', () => {
      const circularParams = { ...mockOrbitalParams, eccentricity: 0 };
      const result = DataProcessor.calculateOrbitalPosition(circularParams);
      
      expect(result.position).toHaveLength(3);
      expect(result.velocity).toHaveLength(3);
    });

    it('should handle highly eccentric orbit', () => {
      const eccentricParams = { ...mockOrbitalParams, eccentricity: 0.9 };
      const result = DataProcessor.calculateOrbitalPosition(eccentricParams);
      
      expect(result.position).toHaveLength(3);
      expect(result.velocity).toHaveLength(3);
    });

    it('should handle edge case angles', () => {
      const edgeParams = {
        ...mockOrbitalParams,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
      };
      
      const result = DataProcessor.calculateOrbitalPosition(edgeParams);
      expect(result.position).toHaveLength(3);
      expect(result.velocity).toHaveLength(3);
    });
  });

  describe('calculateImpactEffects', () => {
    it('should calculate impact effects correctly', () => {
      const result = DataProcessor.calculateImpactEffects(mockImpactParams);
      
      expect(result).toHaveProperty('energy');
      expect(result).toHaveProperty('energyMegatons');
      expect(result).toHaveProperty('craterDiameter');
      expect(result).toHaveProperty('craterDepth');
      expect(result).toHaveProperty('seismicMagnitude');
      expect(result).toHaveProperty('airBlastRadius');
      expect(result).toHaveProperty('thermalRadiationRadius');
      expect(result).toHaveProperty('ejectaBlanketRadius');
      
      // All values should be positive and finite
      Object.values(result).forEach(value => {
        expect(value).toBeGreaterThan(0);
        expect(value).toEqual(expect.any(Number));
        expect(isFinite(value)).toBe(true);
      });
    });

    it('should handle small impactor', () => {
      const smallImpactor = {
        ...mockImpactParams,
        diameter: 1, // 1 meter
      };
      
      const result = DataProcessor.calculateImpactEffects(smallImpactor);
      expect(result.energy).toBeGreaterThan(0);
      expect(result.craterDiameter).toBeGreaterThan(0);
    });

    it('should handle large impactor', () => {
      const largeImpactor = {
        ...mockImpactParams,
        diameter: 10000, // 10 km
      };
      
      const result = DataProcessor.calculateImpactEffects(largeImpactor);
      expect(result.energy).toBeGreaterThan(0);
      expect(result.energyMegatons).toBeGreaterThan(1000000); // Should be very large
    });

    it('should handle different impact angles', () => {
      const verticalImpact = { ...mockImpactParams, angle: 90 };
      const grazingImpact = { ...mockImpactParams, angle: 15 };
      
      const verticalResult = DataProcessor.calculateImpactEffects(verticalImpact);
      const grazingResult = DataProcessor.calculateImpactEffects(grazingImpact);
      
      // Vertical impact should generally create larger crater
      expect(verticalResult.craterDiameter).toBeGreaterThan(grazingResult.craterDiameter);
    });

    it('should handle different densities', () => {
      const ironImpactor = { ...mockImpactParams, density: 7870 };
      const icyImpactor = { ...mockImpactParams, density: 1000 };
      
      const ironResult = DataProcessor.calculateImpactEffects(ironImpactor);
      const icyResult = DataProcessor.calculateImpactEffects(icyImpactor);
      
      // Iron impactor should have more energy due to higher mass
      expect(ironResult.energy).toBeGreaterThan(icyResult.energy);
    });

    it('should handle custom target density', () => {
      const customTarget = {
        ...mockImpactParams,
        targetDensity: 1000, // Water
      };
      
      const result = DataProcessor.calculateImpactEffects(customTarget);
      expect(result.craterDiameter).toBeGreaterThan(0);
    });

    it('should handle high velocity impacts', () => {
      const highVelocity = { ...mockImpactParams, velocity: 70 }; // 70 km/s
      const result = DataProcessor.calculateImpactEffects(highVelocity);
      
      expect(result.energy).toBeGreaterThan(0);
      expect(result.energyMegatons).toBeGreaterThan(1);
    });
  });

  describe('simulateAtmosphericEntry', () => {
    it('should simulate atmospheric entry correctly', () => {
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        100, // 100 km altitude
        20,  // 20 km/s velocity
        45,  // 45 degree angle
        10,  // 10 meter diameter
        3500 // stony density
      );
      
      expect(Array.isArray(trajectory)).toBe(true);
      expect(trajectory.length).toBeGreaterThan(0);
      
      // Check first point
      const firstPoint = trajectory[0];
      expect(firstPoint).toHaveProperty('time');
      expect(firstPoint).toHaveProperty('position');
      expect(firstPoint).toHaveProperty('velocity');
      expect(firstPoint).toHaveProperty('altitude');
      expect(firstPoint).toHaveProperty('distanceToEarth');
      
      expect(firstPoint.altitude).toBeCloseTo(100, 1);
    });

    it('should show decreasing altitude over time', () => {
      const trajectory = DataProcessor.simulateAtmosphericEntry(50, 15, 60, 5, 2000);
      
      if (trajectory.length > 1) {
        for (let i = 1; i < trajectory.length; i++) {
          expect(trajectory[i].altitude).toBeLessThanOrEqual(trajectory[i-1].altitude);
        }
      }
    });

    it('should handle small meteoroid', () => {
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        80, 12, 30, 0.1, 1000 // Very small meteoroid
      );
      
      expect(trajectory.length).toBeGreaterThan(0);
    });

    it('should handle large meteoroid', () => {
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        120, 25, 45, 100, 5000 // Large meteoroid
      );
      
      expect(trajectory.length).toBeGreaterThan(0);
    });

    it('should handle custom time step', () => {
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        60, 18, 50, 8, 3000, 0.5 // 0.5 second time step
      );
      
      expect(trajectory.length).toBeGreaterThan(0);
      
      if (trajectory.length > 1) {
        expect(trajectory[1].time).toBe(0.5);
      }
    });

    it('should handle steep entry angle', () => {
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        90, 22, 85, 15, 4000 // Very steep entry
      );
      
      expect(trajectory.length).toBeGreaterThan(0);
    });

    it('should handle shallow entry angle', () => {
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        70, 16, 10, 12, 2500 // Very shallow entry
      );
      
      expect(trajectory.length).toBeGreaterThan(0);
    });
  });

  describe('calculateImpactProbability', () => {
    it('should calculate impact probability distribution', () => {
      const probabilities = DataProcessor.calculateImpactProbability(mockOrbitalParams);
      
      expect(Array.isArray(probabilities)).toBe(true);
      
      probabilities.forEach(point => {
        expect(point).toHaveProperty('latitude');
        expect(point).toHaveProperty('longitude');
        expect(point).toHaveProperty('probability');
        
        expect(point.latitude).toBeGreaterThanOrEqual(-90);
        expect(point.latitude).toBeLessThanOrEqual(90);
        expect(point.longitude).toBeGreaterThanOrEqual(-180);
        expect(point.longitude).toBeLessThanOrEqual(180);
        expect(point.probability).toBeGreaterThan(0);
        expect(point.probability).toBeLessThanOrEqual(1);
      });
    });

    it('should handle custom uncertainty', () => {
      const lowUncertainty = DataProcessor.calculateImpactProbability(mockOrbitalParams, 0.01);
      const highUncertainty = DataProcessor.calculateImpactProbability(mockOrbitalParams, 0.5);
      
      expect(Array.isArray(lowUncertainty)).toBe(true);
      expect(Array.isArray(highUncertainty)).toBe(true);
    });

    it('should handle circular orbit', () => {
      const circularParams = { ...mockOrbitalParams, eccentricity: 0 };
      const probabilities = DataProcessor.calculateImpactProbability(circularParams);
      
      expect(Array.isArray(probabilities)).toBe(true);
    });

    it('should handle highly eccentric orbit', () => {
      const eccentricParams = { ...mockOrbitalParams, eccentricity: 0.95 };
      const probabilities = DataProcessor.calculateImpactProbability(eccentricParams);
      
      expect(Array.isArray(probabilities)).toBe(true);
    });
  });

  describe('optimizeCalculation', () => {
    it('should execute function with optimization', () => {
      const testFunction = (a: number, b: number) => a + b;
      const result = DataProcessor.optimizeCalculation(testFunction, [5, 3]);
      
      expect(result).toBe(8);
    });

    it('should handle complex calculations', () => {
      const complexFunction = (x: number) => Math.sin(x) * Math.cos(x);
      const result = DataProcessor.optimizeCalculation(complexFunction, [Math.PI / 4]);
      
      expect(result).toBeCloseTo(0.5, 5);
    });

    it('should handle custom tolerance and iterations', () => {
      const testFunction = (x: number) => x * x;
      const result = DataProcessor.optimizeCalculation(
        testFunction, 
        [4], 
        1e-10, // Very tight tolerance
        200    // More iterations
      );
      
      expect(result).toBe(16);
    });
  });

  describe('formatNumber', () => {
    it('should format large numbers correctly', () => {
      expect(DataProcessor.formatNumber(1500000000000)).toBe('1.50T');
      expect(DataProcessor.formatNumber(2500000000)).toBe('2.50B');
      expect(DataProcessor.formatNumber(3500000)).toBe('3.50M');
      expect(DataProcessor.formatNumber(4500)).toBe('4.50K');
      expect(DataProcessor.formatNumber(123.456)).toBe('123.46');
    });

    it('should handle custom precision', () => {
      expect(DataProcessor.formatNumber(1234567, 0)).toBe('1M');
      expect(DataProcessor.formatNumber(1234567, 1)).toBe('1.2M');
      expect(DataProcessor.formatNumber(1234567, 3)).toBe('1.235M');
    });

    it('should handle small numbers', () => {
      expect(DataProcessor.formatNumber(0.123, 3)).toBe('0.123');
      expect(DataProcessor.formatNumber(1.23, 1)).toBe('1.2');
    });

    it('should handle zero', () => {
      expect(DataProcessor.formatNumber(0)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(DataProcessor.formatNumber(-1500000)).toBe('-1.50M');
      expect(DataProcessor.formatNumber(-123.45)).toBe('-123.45');
    });
  });

  describe('validateParameters', () => {
    it('should validate parameters correctly', () => {
      const params = {
        diameter: 100,
        velocity: 20,
        angle: 45,
      };
      
      const schema = {
        diameter: (value: any) => typeof value === 'number' && value > 0,
        velocity: (value: any) => typeof value === 'number' && value > 0,
        angle: (value: any) => typeof value === 'number' && value >= 0 && value <= 90,
      };
      
      const errors = DataProcessor.validateParameters(params, schema);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing parameters', () => {
      const params = {
        diameter: 100,
        // velocity missing
        angle: 45,
      };
      
      const schema = {
        diameter: (value: any) => typeof value === 'number' && value > 0,
        velocity: (value: any) => typeof value === 'number' && value > 0,
        angle: (value: any) => typeof value === 'number' && value >= 0 && value <= 90,
      };
      
      const errors = DataProcessor.validateParameters(params, schema);
      expect(errors).toContain('Missing parameter: velocity');
    });

    it('should detect invalid parameter values', () => {
      const params = {
        diameter: -100, // Invalid: negative
        velocity: 'fast', // Invalid: not a number
        angle: 120, // Invalid: > 90
      };
      
      const schema = {
        diameter: (value: any) => typeof value === 'number' && value > 0,
        velocity: (value: any) => typeof value === 'number' && value > 0,
        angle: (value: any) => typeof value === 'number' && value >= 0 && value <= 90,
      };
      
      const errors = DataProcessor.validateParameters(params, schema);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('diameter'))).toBe(true);
      expect(errors.some(error => error.includes('velocity'))).toBe(true);
      expect(errors.some(error => error.includes('angle'))).toBe(true);
    });

    it('should handle empty parameters', () => {
      const params = {};
      const schema = {
        required: (value: any) => value !== undefined,
      };
      
      const errors = DataProcessor.validateParameters(params, schema);
      expect(errors).toContain('Missing parameter: required');
    });

    it('should handle complex validation rules', () => {
      const params = {
        email: 'test@example.com',
        age: 25,
        score: 85,
      };
      
      const schema = {
        email: (value: any) => typeof value === 'string' && value.includes('@'),
        age: (value: any) => typeof value === 'number' && value >= 18 && value <= 120,
        score: (value: any) => typeof value === 'number' && value >= 0 && value <= 100,
      };
      
      const errors = DataProcessor.validateParameters(params, schema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme orbital parameters', () => {
      const extremeParams = {
        semiMajorAxis: 1000000, // Very large orbit
        eccentricity: 0.999, // Nearly parabolic
        inclination: 179, // Nearly retrograde
        longitudeOfAscendingNode: 359,
        argumentOfPeriapsis: 359,
        meanAnomaly: 359,
      };
      
      const result = DataProcessor.calculateOrbitalPosition(extremeParams);
      expect(result.position).toHaveLength(3);
      expect(result.velocity).toHaveLength(3);
    });

    it('should handle extreme impact parameters', () => {
      const extremeImpact = {
        diameter: 0.001, // 1mm
        density: 100000, // Very dense
        velocity: 100, // Very fast
        angle: 1, // Very shallow
      };
      
      const result = DataProcessor.calculateImpactEffects(extremeImpact);
      expect(result.energy).toBeGreaterThan(0);
    });

    it('should handle atmospheric entry edge cases', () => {
      // Very high altitude start
      const highAltitude = DataProcessor.simulateAtmosphericEntry(
        1000, 50, 45, 1, 1000
      );
      expect(highAltitude.length).toBeGreaterThan(0);
      
      // Very low velocity
      const lowVelocity = DataProcessor.simulateAtmosphericEntry(
        50, 1, 45, 1, 1000
      );
      expect(lowVelocity.length).toBeGreaterThan(0);
    });

    it('should handle number formatting edge cases', () => {
      expect(DataProcessor.formatNumber(Infinity)).toBe('Infinity');
      expect(DataProcessor.formatNumber(-Infinity)).toBe('-Infinity');
      expect(DataProcessor.formatNumber(NaN)).toBe('NaN');
    });
  });

  describe('Integration Tests', () => {
    it('should work with realistic asteroid scenario', () => {
      const asteroidParams: OrbitalParameters = {
        semiMajorAxis: 8000,
        eccentricity: 0.3,
        inclination: 15,
        longitudeOfAscendingNode: 120,
        argumentOfPeriapsis: 60,
        meanAnomaly: 180,
      };
      
      const impactParams: ImpactParameters = {
        diameter: 500,
        density: 2500,
        velocity: 25,
        angle: 60,
      };
      
      // Calculate orbital position
      const position = DataProcessor.calculateOrbitalPosition(asteroidParams);
      expect(position.position).toHaveLength(3);
      
      // Calculate impact effects
      const effects = DataProcessor.calculateImpactEffects(impactParams);
      expect(effects.energyMegatons).toBeGreaterThan(1000);
      
      // Simulate atmospheric entry
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        100, 25, 60, 500, 2500
      );
      expect(trajectory.length).toBeGreaterThan(0);
      
      // Calculate impact probability
      const probabilities = DataProcessor.calculateImpactProbability(asteroidParams);
      expect(probabilities.length).toBeGreaterThan(0);
    });

    it('should work with comet scenario', () => {
      const cometParams: OrbitalParameters = {
        semiMajorAxis: 15000,
        eccentricity: 0.8,
        inclination: 45,
        longitudeOfAscendingNode: 200,
        argumentOfPeriapsis: 90,
        meanAnomaly: 270,
      };
      
      const cometImpact: ImpactParameters = {
        diameter: 2000,
        density: 1000, // Icy composition
        velocity: 40,
        angle: 30,
      };
      
      const position = DataProcessor.calculateOrbitalPosition(cometParams);
      const effects = DataProcessor.calculateImpactEffects(cometImpact);
      const trajectory = DataProcessor.simulateAtmosphericEntry(
        150, 40, 30, 2000, 1000
      );
      
      expect(position.position).toHaveLength(3);
      expect(effects.energyMegatons).toBeGreaterThan(10000);
      expect(trajectory.length).toBeGreaterThan(0);
    });
  });
});