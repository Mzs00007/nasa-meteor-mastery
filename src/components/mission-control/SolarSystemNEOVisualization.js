import React, { useState, useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { SimulationContext } from '../../context/SimulationContext';
import { getNEODetails, getNEOFeed } from '../../services/nasaService';
import './SolarSystemNEOVisualization.css';

const SolarSystemNEOVisualization = () => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [neoData, setNeoData] = useState([]);
  const [filterHazardous, setFilterHazardous] = useState(false);
  const [minSize, setMinSize] = useState(10); // meters
  const [maxDistance, setMaxDistance] = useState(0.5); // AU
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const { simulationData } = React.useContext(SimulationContext);

  // Solar system bodies data (scaled for visualization)
  const solarSystemBodies = [
    {
      name: 'Sun',
      radius: 20,
      distance: 0,
      color: 0xffd700,
      emissive: 0xffd700,
      rotationSpeed: 0.004,
      orbitSpeed: 0,
      texture: null,
    },
    {
      name: 'Mercury',
      radius: 0.4,
      distance: 28,
      color: 0x8c8c8c,
      emissive: 0x000000,
      rotationSpeed: 0.004,
      orbitSpeed: 0.04,
      texture: null,
    },
    {
      name: 'Venus',
      radius: 0.9,
      distance: 44,
      color: 0xe6e6e6,
      emissive: 0x000000,
      rotationSpeed: 0.002,
      orbitSpeed: 0.015,
      texture: null,
    },
    {
      name: 'Earth',
      radius: 1,
      distance: 62,
      color: 0x2233ff,
      emissive: 0x000000,
      rotationSpeed: 0.01,
      orbitSpeed: 0.01,
      texture: null,
    },
    {
      name: 'Mars',
      radius: 0.5,
      distance: 78,
      color: 0xff5733,
      emissive: 0x000000,
      rotationSpeed: 0.009,
      orbitSpeed: 0.008,
      texture: null,
    },
    {
      name: 'Jupiter',
      radius: 11,
      distance: 260,
      color: 0xd8ca9d,
      emissive: 0x000000,
      rotationSpeed: 0.025,
      orbitSpeed: 0.004,
      texture: null,
    },
    {
      name: 'Saturn',
      radius: 9,
      distance: 480,
      color: 0xfad5a5,
      emissive: 0x000000,
      rotationSpeed: 0.023,
      orbitSpeed: 0.003,
      texture: null,
      hasRings: true,
    },
    {
      name: 'Uranus',
      radius: 4,
      distance: 960,
      color: 0x4fd0e7,
      emissive: 0x000000,
      rotationSpeed: 0.012,
      orbitSpeed: 0.002,
      texture: null,
    },
    {
      name: 'Neptune',
      radius: 3.9,
      distance: 1500,
      color: 0x3457d5,
      emissive: 0x000000,
      rotationSpeed: 0.011,
      orbitSpeed: 0.001,
      texture: null,
    },
  ];

  // Fetch NEO data from NASA API
  useEffect(() => {
    const fetchNEOData = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const feedData = await nasaService.getNeoFeed(today, today);

        if (feedData && feedData.near_earth_objects) {
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

          setNeoData(processedNEOs);
        }
      } catch (error) {
        console.error('Failed to fetch NEO data:', error);
        // Fallback to sample data
        setNeoData(generateSampleNEOData());
      } finally {
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

    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Create starfield
    const createStarfield = () => {
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        sizeAttenuation: true,
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
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      return stars;
    };

    // Create orbit paths
    const createOrbitPath = (distance, color = 0xffffff) => {
      const orbitGeometry = new THREE.RingGeometry(
        distance - 0.1,
        distance + 0.1,
        128
      );
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      return orbit;
    };

    // Create celestial body
    const createCelestialBody = bodyData => {
      const geometry = new THREE.SphereGeometry(bodyData.radius, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        color: bodyData.color,
        emissive: bodyData.emissive,
        emissiveIntensity: bodyData.name === 'Sun' ? 1 : 0,
        roughness: 0.8,
        metalness: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = bodyData.name !== 'Sun';
      mesh.receiveShadow = bodyData.name !== 'Sun';
      mesh.userData = { ...bodyData };

      // Create orbit path
      if (bodyData.distance > 0 && showOrbits) {
        const orbit = createOrbitPath(bodyData.distance);
        scene.add(orbit);
        mesh.userData.orbit = orbit;
      }

      // Create rings for Saturn
      if (bodyData.hasRings) {
        const ringGeometry = new THREE.RingGeometry(
          bodyData.radius * 1.2,
          bodyData.radius * 2.5,
          64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xfad5a5,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        mesh.add(rings);
      }

      scene.add(mesh);
      return mesh;
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

      // Position NEO along its orbit (simplified)
      const orbitDistance = 62 + neoData.missDistance * 100; // Scale miss distance
      const angle = Math.random() * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * orbitDistance,
        0,
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

    // Create text label
    const createLabel = (text, position, color) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;

      context.fillStyle = '#ffffff';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(text, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
      });

      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.position.y += 5;
      sprite.scale.set(20, 5, 1);

      return sprite;
    };

    // Initialize scene
    const stars = createStarfield();
    const bodies = solarSystemBodies.map(createCelestialBody);
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

      // Animate solar system bodies
      bodies.forEach(body => {
        if (body.userData.orbitSpeed > 0) {
          body.rotation.y += body.userData.rotationSpeed * delta;

          // Orbital motion
          const time = Date.now() * 0.001 * body.userData.orbitSpeed * delta;
          body.position.x = Math.cos(time) * body.userData.distance;
          body.position.z = Math.sin(time) * body.userData.distance;
        }
      });

      // Animate NEOs
      neos.forEach(neo => {
        neo.rotation.y += 0.01 * delta;

        // Orbital motion around Earth
        const orbitSpeed = 0.02 * (1 + neo.userData.velocity / 50);
        const time = Date.now() * 0.001 * orbitSpeed * delta;
        const orbitDistance = 62 + neo.userData.missDistance * 100;

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
        <h2>Solar System NEO Visualization</h2>
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
          <span>Total NEOs: {neoData.length}</span>
          <span>Filtered: {filteredNEOs.length}</span>
          <span>
            Hazardous: {neoData.filter(neo => neo.isHazardous).length}
          </span>
        </div>
      </div>

      <div className='neo-visualization-canvas'>
        {isLoading && (
          <div className='loading-overlay'>
            <div className='loading-spinner' />
            <p>Loading NASA NEO data...</p>
          </div>
        )}
        <canvas ref={canvasRef} />
      </div>

      <div className='neo-info-panel'>
        <h3>Near Earth Objects ({filteredNEOs.length})</h3>
        <div className='neo-list'>
          {filteredNEOs.slice(0, 10).map(neo => (
            <div key={neo.id} className='neo-item'>
              <div
                className='neo-color-indicator'
                style={{
                  backgroundColor: neo.isHazardous ? '#ff3333' : '#33ff33',
                }}
              />
              <div className='neo-details'>
                <strong>{neo.name}</strong>
                <span>Size: {neo.diameter}m</span>
                <span>Velocity: {neo.velocity} km/s</span>
                <span>Distance: {neo.missDistance} AU</span>
                <span>Class: {neo.orbitClass}</span>
                <span>Approach: {neo.closeApproachDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SolarSystemNEOVisualization;
