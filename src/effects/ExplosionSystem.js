import * as THREE from 'three';

export class ExplosionSystem {
  constructor(scene) {
    this.scene = scene;
    this.explosions = [];
    this.particleSystems = [];
    this.shockwaves = [];
    this.fireballs = [];
    
    // Initialize particle textures
    this.initializeTextures();
  }

  initializeTextures() {
    // Create particle textures
    this.smokeTexture = this.createSmokeTexture();
    this.fireTexture = this.createFireTexture();
    this.sparkTexture = this.createSparkTexture();
    this.shockwaveTexture = this.createShockwaveTexture();
  }

  createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create radial gradient for smoke
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(128, 128, 128, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }

  createFireTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create radial gradient for fire
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.8)');
    gradient.addColorStop(0.8, 'rgba(255, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }

  createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // Create bright spark
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 0, 1)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
  }

  createShockwaveTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    // Create ring texture for shockwave
    context.strokeStyle = 'rgba(255, 255, 255, 1)';
    context.lineWidth = 4;
    context.beginPath();
    context.arc(64, 64, 60, 0, Math.PI * 2);
    context.stroke();
    
    // Add inner glow
    const gradient = context.createRadialGradient(64, 64, 55, 64, 64, 65);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  createExplosion(position, energy) {
    const explosion = {
      position: position.clone(),
      energy,
      startTime: Date.now(),
      duration: this.calculateExplosionDuration(energy),
      maxRadius: this.calculateExplosionRadius(energy),
      active: true
    };

    this.explosions.push(explosion);

    // Create multiple particle systems for the explosion
    this.createFireball(explosion);
    this.createSmokeCloud(explosion);
    this.createDebrisParticles(explosion);
    this.createShockwave(explosion);
    this.createSparks(explosion);

    return explosion;
  }

  calculateExplosionDuration(energy) {
    // Duration based on energy (seconds)
    return Math.min(30, Math.max(5, Math.log10(energy / 1e15) * 3));
  }

  calculateExplosionRadius(energy) {
    // Radius based on energy (scaled for visualization)
    return Math.min(50, Math.max(2, Math.pow(energy / 1e15, 0.3) * 5));
  }

  createFireball(explosion) {
    const particleCount = Math.min(5000, Math.max(500, explosion.energy / 1e12));
    const geometry = new THREE.BufferGeometry();
    
    // Particle positions
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Initial position (sphere distribution)
      const radius = Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = explosion.position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = explosion.position.y + radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = explosion.position.z + radius * Math.cos(phi);
      
      // Initial velocity (expanding outward)
      const speed = (Math.random() * 0.5 + 0.5) * explosion.maxRadius / explosion.duration;
      velocities[i3] = (positions[i3] - explosion.position.x) * speed;
      velocities[i3 + 1] = (positions[i3 + 1] - explosion.position.y) * speed;
      velocities[i3 + 2] = (positions[i3 + 2] - explosion.position.z) * speed;
      
      // Particle properties
      lifetimes[i] = Math.random() * explosion.duration * 0.3; // Fireball is short-lived
      sizes[i] = Math.random() * 2 + 0.5;
      
      // Fire colors (white to yellow to red)
      const colorPhase = Math.random();
      if (colorPhase < 0.3) {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1; // White
      } else if (colorPhase < 0.6) {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 0; // Yellow
      } else {
        colors[i3] = 1; colors[i3 + 1] = 0.5; colors[i3 + 2] = 0; // Orange
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      map: this.fireTexture,
      size: 2,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });
    
    const fireball = new THREE.Points(geometry, material);
    fireball.userData = {
      type: 'fireball',
      explosion,
      startTime: Date.now(),
      particleCount
    };
    
    this.scene.add(fireball);
    this.fireballs.push(fireball);
  }

  createSmokeCloud(explosion) {
    const particleCount = Math.min(3000, Math.max(300, explosion.energy / 1e13));
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    const rotations = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Initial position
      const radius = Math.random() * 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = explosion.position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = explosion.position.y + radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = explosion.position.z + radius * Math.cos(phi);
      
      // Velocity (upward and outward)
      const speed = Math.random() * 0.2 + 0.1;
      velocities[i3] = (Math.random() - 0.5) * speed;
      velocities[i3 + 1] = Math.random() * speed + 0.1; // Upward bias
      velocities[i3 + 2] = (Math.random() - 0.5) * speed;
      
      lifetimes[i] = Math.random() * explosion.duration + explosion.duration * 0.5;
      sizes[i] = Math.random() * 3 + 1;
      rotations[i] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
    
    const material = new THREE.PointsMaterial({
      map: this.smokeTexture,
      size: 3,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      color: 0x444444
    });
    
    const smoke = new THREE.Points(geometry, material);
    smoke.userData = {
      type: 'smoke',
      explosion,
      startTime: Date.now(),
      particleCount
    };
    
    this.scene.add(smoke);
    this.particleSystems.push(smoke);
  }

  createDebrisParticles(explosion) {
    const particleCount = Math.min(2000, Math.max(200, explosion.energy / 1e14));
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Start near explosion center
      positions[i3] = explosion.position.x + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = explosion.position.y + (Math.random() - 0.5) * 0.5;
      positions[i3 + 2] = explosion.position.z + (Math.random() - 0.5) * 0.5;
      
      // High-speed ejection
      const speed = Math.random() * explosion.maxRadius / explosion.duration * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      velocities[i3 + 2] = speed * Math.cos(phi);
      
      lifetimes[i] = Math.random() * explosion.duration * 2;
      sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.3,
      transparent: true,
      color: 0x8B4513, // Brown debris color
      depthWrite: false
    });
    
    const debris = new THREE.Points(geometry, material);
    debris.userData = {
      type: 'debris',
      explosion,
      startTime: Date.now(),
      particleCount
    };
    
    this.scene.add(debris);
    this.particleSystems.push(debris);
  }

  createShockwave(explosion) {
    const geometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const material = new THREE.MeshBasicMaterial({
      map: this.shockwaveTexture,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const shockwave = new THREE.Mesh(geometry, material);
    shockwave.position.copy(explosion.position);
    shockwave.userData = {
      type: 'shockwave',
      explosion,
      startTime: Date.now(),
      maxRadius: explosion.maxRadius * 3
    };
    
    this.scene.add(shockwave);
    this.shockwaves.push(shockwave);
  }

  createSparks(explosion) {
    const particleCount = Math.min(1000, Math.max(100, explosion.energy / 1e15));
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      positions[i3] = explosion.position.x;
      positions[i3 + 1] = explosion.position.y;
      positions[i3 + 2] = explosion.position.z;
      
      // Fast, random directions
      const speed = Math.random() * explosion.maxRadius / explosion.duration * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      velocities[i3 + 2] = speed * Math.cos(phi);
      
      lifetimes[i] = Math.random() * explosion.duration * 0.2; // Short-lived
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    
    const material = new THREE.PointsMaterial({
      map: this.sparkTexture,
      size: 0.5,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const sparks = new THREE.Points(geometry, material);
    sparks.userData = {
      type: 'sparks',
      explosion,
      startTime: Date.now(),
      particleCount
    };
    
    this.scene.add(sparks);
    this.particleSystems.push(sparks);
  }

  update() {
    const currentTime = Date.now();
    
    // Update explosions
    this.explosions = this.explosions.filter(explosion => {
      const elapsed = (currentTime - explosion.startTime) / 1000;
      explosion.active = elapsed < explosion.duration;
      return explosion.active;
    });

    // Update particle systems
    this.updateParticleSystems(currentTime);
    this.updateShockwaves(currentTime);
    this.updateFireballs(currentTime);

    // Clean up finished systems
    this.cleanupFinishedSystems();
  }

  updateParticleSystems(currentTime) {
    this.particleSystems.forEach(system => {
      const elapsed = (currentTime - system.userData.startTime) / 1000;
      const positions = system.geometry.attributes.position.array;
      const velocities = system.geometry.attributes.velocity.array;
      const lifetimes = system.geometry.attributes.lifetime.array;
      
      for (let i = 0; i < system.userData.particleCount; i++) {
        const i3 = i * 3;
        
        if (elapsed < lifetimes[i]) {
          // Update position
          positions[i3] += velocities[i3] * 0.016; // 60fps
          positions[i3 + 1] += velocities[i3 + 1] * 0.016;
          positions[i3 + 2] += velocities[i3 + 2] * 0.016;
          
          // Apply gravity to debris and smoke
          if (system.userData.type === 'debris' || system.userData.type === 'smoke') {
            velocities[i3 + 1] -= 9.81 * 0.016 * 0.1; // Scaled gravity
          }
          
          // Apply air resistance
          velocities[i3] *= 0.999;
          velocities[i3 + 1] *= 0.999;
          velocities[i3 + 2] *= 0.999;
        } else {
          // Hide expired particles
          positions[i3] = -10000;
          positions[i3 + 1] = -10000;
          positions[i3 + 2] = -10000;
        }
      }
      
      system.geometry.attributes.position.needsUpdate = true;
      
      // Fade out over time
      const fadeProgress = elapsed / system.userData.explosion.duration;
      if (system.material.opacity !== undefined) {
        system.material.opacity = Math.max(0, 1 - fadeProgress);
      }
    });
  }

  updateShockwaves(currentTime) {
    this.shockwaves.forEach(shockwave => {
      const elapsed = (currentTime - shockwave.userData.startTime) / 1000;
      const progress = elapsed / shockwave.userData.explosion.duration;
      
      if (progress < 1) {
        // Expand shockwave
        const currentRadius = progress * shockwave.userData.maxRadius;
        shockwave.scale.setScalar(currentRadius);
        
        // Fade out
        shockwave.material.opacity = Math.max(0, 1 - progress);
      }
    });
  }

  updateFireballs(currentTime) {
    this.fireballs.forEach(fireball => {
      const elapsed = (currentTime - fireball.userData.startTime) / 1000;
      const positions = fireball.geometry.attributes.position.array;
      const velocities = fireball.geometry.attributes.velocity.array;
      const lifetimes = fireball.geometry.attributes.lifetime.array;
      const colors = fireball.geometry.attributes.color.array;
      
      for (let i = 0; i < fireball.userData.particleCount; i++) {
        const i3 = i * 3;
        
        if (elapsed < lifetimes[i]) {
          // Update position
          positions[i3] += velocities[i3] * 0.016;
          positions[i3 + 1] += velocities[i3 + 1] * 0.016;
          positions[i3 + 2] += velocities[i3 + 2] * 0.016;
          
          // Color transition (white -> yellow -> red -> black)
          const lifeProgress = elapsed / lifetimes[i];
          if (lifeProgress < 0.3) {
            // White to yellow
            const factor = lifeProgress / 0.3;
            colors[i3] = 1;
            colors[i3 + 1] = 1;
            colors[i3 + 2] = 1 - factor;
          } else if (lifeProgress < 0.7) {
            // Yellow to red
            const factor = (lifeProgress - 0.3) / 0.4;
            colors[i3] = 1;
            colors[i3 + 1] = 1 - factor * 0.5;
            colors[i3 + 2] = 0;
          } else {
            // Red to black
            const factor = (lifeProgress - 0.7) / 0.3;
            colors[i3] = 1 - factor;
            colors[i3 + 1] = 0.5 * (1 - factor);
            colors[i3 + 2] = 0;
          }
        } else {
          // Hide expired particles
          positions[i3] = -10000;
          positions[i3 + 1] = -10000;
          positions[i3 + 2] = -10000;
        }
      }
      
      fireball.geometry.attributes.position.needsUpdate = true;
      fireball.geometry.attributes.color.needsUpdate = true;
    });
  }

  cleanupFinishedSystems() {
    const currentTime = Date.now();
    
    // Clean up particle systems
    this.particleSystems = this.particleSystems.filter(system => {
      const elapsed = (currentTime - system.userData.startTime) / 1000;
      if (elapsed > system.userData.explosion.duration * 2) {
        this.scene.remove(system);
        system.geometry.dispose();
        system.material.dispose();
        return false;
      }
      return true;
    });
    
    // Clean up shockwaves
    this.shockwaves = this.shockwaves.filter(shockwave => {
      const elapsed = (currentTime - shockwave.userData.startTime) / 1000;
      if (elapsed > shockwave.userData.explosion.duration) {
        this.scene.remove(shockwave);
        shockwave.geometry.dispose();
        shockwave.material.dispose();
        return false;
      }
      return true;
    });
    
    // Clean up fireballs
    this.fireballs = this.fireballs.filter(fireball => {
      const elapsed = (currentTime - fireball.userData.startTime) / 1000;
      if (elapsed > fireball.userData.explosion.duration * 0.5) {
        this.scene.remove(fireball);
        fireball.geometry.dispose();
        fireball.material.dispose();
        return false;
      }
      return true;
    });
  }

  clear() {
    // Remove all active effects
    [...this.particleSystems, ...this.shockwaves, ...this.fireballs].forEach(system => {
      this.scene.remove(system);
      system.geometry.dispose();
      system.material.dispose();
    });
    
    this.explosions = [];
    this.particleSystems = [];
    this.shockwaves = [];
    this.fireballs = [];
  }
}