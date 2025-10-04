import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { SimulationContext } from '../../context/SimulationContext';
import './UniverseVisualization.css';

const UniverseVisualization = () => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('solarSystem');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const { simulationData } = React.useContext(SimulationContext);

  // Celestial body data (scaled for visualization)
  const celestialBodies = [
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

  useEffect(() => {
    if (!canvasRef.current) {
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

    // Create coordinate grid
    const createGrid = () => {
      const gridHelper = new THREE.GridHelper(1000, 100, 0x444444, 0x222222);
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);
      return gridHelper;
    };

    // Create celestial bodies
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
      if (bodyData.distance > 0) {
        const orbitGeometry = new THREE.RingGeometry(
          bodyData.distance - 0.1,
          bodyData.distance + 0.1,
          128
        );
        const orbitMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3,
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
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

    // Initialize scene
    const stars = createStarfield();
    const grid = createGrid();
    grid.visible = showGrid;
    stars.visible = showStars;

    const bodies = celestialBodies.map(createCelestialBody);

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

      // Update bodies
      bodies.forEach(body => {
        if (body.userData.distance > 0) {
          // Orbital motion
          body.userData.orbitAngle =
            (body.userData.orbitAngle || 0) + body.userData.orbitSpeed * delta;
          body.position.x =
            Math.cos(body.userData.orbitAngle) * body.userData.distance;
          body.position.z =
            Math.sin(body.userData.orbitAngle) * body.userData.distance;

          // Rotation
          body.rotation.y += body.userData.rotationSpeed * delta;
        }
      });

      controls.update();
      composer.render();
    };

    animate();
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [animationSpeed, showGrid, showOrbits, showStars, viewMode]);

  return (
    <div className='universe-visualization'>
      {isLoading && (
        <div className='loading-overlay'>
          <div className='loading-spinner' />
          <p>Loading Universe Visualization...</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className='universe-canvas'
        style={{ opacity: isLoading ? 0 : 1 }}
      />

      <div className='controls-panel'>
        <h3>Universe Controls</h3>

        <div className='control-group'>
          <label>View Mode:</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <option value='solarSystem'>Solar System</option>
            <option value='galaxy'>Galaxy View</option>
            <option value='universe'>Universe Scale</option>
          </select>
        </div>

        <div className='control-group'>
          <label>Animation Speed:</label>
          <input
            type='range'
            min='0'
            max='5'
            step='0.1'
            value={animationSpeed}
            onChange={e => setAnimationSpeed(parseFloat(e.target.value))}
          />
          <span>{animationSpeed.toFixed(1)}x</span>
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
              checked={showStars}
              onChange={e => setShowStars(e.target.checked)}
            />
            Show Stars
          </label>
        </div>

        <div className='control-group'>
          <label>
            <input
              type='checkbox'
              checked={showGrid}
              onChange={e => setShowGrid(e.target.checked)}
            />
            Show Grid
          </label>
        </div>

        <div className='info-panel'>
          <h4>Celestial Bodies</h4>
          <div className='body-list'>
            {celestialBodies.map(body => (
              <div key={body.name} className='body-info'>
                <span className='body-name'>{body.name}</span>
                <span className='body-distance'>
                  {body.distance > 0 ? `${body.distance} AU` : 'Center'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniverseVisualization;
