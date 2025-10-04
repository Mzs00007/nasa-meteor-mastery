import EnhancedPhysicsEngine from '../../src/utils/enhanced-physics-engine.js';

describe('EnhancedPhysicsEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new EnhancedPhysicsEngine();
  });

  describe('Constructor and Constants', () => {
    test('should initialize with correct physical constants', () => {
      expect(engine.constants.G).toBe(6.6743e-11);
      expect(engine.constants.SUN_MASS).toBe(1.989e30);
      expect(engine.constants.EARTH_MASS).toBe(5.972e24);
      expect(engine.constants.MOON_MASS).toBe(7.342e22);
      expect(engine.constants.JUPITER_MASS).toBe(1.898e27);
      expect(engine.constants.AU).toBe(1.496e11);
      expect(engine.constants.EARTH_RADIUS).toBe(6.371e6);
      expect(engine.constants.SUN_RADIUS).toBe(6.96e8);
      expect(engine.constants.MOON_DISTANCE).toBe(3.844e8);
      expect(engine.constants.JUPITER_DISTANCE).toBe(7.785e11);
      expect(engine.constants.C).toBe(299792458);
      expect(engine.constants.J2_EARTH).toBe(1.08263e-3);
      expect(engine.constants.SOLAR_PRESSURE).toBe(4.56e-6);
      expect(engine.constants.SCALE_FACTOR).toBe(1e-9);
    });

    test('should initialize celestial bodies with correct properties', () => {
      expect(engine.celestialBodies.sun.mass).toBe(engine.constants.SUN_MASS);
      expect(engine.celestialBodies.sun.position).toEqual({ x: 0, y: 0, z: 0 });
      
      expect(engine.celestialBodies.earth.mass).toBe(engine.constants.EARTH_MASS);
      expect(engine.celestialBodies.earth.position).toEqual({ x: engine.constants.AU, y: 0, z: 0 });
      
      expect(engine.celestialBodies.moon.mass).toBe(engine.constants.MOON_MASS);
      expect(engine.celestialBodies.moon.position).toEqual({
        x: engine.constants.AU + engine.constants.MOON_DISTANCE,
        y: 0,
        z: 0
      });
      
      expect(engine.celestialBodies.jupiter.mass).toBe(engine.constants.JUPITER_MASS);
      expect(engine.celestialBodies.jupiter.position).toEqual({ x: engine.constants.JUPITER_DISTANCE, y: 0, z: 0 });
    });
  });

  describe('calculateGravitationalForce', () => {
    test('should calculate gravitational force correctly', () => {
      const m1 = 1000; // kg
      const m2 = 2000; // kg
      const r = 10; // m
      
      const expectedForce = (engine.constants.G * m1 * m2) / (r * r);
      const force = engine.calculateGravitationalForce(m1, m2, r);
      
      expect(force).toBeCloseTo(expectedForce, 10);
    });

    test('should handle zero distance', () => {
      const force = engine.calculateGravitationalForce(1000, 2000, 0);
      expect(force).toBe(Infinity);
    });

    test('should handle zero masses', () => {
      const force = engine.calculateGravitationalForce(0, 2000, 10);
      expect(force).toBe(0);
    });
  });

  describe('calculateNBodyAcceleration', () => {
    test('should calculate acceleration from multiple bodies', () => {
      const position = { x: 1e7, y: 0, z: 0 };
      const mass = 1000;
      
      const acceleration = engine.calculateNBodyAcceleration(position, mass);
      
      expect(acceleration).toHaveProperty('x');
      expect(acceleration).toHaveProperty('y');
      expect(acceleration).toHaveProperty('z');
      expect(typeof acceleration.x).toBe('number');
      expect(typeof acceleration.y).toBe('number');
      expect(typeof acceleration.z).toBe('number');
    });

    test('should exclude specified body from calculation', () => {
      const position = { x: 1e7, y: 0, z: 0 };
      const mass = 1000;
      
      const accelWithSun = engine.calculateNBodyAcceleration(position, mass);
      const accelWithoutSun = engine.calculateNBodyAcceleration(position, mass, 'sun');
      
      expect(accelWithSun.x).not.toBe(accelWithoutSun.x);
    });

    test('should handle position at celestial body location', () => {
      const position = { x: 0, y: 0, z: 0 }; // At sun position
      const mass = 1000;
      
      const acceleration = engine.calculateNBodyAcceleration(position, mass);
      
      expect(acceleration.x).toBe(0);
      expect(acceleration.y).toBe(0);
      expect(acceleration.z).toBe(0);
    });
  });

  describe('calculateJ2Perturbation', () => {
    test('should calculate J2 perturbation correctly', () => {
      const position = { x: 7e6, y: 0, z: 1e6 };
      const velocity = { x: 0, y: 7500, z: 0 };
      
      const perturbation = engine.calculateJ2Perturbation(position, velocity);
      
      expect(perturbation).toHaveProperty('x');
      expect(perturbation).toHaveProperty('y');
      expect(perturbation).toHaveProperty('z');
      expect(typeof perturbation.x).toBe('number');
      expect(typeof perturbation.y).toBe('number');
      expect(typeof perturbation.z).toBe('number');
    });

    test('should handle zero position', () => {
      const position = { x: 0, y: 0, z: 0 };
      const velocity = { x: 0, y: 7500, z: 0 };
      
      const perturbation = engine.calculateJ2Perturbation(position, velocity);
      
      expect(perturbation.x).toBe(NaN);
      expect(perturbation.y).toBe(NaN);
      expect(perturbation.z).toBe(NaN);
    });
  });

  describe('calculateSolarRadiationPressure', () => {
    test('should calculate solar radiation pressure correctly', () => {
      const position = { x: 1.5e11, y: 0, z: 0 }; // 1 AU from sun
      const area = 10; // m²
      const mass = 1000; // kg
      const reflectivity = 0.3;
      
      const pressure = engine.calculateSolarRadiationPressure(position, area, mass, reflectivity);
      
      expect(pressure).toHaveProperty('x');
      expect(pressure).toHaveProperty('y');
      expect(pressure).toHaveProperty('z');
      expect(typeof pressure.x).toBe('number');
      expect(typeof pressure.y).toBe('number');
      expect(typeof pressure.z).toBe('number');
    });

    test('should use default reflectivity when not provided', () => {
      const position = { x: 1.5e11, y: 0, z: 0 };
      const area = 10;
      const mass = 1000;
      
      const pressure = engine.calculateSolarRadiationPressure(position, area, mass);
      
      expect(pressure).toHaveProperty('x');
      expect(pressure).toHaveProperty('y');
      expect(pressure).toHaveProperty('z');
    });

    test('should handle zero distance from sun', () => {
      const position = { x: 0, y: 0, z: 0 };
      const area = 10;
      const mass = 1000;
      
      const pressure = engine.calculateSolarRadiationPressure(position, area, mass);
      
      expect(pressure.x).toBe(NaN);
      expect(pressure.y).toBe(NaN);
      expect(pressure.z).toBe(NaN);
    });
  });

  describe('calculateAtmosphericDrag', () => {
    test('should calculate atmospheric drag for low altitude', () => {
      const position = { x: 6.471e6, y: 0, z: 0 }; // 100 km altitude
      const velocity = { x: 0, y: 7500, z: 0 };
      const area = 10;
      const mass = 1000;
      const dragCoefficient = 2.2;
      
      const drag = engine.calculateAtmosphericDrag(position, velocity, area, mass, dragCoefficient);
      
      expect(drag).toHaveProperty('x');
      expect(drag).toHaveProperty('y');
      expect(drag).toHaveProperty('z');
      expect(typeof drag.x).toBe('number');
      expect(typeof drag.y).toBe('number');
      expect(typeof drag.z).toBe('number');
    });

    test('should calculate atmospheric drag for medium altitude', () => {
      const position = { x: 6.671e6, y: 0, z: 0 }; // 300 km altitude
      const velocity = { x: 0, y: 7500, z: 0 };
      const area = 10;
      const mass = 1000;
      
      const drag = engine.calculateAtmosphericDrag(position, velocity, area, mass);
      
      expect(drag).toHaveProperty('x');
      expect(drag).toHaveProperty('y');
      expect(drag).toHaveProperty('z');
    });

    test('should return zero drag for high altitude', () => {
      const position = { x: 7.371e6, y: 0, z: 0 }; // 1000 km altitude
      const velocity = { x: 0, y: 7500, z: 0 };
      const area = 10;
      const mass = 1000;
      
      const drag = engine.calculateAtmosphericDrag(position, velocity, area, mass);
      
      expect(drag.x).toBe(0);
      expect(drag.y).toBe(0);
      expect(drag.z).toBe(0);
    });

    test('should use default drag coefficient when not provided', () => {
      const position = { x: 6.471e6, y: 0, z: 0 };
      const velocity = { x: 0, y: 7500, z: 0 };
      const area = 10;
      const mass = 1000;
      
      const drag = engine.calculateAtmosphericDrag(position, velocity, area, mass);
      
      expect(drag).toHaveProperty('x');
      expect(drag).toHaveProperty('y');
      expect(drag).toHaveProperty('z');
    });

    test('should handle zero velocity', () => {
      const position = { x: 6.471e6, y: 0, z: 0 };
      const velocity = { x: 0, y: 0, z: 0 };
      const area = 10;
      const mass = 1000;
      
      const drag = engine.calculateAtmosphericDrag(position, velocity, area, mass);
      
      expect(drag.x).toBe(0);
      expect(drag.y).toBe(0);
      expect(drag.z).toBe(0);
    });
  });

  describe('calculateThirdBodyPerturbations', () => {
    test('should calculate third body perturbations', () => {
      const position = { x: 7e6, y: 0, z: 0 };
      const mass = 1000;
      
      const perturbation = engine.calculateThirdBodyPerturbations(position, mass);
      
      expect(perturbation).toHaveProperty('x');
      expect(perturbation).toHaveProperty('y');
      expect(perturbation).toHaveProperty('z');
      expect(typeof perturbation.x).toBe('number');
      expect(typeof perturbation.y).toBe('number');
      expect(typeof perturbation.z).toBe('number');
    });

    test('should handle position at moon location', () => {
      const position = engine.celestialBodies.moon.position;
      const mass = 1000;
      
      const perturbation = engine.calculateThirdBodyPerturbations(position, mass);
      
      expect(perturbation).toHaveProperty('x');
      expect(perturbation).toHaveProperty('y');
      expect(perturbation).toHaveProperty('z');
    });

    test('should handle position far from Jupiter', () => {
      const position = { x: 1e15, y: 0, z: 0 }; // Very far from Jupiter
      const mass = 1000;
      
      const perturbation = engine.calculateThirdBodyPerturbations(position, mass);
      
      expect(perturbation).toHaveProperty('x');
      expect(perturbation).toHaveProperty('y');
      expect(perturbation).toHaveProperty('z');
    });
  });

  describe('calculateRelativisticCorrections', () => {
    test('should calculate relativistic corrections', () => {
      const position = { x: 1.5e11, y: 0, z: 0 };
      const velocity = { x: 0, y: 30000, z: 0 }; // High velocity
      
      const correction = engine.calculateRelativisticCorrections(position, velocity);
      
      expect(correction).toHaveProperty('x');
      expect(correction).toHaveProperty('y');
      expect(correction).toHaveProperty('z');
      expect(typeof correction.x).toBe('number');
      expect(typeof correction.y).toBe('number');
      expect(typeof correction.z).toBe('number');
    });

    test('should handle zero velocity', () => {
      const position = { x: 1.5e11, y: 0, z: 0 };
      const velocity = { x: 0, y: 0, z: 0 };
      
      const correction = engine.calculateRelativisticCorrections(position, velocity);
      
      expect(correction.x).toBe(0);
      expect(correction.y).toBe(0);
      expect(correction.z).toBe(0);
    });

    test('should handle zero position', () => {
      const position = { x: 0, y: 0, z: 0 };
      const velocity = { x: 0, y: 30000, z: 0 };
      
      const correction = engine.calculateRelativisticCorrections(position, velocity);
      
      expect(correction.x).toBe(Infinity);
      expect(correction.y).toBe(Infinity);
      expect(correction.z).toBe(Infinity);
    });
  });

  describe('calculateDerivatives', () => {
    test('should calculate derivatives for basic state', () => {
      const state = {
        position: { x: 7e6, y: 0, z: 0 },
        velocity: { x: 0, y: 7500, z: 0 }
      };
      const perturbations = {};
      
      const derivatives = engine.calculateDerivatives(state, perturbations);
      
      expect(derivatives).toHaveProperty('velocity');
      expect(derivatives).toHaveProperty('acceleration');
      expect(derivatives.velocity).toEqual(state.velocity);
      expect(derivatives.acceleration).toHaveProperty('x');
      expect(derivatives.acceleration).toHaveProperty('y');
      expect(derivatives.acceleration).toHaveProperty('z');
    });

    test('should include J2 perturbations when enabled', () => {
      const state = {
        position: { x: 7e6, y: 0, z: 1e6 },
        velocity: { x: 0, y: 7500, z: 0 }
      };
      const perturbations = { j2: true };
      
      const derivatives = engine.calculateDerivatives(state, perturbations);
      
      expect(derivatives).toHaveProperty('velocity');
      expect(derivatives).toHaveProperty('acceleration');
    });

    test('should include drag perturbations when enabled', () => {
      const state = {
        position: { x: 6.471e6, y: 0, z: 0 },
        velocity: { x: 0, y: 7500, z: 0 }
      };
      const perturbations = {
        drag: true,
        objectProperties: { area: 10, mass: 1000, dragCoefficient: 2.2 }
      };
      
      const derivatives = engine.calculateDerivatives(state, perturbations);
      
      expect(derivatives).toHaveProperty('velocity');
      expect(derivatives).toHaveProperty('acceleration');
    });

    test('should include solar pressure perturbations when enabled', () => {
      const state = {
        position: { x: 1.5e11, y: 0, z: 0 },
        velocity: { x: 0, y: 30000, z: 0 }
      };
      const perturbations = {
        solarPressure: true,
        objectProperties: { area: 10, mass: 1000, reflectivity: 0.3 }
      };
      
      const derivatives = engine.calculateDerivatives(state, perturbations);
      
      expect(derivatives).toHaveProperty('velocity');
      expect(derivatives).toHaveProperty('acceleration');
    });

    test('should include third body perturbations when enabled', () => {
      const state = {
        position: { x: 7e6, y: 0, z: 0 },
        velocity: { x: 0, y: 7500, z: 0 }
      };
      const perturbations = {
        thirdBody: true,
        objectProperties: { mass: 1000 }
      };
      
      const derivatives = engine.calculateDerivatives(state, perturbations);
      
      expect(derivatives).toHaveProperty('velocity');
      expect(derivatives).toHaveProperty('acceleration');
    });

    test('should include relativistic perturbations when enabled', () => {
      const state = {
        position: { x: 1.5e11, y: 0, z: 0 },
        velocity: { x: 0, y: 30000, z: 0 }
      };
      const perturbations = { relativistic: true };
      
      const derivatives = engine.calculateDerivatives(state, perturbations);
      
      expect(derivatives).toHaveProperty('velocity');
      expect(derivatives).toHaveProperty('acceleration');
    });
  });

  describe('integrateOrbit', () => {
    test('should integrate orbit using RK4 method', () => {
      const initialState = {
        position: { x: 7e6, y: 0, z: 0 },
        velocity: { x: 0, y: 7500, z: 0 }
      };
      const timeStep = 60; // 1 minute
      const steps = 10;
      const perturbations = {};
      
      const trajectory = engine.integrateOrbit(initialState, timeStep, steps, perturbations);
      
      expect(trajectory).toHaveLength(steps);
      expect(trajectory[0]).toHaveProperty('position');
      expect(trajectory[0]).toHaveProperty('velocity');
      expect(trajectory[0].position).toEqual(initialState.position);
      expect(trajectory[0].velocity).toEqual(initialState.velocity);
    });

    test('should handle integration with perturbations', () => {
      const initialState = {
        position: { x: 7e6, y: 0, z: 0 },
        velocity: { x: 0, y: 7500, z: 0 }
      };
      const timeStep = 60;
      const steps = 5;
      const perturbations = { j2: true };
      
      const trajectory = engine.integrateOrbit(initialState, timeStep, steps, perturbations);
      
      expect(trajectory).toHaveLength(steps);
      expect(trajectory[0]).toHaveProperty('position');
      expect(trajectory[0]).toHaveProperty('velocity');
    });

    test('should handle zero steps', () => {
      const initialState = {
        position: { x: 7e6, y: 0, z: 0 },
        velocity: { x: 0, y: 7500, z: 0 }
      };
      const timeStep = 60;
      const steps = 0;
      
      const trajectory = engine.integrateOrbit(initialState, timeStep, steps);
      
      expect(trajectory).toHaveLength(0);
    });
  });

  describe('calculatePerturbedOrbitalElements', () => {
    test('should calculate orbital elements', () => {
      const position = { x: 7e6, y: 0, z: 0 };
      const velocity = { x: 0, y: 7500, z: 0 };
      const perturbations = {};
      
      const elements = engine.calculatePerturbedOrbitalElements(position, velocity, perturbations);
      
      expect(elements).toHaveProperty('semiMajorAxis');
      expect(elements).toHaveProperty('eccentricity');
      expect(elements).toHaveProperty('inclination');
      expect(elements).toHaveProperty('period');
      expect(elements).toHaveProperty('apogee');
      expect(elements).toHaveProperty('perigee');
      expect(elements).toHaveProperty('perturbationEffects');
      expect(typeof elements.semiMajorAxis).toBe('number');
      expect(typeof elements.eccentricity).toBe('number');
      expect(typeof elements.inclination).toBe('number');
      expect(typeof elements.period).toBe('number');
    });

    test('should calculate J2 perturbation effects', () => {
      const position = { x: 7e6, y: 0, z: 1e6 };
      const velocity = { x: 0, y: 7500, z: 0 };
      const perturbations = { j2: true };
      
      const elements = engine.calculatePerturbedOrbitalElements(position, velocity, perturbations);
      
      expect(elements.perturbationEffects).toHaveProperty('nodesPrecession');
      expect(elements.perturbationEffects).toHaveProperty('apsidesPrecession');
      expect(typeof elements.perturbationEffects.nodesPrecession).toBe('number');
      expect(typeof elements.perturbationEffects.apsidesPrecession).toBe('number');
    });

    test('should handle circular orbit', () => {
      const r = 7e6;
      const v = Math.sqrt(engine.constants.G * engine.constants.EARTH_MASS / r);
      const position = { x: r, y: 0, z: 0 };
      const velocity = { x: 0, y: v, z: 0 };
      
      const elements = engine.calculatePerturbedOrbitalElements(position, velocity);
      
      expect(elements.eccentricity).toBeCloseTo(0, 5);
      expect(elements.apogee).toBeCloseTo(elements.perigee, 5);
    });
  });

  describe('orbitalElementsToStateVector', () => {
    test('should convert orbital elements to state vector', () => {
      const elements = {
        semiMajorAxis: 7e6,
        eccentricity: 0.1,
        inclination: 30,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0,
        trueAnomaly: 0
      };
      
      const state = engine.orbitalElementsToStateVector(elements);
      
      expect(state).toHaveProperty('position');
      expect(state).toHaveProperty('velocity');
      expect(state.position).toHaveProperty('x');
      expect(state.position).toHaveProperty('y');
      expect(state.position).toHaveProperty('z');
      expect(state.velocity).toHaveProperty('x');
      expect(state.velocity).toHaveProperty('y');
      expect(state.velocity).toHaveProperty('z');
    });

    test('should handle circular orbit conversion', () => {
      const elements = {
        semiMajorAxis: 7e6,
        eccentricity: 0,
        inclination: 0,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0,
        trueAnomaly: 0
      };
      
      const state = engine.orbitalElementsToStateVector(elements);
      
      expect(state.position.x).toBeCloseTo(elements.semiMajorAxis, 5);
      expect(state.position.y).toBeCloseTo(0, 5);
      expect(state.position.z).toBeCloseTo(0, 5);
    });

    test('should handle inclined orbit conversion', () => {
      const elements = {
        semiMajorAxis: 7e6,
        eccentricity: 0,
        inclination: 90,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0,
        trueAnomaly: 90
      };
      
      const state = engine.orbitalElementsToStateVector(elements);
      
      expect(state).toHaveProperty('position');
      expect(state).toHaveProperty('velocity');
    });
  });

  describe('predictOrbitalEvolution', () => {
    test('should predict orbital evolution', () => {
      const initialElements = {
        semiMajorAxis: 7e6,
        eccentricity: 0.1,
        inclination: 30,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0,
        trueAnomaly: 0
      };
      const timeSpan = 86400; // 1 day
      const perturbations = {};
      
      const evolution = engine.predictOrbitalEvolution(initialElements, timeSpan, perturbations);
      
      expect(evolution).toHaveLength(1000);
      expect(evolution[0]).toHaveProperty('time');
      expect(evolution[0]).toHaveProperty('elements');
      expect(evolution[0]).toHaveProperty('position');
      expect(evolution[0]).toHaveProperty('velocity');
      expect(evolution[0].time).toBe(0);
    });

    test('should handle evolution with perturbations', () => {
      const initialElements = {
        semiMajorAxis: 7e6,
        eccentricity: 0.1,
        inclination: 30
      };
      const timeSpan = 3600; // 1 hour
      const perturbations = { j2: true };
      
      const evolution = engine.predictOrbitalEvolution(initialElements, timeSpan, perturbations);
      
      expect(evolution).toHaveLength(1000);
      expect(evolution[0]).toHaveProperty('time');
      expect(evolution[0]).toHaveProperty('elements');
    });

    test('should handle zero time span', () => {
      const initialElements = {
        semiMajorAxis: 7e6,
        eccentricity: 0.1,
        inclination: 30
      };
      const timeSpan = 0;
      
      const evolution = engine.predictOrbitalEvolution(initialElements, timeSpan);
      
      expect(evolution).toHaveLength(1000);
      expect(evolution.every(point => point.time === 0)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(() => {
        engine.calculateGravitationalForce(null, 1000, 10);
      }).not.toThrow();
      
      expect(() => {
        engine.calculateNBodyAcceleration(null, 1000);
      }).toThrow();
    });

    test('should handle extreme values', () => {
      const extremePosition = { x: 1e20, y: 1e20, z: 1e20 };
      const extremeVelocity = { x: 1e10, y: 1e10, z: 1e10 };
      
      expect(() => {
        engine.calculateJ2Perturbation(extremePosition, extremeVelocity);
      }).not.toThrow();
      
      expect(() => {
        engine.calculateRelativisticCorrections(extremePosition, extremeVelocity);
      }).not.toThrow();
    });

    test('should handle negative values appropriately', () => {
      const negativePosition = { x: -7e6, y: -1e6, z: -1e6 };
      const negativeVelocity = { x: -1000, y: -7500, z: -1000 };
      
      expect(() => {
        engine.calculateJ2Perturbation(negativePosition, negativeVelocity);
      }).not.toThrow();
      
      expect(() => {
        engine.calculateAtmosphericDrag(negativePosition, negativeVelocity, 10, 1000);
      }).not.toThrow();
    });
  });
});