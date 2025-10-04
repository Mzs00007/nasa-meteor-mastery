/**
 * @jest-environment node
 */

// Mock window object for Node.js environment
global.window = {};

// Import the calculations file to load PhysicsCalculator to window
require('../../src/utils/calculations.js');

// Get PhysicsCalculator from window object
const { PhysicsCalculator, ImpactSimulator } = global.window;

describe('PhysicsCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new PhysicsCalculator();
  });

  describe('Constructor and Constants', () => {
    test('should initialize with correct constants', () => {
      expect(calculator.constants.G).toBe(6.6743e-11);
      expect(calculator.constants.EARTH_RADIUS).toBe(6371000);
      expect(calculator.constants.EARTH_MASS).toBe(5.972e24);
      expect(calculator.constants.ESCAPE_VELOCITY).toBe(11200);
      expect(calculator.constants.ATMOSPHERE_HEIGHT).toBe(100000);
    });

    test('should have correct material densities', () => {
      expect(calculator.constants.DENSITIES.stony).toBe(3000);
      expect(calculator.constants.DENSITIES.iron).toBe(7800);
      expect(calculator.constants.DENSITIES.carbonaceous).toBe(2000);
      expect(calculator.constants.DENSITIES.icy).toBe(900);
    });

    test('should have correct energy conversion constants', () => {
      expect(calculator.constants.JOULES_TO_MEGATONS).toBe(4.184e15);
      expect(calculator.constants.MEGATONS_TO_HIROSHIMA).toBe(0.015);
    });
  });

  describe('calculateMass', () => {
    test('should calculate mass for stony asteroid correctly', () => {
      const diameter = 100; // meters
      const mass = calculator.calculateMass(diameter, 'stony');
      
      // Expected: (4/3) * π * (50)³ * 3000
      const expectedVolume = (4/3) * Math.PI * Math.pow(50, 3);
      const expectedMass = expectedVolume * 3000;
      
      expect(mass).toBeCloseTo(expectedMass, 2);
    });

    test('should calculate mass for iron asteroid correctly', () => {
      const diameter = 50;
      const mass = calculator.calculateMass(diameter, 'iron');
      
      const expectedVolume = (4/3) * Math.PI * Math.pow(25, 3);
      const expectedMass = expectedVolume * 7800;
      
      expect(mass).toBeCloseTo(expectedMass, 2);
    });

    test('should default to stony density for unknown material', () => {
      const diameter = 100;
      const massUnknown = calculator.calculateMass(diameter, 'unknown');
      const massStony = calculator.calculateMass(diameter, 'stony');
      
      expect(massUnknown).toBe(massStony);
    });

    test('should handle zero diameter', () => {
      const mass = calculator.calculateMass(0);
      expect(mass).toBe(0);
    });
  });

  describe('calculateKineticEnergy', () => {
    test('should calculate kinetic energy correctly', () => {
      const mass = 1000; // kg
      const velocity = 20000; // m/s
      const energy = calculator.calculateKineticEnergy(mass, velocity);
      
      // Expected: 0.5 * 1000 * 20000²
      const expectedEnergy = 0.5 * mass * Math.pow(velocity, 2);
      
      expect(energy).toBe(expectedEnergy);
    });

    test('should handle zero velocity', () => {
      const energy = calculator.calculateKineticEnergy(1000, 0);
      expect(energy).toBe(0);
    });

    test('should handle zero mass', () => {
      const energy = calculator.calculateKineticEnergy(0, 20000);
      expect(energy).toBe(0);
    });
  });

  describe('energyToMegatons', () => {
    test('should convert energy to megatons correctly', () => {
      const energyJoules = 4.184e15; // 1 megaton equivalent
      const megatons = calculator.energyToMegatons(energyJoules);
      
      expect(megatons).toBeCloseTo(1, 6);
    });

    test('should handle zero energy', () => {
      const megatons = calculator.energyToMegatons(0);
      expect(megatons).toBe(0);
    });
  });

  describe('calculateCraterSize', () => {
    test('should calculate crater size for given energy', () => {
      const energyMegatons = 1;
      const impactAngle = 45;
      const crater = calculator.calculateCraterSize(energyMegatons, impactAngle);
      
      expect(crater).toHaveProperty('diameter');
      expect(crater).toHaveProperty('depth');
      expect(crater).toHaveProperty('volume');
      
      expect(crater.diameter).toBeGreaterThan(0);
      expect(crater.depth).toBeGreaterThan(0);
      expect(crater.volume).toBeGreaterThan(0);
      
      // Depth should be approximately 1/5 of diameter
      expect(crater.depth).toBeCloseTo(crater.diameter / 5, 1);
    });

    test('should handle different impact angles', () => {
      const energyMegatons = 1;
      const crater90 = calculator.calculateCraterSize(energyMegatons, 90);
      const crater45 = calculator.calculateCraterSize(energyMegatons, 45);
      const crater30 = calculator.calculateCraterSize(energyMegatons, 30);
      
      // Higher angle should create larger crater
      expect(crater90.diameter).toBeGreaterThan(crater45.diameter);
      expect(crater45.diameter).toBeGreaterThan(crater30.diameter);
    });

    test('should default to 45 degrees if no angle provided', () => {
      const energyMegatons = 1;
      const craterDefault = calculator.calculateCraterSize(energyMegatons);
      const crater45 = calculator.calculateCraterSize(energyMegatons, 45);
      
      expect(craterDefault.diameter).toBe(crater45.diameter);
    });
  });

  describe('calculateSeismicMagnitude', () => {
    test('should calculate seismic magnitude correctly', () => {
      const energyMegatons = 1;
      const magnitude = calculator.calculateSeismicMagnitude(energyMegatons);
      
      expect(magnitude).toBeGreaterThan(0);
      expect(magnitude).toBeLessThanOrEqual(10);
    });

    test('should apply depth adjustment for shallow impacts', () => {
      const energyMegatons = 1;
      const shallowMagnitude = calculator.calculateSeismicMagnitude(energyMegatons, 500);
      const deepMagnitude = calculator.calculateSeismicMagnitude(energyMegatons, 2000);
      
      expect(shallowMagnitude).toBeGreaterThan(deepMagnitude);
    });

    test('should cap magnitude at 10.0', () => {
      const energyMegatons = 1e10; // Very large energy
      const magnitude = calculator.calculateSeismicMagnitude(energyMegatons);
      
      expect(magnitude).toBeLessThanOrEqual(10.0);
    });
  });

  describe('calculateAirburstEffects', () => {
    test('should calculate airburst effects correctly', () => {
      const diameter = 100;
      const velocity = 20000;
      const densityType = 'stony';
      const altitude = 10000;
      
      const effects = calculator.calculateAirburstEffects(diameter, velocity, densityType, altitude);
      
      expect(effects).toHaveProperty('energy');
      expect(effects).toHaveProperty('energyMegatons');
      expect(effects).toHaveProperty('overpressure');
      expect(effects).toHaveProperty('thermalRadiation');
      expect(effects).toHaveProperty('blastRadius');
      
      expect(effects.energy).toBeGreaterThan(0);
      expect(effects.energyMegatons).toBeGreaterThan(0);
      expect(effects.overpressure).toBeGreaterThan(0);
      expect(effects.thermalRadiation).toBeGreaterThan(0);
      expect(effects.blastRadius).toBeGreaterThan(0);
    });
  });

  describe('calculateOverpressure', () => {
    test('should calculate overpressure correctly', () => {
      const energyMegatons = 1;
      const altitude = 10000;
      const overpressure = calculator.calculateOverpressure(energyMegatons, altitude);
      
      expect(overpressure).toBeGreaterThan(0);
      expect(typeof overpressure).toBe('number');
    });

    test('should decrease with higher altitude', () => {
      const energyMegatons = 1;
      const lowAltitude = calculator.calculateOverpressure(energyMegatons, 5000);
      const highAltitude = calculator.calculateOverpressure(energyMegatons, 15000);
      
      expect(lowAltitude).toBeGreaterThan(highAltitude);
    });
  });

  describe('calculateThermalRadiation', () => {
    test('should calculate thermal radiation correctly', () => {
      const energyMegatons = 1;
      const altitude = 10000;
      const radiation = calculator.calculateThermalRadiation(energyMegatons, altitude);
      
      expect(radiation).toBeGreaterThan(0);
      expect(typeof radiation).toBe('number');
    });

    test('should handle minimum altitude constraint', () => {
      const energyMegatons = 1;
      const lowAltitude = calculator.calculateThermalRadiation(energyMegatons, 500);
      const minAltitude = calculator.calculateThermalRadiation(energyMegatons, 1000);
      
      expect(lowAltitude).toBe(minAltitude);
    });
  });

  describe('calculateBlastRadius', () => {
    test('should calculate blast radius correctly', () => {
      const energyMegatons = 1;
      const altitude = 10000;
      const radius = calculator.calculateBlastRadius(energyMegatons, altitude);
      
      expect(radius).toBeGreaterThan(0);
      expect(typeof radius).toBe('number');
    });

    test('should decrease with higher altitude', () => {
      const energyMegatons = 1;
      const lowRadius = calculator.calculateBlastRadius(energyMegatons, 5000);
      const highRadius = calculator.calculateBlastRadius(energyMegatons, 15000);
      
      expect(lowRadius).toBeGreaterThan(highRadius);
    });
  });

  describe('calculateTsunamiEffects', () => {
    test('should calculate tsunami effects for ocean impact', () => {
      const energyMegatons = 10;
      const waterDepth = 4000;
      const distanceFromShore = 50000;
      
      const tsunami = calculator.calculateTsunamiEffects(energyMegatons, waterDepth, distanceFromShore);
      
      expect(tsunami).toHaveProperty('waveHeight');
      expect(tsunami).toHaveProperty('runupHeight');
      expect(tsunami).toHaveProperty('inundationDistance');
      
      expect(tsunami.waveHeight).toBeGreaterThan(0);
      expect(tsunami.runupHeight).toBeGreaterThan(0);
      expect(tsunami.inundationDistance).toBeGreaterThan(0);
    });
  });

  describe('calculateWaveHeight', () => {
    test('should calculate wave height correctly', () => {
      const energyMegatons = 1;
      const waterDepth = 1000;
      const waveHeight = calculator.calculateWaveHeight(energyMegatons, waterDepth);
      
      expect(waveHeight).toBeGreaterThan(0);
      expect(typeof waveHeight).toBe('number');
    });

    test('should increase with deeper water', () => {
      const energyMegatons = 1;
      const shallowWave = calculator.calculateWaveHeight(energyMegatons, 1000);
      const deepWave = calculator.calculateWaveHeight(energyMegatons, 4000);
      
      expect(deepWave).toBeGreaterThan(shallowWave);
    });
  });

  describe('calculateRunupHeight', () => {
    test('should calculate runup height correctly', () => {
      const waveHeight = 10;
      const distanceFromShore = 10000;
      const runupHeight = calculator.calculateRunupHeight(waveHeight, distanceFromShore);
      
      expect(runupHeight).toBeGreaterThan(0);
      expect(runupHeight).toBeLessThanOrEqual(waveHeight);
    });

    test('should decrease with distance from shore', () => {
      const waveHeight = 10;
      const nearRunup = calculator.calculateRunupHeight(waveHeight, 5000);
      const farRunup = calculator.calculateRunupHeight(waveHeight, 20000);
      
      expect(nearRunup).toBeGreaterThan(farRunup);
    });
  });

  describe('calculateInundationDistance', () => {
    test('should calculate inundation distance correctly', () => {
      const runupHeight = 5;
      const coastalSlope = 0.01;
      const distance = calculator.calculateInundationDistance(runupHeight, coastalSlope);
      
      expect(distance).toBe(runupHeight / coastalSlope);
      expect(distance).toBeGreaterThan(0);
    });

    test('should increase with steeper runup height', () => {
      const coastalSlope = 0.01;
      const lowDistance = calculator.calculateInundationDistance(2, coastalSlope);
      const highDistance = calculator.calculateInundationDistance(10, coastalSlope);
      
      expect(highDistance).toBeGreaterThan(lowDistance);
    });
  });

  describe('Orbital Mechanics', () => {
    const testPosition = { x: 7000000, y: 0, z: 0 };
    const testVelocity = { x: 0, y: 7500, z: 0 };

    test('should calculate orbital parameters', () => {
      const params = calculator.calculateOrbitalParameters(testPosition, testVelocity);
      
      expect(params).toHaveProperty('semiMajorAxis');
      expect(params).toHaveProperty('eccentricity');
      expect(params).toHaveProperty('inclination');
      expect(params).toHaveProperty('period');
      
      expect(typeof params.semiMajorAxis).toBe('number');
      expect(typeof params.eccentricity).toBe('number');
      expect(typeof params.inclination).toBe('number');
      expect(typeof params.period).toBe('number');
    });

    test('should calculate specific angular momentum', () => {
      const momentum = calculator.calculateSpecificAngularMomentum(testPosition, testVelocity);
      
      expect(momentum).toHaveProperty('x');
      expect(momentum).toHaveProperty('y');
      expect(momentum).toHaveProperty('z');
      
      expect(typeof momentum.x).toBe('number');
      expect(typeof momentum.y).toBe('number');
      expect(typeof momentum.z).toBe('number');
    });

    test('should calculate orbital period using Kepler\'s third law', () => {
      const semiMajorAxis = 7000000; // meters
      const period = calculator.calculateOrbitalPeriod(semiMajorAxis);
      
      expect(period).toBeGreaterThan(0);
      expect(typeof period).toBe('number');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle negative values gracefully', () => {
      expect(() => calculator.calculateMass(-100)).not.toThrow();
      expect(() => calculator.calculateKineticEnergy(-1000, 20000)).not.toThrow();
      expect(() => calculator.energyToMegatons(-1000)).not.toThrow();
    });

    test('should handle very large values', () => {
      const largeDiameter = 1e6;
      const largeVelocity = 1e6;
      
      expect(() => calculator.calculateMass(largeDiameter)).not.toThrow();
      expect(() => calculator.calculateKineticEnergy(1e12, largeVelocity)).not.toThrow();
    });

    test('should handle very small values', () => {
      const smallDiameter = 1e-6;
      const smallVelocity = 1e-6;
      
      expect(() => calculator.calculateMass(smallDiameter)).not.toThrow();
      expect(() => calculator.calculateKineticEnergy(1e-12, smallVelocity)).not.toThrow();
    });
  });
});

describe('ImpactSimulator', () => {
  let simulator;

  beforeEach(() => {
    simulator = new ImpactSimulator();
  });

  describe('constructor', () => {
    test('should initialize with PhysicsCalculator', () => {
      expect(simulator.physics).toBeInstanceOf(PhysicsCalculator);
      expect(simulator.currentScenario).toBeNull();
      expect(simulator.results).toEqual({});
    });
  });

  describe('runSimulation', () => {
    const mockScenario = {
      asteroid: {
        diameter: 100,
        velocity: 20000,
        densityType: 'stony'
      },
      impactLocation: {
        type: 'land',
        latitude: 40.7128,
        longitude: -74.0060,
        populationDensity: 1000
      }
    };

    test('should run complete land impact simulation', async () => {
      const results = await simulator.runSimulation(mockScenario);
      
      expect(results).toHaveProperty('basic');
      expect(results).toHaveProperty('summary');
      expect(results).toHaveProperty('recommendations');
      expect(results).toHaveProperty('timestamp');
      expect(results).toHaveProperty('scenario');
      
      expect(results.basic).toHaveProperty('mass');
      expect(results.basic).toHaveProperty('energy');
      expect(results.basic).toHaveProperty('energyMegatons');
      expect(results.basic).toHaveProperty('crater');
      expect(results.basic).toHaveProperty('seismic');
    });

    test('should run ocean impact simulation', async () => {
      const oceanScenario = {
        ...mockScenario,
        impactLocation: {
          type: 'ocean',
          waterDepth: 4000,
          populationDensity: 0
        }
      };

      const results = await simulator.runSimulation(oceanScenario);
      
      expect(results.basic).toHaveProperty('tsunami');
      expect(results.basic).toHaveProperty('seismic');
    });

    test('should run airburst simulation', async () => {
      const airburstScenario = {
        ...mockScenario,
        impactLocation: {
          type: 'atmosphere',
          altitude: 10000,
          populationDensity: 500
        }
      };

      const results = await simulator.runSimulation(airburstScenario);
      
      expect(results.basic).toHaveProperty('airburst');
      expect(results.basic.airburst).toHaveProperty('energy');
      expect(results.basic.airburst).toHaveProperty('overpressure');
    });

    test('should include mitigation results when strategy provided', async () => {
      const mitigationScenario = {
        ...mockScenario,
        mitigationStrategy: {
          type: 'deflection',
          impulse: 1e6,
          timeBeforeImpact: 86400
        }
      };

      const results = await simulator.runSimulation(mitigationScenario);
      
      expect(results.basic).toHaveProperty('mitigation');
      expect(results.basic.mitigation).toHaveProperty('deflection');
    });

    test('should handle kinetic impactor mitigation', async () => {
      const mitigationScenario = {
        ...mockScenario,
        mitigationStrategy: {
          type: 'kinetic_impactor',
          projectileMass: 1000,
          projectileVelocity: 10000
        }
      };

      const results = await simulator.runSimulation(mitigationScenario);
      
      expect(results.basic.mitigation).toHaveProperty('deltaV');
      expect(results.basic.mitigation).toHaveProperty('efficiency');
    });

    test('should handle nuclear mitigation', async () => {
      const mitigationScenario = {
        ...mockScenario,
        mitigationStrategy: {
          type: 'nuclear',
          yieldMegatons: 10,
          distance: 1000
        }
      };

      const results = await simulator.runSimulation(mitigationScenario);
      
      expect(results.basic.mitigation).toHaveProperty('impulse');
      expect(results.basic.mitigation).toHaveProperty('effectiveness');
    });

    test('should handle simulation errors', async () => {
      const invalidScenario = null;
      
      await expect(simulator.runSimulation(invalidScenario)).rejects.toThrow('Failed to run simulation');
    });
  });

  describe('calculateBasicParameters', () => {
    test('should calculate basic parameters correctly', () => {
      simulator.currentScenario = {
        asteroid: {
          diameter: 100,
          velocity: 20000,
          densityType: 'stony'
        }
      };

      simulator.calculateBasicParameters();
      
      expect(simulator.results).toHaveProperty('mass');
      expect(simulator.results).toHaveProperty('energy');
      expect(simulator.results).toHaveProperty('energyMegatons');
      expect(simulator.results).toHaveProperty('hiroshimaEquivalents');
      
      expect(simulator.results.mass).toBeGreaterThan(0);
      expect(simulator.results.energy).toBeGreaterThan(0);
    });
  });

  describe('assessSeverity', () => {
    test('should assess severity correctly', () => {
      expect(simulator.assessSeverity(20000)).toBe('Extinction Level Event');
      expect(simulator.assessSeverity(5000)).toBe('Global Catastrophe');
      expect(simulator.assessSeverity(500)).toBe('Regional Disaster');
      expect(simulator.assessSeverity(50)).toBe('Local Catastrophe');
      expect(simulator.assessSeverity(5)).toBe('Significant Event');
      expect(simulator.assessSeverity(0.5)).toBe('Minor Event');
    });
  });

  describe('calculateWarningTime', () => {
    test('should calculate warning time', () => {
      simulator.currentScenario = {
        asteroid: {
          velocity: 20000 // m/s
        }
      };

      const warningTime = simulator.calculateWarningTime();
      expect(warningTime).toBeGreaterThan(0);
    });
  });

  describe('generateRecommendations', () => {
    test('should generate appropriate recommendations for large impacts', () => {
      simulator.results = { energyMegatons: 5000 };
      simulator.currentScenario = {
        impactLocation: { type: 'land' }
      };

      const recommendations = simulator.generateRecommendations();
      
      expect(recommendations).toContain('Global evacuation planning needed');
      expect(recommendations).toContain('International cooperation required');
    });

    test('should generate tsunami recommendations for ocean impacts', () => {
      simulator.results = { energyMegatons: 100 };
      simulator.currentScenario = {
        impactLocation: { type: 'ocean' }
      };

      const recommendations = simulator.generateRecommendations();
      
      expect(recommendations).toContain('Coastal evacuation advised');
      expect(recommendations).toContain('Tsunami warning systems activation');
    });

    test('should generate seismic recommendations for high magnitude', () => {
      simulator.results = { 
        energyMegatons: 100,
        seismic: 8.5
      };
      simulator.currentScenario = {
        impactLocation: { type: 'land' }
      };

      const recommendations = simulator.generateRecommendations();
      
      expect(recommendations).toContain('Seismic retrofitting of critical infrastructure');
    });
  });
});