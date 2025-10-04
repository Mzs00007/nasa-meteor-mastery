import * as THREE from 'three';

/**
 * Advanced Particle System for Asteroid Simulation
 * Handles various particle effects including trails, atmospheric entry, and explosions
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particleSystems = new Map();
    this.clock = new THREE.Clock();
  }

  /**
   * Create asteroid trail particles
   */
  createAsteroidTrail(position, velocity, options = {}) {
    const {
      particleCount = 1000,
      trailLength = 50,
      color = 0xff6600,
      size = 0.1,
      opacity = 0.8,
      lifetime = 2.0,
    } = options;

    // Create geometry for particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    // Initialize particles along the trail
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;

      // Position particles behind the asteroid
      positions[i * 3] = position.x - velocity.x * t * trailLength;
      positions[i * 3 + 1] = position.y - velocity.y * t * trailLength;
      positions[i * 3 + 2] = position.z - velocity.z * t * trailLength;

      // Add some randomness to particle positions
      positions[i * 3] += (Math.random() - 0.5) * size * 2;
      positions[i * 3 + 1] += (Math.random() - 0.5) * size * 2;
      positions[i * 3 + 2] += (Math.random() - 0.5) * size * 2;

      // Set particle velocities
      velocities[i * 3] = velocity.x * (0.8 + Math.random() * 0.4);
      velocities[i * 3 + 1] = velocity.y * (0.8 + Math.random() * 0.4);
      velocities[i * 3 + 2] = velocity.z * (0.8 + Math.random() * 0.4);

      // Set particle properties
      lifetimes[i] = lifetime * (0.5 + Math.random() * 0.5);
      sizes[i] = size * (0.5 + Math.random() * 1.5);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create material with custom shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(color) },
        opacity: { value: opacity },
      },
      vertexShader: `
        attribute float lifetime;
        attribute float size;
        attribute vec3 velocity;
        uniform float time;
        varying float vLifetime;
        varying float vAge;

        void main() {
          vLifetime = lifetime;
          vAge = time;
          
          vec3 pos = position + velocity * time;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying float vLifetime;
        varying float vAge;

        void main() {
          float alpha = 1.0 - (vAge / vLifetime);
          alpha = max(0.0, alpha);
          
          // Create circular particles
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Fade from center
          float fade = 1.0 - (dist * 2.0);
          alpha *= fade * opacity;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    const systemId = `trail_${Date.now()}`;
    this.particleSystems.set(systemId, {
      mesh: particles,
      material: material,
      startTime: this.clock.getElapsedTime(),
      lifetime: lifetime,
      type: 'trail',
    });

    return systemId;
  }

  /**
   * Create atmospheric entry heating effect
   */
  createAtmosphericEntry(position, velocity, options = {}) {
    const {
      particleCount = 2000,
      color = 0xff3300,
      intensity = 1.0,
      size = 0.2,
    } = options;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const temperatures = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Create particles around the asteroid
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.5 + Math.random() * 2.0;

      positions[i * 3] = position.x + Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = position.y + Math.cos(phi) * radius;
      positions[i * 3 + 2] =
        position.z + Math.sin(phi) * Math.sin(theta) * radius;

      // Particles move away from asteroid with some randomness
      const speed = 5.0 + Math.random() * 10.0;
      velocities[i * 3] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;

      temperatures[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute(
      'temperature',
      new THREE.BufferAttribute(temperatures, 1)
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        baseColor: { value: new THREE.Color(color) },
        intensity: { value: intensity },
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float temperature;
        uniform float time;
        varying float vTemperature;

        void main() {
          vTemperature = temperature;
          
          vec3 pos = position + velocity * time;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          gl_PointSize = ${size} * (1.0 + temperature * 2.0) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform float intensity;
        uniform float time;
        varying float vTemperature;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Temperature-based color
          vec3 hotColor = vec3(1.0, 0.8, 0.2);
          vec3 coolColor = vec3(1.0, 0.2, 0.0);
          vec3 color = mix(coolColor, hotColor, vTemperature);
          
          float alpha = (1.0 - dist * 2.0) * intensity;
          alpha *= (1.0 - time * 0.5); // Fade over time
          
          gl_FragColor = vec4(color * baseColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    const systemId = `atmospheric_${Date.now()}`;
    this.particleSystems.set(systemId, {
      mesh: particles,
      material: material,
      startTime: this.clock.getElapsedTime(),
      lifetime: 3.0,
      type: 'atmospheric',
    });

    return systemId;
  }

  /**
   * Create impact explosion effect
   */
  createImpactExplosion(position, options = {}) {
    const {
      particleCount = 5000,
      explosionRadius = 10.0,
      duration = 5.0,
      colors = [0xff4400, 0xff8800, 0xffaa00, 0x888888],
    } = options;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const colorIndices = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Start all particles at impact position
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Random explosion direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 5.0 + Math.random() * 20.0;

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

      lifetimes[i] = duration * (0.5 + Math.random() * 0.5);
      colorIndices[i] = Math.floor(Math.random() * colors.length);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute(
      'colorIndex',
      new THREE.BufferAttribute(colorIndices, 1)
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        colors: { value: colors.map(c => new THREE.Color(c)) },
        gravity: { value: new THREE.Vector3(0, -9.8, 0) },
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float lifetime;
        attribute float colorIndex;
        uniform float time;
        uniform vec3 gravity;
        varying float vLifetime;
        varying float vAge;
        varying float vColorIndex;

        void main() {
          vLifetime = lifetime;
          vAge = time;
          vColorIndex = colorIndex;
          
          vec3 pos = position + velocity * time + 0.5 * gravity * time * time;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          float size = 2.0 * (1.0 - time / lifetime);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 colors[4];
        varying float vLifetime;
        varying float vAge;
        varying float vColorIndex;

        void main() {
          int index = int(vColorIndex);
          vec3 color = colors[index];
          
          float alpha = 1.0 - (vAge / vLifetime);
          alpha = max(0.0, alpha);
          
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float fade = 1.0 - (dist * 2.0);
          alpha *= fade;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    const systemId = `explosion_${Date.now()}`;
    this.particleSystems.set(systemId, {
      mesh: particles,
      material: material,
      startTime: this.clock.getElapsedTime(),
      lifetime: duration,
      type: 'explosion',
    });

    return systemId;
  }

  /**
   * Update all particle systems
   */
  update() {
    const currentTime = this.clock.getElapsedTime();
    const systemsToRemove = [];

    this.particleSystems.forEach((system, id) => {
      const age = currentTime - system.startTime;

      if (age > system.lifetime) {
        // Remove expired systems
        this.scene.remove(system.mesh);
        system.mesh.geometry.dispose();
        system.material.dispose();
        systemsToRemove.push(id);
      } else {
        // Update system uniforms
        if (system.material.uniforms.time) {
          system.material.uniforms.time.value = age;
        }
      }
    });

    // Clean up expired systems
    systemsToRemove.forEach(id => {
      this.particleSystems.delete(id);
    });
  }

  /**
   * Remove a specific particle system
   */
  removeSystem(systemId) {
    const system = this.particleSystems.get(systemId);
    if (system) {
      this.scene.remove(system.mesh);
      system.mesh.geometry.dispose();
      system.material.dispose();
      this.particleSystems.delete(systemId);
    }
  }

  /**
   * Clean up all particle systems
   */
  dispose() {
    this.particleSystems.forEach((system, id) => {
      this.scene.remove(system.mesh);
      system.mesh.geometry.dispose();
      system.material.dispose();
    });
    this.particleSystems.clear();
  }
}

export default ParticleSystem;
