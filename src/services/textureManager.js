import * as THREE from 'three';

/**
 * Advanced Texture Manager for Realistic 3D Visualization
 * Handles loading, caching, and management of high-quality textures
 */
export class TextureManager {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.textureCache = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Load texture with caching and error handling
   */
  async loadTexture(url, options = {}) {
    // Check cache first
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url);
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const loadPromise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => {
          // Apply options
          if (options.wrapS) {
            texture.wrapS = options.wrapS;
          }
          if (options.wrapT) {
            texture.wrapT = options.wrapT;
          }
          if (options.repeat) {
            texture.repeat.set(options.repeat.x, options.repeat.y);
          }
          if (options.flipY !== undefined) {
            texture.flipY = options.flipY;
          }
          if (options.generateMipmaps !== undefined) {
            texture.generateMipmaps = options.generateMipmaps;
          }

          this.textureCache.set(url, texture);
          this.loadingPromises.delete(url);
          resolve(texture);
        },
        undefined,
        error => {
          console.error(`Failed to load texture: ${url}`, error);
          this.loadingPromises.delete(url);

          // Create fallback texture
          const fallbackTexture = this.createFallbackTexture(
            options.fallbackColor || 0x888888
          );
          this.textureCache.set(url, fallbackTexture);
          resolve(fallbackTexture);
        }
      );
    });

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * Create procedural Earth textures
   */
  createEarthTextures() {
    const textures = {};

    // Day texture (procedural)
    textures.day = this.createProceduralEarthTexture();

    // Night texture (city lights)
    textures.night = this.createNightEarthTexture();

    // Normal map for surface detail
    textures.normal = this.createEarthNormalMap();

    // Specular map for water reflection
    textures.specular = this.createEarthSpecularMap();

    // Cloud texture
    textures.clouds = this.createCloudTexture();

    return textures;
  }

  /**
   * Create procedural Earth day texture
   */
  createProceduralEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Create gradient for basic Earth colors
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue (poles)
    gradient.addColorStop(0.3, '#228B22'); // Forest green
    gradient.addColorStop(0.5, '#32CD32'); // Lime green (equator)
    gradient.addColorStop(0.7, '#228B22'); // Forest green
    gradient.addColorStop(1, '#87CEEB'); // Sky blue (poles)

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add continents (simplified)
    ctx.fillStyle = '#8B4513'; // Brown for land
    this.drawContinents(ctx, canvas.width, canvas.height);

    // Add oceans
    ctx.fillStyle = '#4169E1'; // Royal blue for oceans
    this.drawOceans(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Create night Earth texture with city lights
   */
  createNightEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add city lights
    ctx.fillStyle = '#FFFF88';
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Create Earth normal map for surface detail
   */
  createEarthNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Create noise pattern for surface detail
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 0.2 + 0.4;
      data[i] = 128 + noise * 127; // R (X normal)
      data[i + 1] = 128 + noise * 127; // G (Y normal)
      data[i + 2] = 255; // B (Z normal - pointing up)
      data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Create Earth specular map for water reflection
   */
  createEarthSpecularMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark background (land - no reflection)
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bright areas for water (high reflection)
    ctx.fillStyle = '#FFFFFF';
    this.drawOceans(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Create cloud texture
   */
  createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create cloud patterns
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 50 + 20;
      const opacity = Math.random() * 0.6 + 0.2;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Create asteroid textures with different compositions
   */
  createAsteroidTextures() {
    const textures = {};

    // Rocky asteroid
    textures.rocky = this.createRockyAsteroidTexture();

    // Metallic asteroid
    textures.metallic = this.createMetallicAsteroidTexture();

    // Icy asteroid
    textures.icy = this.createIcyAsteroidTexture();

    // Normal maps for surface detail
    textures.rockyNormal = this.createAsteroidNormalMap('rocky');
    textures.metallicNormal = this.createAsteroidNormalMap('metallic');
    textures.icyNormal = this.createAsteroidNormalMap('icy');

    return textures;
  }

  /**
   * Create rocky asteroid texture
   */
  createRockyAsteroidTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base rocky color
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add rocky patterns
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 20 + 5;
      const darkness = Math.random() * 0.5;

      ctx.fillStyle = `rgba(${139 * (1 - darkness)}, ${115 * (1 - darkness)}, ${85 * (1 - darkness)}, 1)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Create metallic asteroid texture
   */
  createMetallicAsteroidTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base metallic color
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add metallic patterns
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 30 + 10;
      const brightness = Math.random() * 0.5 + 0.5;

      ctx.fillStyle = `rgba(${192 * brightness}, ${192 * brightness}, ${192 * brightness}, 1)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Create icy asteroid texture
   */
  createIcyAsteroidTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base icy color
    ctx.fillStyle = '#E0F6FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add ice patterns
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 25 + 5;
      const alpha = Math.random() * 0.5 + 0.3;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Create asteroid normal map
   */
  createAsteroidNormalMap(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let noise;
      switch (type) {
        case 'rocky':
          noise = Math.random() * 0.8 + 0.1;
          break;
        case 'metallic':
          noise = Math.random() * 0.3 + 0.35;
          break;
        case 'icy':
          noise = Math.random() * 0.4 + 0.3;
          break;
        default:
          noise = Math.random() * 0.5 + 0.25;
      }

      data[i] = 128 + noise * 127; // R
      data[i + 1] = 128 + noise * 127; // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Create space environment cubemap
   */
  createSpaceEnvironment() {
    const size = 1024;
    const faces = [];

    // Create 6 faces for the cubemap
    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Dark space background
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, '#000033');
      gradient.addColorStop(1, '#000011');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Add stars
      ctx.fillStyle = '#FFFFFF';
      for (let j = 0; j < 200; j++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const brightness = Math.random();
        const starSize = Math.random() * 2 + 0.5;

        ctx.globalAlpha = brightness;
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      faces.push(canvas.toDataURL());
    }

    return this.cubeTextureLoader.load(faces);
  }

  /**
   * Helper method to draw simplified continents
   */
  drawContinents(ctx, width, height) {
    // Simplified continent shapes
    const continents = [
      // North America
      { x: width * 0.2, y: height * 0.3, w: width * 0.15, h: height * 0.2 },
      // South America
      { x: width * 0.25, y: height * 0.6, w: width * 0.08, h: height * 0.25 },
      // Europe/Asia
      { x: width * 0.5, y: height * 0.25, w: width * 0.3, h: height * 0.15 },
      // Africa
      { x: width * 0.52, y: height * 0.45, w: width * 0.12, h: height * 0.25 },
      // Australia
      { x: width * 0.75, y: height * 0.7, w: width * 0.08, h: height * 0.08 },
    ];

    continents.forEach(continent => {
      ctx.fillRect(continent.x, continent.y, continent.w, continent.h);
    });
  }

  /**
   * Helper method to draw simplified oceans
   */
  drawOceans(ctx, width, height) {
    // Pacific Ocean
    ctx.fillRect(0, height * 0.2, width * 0.4, height * 0.6);
    ctx.fillRect(width * 0.8, height * 0.2, width * 0.2, height * 0.6);

    // Atlantic Ocean
    ctx.fillRect(width * 0.35, height * 0.2, width * 0.15, height * 0.6);

    // Indian Ocean
    ctx.fillRect(width * 0.6, height * 0.4, width * 0.2, height * 0.4);
  }

  /**
   * Create fallback texture
   */
  createFallbackTexture(color = 0x888888) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const colorObj = new THREE.Color(color);
    ctx.fillStyle = `rgb(${colorObj.r * 255}, ${colorObj.g * 255}, ${colorObj.b * 255})`;
    ctx.fillRect(0, 0, 256, 256);

    // Add a simple pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let x = 0; x < 256; x += 32) {
      for (let y = 0; y < 256; y += 32) {
        if ((x / 32 + y / 32) % 2 === 0) {
          ctx.fillRect(x, y, 32, 32);
        }
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Dispose of all cached textures
   */
  dispose() {
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    this.textureCache.clear();
    this.loadingPromises.clear();
  }
}

export default TextureManager;
