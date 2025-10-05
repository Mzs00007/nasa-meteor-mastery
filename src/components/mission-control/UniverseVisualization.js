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
  const [viewMode, setViewMode] = useState('galaxy'); // Solar System view temporarily disabled
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const { simulationData } = React.useContext(SimulationContext);

  // Universe-scale objects (galaxies, nebulae, star clusters)
  const universeObjects = [
    {
      name: 'Milky Way Galaxy',
      type: 'galaxy',
      radius: 50,
      distance: 0,
      color: 0xffffff,
      emissive: 0x4444ff,
      rotationSpeed: 0.001,
      particleCount: 10000,
    },
    {
      name: 'Andromeda Galaxy',
      type: 'galaxy',
      radius: 60,
      distance: 800,
      color: 0xffdddd,
      emissive: 0xff4444,
      rotationSpeed: 0.0008,
      particleCount: 12000,
    },
    {
      name: 'Orion Nebula',
      type: 'nebula',
      radius: 25,
      distance: 200,
      color: 0xff6644,
      emissive: 0xff3322,
      rotationSpeed: 0.002,
      particleCount: 5000,
    },
    {
      name: 'Eagle Nebula',
      type: 'nebula',
      radius: 30,
      distance: 350,
      color: 0x44ff66,
      emissive: 0x22ff44,
      rotationSpeed: 0.0015,
      particleCount: 6000,
    },
    {
      name: 'Crab Nebula',
      type: 'nebula',
      radius: 20,
      distance: 450,
      color: 0x6644ff,
      emissive: 0x4422ff,
      rotationSpeed: 0.003,
      particleCount: 4000,
    },
    {
      name: 'Pleiades Cluster',
      type: 'star_cluster',
      radius: 15,
      distance: 150,
      color: 0x44ddff,
      emissive: 0x2299ff,
      rotationSpeed: 0.004,
      particleCount: 3000,
    },
    {
      name: 'Globular Cluster M13',
      type: 'star_cluster',
      radius: 18,
      distance: 600,
      color: 0xffdd44,
      emissive: 0xff9922,
      rotationSpeed: 0.0025,
      particleCount: 8000,
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

    // Create universe objects (galaxies, nebulae, star clusters)
    const createUniverseObject = objectData => {
      const group = new THREE.Group();
      group.userData = { ...objectData };

      if (objectData.type === 'galaxy') {
        // Create galaxy with particle system
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = objectData.particleCount;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const radius = Math.random() * objectData.radius;
          const angle = Math.random() * Math.PI * 2;
          const height = (Math.random() - 0.5) * objectData.radius * 0.1;

          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = height;
          positions[i * 3 + 2] = Math.sin(angle) * radius;

          const color = new THREE.Color(objectData.color);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
          size: 0.5,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);

      } else if (objectData.type === 'nebula') {
        // Create nebula with glowing sphere and particles
        const nebulaGeometry = new THREE.SphereGeometry(objectData.radius, 32, 32);
        const nebulaMaterial = new THREE.MeshBasicMaterial({
          color: objectData.color,
          transparent: true,
          opacity: 0.3,
        });
        const nebulaSphere = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        group.add(nebulaSphere);

        // Add particle effects
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = objectData.particleCount;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const radius = Math.random() * objectData.radius;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;

          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = radius * Math.cos(phi);
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
          color: objectData.emissive,
          size: 0.3,
          transparent: true,
          opacity: 0.6,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);

      } else if (objectData.type === 'star_cluster') {
        // Create star cluster with bright points
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = objectData.particleCount;
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
          const radius = Math.random() * objectData.radius;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;

          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = radius * Math.cos(phi);

          sizes[i] = Math.random() * 2 + 0.5;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const particleMaterial = new THREE.PointsMaterial({
          color: objectData.color,
          size: 1,
          transparent: true,
          opacity: 0.9,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
      }

      // Position the object
      if (objectData.distance > 0) {
        group.position.x = objectData.distance;
      }

      scene.add(group);
      return group;
    };

    // Initialize scene
    const stars = createStarfield();
    const grid = createGrid();
    grid.visible = showGrid;
    stars.visible = showStars;

    const objects = universeObjects.map(createUniverseObject);

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

      // Update universe objects
      objects.forEach(object => {
        // Rotation animation for all objects
        object.rotation.y += object.userData.rotationSpeed * delta;
        
        // Gentle floating motion for distant objects
        if (object.userData.distance > 0) {
          object.position.y = Math.sin(Date.now() * 0.0001 + object.userData.distance * 0.01) * 5;
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
            {/* <option value='solarSystem'>Solar System</option> Temporarily disabled */}
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
          <h4>Universe Objects</h4>
          <div className='object-list'>
            {universeObjects.map(object => (
              <div key={object.name} className='object-info'>
                <span className='object-name'>{object.name}</span>
                <span className='object-type'>{object.type.replace('_', ' ')}</span>
                <span className='object-distance'>
                  {object.distance > 0 ? `${object.distance} ly` : 'Local Group'}
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
