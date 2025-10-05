import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { SolarSystemCalculator } from '../utils/SolarSystemCalculator';
import { AstronomicalDataService } from '../services/AstronomicalDataService';
import { PLANETARY_DATA, SCALE_FACTORS, PLANET_COLORS, ORBITAL_CONSTANTS, TEXTURE_URLS } from '../data/planetaryData';
import PlanetInfoPanel from './PlanetInfoPanel';
import './SolarSystemPanel.css';

const SolarSystemPanel = () => {
  console.log('🌌 SolarSystemPanel: Component initializing...');
  console.log('🌌 SolarSystemPanel: React:', React);
  console.log('🌌 SolarSystemPanel: THREE:', THREE);
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const cameraRef = useRef(null);
  const composerRef = useRef(null);
  const controlsRef = useRef(null);
  const animationIdRef = useRef(null);
  const celestialBodiesRef = useRef({});
  const planetsRef = useRef({});
  const orbitsRef = useRef({});
  const labelsRef = useRef({});
  const sunRef = useRef(null);
  const orbitalLinesRef = useRef({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedBody, setSelectedBody] = useState(null);
  const [viewMode, setViewMode] = useState('heliocentric'); // heliocentric, geocentric
  const [isPlaying, setIsPlaying] = useState(true);
  const [liveData, setLiveData] = useState(null);
  const [solarData, setSolarData] = useState(null);
  const [lunarData, setLunarData] = useState(null);
  const [showPlanetInfo, setShowPlanetInfo] = useState(false);
  const [selectedPlanetData, setSelectedPlanetData] = useState(null);
  const [infoPanelPosition, setInfoPanelPosition] = useState({ x: 0, y: 0 });
  
  console.log('🌌 SolarSystemPanel: State initialized, isLoading:', isLoading);

  // Services
  const calculatorRef = useRef(new SolarSystemCalculator());
  const dataServiceRef = useRef(new AstronomicalDataService());

  // Fetch live astronomical data
  const fetchLiveData = useCallback(async (dateToUse = null) => {
    try {
      const targetDate = dateToUse || currentDate;
      const [planetaryData, solarInfo, lunarInfo] = await Promise.all([
        calculatorRef.current.getLivePlanetaryPositions(targetDate),
        calculatorRef.current.getLiveSolarData(targetDate),
        calculatorRef.current.getLiveLunarData(targetDate)
      ]);
      
      setLiveData(planetaryData);
      setSolarData(solarInfo);
      setLunarData(lunarInfo);
    } catch (error) {
      console.warn('Failed to fetch live data, using calculated positions:', error);
    }
  }, []); // Remove currentDate dependency

  // Initialize Three.js scene
  const initScene = useCallback(() => {
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
      1000000
    );
    camera.position.set(0, 50, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CSS2D Renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    mountRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 50000;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controlsRef.current = controls;

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Add starfield
    createStarfield();

    // Enhanced lighting system
    // Ambient lighting for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.15);
    scene.add(ambientLight);

    // Directional light for enhanced shadows and depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    // Rim light for atmospheric effects
    const rimLight = new THREE.DirectionalLight(0x87ceeb, 0.2);
    rimLight.position.set(-30, 20, -30);
    rimLight.castShadow = false;
    scene.add(rimLight);

    // Add particle effects
    createCosmicDust();
    createSolarWind();

    setIsLoading(false);
  }, []);

  // Create realistic starfield background
  const createStarfield = () => {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Random positions on a sphere
      const radius = 50000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Star colors (white to blue-white)
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.1, 0.2, 0.8 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(stars);
  };

  // Create cosmic dust particles for enhanced atmosphere
  const createCosmicDust = () => {
    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 5000;
    const positions = new Float32Array(dustCount * 3);
    const velocities = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      // Random positions in a large sphere around the solar system
      const radius = 1000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random velocities for gentle movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dustGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const dustMaterial = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.5,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });

    const cosmicDust = new THREE.Points(dustGeometry, dustMaterial);
    cosmicDust.name = 'cosmicDust';
    sceneRef.current.add(cosmicDust);
  };

  // Create solar wind particle effects
  const createSolarWind = () => {
    const windGeometry = new THREE.BufferGeometry();
    const windCount = 2000;
    const positions = new Float32Array(windCount * 3);
    const velocities = new Float32Array(windCount * 3);

    for (let i = 0; i < windCount; i++) {
      // Start particles near the sun
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 20;
      
      positions[i * 3] = Math.cos(angle) * distance;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = Math.sin(angle) * distance;

      // Radial velocities away from the sun
      const speed = 0.5 + Math.random() * 1.5;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 2] = Math.sin(angle) * speed;
    }

    windGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    windGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const windMaterial = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 1.0,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const solarWind = new THREE.Points(windGeometry, windMaterial);
    solarWind.name = 'solarWind';
    sceneRef.current.add(solarWind);
  };

  // Create the Sun with realistic effects using NASA data
  const createSun = useCallback(() => {
    const sunGroup = new THREE.Group();
    const sunData = PLANETARY_DATA.sun;
    
    // Sun sphere with NASA data properties
    const scaledRadius = sunData.radius * SCALE_FACTORS.SIZE * 0.1; // Scale down for visibility
    const sunGeometry = new THREE.SphereGeometry(Math.max(scaledRadius, 3), 64, 64);
    
    // Create realistic sun material based on NASA temperature data
    const temperatureRatio = sunData.temperature / 6000; // Normalize to solar temperature
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.1, 0.9, Math.min(temperatureRatio, 1)),
      emissive: PLANET_COLORS.sun,
      emissiveIntensity: 0.8
    });
    
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.castShadow = false;
    sun.receiveShadow = false;
    
    // Add realistic rotation based on NASA data (25.05 day period)
    const rotationSpeed = (2 * Math.PI) / (sunData.rotationPeriod * 24 * 60 * 60 * SCALE_FACTORS.TIME);
    sun.userData = { rotationSpeed };
    
    // Apply axial tilt from NASA data
    sun.rotation.z = sunData.axialTilt * Math.PI / 180;
    
    sunGroup.add(sun);

    // Enhanced corona effect with multiple layers
    const coronaLayers = [
      { radius: scaledRadius * 1.2, opacity: 0.4, color: 0xFFAA00 },
      { radius: scaledRadius * 1.5, opacity: 0.2, color: 0xFF6600 },
      { radius: scaledRadius * 2.0, opacity: 0.1, color: 0xFF3300 }
    ];
    
    coronaLayers.forEach((layer, index) => {
      const coronaGeometry = new THREE.SphereGeometry(layer.radius, 32, 32);
      const coronaMaterial = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.BackSide
      });
      const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
      corona.userData = { rotationSpeed: rotationSpeed * (1 + index * 0.1) }; // Slightly different rotation speeds
      sunGroup.add(corona);
    });

    // Realistic solar lighting based on NASA luminosity data
    const lightIntensity = Math.min(sunData.luminosity / 3.828e26 * 2, 3); // Normalize and scale
    const sunLight = new THREE.PointLight(0xFFFFAA, lightIntensity, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 10000;
    sunGroup.add(sunLight);

    sunGroup.position.set(0, 0, 0);
    sceneRef.current.add(sunGroup);
    sunRef.current = sunGroup;
    
    // Store sun reference with all components
    celestialBodiesRef.current.sun = {
      group: sunGroup,
      mesh: sun,
      light: sunLight,
      rotationSpeed: rotationSpeed,
      data: sunData
    };
  }, []);

  // Create planet label that appears when zoomed in
  const createPlanetLabel = useCallback((name, planetGroup) => {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    labelDiv.style.cssText = `
      color: white;
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      font-weight: bold;
      background: rgba(0, 0, 0, 0.7);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
    `;

    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 0, 0);
    label.visible = showLabels;
    planetGroup.add(label);
    
    // Store label reference
    labelsRef.current[name] = label;
    
    return label;
  }, [showLabels]);

  // Create a planet with realistic properties and NASA data
  const createPlanet = useCallback((name, config) => {
    const planetGroup = new THREE.Group();
    
    // Get NASA planetary data
    const planetData = PLANETARY_DATA[name];
    const livePosition = liveData?.[name?.toLowerCase()];
    
    // Planet sphere with NASA-based properties
    const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
    
    // Enhanced material with realistic NASA textures
    const textureLoader = new THREE.TextureLoader();
    const materialProps = {
      color: config.color,
      shininess: config.shininess || 30,
      specular: config.hasAtmosphere ? 0x111111 : 0x000000
    };
    
    // Load realistic texture based on planet with error handling
    if (TEXTURE_URLS[name]) {
      try {
        materialProps.map = textureLoader.load(
          TEXTURE_URLS[name],
          // onLoad
          (texture) => {
            console.log(`✅ Loaded texture for ${name}`);
          },
          // onProgress
          undefined,
          // onError
          (error) => {
            console.warn(`⚠️ Failed to load texture for ${name}, using fallback color`);
          }
        );
      } catch (error) {
        console.warn(`⚠️ Error loading texture for ${name}:`, error);
      }
    }
    
    // Special handling for Earth with multiple texture layers
    if (name === 'earth') {
      try {
        materialProps.map = textureLoader.load(TEXTURE_URLS.earth);
        // Add normal map for surface detail
        if (TEXTURE_URLS.earthNormal) {
          materialProps.normalMap = textureLoader.load(TEXTURE_URLS.earthNormal);
          materialProps.normalScale = new THREE.Vector2(0.5, 0.5);
        }
      } catch (error) {
        console.warn(`⚠️ Error loading Earth textures:`, error);
      }
    }
    
    const material = new THREE.MeshPhongMaterial(materialProps);
    const planet = new THREE.Mesh(geometry, material);
    planet.name = name;
    
    // Enable shadows for enhanced visual depth
    planet.castShadow = true;
    planet.receiveShadow = true;
    
    // Apply realistic rotation based on NASA data
    const rotationSpeed = (2 * Math.PI) / (planetData.rotationPeriod * 24 * 60 * 60 * SCALE_FACTORS.TIME);
    planet.userData = { rotationSpeed };
    
    // Apply live rotation if available, otherwise use calculated rotation
    if (livePosition?.rotation) {
      planet.rotation.y = livePosition.rotation;
    } else {
      // Calculate rotation based on current time and NASA rotation period
      const currentTime = Date.now() / 1000;
      const rotationAngle = (currentTime * rotationSpeed) % (2 * Math.PI);
      planet.rotation.y = rotationAngle;
    }
    
    // Apply NASA axial tilt data
    if (planetData?.axialTilt) {
      planet.rotation.z = planetData.axialTilt * Math.PI / 180;
      
      // Create axis line to visualize tilt
      const axisGeometry = new THREE.CylinderGeometry(0.01, 0.01, config.radius * 3);
      const axisMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.5 
      });
      const axisLine = new THREE.Mesh(axisGeometry, axisMaterial);
      axisLine.rotation.z = planetData.axialTilt * Math.PI / 180;
      planetGroup.add(axisLine);
    }
    
    planetGroup.add(planet);

    // Enhanced atmosphere for applicable planets
    if (config.hasAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(config.radius * 1.05, 32, 32);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: config.atmosphereColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphere.userData.isAtmosphere = true; // Mark as atmosphere for click detection
      planetGroup.add(atmosphere);
      
      // Special cloud layer for Earth
      if (name === 'earth' && TEXTURE_URLS.earthClouds) {
        try {
          const cloudGeometry = new THREE.SphereGeometry(config.radius * 1.02, 32, 32);
          const cloudMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load(TEXTURE_URLS.earthClouds),
            transparent: true,
            opacity: 0.4,
            depthWrite: false
          });
          const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
          clouds.userData = { rotationSpeed: rotationSpeed * 1.1 }; // Clouds rotate slightly faster
          planetGroup.add(clouds);
        } catch (error) {
          console.warn(`⚠️ Error loading Earth cloud texture:`, error);
        }
      }
    }

    // Enhanced rings for Saturn with realistic textures
    if (config.hasRings) {
      const ringGeometry = new THREE.RingGeometry(config.radius * 1.2, config.radius * 2.2, 64);
      
      // Create realistic ring material
      const ringMaterialProps = {
        color: 0xC4A484,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      };
      
      // Add Saturn ring texture if available
      if (name === 'saturn' && TEXTURE_URLS.saturnRings) {
        try {
          ringMaterialProps.map = textureLoader.load(TEXTURE_URLS.saturnRings);
          ringMaterialProps.alphaMap = textureLoader.load(TEXTURE_URLS.saturnRings);
        } catch (error) {
          console.warn(`⚠️ Error loading Saturn ring texture:`, error);
        }
      }
      
      const ringMaterial = new THREE.MeshBasicMaterial(ringMaterialProps);
      const rings = new THREE.Mesh(ringGeometry, ringMaterial);
      rings.rotation.x = Math.PI / 2;
      
      // Apply ring tilt based on planet's axial tilt
      if (planetData?.axialTilt) {
        rings.rotation.z = planetData.axialTilt * Math.PI / 180;
      }
      
      planetGroup.add(rings);
    }

    // Add moons based on NASA data
    if (planetData?.moons && planetData.moons.length > 0) {
      planetData.moons.forEach((moonData, index) => {
        const moonGroup = new THREE.Group();
        
        // Moon geometry and material with realistic textures
        const moonRadius = config.radius * moonData.relativeSize;
        const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
        
        const moonMaterialProps = {
          color: moonData.color || 0x888888,
          shininess: 10
        };
        
        // Add realistic texture for Earth's Moon
        if (name === 'earth' && moonData.name === 'Moon' && TEXTURE_URLS.moon) {
          try {
            moonMaterialProps.map = textureLoader.load(TEXTURE_URLS.moon);
          } catch (error) {
            console.warn(`⚠️ Error loading Moon texture:`, error);
          }
        }
        
        const moonMaterial = new THREE.MeshPhongMaterial(moonMaterialProps);
        
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.castShadow = true;
        moon.receiveShadow = true;
        
        // Moon orbital properties
        const moonOrbitRadius = config.radius * moonData.orbitRadius;
        const moonOrbitalSpeed = (2 * Math.PI) / (moonData.orbitalPeriod * 24 * 60 * 60 * SCALE_FACTORS.TIME);
        
        // Position moon in orbit
        const currentTime = Date.now() / 1000;
        const moonAngle = (currentTime * moonOrbitalSpeed) % (2 * Math.PI);
        moon.position.set(
          Math.cos(moonAngle) * moonOrbitRadius,
          0,
          Math.sin(moonAngle) * moonOrbitRadius
        );
        
        // Store moon data for animation
        moon.userData = {
          orbitRadius: moonOrbitRadius,
          orbitalSpeed: moonOrbitalSpeed,
          name: moonData.name
        };
        
        moonGroup.add(moon);
        
        // Create moon orbit path
        const moonOrbitPoints = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          moonOrbitPoints.push(new THREE.Vector3(
            Math.cos(angle) * moonOrbitRadius,
            0,
            Math.sin(angle) * moonOrbitRadius
          ));
        }
        
        const moonOrbitGeometry = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
        const moonOrbitMaterial = new THREE.LineBasicMaterial({ 
          color: 0x444444, 
          transparent: true, 
          opacity: 0.3 
        });
        const moonOrbitLine = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
        moonGroup.add(moonOrbitLine);
        
        planetGroup.add(moonGroup);
        
        // Store moon reference
        if (!celestialBodiesRef.current[name + '_moons']) {
          celestialBodiesRef.current[name + '_moons'] = [];
        }
        celestialBodiesRef.current[name + '_moons'].push({
          mesh: moon,
          group: moonGroup,
          data: moonData
        });
      });
    }

    // Position planet using enhanced orbital mechanics
    let position;
    if (livePosition) {
      position = {
        x: livePosition.x,
        y: livePosition.y || 0,
        z: livePosition.z
      };
    } else {
      // Calculate accurate position using Kepler's laws and NASA data
      const currentTime = currentDate.getTime() / 1000;
      const epochTime = new Date('2000-01-01T12:00:00Z').getTime() / 1000; // J2000 epoch
      const daysSinceEpoch = (currentTime - epochTime) / (24 * 60 * 60);
      
      // Mean anomaly calculation
      const meanMotion = (2 * Math.PI) / planetData.orbitalPeriod; // radians per day
      const meanAnomaly = (meanMotion * daysSinceEpoch) % (2 * Math.PI);
      
      // Simplified eccentric anomaly (assuming low eccentricity)
      const eccentricity = planetData.eccentricity || 0;
      const eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly);
      
      // True anomaly
      const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
      );
      
      // Distance from sun (accounting for elliptical orbit)
      const semiMajorAxis = config.orbitRadius;
      const distance = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
      
      // Apply orbital inclination and longitude of ascending node
      const inclination = (planetData?.inclination || 0) * Math.PI / 180;
      const longitudeOfAscendingNode = (planetData?.longitudeOfAscendingNode || 0) * Math.PI / 180;
      const argumentOfPeriapsis = (planetData?.argumentOfPeriapsis || 0) * Math.PI / 180;
      
      // Position in orbital plane
      const xOrbital = distance * Math.cos(trueAnomaly + argumentOfPeriapsis);
      const yOrbital = distance * Math.sin(trueAnomaly + argumentOfPeriapsis);
      
      // Transform to 3D space
      position = {
        x: xOrbital * Math.cos(longitudeOfAscendingNode) - yOrbital * Math.cos(inclination) * Math.sin(longitudeOfAscendingNode),
        y: yOrbital * Math.sin(inclination),
        z: xOrbital * Math.sin(longitudeOfAscendingNode) + yOrbital * Math.cos(inclination) * Math.cos(longitudeOfAscendingNode)
      };
    }
    
    planetGroup.position.set(position.x, position.y, position.z);

    // Create planet label
    createPlanetLabel(name, planetGroup);

    sceneRef.current.add(planetGroup);
    
    celestialBodiesRef.current[name] = {
      group: planetGroup,
      mesh: planet,
      config: config,
      currentPosition: new THREE.Vector3(),
      rotationSpeed: config.rotationSpeed,
      orbitalSpeed: config.orbitalSpeed,
      liveData: livePosition,
      planetData: planetData
    };

    // Create orbital path
    if (showOrbits) {
      createOrbitPath(name, config);
    }
  }, [showOrbits, currentDate, liveData]);

  // Create orbital path visualization
  const createOrbitPath = (name, config) => {
    const points = [];
    const segments = 128;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * config.orbitRadius;
      const z = Math.sin(angle) * config.orbitRadius;
      points.push(new THREE.Vector3(x, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: config.orbitColor || 0x444444,
      transparent: true,
      opacity: 0.5
    });
    const orbitLine = new THREE.Line(geometry, material);
    sceneRef.current.add(orbitLine);
    
    orbitalLinesRef.current[name] = orbitLine;
  };

  // Initialize all celestial bodies
  const initializeCelestialBodies = () => {
    // Create the Sun
    createSun();

    // Generate planet configurations from NASA data
    const planetConfigs = {};
    
    Object.keys(PLANETARY_DATA).forEach(planetName => {
      if (planetName === 'sun') return; // Skip sun, handled separately
      
      const planetData = PLANETARY_DATA[planetName];
      const scaledRadius = planetData.radius * SCALE_FACTORS.SIZE;
      const scaledDistance = planetData.distanceFromSun * SCALE_FACTORS.DISTANCE;
      
      planetConfigs[planetName] = {
        // Physical properties from NASA data
        radius: Math.max(scaledRadius, 0.1), // Minimum visible size
        color: PLANET_COLORS[planetName],
        
        // Orbital properties from NASA data
        orbitRadius: Math.max(scaledDistance, 5), // Minimum orbital distance for visibility
        orbitalPeriod: planetData.orbitalPeriod, // Earth days
        rotationPeriod: planetData.rotationPeriod, // Earth days
        
        // Calculated speeds for animation
        rotationSpeed: planetData.rotationPeriod > 0 ? 
          (2 * Math.PI) / (planetData.rotationPeriod * 24 * 60 * 60 * SCALE_FACTORS.TIME) :
          -(2 * Math.PI) / (Math.abs(planetData.rotationPeriod) * 24 * 60 * 60 * SCALE_FACTORS.TIME),
        orbitalSpeed: (2 * Math.PI) / (planetData.orbitalPeriod * 24 * 60 * 60 * SCALE_FACTORS.TIME),
        
        // Visual properties
        orbitColor: PLANET_COLORS[planetName],
        
        // Special features based on NASA data
        hasAtmosphere: planetData.atmosphere && typeof planetData.atmosphere === 'object',
        atmosphereColor: planetName === 'venus' ? 0xFFAA00 : 
                        planetName === 'earth' ? 0x87CEEB : 
                        planetName === 'mars' ? 0xCD853F : 0x404040,
        
        hasRings: planetName === 'saturn' || planetName === 'jupiter' || planetName === 'uranus' || planetName === 'neptune',
        
        // NASA data reference
        nasaData: planetData,
        
        // Axial tilt from NASA data
        axialTilt: planetData.axialTilt,
        
        // Moons data
        moons: planetData.moons || []
      };
    });

    // Override specific visual adjustments for better visibility
    if (planetConfigs.mercury) {
      planetConfigs.mercury.orbitRadius = Math.max(planetConfigs.mercury.orbitRadius, 8);
    }
    if (planetConfigs.venus) {
      planetConfigs.venus.orbitRadius = Math.max(planetConfigs.venus.orbitRadius, 12);
    }
    if (planetConfigs.earth) {
      planetConfigs.earth.orbitRadius = Math.max(planetConfigs.earth.orbitRadius, 16);
    }
    if (planetConfigs.mars) {
      planetConfigs.mars.orbitRadius = Math.max(planetConfigs.mars.orbitRadius, 24);
    }
    if (planetConfigs.jupiter) {
      planetConfigs.jupiter.orbitRadius = Math.max(planetConfigs.jupiter.orbitRadius, 40);
    }
    if (planetConfigs.saturn) {
      planetConfigs.saturn.orbitRadius = Math.max(planetConfigs.saturn.orbitRadius, 60);
    }
    if (planetConfigs.uranus) {
      planetConfigs.uranus.orbitRadius = Math.max(planetConfigs.uranus.orbitRadius, 80);
    }
    if (planetConfigs.neptune) {
      planetConfigs.neptune.orbitRadius = Math.max(planetConfigs.neptune.orbitRadius, 100);
    }

    // Create all planets using NASA data
    Object.keys(planetConfigs).forEach(planetName => {
      const planetData = PLANETARY_DATA[planetName];
      createPlanet(planetName, planetConfigs[planetName]);
    });

  };

  // Animation loop with live data integration
  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Update celestial body positions and rotations
    if (isPlaying) {
      updateCelestialBodies();
      updateParticleEffects();
    }

    // Update label visibility
    updateLabels();

    // Render scene
    if (composerRef.current) {
      composerRef.current.render();
    } else {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    // Render labels
    if (labelRendererRef.current) {
      labelRendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    animationIdRef.current = requestAnimationFrame(animate);
  }, [isPlaying, solarData, lunarData]);

  // Update celestial body positions based on current time
  const updateCelestialBodies = () => {
    const deltaTime = timeSpeed * 0.001; // Convert to appropriate time scale
    
    Object.entries(celestialBodiesRef.current).forEach(([name, body]) => {
      // Skip moon arrays (they end with '_moons')
      if (name.endsWith('_moons')) {
        return;
      }

      // Skip if body is not a valid celestial body object (should have group, mesh, etc.)
      if (!body || typeof body !== 'object' || Array.isArray(body) || !body.group || !body.mesh) {
        return;
      }

      if (name === 'sun') {
        // Rotate the sun and its corona layers
        body.mesh.rotation.y += body.rotationSpeed * deltaTime;
        // Rotate corona layers with different speeds
        body.group.children.forEach(child => {
          if (child.userData && child.userData.rotationSpeed) {
            child.rotation.y += child.userData.rotationSpeed * deltaTime;
          }
        });
        return;
      }

      // Skip if body doesn't have proper config or orbitRadius
      if (!body.config || typeof body.config.orbitRadius === 'undefined') {
        console.warn(`Skipping ${name}: missing config or orbitRadius`);
        return;
      }

      // Calculate orbital position
      const time = Date.now() * deltaTime;
      const angle = time * body.orbitalSpeed;
      const x = Math.cos(angle) * body.config.orbitRadius;
      const z = Math.sin(angle) * body.config.orbitRadius;
      
      body.group.position.set(x, 0, z);
      body.currentPosition.set(x, 0, z);
      
      // Rotate the planet
      body.mesh.rotation.y += body.rotationSpeed * deltaTime;
      
      // Special handling for Earth's clouds
      if (name === 'earth') {
        body.group.children.forEach(child => {
          if (child.userData && child.userData.rotationSpeed) {
            child.rotation.y += child.userData.rotationSpeed * deltaTime;
          }
        });
      }
    });

    // Update current date for display
    setCurrentDate(new Date(Date.now() + timeSpeed * 1000));
  };

  // Update particle effects for enhanced visual appeal
  const updateParticleEffects = () => {
    if (!sceneRef.current) return;

    // Update cosmic dust
    const cosmicDust = sceneRef.current.getObjectByName('cosmicDust');
    if (cosmicDust && cosmicDust.geometry) {
      const positions = cosmicDust.geometry.attributes.position.array;
      const velocities = cosmicDust.geometry.attributes.velocity.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Reset particles that drift too far
        const distance = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
        if (distance > 5000) {
          const radius = 1000 + Math.random() * 2000;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          
          positions[i] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i + 2] = radius * Math.cos(phi);
        }
      }
      cosmicDust.geometry.attributes.position.needsUpdate = true;
    }

    // Update solar wind
    const solarWind = sceneRef.current.getObjectByName('solarWind');
    if (solarWind && solarWind.geometry) {
      const positions = solarWind.geometry.attributes.position.array;
      const velocities = solarWind.geometry.attributes.velocity.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Reset particles that drift too far from the sun
        const distance = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
        if (distance > 1000) {
          const angle = Math.random() * Math.PI * 2;
          const startDistance = 10 + Math.random() * 20;
          
          positions[i] = Math.cos(angle) * startDistance;
          positions[i + 1] = (Math.random() - 0.5) * 10;
          positions[i + 2] = Math.sin(angle) * startDistance;

          const speed = 0.5 + Math.random() * 1.5;
          velocities[i] = Math.cos(angle) * speed;
          velocities[i + 1] = (Math.random() - 0.5) * 0.2;
          velocities[i + 2] = Math.sin(angle) * speed;
        }
      }
      solarWind.geometry.attributes.position.needsUpdate = true;
    }
  };

  // Update label visibility based on camera distance and showLabels state
  const updateLabels = useCallback(() => {
    if (!labelsRef.current || !cameraRef.current) return;

    Object.values(labelsRef.current).forEach(label => {
      if (!label || !label.parent) return;

      // Calculate distance from camera to planet
      const planetPosition = new THREE.Vector3();
      label.parent.getWorldPosition(planetPosition);
      const cameraDistance = cameraRef.current.position.distanceTo(planetPosition);

      // Show labels when zoomed in (distance < 200) and showLabels is true
      const shouldShow = showLabels && cameraDistance < 200;
      label.element.style.display = shouldShow ? 'block' : 'none';

      // Adjust label opacity based on distance for smooth transition
      if (shouldShow) {
        const opacity = Math.max(0, Math.min(1, (200 - cameraDistance) / 100));
        label.element.style.opacity = opacity.toString();
      }
    });
  }, [showLabels]);

  // Handle planet click for detailed information
  const handlePlanetClick = useCallback((event) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Get all planet meshes for intersection testing
    const planetMeshes = [];
    Object.values(celestialBodiesRef.current).forEach(body => {
      if (body.group && body.name !== 'Sun') {
        body.group.traverse((child) => {
          if (child.isMesh && child.geometry.type === 'SphereGeometry' && !child.userData.isAtmosphere) {
            child.userData.planetName = body.name;
            planetMeshes.push(child);
          }
        });
      }
    });

    const intersects = raycasterRef.current.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
      const clickedPlanet = intersects[0].object;
      const planetName = clickedPlanet.userData.planetName;
      const planetData = PLANETARY_DATA[planetName?.toLowerCase()];

      if (planetData) {
        setSelectedPlanetData({
          name: planetName,
          ...planetData
        });
        setInfoPanelPosition({
          x: event.clientX,
          y: event.clientY
        });
        setShowPlanetInfo(true);
      }
    }
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(width, height);
    
    if (composerRef.current) {
      composerRef.current.setSize(width, height);
    }

    if (labelRendererRef.current) {
      labelRendererRef.current.setSize(width, height);
    }
  }, []);

  // Fetch live data on mount and set up interval
  useEffect(() => {
    fetchLiveData(new Date());
    
    // Set up interval to fetch live data every 5 minutes
    const interval = setInterval(() => fetchLiveData(new Date()), 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchLiveData]); // Only depend on fetchLiveData, not currentDate

  // Initialize scene on mount
  useEffect(() => {
    initScene();
    initializeCelestialBodies();
    animate();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Add click listener for planet interaction
    if (mountRef.current) {
      mountRef.current.addEventListener('click', handlePlanetClick);
    }

    return () => {
      // Cleanup
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Remove click listener
      if (mountRef.current) {
        mountRef.current.removeEventListener('click', handlePlanetClick);
      }
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }

      if (mountRef.current && labelRendererRef.current) {
        mountRef.current.removeChild(labelRendererRef.current.domElement);
      }
      
      // Dispose of Three.js objects
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [handlePlanetClick]); // Include handlePlanetClick dependency

  // Toggle orbit visibility
  const toggleOrbits = () => {
    setShowOrbits(!showOrbits);
    Object.values(orbitalLinesRef.current).forEach(line => {
      line.visible = !showOrbits;
    });
  };

  // Control panel JSX
  const controlPanelJSX = (
    <div className="solar-system-controls">
      <div className="control-group">
        <h3>Time Controls</h3>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`control-btn ${isPlaying ? 'playing' : 'paused'}`}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <div className="time-speed-control">
          <label>Speed: {timeSpeed}x</label>
          <input
            type="range"
            min="0.1"
            max="1000"
            step="0.1"
            value={timeSpeed}
            onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
          />
        </div>
        <div className="current-date">
          {currentDate.toLocaleDateString()} {currentDate.toLocaleTimeString()}
        </div>
      </div>

      <div className="control-group">
        <h3>Display Options</h3>
        <button 
          onClick={toggleOrbits}
          className={`control-btn ${showOrbits ? 'active' : ''}`}
        >
          Show Orbits
        </button>
        <button 
          onClick={() => setShowLabels(!showLabels)}
          className={`control-btn ${showLabels ? 'active' : ''}`}
        >
          Show Labels
        </button>
        <select 
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value)}
          className="view-mode-select"
        >
          <option value="realistic">Realistic Scale</option>
          <option value="scaled">Scaled for Visibility</option>
        </select>
      </div>

      <div className="control-group">
        <h3>Camera Presets</h3>
        <button onClick={() => {/* Focus on Sun */}} className="control-btn">
          Focus Sun
        </button>
        <button onClick={() => {/* Focus on Earth */}} className="control-btn">
          Focus Earth
        </button>
        <button onClick={() => {/* Solar System Overview */}} className="control-btn">
          Overview
        </button>
      </div>
    </div>
  );

  console.log('🌌 SolarSystemPanel: Rendering component, isLoading:', isLoading);
  
  return (
    <div className="solar-system-panel">
      <div className="solar-system-header">
        <h1>Live Solar System Simulation</h1>
        <p>Real-time planetary positions and orbital mechanics</p>
      </div>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Initializing Solar System...</p>
        </div>
      )}
      
      <div className="solar-system-container">
        <div ref={mountRef} className="solar-system-canvas" />
        {controlPanelJSX}
      </div>
      
      {selectedBody && (
        <div className="info-panel">
          <h3>{selectedBody.name}</h3>
          <p>Distance from Sun: {selectedBody.distance} AU</p>
          <p>Orbital Period: {selectedBody.orbitalPeriod} days</p>
          <p>Rotation Period: {selectedBody.rotationPeriod} hours</p>
        </div>
      )}

      {showPlanetInfo && selectedPlanetData && (
        <PlanetInfoPanel
          planetData={selectedPlanetData}
          position={infoPanelPosition}
          onClose={() => setShowPlanetInfo(false)}
        />
      )}
    </div>
  );
};

export default SolarSystemPanel;