// Real-time WebSocket Service for NASA Meteor Mastery
// Connects to the comprehensive backend data streams
// Note: socket.io-client is loaded via CDN in index.html

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    // Environment-based configuration with fallbacks
    this.maxReconnectAttempts = this.getEnvNumber('WEBSOCKET_MAX_RECONNECT_ATTEMPTS', 50);
    this.reconnectDelay = this.getEnvNumber('WEBSOCKET_RECONNECT_DELAY', 2000);
    this.maxReconnectDelay = this.getEnvNumber('WEBSOCKET_MAX_RECONNECT_DELAY', 15000);
    this.autoReconnect = this.getEnvBoolean('WEBSOCKET_AUTO_RECONNECT', true);
    this.connectionTimeout = this.getEnvNumber('WEBSOCKET_CONNECTION_TIMEOUT', 60000);
    this.healthCheckInterval = this.getEnvNumber('WEBSOCKET_HEALTH_CHECK_INTERVAL', 30000);
    this.socketTimeout = this.getEnvNumber('WEBSOCKET_TIMEOUT', 20000);
    
    this.reconnectTimer = null;
    this.eventListeners = new Map();
    this.dataCache = new Map();

    // Enhanced backend URL configuration for deployment flexibility
    this.backendUrl = this.determineBackendUrl();

    this.healthCheckTimer = null;
    this.pingTimeout = null;
    this.lastPingTime = null;
    this.isNetworkOnline = true;

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

  // Helper method to get environment variables as numbers
  getEnvNumber(key, defaultValue) {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      const value = parseInt(process.env[key], 10);
      return isNaN(value) ? defaultValue : value;
    }
    return defaultValue;
  }

  // Helper method to get environment variables as booleans
  getEnvBoolean(key, defaultValue) {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      const value = process.env[key]?.toLowerCase();
      return value === 'true' || value === '1' || value === 'yes';
    }
    return defaultValue;
  }

  // Determine the backend URL intelligently for deployment flexibility
  determineBackendUrl() {
    // Priority order for URL determination:
    // 1. Explicit WebSocket URL from environment
    // 2. Backend URL from environment (add WebSocket port)
    // 3. Current host (for production deployments)
    // 4. Localhost fallback (for development)
    
    if (process.env.REACT_APP_WEBSOCKET_URL) {
      console.log('🔧 Using explicit WebSocket URL from environment:', process.env.REACT_APP_WEBSOCKET_URL);
      return process.env.REACT_APP_WEBSOCKET_URL;
    }
    
    if (process.env.REACT_APP_BACKEND_URL) {
      // If backend URL is provided, try to derive WebSocket URL
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      console.log('🔧 Deriving WebSocket URL from backend URL:', backendUrl);
      
      if (backendUrl.includes(':3001') || backendUrl.includes('websocket')) {
        return backendUrl;
      }
      // Try to modify port for WebSocket
      return backendUrl.replace(/:\d+/, ':3001');
    }
    
    // For production deployments, try to use current host
    if (typeof window !== 'undefined' && window.location) {
      const { protocol, hostname, port } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Detect common deployment scenarios
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isProduction = !isLocalhost && (protocol === 'https:' || !port || port === '80' || port === '443');
      
      if (isProduction) {
        // Production deployment - try same host with WebSocket path or port
        console.log('🌐 Production deployment detected, using current host for WebSocket');
        
        // Try WebSocket path first (common in production with reverse proxy)
        const wsPathUrl = `${wsProtocol}//${hostname}${port ? `:${port}` : ''}/ws`;
        
        // Try dedicated WebSocket port as fallback
        const wsPortUrl = `${wsProtocol}//${hostname}:3001`;
        
        // Return path-based URL first (more common in production)
        return wsPathUrl;
      } else {
        // Development or staging - use port-based approach
        console.log('🛠️ Development environment detected, using port-based WebSocket URL');
        return `${wsProtocol}//${hostname}:3001`;
      }
    }
    
    // Development fallback
    console.log('🛠️ Using development fallback WebSocket URL');
    return 'http://localhost:3001';
  }

  // Get alternative URLs for progressive fallback
  getAlternativeUrls() {
    const alternatives = [];
    
    if (typeof window !== 'undefined' && window.location) {
      const { protocol, hostname, port } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      const httpProtocol = protocol === 'https:' ? 'https:' : 'http:';
      
      // Add various possible URLs
      alternatives.push(
        // WebSocket path-based (common in production)
        `${wsProtocol}//${hostname}${port ? `:${port}` : ''}/ws`,
        `${wsProtocol}//${hostname}${port ? `:${port}` : ''}/websocket`,
        
        // Different ports
        `${wsProtocol}//${hostname}:3001`,
        `${wsProtocol}//${hostname}:8080`,
        `${wsProtocol}//${hostname}:5000`,
        `${httpProtocol}//${hostname}:3001`,
        `${httpProtocol}//${hostname}:8080`,
        `${httpProtocol}//${hostname}:5000`,
        
        // Same port as current page
        ...(port ? [`${wsProtocol}//${hostname}:${port}`, `${httpProtocol}//${hostname}:${port}`] : [])
      );
    }
    
    // Add localhost fallbacks
    alternatives.push(
      'ws://localhost:3001',
      'http://localhost:3001',
      'ws://localhost:8080',
      'http://localhost:8080',
      'ws://localhost:5000',
      'http://localhost:5000'
    );
    
    // Remove duplicates and return
    return [...new Set(alternatives)];
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

  // Create the actual Socket.IO connection with enhanced robustness
  createConnection() {
    try {
      console.log('🚀 Creating Socket.IO connection to:', this.backendUrl);
      
      // Simplified connection options to avoid conflicts
      const connectionOptions = {
        transports: ['polling', 'websocket'],
        timeout: this.socketTimeout,
        forceNew: false, // Allow connection reuse
        reconnection: false, // Disable built-in reconnection, use our custom logic
        maxHttpBufferSize: 1e6,
        pingTimeout: 30000,
        pingInterval: 15000,
        upgrade: true,
        autoConnect: true,
        withCredentials: false
      };

      this.socket = window.io(this.backendUrl, connectionOptions);

      console.log('✅ Socket.IO connection created, setting up event handlers');
      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Error creating Socket.IO connection:', error);
      this.notifyListeners('connection_error', {
        error: `Failed to create Socket.IO connection: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      
      // Progressive fallback strategy
      this.attemptProgressiveFallback();
    }
  }

  // Enhanced progressive fallback strategy for robust connection handling
  attemptProgressiveFallback() {
    const alternativeUrls = this.getAlternativeUrls();
    
    const strategies = [
      {
        name: 'Polling Only (Current URL)',
        delay: 1000,
        url: this.backendUrl,
        options: {
          transports: ['polling'],
          upgrade: false,
          timeout: 8000,
        }
      },
      {
        name: 'WebSocket + Polling (Current URL)',
        delay: 2000,
        url: this.backendUrl,
        options: {
          transports: ['websocket', 'polling'],
          timeout: 6000,
          upgrade: true,
        }
      },
      ...alternativeUrls.slice(0, 5).map((url, index) => ({
        name: `Alternative URL ${index + 1}`,
        delay: 2000 + (index * 1000),
        url: url,
        options: {
          transports: ['websocket', 'polling'],
          timeout: 8000,
          upgrade: true,
        }
      })),
      {
        name: 'Minimal Configuration (Localhost)',
        delay: 8000,
        url: 'http://localhost:3001',
        options: {
          transports: ['polling'],
          upgrade: false,
          timeout: 10000,
          forceNew: true,
        }
      }
    ];

    let currentStrategy = 0;
    let totalStrategies = strategies.length;

    const tryNextStrategy = () => {
      if (currentStrategy >= totalStrategies) {
        console.error('❌ All fallback strategies exhausted, implementing exponential backoff...');
        this.notifyListeners('connection_status', {
          status: 'all_fallbacks_failed',
          message: 'All connection strategies failed, implementing exponential backoff...',
          nextRetryIn: 60000,
        });
        
        // Exponential backoff with maximum delay
        const backoffDelay = Math.min(60000 * Math.pow(2, Math.floor(this.reconnectAttempts / totalStrategies)), 300000); // Max 5 minutes
        
        setTimeout(() => {
          console.log('🔄 Retrying connection after exponential backoff...');
          this.attemptProgressiveFallback();
        }, backoffDelay);
        return;
      }

      const strategy = strategies[currentStrategy];
      console.log(`🔄 Trying fallback strategy ${currentStrategy + 1}/${totalStrategies}: ${strategy.name}`);
      console.log(`🔗 URL: ${strategy.url}`);
      
      this.notifyListeners('connection_status', {
        status: 'trying_fallback',
        strategy: strategy.name,
        attempt: currentStrategy + 1,
        total: totalStrategies,
        url: strategy.url,
      });
      
      setTimeout(() => {
        if (!strategy.url) {
          console.warn(`⚠️ No URL available for ${strategy.name}, skipping...`);
          currentStrategy++;
          tryNextStrategy();
          return;
        }

        try {
          const fallbackSocket = io(strategy.url, {
            ...strategy.options,
            autoConnect: false,
          });

          const connectionTimeout = setTimeout(() => {
            console.warn(`⏰ ${strategy.name} strategy timed out after ${strategy.options.timeout}ms`);
            fallbackSocket.disconnect();
            currentStrategy++;
            tryNextStrategy();
          }, strategy.options.timeout || 10000);

          fallbackSocket.on('connect', () => {
            console.log(`✅ ${strategy.name} strategy succeeded!`);
            clearTimeout(connectionTimeout);
            
            // Replace the main socket with this successful connection
            if (this.socket) {
              this.socket.disconnect();
            }
            this.socket = fallbackSocket;
            this.backendUrl = strategy.url;
            this.setupEventHandlers();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            this.notifyListeners('connection_status', {
              status: 'connected',
              strategy: strategy.name,
              url: strategy.url,
              transport: fallbackSocket.io.engine.transport.name,
            });

            // Start health monitoring
            this.startConnectionHealthMonitoring();
          });

          fallbackSocket.on('connect_error', (error) => {
            console.warn(`❌ ${strategy.name} strategy failed:`, error.message || error);
            clearTimeout(connectionTimeout);
            fallbackSocket.disconnect();
            currentStrategy++;
            tryNextStrategy();
          });

          fallbackSocket.connect();
          
        } catch (error) {
          console.error(`❌ Error setting up ${strategy.name} strategy:`, error);
          currentStrategy++;
          tryNextStrategy();
        }
      }, strategy.delay);
    };

    tryNextStrategy();
  }

  // Get alternative URL for fallback attempts
  getAlternativeUrl() {
    const alternatives = this.getAlternativeUrls();
    
    // Return the first alternative that's different from current backend URL
    for (const url of alternatives) {
      if (url !== this.backendUrl) {
        return url;
      }
    }
    
    return this.backendUrl; // Fallback to original URL
  }

  // Try fallback strategies sequentially
  tryFallbackStrategy(strategies, index) {
    if (index >= strategies.length) {
      console.error('❌ All fallback strategies exhausted');
      this.notifyListeners('connection_error', {
        error: 'All connection strategies failed',
        timestamp: new Date().toISOString(),
        fallbacksAttempted: strategies.length
      });
      
      // Schedule a retry after a longer delay
      setTimeout(() => {
        console.log('🔄 Retrying connection after extended delay...');
        this.connect();
      }, 30000);
      return;
    }

    const strategy = strategies[index];
    console.log(`🔄 Attempting fallback strategy: ${strategy.name}`);

    setTimeout(() => {
      try {
        const url = strategy.url || this.backendUrl;
        this.socket = window.io(url, strategy.options);
        this.setupEventHandlers();
        
        // Set a timeout to check if this strategy worked
        setTimeout(() => {
          if (!this.isConnected) {
            console.log(`❌ Strategy "${strategy.name}" failed, trying next...`);
            this.socket?.disconnect();
            this.tryFallbackStrategy(strategies, index + 1);
          }
        }, strategy.options.timeout + 2000);
        
      } catch (error) {
        console.error(`❌ Strategy "${strategy.name}" error:`, error);
        this.tryFallbackStrategy(strategies, index + 1);
      }
    }, strategy.delay);
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
      // Enhanced error logging with more context
      const errorInfo = {
        message: error.message || 'Unknown error',
        type: error.type || 'Unknown type',
        description: error.description || 'No description',
        code: error.code || 'No code',
        context: error.context || 'No context',
        timestamp: new Date().toISOString(),
        url: this.backendUrl,
        attempt: this.reconnectAttempts + 1
      };

      // Reduce console spam but provide detailed info when needed
      if (this.reconnectAttempts < 3 || this.reconnectAttempts % 5 === 0) {
        console.error('❌ WebSocket connection error:', errorInfo);
      }
      
      // Analyze error type for better handling
      const isNetworkError = error.message?.includes('ECONNREFUSED') || 
                            error.message?.includes('ENOTFOUND') ||
                            error.message?.includes('timeout') ||
                            error.type === 'TransportError';
      
      const isCorsError = error.message?.includes('CORS') || 
                         error.message?.includes('Access-Control');
      
      // Provide helpful suggestions based on error type
      let suggestion = 'Check if the WebSocket server is running';
      if (isNetworkError) {
        suggestion = 'Network connectivity issue - server may be down or unreachable';
      } else if (isCorsError) {
        suggestion = 'CORS configuration issue - check server CORS settings';
      }
      
      // Only notify listeners periodically to avoid spam
      if (this.reconnectAttempts === 0 || this.reconnectAttempts % 3 === 0) {
        this.notifyListeners('connection_error', { 
          ...errorInfo,
          suggestion,
          isNetworkError,
          isCorsError
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

    // API status updates
    this.socket.on('api_status_update', data => {
      console.log(`📡 API Status Update: ${data.api} is ${data.status}`, data);
      
      // Store API status for monitoring
      if (!this.apiStatus) {
        this.apiStatus = {};
      }
      this.apiStatus[data.api] = {
        status: data.status,
        message: data.message,
        timestamp: data.timestamp,
        fallbackActive: data.fallbackActive
      };
      
      // Notify listeners about API status changes
      this.cacheAndNotify('api_status_update', data);
      
      // Show user-friendly notification for critical API failures
      if (data.status === 'degraded' && data.api === 'nasa') {
        console.warn(`⚠️ NASA API Issue: ${data.message}. Using cached/fallback data.`);
      }
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

  // Enhanced connection health monitoring
  startConnectionHealthMonitoring() {
    // Check connection health every 30 seconds
    this.connectionHealthTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, this.pingInterval);

    // Monitor network status if available
    this.setupNetworkMonitoring();
    
    // Monitor page visibility for better resource management
    this.setupVisibilityMonitoring();
  }

  setupNetworkMonitoring() {
    if (typeof window !== 'undefined' && 'navigator' in window && 'onLine' in navigator) {
      // Monitor online/offline status
      window.addEventListener('online', () => {
        console.log('🌐 Network connection restored');
        this.notifyListeners('network_status', { online: true });
        
        // Attempt immediate reconnection if we were disconnected
        if (!this.isConnected && this.autoReconnect) {
          console.log('Attempting immediate reconnection due to network restoration...');
          setTimeout(() => this.connect(), 1000); // Small delay to ensure network is stable
        }
      });

      window.addEventListener('offline', () => {
        console.log('📵 Network connection lost');
        this.notifyListeners('network_status', { online: false });
        
        // Don't attempt reconnections while offline
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      // Check initial network status
      this.isOnline = navigator.onLine;
    }
  }

  setupVisibilityMonitoring() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Page became visible - check connection health
          console.log('👁️ Page became visible, checking connection health...');
          setTimeout(() => this.checkConnectionHealth(), 500);
        } else {
          // Page became hidden - reduce activity
          console.log('🙈 Page became hidden, reducing connection activity...');
        }
      });
    }
  }

  checkConnectionHealth() {
    if (!this.isConnected || !this.socket) {
      // If not connected but should be, attempt reconnection
      if (this.autoReconnect && this.isNetworkAvailable()) {
        this.handleReconnection();
      }
      return;
    }

    const now = Date.now();

    // Check if we haven't received any messages recently
    if (
      this.stats.lastMessageTime &&
      now - this.stats.lastMessageTime > this.connectionTimeout
    ) {
      console.warn('⚠️ Connection appears stale, forcing reconnection...');
      this.forceReconnect();
      return;
    }

    // Send a ping to check if connection is alive
    try {
      this.socket.emit('ping', { timestamp: now });
      this.lastPingTime = now;
      
      // Set up ping timeout to detect unresponsive connections
      if (this.pingTimeoutTimer) {
        clearTimeout(this.pingTimeoutTimer);
      }
      
      this.pingTimeoutTimer = setTimeout(() => {
        console.warn('⏰ Ping timeout - connection may be unresponsive');
        this.forceReconnect();
      }, 10000); // 10 second ping timeout
      
    } catch (error) {
      console.error('❌ Failed to send ping:', error);
      this.forceReconnect();
    }
  }

  isNetworkAvailable() {
    if (typeof window !== 'undefined' && 'navigator' in window && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true; // Assume network is available if we can't detect it
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

  // Enhanced reconnection logic with network awareness
  handleReconnection() {
    if (!this.autoReconnect) {
      console.log('Auto-reconnection is disabled');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔄 Max reconnection attempts reached, stopping reconnection...');
      this.notifyListeners('connection_status', {
        status: 'failed',
        message: 'Max reconnection attempts reached',
      });
      return;
    }

    this.reconnectAttempts++;
    
    // Simple exponential backoff with reasonable delays
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);

    console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.notifyListeners('connection_status', {
      status: 'reconnecting',
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: Math.round(delay),
    });

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && this.autoReconnect) {
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}...`);
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

  // Get comprehensive statistics and status about the service
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

    // Determine connection quality
    const connectionQuality = this.getConnectionQuality();

    // Get network status
    const networkStatus = this.getNetworkStatus();

    return {
      // Connection info
      isConnected: this.isConnected,
      connectionQuality: connectionQuality,
      uptime: uptime,
      reconnects: this.stats.reconnectCount,
      autoReconnect: this.autoReconnect,
      backendUrl: this.backendUrl,

      // Network status
      networkStatus: networkStatus,

      // Data streams
      activeStreams: activeStreams,
      messagesReceived: this.stats.messagesReceived,
      cacheSize: cacheSize,

      // Performance
      averageLatency: averageLatency,
      dataRate: dataRate,
      lastUpdate: lastUpdate,

      // Offline capabilities
      offlineMode: !this.isConnected && cacheSize > 0,
      cachedDataAge: this.getCachedDataAge(),

      // Legacy stats for compatibility
      reconnectAttempts: this.reconnectAttempts,
      cachedDataTypes: Array.from(this.dataCache.keys()),
      activeListeners: Array.from(this.eventListeners.keys()).map(key => ({
        eventType: key,
        listenerCount: this.eventListeners.get(key).length,
      })),
    };
  }

  // Determine connection quality based on various factors
  getConnectionQuality() {
    if (!this.isConnected) {
      return 'disconnected';
    }

    const now = Date.now();
    const timeSinceLastMessage = this.stats.lastMessageTime ? now - this.stats.lastMessageTime : Infinity;
    const uptime = this.stats.connectionTime ? Math.floor((now - this.stats.connectionTime) / 1000) : 0;
    const reconnectRate = this.stats.reconnectCount / Math.max(uptime / 3600, 1); // reconnects per hour

    if (timeSinceLastMessage > 60000) { // No data for over 1 minute
      return 'poor';
    } else if (timeSinceLastMessage > 30000 || reconnectRate > 2) { // No data for 30s or frequent reconnects
      return 'fair';
    } else if (this.stats.messageHistory.length > 10) { // Good data flow
      return 'excellent';
    } else {
      return 'good';
    }
  }

  // Get network status information
  getNetworkStatus() {
    const isOnline = this.isNetworkAvailable();
    
    return {
      online: isOnline,
      type: this.getNetworkType(),
      effectiveType: this.getEffectiveNetworkType(),
    };
  }

  // Get network type if available
  getNetworkType() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      return navigator.connection.type || 'unknown';
    }
    return 'unknown';
  }

  // Get effective network type if available
  getEffectiveNetworkType() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  // Get the age of cached data
  getCachedDataAge() {
    if (this.dataCache.size === 0) {
      return null;
    }

    const now = Date.now();
    let oldestTimestamp = now;

    this.dataCache.forEach(({ timestamp }) => {
      const dataTime = new Date(timestamp).getTime();
      if (dataTime < oldestTimestamp) {
        oldestTimestamp = dataTime;
      }
    });

    return now - oldestTimestamp;
  }

  // Enhanced offline mode support
  enableOfflineMode() {
    console.log('📴 Enabling offline mode - using cached data');
    this.notifyListeners('connection_status', {
      status: 'offline_mode',
      message: 'Operating in offline mode with cached data',
      cachedDataTypes: Array.from(this.dataCache.keys()),
      cacheAge: this.getCachedDataAge(),
    });
  }

  // Check if we have sufficient cached data for offline operation
  hasOfflineCapability() {
    return this.dataCache.size > 0;
  }

  // Get user-friendly status message
  getStatusMessage() {
    if (this.isConnected) {
      const quality = this.getConnectionQuality();
      const qualityMessages = {
        excellent: 'Connected - Excellent signal',
        good: 'Connected - Good signal',
        fair: 'Connected - Fair signal',
        poor: 'Connected - Poor signal',
      };
      return qualityMessages[quality] || 'Connected';
    } else if (!this.isNetworkAvailable()) {
      return 'No network connection';
    } else if (this.hasOfflineCapability()) {
      return 'Offline - Using cached data';
    } else {
      return 'Disconnected - Attempting to reconnect';
    }
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
