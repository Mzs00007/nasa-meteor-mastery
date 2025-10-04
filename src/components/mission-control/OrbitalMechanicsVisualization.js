import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { useSimulation } from '../../context/SimulationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import visualizationDataIntegration from '../../services/visualizationDataIntegration';
import EnhancedPhysicsEngine from '../../utils/enhanced-physics-engine';
import './OrbitalMechanicsVisualization.css';

// Advanced orbital mechanics constants and utilities
const PHYSICS_CONSTANTS = {
  G: 6.6743e-11, // Gravitational constant (m³/kg·s²)
  SUN_MASS: 1.989e30, // Solar mass (kg)
  EARTH_MASS: 5.972e24, // Earth mass (kg)
  AU: 1.496e11, // Astronomical Unit (m)
  EARTH_RADIUS: 6.371e6, // Earth radius (m)
  SUN_RADIUS: 6.96e8, // Sun radius (m)
  SCALE_FACTOR: 1e-9, // Scale factor for visualization
};

// Orbital mechanics calculation utilities
const OrbitalMechanics = {
  // Calculate orbital velocity using vis-viva equation
  calculateOrbitalVelocity: (
    semiMajorAxis,
    currentDistance,
    centralMass = PHYSICS_CONSTANTS.SUN_MASS
  ) => {
    const mu = PHYSICS_CONSTANTS.G * centralMass;
    return Math.sqrt(mu * (2 / currentDistance - 1 / semiMajorAxis));
  },

  // Calculate position from orbital elements using Kepler's equation
  calculateOrbitalPosition: (elements, meanAnomaly) => {
    const {
      semiMajorAxis,
      eccentricity,
      inclination,
      argumentOfPeriapsis,
      longitudeOfAscendingNode,
    } = elements;

    // Solve Kepler's equation iteratively
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < 10; i++) {
      eccentricAnomaly =
        meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
    }

    // True anomaly
    const trueAnomaly =
      2 *
      Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
      );

    // Distance from central body
    const radius =
      semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));

    // Position in orbital plane
    const x_orbital = radius * Math.cos(trueAnomaly);
    const y_orbital = radius * Math.sin(trueAnomaly);

    // Rotation matrices for 3D position
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);
    const cosO = Math.cos(longitudeOfAscendingNode);
    const sinO = Math.sin(longitudeOfAscendingNode);
    const cosW = Math.cos(argumentOfPeriapsis);
    const sinW = Math.sin(argumentOfPeriapsis);

    // Transform to 3D coordinates
    const x =
      (cosO * cosW - sinO * sinW * cosI) * x_orbital +
      (-cosO * sinW - sinO * cosW * cosI) * y_orbital;
    const y =
      (sinO * cosW + cosO * sinW * cosI) * x_orbital +
      (-sinO * sinW + cosO * cosW * cosI) * y_orbital;
    const z = sinW * sinI * x_orbital + cosW * sinI * y_orbital;

    return { x, y, z, radius, trueAnomaly, eccentricAnomaly };
  },

  // Calculate orbital period using Kepler's third law
  calculateOrbitalPeriod: (
    semiMajorAxis,
    centralMass = PHYSICS_CONSTANTS.SUN_MASS
  ) => {
    const mu = PHYSICS_CONSTANTS.G * centralMass;
    return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
  },

  // Predict future positions for trajectory visualization
  predictTrajectory: (elements, steps = 100, timeSpan = 86400) => {
    const period = OrbitalMechanics.calculateOrbitalPeriod(
      elements.semiMajorAxis
    );
    const meanMotion = (2 * Math.PI) / period;
    const trajectory = [];

    for (let i = 0; i < steps; i++) {
      const time = (i / steps) * timeSpan;
      const meanAnomaly = elements.meanAnomaly + meanMotion * time;
      const position = OrbitalMechanics.calculateOrbitalPosition(
        elements,
        meanAnomaly
      );
      trajectory.push(position);
    }

    return trajectory;
  },

  // Calculate orbital elements from position and velocity
  calculateOrbitalElements: (
    position,
    velocity,
    centralMass = PHYSICS_CONSTANTS.SUN_MASS
  ) => {
    const mu = PHYSICS_CONSTANTS.G * centralMass;
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

    // Specific orbital energy
    const energy = v ** 2 / 2 - mu / r;

    // Semi-major axis
    const semiMajorAxis = -mu / (2 * energy);

    // Angular momentum vector
    const h = {
      x: position.y * velocity.z - position.z * velocity.y,
      y: position.z * velocity.x - position.x * velocity.z,
      z: position.x * velocity.y - position.y * velocity.x,
    };
    const h_mag = Math.sqrt(h.x ** 2 + h.y ** 2 + h.z ** 2);

    // Eccentricity
    const eccentricity = Math.sqrt(1 + (2 * energy * h_mag ** 2) / mu ** 2);

    // Inclination
    const inclination = Math.acos(h.z / h_mag);

    return {
      semiMajorAxis,
      eccentricity,
      inclination,
      period: OrbitalMechanics.calculateOrbitalPeriod(
        semiMajorAxis,
        centralMass
      ),
      aphelion: semiMajorAxis * (1 + eccentricity),
      perihelion: semiMajorAxis * (1 - eccentricity),
    };
  },
};

const OrbitalMechanicsVisualization = () => {
  const { asteroidData, simulationResults } = useSimulation();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const earthRef = useRef(null);
  const sunRef = useRef(null);
  const animationRef = useRef(null);
  const trajectoryLinesRef = useRef([]);
  const { data: liveOrbitalData } = useWebSocket(
    'ws://localhost:8000/ws/orbital-mechanics'
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [orbitalElements, setOrbitalElements] = useState(null);
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [orbitalData, setOrbitalData] = useState({});
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [timeAcceleration, setTimeAcceleration] = useState(1);
  const [simulationTime, setSimulationTime] = useState(Date.now());
  const [physicsMode, setPhysicsMode] = useState('realistic'); // 'realistic' or 'simplified'
  const [enhancedPhysics, setEnhancedPhysics] = useState(
    new EnhancedPhysicsEngine()
  );
  const [perturbations, setPerturbations] = useState({
    j2: true,
    drag: false,
    solarPressure: false,
    thirdBody: false,
    relativistic: false,
    objectProperties: {
      mass: 1000, // kg
      area: 10, // m²
      dragCoefficient: 2.2,
      reflectivity: 0.3,
    },
  });
  const [nBodyMode, setNBodyMode] = useState(false);
  const [downloadedNEOData, setDownloadedNEOData] = useState([]);
  const [downloadedAsteroidData, setDownloadedAsteroidData] = useState(null);
  const [dataIntegrationLoading, setDataIntegrationLoading] = useState(false);
  const [trajectoryPrediction, setTrajectoryPrediction] = useState(null);

  useEffect(() => {
    if (mountRef.current && !isInitialized) {
      initializeVisualization();
      setIsInitialized(true);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [isInitialized]);

  useEffect(() => {
    if (asteroidData && isInitialized) {
      updateOrbitalElements();
      updateVisualization();
    }
  }, [asteroidData, isInitialized]);

  // Data integration useEffect
  useEffect(() => {
    const dataTypes = [
      {
        type: 'neo',
        params: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
      },
      {
        type: 'asteroid',
        params: {
          designation: asteroidData?.designation || 'Apophis',
        },
      },
    ];

    const handleDataUpdate = data => {
      setDataIntegrationLoading(false);

      if (data.neo) {
        setDownloadedNEOData(data.neo);
        // Integrate NEO data with orbital visualization
        if (isInitialized && sceneRef.current) {
          visualizeNEOData(data.neo);
        }
      }

      if (data.asteroid) {
        setDownloadedAsteroidData(data.asteroid);
        // Update asteroid orbital parameters with real data
        if (isInitialized) {
          updateAsteroidWithRealData(data.asteroid);
        }
      }
    };

    setDataIntegrationLoading(true);

    // Subscribe to data updates
    const unsubscribe = visualizationDataIntegration.subscribe(
      'orbital-mechanics',
      dataTypes,
      handleDataUpdate
    );

    // Setup auto-refresh for real-time data
    visualizationDataIntegration.setupAutoRefresh('orbital-mechanics', 300000); // 5 minutes

    return () => {
      unsubscribe();
      visualizationDataIntegration.clearAutoRefresh('orbital-mechanics');
    };
  }, [asteroidData, isInitialized]);

  const initializeVisualization = () => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 50);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create Sun
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
    const earthMaterial = new THREE.MeshLambertMaterial({ color: 0x4488ff });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(20, 0, 0);
    scene.add(earth);

    // Create Earth's orbit
    const earthOrbitGeometry = new THREE.RingGeometry(19.8, 20.2, 64);
    const earthOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
    earthOrbit.rotation.x = Math.PI / 2;
    scene.add(earthOrbit);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Enhanced animation loop with real-time orbital mechanics
    const animate = useCallback(() => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - simulationTime) * timeAcceleration;

      if (earthRef.current && isRunning) {
        // Earth rotation (sidereal day = 23h 56m 4s)
        const earthRotationRate = (2 * Math.PI) / (23.934 * 3600 * 1000); // rad/ms
        earthRef.current.rotation.y += earthRotationRate * deltaTime;
      }

      // Update asteroid positions using real orbital mechanics
      if (sceneRef.current && asteroids.length > 0) {
        asteroids.forEach((asteroid, index) => {
          const asteroidMesh = sceneRef.current.getObjectByName(
            `asteroid_${index}`
          );
          if (asteroidMesh && asteroid.orbitalElements) {
            let position, velocity;

            if (nBodyMode && enhancedPhysics) {
              // Use enhanced physics engine for N-body calculations
              const dt = timeAcceleration * 0.001; // time step in seconds
              const state = {
                position: [
                  asteroidMesh.position.x / PHYSICS_CONSTANTS.SCALE_FACTOR,
                  asteroidMesh.position.z / PHYSICS_CONSTANTS.SCALE_FACTOR,
                  asteroidMesh.position.y / PHYSICS_CONSTANTS.SCALE_FACTOR,
                ],
                velocity: asteroid.velocity || [0, 0, 0],
              };

              // Calculate enhanced physics forces
              const acceleration = enhancedPhysics.calculateNBodyAcceleration(
                state.position,
                perturbations.objectProperties
              );

              // Apply perturbations
              if (perturbations.j2) {
                const j2Accel = enhancedPhysics.calculateJ2Perturbation(
                  state.position,
                  state.velocity
                );
                acceleration[0] += j2Accel[0];
                acceleration[1] += j2Accel[1];
                acceleration[2] += j2Accel[2];
              }

              if (perturbations.drag) {
                const dragAccel = enhancedPhysics.calculateAtmosphericDrag(
                  state.position,
                  state.velocity,
                  perturbations.objectProperties
                );
                acceleration[0] += dragAccel[0];
                acceleration[1] += dragAccel[1];
                acceleration[2] += dragAccel[2];
              }

              if (perturbations.solarPressure) {
                const srpAccel =
                  enhancedPhysics.calculateSolarRadiationPressure(
                    state.position,
                    perturbations.objectProperties
                  );
                acceleration[0] += srpAccel[0];
                acceleration[1] += srpAccel[1];
                acceleration[2] += srpAccel[2];
              }

              // Integrate motion using Runge-Kutta
              const newState = enhancedPhysics.integrateOrbit(
                state,
                dt,
                perturbations.objectProperties
              );

              position = {
                x: newState.position[0],
                y: newState.position[2],
                z: newState.position[1],
                radius: Math.sqrt(
                  newState.position[0] ** 2 +
                    newState.position[1] ** 2 +
                    newState.position[2] ** 2
                ),
              };

              velocity = Math.sqrt(
                newState.velocity[0] ** 2 +
                  newState.velocity[1] ** 2 +
                  newState.velocity[2] ** 2
              );

              // Update asteroid velocity for next iteration
              asteroid.velocity = newState.velocity;
            } else {
              // Use standard Keplerian orbital mechanics
              const period = OrbitalMechanics.calculateOrbitalPeriod(
                asteroid.orbitalElements.semiMajorAxis
              );
              const meanMotion = (2 * Math.PI) / period;
              const meanAnomaly =
                asteroid.orbitalElements.meanAnomaly +
                meanMotion * (deltaTime / 1000);

              position = OrbitalMechanics.calculateOrbitalPosition(
                asteroid.orbitalElements,
                meanAnomaly
              );

              velocity = OrbitalMechanics.calculateOrbitalVelocity(
                asteroid.orbitalElements.semiMajorAxis,
                position.radius
              );
            }

            // Apply scaling for visualization
            asteroidMesh.position.set(
              position.x * PHYSICS_CONSTANTS.SCALE_FACTOR,
              position.z * PHYSICS_CONSTANTS.SCALE_FACTOR,
              position.y * PHYSICS_CONSTANTS.SCALE_FACTOR
            );

            // Update orbital data for selected asteroid
            if (selectedAsteroid === index) {
              setOrbitalData(prev => ({
                ...prev,
                [index]: {
                  position: position,
                  velocity: velocity,
                  distance: position.radius,
                  trueAnomaly: position.trueAnomaly || 0,
                  eccentricAnomaly: position.eccentricAnomaly || 0,
                  meanAnomaly: position.meanAnomaly || 0,
                },
              }));
            }
          }
        });
      }

      // Update trajectory lines if enabled
      if (
        showTrajectories &&
        selectedAsteroid !== null &&
        asteroids[selectedAsteroid]
      ) {
        updateTrajectoryVisualization(selectedAsteroid);
      }

      // Rotate Earth around Sun
      earth.position.x = 20 * Math.cos(Date.now() * 0.0001);
      earth.position.z = 20 * Math.sin(Date.now() * 0.0001);

      controls.update();
      renderer.render(scene, camera);

      setSimulationTime(currentTime);
      animationRef.current = requestAnimationFrame(animate);
    }, [
      isRunning,
      asteroids,
      selectedAsteroid,
      showTrajectories,
      timeAcceleration,
      simulationTime,
    ]);
    animate();

    // Handle resize
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
  };

  // Enhanced trajectory visualization
  const updateTrajectoryVisualization = useCallback(
    asteroidIndex => {
      if (
        !asteroids[asteroidIndex] ||
        !asteroids[asteroidIndex].orbitalElements
      ) {
        return;
      }

      const asteroid = asteroids[asteroidIndex];
      const trajectory = OrbitalMechanics.predictTrajectory(
        asteroid.orbitalElements,
        200, // steps
        asteroid.orbitalElements.period || 86400 // time span in seconds
      );

      // Remove existing trajectory line
      const existingLine = sceneRef.current.getObjectByName(
        `trajectory_${asteroidIndex}`
      );
      if (existingLine) {
        sceneRef.current.remove(existingLine);
      }

      // Create new trajectory line
      const points = trajectory.map(
        pos =>
          new THREE.Vector3(
            pos.x * PHYSICS_CONSTANTS.SCALE_FACTOR,
            pos.z * PHYSICS_CONSTANTS.SCALE_FACTOR,
            pos.y * PHYSICS_CONSTANTS.SCALE_FACTOR
          )
      );

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      line.name = `trajectory_${asteroidIndex}`;
      sceneRef.current.add(line);
    },
    [asteroids]
  );

  const updateOrbitalElements = useCallback(asteroidData => {
    if (!asteroidData || asteroidData.length === 0) {
      return;
    }

    const elements = asteroidData.map((asteroid, index) => {
      // Generate realistic orbital elements if not provided
      const semiMajorAxis =
        asteroid.distance || (1.5 + Math.random() * 3) * PHYSICS_CONSTANTS.AU;
      const eccentricity = asteroid.eccentricity || Math.random() * 0.3;
      const inclination = asteroid.inclination || (Math.random() - 0.5) * 0.2;
      const argumentOfPeriapsis = Math.random() * 2 * Math.PI;
      const longitudeOfAscendingNode = Math.random() * 2 * Math.PI;
      const meanAnomaly = Math.random() * 2 * Math.PI;

      const orbitalElements = {
        semiMajorAxis,
        eccentricity,
        inclination,
        argumentOfPeriapsis,
        longitudeOfAscendingNode,
        meanAnomaly,
        period: OrbitalMechanics.calculateOrbitalPeriod(semiMajorAxis),
      };

      return {
        name: asteroid.name,
        ...orbitalElements,
        aphelion: semiMajorAxis * (1 + eccentricity),
        perihelion: semiMajorAxis * (1 - eccentricity),
      };
    });

    setOrbitalData(elements);
  }, []);

  const calculateSemiMajorAxis = data => {
    // Simplified calculation based on distance
    return data.distance ? data.distance / 149597870.7 : 1.5; // Convert to AU
  };

  const calculateOrbitalPeriod = data => {
    // Kepler's third law: P² = a³ (in years and AU)
    const a = calculateSemiMajorAxis(data);
    return Math.sqrt(Math.pow(a, 3)) * 365.25; // Convert to days
  };

  const updateVisualization = () => {
    if (!sceneRef.current || !orbitalElements) {
      return;
    }

    // Remove existing asteroid and orbit
    const existingAsteroid = sceneRef.current.getObjectByName('asteroid');
    const existingOrbit = sceneRef.current.getObjectByName('asteroidOrbit');
    if (existingAsteroid) {
      sceneRef.current.remove(existingAsteroid);
    }
    if (existingOrbit) {
      sceneRef.current.remove(existingOrbit);
    }

    // Create asteroid
    const asteroidGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const asteroidMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.name = 'asteroid';

    // Position asteroid based on orbital elements
    const distance = orbitalElements.semiMajorAxis * 10; // Scale for visualization
    asteroid.position.set(distance, 0, 0);
    sceneRef.current.add(asteroid);

    // Create asteroid orbit
    const orbitRadius = orbitalElements.semiMajorAxis * 10;
    const orbitGeometry = new THREE.RingGeometry(
      orbitRadius - 0.1,
      orbitRadius + 0.1,
      64
    );
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const asteroidOrbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    asteroidOrbit.name = 'asteroidOrbit';
    asteroidOrbit.rotation.x = Math.PI / 2;
    asteroidOrbit.rotation.z = (orbitalElements.inclination * Math.PI) / 180;
    sceneRef.current.add(asteroidOrbit);
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) {
      return 'N/A';
    }
    return typeof num === 'number' ? num.toFixed(decimals) : num;
  };

  return (
    <div className='orbital-mechanics-visualization'>
      <div className='visualization-header'>
        <h2>🌌 Advanced Orbital Mechanics</h2>
        <div className='controls'>
          <button
            onClick={() => updateVisualization()}
            title='Refresh the 3D orbital mechanics visualization'
          >
            Refresh Visualization
          </button>

          <div className='control-group'>
            <label>Physics Mode:</label>
            <select
              value={physicsMode}
              onChange={e => setPhysicsMode(e.target.value)}
              className='physics-select'
            >
              <option value='realistic'>🔬 Realistic Physics</option>
              <option value='simplified'>⚡ Simplified</option>
            </select>
          </div>

          <div className='control-group'>
            <label>Time Acceleration:</label>
            <input
              type='range'
              min='0.1'
              max='100'
              step='0.1'
              value={timeAcceleration}
              onChange={e => setTimeAcceleration(parseFloat(e.target.value))}
              className='time-slider'
            />
            <span className='time-value'>{timeAcceleration.toFixed(1)}x</span>
          </div>

          <button
            className={`control-btn ${showTrajectories ? 'active' : ''}`}
            onClick={() => setShowTrajectories(!showTrajectories)}
            title='Toggle display of orbital trajectory paths'
          >
            🛸 Trajectories
          </button>

          <button
            className={`control-btn ${nBodyMode ? 'active' : ''}`}
            onClick={() => setNBodyMode(!nBodyMode)}
            title='Enable N-Body gravitational interactions simulation'
          >
            🌍 N-Body
          </button>
        </div>
      </div>

      {/* Enhanced Physics Controls Panel */}
      <div className='enhanced-physics-panel'>
        <h3>🔬 Enhanced Physics Engine</h3>
        <div className='physics-controls'>
          <div className='perturbation-controls'>
            <h4>Gravitational Perturbations</h4>
            <div className='checkbox-group'>
              <label>
                <input
                  type='checkbox'
                  checked={perturbations.j2}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      j2: e.target.checked,
                    }))
                  }
                />
                J2 Oblateness Effect
              </label>
              <label>
                <input
                  type='checkbox'
                  checked={perturbations.thirdBody}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      thirdBody: e.target.checked,
                    }))
                  }
                />
                Third-Body Perturbations
              </label>
              <label>
                <input
                  type='checkbox'
                  checked={perturbations.relativistic}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      relativistic: e.target.checked,
                    }))
                  }
                />
                Relativistic Effects
              </label>
            </div>
          </div>

          <div className='environmental-controls'>
            <h4>Environmental Forces</h4>
            <div className='checkbox-group'>
              <label>
                <input
                  type='checkbox'
                  checked={perturbations.drag}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      drag: e.target.checked,
                    }))
                  }
                />
                Atmospheric Drag
              </label>
              <label>
                <input
                  type='checkbox'
                  checked={perturbations.solarPressure}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      solarPressure: e.target.checked,
                    }))
                  }
                />
                Solar Radiation Pressure
              </label>
            </div>
          </div>

          <div className='object-properties'>
            <h4>Object Properties</h4>
            <div className='property-inputs'>
              <label>
                Mass (kg):
                <input
                  type='number'
                  value={perturbations.objectProperties.mass}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      objectProperties: {
                        ...prev.objectProperties,
                        mass: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min='1'
                  max='1000000'
                />
              </label>
              <label>
                Cross-sectional Area (m²):
                <input
                  type='number'
                  value={perturbations.objectProperties.area}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      objectProperties: {
                        ...prev.objectProperties,
                        area: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min='0.1'
                  max='1000'
                  step='0.1'
                />
              </label>
              <label>
                Drag Coefficient:
                <input
                  type='number'
                  value={perturbations.objectProperties.dragCoefficient}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      objectProperties: {
                        ...prev.objectProperties,
                        dragCoefficient: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min='0.1'
                  max='5'
                  step='0.1'
                />
              </label>
              <label>
                Reflectivity:
                <input
                  type='number'
                  value={perturbations.objectProperties.reflectivity}
                  onChange={e =>
                    setPerturbations(prev => ({
                      ...prev,
                      objectProperties: {
                        ...prev.objectProperties,
                        reflectivity: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min='0'
                  max='1'
                  step='0.01'
                />
              </label>
            </div>
          </div>

          <div className='prediction-controls'>
            <button
              className='predict-btn'
              onClick={() => {
                if (selectedAsteroid !== null && asteroids[selectedAsteroid]) {
                  const asteroid = asteroids[selectedAsteroid];
                  const prediction = enhancedPhysics.predictLongTermEvolution(
                    asteroid.orbitalElements,
                    365.25 * 24 * 3600 * 10, // 10 years
                    perturbations
                  );
                  setTrajectoryPrediction(prediction);
                }
              }}
            >
              🔮 Predict 10-Year Evolution
            </button>

            {trajectoryPrediction && (
              <div className='prediction-results'>
                <h5>Long-term Orbital Evolution</h5>
                <div className='prediction-data'>
                  <div className='data-row'>
                    <span>Semi-major Axis Change:</span>
                    <span>
                      {formatNumber(
                        (trajectoryPrediction.finalElements.semiMajorAxis -
                          trajectoryPrediction.initialElements.semiMajorAxis) /
                          1000
                      )}{' '}
                      km
                    </span>
                  </div>
                  <div className='data-row'>
                    <span>Eccentricity Change:</span>
                    <span>
                      {formatNumber(
                        trajectoryPrediction.finalElements.eccentricity -
                          trajectoryPrediction.initialElements.eccentricity,
                        6
                      )}
                    </span>
                  </div>
                  <div className='data-row'>
                    <span>Inclination Change:</span>
                    <span>
                      {formatNumber(
                        ((trajectoryPrediction.finalElements.inclination -
                          trajectoryPrediction.initialElements.inclination) *
                          180) /
                          Math.PI,
                        4
                      )}
                      °
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='visualization-content'>
        <div className='three-container' ref={mountRef} />

        <div className='orbital-data-panel'>
          <h3>📊 Real-Time Orbital Data</h3>
          {selectedAsteroid !== null && orbitalData[selectedAsteroid] && (
            <div className='orbital-info'>
              <div className='asteroid-selector'>
                <label>Selected Object:</label>
                <select
                  value={selectedAsteroid || ''}
                  onChange={e => setSelectedAsteroid(parseInt(e.target.value))}
                >
                  <option value=''>Select an asteroid...</option>
                  {asteroids.map((asteroid, index) => (
                    <option key={index} value={index}>
                      {asteroid.name || `Asteroid ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className='data-section'>
                <h4>🎯 Current Position</h4>
                <div className='data-row'>
                  <span className='label'>Distance from Sun:</span>
                  <span className='value'>
                    {formatNumber(
                      orbitalData[selectedAsteroid].distance /
                        PHYSICS_CONSTANTS.AU
                    )}{' '}
                    AU
                  </span>
                </div>
                <div className='data-row'>
                  <span className='label'>Orbital Velocity:</span>
                  <span className='value'>
                    {formatNumber(
                      orbitalData[selectedAsteroid].velocity / 1000
                    )}{' '}
                    km/s
                  </span>
                </div>
                <div className='data-row'>
                  <span className='label'>True Anomaly:</span>
                  <span className='value'>
                    {formatNumber(
                      (orbitalData[selectedAsteroid].trueAnomaly * 180) /
                        Math.PI
                    )}
                    °
                  </span>
                </div>
              </div>

              <div className='data-section'>
                <h4>🔬 Orbital Elements</h4>
                <div className='data-row'>
                  <span className='label'>Semi-major Axis:</span>
                  <span className='value'>
                    {formatNumber(
                      asteroids[selectedAsteroid].orbitalElements
                        ?.semiMajorAxis / PHYSICS_CONSTANTS.AU
                    )}{' '}
                    AU
                  </span>
                </div>
                <div className='data-row'>
                  <span className='label'>Eccentricity:</span>
                  <span className='value'>
                    {formatNumber(
                      asteroids[selectedAsteroid].orbitalElements?.eccentricity
                    )}
                  </span>
                </div>
                <div className='data-row'>
                  <span className='label'>Inclination:</span>
                  <span className='value'>
                    {formatNumber(
                      (asteroids[selectedAsteroid].orbitalElements
                        ?.inclination *
                        180) /
                        Math.PI
                    )}
                    °
                  </span>
                </div>
                <div className='data-row'>
                  <span className='label'>Orbital Period:</span>
                  <span className='value'>
                    {formatNumber(
                      asteroids[selectedAsteroid].orbitalElements?.period /
                        (365.25 * 24 * 3600)
                    )}{' '}
                    years
                  </span>
                </div>
                <div className='data-row'>
                  <span className='label'>Aphelion:</span>
                  <span className='value'>
                    {formatNumber(
                      asteroids[selectedAsteroid].orbitalElements?.aphelion /
                        PHYSICS_CONSTANTS.AU
                    )}{' '}
                    AU
                  </span>
                </div>
                <div className='data-row'>
                  <span className='label'>Perihelion:</span>
                  <span className='value'>
                    {formatNumber(
                      asteroids[selectedAsteroid].orbitalElements?.perihelion /
                        PHYSICS_CONSTANTS.AU
                    )}{' '}
                    AU
                  </span>
                </div>
              </div>

              {physicsMode === 'realistic' && (
                <div className='data-section'>
                  <h4>⚡ Physics Calculations</h4>
                  <div className='data-row'>
                    <span className='label'>Gravitational Parameter (μ):</span>
                    <span className='value'>
                      {formatNumber(
                        PHYSICS_CONSTANTS.G * PHYSICS_CONSTANTS.SUN_MASS
                      )}{' '}
                      m³/s²
                    </span>
                  </div>
                  <div className='data-row'>
                    <span className='label'>Specific Energy:</span>
                    <span className='value'>
                      {formatNumber(
                        (-PHYSICS_CONSTANTS.G * PHYSICS_CONSTANTS.SUN_MASS) /
                          (2 *
                            asteroids[selectedAsteroid].orbitalElements
                              ?.semiMajorAxis)
                      )}{' '}
                      J/kg
                    </span>
                  </div>
                  <div className='data-row'>
                    <span className='label'>Mean Motion:</span>
                    <span className='value'>
                      {formatNumber(
                        (2 * Math.PI) /
                          asteroids[selectedAsteroid].orbitalElements?.period
                      )}{' '}
                      rad/s
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedAsteroid === null && (
            <div className='no-selection'>
              <p>🎯 Select an asteroid to view detailed orbital mechanics</p>
              <p>Real-time calculations include:</p>
              <ul>
                <li>• Kepler's equation solutions</li>
                <li>• Vis-viva velocity calculations</li>
                <li>• Orbital position predictions</li>
                <li>• Trajectory forecasting</li>
              </ul>
            </div>
          )}

          {asteroidData && (
            <div className='asteroid-info'>
              <h4>Current Asteroid: {asteroidData.name || 'Unknown'}</h4>
              <div className='info-row'>
                <span>Distance:</span>
                <span>{formatNumber(asteroidData.distance)} km</span>
              </div>
              <div className='info-row'>
                <span>Velocity:</span>
                <span>{formatNumber(asteroidData.velocity)} km/s</span>
              </div>
              <div className='info-row'>
                <span>Diameter:</span>
                <span>{formatNumber(asteroidData.diameter)} m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='visualization-legend'>
        <div className='legend-item'>
          <div
            className='legend-color'
            style={{ backgroundColor: '#ffff00' }}
          />
          <span>Sun</span>
        </div>
        <div className='legend-item'>
          <div
            className='legend-color'
            style={{ backgroundColor: '#4488ff' }}
          />
          <span>Earth</span>
        </div>
        <div className='legend-item'>
          <div
            className='legend-color'
            style={{ backgroundColor: '#888888' }}
          />
          <span>Asteroid</span>
        </div>
        <div className='legend-item'>
          <div
            className='legend-color'
            style={{ backgroundColor: '#ff4444' }}
          />
          <span>Asteroid Orbit</span>
        </div>
      </div>
    </div>
  );

  // Helper function to visualize NEO data
  function visualizeNEOData(neoData) {
    if (!sceneRef.current || !neoData || !Array.isArray(neoData)) {
      return;
    }

    // Remove existing NEO objects
    const existingNEOs = sceneRef.current.children.filter(
      child => child.userData?.isNEO
    );
    existingNEOs.forEach(neo => sceneRef.current.remove(neo));

    // Add new NEO objects
    neoData.slice(0, 10).forEach((neo, index) => {
      // Limit to 10 NEOs for performance
      const geometry = new THREE.SphereGeometry(0.02, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: neo.is_potentially_hazardous_asteroid ? 0xff4444 : 0x44ff44,
        transparent: true,
        opacity: 0.8,
      });

      const neoMesh = new THREE.Mesh(geometry, material);

      // Position based on orbital data if available
      const distance =
        neo.close_approach_data?.[0]?.miss_distance?.astronomical ||
        1 + index * 0.1;
      const angle = (index / neoData.length) * Math.PI * 2;

      neoMesh.position.set(
        Math.cos(angle) * distance * 2,
        0,
        Math.sin(angle) * distance * 2
      );

      neoMesh.userData = {
        isNEO: true,
        name: neo.name,
        isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
      };

      sceneRef.current.add(neoMesh);
    });
  }

  // Helper function to update asteroid with real data
  function updateAsteroidWithRealData(asteroidData) {
    if (!asteroidData || !asteroidData.orbital_data) {
      return;
    }

    const realOrbitalElements = {
      semiMajorAxis:
        parseFloat(asteroidData.orbital_data.semi_major_axis) *
        PHYSICS_CONSTANTS.AU,
      eccentricity: parseFloat(asteroidData.orbital_data.eccentricity),
      inclination:
        (parseFloat(asteroidData.orbital_data.inclination) * Math.PI) / 180,
      longitudeOfAscendingNode:
        (parseFloat(asteroidData.orbital_data.ascending_node_longitude) *
          Math.PI) /
        180,
      argumentOfPeriapsis:
        (parseFloat(asteroidData.orbital_data.periapsis_argument) * Math.PI) /
        180,
      meanAnomaly:
        (parseFloat(asteroidData.orbital_data.mean_anomaly) * Math.PI) / 180,
    };

    // Update the asteroid data with real orbital elements
    if (asteroids.length > selectedAsteroid) {
      const updatedAsteroids = [...asteroids];
      updatedAsteroids[selectedAsteroid] = {
        ...updatedAsteroids[selectedAsteroid],
        orbitalElements: realOrbitalElements,
        name: asteroidData.name || updatedAsteroids[selectedAsteroid].name,
      };

      // Update visualization with new orbital elements
      updateOrbitalElements();
      updateVisualization();
    }
  }
};

export default OrbitalMechanicsVisualization;
