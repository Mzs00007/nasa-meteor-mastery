import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const EnhancedMeteorBackground = ({
  meteorCount = 50,
  starCount = 1000,
  intensity = 1.0,
  className = '',
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const meteorsRef = useRef([]);
  const starsRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Create starfield
    const createStarfield = () => {
      const starGeometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      const starColors = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);

      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;

        // Random positions in a large sphere
        starPositions[i3] = (Math.random() - 0.5) * 2000;
        starPositions[i3 + 1] = (Math.random() - 0.5) * 2000;
        starPositions[i3 + 2] = (Math.random() - 0.5) * 2000;

        // Star colors (white to blue-white)
        const color = new THREE.Color();
        color.setHSL(
          0.6 + Math.random() * 0.1,
          0.2 + Math.random() * 0.3,
          0.8 + Math.random() * 0.2
        );
        starColors[i3] = color.r;
        starColors[i3 + 1] = color.g;
        starColors[i3 + 2] = color.b;

        // Random star sizes
        starSizes[i] = Math.random() * 2 + 0.5;
      }

      starGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(starPositions, 3)
      );
      starGeometry.setAttribute(
        'starColor',
        new THREE.BufferAttribute(starColors, 3)
      );
      starGeometry.setAttribute(
        'size',
        new THREE.BufferAttribute(starSizes, 1)
      );

      const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 starColor;
          varying vec3 vColor;
          uniform float time;
          
          void main() {
            vColor = starColor;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            // Add subtle twinkling
            float twinkle = sin(time * 2.0 + position.x * 0.01) * 0.3 + 0.7;
            gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            float distance = length(gl_PointCoord - vec2(0.5));
            if (distance > 0.5) discard;
            
            float alpha = 1.0 - distance * 2.0;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
      });

      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      starsRef.current = stars;
    };

    // Create meteor system
    const createMeteorSystem = () => {
      const meteors = [];

      for (let i = 0; i < meteorCount; i++) {
        // Meteor geometry (elongated for trail effect)
        const meteorGeometry = new THREE.CylinderGeometry(0.1, 0.5, 8, 8);

        // Meteor material with glow effect
        const meteorMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            intensity: { value: intensity },
            color: { value: new THREE.Color(0xff4422) },
          },
          vertexShader: `
            varying vec3 vPosition;
            varying vec3 vNormal;
            uniform float time;
            
            void main() {
              vPosition = position;
              vNormal = normal;
              
              vec3 pos = position;
              // Add slight wobble for realism
              pos.x += sin(time * 2.0 + position.y * 0.1) * 0.1;
              
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vPosition;
            varying vec3 vNormal;
            uniform float time;
            uniform float intensity;
            uniform vec3 color;
            
            void main() {
              float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              float glow = fresnel * intensity;
              
              // Core and glow
              vec3 finalColor = color * (1.0 + glow * 2.0);
              float alpha = 0.8 + glow * 0.2;
              
              gl_FragColor = vec4(finalColor, alpha);
            }
          `,
          transparent: true,
          side: THREE.DoubleSide,
        });

        const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);

        // Random initial position
        meteor.position.set(
          (Math.random() - 0.5) * 200,
          Math.random() * 100 + 50,
          (Math.random() - 0.5) * 200
        );

        // Random velocity
        meteor.userData = {
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -Math.random() * 3 - 1,
            (Math.random() - 0.5) * 2
          ),
          life: Math.random() * 100,
          maxLife: 100 + Math.random() * 50,
          trail: [],
        };

        // Orient meteor in direction of movement
        meteor.lookAt(
          meteor.position.x + meteor.userData.velocity.x,
          meteor.position.y + meteor.userData.velocity.y,
          meteor.position.z + meteor.userData.velocity.z
        );

        scene.add(meteor);
        meteors.push(meteor);

        // Create trail effect
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(20 * 3); // 20 trail points
        const trailOpacities = new Float32Array(20);

        for (let j = 0; j < 20; j++) {
          trailOpacities[j] = (20 - j) / 20;
        }

        trailGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(trailPositions, 3)
        );
        trailGeometry.setAttribute(
          'opacity',
          new THREE.BufferAttribute(trailOpacities, 1)
        );

        const trailMaterial = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(0xff6633) },
          },
          vertexShader: `
            attribute float opacity;
            varying float vOpacity;
            
            void main() {
              vOpacity = opacity;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = 3.0;
            }
          `,
          fragmentShader: `
            varying float vOpacity;
            uniform vec3 color;
            
            void main() {
              float distance = length(gl_PointCoord - vec2(0.5));
              if (distance > 0.5) discard;
              
              gl_FragColor = vec4(color, vOpacity * (1.0 - distance * 2.0));
            }
          `,
          transparent: true,
        });

        const trail = new THREE.Points(trailGeometry, trailMaterial);
        scene.add(trail);
        meteor.userData.trailMesh = trail;
      }

      meteorsRef.current = meteors;
    };

    // Create nebula background
    const createNebula = () => {
      const nebulaGeometry = new THREE.PlaneGeometry(500, 500);
      const nebulaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          resolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight),
          },
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float time;
          uniform vec2 resolution;
          
          // Noise function
          float noise(vec2 p) {
            return sin(p.x * 10.0) * sin(p.y * 10.0) * 0.5 + 0.5;
          }
          
          void main() {
            vec2 uv = vUv;
            
            // Create flowing nebula effect
            float n1 = noise(uv * 2.0 + time * 0.1);
            float n2 = noise(uv * 4.0 - time * 0.05);
            float n3 = noise(uv * 8.0 + time * 0.02);
            
            float nebula = (n1 + n2 * 0.5 + n3 * 0.25) / 1.75;
            
            // Color gradient
            vec3 color1 = vec3(0.1, 0.2, 0.6); // Deep blue
            vec3 color2 = vec3(0.6, 0.1, 0.3); // Purple-red
            vec3 color3 = vec3(0.0, 0.0, 0.1); // Very dark blue
            
            vec3 finalColor = mix(color3, mix(color1, color2, nebula), nebula * 0.3);
            
            gl_FragColor = vec4(finalColor, 0.4);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      nebula.position.z = -100;
      scene.add(nebula);
    };

    // Initialize all elements
    createStarfield();
    createMeteorSystem();
    createNebula();

    // Camera position
    camera.position.z = 50;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Update stars
      if (starsRef.current) {
        starsRef.current.material.uniforms.time.value = time;
        starsRef.current.rotation.y += 0.0002;
      }

      // Update meteors
      meteorsRef.current.forEach(meteor => {
        const userData = meteor.userData;

        // Update position
        meteor.position.add(userData.velocity);

        // Update trail
        userData.trail.unshift(meteor.position.clone());
        if (userData.trail.length > 20) {
          userData.trail.pop();
        }

        // Update trail mesh
        if (userData.trailMesh && userData.trail.length > 1) {
          const positions =
            userData.trailMesh.geometry.attributes.position.array;
          for (let i = 0; i < Math.min(userData.trail.length, 20); i++) {
            const pos = userData.trail[i];
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
          }
          userData.trailMesh.geometry.attributes.position.needsUpdate = true;
        }

        // Update material
        meteor.material.uniforms.time.value = time;

        // Update life
        userData.life += 1;

        // Reset meteor if it's too far or lived too long
        if (
          meteor.position.y < -100 ||
          userData.life > userData.maxLife ||
          Math.abs(meteor.position.x) > 200 ||
          Math.abs(meteor.position.z) > 200
        ) {
          meteor.position.set(
            (Math.random() - 0.5) * 200,
            Math.random() * 50 + 100,
            (Math.random() - 0.5) * 200
          );

          userData.velocity.set(
            (Math.random() - 0.5) * 2,
            -Math.random() * 3 - 1,
            (Math.random() - 0.5) * 2
          );

          userData.life = 0;
          userData.trail = [];

          meteor.lookAt(
            meteor.position.x + userData.velocity.x,
            meteor.position.y + userData.velocity.y,
            meteor.position.z + userData.velocity.z
          );
        }
      });

      renderer.render(scene, camera);
    };

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();
    setIsLoaded(true);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose of Three.js objects
      scene.traverse(object => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, [meteorCount, starCount, intensity]);

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ zIndex: -10 }}
    />
  );
};

export default EnhancedMeteorBackground;
