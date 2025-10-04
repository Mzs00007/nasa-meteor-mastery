import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { ExplosionSystem } from '../effects/ExplosionSystem';
import { EnhancedPhysicsEngine } from '../utils/enhanced-physics-engine';
import JSZip from 'jszip';

// Simple placeholder classes for missing systems
class AsteroidSystem {
  constructor(scene) {
    this.scene = scene;
    this.asteroids = [];
  }
  
  createAsteroid(params) {
    const geometry = new THREE.SphereGeometry(params.diameter / 2000, 16, 16);
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.copy(params.position);
    asteroid.userData = { impactData: params };
    this.asteroids.push(asteroid);
    this.scene.add(asteroid);
    return asteroid;
  }
  
  getAllAsteroids() {
    return this.asteroids;
  }
  
  removeAsteroid(asteroid) {
    const index = this.asteroids.indexOf(asteroid);
    if (index > -1) {
      this.asteroids.splice(index, 1);
      this.scene.remove(asteroid);
    }
  }
  
  clear() {
    this.asteroids.forEach(asteroid => this.scene.remove(asteroid));
    this.asteroids = [];
  }
  
  update(deltaTime) {
    // Update asteroid positions
  }
}

class EarthModel {
  constructor(scene) {
    this.scene = scene;
    this.earth = null;
    this.earthRadius = 6.371;
    this.scaleFactor = 1;
  }
  
  create() {
    const geometry = new THREE.SphereGeometry(this.earthRadius, 64, 64);
    const material = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    this.earth = new THREE.Mesh(geometry, material);
    this.scene.add(this.earth);
    return this.earth;
  }
  
  getImpactPoint(direction) {
    return direction.multiplyScalar(this.earthRadius);
  }
  
  createImpactCrater(point, energy) {
    // Create crater effect
  }
  
  addSeismicWaves(point, magnitude) {
    // Add seismic wave effects
  }
  
  addTsunami(point, magnitude) {
    // Add tsunami effects
  }
  
  isOceanPoint(point) {
    return Math.random() > 0.3; // Simple ocean check
  }
  
  createDestructionZone(point, diameter, intensity) {
    // Create destruction visualization
  }
  
  clear() {
    // Clear effects
  }
  
  update(deltaTime) {
    // Update earth animations
  }
}

import './AsteroidImpactSimulation.css';

// Custom shockwave pass for impact effects
class ShockwavePass {
  constructor() {
    this.shockwaveShader = {
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        center: { value: new THREE.Vector2(0.5, 0.5) },
        shockParams: { value: new THREE.Vector3(10, 0.8, 0.1) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform vec2 center;
        uniform vec3 shockParams;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          vec2 texCoord = uv;
          float distance = distance(uv, center);
          
          if ((distance <= (time + shockParams.z)) && (distance >= (time - shockParams.z))) {
            float diff = (distance - time);
            float powDiff = 1.0 - pow(abs(diff * shockParams.x), shockParams.y);
            float diffTime = diff * powDiff;
            vec2 diffUV = normalize(uv - center);
            texCoord = uv + (diffUV * diffTime);
          }
          
          gl_FragColor = texture2D(tDiffuse, texCoord);
        }
      `
    };
  }
  
  render(renderer, writeBuffer, readBuffer) {
    // Shockwave rendering logic would go here
  }
}

// Debris system for impact effects
class DebrisSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: 0xff4444,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  createDebris(position, count = 100) {
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < count; i++) {
      positions.push(
        position.x + (Math.random() - 0.5) * 2,
        position.y + (Math.random() - 0.5) * 2,
        position.z + (Math.random() - 0.5) * 2
      );
      velocities.push(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
      );
    }
    
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.velocities = velocities;
  }

  update(deltaTime) {
    if (this.velocities) {
      const positions = this.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += this.velocities[i] * deltaTime;
        positions[i + 1] += this.velocities[i + 1] * deltaTime;
        positions[i + 2] += this.velocities[i + 2] * deltaTime;
        
        this.velocities[i + 1] -= 9.8 * deltaTime; // gravity
      }
      this.geometry.attributes.position.needsUpdate = true;
    }
  }
}

// Atmosphere system for atmospheric effects
class AtmosphereSystem {
  constructor(scene) {
    this.scene = scene;
    this.createAtmosphere();
  }

  createAtmosphere() {
    const atmosphereGeometry = new THREE.SphereGeometry(6.5, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    
    this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(this.atmosphere);
  }

  update(time) {
    if (this.atmosphere) {
      this.atmosphere.material.uniforms.time.value = time;
    }
  }
}

// Simple recorder class for simulation recording
class SimulationRecorder {
  constructor() {
    this.isRecording = false;
    this.frames = [];
  }

  startRecording() {
    this.isRecording = true;
    this.frames = [];
  }

  stopRecording() {
    this.isRecording = false;
    return this.frames;
  }

  recordFrame(data) {
    if (this.isRecording) {
      this.frames.push({
        timestamp: Date.now(),
        data: data
      });
    }
  }
}

const AsteroidImpactSimulation = () => {
  // React refs for Three.js objects
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const composerRef = useRef(null);
  const animationIdRef = useRef(null);
  const recorderRef = useRef(null);
  const debrisSystemRef = useRef(null);
  const atmosphereSystemRef = useRef(null);

  // State variables
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [impactResults, setImpactResults] = useState(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [cameraMode, setCameraMode] = useState('free');
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [asteroidSize, setAsteroidSize] = useState(1);
  const [asteroidVelocity, setAsteroidVelocity] = useState(20);
  const [impactAngle, setImpactAngle] = useState(45);
  const [asteroidComposition, setAsteroidComposition] = useState('rocky');

  // System refs
  const physicsEngineRef = useRef(null);
  const explosionSystemRef = useRef(null);
  const asteroidSystemRef = useRef(null);
  const earthModelRef = useRef(null);
  
  // Recording state
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [impactOccurred, setImpactOccurred] = useState(false);

  // Asteroid parameters (user-controlled)
  const [asteroidParams, setAsteroidParams] = useState({
    diameter: 1000, // meters
    mass: 1.3e12, // kg (calculated from diameter and density)
    velocity: 20000, // m/s
    angle: 45, // degrees
    composition: 'rocky', // rocky, metallic, icy
    density: 2600, // kg/m³
    position: { x: -50, y: 20, z: 0 }, // starting position
    targetLocation: { lat: 40.7128, lng: -74.0060 } // NYC coordinates
  });

  // Earth and celestial objects
  const earthRef = useRef(null);
  const asteroidRef = useRef(null);
  const trajectoryLineRef = useRef(null);

  // Simulation controls
  const [timeScale, setTimeScale] = useState(1);

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100000
    );
    camera.position.set(0, 0, 200);
    cameraRef.current = camera;

    // Renderer setup with advanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 80;
    controls.maxDistance = 1000;
    controls.autoRotate = false;
    controlsRef.current = controls;

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom effect for explosions and atmosphere
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    composer.addPass(bloomPass);

    composerRef.current = composer;

    // Initialize physics engine
    physicsEngineRef.current = new EnhancedPhysicsEngine();

    // Initialize core systems
    explosionSystemRef.current = new ExplosionSystem(scene);
    asteroidSystemRef.current = new AsteroidSystem(scene);
    earthModelRef.current = new EarthModel(scene);
    recorderRef.current = new SimulationRecorder();
    debrisSystemRef.current = new DebrisSystem(scene);
    atmosphereSystemRef.current = new AtmosphereSystem(scene);

    // Create celestial objects
    createEarth();
    createAsteroid();
    createStarField();
    setupLighting();

  }, []);

  // Recording functions
  const startRecording = () => {
    setRecordedFrames([]);
    setIsRecording(true);
    console.log('Recording started');
  };

  const stopRecording = () => {
    setIsRecording(false);
    console.log('Recording stopped');
  };

  const captureFrame = () => {
    if (isRecording && rendererRef.current) {
      const canvas = rendererRef.current.domElement;
      const dataURL = canvas.toDataURL('image/png');
      setRecordedFrames(prev => [...prev, dataURL]);
    }
  };

  const downloadVideo = () => {
    if (recordedFrames.length > 0) {
      const zip = new JSZip();
      recordedFrames.forEach((frame, index) => {
        const base64Data = frame.replace(/^data:image\/png;base64,/, '');
        zip.file(`frame_${String(index).padStart(4, '0')}.png`, base64Data, {base64: true});
      });
      
      zip.generateAsync({type: 'blob'}).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'asteroid_impact_simulation.zip';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  // Simulation control functions
  const startSimulation = () => {
    setIsSimulationRunning(true);
    setSimulationTime(0);
    setImpactOccurred(false);
    setImpactResults(null);
    console.log('Simulation started');
  };

  const stopSimulation = () => {
    setIsSimulationRunning(false);
    console.log('Simulation stopped');
  };

  const resetSimulation = () => {
    setIsSimulationRunning(false);
    setSimulationTime(0);
    setImpactOccurred(false);
    setImpactResults(null);
    setRecordedFrames([]);
    setIsRecording(false);
    
    // Reset asteroid position
    if (asteroidRef.current) {
      asteroidRef.current.position.set(50, 50, 50);
    }
    
    console.log('Simulation reset');
  };

  // Create star field background
  const createStarField = () => {
    const scene = sceneRef.current;
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  };

  // Setup lighting for the scene
  const setupLighting = () => {
    const scene = sceneRef.current;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Point light for dramatic effect
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
  };

  // Create Earth with realistic materials and atmosphere
  const createEarth = () => {
    const scene = sceneRef.current;
    
    // Earth geometry
    const earthGeometry = new THREE.SphereGeometry(6.371, 64, 64); // Earth radius in scale
    
    // Earth material with realistic properties
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x4169E1,
      shininess: 100,
      transparent: false
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.castShadow = true;
    earth.receiveShadow = true;
    earthRef.current = earth;
    scene.add(earth);

    // Atmosphere glow effect (simplified)
    if (showAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(6.5, 32, 32);
      const atmosphereMaterial = new THREE.MeshLambertMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.1
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      earth.add(atmosphere);
    }
  };

  // Create asteroid with realistic properties
  const createAsteroid = () => {
    const scene = sceneRef.current;
    
    // Calculate asteroid radius from diameter
    const radius = asteroidParams.diameter / 2000; // Scale for visualization
    
    // Asteroid geometry with irregular shape
    const asteroidGeometry = new THREE.DodecahedronGeometry(radius, 2);
    
    // Modify vertices for irregular shape
    const vertices = asteroidGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const noise = (Math.random() - 0.5) * 0.3;
      vertices[i] *= (1 + noise);
      vertices[i + 1] *= (1 + noise);
      vertices[i + 2] *= (1 + noise);
    }
    asteroidGeometry.attributes.position.needsUpdate = true;
    asteroidGeometry.computeVertexNormals();

    // Asteroid material based on composition
    let asteroidMaterial;
    switch (asteroidParams.composition) {
      case 'metallic':
        asteroidMaterial = new THREE.MeshStandardMaterial({
          color: 0x8c7853,
          metalness: 0.8,
          roughness: 0.3
        });
        break;
      case 'icy':
        asteroidMaterial = new THREE.MeshStandardMaterial({
          color: 0xadd8e6,
          metalness: 0.1,
          roughness: 0.8,
          transparent: true,
          opacity: 0.9
        });
        break;
      default: // rocky
        asteroidMaterial = new THREE.MeshStandardMaterial({
          color: 0x654321,
          metalness: 0.1,
          roughness: 0.9
        });
    }

    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.position.set(
      asteroidParams.position.x,
      asteroidParams.position.y,
      asteroidParams.position.z
    );
    asteroid.castShadow = true;
    asteroidRef.current = asteroid;
    scene.add(asteroid);

    // Create trajectory line
    if (showTrajectory) {
      createTrajectoryLine();
    }
  };

  // Create trajectory visualization
  const createTrajectoryLine = () => {
    const scene = sceneRef.current;
    
    // Simple trajectory calculation
    const trajectoryPoints = [];
    const start = new THREE.Vector3(asteroidParams.position.x, asteroidParams.position.y, asteroidParams.position.z);
    const end = new THREE.Vector3(0, 0, 0); // Earth center
    
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const point = start.clone().lerp(end, t);
      trajectoryPoints.push(point);
    }

    const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
    const trajectoryMaterial = new THREE.LineBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.7
    });

    const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    trajectoryLineRef.current = trajectoryLine;
    scene.add(trajectoryLine);
  };

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Update simulation if running
    if (isSimulationRunning) {
      updateSimulation();
    }

    // Update all systems
    if (earthModelRef.current) {
      earthModelRef.current.update(0.016);
    }

    if (asteroidSystemRef.current) {
      asteroidSystemRef.current.update(0.016);
    }

    if (explosionSystemRef.current) {
      explosionSystemRef.current.update();
    }

    if (debrisSystemRef.current) {
      debrisSystemRef.current.update(0.016);
    }

    if (atmosphereSystemRef.current) {
      atmosphereSystemRef.current.update(Date.now() * 0.001);
    }

    // Render scene
    if (composerRef.current) {
      composerRef.current.render();
    } else {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    // Record frame if recording
    if (isRecording) {
      captureFrame();
    }

    animationIdRef.current = requestAnimationFrame(animate);
  }, [isSimulationRunning, isRecording]);

  // Update simulation physics and animations
  const updateSimulation = () => {
    const deltaTime = 0.016 * timeScale; // 60fps scaled by time scale
    setSimulationTime(prev => prev + deltaTime);

    if (asteroidRef.current && !impactOccurred) {
      // Simple physics update
      const direction = new THREE.Vector3(0, 0, 0).sub(asteroidRef.current.position).normalize();
      asteroidRef.current.position.add(direction.multiplyScalar(asteroidVelocity * deltaTime * 0.01));

      // Check for impact
      const distanceToEarth = asteroidRef.current.position.distanceTo(new THREE.Vector3(0, 0, 0));
      if (distanceToEarth <= 6.371) { // Earth radius
        triggerImpact();
      }

      // Update camera if in follow mode
      if (cameraMode === 'follow') {
        updateCameraFollow();
      }
    }

    // Rotate Earth
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001 * timeScale;
    }
  };

  // Trigger impact effects
  const triggerImpact = () => {
    setImpactOccurred(true);
    
    // Create explosion effect
    if (explosionSystemRef.current && asteroidRef.current) {
      explosionSystemRef.current.createExplosion(asteroidRef.current.position, 1000);
    }

    // Create debris field
    if (debrisSystemRef.current && asteroidRef.current) {
      debrisSystemRef.current.createDebris(asteroidRef.current.position, 100);
    }

    // Hide asteroid
    if (asteroidRef.current) {
      asteroidRef.current.visible = false;
    }

    // Set impact results
    setImpactResults({
      impactEnergy: 1e20,
      tntEquivalent: 1e6,
      craterDiameter: 10000,
      seismicMagnitude: 8.5,
      thermalRadius: 50000,
      blastRadius: 100000,
      globalEffects: true
    });
  };

  // Camera follow mode
  const updateCameraFollow = () => {
    if (asteroidRef.current && cameraRef.current) {
      const asteroidPos = asteroidRef.current.position;
      const offset = new THREE.Vector3(10, 5, 10);
      cameraRef.current.position.copy(asteroidPos.clone().add(offset));
      cameraRef.current.lookAt(asteroidPos);
    }
  };

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
    
    if (composerRef.current) {
      composerRef.current.setSize(width, height);
    }
  }, []);

  // Initialize scene on mount
  useEffect(() => {
    initializeScene();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [initializeScene, animate, handleResize]);

  // Update asteroid when parameters change
  useEffect(() => {
    if (asteroidRef.current && sceneRef.current) {
      // Remove old asteroid
      sceneRef.current.remove(asteroidRef.current);
      
      // Remove old trajectory
      if (trajectoryLineRef.current) {
        sceneRef.current.remove(trajectoryLineRef.current);
      }
      
      // Create new asteroid with updated parameters
      createAsteroid();
    }
  }, [asteroidParams]);

  return (
    <div className="asteroid-impact-simulation">
      {/* 3D Viewport */}
      <div 
        ref={mountRef} 
        className="simulation-viewport"
        style={{ width: '100%', height: '70vh', position: 'relative' }}
      />
      
      {/* Control Panel */}
      <div className="simulation-controls">
        {/* Simulation Controls */}
        <div className="control-section">
          <h3>Simulation Controls</h3>
          <div className="button-group">
            <button 
              onClick={startSimulation}
              disabled={isSimulationRunning}
              className="btn btn-primary"
            >
              Start Simulation
            </button>
            <button 
              onClick={stopSimulation}
              disabled={!isSimulationRunning}
              className="btn btn-secondary"
            >
              Stop
            </button>
            <button 
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              className={`btn ${isRecording ? 'btn-danger' : 'btn-success'}`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button 
              onClick={downloadVideo}
              disabled={recordedFrames.length === 0}
              className="btn btn-info"
            >
              Download Video
            </button>
            <button 
              onClick={resetSimulation}
              className="btn btn-warning"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Asteroid Parameters */}
        <div className="control-section">
          <h3>Asteroid Parameters</h3>
          <div className="parameter-grid">
            <div className="parameter-item">
              <label>Diameter (m):</label>
              <input
                type="range"
                min="100"
                max="10000"
                value={asteroidParams.diameter}
                onChange={(e) => setAsteroidParams(prev => ({
                  ...prev,
                  diameter: parseInt(e.target.value)
                }))}
              />
              <span>{asteroidParams.diameter}m</span>
            </div>
            
            <div className="parameter-item">
              <label>Velocity (m/s):</label>
              <input
                type="range"
                min="5000"
                max="50000"
                value={asteroidParams.velocity}
                onChange={(e) => setAsteroidParams(prev => ({
                  ...prev,
                  velocity: parseInt(e.target.value)
                }))}
              />
              <span>{asteroidParams.velocity}m/s</span>
            </div>
            
            <div className="parameter-item">
              <label>Impact Angle (°):</label>
              <input
                type="range"
                min="15"
                max="90"
                value={asteroidParams.angle}
                onChange={(e) => setAsteroidParams(prev => ({
                  ...prev,
                  angle: parseInt(e.target.value)
                }))}
              />
              <span>{asteroidParams.angle}°</span>
            </div>
            
            <div className="parameter-item">
              <label>Composition:</label>
              <select
                value={asteroidParams.composition}
                onChange={(e) => setAsteroidParams(prev => ({
                  ...prev,
                  composition: e.target.value
                }))}
              >
                <option value="rocky">Rocky</option>
                <option value="metallic">Metallic</option>
                <option value="icy">Icy</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="control-section">
          <h3>View Controls</h3>
          <div className="view-controls">
            <div className="parameter-item">
              <label>Camera Mode:</label>
              <select
                value={cameraMode}
                onChange={(e) => setCameraMode(e.target.value)}
              >
                <option value="free">Free Camera</option>
                <option value="follow">Follow Asteroid</option>
                <option value="impact">Impact View</option>
                <option value="orbital">Orbital View</option>
              </select>
            </div>
            
            <div className="parameter-item">
              <label>Time Scale:</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              />
              <span>{timeScale}x</span>
            </div>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={showTrajectory}
                  onChange={(e) => setShowTrajectory(e.target.checked)}
                />
                Show Trajectory
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showAtmosphere}
                  onChange={(e) => setShowAtmosphere(e.target.checked)}
                />
                Show Atmosphere
              </label>
            </div>
          </div>
        </div>

        {/* Simulation Info */}
        <div className="control-section">
          <h3>Simulation Info</h3>
          <div className="info-display">
            <div className="info-item">
              <span>Status:</span>
              <span className={isSimulationRunning ? 'status-running' : 'status-stopped'}>
                {isSimulationRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="info-item">
              <span>Time:</span>
              <span>{simulationTime.toFixed(2)}s</span>
            </div>
            <div className="info-item">
              <span>Impact:</span>
              <span className={impactOccurred ? 'status-impact' : 'status-pending'}>
                {impactOccurred ? 'Occurred' : 'Pending'}
              </span>
            </div>
            <div className="info-item">
              <span>Recording:</span>
              <span className={isRecording ? 'status-recording' : 'status-idle'}>
                {isRecording ? 'Active' : 'Idle'}
              </span>
            </div>
          </div>
        </div>

        {/* Impact Results */}
        {impactResults && (
          <div className="impact-results">
            <h3>Impact Results</h3>
            <div className="results-grid">
              <div className="result-item">
                <label>Impact Energy:</label>
                <span>{(impactResults.impactEnergy / 1e15).toFixed(2)} PJ</span>
              </div>
              <div className="result-item">
                <label>TNT Equivalent:</label>
                <span>{(impactResults.tntEquivalent / 1e6).toFixed(2)} Megatons</span>
              </div>
              <div className="result-item">
                <label>Crater Diameter:</label>
                <span>{(impactResults.craterDiameter / 1000).toFixed(2)} km</span>
              </div>
              <div className="result-item">
                <label>Seismic Magnitude:</label>
                <span>{impactResults.seismicMagnitude.toFixed(1)}</span>
              </div>
              <div className="result-item">
                <label>Thermal Radius:</label>
                <span>{(impactResults.thermalRadius / 1000).toFixed(2)} km</span>
              </div>
              <div className="result-item">
                <label>Blast Radius:</label>
                <span>{(impactResults.blastRadius / 1000).toFixed(2)} km</span>
              </div>
              {impactResults.globalEffects && (
                <div className="result-item global-effects">
                  <label>Global Effects:</label>
                  <span className="warning">Potential global climate impact</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsteroidImpactSimulation;