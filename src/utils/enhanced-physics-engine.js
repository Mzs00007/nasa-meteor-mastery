// Enhanced Physics Engine with Gravitational Perturbations and N-Body Dynamics
// NASA-grade orbital mechanics calculations

export class EnhancedPhysicsEngine {
  constructor() {
    // Physical constants
    this.constants = {
      G: 6.6743e-11, // Gravitational constant (m³/kg·s²)
      SUN_MASS: 1.989e30, // Solar mass (kg)
      EARTH_MASS: 5.972e24, // Earth mass (kg)
      MOON_MASS: 7.342e22, // Lunar mass (kg)
      JUPITER_MASS: 1.898e27, // Jupiter mass (kg)
      AU: 1.496e11, // Astronomical Unit (m)
      EARTH_RADIUS: 6.371e6, // Earth radius (m)
      SUN_RADIUS: 6.96e8, // Sun radius (m)
      MOON_DISTANCE: 3.844e8, // Earth-Moon distance (m)
      JUPITER_DISTANCE: 7.785e11, // Jupiter distance (m)
      C: 299792458, // Speed of light (m/s)
      J2_EARTH: 1.08263e-3, // Earth's J2 coefficient
      SOLAR_PRESSURE: 4.56e-6, // Solar radiation pressure (N/m²)
      SCALE_FACTOR: 1e-9, // Visualization scale factor
    };

    // Celestial body positions (simplified)
    this.celestialBodies = {
      sun: { mass: this.constants.SUN_MASS, position: { x: 0, y: 0, z: 0 } },
      earth: {
        mass: this.constants.EARTH_MASS,
        position: { x: this.constants.AU, y: 0, z: 0 },
      },
      moon: {
        mass: this.constants.MOON_MASS,
        position: {
          x: this.constants.AU + this.constants.MOON_DISTANCE,
          y: 0,
          z: 0,
        },
      },
      jupiter: {
        mass: this.constants.JUPITER_MASS,
        position: { x: this.constants.JUPITER_DISTANCE, y: 0, z: 0 },
      },
    };
  }

  /**
   * Calculate gravitational force between two bodies
   */
  calculateGravitationalForce(m1, m2, r) {
    return (this.constants.G * m1 * m2) / (r * r);
  }

  /**
   * Calculate gravitational acceleration from multiple bodies (N-body problem)
   */
  calculateNBodyAcceleration(position, mass, excludeBody = null) {
    const acceleration = { x: 0, y: 0, z: 0 };

    for (const [bodyName, body] of Object.entries(this.celestialBodies)) {
      if (bodyName === excludeBody) {
        continue;
      }

      const dx = body.position.x - position.x;
      const dy = body.position.y - position.y;
      const dz = body.position.z - position.z;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (r > 0) {
        const force = this.calculateGravitationalForce(body.mass, mass, r);
        const acc = force / mass;

        acceleration.x += acc * (dx / r);
        acceleration.y += acc * (dy / r);
        acceleration.z += acc * (dz / r);
      }
    }

    return acceleration;
  }

  /**
   * Calculate J2 perturbation (Earth's oblateness effect)
   */
  calculateJ2Perturbation(position, velocity) {
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const Re = this.constants.EARTH_RADIUS;
    const J2 = this.constants.J2_EARTH;
    const mu = this.constants.G * this.constants.EARTH_MASS;

    const factor = (-1.5 * J2 * mu * Re ** 2) / r ** 5;

    const perturbation = {
      x: factor * position.x * ((5 * position.z ** 2) / r ** 2 - 1),
      y: factor * position.y * ((5 * position.z ** 2) / r ** 2 - 1),
      z: factor * position.z * ((5 * position.z ** 2) / r ** 2 - 3),
    };

    return perturbation;
  }

  /**
   * Calculate solar radiation pressure perturbation
   */
  calculateSolarRadiationPressure(position, area, mass, reflectivity = 0.3) {
    const sunDirection = {
      x: -position.x,
      y: -position.y,
      z: -position.z,
    };

    const distance = Math.sqrt(
      sunDirection.x ** 2 + sunDirection.y ** 2 + sunDirection.z ** 2
    );
    const unitVector = {
      x: sunDirection.x / distance,
      y: sunDirection.y / distance,
      z: sunDirection.z / distance,
    };

    // Solar flux at distance
    const solarFlux =
      (this.constants.SOLAR_PRESSURE * this.constants.AU ** 2) / distance ** 2;
    const force = solarFlux * area * (1 + reflectivity);
    const acceleration = force / mass;

    return {
      x: acceleration * unitVector.x,
      y: acceleration * unitVector.y,
      z: acceleration * unitVector.z,
    };
  }

  /**
   * Calculate atmospheric drag perturbation
   */
  calculateAtmosphericDrag(
    position,
    velocity,
    area,
    mass,
    dragCoefficient = 2.2
  ) {
    const altitude =
      Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2) -
      this.constants.EARTH_RADIUS;

    // Simplified atmospheric density model
    let density = 0;
    if (altitude < 100000) {
      // Below 100 km
      density = 1.225 * Math.exp(-altitude / 8400); // kg/m³
    } else if (altitude < 500000) {
      // 100-500 km
      density = 3.614e-13 * Math.exp(-altitude / 42000);
    }

    if (density > 0) {
      const speed = Math.sqrt(
        velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
      );
      const dragForce = 0.5 * density * speed * speed * dragCoefficient * area;
      const dragAcceleration = dragForce / mass;

      const unitVelocity = {
        x: velocity.x / speed,
        y: velocity.y / speed,
        z: velocity.z / speed,
      };

      return {
        x: -dragAcceleration * unitVelocity.x,
        y: -dragAcceleration * unitVelocity.y,
        z: -dragAcceleration * unitVelocity.z,
      };
    }

    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Calculate third-body perturbations (Moon, Jupiter effects)
   */
  calculateThirdBodyPerturbations(position, mass) {
    const perturbation = { x: 0, y: 0, z: 0 };

    // Moon perturbation
    const moonPos = this.celestialBodies.moon.position;
    const moonMass = this.celestialBodies.moon.mass;

    const rMoon = Math.sqrt(
      (position.x - moonPos.x) ** 2 +
        (position.y - moonPos.y) ** 2 +
        (position.z - moonPos.z) ** 2
    );

    const rEarthMoon = Math.sqrt(
      moonPos.x ** 2 + moonPos.y ** 2 + moonPos.z ** 2
    );

    if (rMoon > 0) {
      const moonAccel = (this.constants.G * moonMass) / rMoon ** 3;
      const earthMoonAccel = (this.constants.G * moonMass) / rEarthMoon ** 3;

      perturbation.x +=
        moonAccel * (moonPos.x - position.x) - earthMoonAccel * moonPos.x;
      perturbation.y +=
        moonAccel * (moonPos.y - position.y) - earthMoonAccel * moonPos.y;
      perturbation.z +=
        moonAccel * (moonPos.z - position.z) - earthMoonAccel * moonPos.z;
    }

    // Jupiter perturbation (simplified)
    const jupiterPos = this.celestialBodies.jupiter.position;
    const jupiterMass = this.celestialBodies.jupiter.mass;

    const rJupiter = Math.sqrt(
      (position.x - jupiterPos.x) ** 2 +
        (position.y - jupiterPos.y) ** 2 +
        (position.z - jupiterPos.z) ** 2
    );

    if (rJupiter > 0 && rJupiter < this.constants.AU * 10) {
      // Only if within influence
      const jupiterAccel = (this.constants.G * jupiterMass) / rJupiter ** 3;

      perturbation.x += jupiterAccel * (jupiterPos.x - position.x) * 0.1; // Reduced effect
      perturbation.y += jupiterAccel * (jupiterPos.y - position.y) * 0.1;
      perturbation.z += jupiterAccel * (jupiterPos.z - position.z) * 0.1;
    }

    return perturbation;
  }

  /**
   * Calculate relativistic corrections (General Relativity effects)
   */
  calculateRelativisticCorrections(position, velocity) {
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const mu = this.constants.G * this.constants.SUN_MASS;
    const c = this.constants.C;

    // Schwarzschild correction
    const schwarzschildFactor = (3 * mu) / (c * c * r);

    // Velocity-dependent correction
    const velocityFactor = (v * v) / (c * c);

    const correction = schwarzschildFactor + velocityFactor;

    return {
      x: (correction * velocity.x) / v,
      y: (correction * velocity.y) / v,
      z: (correction * velocity.z) / v,
    };
  }

  /**
   * Integrate orbital motion using Runge-Kutta 4th order method
   */
  integrateOrbit(initialState, timeStep, steps, perturbations = {}) {
    const trajectory = [];
    const state = { ...initialState };

    for (let i = 0; i < steps; i++) {
      trajectory.push({ ...state });

      // RK4 integration
      const k1 = this.calculateDerivatives(state, perturbations);

      const state2 = {
        position: {
          x: state.position.x + (k1.velocity.x * timeStep) / 2,
          y: state.position.y + (k1.velocity.y * timeStep) / 2,
          z: state.position.z + (k1.velocity.z * timeStep) / 2,
        },
        velocity: {
          x: state.velocity.x + (k1.acceleration.x * timeStep) / 2,
          y: state.velocity.y + (k1.acceleration.y * timeStep) / 2,
          z: state.velocity.z + (k1.acceleration.z * timeStep) / 2,
        },
      };
      const k2 = this.calculateDerivatives(state2, perturbations);

      const state3 = {
        position: {
          x: state.position.x + (k2.velocity.x * timeStep) / 2,
          y: state.position.y + (k2.velocity.y * timeStep) / 2,
          z: state.position.z + (k2.velocity.z * timeStep) / 2,
        },
        velocity: {
          x: state.velocity.x + (k2.acceleration.x * timeStep) / 2,
          y: state.velocity.y + (k2.acceleration.y * timeStep) / 2,
          z: state.velocity.z + (k2.acceleration.z * timeStep) / 2,
        },
      };
      const k3 = this.calculateDerivatives(state3, perturbations);

      const state4 = {
        position: {
          x: state.position.x + k3.velocity.x * timeStep,
          y: state.position.y + k3.velocity.y * timeStep,
          z: state.position.z + k3.velocity.z * timeStep,
        },
        velocity: {
          x: state.velocity.x + k3.acceleration.x * timeStep,
          y: state.velocity.y + k3.acceleration.y * timeStep,
          z: state.velocity.z + k3.acceleration.z * timeStep,
        },
      };
      const k4 = this.calculateDerivatives(state4, perturbations);

      // Update state
      state.position.x +=
        (timeStep *
          (k1.velocity.x +
            2 * k2.velocity.x +
            2 * k3.velocity.x +
            k4.velocity.x)) /
        6;
      state.position.y +=
        (timeStep *
          (k1.velocity.y +
            2 * k2.velocity.y +
            2 * k3.velocity.y +
            k4.velocity.y)) /
        6;
      state.position.z +=
        (timeStep *
          (k1.velocity.z +
            2 * k2.velocity.z +
            2 * k3.velocity.z +
            k4.velocity.z)) /
        6;

      state.velocity.x +=
        (timeStep *
          (k1.acceleration.x +
            2 * k2.acceleration.x +
            2 * k3.acceleration.x +
            k4.acceleration.x)) /
        6;
      state.velocity.y +=
        (timeStep *
          (k1.acceleration.y +
            2 * k2.acceleration.y +
            2 * k3.acceleration.y +
            k4.acceleration.y)) /
        6;
      state.velocity.z +=
        (timeStep *
          (k1.acceleration.z +
            2 * k2.acceleration.z +
            2 * k3.acceleration.z +
            k4.acceleration.z)) /
        6;
    }

    return trajectory;
  }

  /**
   * Calculate derivatives for numerical integration
   */
  calculateDerivatives(state, perturbations) {
    const { position, velocity } = state;

    // Primary gravitational acceleration (two-body)
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const mu = this.constants.G * this.constants.EARTH_MASS;
    const primaryAccel = -mu / r ** 3;

    const acceleration = {
      x: primaryAccel * position.x,
      y: primaryAccel * position.y,
      z: primaryAccel * position.z,
    };

    // Add perturbations if enabled
    if (perturbations.j2) {
      const j2Pert = this.calculateJ2Perturbation(position, velocity);
      acceleration.x += j2Pert.x;
      acceleration.y += j2Pert.y;
      acceleration.z += j2Pert.z;
    }

    if (perturbations.drag && perturbations.objectProperties) {
      const dragPert = this.calculateAtmosphericDrag(
        position,
        velocity,
        perturbations.objectProperties.area,
        perturbations.objectProperties.mass,
        perturbations.objectProperties.dragCoefficient
      );
      acceleration.x += dragPert.x;
      acceleration.y += dragPert.y;
      acceleration.z += dragPert.z;
    }

    if (perturbations.solarPressure && perturbations.objectProperties) {
      const solarPert = this.calculateSolarRadiationPressure(
        position,
        perturbations.objectProperties.area,
        perturbations.objectProperties.mass,
        perturbations.objectProperties.reflectivity
      );
      acceleration.x += solarPert.x;
      acceleration.y += solarPert.y;
      acceleration.z += solarPert.z;
    }

    if (perturbations.thirdBody) {
      const thirdBodyPert = this.calculateThirdBodyPerturbations(
        position,
        perturbations.objectProperties?.mass || 1000
      );
      acceleration.x += thirdBodyPert.x;
      acceleration.y += thirdBodyPert.y;
      acceleration.z += thirdBodyPert.z;
    }

    if (perturbations.relativistic) {
      const relPert = this.calculateRelativisticCorrections(position, velocity);
      acceleration.x += relPert.x;
      acceleration.y += relPert.y;
      acceleration.z += relPert.z;
    }

    return {
      velocity: { ...velocity },
      acceleration,
    };
  }

  /**
   * Calculate orbital elements with perturbations
   */
  calculatePerturbedOrbitalElements(position, velocity, perturbations = {}) {
    const mu = this.constants.G * this.constants.EARTH_MASS;
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

    // Angular momentum vector
    const h = {
      x: position.y * velocity.z - position.z * velocity.y,
      y: position.z * velocity.x - position.x * velocity.z,
      z: position.x * velocity.y - position.y * velocity.x,
    };
    const h_mag = Math.sqrt(h.x ** 2 + h.y ** 2 + h.z ** 2);

    // Eccentricity vector
    const e_vec = {
      x: (velocity.y * h.z - velocity.z * h.y) / mu - position.x / r,
      y: (velocity.z * h.x - velocity.x * h.z) / mu - position.y / r,
      z: (velocity.x * h.y - velocity.y * h.x) / mu - position.z / r,
    };
    const eccentricity = Math.sqrt(e_vec.x ** 2 + e_vec.y ** 2 + e_vec.z ** 2);

    // Semi-major axis
    const energy = v ** 2 / 2 - mu / r;
    const semiMajorAxis = -mu / (2 * energy);

    // Inclination
    const inclination = Math.acos(h.z / h_mag);

    // Calculate perturbation effects on orbital elements
    const perturbationEffects = {};

    if (perturbations.j2) {
      // J2 causes precession of nodes and apsides
      const n = Math.sqrt(mu / semiMajorAxis ** 3); // Mean motion
      const p = semiMajorAxis * (1 - eccentricity ** 2);
      const nodesPrecession =
        -1.5 *
        n *
        this.constants.J2_EARTH *
        (this.constants.EARTH_RADIUS / p) ** 2 *
        Math.cos(inclination);
      const apsidesPrecession =
        0.75 *
        n *
        this.constants.J2_EARTH *
        (this.constants.EARTH_RADIUS / p) ** 2 *
        (5 * Math.cos(inclination) ** 2 - 1);

      perturbationEffects.nodesPrecession = nodesPrecession;
      perturbationEffects.apsidesPrecession = apsidesPrecession;
    }

    return {
      semiMajorAxis,
      eccentricity,
      inclination: (inclination * 180) / Math.PI,
      period: 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / mu),
      apogee: semiMajorAxis * (1 + eccentricity),
      perigee: semiMajorAxis * (1 - eccentricity),
      perturbationEffects,
    };
  }

  /**
   * Predict long-term orbital evolution
   */
  predictOrbitalEvolution(initialElements, timeSpan, perturbations = {}) {
    const evolution = [];
    const steps = 1000;
    const timeStep = timeSpan / steps;

    // Convert orbital elements to state vector
    let state = this.orbitalElementsToStateVector(initialElements);

    for (let i = 0; i < steps; i++) {
      const elements = this.calculatePerturbedOrbitalElements(
        state.position,
        state.velocity,
        perturbations
      );
      evolution.push({
        time: i * timeStep,
        elements,
        position: { ...state.position },
        velocity: { ...state.velocity },
      });

      // Integrate one step
      const trajectory = this.integrateOrbit(state, timeStep, 1, perturbations);
      if (trajectory.length > 0) {
        state = trajectory[trajectory.length - 1];
      }
    }

    return evolution;
  }

  /**
   * Convert orbital elements to state vector
   */
  orbitalElementsToStateVector(elements) {
    // This is a simplified conversion - in practice, you'd use more sophisticated methods
    const {
      semiMajorAxis,
      eccentricity,
      inclination,
      argumentOfPeriapsis = 0,
      longitudeOfAscendingNode = 0,
      trueAnomaly = 0,
    } = elements;

    const mu = this.constants.G * this.constants.EARTH_MASS;
    const r =
      (semiMajorAxis * (1 - eccentricity ** 2)) /
      (1 + eccentricity * Math.cos(trueAnomaly));

    // Position in orbital plane
    const x_orbital = r * Math.cos(trueAnomaly);
    const y_orbital = r * Math.sin(trueAnomaly);

    // Velocity in orbital plane
    const h = Math.sqrt(mu * semiMajorAxis * (1 - eccentricity ** 2));
    const vx_orbital = (-mu / h) * Math.sin(trueAnomaly);
    const vy_orbital = (mu / h) * (eccentricity + Math.cos(trueAnomaly));

    // Transform to 3D (simplified)
    const position = {
      x: x_orbital,
      y: y_orbital * Math.cos((inclination * Math.PI) / 180),
      z: y_orbital * Math.sin((inclination * Math.PI) / 180),
    };

    const velocity = {
      x: vx_orbital,
      y: vy_orbital * Math.cos((inclination * Math.PI) / 180),
      z: vy_orbital * Math.sin((inclination * Math.PI) / 180),
    };

    return { position, velocity };
  }
}

export default EnhancedPhysicsEngine;
