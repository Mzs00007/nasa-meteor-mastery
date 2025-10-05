import React, { useEffect, useRef, useState, useContext } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { API_URL } from '../config';
import { SimulationContext } from '../context/SimulationContext';
import ParticleSystem from '../services/particleSystem';
import TextureManager from '../services/textureManager';
import './Orbit3DView.css';
import '../styles/theme.css';
import '../styles/components.css';

// Error Boundary for Orbit3DView
class Orbit3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Orbit3DView Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-message">
            <h3>3D Visualization Error</h3>
            <p>There was an error loading the 3D orbit visualization. This might be due to:</p>
            <ul>
              <li>WebGL compatibility issues</li>
              <li>Missing 3D resources or textures</li>
              <li>Graphics driver problems</li>
            </ul>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper function to load textures with error handling and fallbacks
const loadTextureWithFallback = (textureLoader, url, fallbackUrl = null) => {
  return new Promise(resolve => {
    // Try to load the primary texture
    textureLoader.load(
      url,
      // Success callback
      texture => {
        resolve(texture);
      },
      // Progress callback
      undefined,
      // Error callback
      error => {
        console.error(`Failed to load texture: ${url}`, error);

        // If fallback URL is provided, try to load it
        if (fallbackUrl) {
          console.log(`Attempting to load fallback texture: ${fallbackUrl}`);
          textureLoader.load(
            fallbackUrl,
            // Success callback for fallback
            fallbackTexture => {
              resolve(fallbackTexture);
            },
            undefined,
            // Error callback for fallback
            fallbackError => {
              console.error(
                `Failed to load fallback texture: ${fallbackUrl}`,
                fallbackError
              );
              // Create a placeholder texture (colored grid)
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const context = canvas.getContext('2d');

              // Fill with a grid pattern
              context.fillStyle = '#444444';
              context.fillRect(0, 0, 256, 256);
              context.fillStyle = '#888888';
              for (let x = 0; x < 256; x += 32) {
                for (let y = 0; y < 256; y += 32) {
                  if ((x / 32 + y / 32) % 2 === 0) {
                    context.fillRect(x, y, 32, 32);
                  }
                }
              }

              const placeholderTexture = new THREE.CanvasTexture(canvas);
              resolve(placeholderTexture);
            }
          );
        } else {
          // Create a placeholder texture if no fallback is provided
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const context = canvas.getContext('2d');

          // Fill with a grid pattern
          context.fillStyle = '#444444';
          context.fillRect(0, 0, 256, 256);
          context.fillStyle = '#888888';
          for (let x = 0; x < 256; x += 32) {
            for (let y = 0; y < 256; y += 32) {
              if ((x / 32 + y / 32) % 2 === 0) {
                context.fillRect(x, y, 32, 32);
              }
            }
          }

          const placeholderTexture = new THREE.CanvasTexture(canvas);
          resolve(placeholderTexture);
        }
      }
    );
  });
};

const Orbit3DView = () => {
  const { asteroidParams, impactLocation, simulationResults, loading } =
    useContext(SimulationContext);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const composerRef = useRef(null);
  const earthRef = useRef(null);
  const moonRef = useRef(null);
  const asteroidRef = useRef(null);
  const trajectoryRef = useRef(null);
  const planetsRef = useRef({});
  const animationFrameRef = useRef(null);
  const impactEffectRef = useRef(null);
  const particleSystemRef = useRef(null);
  const textureManagerRef = useRef(null);
  const [viewMode, setViewMode] = useState('realistic'); // realistic, wireframe, xray
  const [focusedPlanet, setFocusedPlanet] = useState('earth');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [particleEffectsEnabled, setParticleEffectsEnabled] = useState(true);
  const [realisticTextures, setRealisticTextures] = useState(true);

  // Create meteor and trajectory visualization - moved to component scope
  const createMeteorVisualization = () => {
    if (!asteroidParams || !impactLocation || !sceneRef.current) {
      return;
    }

    // Calculate trajectory
    const trajectory = calculateMeteorTrajectory(asteroidParams);
    if (!trajectory || !trajectory.points) {
      return;
    }

    // Create trajectory line
    const trajectoryGeometry = new THREE.BufferGeometry();
    const trajectoryPositions = [];

    trajectory.points.forEach(point => {
      if (point && typeof point.x === 'number' && typeof point.y === 'number' && typeof point.z === 'number') {
        trajectoryPositions.push(point.x, point.y, point.z);
      }
    });

    trajectoryGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(trajectoryPositions, 3)
    );

    const trajectoryMaterial = new THREE.LineBasicMaterial({
      color: 0xff6600,
      linewidth: 2,
      transparent: true,
      opacity: 0.7,
    });

    const trajectoryLine = new THREE.Line(
      trajectoryGeometry,
      trajectoryMaterial
    );
    sceneRef.current.add(trajectoryLine);
    trajectoryRef.current = trajectoryLine;

    // Create meteor object with enhanced glowing material
    const asteroidSize = asteroidParams.size || asteroidParams.diameter || 100; // Default size
    const meteorGeometry = new THREE.SphereGeometry(
      asteroidSize / 100,
      32,
      32
    );
    const meteorMaterial = new THREE.MeshPhongMaterial({
      color: 0xcc5500,
      emissive: 0xff3300,
      emissiveIntensity: 0.8,
      shininess: 30,
      flatShading: true,
    });

    const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);

    // Add glow effect that will be enhanced by bloom
    const glowGeometry = new THREE.SphereGeometry(
      asteroidSize / 80,
      32,
      32
    );
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    meteor.add(glowMesh);

    // Add particle trail effects if enabled
    if (particleEffectsEnabled && particleSystemRef.current) {
      const trailEffect = particleSystemRef.current.createAsteroidTrail(
        meteor.position,
        new THREE.Vector3(0, 0, 0), // velocity will be updated during animation
        asteroidSize / 100
      );
      meteor.userData.trailEffect = trailEffect;
    }

    // Position at start of trajectory
    if (trajectory.points.length > 0) {
      const startPoint = trajectory.points[0];
      meteor.position.set(startPoint.x, startPoint.y, startPoint.z);
    }

    sceneRef.current.add(meteor);
    asteroidRef.current = {
      mesh: meteor,
      trajectory: trajectory,
      currentPoint: 0,
      impactTime: null,
      hasImpacted: false,
    };
  };

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000510);

    // Add stars to background
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
    });

    const starVertices = [];
    for (let i = 0; i < 3000; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.z = 5;

    // Enhanced Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    rendererRef.current = renderer;
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Enhanced shadow settings
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;

    // Advanced tone mapping and color management
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Enable physically correct lighting
    renderer.physicallyCorrectLights = true;

    // Enhanced rendering settings
    renderer.sortObjects = true;
    renderer.autoClear = true;
    renderer.gammaFactor = 2.2;

    mountRef.current.appendChild(renderer.domElement);

    // Post-processing for bloom effect
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      ),
      0.8, // bloom strength
      0.3, // radius
      0.7 // threshold
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.minDistance = 2;
    controls.maxDistance = 100;

    // Initialize particle system and texture manager
    const particleSystem = new ParticleSystem(scene, renderer);
    particleSystemRef.current = particleSystem;

    const textureManager = new TextureManager();
    textureManagerRef.current = textureManager;

    // Advanced Lighting System
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);

    // Sun light (central point light) with enhanced properties
    const sunLight = new THREE.PointLight(0xfff8dc, 3.5);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.bias = -0.0001;
    sunLight.decay = 2;
    sunLight.distance = 0;
    scene.add(sunLight);

    // Primary directional light (simulating distant sun)
    const primaryDirectionalLight = new THREE.DirectionalLight(0xfff8dc, 1.2);
    primaryDirectionalLight.position.set(10, 5, 5);
    primaryDirectionalLight.castShadow = true;
    primaryDirectionalLight.shadow.mapSize.width = 2048;
    primaryDirectionalLight.shadow.mapSize.height = 2048;
    primaryDirectionalLight.shadow.camera.near = 0.1;
    primaryDirectionalLight.shadow.camera.far = 50;
    primaryDirectionalLight.shadow.camera.left = -20;
    primaryDirectionalLight.shadow.camera.right = 20;
    primaryDirectionalLight.shadow.camera.top = 20;
    primaryDirectionalLight.shadow.camera.bottom = -20;
    primaryDirectionalLight.shadow.bias = -0.0001;
    scene.add(primaryDirectionalLight);

    // Secondary fill light for softer shadows
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-5, -3, -5);
    fillLight.castShadow = false; // No shadows for fill light
    scene.add(fillLight);

    // Rim light for atmospheric effect
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 10, -10);
    rimLight.castShadow = false;
    scene.add(rimLight);

    // Store lights for potential dynamic control
    const lightingSystem = {
      ambient: ambientLight,
      sun: sunLight,
      primary: primaryDirectionalLight,
      fill: fillLight,
      rim: rimLight,
    };

    // Store in a ref for potential future control
    if (!window.lightingSystemRef) {
      window.lightingSystemRef = lightingSystem;
    }

    // Load textures
    const textureLoader = new THREE.TextureLoader();

    // Texture loading with error handling
    const loadTextureWithFallback = (url, fallbackUrl = null) => {
      return new Promise(resolve => {
        textureLoader.load(
          url,
          texture => resolve(texture),
          undefined,
          error => {
            console.error(`Failed to load texture: ${url}`, error);
            if (fallbackUrl) {
              console.log(`Trying fallback texture: ${fallbackUrl}`);
              textureLoader.load(
                fallbackUrl,
                fallbackTexture => resolve(fallbackTexture),
                undefined,
                fallbackError => {
                  console.error(
                    `Failed to load fallback texture: ${fallbackUrl}`,
                    fallbackError
                  );
                  // Create a placeholder texture
                  const canvas = document.createElement('canvas');
                  canvas.width = 256;
                  canvas.height = 256;
                  const context = canvas.getContext('2d');
                  context.fillStyle = '#333333';
                  context.fillRect(0, 0, 256, 256);
                  context.fillStyle = '#666666';
                  context.font = '20px Arial';
                  context.textAlign = 'center';
                  context.fillText('Texture Error', 128, 128);
                  resolve(new THREE.CanvasTexture(canvas));
                }
              );
            } else {
              // Create a placeholder texture
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const context = canvas.getContext('2d');
              context.fillStyle = '#333333';
              context.fillRect(0, 0, 256, 256);
              context.fillStyle = '#666666';
              context.font = '20px Arial';
              context.textAlign = 'center';
              context.fillText('Texture Error', 128, 128);
              resolve(new THREE.CanvasTexture(canvas));
            }
          }
        );
      });
    };



    // Initialize planets reference for Earth-focused visualization
    planetsRef.current = {};

    // Create earth based on view mode
    updateEarthMaterial(viewMode);

    // Create meteor and trajectory visualization

    // Create impact explosion effect
    const createImpactEffect = position => {
      // Create explosion particles - increased count for more realistic effect
      const particleCount = 1500;
      const explosionGeometry = new THREE.BufferGeometry();
      const explosionPositions = [];
      const explosionVelocities = [];
      const explosionSizes = [];
      const explosionColors = [];
      const explosionLifetimes = [];

      // Color palette for realistic explosion
      const colors = [
        new THREE.Color(0xff9500), // orange
        new THREE.Color(0xff5500), // bright orange
        new THREE.Color(0xff0000), // red
        new THREE.Color(0xffff00), // yellow
        new THREE.Color(0xffffff), // white hot center
      ];

      for (let i = 0; i < particleCount; i++) {
        // Slightly randomize starting position for more realistic explosion
        const offset = 0.05;
        explosionPositions.push(
          position.x + (Math.random() - 0.5) * offset,
          position.y + (Math.random() - 0.5) * offset,
          position.z + (Math.random() - 0.5) * offset
        );

        // Random velocity with more variation and directional bias
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        // Variable speed based on particle type (some fast, some slow)
        let speed;
        if (i < particleCount * 0.2) {
          // Fast particles for initial blast
          speed = 0.3 + Math.random() * 0.5;
        } else if (i < particleCount * 0.6) {
          // Medium speed particles
          speed = 0.15 + Math.random() * 0.25;
        } else {
          // Slower debris and smoke
          speed = 0.05 + Math.random() * 0.15;
        }

        explosionVelocities.push(
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.sin(phi) * Math.sin(theta),
          speed * Math.cos(phi)
        );

        // Variable sizes for different particle types
        explosionSizes.push(0.03 + Math.random() * 0.2);

        // Random color from palette with weighting toward center colors
        const colorIndex = Math.floor(
          Math.pow(Math.random(), 2) * colors.length
        );
        const color = colors[colorIndex];
        explosionColors.push(color.r, color.g, color.b);

        // Variable lifetimes for particles
        explosionLifetimes.push(0.7 + Math.random() * 1.5);
      }

      explosionGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(explosionPositions, 3)
      );
      explosionGeometry.setAttribute(
        'velocity',
        new THREE.Float32BufferAttribute(explosionVelocities, 3)
      );
      explosionGeometry.setAttribute(
        'size',
        new THREE.Float32BufferAttribute(explosionSizes, 1)
      );
      explosionGeometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(explosionColors, 3)
      );
      explosionGeometry.setAttribute(
        'lifetime',
        new THREE.Float32BufferAttribute(explosionLifetimes, 1)
      );

      const explosionMaterial = new THREE.PointsMaterial({
        size: 0.15,
        transparent: true,
        opacity: 0.9,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const explosion = new THREE.Points(explosionGeometry, explosionMaterial);
      sceneRef.current.add(explosion);

      // Create advanced multi-layer shockwave
      // Primary shockwave (bright inner ring)
      const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.3, 64);
      const shockwaveMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff80,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);

      // Secondary shockwave (outer ring)
      const secondaryShockwaveGeometry = new THREE.RingGeometry(0.3, 0.5, 64);
      const secondaryShockwaveMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const secondaryShockwave = new THREE.Mesh(
        secondaryShockwaveGeometry,
        secondaryShockwaveMaterial
      );
      shockwave.add(secondaryShockwave);

      // Tertiary shockwave (faint outer ring)
      const tertiaryShockwaveGeometry = new THREE.RingGeometry(0.5, 0.6, 64);
      const tertiaryShockwaveMaterial = new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const tertiaryShockwave = new THREE.Mesh(
        tertiaryShockwaveGeometry,
        tertiaryShockwaveMaterial
      );
      shockwave.add(tertiaryShockwave);
      shockwave.position.copy(position);
      shockwave.lookAt(0, 0, 0);
      sceneRef.current.add(shockwave);

      // Create crater
      const craterGeometry = new THREE.CircleGeometry(
        asteroidParams.size / 50,
        32
      );
      const craterMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });

      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      crater.position.copy(position);
      crater.lookAt(0, 0, 0);
      crater.position.add(position.clone().normalize().multiplyScalar(0.01));
      sceneRef.current.add(crater);

      return {
        explosion,
        shockwave,
        crater,
        age: 0,
      };
    };

    // Calculate meteor trajectory based on parameters
    const calculateMeteorTrajectory = params => {
      if (!params) {
        return null;
      }

      // Extract parameters
      const { velocity, angle, mass, size, density } = params;
      const crossSectionalArea = Math.PI * Math.pow(size / 2, 2);

      // Calculate trajectory points
      const trajectoryPoints = [];
      const startDistance = 100; // Starting distance from Earth
      const startPos = new THREE.Vector3(
        startDistance * Math.sin((angle * Math.PI) / 180),
        startDistance * Math.cos((angle * Math.PI) / 180),
        0
      );

      // Add starting point
      trajectoryPoints.push(startPos.clone());

      // Calculate trajectory with atmospheric effects
      const currentPos = startPos.clone();
      let currentVelocity = velocity;
      const timeStep = 0.1; // seconds
      const earthRadius = 6.371; // Earth radius in km
      const g = 9.8; // m/s^2

      // Simulate trajectory until impact
      while (currentPos.length() > earthRadius && currentVelocity > 0) {
        // Calculate atmospheric density at current altitude
        const altitude = currentPos.length() - earthRadius;
        const atmosphericDensity =
          altitude > 100 ? 0 : 1.225 * Math.exp(-altitude / 8.5);

        // Calculate drag force
        const dragCoefficient = 0.47; // Approximate for spherical object
        const dragForce =
          0.5 *
          atmosphericDensity *
          Math.pow(currentVelocity, 2) *
          crossSectionalArea *
          dragCoefficient;

        // Calculate acceleration due to drag
        const dragAcceleration = dragForce / mass;

        // Calculate gravitational acceleration
        const gravityDirection = currentPos.clone().normalize().negate();
        const gravityAcceleration =
          g * Math.pow(earthRadius / currentPos.length(), 2);

        // Update velocity
        currentVelocity -= (dragAcceleration + gravityAcceleration) * timeStep;

        // Update position
        const direction = currentPos.clone().normalize().negate();
        currentPos.add(direction.multiplyScalar(currentVelocity * timeStep));

        // Add point to trajectory
        trajectoryPoints.push(currentPos.clone());
      }

      return {
        points: trajectoryPoints,
        impactVelocity: currentVelocity,
        impactPosition: currentPos.normalize().multiplyScalar(earthRadius),
      };
    };

    // Animation
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();

      // Update particle systems
      if (particleEffectsEnabled && particleSystemRef.current) {
        particleSystemRef.current.update();
      }

      // Rotate Earth for orbital mechanics visualization
      if (earthRef.current) {
        earthRef.current.rotation.y += 0.001;
      }

        // Animate meteor trajectory
        if (
          asteroidRef.current &&
          asteroidRef.current.mesh &&
          asteroidRef.current.trajectory
        ) {
          const asteroid = asteroidRef.current;
          const trajectory = asteroid.trajectory;

          // If meteor hasn't reached the end of its trajectory
          if (
            asteroid.currentPoint < trajectory.points.length - 1 &&
            !asteroid.hasImpacted
          ) {
            // Move to next point in trajectory
            asteroid.currentPoint += Math.max(1, Math.floor(animationSpeed));

            if (asteroid.currentPoint < trajectory.points.length) {
              const point = trajectory.points[asteroid.currentPoint];
              const previousPoint =
                asteroid.currentPoint > 0
                  ? trajectory.points[asteroid.currentPoint - 1]
                  : point;

              asteroid.mesh.position.set(point.x, point.y, point.z);

              // Update particle trail effects
              if (
                particleEffectsEnabled &&
                particleSystemRef.current &&
                asteroid.mesh.userData.trailEffect
              ) {
                const velocity = new THREE.Vector3()
                  .subVectors(point, previousPoint)
                  .multiplyScalar(animationSpeed);
                particleSystemRef.current.updateAsteroidTrail(
                  asteroid.mesh.userData.trailEffect,
                  point,
                  velocity
                );

                // Add atmospheric entry heating effects when close to Earth
                const distanceFromEarth = point.length();
                if (distanceFromEarth < 2.0) {
                  // Within 2 Earth radii
                  const heatingEffect =
                    particleSystemRef.current.createAtmosphericEntry(
                      point,
                      velocity,
                      Math.min(1.0, (2.0 - distanceFromEarth) / 1.0) // Intensity based on proximity
                    );
                  // Store heating effect for cleanup
                  if (!asteroid.mesh.userData.heatingEffects) {
                    asteroid.mesh.userData.heatingEffects = [];
                  }
                  asteroid.mesh.userData.heatingEffects.push(heatingEffect);
                }
              }

              // Check if we've reached the impact point
              if (asteroid.currentPoint >= trajectory.points.length - 5) {
                // Create impact effect
                if (!asteroid.hasImpacted) {
                  asteroid.hasImpacted = true;
                  asteroid.impactTime = Date.now();

                  // Hide the meteor
                  asteroid.mesh.visible = false;

                  // Create impact effect at the impact position
                  const impactPosition =
                    trajectory.points[trajectory.points.length - 1];
                  const impactPos = new THREE.Vector3(
                    impactPosition.x,
                    impactPosition.y,
                    impactPosition.z
                  );

                  // Create traditional impact effect
                  impactEffectRef.current = createImpactEffect(impactPos);

                  // Add advanced particle explosion if particle effects are enabled
                  if (particleEffectsEnabled && particleSystemRef.current) {
                    const explosionEffect =
                      particleSystemRef.current.createImpactExplosion(
                        impactPos,
                        asteroidParams.size / 100,
                        trajectory.impactVelocity || 20000
                      );
                    // Store explosion effect for cleanup
                    impactEffectRef.current.particleExplosion = explosionEffect;
                  }

                  // Calculate and display impact results
                  if (simulationResults) {
                    // Update simulation results with impact time
                    const impactVelocity = trajectory.impactVelocity;
                    const impactEnergy =
                      0.5 * asteroidParams.mass * Math.pow(impactVelocity, 2);

                    // Convert to kilotons of TNT (1 kt TNT = 4.184×10^12 joules)
                    const impactEnergyKT = impactEnergy / 4.184e12;

                    console.log(
                      `Impact velocity: ${impactVelocity.toFixed(2)} m/s`
                    );
                    console.log(
                      `Impact energy: ${impactEnergyKT.toFixed(2)} kilotons of TNT`
                    );
                    console.log(
                      `Crater diameter: ${((asteroidParams.size * impactVelocity) / 1000).toFixed(2)} km`
                    );
                  }
                }
              }
            }
          }
        }

        // Animate impact effect
        if (impactEffectRef.current) {
          const effect = impactEffectRef.current;
          effect.age += 0.016 * animationSpeed; // Approximately 16ms per frame

          // Update explosion particles with advanced effects
          if (effect.explosion) {
            const positions =
              effect.explosion.geometry.attributes.position.array;
            const velocities =
              effect.explosion.geometry.attributes.velocity.array;
            const sizes = effect.explosion.geometry.attributes.size?.array;
            const colors = effect.explosion.geometry.attributes.color?.array;

            let allParticlesExpired = true;

            for (let i = 0, j = 0; i < positions.length; i += 3, j += 1) {
              // Apply velocity with deceleration for more realistic physics
              const deceleration = 0.97;
              velocities[i] *= deceleration;
              velocities[i + 1] *= deceleration;
              velocities[i + 2] *= deceleration;

              // Apply enhanced gravity to particles
              velocities[i + 1] -= 0.002 * animationSpeed;

              // Update position
              positions[i] += velocities[i] * animationSpeed;
              positions[i + 1] += velocities[i + 1] * animationSpeed;
              positions[i + 2] += velocities[i + 2] * animationSpeed;

              // Calculate particle lifetime progress (0 to 1)
              const lifeProgress = Math.min(effect.age * 0.5, 1.0);

              // Shrink particles as they age if size attribute exists
              if (sizes && j < sizes.length) {
                sizes[j] = sizes[j] * (1 - lifeProgress * 0.6);

                // Check if any particles are still alive based on size
                if (sizes[j] > 0.1) {
                  allParticlesExpired = false;
                }
              }

              // Shift colors toward red/black as particles cool if color attribute exists
              if (colors && j * 3 + 2 < colors.length) {
                // Reduce green and blue components faster than red for cooling effect
                colors[j * 3 + 1] *= 1 - lifeProgress * 0.7; // green
                colors[j * 3 + 2] *= 1 - lifeProgress * 0.9; // blue
              }
            }

            // Update all modified attributes
            effect.explosion.geometry.attributes.position.needsUpdate = true;
            if (sizes) {
              effect.explosion.geometry.attributes.size.needsUpdate = true;
            }
            if (colors) {
              effect.explosion.geometry.attributes.color.needsUpdate = true;
            }

            // Fade out explosion with improved timing
            effect.explosion.material.opacity = Math.max(
              0,
              0.9 - effect.age * 0.3
            );

            // Remove explosion when fully faded or all particles expired
            if (effect.explosion.material.opacity <= 0 || allParticlesExpired) {
              sceneRef.current.remove(effect.explosion);
              effect.explosion = null;
            }
          }

          // Animate multi-layer shockwave with advanced effects
          if (effect.shockwave) {
            const scale = 0.1 + effect.age * 2;
            effect.shockwave.scale.set(scale, scale, scale);

            // Fade out primary shockwave
            effect.shockwave.material.opacity = Math.max(
              0,
              0.7 - effect.age * 0.15
            );

            // Animate secondary shockwave (outer ring)
            if (effect.shockwave.children[0]) {
              effect.shockwave.children[0].material.opacity = Math.max(
                0,
                0.7 - effect.age * 0.2
              );
            }

            // Animate tertiary shockwave (faint outer ring)
            if (effect.shockwave.children[1]) {
              effect.shockwave.children[1].material.opacity = Math.max(
                0,
                0.4 - effect.age * 0.25
              );
            }

            // Remove shockwave when fully faded
            if (effect.shockwave.material.opacity <= 0) {
              sceneRef.current.remove(effect.shockwave);
              effect.shockwave = null;
            }
          }

          // Remove effect reference when all effects are gone
          if (!effect.explosion && !effect.shockwave) {
            // Keep crater visible
            impactEffectRef.current = null;
          }
        }

        // Rotate Earth
        if (earthRef.current) {
          earthRef.current.rotation.y += 0.001;
        }

      // Render scene with post-processing effects
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Set initial camera position based on zoom level
    if (zoomLevel === 'solar') {
      camera.position.set(0, 30, 60);
      controls.target.set(0, 0, 0);
    } else {
      // Focus on Earth
      if (planetsRef.current.earth) {
        const earthPos = planetsRef.current.earth.mesh.position.clone();
        camera.position.set(earthPos.x, earthPos.y + 3, earthPos.z + 5);
        controls.target.set(earthPos.x, earthPos.y, earthPos.z);
      } else {
        camera.position.set(0, 3, 5);
      }
    }

    controls.update();

    // Resize handler
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clean up scene
      if (sceneRef.current) {
        while (sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0]);
        }
      }

      renderer.dispose();
    };
  }, []);

  // Function to update Earth material based on view mode
  const updateEarthMaterial = mode => {
    if (!sceneRef.current) {
      return;
    }

    // Remove existing Earth if it exists
    if (earthRef.current) {
      sceneRef.current.remove(earthRef.current);
    }

    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    let earthMaterial;

    switch (mode) {
      case 'wireframe':
        earthMaterial = new THREE.MeshBasicMaterial({
          color: 0x4a90e2,
          wireframe: true,
        });
        break;
      case 'xray':
        earthMaterial = new THREE.MeshPhongMaterial({
          color: 0x2a4365,
          transparent: true,
          opacity: 0.5,
          emissive: 0x0a84ff,
          emissiveIntensity: 0.2,
        });
        break;
      case 'realistic':
      default:
        if (realisticTextures && textureManagerRef.current) {
          // Use realistic textures from texture manager
          const earthTextures = textureManagerRef.current.getEarthTextures();
          earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTextures.day,
            normalMap: earthTextures.normal,
            specularMap: earthTextures.specular,
            shininess: 100,
            transparent: false,
          });

          // Add night lights if available
          if (earthTextures.night) {
            earthMaterial.emissiveMap = earthTextures.night;
            earthMaterial.emissiveIntensity = 0.2;
          }
        } else {
          // Fallback to simple material
          earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a4365,
            shininess: 25,
            specular: 0x333333,
          });
        }
        break;
    }

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.castShadow = true;
    earth.receiveShadow = true;
    earthRef.current = earth;
    sceneRef.current.add(earth);
  };

  // Update earth material when view mode changes
  useEffect(() => {
    updateEarthMaterial(viewMode);
  }, [viewMode]);

  // Update asteroid and trajectory based on simulation results
  useEffect(() => {
    if (!sceneRef.current || !simulationResults) {
      return;
    }

    // Remove previous asteroid and trajectory
    if (asteroidRef.current) {
      sceneRef.current.remove(asteroidRef.current);
      asteroidRef.current = null;
    }
    if (trajectoryRef.current) {
      sceneRef.current.remove(trajectoryRef.current);
      trajectoryRef.current = null;
    }

    // Create new asteroid
    const asteroidSize = Math.max(asteroidParams.diameter / 1000, 0.05); // Scale down for visualization with minimum size
    const asteroidGeometry = new THREE.SphereGeometry(
      asteroidSize * 0.1,
      16,
      16
    );

    // Create asteroid material based on view mode
    let asteroidMaterial;
    switch (viewMode) {
      case 'wireframe':
        asteroidMaterial = new THREE.MeshBasicMaterial({
          color: 0xff3a3a,
          wireframe: true,
        });
        break;
      case 'xray':
        asteroidMaterial = new THREE.MeshPhongMaterial({
          color: 0xff3a3a,
          transparent: true,
          opacity: 0.7,
          emissive: 0xff0000,
          emissiveIntensity: 0.5,
        });
        break;
      case 'realistic':
      default:
        if (realisticTextures && textureManagerRef.current) {
          // Use realistic asteroid textures from texture manager
          const asteroidTextures =
            textureManagerRef.current.getAsteroidTextures();
          const textureType = Math.random() < 0.5 ? 'rocky' : 'metallic'; // Randomly choose texture type

          asteroidMaterial = new THREE.MeshPhongMaterial({
            map: asteroidTextures[textureType],
            normalMap: asteroidTextures[`${textureType}Normal`],
            shininess: textureType === 'metallic' ? 80 : 20,
            specular: textureType === 'metallic' ? 0x888888 : 0x333333,
          });
        } else {
          // Fallback to simple material
          asteroidMaterial = new THREE.MeshPhongMaterial({
            color: 0xff3a3a,
            shininess: 30,
            specular: 0x555555,
          });
        }
        break;
    }

    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.castShadow = true;
    asteroidRef.current = asteroid;

    // Calculate asteroid position based on impact location
    if (impactLocation) {
      const phi = (90 - impactLocation.latitude) * (Math.PI / 180);
      const theta = (impactLocation.longitude + 180) * (Math.PI / 180);
      const radius = 1.5; // Position asteroid outside Earth's surface

      asteroid.position.x = radius * Math.sin(phi) * Math.cos(theta);
      asteroid.position.y = radius * Math.cos(phi);
      asteroid.position.z = radius * Math.sin(phi) * Math.sin(theta);

      sceneRef.current.add(asteroid);

      // Create trajectory line with more points for a curved path
      const curvePoints = [];
      const startPoint = new THREE.Vector3(
        asteroid.position.x * 3,
        asteroid.position.y * 3,
        asteroid.position.z * 3
      );
      const endPoint = new THREE.Vector3(
        asteroid.position.x,
        asteroid.position.y,
        asteroid.position.z
      );

      // Create a curve for the trajectory
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = startPoint.x + (endPoint.x - startPoint.x) * t;
        const y = startPoint.y + (endPoint.y - startPoint.y) * t;
        const z = startPoint.z + (endPoint.z - startPoint.z) * t;
        curvePoints.push(new THREE.Vector3(x, y, z));
      }

      const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(
        curvePoints
      );

      // Create trajectory material based on view mode
      let trajectoryMaterial;
      switch (viewMode) {
        case 'wireframe':
        case 'xray':
          trajectoryMaterial = new THREE.LineBasicMaterial({
            color: 0xff5555,
            linewidth: 2,
          });
          break;
        case 'realistic':
        default:
          trajectoryMaterial = new THREE.LineBasicMaterial({
            color: 0xff3a3a,
            linewidth: 2,
          });
          break;
      }

      const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
      trajectoryRef.current = trajectory;
      sceneRef.current.add(trajectory);
    }
  }, [asteroidParams, impactLocation, simulationResults, viewMode]);

  // Function to focus camera on a specific planet
  const focusOnPlanet = planetName => {
    if (
      !planetsRef.current[planetName] ||
      !cameraRef.current ||
      !controlsRef.current
    ) {
      return;
    }

    const planet = planetsRef.current[planetName];
    const planetPos = new THREE.Vector3();
    planet.mesh.getWorldPosition(planetPos);

    // Set camera position relative to planet
    const distance =
      planetName === 'sun' ? 20 : planetName === 'earth' ? 5 : 10;
    cameraRef.current.position.set(
      planetPos.x,
      planetPos.y + distance * 0.5,
      planetPos.z + distance
    );

    // Set controls target to planet position
    controlsRef.current.target.set(planetPos.x, planetPos.y, planetPos.z);
    controlsRef.current.update();

    setFocusedPlanet(planetName);
  };

  return (
    <div className='visualization-container'>
      <div className='visualization-header'>
        <h2>3D Orbital View</h2>
        <div className='view-controls'>
          <button
            className={`view-mode-btn ${viewMode === 'realistic' ? 'active' : ''}`}
            onClick={() => setViewMode('realistic')}
          >
            Realistic
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'wireframe' ? 'active' : ''}`}
            onClick={() => setViewMode('wireframe')}
          >
            Wireframe
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'xray' ? 'active' : ''}`}
            onClick={() => setViewMode('xray')}
          >
            X-Ray
          </button>
        </div>

        <div className='advanced-controls'>
          <button
            className={`feature-btn ${particleEffectsEnabled ? 'active' : ''}`}
            onClick={() => setParticleEffectsEnabled(!particleEffectsEnabled)}
            title='Enable particle effects for asteroid trails and explosions'
          >
            🌟 Particle Effects
          </button>
          <button
            className={`feature-btn ${realisticTextures ? 'active' : ''}`}
            onClick={() => setRealisticTextures(!realisticTextures)}
            title='Enable realistic textures for Earth and asteroids'
          >
            🌍 Realistic Textures
          </button>
        </div>

        {/* Focus controls for orbital mechanics visualization */}
        <div className='orbital-focus-controls'>
          <span>Focus on: </span>
          <button
            className={`focus-btn ${focusedPlanet === 'earth' ? 'active' : ''}`}
            onClick={() => focusOnPlanet('earth')}
          >
            Earth
          </button>
        </div>

        <div className='animation-speed-control'>
          <label>Animation Speed: {animationSpeed.toFixed(1)}x</label>
          <input
            type='range'
            min='0.1'
            max='5'
            step='0.1'
            value={animationSpeed}
            onChange={e => setAnimationSpeed(parseFloat(e.target.value))}
          />
        </div>
      </div>
      <div className='orbit-container'>
        <div ref={mountRef} className='orbit-canvas' />
        {loading && (
          <div className='loading-overlay'>
            <div className='spinner' />
            <div className='loading-text'>Calculating Trajectory...</div>
          </div>
        )}

        <div className='meteor-controls'>
          <button
            className='simulate-button'
            onClick={() => {
              if (asteroidParams && impactLocation) {
                // Clear previous meteor if exists
                if (asteroidRef.current && asteroidRef.current.mesh) {
                  sceneRef.current.remove(asteroidRef.current.mesh);
                }
                if (trajectoryRef.current) {
                  sceneRef.current.remove(trajectoryRef.current);
                }
                if (impactEffectRef.current) {
                  if (impactEffectRef.current.explosion) {
                    sceneRef.current.remove(impactEffectRef.current.explosion);
                  }
                  if (impactEffectRef.current.shockwave) {
                    sceneRef.current.remove(impactEffectRef.current.shockwave);
                  }
                  if (impactEffectRef.current.crater) {
                    sceneRef.current.remove(impactEffectRef.current.crater);
                  }
                  impactEffectRef.current = null;
                }

                // Create new meteor visualization
                createMeteorVisualization();

                // Focus on Earth for better view of impact
                focusOnPlanet('earth');
              } else {
                alert(
                  'Please set asteroid parameters and impact location first'
                );
              }
            }}
          >
            Simulate Impact
          </button>

          {simulationResults && (
            <div className='impact-results'>
              <h4>Impact Results:</h4>
              <p>Velocity: {simulationResults.velocity?.toFixed(2)} km/s</p>
              <p>Energy: {simulationResults.energy?.toFixed(2)} MT</p>
              <p>Crater Size: {simulationResults.craterSize?.toFixed(2)} km</p>
            </div>
          )}
        </div>
      </div>
      <div className='orbit-instructions'>
        <span>Drag to rotate • Scroll to zoom • Shift+drag to pan</span>
      </div>
    </div>
  );
};

// Wrap component with error boundary
const Orbit3DViewWithErrorBoundary = () => (
  <Orbit3DErrorBoundary>
    <Orbit3DView />
  </Orbit3DErrorBoundary>
);

export default Orbit3DViewWithErrorBoundary;
