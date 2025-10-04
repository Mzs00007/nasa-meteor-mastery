import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { useISSData, useWebSocket } from '../../hooks/useWebSocket';
import './ISSTrackingVisualization.css';

const ISSTrackingVisualization = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const issRef = useRef(null);
  const orbitPathRef = useRef(null);
  const earthRef = useRef(null);
  const animationRef = useRef(null);

  const [viewMode, setViewMode] = useState('3d'); // '3d', 'map', 'orbit'
  const [trackingMode, setTrackingMode] = useState('follow'); // 'follow', 'fixed', 'orbit'
  const [showOrbitPath, setShowOrbitPath] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [orbitHistory, setOrbitHistory] = useState([]);

  // WebSocket hooks for real-time data
  const { issPosition, issLoading } = useISSData();
  const { isConnected, cache } = useWebSocket();

  // Get advanced ISS data from WebSocket cache
  const advancedISSData = cache.advanced_iss_data;
  const satellitePasses = cache.satellite_passes;

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 0, 15);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Create Earth
    createEarth();

    // Create ISS
    createISS();

    // Create orbit path
    createOrbitPath();

    // Create stars background
    createStars();

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      controls.update();

      // Update ISS position if data available
      updateISSPosition();

      // Update orbit tracking
      updateOrbitTracking();

      // Rotate Earth
      if (earthRef.current) {
        earthRef.current.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) {
        return;
      }

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const createEarth = () => {
    const earthGeometry = new THREE.SphereGeometry(6.371, 64, 64); // Earth radius in scale

    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/textures/earth_day.jpg');
    const earthNightTexture = textureLoader.load('/textures/earth_night.jpg');
    const earthCloudsTexture = textureLoader.load('/textures/earth_clouds.jpg');

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: earthTexture,
      bumpScale: 0.05,
      specular: new THREE.Color(0x333333),
      shininess: 10,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    earth.castShadow = true;
    sceneRef.current.add(earth);
    earthRef.current = earth;

    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(6.5, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    sceneRef.current.add(atmosphere);
  };

  const createISS = () => {
    // Create ISS model (simplified)
    const issGroup = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    issGroup.add(body);

    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(0.8, 0.02, 0.3);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });

    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.5, 0, 0);
    issGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.5, 0, 0);
    issGroup.add(rightPanel);

    // Position ISS at initial altitude (408 km average)
    issGroup.position.set(0, 0, 6.371 + 0.408);

    sceneRef.current.add(issGroup);
    issRef.current = issGroup;
  };

  const createOrbitPath = () => {
    const orbitRadius = 6.371 + 0.408; // Earth radius + ISS altitude
    const orbitGeometry = new THREE.RingGeometry(
      orbitRadius - 0.01,
      orbitRadius + 0.01,
      128
    );
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });

    const orbitPath = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitPath.rotation.x = Math.PI / 2;
    orbitPath.rotation.z = (51.6 * Math.PI) / 180; // ISS inclination

    sceneRef.current.add(orbitPath);
    orbitPathRef.current = orbitPath;
  };

  const createStars = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2000;
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    sceneRef.current.add(stars);
  };

  const updateISSPosition = () => {
    if (!issRef.current || !issPosition) {
      return;
    }

    const { latitude, longitude, altitude } = issPosition;

    // Convert lat/lon to 3D coordinates
    const phi = ((90 - latitude) * Math.PI) / 180;
    const theta = ((longitude + 180) * Math.PI) / 180;
    const radius = 6.371 + (altitude || 408) / 1000; // Convert km to scale

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    issRef.current.position.set(x, y, z);

    // Update orbit history
    setOrbitHistory(prev => {
      const newHistory = [...prev, { x, y, z, timestamp: Date.now() }];
      return newHistory.slice(-100); // Keep last 100 positions
    });

    // Update camera tracking
    if (trackingMode === 'follow' && cameraRef.current && controlsRef.current) {
      controlsRef.current.target.set(x, y, z);
    }
  };

  const updateOrbitTracking = () => {
    if (!orbitPathRef.current || !showOrbitPath) {
      return;
    }

    // Update orbit path visibility
    orbitPathRef.current.visible = showOrbitPath;

    // Create orbit trail from history
    if (orbitHistory.length > 2) {
      // Remove existing trail
      const existingTrail = sceneRef.current.getObjectByName('orbitTrail');
      if (existingTrail) {
        sceneRef.current.remove(existingTrail);
      }

      // Create new trail
      const trailGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(orbitHistory.length * 3);

      orbitHistory.forEach((point, index) => {
        positions[index * 3] = point.x;
        positions[index * 3 + 1] = point.y;
        positions[index * 3 + 2] = point.z;
      });

      trailGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      const trailMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
      });

      const trail = new THREE.Line(trailGeometry, trailMaterial);
      trail.name = 'orbitTrail';
      sceneRef.current.add(trail);
    }
  };

  const handleViewModeChange = mode => {
    setViewMode(mode);

    if (mode === 'orbit' && cameraRef.current && controlsRef.current) {
      // Set camera for orbit view
      cameraRef.current.position.set(0, 15, 0);
      controlsRef.current.target.set(0, 0, 0);
    } else if (mode === '3d' && cameraRef.current && controlsRef.current) {
      // Set camera for 3D view
      cameraRef.current.position.set(15, 10, 15);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  return (
    <div className='iss-tracking-visualization'>
      <div className='visualization-header'>
        <h2>🛰️ ISS Live Tracking</h2>
        <div className='tracking-controls'>
          <div className='view-mode-controls'>
            <button
              className={`control-btn ${viewMode === '3d' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('3d')}
            >
              3D View
            </button>
            <button
              className={`control-btn ${viewMode === 'orbit' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('orbit')}
            >
              Orbit View
            </button>
          </div>

          <div className='tracking-mode-controls'>
            <button
              className={`control-btn ${trackingMode === 'follow' ? 'active' : ''}`}
              onClick={() => setTrackingMode('follow')}
            >
              Follow ISS
            </button>
            <button
              className={`control-btn ${trackingMode === 'fixed' ? 'active' : ''}`}
              onClick={() => setTrackingMode('fixed')}
            >
              Fixed View
            </button>
          </div>

          <div className='display-controls'>
            <button
              className={`control-btn ${showOrbitPath ? 'active' : ''}`}
              onClick={() => setShowOrbitPath(!showOrbitPath)}
            >
              Orbit Path
            </button>
            <button
              className={`control-btn ${showTelemetry ? 'active' : ''}`}
              onClick={() => setShowTelemetry(!showTelemetry)}
            >
              Telemetry
            </button>
          </div>
        </div>
      </div>

      <div className='visualization-content'>
        <div className='iss-3d-view' ref={mountRef} />

        {showTelemetry && (
          <div className='iss-telemetry-panel'>
            <div className='telemetry-section'>
              <h3>Real-Time Position</h3>
              <div className='telemetry-grid'>
                <div className='telemetry-item'>
                  <span className='label'>Latitude:</span>
                  <span className='value'>
                    {issPosition?.latitude?.toFixed(6) || 'N/A'}°
                  </span>
                </div>
                <div className='telemetry-item'>
                  <span className='label'>Longitude:</span>
                  <span className='value'>
                    {issPosition?.longitude?.toFixed(6) || 'N/A'}°
                  </span>
                </div>
                <div className='telemetry-item'>
                  <span className='label'>Altitude:</span>
                  <span className='value'>
                    {issPosition?.altitude?.toFixed(2) || 'N/A'} km
                  </span>
                </div>
                <div className='telemetry-item'>
                  <span className='label'>Velocity:</span>
                  <span className='value'>
                    {issPosition?.velocity?.toFixed(2) || 'N/A'} km/h
                  </span>
                </div>
              </div>
            </div>

            {advancedISSData && (
              <div className='telemetry-section'>
                <h3>Orbital Parameters</h3>
                <div className='telemetry-grid'>
                  <div className='telemetry-item'>
                    <span className='label'>Period:</span>
                    <span className='value'>
                      {advancedISSData.orbital_parameters?.period_minutes?.toFixed(
                        1
                      ) || 'N/A'}{' '}
                      min
                    </span>
                  </div>
                  <div className='telemetry-item'>
                    <span className='label'>Inclination:</span>
                    <span className='value'>
                      {advancedISSData.orbital_parameters?.inclination_degrees?.toFixed(
                        2
                      ) || 'N/A'}
                      °
                    </span>
                  </div>
                  <div className='telemetry-item'>
                    <span className='label'>Eccentricity:</span>
                    <span className='value'>
                      {advancedISSData.orbital_parameters?.eccentricity?.toFixed(
                        4
                      ) || 'N/A'}
                    </span>
                  </div>
                  <div className='telemetry-item'>
                    <span className='label'>Mean Motion:</span>
                    <span className='value'>
                      {advancedISSData.orbital_parameters?.mean_motion?.toFixed(
                        2
                      ) || 'N/A'}{' '}
                      rev/day
                    </span>
                  </div>
                </div>
              </div>
            )}

            {satellitePasses && (
              <div className='telemetry-section'>
                <h3>Visibility</h3>
                <div className='visibility-info'>
                  <div className='visibility-item'>
                    <span className='label'>Current Visibility:</span>
                    <span
                      className={`status ${advancedISSData?.visibility?.visible ? 'visible' : 'not-visible'}`}
                    >
                      {advancedISSData?.visibility?.visible
                        ? 'Visible'
                        : 'Not Visible'}
                    </span>
                  </div>
                  {advancedISSData?.next_passes &&
                    advancedISSData.next_passes.length > 0 && (
                      <div className='next-pass'>
                        <span className='label'>Next Pass:</span>
                        <span className='value'>
                          {new Date(
                            advancedISSData.next_passes[0].rise_time
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            <div className='connection-status'>
              <div
                className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
              >
                <span className='indicator-dot' />
                {isConnected ? 'Live Data Connected' : 'Connection Lost'}
              </div>
              {issPosition && (
                <div className='last-update'>
                  Last Update:{' '}
                  {new Date(issPosition.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className='visualization-instructions'>
        <p>
          🖱️ Left click + drag to rotate • 🖱️ Right click + drag to pan • 🖱️
          Scroll to zoom
        </p>
        <p>
          🛰️ Real-time ISS position updates every 30 seconds via WebSocket
          connection
        </p>
      </div>
    </div>
  );
};

export default ISSTrackingVisualization;
