import * as THREE from 'three';

export class AsteroidSystem {
  constructor(scene) {
    this.scene = scene;
    this.asteroids = [];
    this.asteroidTypes = {
      ROCKY: 'rocky',
      METALLIC: 'metallic',
      ICY: 'icy',
      CARBONACEOUS: 'carbonaceous'
    };
    
    // Initialize textures and materials
    this.initializeMaterials();
  }

  initializeMaterials() {
    this.materials = {};
    
    // Rocky asteroid material
    this.materials[this.asteroidTypes.ROCKY] = new THREE.MeshPhongMaterial({
      color: 0x8B7355,
      roughness: 0.9,
      metalness: 0.1,
      map: this.createRockyTexture(),
      normalMap: this.createNormalTexture(),
      bumpMap: this.createBumpTexture(),
      bumpScale: 0.3
    });
    
    // Metallic asteroid material
    this.materials[this.asteroidTypes.METALLIC] = new THREE.MeshPhongMaterial({
      color: 0x666666,
      roughness: 0.3,
      metalness: 0.8,
      map: this.createMetallicTexture(),
      normalMap: this.createNormalTexture(),
      bumpMap: this.createBumpTexture(),
      bumpScale: 0.2
    });
    
    // Icy asteroid material
    this.materials[this.asteroidTypes.ICY] = new THREE.MeshPhongMaterial({
      color: 0xE6F3FF,
      roughness: 0.1,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
      map: this.createIcyTexture(),
      normalMap: this.createNormalTexture(),
      bumpMap: this.createBumpTexture(),
      bumpScale: 0.1
    });
    
    // Carbonaceous asteroid material
    this.materials[this.asteroidTypes.CARBONACEOUS] = new THREE.MeshPhongMaterial({
      color: 0x2F2F2F,
      roughness: 0.95,
      metalness: 0.05,
      map: this.createCarbonaceousTexture(),
      normalMap: this.createNormalTexture(),
      bumpMap: this.createBumpTexture(),
      bumpScale: 0.4
    });
  }

  createRockyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Base color
    context.fillStyle = '#8B7355';
    context.fillRect(0, 0, 512, 512);
    
    // Add noise and variations
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 20 + 5;
      const brightness = Math.random() * 0.4 + 0.3;
      
      context.fillStyle = `rgba(${139 * brightness}, ${115 * brightness}, ${85 * brightness}, 0.5)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  createMetallicTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Base metallic color
    context.fillStyle = '#666666';
    context.fillRect(0, 0, 512, 512);
    
    // Add metallic streaks
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const width = Math.random() * 100 + 20;
      const height = Math.random() * 10 + 2;
      const brightness = Math.random() * 0.5 + 0.5;
      
      context.fillStyle = `rgba(${255 * brightness}, ${255 * brightness}, ${255 * brightness}, 0.3)`;
      context.fillRect(x, y, width, height);
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  createIcyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Base icy color
    context.fillStyle = '#E6F3FF';
    context.fillRect(0, 0, 512, 512);
    
    // Add ice crystals
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 15 + 3;
      const brightness = Math.random() * 0.3 + 0.7;
      
      context.fillStyle = `rgba(${255 * brightness}, ${255 * brightness}, 255, 0.6)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  createCarbonaceousTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Base dark color
    context.fillStyle = '#2F2F2F';
    context.fillRect(0, 0, 512, 512);
    
    // Add carbon variations
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 8 + 2;
      const darkness = Math.random() * 0.3;
      
      context.fillStyle = `rgba(${47 * (1 - darkness)}, ${47 * (1 - darkness)}, ${47 * (1 - darkness)}, 0.7)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  createNormalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create normal map for surface details
    const imageData = context.createImageData(256, 256);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % 256;
      const y = Math.floor((i / 4) / 256);
      
      // Generate normal vectors
      const nx = (Math.random() - 0.5) * 0.5 + 0.5;
      const ny = (Math.random() - 0.5) * 0.5 + 0.5;
      const nz = 0.8; // Mostly pointing outward
      
      data[i] = nx * 255;     // R = X
      data[i + 1] = ny * 255; // G = Y
      data[i + 2] = nz * 255; // B = Z
      data[i + 3] = 255;      // A
    }
    
    context.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  createBumpTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create height map for bumps
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 20 + 5;
      const intensity = Math.random() * 255;
      
      const gradient = context.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(${intensity}, ${intensity}, ${intensity}, 1)`);
      gradient.addColorStop(1, `rgba(${intensity}, ${intensity}, ${intensity}, 0)`);
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  createAsteroid(params = {}) {
    const {
      type = this.asteroidTypes.ROCKY,
      diameter = 1, // km
      position = new THREE.Vector3(0, 0, 0),
      velocity = new THREE.Vector3(0, 0, 0),
      rotation = new THREE.Vector3(0, 0, 0),
      angularVelocity = new THREE.Vector3(0, 0, 0)
    } = params;

    // Create irregular asteroid geometry
    const geometry = this.createIrregularGeometry(diameter);
    const material = this.materials[type].clone();
    
    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.copy(position);
    asteroid.rotation.set(rotation.x, rotation.y, rotation.z);
    
    // Add asteroid properties
    asteroid.userData = {
      type,
      diameter,
      mass: this.calculateMass(diameter, type),
      density: this.getDensity(type),
      velocity: velocity.clone(),
      angularVelocity: angularVelocity.clone(),
      composition: this.getComposition(type),
      created: Date.now(),
      trail: [],
      maxTrailLength: 100
    };

    // Add atmospheric entry effects if needed
    this.addAtmosphericEffects(asteroid);
    
    this.asteroids.push(asteroid);
    this.scene.add(asteroid);
    
    return asteroid;
  }

  createIrregularGeometry(diameter) {
    // Start with a sphere and deform it
    const geometry = new THREE.SphereGeometry(diameter / 2, 32, 16);
    const positions = geometry.attributes.position.array;
    
    // Deform vertices to create irregular shape
    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const distance = vertex.length();
      
      // Add noise to create irregular surface
      const noise1 = this.noise3D(vertex.x * 2, vertex.y * 2, vertex.z * 2) * 0.3;
      const noise2 = this.noise3D(vertex.x * 5, vertex.y * 5, vertex.z * 5) * 0.1;
      const noise3 = this.noise3D(vertex.x * 10, vertex.y * 10, vertex.z * 10) * 0.05;
      
      const deformation = 1 + noise1 + noise2 + noise3;
      vertex.multiplyScalar(deformation);
      
      positions[i] = vertex.x;
      positions[i + 1] = vertex.y;
      positions[i + 2] = vertex.z;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }

  noise3D(x, y, z) {
    // Simple 3D noise function
    return (Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
  }

  calculateMass(diameter, type) {
    const volume = (4/3) * Math.PI * Math.pow(diameter / 2, 3); // km³
    const density = this.getDensity(type); // kg/m³
    return volume * 1e9 * density; // Convert km³ to m³ and multiply by density
  }

  getDensity(type) {
    // Densities in kg/m³
    const densities = {
      [this.asteroidTypes.ROCKY]: 2700,
      [this.asteroidTypes.METALLIC]: 7800,
      [this.asteroidTypes.ICY]: 1000,
      [this.asteroidTypes.CARBONACEOUS]: 1400
    };
    return densities[type] || 2700;
  }

  getComposition(type) {
    const compositions = {
      [this.asteroidTypes.ROCKY]: {
        silicates: 0.8,
        metals: 0.15,
        organics: 0.05
      },
      [this.asteroidTypes.METALLIC]: {
        iron: 0.7,
        nickel: 0.25,
        other_metals: 0.05
      },
      [this.asteroidTypes.ICY]: {
        water_ice: 0.6,
        rock: 0.3,
        organics: 0.1
      },
      [this.asteroidTypes.CARBONACEOUS]: {
        organics: 0.4,
        silicates: 0.4,
        water: 0.2
      }
    };
    return compositions[type] || compositions[this.asteroidTypes.ROCKY];
  }

  addAtmosphericEffects(asteroid) {
    // Add glowing trail for atmospheric entry
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.PointsMaterial({
      color: 0xFF4500,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const trail = new THREE.Points(trailGeometry, trailMaterial);
    asteroid.add(trail);
    asteroid.userData.trailMesh = trail;
  }

  updateTrail(asteroid) {
    const trail = asteroid.userData.trail;
    const trailMesh = asteroid.userData.trailMesh;
    
    // Add current position to trail
    trail.push(asteroid.position.clone());
    
    // Limit trail length
    if (trail.length > asteroid.userData.maxTrailLength) {
      trail.shift();
    }
    
    // Update trail geometry
    if (trail.length > 1) {
      const positions = new Float32Array(trail.length * 3);
      const colors = new Float32Array(trail.length * 3);
      
      for (let i = 0; i < trail.length; i++) {
        const i3 = i * 3;
        positions[i3] = trail[i].x - asteroid.position.x;
        positions[i3 + 1] = trail[i].y - asteroid.position.y;
        positions[i3 + 2] = trail[i].z - asteroid.position.z;
        
        // Fade trail from bright to dim
        const alpha = i / trail.length;
        colors[i3] = 1 * alpha;     // R
        colors[i3 + 1] = 0.3 * alpha; // G
        colors[i3 + 2] = 0 * alpha;   // B
      }
      
      trailMesh.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      trailMesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      trailMesh.material.vertexColors = true;
    }
  }

  update(deltaTime) {
    this.asteroids.forEach(asteroid => {
      // Update position
      asteroid.position.add(
        asteroid.userData.velocity.clone().multiplyScalar(deltaTime)
      );
      
      // Update rotation
      asteroid.rotation.x += asteroid.userData.angularVelocity.x * deltaTime;
      asteroid.rotation.y += asteroid.userData.angularVelocity.y * deltaTime;
      asteroid.rotation.z += asteroid.userData.angularVelocity.z * deltaTime;
      
      // Update trail
      this.updateTrail(asteroid);
      
      // Apply atmospheric effects if in atmosphere
      this.applyAtmosphericEffects(asteroid, deltaTime);
    });
  }

  applyAtmosphericEffects(asteroid, deltaTime) {
    // Simple atmospheric model
    const altitude = asteroid.position.y; // Assuming Y is altitude
    const earthRadius = 6371; // km
    
    if (altitude < 100 && altitude > -earthRadius) { // In atmosphere
      const atmosphereDensity = this.getAtmosphereDensity(altitude);
      const velocity = asteroid.userData.velocity.length();
      
      // Calculate drag
      const dragCoefficient = 0.47; // Sphere approximation
      const crossSectionalArea = Math.PI * Math.pow(asteroid.userData.diameter / 2, 2);
      const dragForce = 0.5 * atmosphereDensity * velocity * velocity * dragCoefficient * crossSectionalArea;
      
      // Apply drag (opposite to velocity direction)
      const dragAcceleration = dragForce / asteroid.userData.mass;
      const velocityDirection = asteroid.userData.velocity.clone().normalize();
      asteroid.userData.velocity.sub(
        velocityDirection.multiplyScalar(dragAcceleration * deltaTime)
      );
      
      // Heat effects (visual only)
      if (velocity > 11) { // km/s - typical meteor velocity
        this.addHeatEffects(asteroid, velocity);
      }
    }
  }

  getAtmosphereDensity(altitude) {
    // Simplified atmospheric density model (kg/m³)
    if (altitude > 100) return 0; // Space
    if (altitude < 0) return 1.225; // Sea level
    
    // Exponential decay
    return 1.225 * Math.exp(-altitude / 8.5);
  }

  addHeatEffects(asteroid, velocity) {
    // Add glowing effect based on velocity
    const heatIntensity = Math.min(1, (velocity - 11) / 20);
    
    if (!asteroid.userData.heatGlow) {
      const glowGeometry = new THREE.SphereGeometry(asteroid.userData.diameter * 0.6, 16, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF4500,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      
      asteroid.userData.heatGlow = new THREE.Mesh(glowGeometry, glowMaterial);
      asteroid.add(asteroid.userData.heatGlow);
    }
    
    asteroid.userData.heatGlow.material.opacity = heatIntensity * 0.8;
    
    // Change color based on temperature
    if (heatIntensity > 0.8) {
      asteroid.userData.heatGlow.material.color.setHex(0xFFFFFF); // White hot
    } else if (heatIntensity > 0.5) {
      asteroid.userData.heatGlow.material.color.setHex(0xFFFF00); // Yellow
    } else {
      asteroid.userData.heatGlow.material.color.setHex(0xFF4500); // Orange
    }
  }

  removeAsteroid(asteroid) {
    const index = this.asteroids.indexOf(asteroid);
    if (index > -1) {
      this.asteroids.splice(index, 1);
      this.scene.remove(asteroid);
      
      // Clean up geometry and materials
      asteroid.geometry.dispose();
      asteroid.material.dispose();
      
      if (asteroid.userData.trailMesh) {
        asteroid.userData.trailMesh.geometry.dispose();
        asteroid.userData.trailMesh.material.dispose();
      }
      
      if (asteroid.userData.heatGlow) {
        asteroid.userData.heatGlow.geometry.dispose();
        asteroid.userData.heatGlow.material.dispose();
      }
    }
  }

  clear() {
    this.asteroids.forEach(asteroid => {
      this.removeAsteroid(asteroid);
    });
    this.asteroids = [];
  }

  getAsteroidByPosition(position, radius = 1) {
    return this.asteroids.find(asteroid => 
      asteroid.position.distanceTo(position) <= radius
    );
  }

  getAllAsteroids() {
    return [...this.asteroids];
  }
}