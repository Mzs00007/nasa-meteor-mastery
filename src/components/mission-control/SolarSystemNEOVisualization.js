import React, { useState, useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { SimulationContext } from '../../context/SimulationContext';
import { nasaService } from '../../services/nasaService';
import { ModernSpinner, SkeletonText, SkeletonCard, LoadingOverlay, ProgressBar } from '../ui/ModernLoadingComponents';
import './SolarSystemNEOVisualization.css';

const SolarSystemNEOVisualization = () => {
  const canvasRef = useRef(null);
  const [neoData, setNeoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');
  const [filterHazardous, setFilterHazardous] = useState(false);
  const [minSize, setMinSize] = useState(1);
  const [maxDistance, setMaxDistance] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const { simulationData } = React.useContext(SimulationContext);

  // Fetch NEO data from NASA API
  useEffect(() => {
    const fetchNEOData = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress(0);
        setLoadingStage('Connecting to NASA API...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoadingProgress(20);
        
        const today = new Date().toISOString().split('T')[0];
        setLoadingStage('Fetching NEO data...');
        const feedData = await nasaService.getNeoFeed(today, today);
        setLoadingProgress(50);

        if (feedData && feedData.near_earth_objects) {
          setLoadingStage('Processing asteroid data...');
          await new Promise(resolve => setTimeout(resolve, 300));
          setLoadingProgress(70);
          
          // Process NEO data for visualization
          const processedNEOs = Object.values(feedData.near_earth_objects)
            .flat()
            .filter(neo => neo.estimated_diameter && neo.close_approach_data)
            .map(neo => ({
              id: neo.id,
              name: neo.name,
              diameter: neo.estimated_diameter.meters.estimated_diameter_max,
              velocity: parseFloat(
                neo.close_approach_data[0]?.relative_velocity
                  ?.kilometers_per_second || '20'
              ),
              missDistance: parseFloat(
                neo.close_approach_data[0]?.miss_distance?.astronomical || '0.1'
              ),
              isHazardous: neo.is_potentially_hazardous_asteroid,
              orbitClass:
                neo.orbital_data?.orbit_class?.orbit_class_type || 'Unknown',
              closeApproachDate:
                neo.close_approach_data[0]?.close_approach_date,
            }));

          setLoadingProgress(90);
          setLoadingStage('Preparing visualization...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setNeoData(processedNEOs);
          setLoadingProgress(100);
          setLoadingStage('Complete!');
        }
      } catch (error) {
        console.error('Failed to fetch NEO data:', error);
        setLoadingStage('Using sample data...');
        setLoadingProgress(80);
        // Fallback to sample data
        setNeoData(generateSampleNEOData());
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoadingProgress(100);
        setLoadingStage('Complete!');
      } finally {
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
      }
    };

    fetchNEOData();
  }, []);

  // Generate sample NEO data for fallback
  const generateSampleNEOData = () => {
    return [
      {
        id: 'sample-1',
        name: '2023 XY',
        diameter: 120,
        velocity: 17.5,
        missDistance: 0.03,
        isHazardous: true,
        orbitClass: 'Apollo',
        closeApproachDate: '2023-12-15',
      },
      {
        id: 'sample-2',
        name: '2023 AB',
        diameter: 45,
        velocity: 12.3,
        missDistance: 0.15,
        isHazardous: false,
        orbitClass: 'Amor',
        closeApproachDate: '2023-12-16',
      },
      {
        id: 'sample-3',
        name: '2023 CD',
        diameter: 280,
        velocity: 22.1,
        missDistance: 0.08,
        isHazardous: true,
        orbitClass: 'Aten',
        closeApproachDate: '2023-12-17',
      },
    ];
  };

  // Filter NEOs based on user settings
  const filteredNEOs = neoData.filter(neo => {
    if (filterHazardous && !neo.isHazardous) {
      return false;
    }
    if (neo.diameter < minSize) {
      return false;
    }
    if (neo.missDistance > maxDistance) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!canvasRef.current || isLoading) {
      return;
    }

    // Setup Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Camera position
    camera.position.set(0, 200, 400);
    camera.lookAt(0, 0, 0);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 5000;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Create starfield
    const createStarfield = () => {
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        sizeAttenuation: false,
      });

      const starVertices = [];
      for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
      }

      starGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starVertices, 3)
      );
      return new THREE.Points(starGeometry, starMaterial);
    };

    // Create orbit path
    const createOrbitPath = (radius, color) => {
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push(
          new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
        );
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: color,
        opacity: 0.3,
        transparent: true,
      });

      return new THREE.Line(geometry, material);
    };

    // Create text label
    const createLabel = (text, position, color) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;

      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = '20px Arial';
      context.textAlign = 'center';
      context.fillText(text, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);

      sprite.position.copy(position);
      sprite.position.y += 5;
      sprite.scale.set(20, 5, 1);

      return sprite;
    };

    // Create NEO (Near Earth Object)
    const createNEO = neoData => {
      // Scale size for visualization (min size 0.1, max size 2)
      const size = Math.max(Math.min(neoData.diameter / 100, 2), 0.1);
      const geometry = new THREE.SphereGeometry(size, 16, 16);

      // Color based on hazard status
      const color = neoData.isHazardous ? 0xff3333 : 0x33ff33;
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: neoData.isHazardous ? 0xff0000 : 0x00ff00,
        emissiveIntensity: 0.3,
        shininess: 30,
        specular: 0x555555,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { ...neoData, type: 'neo' };

      // Position NEO in space (simplified orbital positioning)
      const orbitDistance = 100 + neoData.missDistance * 200; // Scale miss distance
      const angle = Math.random() * Math.PI * 2;
      const inclination = (Math.random() - 0.5) * 0.5; // Add some vertical variation
      mesh.position.set(
        Math.cos(angle) * orbitDistance,
        Math.sin(inclination) * 50,
        Math.sin(angle) * orbitDistance
      );

      // Create orbit path for NEO
      if (showOrbits) {
        const orbit = createOrbitPath(orbitDistance, color);
        scene.add(orbit);
        mesh.userData.orbit = orbit;
      }

      // Create label
      if (showLabels) {
        const label = createLabel(neoData.name, mesh.position, color);
        scene.add(label);
        mesh.userData.label = label;
      }

      scene.add(mesh);
      return mesh;
    };

    // Initialize scene
    const stars = createStarfield();
    scene.add(stars);
    const neos = filteredNEOs.map(createNEO);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    // Animation
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta() * animationSpeed;

      // Animate NEOs
      neos.forEach(neo => {
        neo.rotation.y += 0.01 * delta;

        // Orbital motion in space
        const orbitSpeed = 0.02 * (1 + neo.userData.velocity / 50);
        const time = Date.now() * 0.001 * orbitSpeed * delta;
        const orbitDistance = 100 + neo.userData.missDistance * 200;

        neo.position.x = Math.cos(time) * orbitDistance;
        neo.position.z = Math.sin(time) * orbitDistance;

        // Update label position if it exists
        if (neo.userData.label) {
          neo.userData.label.position.copy(neo.position);
          neo.userData.label.position.y += 5;
        }
      });

      controls.update();

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      if (composer) {
        composer.dispose();
      }
    };
  }, [isLoading, filteredNEOs, showOrbits, showLabels, animationSpeed]);

  return (
    <div className='neo-visualization-container'>
      <div className='neo-visualization-header'>
        <h2>NEO Tracking Visualization</h2>
        <div className='neo-controls-panel'>
          <div className='control-group'>
            <label>
              <input
                type='checkbox'
                checked={filterHazardous}
                onChange={e => setFilterHazardous(e.target.checked)}
              />
              Show Only Hazardous Asteroids
            </label>
          </div>

          <div className='control-group'>
            <label>Min Size: {minSize}m</label>
            <input
              type='range'
              min='1'
              max='1000'
              value={minSize}
              onChange={e => setMinSize(parseInt(e.target.value))}
            />
          </div>

          <div className='control-group'>
            <label>Max Distance: {maxDistance} AU</label>
            <input
              type='range'
              min='0.01'
              max='1'
              step='0.01'
              value={maxDistance}
              onChange={e => setMaxDistance(parseFloat(e.target.value))}
            />
          </div>

          <div className='control-group'>
            <label>
              <input
                type='checkbox'
                checked={showOrbits}
                onChange={e => setShowOrbits(e.target.checked)}
              />
              Show Orbits
            </label>
          </div>

          <div className='control-group'>
            <label>
              <input
                type='checkbox'
                checked={showLabels}
                onChange={e => setShowLabels(e.target.checked)}
              />
              Show Labels
            </label>
          </div>

          <div className='control-group'>
            <label>Animation Speed: {animationSpeed}x</label>
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

        <div className='neo-stats'>
          {isLoading ? (
            <>
              <span><SkeletonText width="80px" height="14px" /></span>
              <span><SkeletonText width="70px" height="14px" /></span>
              <span><SkeletonText width="90px" height="14px" /></span>
            </>
          ) : (
            <>
              <span>Total NEOs: {neoData.length}</span>
              <span>Filtered: {filteredNEOs.length}</span>
              <span>
                Hazardous: {neoData.filter(neo => neo.isHazardous).length}
              </span>
            </>
          )}
        </div>
      </div>

      <div className='neo-visualization-canvas'>
        {isLoading && (
          <LoadingOverlay>
            <ModernSpinner variant="orbit" size="large" />
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1.2rem' }}>
                {loadingStage}
              </h3>
              <ProgressBar 
                progress={loadingProgress} 
                variant="gradient"
                style={{ width: '300px', margin: '0 auto' }}
              />
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: '1rem', fontSize: '0.9rem' }}>
                Fetching real-time asteroid data from NASA
              </p>
            </div>
          </LoadingOverlay>
        )}
        <canvas ref={canvasRef} />
      </div>

      <div className='neo-info-panel'>
        <h3>Near Earth Objects ({isLoading ? '...' : filteredNEOs.length})</h3>
        <div className='neo-list'>
          {isLoading ? (
            // Skeleton loading for NEO items
            Array.from({ length: 5 }).map((_, index) => (
              <div key={`skeleton-${index}`} className='neo-item'>
                <div 
                  className='neo-color-indicator'
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                />
                <div className='neo-details'>
                  <SkeletonText width="80%" height="16px" style={{ marginBottom: '0.5rem' }} />
                  <SkeletonText width="60%" height="12px" style={{ marginBottom: '0.3rem' }} />
                  <SkeletonText width="70%" height="12px" style={{ marginBottom: '0.3rem' }} />
                  <SkeletonText width="65%" height="12px" style={{ marginBottom: '0.3rem' }} />
                  <SkeletonText width="55%" height="12px" style={{ marginBottom: '0.3rem' }} />
                  <SkeletonText width="75%" height="12px" />
                </div>
              </div>
            ))
          ) : (
            filteredNEOs.slice(0, 10).map(neo => (
              <div key={neo.id} className={`neo-item ${neo.isHazardous ? 'hazardous' : ''}`}>
                <div
                  className='neo-color-indicator'
                  style={{
                    backgroundColor: neo.isHazardous ? '#ff3333' : '#33ff33',
                  }}
                />
                <div className='neo-details'>
                  <strong>{neo.name}</strong>
                  <span>Size: {Math.round(neo.diameter)}m</span>
                  <span>Velocity: {neo.velocity.toFixed(1)} km/s</span>
                  <span>Distance: {neo.missDistance.toFixed(3)} AU</span>
                  <span>Class: {neo.orbitClass}</span>
                  <span>Approach: {neo.closeApproachDate}</span>
                  {neo.isHazardous && (
                    <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                      ⚠️ Potentially Hazardous
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SolarSystemNEOVisualization;
