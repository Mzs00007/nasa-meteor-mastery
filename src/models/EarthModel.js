import * as THREE from 'three';

export class EarthModel {
  constructor(scene) {
    this.scene = scene;
    this.earthRadius = 6371; // km
    this.scaleFactor = 0.01; // Scale for visualization
    this.impactCraters = [];
    this.destructionZones = [];
    
    this.initializeEarth();
    this.initializeAtmosphere();
    this.initializeClouds();
  }

  initializeEarth() {
    // Create Earth geometry
    const geometry = new THREE.SphereGeometry(this.earthRadius * this.scaleFactor, 64, 32);
    
    // Create Earth material with realistic textures
    const material = new THREE.MeshPhongMaterial({
      map: this.createEarthTexture(),
      normalMap: this.createEarthNormalMap(),
      specularMap: this.createEarthSpecularMap(),
      bumpMap: this.createEarthBumpMap(),
      bumpScale: 0.02,
      shininess: 100
    });
    
    this.earthMesh = new THREE.Mesh(geometry, material);
    this.earthMesh.userData = {
      type: 'earth',
      radius: this.earthRadius,
      mass: 5.972e24, // kg
      rotationSpeed: 7.2921159e-5 // rad/s
    };
    
    this.scene.add(this.earthMesh);
    
    // Create separate geometry for destruction effects
    this.createDestructionLayer();
  }

  createEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Create a simplified Earth texture
    // Oceans (blue)
    context.fillStyle = '#1e3a8a';
    context.fillRect(0, 0, 1024, 512);
    
    // Continents (green/brown)
    this.drawContinents(context);
    
    // Ice caps (white)
    this.drawIceCaps(context);
    
    return new THREE.CanvasTexture(canvas);
  }

  drawContinents(context) {
    // Simplified continent shapes
    const continents = [
      // North America
      { x: 150, y: 150, width: 200, height: 150, color: '#22c55e' },
      // South America
      { x: 200, y: 300, width: 100, height: 180, color: '#16a34a' },
      // Europe
      { x: 450, y: 120, width: 80, height: 100, color: '#15803d' },
      // Africa
      { x: 480, y: 200, width: 120, height: 200, color: '#ca8a04' },
      // Asia
      { x: 550, y: 100, width: 300, height: 200, color: '#22c55e' },
      // Australia
      { x: 750, y: 350, width: 150, height: 80, color: '#eab308' },
      // Antarctica
      { x: 0, y: 450, width: 1024, height: 62, color: '#f8fafc' }
    ];
    
    continents.forEach(continent => {
      context.fillStyle = continent.color;
      context.fillRect(continent.x, continent.y, continent.width, continent.height);
      
      // Add some texture variation
      for (let i = 0; i < 50; i++) {
        const x = continent.x + Math.random() * continent.width;
        const y = continent.y + Math.random() * continent.height;
        const size = Math.random() * 10 + 2;
        
        context.fillStyle = this.adjustColor(continent.color, Math.random() * 0.3 - 0.15);
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  drawIceCaps(context) {
    // North pole
    context.fillStyle = '#f8fafc';
    context.fillRect(0, 0, 1024, 50);
    
    // South pole
    context.fillRect(0, 462, 1024, 50);
  }

  adjustColor(color, factor) {
    // Simple color adjustment
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + factor)));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + factor)));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + factor)));
    
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }

  createEarthNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create normal map for surface details
    const imageData = context.createImageData(512, 256);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % 512;
      const y = Math.floor((i / 4) / 512);
      
      // Generate surface normals
      const nx = 0.5 + Math.sin(x * 0.1) * 0.1;
      const ny = 0.5 + Math.sin(y * 0.1) * 0.1;
      const nz = 0.8;
      
      data[i] = nx * 255;     // R = X
      data[i + 1] = ny * 255; // G = Y
      data[i + 2] = nz * 255; // B = Z
      data[i + 3] = 255;      // A
    }
    
    context.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  createEarthSpecularMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Oceans are reflective (white), land is not (black)
    context.fillStyle = '#ffffff'; // Oceans
    context.fillRect(0, 0, 1024, 512);
    
    // Make land areas non-reflective
    context.fillStyle = '#000000';
    this.drawContinents(context);
    
    return new THREE.CanvasTexture(canvas);
  }

  createEarthBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create height variations
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const size = Math.random() * 20 + 5;
      const intensity = Math.random() * 100 + 100;
      
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

  initializeAtmosphere() {
    // Create atmosphere layer
    const atmosphereGeometry = new THREE.SphereGeometry(
      this.earthRadius * this.scaleFactor * 1.05, 32, 16
    );
    
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(this.atmosphereMesh);
  }

  initializeClouds() {
    // Create cloud layer
    const cloudGeometry = new THREE.SphereGeometry(
      this.earthRadius * this.scaleFactor * 1.02, 32, 16
    );
    
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: this.createCloudTexture(),
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    
    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.scene.add(this.cloudMesh);
  }

  createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Transparent background
    context.clearRect(0, 0, 512, 256);
    
    // Generate cloud patterns
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const size = Math.random() * 50 + 20;
      const opacity = Math.random() * 0.8 + 0.2;
      
      const gradient = context.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  createDestructionLayer() {
    // Create a separate layer for destruction effects
    const destructionGeometry = new THREE.SphereGeometry(
      this.earthRadius * this.scaleFactor * 1.001, 64, 32
    );
    
    const destructionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    
    this.destructionMesh = new THREE.Mesh(destructionGeometry, destructionMaterial);
    this.scene.add(this.destructionMesh);
  }

  createImpactCrater(impactPoint, energy) {
    const craterRadius = this.calculateCraterRadius(energy);
    const craterDepth = craterRadius * 0.2;
    
    // Convert world position to UV coordinates
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(impactPoint.clone().normalize());
    
    const u = (spherical.theta / (Math.PI * 2)) + 0.5;
    const v = 1 - (spherical.phi / Math.PI);
    
    const crater = {
      position: impactPoint.clone(),
      radius: craterRadius,
      depth: craterDepth,
      energy,
      uv: { u, v },
      created: Date.now(),
      active: true
    };
    
    this.impactCraters.push(crater);
    this.updateEarthTexture();
    
    return crater;
  }

  calculateCraterRadius(energy) {
    // Crater radius based on impact energy (simplified)
    // Real formula is much more complex
    return Math.min(500, Math.max(1, Math.pow(energy / 1e15, 0.25) * 10));
  }

  updateEarthTexture() {
    // Update Earth texture with craters
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Redraw base Earth texture
    context.fillStyle = '#1e3a8a';
    context.fillRect(0, 0, 1024, 512);
    this.drawContinents(context);
    this.drawIceCaps(context);
    
    // Add craters
    this.impactCraters.forEach(crater => {
      const x = crater.uv.u * 1024;
      const y = crater.uv.v * 512;
      const radius = crater.radius * this.scaleFactor * 100; // Scale for texture
      
      // Draw crater
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#000000'); // Black center
      gradient.addColorStop(0.7, '#8B4513'); // Brown rim
      gradient.addColorStop(1, 'rgba(139, 69, 19, 0)'); // Fade out
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });
    
    // Update texture
    this.earthMesh.material.map = new THREE.CanvasTexture(canvas);
    this.earthMesh.material.needsUpdate = true;
  }

  createDestructionZone(center, radius, intensity) {
    const zone = {
      center: center.clone(),
      radius,
      intensity,
      created: Date.now(),
      duration: 10000, // 10 seconds
      active: true
    };
    
    this.destructionZones.push(zone);
    this.updateDestructionEffects();
    
    return zone;
  }

  updateDestructionEffects() {
    const currentTime = Date.now();
    
    // Update destruction zones
    this.destructionZones = this.destructionZones.filter(zone => {
      const elapsed = currentTime - zone.created;
      zone.active = elapsed < zone.duration;
      
      if (zone.active) {
        // Update visual effects
        const progress = elapsed / zone.duration;
        const opacity = zone.intensity * (1 - progress);
        
        // This would update the destruction layer texture
        // For now, we'll just update the overall opacity
        this.destructionMesh.material.opacity = Math.max(
          this.destructionMesh.material.opacity,
          opacity * 0.5
        );
      }
      
      return zone.active;
    });
    
    // Fade out destruction layer if no active zones
    if (this.destructionZones.length === 0) {
      this.destructionMesh.material.opacity *= 0.95;
    }
  }

  addSeismicWaves(epicenter, magnitude) {
    // Create expanding seismic wave effect
    const waveGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const waveMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.position.copy(epicenter);
    wave.lookAt(new THREE.Vector3(0, 0, 0)); // Face outward from Earth center
    
    wave.userData = {
      type: 'seismic_wave',
      startTime: Date.now(),
      duration: 5000,
      maxRadius: magnitude * 10,
      epicenter: epicenter.clone()
    };
    
    this.scene.add(wave);
    
    // Animate wave expansion
    const animate = () => {
      const elapsed = Date.now() - wave.userData.startTime;
      const progress = elapsed / wave.userData.duration;
      
      if (progress < 1) {
        const currentRadius = progress * wave.userData.maxRadius;
        wave.scale.setScalar(currentRadius);
        wave.material.opacity = 0.6 * (1 - progress);
        
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(wave);
        wave.geometry.dispose();
        wave.material.dispose();
      }
    };
    
    animate();
  }

  addTsunami(epicenter, magnitude) {
    // Create tsunami wave effect (simplified)
    if (this.isOceanPoint(epicenter)) {
      const tsunamiGeometry = new THREE.RingGeometry(1, 2, 32);
      const tsunamiMaterial = new THREE.MeshBasicMaterial({
        color: 0x0066cc,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const tsunami = new THREE.Mesh(tsunamiGeometry, tsunamiMaterial);
      tsunami.position.copy(epicenter);
      tsunami.lookAt(new THREE.Vector3(0, 0, 0));
      
      tsunami.userData = {
        type: 'tsunami',
        startTime: Date.now(),
        duration: 15000,
        maxRadius: magnitude * 20,
        speed: 0.2 // km/s in scaled units
      };
      
      this.scene.add(tsunami);
      
      // Animate tsunami
      const animate = () => {
        const elapsed = Date.now() - tsunami.userData.startTime;
        const progress = elapsed / tsunami.userData.duration;
        
        if (progress < 1) {
          const currentRadius = progress * tsunami.userData.maxRadius;
          tsunami.scale.setScalar(currentRadius);
          tsunami.material.opacity = 0.8 * (1 - progress * 0.5);
          
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(tsunami);
          tsunami.geometry.dispose();
          tsunami.material.dispose();
        }
      };
      
      animate();
    }
  }

  isOceanPoint(point) {
    // Simplified ocean detection
    // In a real implementation, this would check against actual ocean data
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(point.clone().normalize());
    
    const u = (spherical.theta / (Math.PI * 2)) + 0.5;
    const v = 1 - (spherical.phi / Math.PI);
    
    // Rough approximation of ocean areas
    return (u < 0.15 || u > 0.85) || // Pacific
           (u > 0.35 && u < 0.65 && v > 0.3 && v < 0.7); // Atlantic
  }

  update(deltaTime) {
    // Rotate Earth
    this.earthMesh.rotation.y += this.earthMesh.userData.rotationSpeed * deltaTime;
    
    // Rotate clouds slightly faster
    this.cloudMesh.rotation.y += this.earthMesh.userData.rotationSpeed * deltaTime * 1.1;
    
    // Update destruction effects
    this.updateDestructionEffects();
  }

  getImpactPoint(direction) {
    // Calculate impact point on Earth surface
    const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 0, 0), direction.normalize());
    const intersects = raycaster.intersectObject(this.earthMesh);
    
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    
    return null;
  }

  getElevation(point) {
    // Get surface elevation at point (simplified)
    const distance = point.length();
    return distance - (this.earthRadius * this.scaleFactor);
  }

  clear() {
    // Clear all impact effects
    this.impactCraters = [];
    this.destructionZones = [];
    this.updateEarthTexture();
    this.destructionMesh.material.opacity = 0;
  }

  dispose() {
    // Clean up resources
    this.earthMesh.geometry.dispose();
    this.earthMesh.material.dispose();
    this.atmosphereMesh.geometry.dispose();
    this.atmosphereMesh.material.dispose();
    this.cloudMesh.geometry.dispose();
    this.cloudMesh.material.dispose();
    this.destructionMesh.geometry.dispose();
    this.destructionMesh.material.dispose();
  }
}