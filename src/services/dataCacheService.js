/**
 * Intelligent Data Caching and Storage Service
 * Provides advanced caching capabilities for geographical and astronomical data
 * with TTL, compression, smart eviction, and storage optimization
 */

class DataCacheService {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.compressionEnabled = true;
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB default
    this.currentCacheSize = 0;
    this.hitCount = 0;
    this.missCount = 0;

    // Default TTL values (in milliseconds)
    this.defaultTTL = {
      'nasa-neo': 24 * 60 * 60 * 1000, // 24 hours
      'nasa-space-weather': 1 * 60 * 60 * 1000, // 1 hour
      'nasa-planetary': 7 * 24 * 60 * 60 * 1000, // 7 days
      'usgs-elevation': 30 * 24 * 60 * 60 * 1000, // 30 days
      'usgs-earthquake': 1 * 60 * 60 * 1000, // 1 hour
      'usgs-terrain': 7 * 24 * 60 * 60 * 1000, // 7 days
      'satellite-imagery': 24 * 60 * 60 * 1000, // 24 hours
      'weather-data': 3 * 60 * 60 * 1000, // 3 hours
      default: 6 * 60 * 60 * 1000, // 6 hours
    };

    // Initialize cleanup interval
    this.startCleanupInterval();

    // Initialize IndexedDB for persistent storage
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for persistent storage
   */
  async initIndexedDB() {
    try {
      this.db = await this.openIndexedDB();
      console.log('IndexedDB initialized for persistent caching');
    } catch (error) {
      console.warn('IndexedDB not available, using memory-only cache:', error);
      this.db = null;
    }
  }

  /**
   * Open IndexedDB connection
   */
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MeteorMadnessCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('dataCache')) {
          const store = db.createObjectStore('dataCache', { keyPath: 'key' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(category, identifier, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');

    return `${category}:${identifier}:${this.hashString(paramString)}`;
  }

  /**
   * Simple hash function for parameter strings
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Compress data using built-in compression
   */
  async compressData(data) {
    if (!this.compressionEnabled) {
      return data;
    }

    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(jsonString);

      // Use CompressionStream if available (modern browsers)
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(uint8Array);
        writer.close();

        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }

        return {
          compressed: true,
          data: chunks,
          originalSize: uint8Array.length,
        };
      }

      // Fallback: return uncompressed
      return {
        compressed: false,
        data: jsonString,
        originalSize: uint8Array.length,
      };
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return {
        compressed: false,
        data: JSON.stringify(data),
        originalSize: JSON.stringify(data).length,
      };
    }
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData) {
    if (!compressedData.compressed) {
      return typeof compressedData.data === 'string'
        ? JSON.parse(compressedData.data)
        : compressedData.data;
    }

    try {
      // Use DecompressionStream if available
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        // Write compressed chunks
        for (const chunk of compressedData.data) {
          writer.write(chunk);
        }
        writer.close();

        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }

        // Combine chunks and decode
        const totalLength = chunks.reduce(
          (sum, chunk) => sum + chunk.length,
          0
        );
        const combined = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        const decoder = new TextDecoder();
        const jsonString = decoder.decode(combined);
        return JSON.parse(jsonString);
      }

      // Fallback: data should already be decompressed
      return compressedData.data;
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error('Failed to decompress cached data');
    }
  }

  /**
   * Store data in cache
   */
  async set(category, identifier, data, customTTL = null) {
    const key = this.generateKey(category, identifier);
    const ttl =
      customTTL || this.defaultTTL[category] || this.defaultTTL.default;
    const expiresAt = Date.now() + ttl;

    try {
      // Compress data
      const compressedData = await this.compressData(data);
      const dataSize = this.estimateSize(compressedData);

      // Check if we need to evict data
      await this.ensureSpace(dataSize);

      // Create cache entry
      const cacheEntry = {
        key,
        category,
        identifier,
        data: compressedData,
        timestamp: Date.now(),
        expiresAt,
        size: dataSize,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      // Store in memory cache
      this.cache.set(key, cacheEntry);
      this.metadata.set(key, {
        category,
        identifier,
        timestamp: cacheEntry.timestamp,
        expiresAt,
        size: dataSize,
        accessCount: 0,
        lastAccessed: Date.now(),
      });

      this.currentCacheSize += dataSize;

      // Store in IndexedDB for persistence
      if (this.db) {
        await this.storeInIndexedDB(cacheEntry);
      }

      console.log(
        `Cached ${category}:${identifier} (${this.formatSize(dataSize)})`
      );
      return true;
    } catch (error) {
      console.error('Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from cache
   */
  async get(category, identifier, params = {}) {
    const key = this.generateKey(category, identifier, params);

    // Check memory cache first
    let cacheEntry = this.cache.get(key);

    // If not in memory, try IndexedDB
    if (!cacheEntry && this.db) {
      cacheEntry = await this.getFromIndexedDB(key);
      if (cacheEntry) {
        // Restore to memory cache
        this.cache.set(key, cacheEntry);
        this.metadata.set(key, {
          category: cacheEntry.category,
          identifier: cacheEntry.identifier,
          timestamp: cacheEntry.timestamp,
          expiresAt: cacheEntry.expiresAt,
          size: cacheEntry.size,
          accessCount: cacheEntry.accessCount,
          lastAccessed: cacheEntry.lastAccessed,
        });
      }
    }

    if (!cacheEntry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() > cacheEntry.expiresAt) {
      await this.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    cacheEntry.accessCount++;
    cacheEntry.lastAccessed = Date.now();
    this.metadata.get(key).accessCount = cacheEntry.accessCount;
    this.metadata.get(key).lastAccessed = cacheEntry.lastAccessed;

    this.hitCount++;

    try {
      // Decompress and return data
      const data = await this.decompressData(cacheEntry.data);
      console.log(`Cache hit for ${category}:${identifier}`);
      return data;
    } catch (error) {
      console.error('Failed to decompress cached data:', error);
      await this.delete(key);
      this.missCount++;
      return null;
    }
  }

  /**
   * Store data in IndexedDB
   */
  async storeInIndexedDB(cacheEntry) {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(['dataCache'], 'readwrite');
      const store = transaction.objectStore('dataCache');
      await store.put(cacheEntry);
    } catch (error) {
      console.warn('Failed to store in IndexedDB:', error);
    }
  }

  /**
   * Retrieve data from IndexedDB
   */
  async getFromIndexedDB(key) {
    if (!this.db) {
      return null;
    }

    try {
      const transaction = this.db.transaction(['dataCache'], 'readonly');
      const store = transaction.objectStore('dataCache');
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to retrieve from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key) {
    const cacheEntry = this.cache.get(key);
    if (cacheEntry) {
      this.currentCacheSize -= cacheEntry.size;
      this.cache.delete(key);
      this.metadata.delete(key);
    }

    // Delete from IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['dataCache'], 'readwrite');
        const store = transaction.objectStore('dataCache');
        await store.delete(key);
      } catch (error) {
        console.warn('Failed to delete from IndexedDB:', error);
      }
    }
  }

  /**
   * Clear cache by category
   */
  async clearCategory(category) {
    const keysToDelete = [];

    for (const [key, metadata] of this.metadata.entries()) {
      if (metadata.category === category) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    console.log(
      `Cleared ${keysToDelete.length} entries from category: ${category}`
    );
  }

  /**
   * Clear all cache data
   */
  async clearAll() {
    this.cache.clear();
    this.metadata.clear();
    this.currentCacheSize = 0;
    this.hitCount = 0;
    this.missCount = 0;

    // Clear IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['dataCache'], 'readwrite');
        const store = transaction.objectStore('dataCache');
        await store.clear();
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error);
      }
    }

    console.log('Cache cleared completely');
  }

  /**
   * Ensure sufficient space in cache
   */
  async ensureSpace(requiredSize) {
    if (this.currentCacheSize + requiredSize <= this.maxCacheSize) {
      return;
    }

    console.log('Cache size limit reached, performing eviction...');

    // Get entries sorted by priority (LRU + access frequency)
    const entries = Array.from(this.metadata.entries())
      .map(([key, metadata]) => ({
        key,
        ...metadata,
        priority: this.calculateEvictionPriority(metadata),
      }))
      .sort((a, b) => a.priority - b.priority);

    // Evict entries until we have enough space
    let freedSpace = 0;
    for (const entry of entries) {
      if (freedSpace >= requiredSize) {
        break;
      }

      freedSpace += entry.size;
      await this.delete(entry.key);
      console.log(
        `Evicted ${entry.category}:${entry.identifier} (${this.formatSize(entry.size)})`
      );
    }
  }

  /**
   * Calculate eviction priority (lower = evict first)
   */
  calculateEvictionPriority(metadata) {
    const now = Date.now();
    const age = now - metadata.timestamp;
    const timeSinceAccess = now - metadata.lastAccessed;
    const accessFrequency = metadata.accessCount / (age / (1000 * 60 * 60)); // accesses per hour

    // Priority factors (lower = more likely to evict)
    const ageFactor = age / (1000 * 60 * 60 * 24); // days
    const accessFactor = 1 / (accessFrequency + 1);
    const sizeFactor = metadata.size / (1024 * 1024); // MB
    const recentAccessFactor = timeSinceAccess / (1000 * 60 * 60); // hours

    return ageFactor + accessFactor + sizeFactor * 0.1 + recentAccessFactor;
  }

  /**
   * Estimate size of data in bytes
   */
  estimateSize(data) {
    if (data.compressed && data.data instanceof Array) {
      return data.data.reduce((sum, chunk) => sum + chunk.length, 0);
    }
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Format size for display
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Start cleanup interval for expired entries
   */
  startCleanupInterval() {
    setInterval(
      () => {
        this.cleanupExpired();
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, metadata] of this.metadata.entries()) {
      if (now > metadata.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate =
      totalRequests > 0
        ? ((this.hitCount / totalRequests) * 100).toFixed(1)
        : 0;

    return {
      entries: this.cache.size,
      totalSize: this.formatSize(this.currentCacheSize),
      maxSize: this.formatSize(this.maxCacheSize),
      utilization: ((this.currentCacheSize / this.maxCacheSize) * 100).toFixed(
        1
      ),
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate}%`,
      categories: this.getCategoryStats(),
    };
  }

  /**
   * Get statistics by category
   */
  getCategoryStats() {
    const stats = {};

    for (const metadata of this.metadata.values()) {
      if (!stats[metadata.category]) {
        stats[metadata.category] = {
          count: 0,
          totalSize: 0,
          totalAccesses: 0,
        };
      }

      stats[metadata.category].count++;
      stats[metadata.category].totalSize += metadata.size;
      stats[metadata.category].totalAccesses += metadata.accessCount;
    }

    // Format sizes
    for (const category in stats) {
      stats[category].totalSize = this.formatSize(stats[category].totalSize);
    }

    return stats;
  }

  /**
   * Set cache configuration
   */
  configure(options = {}) {
    if (options.maxCacheSize) {
      this.maxCacheSize = options.maxCacheSize;
    }

    if (options.compressionEnabled !== undefined) {
      this.compressionEnabled = options.compressionEnabled;
    }

    if (options.defaultTTL) {
      Object.assign(this.defaultTTL, options.defaultTTL);
    }

    console.log('Cache configuration updated:', {
      maxCacheSize: this.formatSize(this.maxCacheSize),
      compressionEnabled: this.compressionEnabled,
    });
  }
}

// Create singleton instance
export const dataCacheService = new DataCacheService();
export default dataCacheService;
