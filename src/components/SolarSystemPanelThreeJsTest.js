import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SolarSystemCalculator } from '../utils/SolarSystemCalculator';
import { AstronomicalDataService } from '../services/AstronomicalDataService';
import './SolarSystemPanel.css';

// TEMPORARILY DISABLED FOR MAINTENANCE - Solar System functionality is under maintenance
/*
const SolarSystemPanelThreeJsTest = () => {
  console.log('🔄 SolarSystemPanelThreeJsTest component initializing...');

  // Refs for Three.js objects
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const composerRef = useRef(null);

  // Service refs
  const calculatorRef = useRef(null);
  const dataServiceRef = useRef(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [liveData, setLiveData] = useState(null);
  const [solarData, setSolarData] = useState(null);

  // Initialize services
  useEffect(() => {
    console.log('🔧 Initializing services...');
    try {
      calculatorRef.current = new SolarSystemCalculator();
      dataServiceRef.current = new AstronomicalDataService();
      console.log('✅ Services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing services:', error);
    }
  }, []);

  // Fetch live data function
  const fetchLiveData = useCallback(async (date) => {
    console.log('📡 Fetching live data...');
    try {
      if (dataServiceRef.current) {
        const data = await dataServiceRef.current.getLiveAstronomicalData(date);
        setLiveData(data);
        console.log('✅ Live data fetched successfully');
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch live data, using calculated positions:', error);
    }
  }, []);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    console.log('🎬 Initializing Three.js scene...');
    if (!mountRef.current) {
      console.error('❌ Mount ref not available');
      return;
    }

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011);
      sceneRef.current = scene;
      console.log('✅ Scene created');

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000000
      );
      camera.position.set(0, 50, 100);
      cameraRef.current = camera;
      console.log('✅ Camera created');

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
      console.log('✅ Renderer created and added to DOM');

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
      console.log('✅ Controls created');

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
      console.log('✅ Post-processing setup complete');

      // Add a simple test cube to verify rendering
      const geometry = new THREE.BoxGeometry(10, 10, 10);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      console.log('✅ Test cube added to scene');

      // Add ambient lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
      scene.add(ambientLight);
      console.log('✅ Ambient light added');

      setIsLoading(false);
      console.log('✅ Scene initialization complete');
    } catch (error) {
      console.error('❌ Error during scene initialization:', error);
    }
  }, []);

  // Simple animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const animateFrame = () => {
      requestAnimationFrame(animateFrame);

      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Rotate the test cube
      const cube = sceneRef.current.children.find(child => child.geometry?.type === 'BoxGeometry');
      if (cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }

      // Render
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animateFrame();
  }, []);

  // Fetch live data on mount
  useEffect(() => {
    console.log('📡 Setting up data fetching...');
    fetchLiveData(new Date());
  }, [fetchLiveData]);

  // Initialize scene on mount
  useEffect(() => {
    console.log('🎬 Setting up Three.js initialization...');
    initScene();
    
    // Start animation loop after a short delay
    setTimeout(() => {
      console.log('🎮 Starting animation loop...');
      animate();
    }, 100);

    return () => {
      console.log('🧹 Cleaning up Three.js resources...');
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []); // Remove dependencies to prevent infinite loop

  return (
    <div className="solar-system-panel">
      <div className="panel-header">
        <h2>🧪 Three.js Initialization Test</h2>
        <p>Testing Three.js scene setup with simple cube</p>
      </div>
      
      {isLoading && (
        <div className="loading-indicator">
          <p>Initializing Three.js scene...</p>
        </div>
      )}
      
      <div 
        ref={mountRef} 
        className="three-container"
        style={{ 
          width: '100%', 
          height: '500px', 
          border: '1px solid #333',
          backgroundColor: '#000011'
        }}
      />
      
      <div className="control-panel">
        <p>Status: {isLoading ? 'Loading...' : 'Ready'}</p>
        <p>Current Date: {currentDate.toLocaleString()}</p>
        <p>Live Data: {liveData ? 'Available' : 'Loading...'}</p>
      </div>
    </div>
  );
};
*/

// Placeholder component during maintenance
const SolarSystemPanelThreeJsTest = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>🔧 Solar System Panel Three.js Test</h3>
      <p>This component is temporarily disabled for maintenance.</p>
      <p>Please check back later.</p>
    </div>
  );
};

export default SolarSystemPanelThreeJsTest;