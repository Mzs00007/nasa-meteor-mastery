import WebSocketService from '../../src/services/websocket-service';

// Mock WebSocket for testing
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;

    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen();
      }
    }, 10);
  }

  send(data) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Store sent data for testing
    this.lastSentData = data;
  }

  close(code, reason) {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason });
    }
  }

  // Simulate receiving a message
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Simulate an error
  simulateError(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

// Mock WebSocket constants
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket;

describe('WebSocket Service Integration Tests', () => {
  let wsService;
  let mockWebSocket;

  beforeEach(() => {
    wsService = new WebSocketService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wsService.isConnected()) {
      wsService.disconnect();
    }
  });

  describe('Connection Management', () => {
    test('should connect to WebSocket server successfully', async () => {
      const connectPromise = wsService.connect('ws://localhost:8080');

      await expect(connectPromise).resolves.toBeUndefined();
      expect(wsService.isConnected()).toBe(true);
    });

    test('should handle connection with custom URL', async () => {
      const customUrl = 'ws://custom-server:9090';
      await wsService.connect(customUrl);

      expect(wsService.ws.url).toBe(customUrl);
      expect(wsService.isConnected()).toBe(true);
    });

    test('should disconnect from WebSocket server', async () => {
      await wsService.connect();

      wsService.disconnect();

      expect(wsService.isConnected()).toBe(false);
    });

    test('should handle multiple connection attempts', async () => {
      await wsService.connect();

      // Second connection attempt should not create new WebSocket
      await wsService.connect();

      expect(wsService.isConnected()).toBe(true);
    });

    test('should handle connection errors', async () => {
      const originalWebSocket = global.WebSocket;

      // Mock WebSocket that fails to connect
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          setTimeout(() => {
            this.readyState = WebSocket.CLOSED;
            if (this.onerror) {
              this.onerror(new Error('Connection failed'));
            }
          }, 10);
        }
      };

      await expect(wsService.connect()).rejects.toThrow('Connection failed');

      global.WebSocket = originalWebSocket;
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await wsService.connect();
      mockWebSocket = wsService.ws;
    });

    test('should send messages successfully', () => {
      const testMessage = { type: 'test', data: 'hello' };

      wsService.send(testMessage);

      expect(mockWebSocket.lastSentData).toBe(JSON.stringify(testMessage));
    });

    test('should handle sending when not connected', () => {
      wsService.disconnect();

      expect(() => {
        wsService.send({ type: 'test' });
      }).toThrow('WebSocket is not connected');
    });

    test('should receive and parse messages', done => {
      const testData = {
        type: 'asteroid_update',
        data: { id: '123', position: [1, 2, 3] },
      };

      wsService.on('asteroid_update', data => {
        expect(data).toEqual(testData.data);
        done();
      });

      mockWebSocket.simulateMessage(testData);
    });

    test('should handle malformed JSON messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate receiving malformed JSON
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: 'invalid json' });
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing WebSocket message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await wsService.connect();
    });

    test('should register and trigger event listeners', done => {
      const testData = { message: 'test event' };

      wsService.on('custom_event', data => {
        expect(data).toEqual(testData);
        done();
      });

      wsService.ws.simulateMessage({ type: 'custom_event', data: testData });
    });

    test('should handle multiple listeners for same event', () => {
      let callCount = 0;

      wsService.on('multi_event', () => callCount++);
      wsService.on('multi_event', () => callCount++);

      wsService.ws.simulateMessage({ type: 'multi_event', data: {} });

      expect(callCount).toBe(2);
    });

    test('should remove event listeners', () => {
      let callCount = 0;
      const listener = () => callCount++;

      wsService.on('remove_test', listener);
      wsService.off('remove_test', listener);

      wsService.ws.simulateMessage({ type: 'remove_test', data: {} });

      expect(callCount).toBe(0);
    });

    test('should remove all listeners for an event', () => {
      let callCount = 0;

      wsService.on('remove_all_test', () => callCount++);
      wsService.on('remove_all_test', () => callCount++);
      wsService.off('remove_all_test');

      wsService.ws.simulateMessage({ type: 'remove_all_test', data: {} });

      expect(callCount).toBe(0);
    });
  });

  describe('Reconnection Logic', () => {
    test('should attempt reconnection on connection loss', async () => {
      await wsService.connect();

      // Enable auto-reconnect
      wsService.enableAutoReconnect(true, 100); // 100ms interval for testing

      // Simulate connection loss
      wsService.ws.close(1006, 'Connection lost');

      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(wsService.reconnectAttempts).toBeGreaterThan(0);
    });

    test('should respect maximum reconnection attempts', async () => {
      await wsService.connect();

      // Set low max attempts for testing
      wsService.maxReconnectAttempts = 2;
      wsService.enableAutoReconnect(true, 50);

      // Mock WebSocket to always fail
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          setTimeout(() => {
            this.readyState = WebSocket.CLOSED;
            if (this.onerror) {
              this.onerror(new Error('Connection failed'));
            }
          }, 10);
        }
      };

      // Simulate connection loss
      wsService.ws.close(1006, 'Connection lost');

      // Wait for all reconnection attempts
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(wsService.reconnectAttempts).toBe(2);

      global.WebSocket = originalWebSocket;
    });

    test('should disable auto-reconnect', async () => {
      await wsService.connect();

      wsService.enableAutoReconnect(false);

      // Simulate connection loss
      wsService.ws.close(1006, 'Connection lost');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(wsService.reconnectAttempts).toBe(0);
    });
  });

  describe('Data Subscriptions', () => {
    beforeEach(async () => {
      await wsService.connect();
    });

    test('should subscribe to asteroid data', () => {
      wsService.subscribeToAsteroidData();

      expect(wsService.ws.lastSentData).toBe(
        JSON.stringify({ type: 'subscribe', channel: 'asteroid_data' })
      );
    });

    test('should subscribe to space weather data', () => {
      wsService.subscribeToSpaceWeather();

      expect(wsService.ws.lastSentData).toBe(
        JSON.stringify({ type: 'subscribe', channel: 'space_weather' })
      );
    });

    test('should subscribe to earthquake data', () => {
      wsService.subscribeToEarthquakeData();

      expect(wsService.ws.lastSentData).toBe(
        JSON.stringify({ type: 'subscribe', channel: 'earthquake_data' })
      );
    });

    test('should unsubscribe from channels', () => {
      wsService.unsubscribe('asteroid_data');

      expect(wsService.ws.lastSentData).toBe(
        JSON.stringify({ type: 'unsubscribe', channel: 'asteroid_data' })
      );
    });

    test('should handle subscription confirmations', done => {
      wsService.on('subscription_confirmed', data => {
        expect(data.channel).toBe('asteroid_data');
        done();
      });

      wsService.ws.simulateMessage({
        type: 'subscription_confirmed',
        data: { channel: 'asteroid_data' },
      });
    });
  });

  describe('Real-time Data Processing', () => {
    beforeEach(async () => {
      await wsService.connect();
    });

    test('should process asteroid position updates', done => {
      const asteroidData = {
        id: 'asteroid_123',
        position: { x: 100, y: 200, z: 300 },
        velocity: { x: 10, y: 20, z: 30 },
        timestamp: Date.now(),
      };

      wsService.on('asteroid_position_update', data => {
        expect(data).toEqual(asteroidData);
        done();
      });

      wsService.ws.simulateMessage({
        type: 'asteroid_position_update',
        data: asteroidData,
      });
    });

    test('should process space weather alerts', done => {
      const weatherData = {
        type: 'solar_flare',
        intensity: 'X1.2',
        timestamp: Date.now(),
        description: 'Strong solar flare detected',
      };

      wsService.on('space_weather_alert', data => {
        expect(data).toEqual(weatherData);
        done();
      });

      wsService.ws.simulateMessage({
        type: 'space_weather_alert',
        data: weatherData,
      });
    });

    test('should process earthquake notifications', done => {
      const earthquakeData = {
        id: 'eq_456',
        magnitude: 5.2,
        location: 'California',
        depth: 10.5,
        timestamp: Date.now(),
      };

      wsService.on('earthquake_notification', data => {
        expect(data).toEqual(earthquakeData);
        done();
      });

      wsService.ws.simulateMessage({
        type: 'earthquake_notification',
        data: earthquakeData,
      });
    });
  });

  describe('Connection State Management', () => {
    test('should track connection state correctly', async () => {
      expect(wsService.getConnectionState()).toBe('disconnected');

      const connectPromise = wsService.connect();
      expect(wsService.getConnectionState()).toBe('connecting');

      await connectPromise;
      expect(wsService.getConnectionState()).toBe('connected');

      wsService.disconnect();
      expect(wsService.getConnectionState()).toBe('disconnected');
    });

    test('should provide connection statistics', async () => {
      await wsService.connect();

      // Send some messages
      wsService.send({ type: 'test1' });
      wsService.send({ type: 'test2' });

      // Receive some messages
      wsService.ws.simulateMessage({ type: 'response1', data: {} });
      wsService.ws.simulateMessage({ type: 'response2', data: {} });

      const stats = wsService.getConnectionStats();

      expect(stats.messagesSent).toBe(2);
      expect(stats.messagesReceived).toBe(2);
      expect(stats.connectionTime).toBeGreaterThan(0);
      expect(stats.reconnectAttempts).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket errors gracefully', async () => {
      await wsService.connect();

      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate WebSocket error
      wsService.ws.simulateError(new Error('WebSocket error'));

      expect(errorSpy).toHaveBeenCalledWith(
        'WebSocket error:',
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });

    test('should emit error events', done => {
      wsService.connect().then(() => {
        wsService.on('error', error => {
          expect(error.message).toBe('Test error');
          done();
        });

        wsService.ws.simulateError(new Error('Test error'));
      });
    });

    test('should handle connection timeout', async () => {
      const originalWebSocket = global.WebSocket;

      // Mock WebSocket that never connects
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url);
          // Never change readyState to OPEN
        }
      };

      // Set short timeout for testing
      wsService.connectionTimeout = 100;

      await expect(wsService.connect()).rejects.toThrow('Connection timeout');

      global.WebSocket = originalWebSocket;
    });
  });

  describe('Message Queue', () => {
    test('should queue messages when disconnected', () => {
      const message = { type: 'queued_test', data: 'test' };

      // Send message while disconnected
      wsService.send(message);

      expect(wsService.messageQueue).toContain(JSON.stringify(message));
    });

    test('should send queued messages on reconnection', async () => {
      const message1 = { type: 'queued1', data: 'test1' };
      const message2 = { type: 'queued2', data: 'test2' };

      // Queue messages while disconnected
      wsService.send(message1);
      wsService.send(message2);

      // Connect and check if messages are sent
      await wsService.connect();

      expect(wsService.messageQueue).toHaveLength(0);
    });
  });

  describe('Heartbeat Mechanism', () => {
    test('should send heartbeat messages', async () => {
      await wsService.connect();

      // Enable heartbeat with short interval for testing
      wsService.enableHeartbeat(100);

      // Wait for heartbeat
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(wsService.ws.lastSentData).toBe(
        JSON.stringify({ type: 'heartbeat', timestamp: expect.any(Number) })
      );
    });

    test('should handle heartbeat responses', done => {
      wsService.connect().then(() => {
        wsService.on('heartbeat_response', data => {
          expect(data.timestamp).toBeDefined();
          done();
        });

        wsService.ws.simulateMessage({
          type: 'heartbeat_response',
          data: { timestamp: Date.now() },
        });
      });
    });
  });
});
