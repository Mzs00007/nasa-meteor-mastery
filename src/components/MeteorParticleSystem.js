import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const MeteorParticleSystem = ({ className = '' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    // Setup Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Camera position
    camera.position.z = 5;

    // Create meteor particles
    const particles = [];
    const particleCount = 50;
    const particleSpeed = 0.1;
    const particleSize = 0.02;

    // Particle geometry and material
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random starting position (spread across screen)
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;

      // Random colors (orange, red, white for meteor trail)
      const color =
        Math.random() > 0.7
          ? [1.0, 0.3, 0.1] // Orange-red
          : Math.random() > 0.5
            ? [1.0, 0.6, 0.2] // Orange
            : [1.0, 0.8, 0.4]; // Yellow-orange

      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      // Random sizes
      sizes[i] = particleSize * (0.5 + Math.random() * 1.5);

      // Store particle data
      particles.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          -Math.random() * 0.2 - 0.05, // Downward motion
          (Math.random() - 0.5) * 0.1
        ),
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        trailLength: 5 + Math.random() * 10,
        trailOpacity: 0.8 + Math.random() * 0.2,
      });
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: particleSize,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Add some stars in background
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(200 * 3);
    const starSizes = new Float32Array(200);

    for (let i = 0; i < 200; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 100;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 100;
      starPositions[i3 + 2] = (Math.random() - 0.5) * 100 - 20;
      starSizes[i] = Math.random() * 0.01 + 0.005;
    }

    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.01,
      sizeAttenuation: true,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Animation
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Update particles
      const positions = particleGeometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const particle = particles[i];

        // Update position
        positions[i3] += particle.velocity.x * delta * 60;
        positions[i3 + 1] += particle.velocity.y * delta * 60;
        positions[i3 + 2] += particle.velocity.z * delta * 60;

        // Reset particles that go off screen
        if (
          positions[i3 + 1] < -10 ||
          Math.abs(positions[i3]) > 15 ||
          Math.abs(positions[i3 + 2]) > 15
        ) {
          positions[i3] = (Math.random() - 0.5) * 20;
          positions[i3 + 1] = 10 + Math.random() * 5;
          positions[i3 + 2] = (Math.random() - 0.5) * 10;

          // Randomize velocity for new particle
          particle.velocity.set(
            (Math.random() - 0.5) * 0.1,
            -Math.random() * 0.2 - 0.05,
            (Math.random() - 0.5) * 0.1
          );
        }

        // Add some wobble for realistic meteor motion
        positions[i3] += Math.sin(elapsed * 2 + i) * 0.01;
        positions[i3 + 2] += Math.cos(elapsed * 1.5 + i) * 0.01;
      }

      particleGeometry.attributes.position.needsUpdate = true;

      // Rotate stars slowly
      stars.rotation.x += 0.0001;
      stars.rotation.y += 0.0002;

      // Render
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      window.removeEventListener('resize', handleResize);

      // Dispose of Three.js resources
      particleGeometry.dispose();
      particleMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`meteor-canvas ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export default MeteorParticleSystem;
