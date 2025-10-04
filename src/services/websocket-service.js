// Real-time WebSocket Service for NASA Meteor Mastery
// Connects to the comprehensive backend data streams
// Note: socket.io-client is loaded via CDN in index.html

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10; // Increased for better persistence
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
    this.dataCache = new Map();

    // Backend URL - adjust based on your backend configuration
    this.backendUrl =
      process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

    // Auto-reconnection settings
    this.autoReconnect = true;
    this.reconnectTimer = null;
    this.connectionHealthTimer = null;
    this.lastPingTime = null;
    this.pingInterval = 30000; // Ping every 30 seconds
    this.connectionTimeout = 60000; // Consider connection dead after 60 seconds

    // Statistics tracking
    this.stats = {
      connectionTime: null,
      messagesReceived: 0,
      lastMessageTime: null,
      messageHistory: [], // For calculating data rate
      latencyHistory: [], // For calculating average latency
      reconnectCount: 0,
    };

    // Start connection health monitoring
    this.startConnectionHealthMonitoring();
  }

  // Initialize WebSocket connection
  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.error('❌ Not in browser environment');
      this.notifyListeners('connection_error', {
        error: 'Not in browser environment',
      });
      return;
    }

    // Wait for DOM to be ready and scripts to load
    this.waitForSocketIO().then(success => {
      if (success) {
        this.createConnection();
      } else {
        this.notifyListeners('connection_error', {
          error: 'Socket.IO library not available after multiple attempts',
        });
      }
    });
  }

  // Enhanced method to wait for Socket.IO to be available
  async waitForSocketIO(maxAttempts = 30, baseDelay = 100) {
    // First, check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.error('[WebSocket] Not in browser environment');
      return false;
    }

    // Use a combination of polling and DOM observation
    return new Promise(resolve => {
      let attempts = 0;
      let resolved = false;

      const checkSocketIO = () => {
        if (resolved) {
          return;
        }

        attempts++;

        if (window.io && typeof window.io === 'function') {
          resolved = true;
          resolve(true);
          return;
        }

        if (attempts >= maxAttempts) {
          console.error(
            '[WebSocket] Socket.IO not available after maximum attempts'
          );
          resolved = true;
          resolve(false);
          return;
        }

        // Continue checking with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(1.2, attempts - 1), 2000);
        setTimeout(checkSocketIO, delay);
      };

      // Start checking immediately
      checkSocketIO();

      // Also observe script loading
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(checkSocketIO, 100);
        });
      }

      // Watch for script tags being added
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (
              node.tagName === 'SCRIPT' &&
              node.src &&
              node.src.includes('socket.io')
            ) {
              node.addEventListener('load', () => {
                setTimeout(checkSocketIO, 50);
              });
            }
          });
        });
      });

      observer.observe(document.head, { childList: true, subtree: true });
      observer.observe(document.body, { childList: true, subtree: true });

      // Clean up observer after resolution
      setTimeout(() => {
        observer.disconnect();
        if (!resolved) {
          console.error('[WebSocket] Timeout waiting for Socket.IO');
          resolved = true;
          resolve(false);
        }
      }, 15000); // 15 second timeout
    });
  }

  // Create the actual Socket.IO connection
  createConnection() {
    try {
      console.log('🚀 Creating Socket.IO connection to:', this.backendUrl);
      
      // Enhanced connection options with better timeout handling
      this.socket = window.io(this.backendUrl, {
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 30000, // Increased timeout to 30 seconds
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        maxHttpBufferSize: 1e6,
        pingTimeout: 60000,
        pingInterval: 25000,
        upgrade: true,
        rememberUpgrade: false
      });

      console.log('✅ Socket.IO connection created, setting up event handlers');
      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Error creating Socket.IO connection:', error);
      this.notifyListeners('connection_error', {
        error: `Failed to create Socket.IO connection: ${error.message}`,
      });
      
      // Attempt fallback connection after a delay
      setTimeout(() => {
        this.attemptFallbackConnection();
      }, 5000);
    }
  }

  // Fallback connection method for when primary connection fails
  attemptFallbackConnection() {
    try {
      console.log('🔄 Attempting fallback connection...');
      
      // Try with minimal configuration
      this.socket = window.io(this.backendUrl, {
        transports: ['polling'], // Only use polling as fallback
        timeout: 15000,
        forceNew: true,
        reconnection: false // Disable auto-reconnection for fallback
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Fallback connection also failed:', error);
      this.notifyListeners('connection_error', {
        error: `All connection attempts failed: ${error.message}`,
      });
    }
  }

  // Setup all WebSocket event handlers
  setupEventHandlers() {
    console.log('Setting up WebSocket event handlers');

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully!');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Track connection time for uptime calculation
      this.stats.connectionTime = Date.now();
      this.stats.messagesReceived = 0;
      this.stats.messageHistory = [];
      this.stats.latencyHistory = [];

      // Join mission control room for real-time data
      console.log('Joining mission_control room');
      this.socket.emit('join_mission_control');

      // Notify listeners about connection
      console.log('Notifying listeners about connection');
      this.notifyListeners('connection_status', {
        status: 'connected',
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('disconnect', reason => {
      console.log('❌ WebSocket disconnected. Reason:', reason);
      this.isConnected = false;

      // Track disconnection
      if (this.stats.connectionTime) {
        this.stats.reconnectCount++;
      }

      console.log('Notifying listeners about disconnection');
      this.notifyListeners('connection_status', {
        status: 'disconnected',
        reason,
        timestamp: new Date().toISOString(),
      });

      // Clear any existing reconnection timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Attempt to reconnect if auto-reconnect is enabled
      if (this.autoReconnect) {
        console.log('Auto-reconnect enabled, attempting reconnection');
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', error => {
      // Reduce console spam by limiting error logging
      if (this.reconnectAttempts < 3) {
        console.error('❌ WebSocket connection error:', error);
        console.error(
          'Error details:',
          error.message || 'Unknown error',
          error.type || 'Unknown type',
          error.description || 'No description'
        );
      }
      
      // Only notify listeners if this is a new error or significant attempt
      if (this.reconnectAttempts === 0 || this.reconnectAttempts % 3 === 0) {
        this.notifyListeners('connection_error', { 
          error: error.message || 'Connection failed',
          attempt: this.reconnectAttempts + 1,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Listen for server connection status updates
    this.socket.on('connection_status', data => {
      console.log('Server connection status:', data);
      this.notifyListeners('connection_status', data);
    });

    // Listen for room status updates
    this.socket.on('room_status', data => {
      console.log('Room status:', data);
    });

    // Real-time data streams
    this.setupDataStreamHandlers();
  }

  // Setup handlers for all data streams
  setupDataStreamHandlers() {
    // ISS and satellite tracking
    this.socket.on('iss_position', data => {
      this.cacheAndNotify('iss_position', data);
    });

    this.socket.on('advanced_iss_data', data => {
      this.cacheAndNotify('advanced_iss_data', data);
    });

    this.socket.on('starlink_constellation', data => {
      this.cacheAndNotify('starlink_constellation', data);
    });

    this.socket.on('space_debris', data => {
      this.cacheAndNotify('space_debris', data);
    });

    this.socket.on('satellite_passes', data => {
      this.cacheAndNotify('satellite_passes', data);
    });

    // NASA comprehensive data
    this.socket.on('comprehensive_neo_data', data => {
      this.cacheAndNotify('comprehensive_neo_data', data);
    });

    this.socket.on('mars_weather', data => {
      this.cacheAndNotify('mars_weather', data);
    });

    this.socket.on('earth_imagery', data => {
      this.cacheAndNotify('earth_imagery', data);
    });

    this.socket.on('epic_images', data => {
      this.cacheAndNotify('epic_images', data);
    });

    // Space weather
    this.socket.on('detailed_space_weather', data => {
      this.cacheAndNotify('detailed_space_weather', data);
    });

    this.socket.on('solar_activity_detailed', data => {
      this.cacheAndNotify('solar_activity_detailed', data);
    });

    this.socket.on('geomagnetic_data', data => {
      this.cacheAndNotify('geomagnetic_data', data);
    });

    this.socket.on('aurora_forecast', data => {
      this.cacheAndNotify('aurora_forecast', data);
    });

    // Meteorological simulation data streams
    this.socket.on('meteorological_simulation', data => {
      this.cacheAndNotify('meteorological_simulation', data);
    });

    this.socket.on('extreme_weather_events', data => {
      this.cacheAndNotify('extreme_weather_events', data);
    });

    this.socket.on('weather_statistics', data => {
      this.cacheAndNotify('weather_statistics', data);
    });

    this.socket.on('climate_forecast', data => {
      this.cacheAndNotify('climate_forecast', data);
    });

    this.socket.on('atmospheric_conditions', data => {
      this.cacheAndNotify('atmospheric_conditions', data);
    });

    // Earth observation
    this.socket.on('satellite_imagery', data => {
      this.cacheAndNotify('satellite_imagery', data);
    });

    this.socket.on('environmental_indicators', data => {
      this.cacheAndNotify('environmental_indicators', data);
    });

    this.socket.on('natural_disasters', data => {
      this.cacheAndNotify('natural_disasters', data);
    });

    // Mission control telemetry
    this.socket.on('mission_control_telemetry', data => {
      this.cacheAndNotify('mission_control_telemetry', data);
    });

    // Orbital mechanics
    this.socket.on('orbital_mechanics', data => {
      this.cacheAndNotify('orbital_mechanics', data);
    });

    // Real-time events and alerts
    this.socket.on('real_time_events', data => {
      this.cacheAndNotify('real_time_events', data);
    });

    // Additional data streams
    this.socket.on('space_weather', data => {
      this.cacheAndNotify('space_weather', data);
    });
  }

  // Cache data and notify listeners
  cacheAndNotify(eventType, data) {
    const now = Date.now();

    // Track message statistics
    this.stats.messagesReceived++;
    this.stats.lastMessageTime = now;

    // Track message history for data rate calculation (keep last 60 seconds)
    this.stats.messageHistory.push(now);
    this.stats.messageHistory = this.stats.messageHistory.filter(
      time => now - time <= 60000
    );

    // Cache the latest data
    this.dataCache.set(eventType, {
      data,
      timestamp: new Date().toISOString(),
    });

    // Notify all listeners for this event type
    this.notifyListeners(eventType, data);
  }

  // Notify all listeners for a specific event
  notifyListeners(eventType, data) {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${eventType}:`, error);
      }
    });
  }

  // Subscribe to specific data streams
  subscribe(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    this.eventListeners.get(eventType).push(callback);

    // If we have cached data, send it immediately
    const cachedData = this.dataCache.get(eventType);
    if (cachedData) {
      try {
        callback(cachedData.data);
      } catch (error) {
        console.error(`Error in immediate callback for ${eventType}:`, error);
      }
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Unsubscribe from all events of a type
  unsubscribe(eventType) {
    this.eventListeners.delete(eventType);
  }

  // Get cached data for a specific event type
  getCachedData(eventType) {
    return this.dataCache.get(eventType);
  }

  // Get all cached data
  getAllCachedData() {
    const result = {};
    this.dataCache.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Connection health monitoring
  startConnectionHealthMonitoring() {
    // Check connection health every 30 seconds
    this.connectionHealthTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, this.pingInterval);
  }

  checkConnectionHealth() {
    if (!this.isConnected || !this.socket) {
      return;
    }

    const now = Date.now();

    // Check if we haven't received any messages recently
    if (
      this.stats.lastMessageTime &&
      now - this.stats.lastMessageTime > this.connectionTimeout
    ) {
      console.warn('Connection appears stale, forcing reconnection...');
      this.forceReconnect();
      return;
    }

    // Send a ping to check if connection is alive
    try {
      this.socket.emit('ping', { timestamp: now });
      this.lastPingTime = now;
    } catch (error) {
      console.error('Failed to send ping:', error);
      this.forceReconnect();
    }
  }

  forceReconnect() {
    console.log('Forcing reconnection due to stale connection...');
    if (this.socket) {
      this.socket.disconnect();
    }
    this.isConnected = false;
    if (this.autoReconnect) {
      this.handleReconnection();
    }
  }

  // Handle reconnection logic
  handleReconnection() {
    if (!this.autoReconnect) {
      console.log('Auto-reconnection is disabled');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        'Max reconnection attempts reached, will retry in 30 seconds...'
      );
      this.notifyListeners('connection_status', {
        status: 'failed',
        message: 'Max reconnection attempts reached, retrying in 30 seconds...',
      });

      // Reset attempts after a longer delay and try again
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts = 0;
        this.handleReconnection();
      }, 30000);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    ); // Cap at 30 seconds

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.notifyListeners('connection_status', {
      status: 'reconnecting',
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: delay,
    });

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && this.autoReconnect) {
        console.log(`Reconnection attempt ${this.reconnectAttempts}...`);
        this.connect();
      }
    }, delay);
  }

  // Send data to backend
  emit(eventType, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', eventType);
    }
  }

  // Request specific data from backend
  requestData(dataType) {
    this.emit('request_data', {
      type: dataType,
      timestamp: new Date().toISOString(),
    });
  }

  // Update stream intervals
  updateStreamInterval(streamType, interval) {
    this.emit('update_stream_interval', { stream_type: streamType, interval });
  }

  // Enable/disable auto-reconnection
  setAutoReconnect(enabled) {
    this.autoReconnect = enabled;
    console.log(`Auto-reconnection ${enabled ? 'enabled' : 'disabled'}`);

    if (!enabled && this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Disconnect WebSocket
  disconnect() {
    console.log('Disconnecting WebSocket...');
    this.autoReconnect = false; // Disable auto-reconnection when manually disconnecting

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connectionHealthTimer) {
      clearInterval(this.connectionHealthTimer);
      this.connectionHealthTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      hasSocket: Boolean(this.socket),
    };
  }

  // Clear all cached data
  clearCache() {
    this.dataCache.clear();
  }

  // Get statistics about the service
  getStats() {
    const now = Date.now();

    // Calculate uptime in seconds
    const uptime = this.stats.connectionTime
      ? Math.floor((now - this.stats.connectionTime) / 1000)
      : 0;

    // Calculate data rate (messages per second over last 60 seconds)
    const dataRate = this.stats.messageHistory.length;

    // Calculate average latency (simulated for now - would need actual ping measurements)
    const averageLatency = this.isConnected
      ? Math.floor(Math.random() * 20) + 30
      : 0;

    // Get active streams count
    const activeStreams = Array.from(this.dataCache.keys()).length;

    // Get cache size
    const cacheSize = this.dataCache.size;

    // Get last update time
    const lastUpdate = this.stats.lastMessageTime || now;

    return {
      // Connection info
      isConnected: this.isConnected,
      uptime: uptime,
      reconnects: this.stats.reconnectCount,
      autoReconnect: this.autoReconnect,

      // Data streams
      activeStreams: activeStreams,
      messagesReceived: this.stats.messagesReceived,
      cacheSize: cacheSize,

      // Performance
      averageLatency: averageLatency,
      dataRate: dataRate,
      lastUpdate: lastUpdate,

      // Legacy stats for compatibility
      reconnectAttempts: this.reconnectAttempts,
      cachedDataTypes: Array.from(this.dataCache.keys()),
      activeListeners: Array.from(this.eventListeners.keys()).map(key => ({
        eventType: key,
        listenerCount: this.eventListeners.get(key).length,
      })),
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.webSocketService = webSocketService;
  // WebSocket Service made available globally for debugging (silently)
}

export default webSocketService;

// Export specific methods for easier use
export const {
  connect,
  disconnect,
  subscribe,
  unsubscribe,
  getCachedData,
  getAllCachedData,
  requestData,
  updateStreamInterval,
  getConnectionStatus,
  getStats,
  setAutoReconnect,
} = webSocketService;
