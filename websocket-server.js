/**
 * Node.js WebSocket Server for NASA Meteor Mastery
 * Provides real-time data streaming for mission control operations
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// NASA API configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const NASA_BASE_URL = 'https://api.nasa.gov';

// Data cache and streaming intervals
const dataCache = new Map();
const streamingIntervals = new Map();

// Utility function to generate realistic data
function generateRealisticData(type) {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'iss_position':
      return {
        timestamp,
        latitude: (Math.random() - 0.5) * 180,
        longitude: (Math.random() - 0.5) * 360,
        altitude: 408 + Math.random() * 10,
        velocity: 27600 + Math.random() * 100,
        orbital_period: 92.68,
        crew_count: 7,
        status: 'operational'
      };

    case 'mission_control_telemetry':
      return {
        timestamp,
        spacecraft: {
          systems: {
            power: {
              battery_level: 85 + Math.random() * 15,
              solar_panel_efficiency: 92 + Math.random() * 8,
              power_consumption: 1200 + Math.random() * 200
            },
            thermal: {
              internal_temp: 20 + Math.random() * 5,
              external_temp: -150 + Math.random() * 300,
              cooling_system_status: 'NOMINAL'
            },
            navigation: {
              gps_lock: true,
              position_accuracy: Math.random() * 5,
              velocity_accuracy: Math.random() * 0.1
            },
            communication: {
              signal_strength: -85 + Math.random() * 10,
              data_rate: 2048 + Math.random() * 200,
              uplink_status: 'NOMINAL',
              downlink_status: 'NOMINAL'
            }
          }
        },
        ground_station: {
          antenna_elevation: 45 + Math.random() * 10,
          antenna_azimuth: 180 + Math.random() * 20,
          weather_conditions: 'CLEAR',
          operator_status: 'ON_DUTY'
        }
      };

    case 'orbital_mechanics':
      return {
        timestamp,
        objects: Array.from({ length: 5 }, (_, i) => ({
          id: `asteroid_${i + 1}`,
          name: `2024 AA${i + 1}`,
          semi_major_axis: 1.2 + Math.random() * 2,
          eccentricity: Math.random() * 0.5,
          inclination: Math.random() * 30,
          longitude_ascending_node: Math.random() * 360,
          argument_periapsis: Math.random() * 360,
          mean_anomaly: Math.random() * 360,
          orbital_period: 365 + Math.random() * 1000,
          position: {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
            z: (Math.random() - 0.5) * 0.5
          },
          velocity: {
            x: (Math.random() - 0.5) * 0.1,
            y: (Math.random() - 0.5) * 0.1,
            z: (Math.random() - 0.5) * 0.01
          }
        }))
      };

    case 'space_weather':
      return {
        timestamp,
        solar_wind: {
          speed: 400 + Math.random() * 200,
          density: 5 + Math.random() * 10,
          temperature: 100000 + Math.random() * 50000
        },
        geomagnetic: {
          kp_index: Math.random() * 9,
          dst_index: -50 + Math.random() * 100,
          activity_level: Math.random() > 0.7 ? 'HIGH' : 'MODERATE'
        },
        solar_activity: {
          sunspot_number: Math.floor(Math.random() * 200),
          solar_flux: 70 + Math.random() * 200,
          flare_activity: Math.random() > 0.9 ? 'X-CLASS' : 'QUIET'
        }
      };

    case 'real_time_events':
      const events = [];
      if (Math.random() > 0.7) {
        events.push({
          id: `event_${Date.now()}`,
          type: Math.random() > 0.5 ? 'SOLAR_FLARE' : 'SATELLITE_ANOMALY',
          severity: Math.random() > 0.8 ? 'HIGH' : 'MEDIUM',
          description: 'Automated event detection',
          timestamp,
          duration_estimate: Math.floor(Math.random() * 120),
          affected_systems: ['GPS', 'COMMUNICATION']
        });
      }
      return { events };

    default:
      return { timestamp, data: 'No specific data available' };
  }
}

// Fetch real NASA data when possible
async function fetchNASAData(endpoint) {
  try {
    const response = await axios.get(`${NASA_BASE_URL}${endpoint}`, {
      params: { api_key: NASA_API_KEY },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch NASA data from ${endpoint}:`, error.message);
    return null;
  }
}

// Enhanced ISS position with real data
async function getISSPosition() {
  try {
    const response = await axios.get('http://api.open-notify.org/iss-now.json', { timeout: 5000 });
    if (response.data && response.data.iss_position) {
      return {
        timestamp: new Date().toISOString(),
        latitude: parseFloat(response.data.iss_position.latitude),
        longitude: parseFloat(response.data.iss_position.longitude),
        altitude: 408,
        velocity: 27600,
        orbital_period: 92.68,
        crew_count: 7,
        status: 'operational'
      };
    }
  } catch (error) {
    console.warn('Failed to fetch real ISS data, using simulated data');
  }
  return generateRealisticData('iss_position');
}

// Start data streaming for a specific type
function startDataStream(streamType, interval = 5000) {
  if (streamingIntervals.has(streamType)) {
    clearInterval(streamingIntervals.get(streamType));
  }

  const intervalId = setInterval(async () => {
    try {
      let data;
      
      switch (streamType) {
        case 'iss_position':
          data = await getISSPosition();
          break;
        default:
          data = generateRealisticData(streamType);
      }

      // Cache the data with timestamp and cleanup old entries
      dataCache.set(streamType, {
        data,
        timestamp: Date.now()
      });
      
      // Clean up old cache entries (keep only last 100 entries per stream)
      cleanupDataCache();
      
      // Emit to all connected clients in mission_control room
      const clientsInRoom = io.sockets.adapter.rooms.get('mission_control');
      const clientCount = clientsInRoom ? clientsInRoom.size : 0;
      
      if (clientCount > 0) {
        io.to('mission_control').emit(streamType, data);
        console.log(`Streamed ${streamType} data to ${clientCount} clients`);
      }
    } catch (error) {
      console.error(`Error streaming ${streamType} data:`, error.message);
      // Continue streaming even if one iteration fails
    }
  }, interval);

  streamingIntervals.set(streamType, intervalId);
  console.log(`Started ${streamType} stream with ${interval}ms interval`);
}

// Clean up old cache entries to prevent memory leaks
function cleanupDataCache() {
  const maxCacheSize = 100;
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, value] of dataCache.entries()) {
    // Remove entries older than 5 minutes
    if (value.timestamp && (now - value.timestamp) > maxAge) {
      dataCache.delete(key);
    }
  }
  
  // If cache is still too large, remove oldest entries
  if (dataCache.size > maxCacheSize) {
    const entries = Array.from(dataCache.entries());
    entries.sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
    
    const toRemove = entries.slice(0, dataCache.size - maxCacheSize);
    toRemove.forEach(([key]) => dataCache.delete(key));
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} from ${socket.handshake.address}`);
  
  // Track connection time for this socket
  socket.connectedAt = Date.now();
  socket.lastPing = Date.now();
  
  // Send connection confirmation
  socket.emit('connection_status', { 
    status: 'connected', 
    timestamp: new Date().toISOString(),
    serverId: socket.id
  });

  // Handle ping/pong for connection health monitoring
  socket.on('ping', (data) => {
    socket.lastPing = Date.now();
    socket.emit('pong', { 
      timestamp: Date.now(),
      clientTimestamp: data?.timestamp 
    });
  });

  // Handle joining mission control room
  socket.on('join_mission_control', () => {
    try {
      socket.join('mission_control');
      console.log(`Client ${socket.id} joined mission control room`);
      
      // Send cached data to new client
      for (const [dataType, cachedEntry] of dataCache.entries()) {
        // Send the actual data, not the wrapper object
        const dataToSend = cachedEntry.data || cachedEntry;
        socket.emit(dataType, dataToSend);
      }
      
      socket.emit('room_status', { room: 'mission_control', status: 'joined' });
    } catch (error) {
      console.error(`Error joining mission control for ${socket.id}:`, error.message);
      socket.emit('error', { message: 'Failed to join mission control room' });
    }
  });

  // Handle leaving mission control room
  socket.on('leave_mission_control', () => {
    try {
      socket.leave('mission_control');
      console.log(`Client ${socket.id} left mission control room`);
      socket.emit('room_status', { room: 'mission_control', status: 'left' });
    } catch (error) {
      console.error(`Error leaving mission control for ${socket.id}:`, error.message);
    }
  });

  // Handle data requests
  socket.on('request_data_update', (data) => {
    try {
      const dataType = data?.type || 'all';
      if (dataType === 'all') {
        const allData = {};
        for (const [key, cachedEntry] of dataCache.entries()) {
          allData[key] = cachedEntry.data || cachedEntry;
        }
        socket.emit('bulk_data_update', allData);
      } else if (dataCache.has(dataType)) {
        const cachedEntry = dataCache.get(dataType);
        const dataToSend = cachedEntry.data || cachedEntry;
        socket.emit(dataType, dataToSend);
      }
    } catch (error) {
      console.error(`Error handling data request from ${socket.id}:`, error.message);
      socket.emit('error', { message: 'Failed to process data request' });
    }
  });

  // Handle stream interval updates
  socket.on('update_stream_interval', (data) => {
    try {
      const { stream_type, interval } = data;
      if (stream_type && interval && interval >= 1000 && interval <= 60000) {
        console.log(`Updating ${stream_type} interval to ${interval}ms for client ${socket.id}`);
        startDataStream(stream_type, interval);
      } else {
        socket.emit('error', { message: 'Invalid stream interval (must be between 1000-60000ms)' });
      }
    } catch (error) {
      console.error(`Error updating stream interval for ${socket.id}:`, error.message);
      socket.emit('error', { message: 'Failed to update stream interval' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const connectionDuration = Date.now() - socket.connectedAt;
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}, duration: ${Math.round(connectionDuration/1000)}s`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error.message);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeStreams: Array.from(streamingIntervals.keys()),
    connectedClients: io.engine.clientsCount
  });
});

// Start the server
const PORT = process.env.WEBSOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 NASA WebSocket Server running on port ${PORT}`);
  console.log(`🌐 Frontend should connect to: http://localhost:${PORT}`);
  
  // Connection monitoring and cleanup
  setInterval(() => {
    const now = Date.now();
    const connectedSockets = io.sockets.sockets;
    let activeConnections = 0;
    let staleConnections = 0;
    
    connectedSockets.forEach((socket) => {
      if (socket.lastPing && (now - socket.lastPing) > 60000) { // 60 seconds without ping
        console.log(`Detected stale connection: ${socket.id}, last ping: ${Math.round((now - socket.lastPing)/1000)}s ago`);
        socket.disconnect(true);
        staleConnections++;
      } else {
        activeConnections++;
      }
    });
    
    if (staleConnections > 0) {
      console.log(`Cleaned up ${staleConnections} stale connections. Active connections: ${activeConnections}`);
    }
  }, 30000); // Check every 30 seconds

  // Memory usage monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    console.log(`Memory usage: RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB, External: ${memUsageMB.external}MB`);
    
    // Clean up cache if memory usage is high
    if (memUsageMB.heapUsed > 100) { // If heap usage > 100MB
      console.log('High memory usage detected, cleaning up data cache...');
      cleanupDataCache();
    }
  }, 60000); // Check every minute

  // Start all data streams
  const streams = [
    { type: 'iss_position', interval: 5000 },
    { type: 'mission_control_telemetry', interval: 3000 },
    { type: 'orbital_mechanics', interval: 8000 },
    { type: 'space_weather', interval: 10000 },
    { type: 'real_time_events', interval: 15000 }
  ];

  streams.forEach(({ type, interval }) => {
    startDataStream(type, interval);
  });

  console.log('✅ All data streams started successfully');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  
  // Clear all intervals
  for (const intervalId of streamingIntervals.values()) {
    clearInterval(intervalId);
  }
  
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});