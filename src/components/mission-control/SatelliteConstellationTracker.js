import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { useWebSocket, useISSData } from '../../hooks/useWebSocket';
import './SatelliteConstellationTracker.css';

const SatelliteConstellationTracker = () => {
  // Scene and rendering refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const earthRef = useRef(null);
  const satellitesRef = useRef(new Map());
  const orbitLinesRef = useRef(new Map());

  // State management
  const [selectedConstellation, setSelectedConstellation] = useState('all');
  const [viewMode, setViewMode] = useState('3d');
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [timeAcceleration, setTimeAcceleration] = useState(1);
  const [filterByType, setFilterByType] = useState('all');
  const [selectedSatellite, setSelectedSatellite] = useState(null);

  // Data state
  const [constellationData, setConstellationData] = useState({});
  const [starlinkData, setStarlinkData] = useState(null);
  const [spaceDebris, setSpaceDebris] = useState(null);
  const [satellitePasses, setSatellitePasses] = useState(null);
  const [statistics, setStatistics] = useState({
    totalSatellites: 0,
    activeSatellites: 0,
    debrisObjects: 0,
    visiblePasses: 0,
  });

  // WebSocket connection
  const { isConnected } = useWebSocket();
  const { starlinkData: starlinkDataHook, spaceDebris: spaceDebrisHook, satellitePasses: satellitePassesHook } = useISSData();

  // Constellation types and colors
  const constellationTypes = {
    starlink: { color: 0x00ff88, name: 'Starlink', icon: '🛰️' },
    gps: { color: 0x0088ff, name: 'GPS', icon: '🗺️' },
    weather: { color: 0xff8800, name: 'Weather', icon: '🌤️' },
    debris: { color: 0xff4444, name: 'Debris', icon: '💥' },
    iss: { color: 0xffff00, name: 'ISS', icon: '🏠' },
    all: { color: 0xffffff, name: 'All Satellites', icon: '🌌' },
  };

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
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
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Create Earth
    createEarth();

    // Create stars background
    createStars();

    // Start animation loop
    animate();
  }, []);

  // Create Earth
  const createEarth = () => {
    const earthGeometry = new THREE.SphereGeometry(6.371, 64, 64);

    // Earth texture (using a simple blue-green gradient)
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    sceneRef.current.add(earth);
    earthRef.current = earth;

    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(6.5, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    sceneRef.current.add(atmosphere);
  };

  // Create stars background
  const createStars = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    sceneRef.current.add(stars);
  };

  // Update constellation data
  const updateConstellationData = (type, data) => {
    setConstellationData(prev => ({
      ...prev,
      [type]: data,
    }));

    // Update statistics
    updateStatistics();
  };

  // Update statistics
  const updateStatistics = () => {
    let totalSats = 0;
    let activeSats = 0;
    let debrisCount = 0;

    Object.values(constellationData).forEach(constellation => {
      if (constellation.satellites) {
        totalSats += constellation.satellites.length;
        activeSats += constellation.satellites.filter(
          sat => sat.operational_status === 'operational'
        ).length;
      }
    });

    if (spaceDebris && spaceDebris.objects) {
      debrisCount = spaceDebris.objects.length;
    }

    setStatistics({
      totalSatellites: totalSats,
      activeSatellites: activeSats,
      debrisObjects: debrisCount,
      visiblePasses: satellitePasses ? satellitePasses.length : 0,
    });
  };

  // Create or update satellite visualization
  const updateSatelliteVisualization = useCallback(() => {
    if (!sceneRef.current) {
      return;
    }

    // Clear existing satellites
    satellitesRef.current.forEach((satellite, id) => {
      sceneRef.current.remove(satellite);
    });
    satellitesRef.current.clear();

    // Clear existing orbit lines
    orbitLinesRef.current.forEach((orbitLine, id) => {
      sceneRef.current.remove(orbitLine);
    });
    orbitLinesRef.current.clear();

    // Add satellites from constellation data
    Object.entries(constellationData).forEach(([type, data]) => {
      if (!data.satellites) {
        return;
      }

      const typeConfig = constellationTypes[type] || constellationTypes.all;

      data.satellites.forEach((satellite, index) => {
        if (filterByType !== 'all' && filterByType !== type) {
          return;
        }
        if (selectedConstellation !== 'all' && selectedConstellation !== type) {
          return;
        }

        // Convert lat/lon/alt to 3D position
        const position = latLonAltToVector3(
          satellite.position.latitude,
          satellite.position.longitude,
          satellite.position.altitude_km
        );

        // Create satellite mesh
        const satelliteGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const satelliteMaterial = new THREE.MeshBasicMaterial({
          color: typeConfig.color,
          transparent: true,
          opacity: satellite.operational_status === 'operational' ? 1.0 : 0.5,
        });

        const satelliteMesh = new THREE.Mesh(
          satelliteGeometry,
          satelliteMaterial
        );
        satelliteMesh.position.copy(position);
        satelliteMesh.userData = { satellite, type };

        sceneRef.current.add(satelliteMesh);
        satellitesRef.current.set(`${type}_${satellite.id}`, satelliteMesh);

        // Create orbit line if enabled
        if (showOrbits) {
          const orbitLine = createOrbitLine(satellite, typeConfig.color);
          if (orbitLine) {
            sceneRef.current.add(orbitLine);
            orbitLinesRef.current.set(
              `${type}_${satellite.id}_orbit`,
              orbitLine
            );
          }
        }
      });
    });
  }, [constellationData, selectedConstellation, filterByType, showOrbits]);

  // Convert lat/lon/alt to 3D vector
  const latLonAltToVector3 = (lat, lon, alt) => {
    const earthRadius = 6.371; // Earth radius in Three.js units
    const radius = earthRadius + alt / 1000; // Convert km to Three.js units

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  };

  // Create orbit line for satellite
  const createOrbitLine = (satellite, color) => {
    try {
      const points = [];
      const earthRadius = 6.371;
      const altitude = satellite.position.altitude_km / 1000;
      const radius = earthRadius + altitude;

      // Create a simple circular orbit (simplified)
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const y = 0; // Simplified to equatorial orbit
        points.push(new THREE.Vector3(x, y, z));
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
      });

      return new THREE.Line(orbitGeometry, orbitMaterial);
    } catch (error) {
      console.warn('Error creating orbit line:', error);
      return null;
    }
  };

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      return;
    }

    requestAnimationFrame(animate);

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Rotate Earth
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001 * timeAcceleration;
    }

    // Update satellite positions (simplified animation)
    satellitesRef.current.forEach((satellite, id) => {
      if (satellite.userData.satellite) {
        // Simple orbital animation
        const time = Date.now() * 0.0001 * timeAcceleration;
        const originalPosition = satellite.position.clone();
        satellite.position.x =
          originalPosition.x * Math.cos(time) -
          originalPosition.z * Math.sin(time);
        satellite.position.z =
          originalPosition.x * Math.sin(time) +
          originalPosition.z * Math.cos(time);
      }
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [timeAcceleration]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) {
      return;
    }

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Effects
  useEffect(() => {
    initializeScene();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [initializeScene, handleResize]);

  useEffect(() => {
    updateSatelliteVisualization();
  }, [updateSatelliteVisualization]);

  // Sync incoming WebSocket data from hooks to local component state
  useEffect(() => {
    if (starlinkDataHook) {
      setStarlinkData(starlinkDataHook);
      updateConstellationData('starlink', starlinkDataHook);
    }
  }, [starlinkDataHook]);

  useEffect(() => {
    if (spaceDebrisHook) {
      setSpaceDebris(spaceDebrisHook);
    }
  }, [spaceDebrisHook]);

  useEffect(() => {
    if (satellitePassesHook) {
      setSatellitePasses(satellitePassesHook);
    }
  }, [satellitePassesHook]);

  useEffect(() => {
    updateStatistics();
  }, [constellationData, spaceDebris, satellitePasses]);

  return (
    <div className='satellite-constellation-tracker'>
      <div className='tracker-header'>
        <h2>🛰️ Live Satellite Constellation Tracking</h2>
        <div className='tracker-controls'>
          <div className='constellation-selector'>
            <label>Constellation:</label>
            <select
              value={selectedConstellation}
              onChange={e => setSelectedConstellation(e.target.value)}
            >
              {Object.entries(constellationTypes).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
          </div>

          <div className='filter-controls'>
            <label>Filter:</label>
            <select
              value={filterByType}
              onChange={e => setFilterByType(e.target.value)}
            >
              <option value='all'>All Types</option>
              <option value='starlink'>Communication</option>
              <option value='gps'>Navigation</option>
              <option value='weather'>Weather</option>
              <option value='debris'>Debris</option>
            </select>
          </div>

          <div className='view-controls'>
            <button
              className={`control-btn ${showOrbits ? 'active' : ''}`}
              onClick={() => setShowOrbits(!showOrbits)}
            >
              Orbits
            </button>
            <button
              className={`control-btn ${showLabels ? 'active' : ''}`}
              onClick={() => setShowLabels(!showLabels)}
            >
              Labels
            </button>
          </div>

          <div className='time-control'>
            <label>Speed: {timeAcceleration}x</label>
            <input
              type='range'
              min='0.1'
              max='10'
              step='0.1'
              value={timeAcceleration}
              onChange={e => setTimeAcceleration(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className='tracker-content'>
        <div className='visualization-container'>
          <div ref={mountRef} className='threejs-container' />

          <div className='statistics-overlay'>
            <div className='stat-item'>
              <span className='stat-label'>Total Satellites:</span>
              <span className='stat-value'>{statistics.totalSatellites}</span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>Active:</span>
              <span className='stat-value active'>
                {statistics.activeSatellites}
              </span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>Debris:</span>
              <span className='stat-value debris'>
                {statistics.debrisObjects}
              </span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>Visible Passes:</span>
              <span className='stat-value'>{statistics.visiblePasses}</span>
            </div>
          </div>

          <div className='connection-status'>
            <div
              className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
            >
              <span className='indicator-dot' />
              <span className='status-text'>
                {isConnected ? 'Live Data' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className='data-panels'>
          {starlinkData && (
            <div className='data-panel starlink-panel'>
              <h3>🛰️ Starlink Constellation</h3>
              <div className='panel-content'>
                <div className='data-row'>
                  <span>Total Satellites:</span>
                  <span>{starlinkData.total_satellites}</span>
                </div>
                <div className='data-row'>
                  <span>Tracked:</span>
                  <span>{starlinkData.satellites?.length || 0}</span>
                </div>
                <div className='data-row'>
                  <span>Last Update:</span>
                  <span>
                    {new Date(starlinkData.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {spaceDebris && (
            <div className='data-panel debris-panel'>
              <h3>💥 Space Debris</h3>
              <div className='panel-content'>
                <div className='data-row'>
                  <span>Tracked Objects:</span>
                  <span>{spaceDebris.total_objects}</span>
                </div>
                <div className='data-row'>
                  <span>High Risk:</span>
                  <span className='risk-high'>
                    {spaceDebris.high_risk_count || 0}
                  </span>
                </div>
                <div className='data-row'>
                  <span>Collision Alerts:</span>
                  <span className='alert'>
                    {spaceDebris.collision_alerts || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {satellitePasses && (
            <div className='data-panel passes-panel'>
              <h3>👁️ Visible Passes</h3>
              <div className='panel-content'>
                {satellitePasses.slice(0, 3).map((pass, index) => (
                  <div key={index} className='pass-item'>
                    <div className='pass-satellite'>{pass.satellite_name}</div>
                    <div className='pass-time'>
                      {new Date(pass.start_time).toLocaleTimeString()}
                    </div>
                    <div className='pass-elevation'>
                      Max: {pass.max_elevation}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='legend'>
        <h4>Legend</h4>
        <div className='legend-items'>
          {Object.entries(constellationTypes)
            .filter(([key]) => key !== 'all')
            .map(([key, config]) => (
              <div key={key} className='legend-item'>
                <div
                  className='legend-color'
                  style={{
                    backgroundColor: `#${config.color.toString(16).padStart(6, '0')}`,
                  }}
                />
                <span>
                  {config.icon} {config.name}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SatelliteConstellationTracker;
