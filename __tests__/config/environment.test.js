/**
 * @jest-environment node
 */

const { ConfigManager, validateEnvironment } = require('../../src/config/environment.ts');

describe('Environment Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original environment variables
    originalEnv = { ...process.env };
    
    // Clear environment variables for clean testing
    delete process.env.NASA_API_KEY;
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.CACHE_TTL;
    delete process.env.RATE_LIMIT_REQUESTS;
    delete process.env.JWT_SECRET;
    delete process.env.LOG_LEVEL;
    delete process.env.ENABLE_CACHING;
    delete process.env.ENABLE_RATE_LIMITING;
    delete process.env.ENABLE_LOGGING;
    delete process.env.DEFAULT_ASTEROID_DIAMETER;
    delete process.env.DEFAULT_ASTEROID_DENSITY;
    delete process.env.DEFAULT_IMPACT_VELOCITY;
    delete process.env.DEFAULT_IMPACT_ANGLE;
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('Default Configuration', () => {
    test('should use default values when environment variables are not set', () => {
      const defaultConfig = {
        NASA_API_KEY: 'DEMO_KEY',
        NODE_ENV: 'development',
        PORT: 3001,
        HOST: 'localhost',
        CACHE_TTL: 300000,
        RATE_LIMIT_REQUESTS: 60,
        JWT_SECRET: 'your-secret-key-change-in-production',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: true,
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 50,
          asteroidDensity: 3000,
          impactVelocity: 17,
          impactAngle: 45,
        },
      };

      const configManager = new ConfigManager(defaultConfig);

      expect(configManager.get('NASA_API_KEY')).toBe('DEMO_KEY');
      expect(configManager.get('NODE_ENV')).toBe('development');
      expect(configManager.get('PORT')).toBe(3001);
      expect(configManager.get('HOST')).toBe('localhost');
      expect(configManager.get('CACHE_TTL')).toBe(300000);
      expect(configManager.get('RATE_LIMIT_REQUESTS')).toBe(60);
      expect(configManager.get('LOG_LEVEL')).toBe('info');
      expect(configManager.get('ENABLE_CACHING')).toBe(true);
      expect(configManager.get('ENABLE_RATE_LIMITING')).toBe(true);
      expect(configManager.get('ENABLE_LOGGING')).toBe(true);
    });

    test('should use environment variables when set', () => {
      process.env.NASA_API_KEY = 'test-api-key';
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.HOST = 'example.com';
      process.env.CACHE_TTL = '600000';
      process.env.RATE_LIMIT_REQUESTS = '120';
      process.env.LOG_LEVEL = 'debug';
      process.env.ENABLE_CACHING = 'false';

      const config = {
        NASA_API_KEY: process.env.NASA_API_KEY || 'DEMO_KEY',
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: parseInt(process.env.PORT || '3001', 10),
        HOST: process.env.HOST || 'localhost',
        CACHE_TTL: parseInt(process.env.CACHE_TTL || '300000', 10),
        RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || '60', 10),
        JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
        REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
        ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
        ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: parseFloat(process.env.DEFAULT_ASTEROID_DIAMETER || '50'),
          asteroidDensity: parseFloat(process.env.DEFAULT_ASTEROID_DENSITY || '3000'),
          impactVelocity: parseFloat(process.env.DEFAULT_IMPACT_VELOCITY || '17'),
          impactAngle: parseFloat(process.env.DEFAULT_IMPACT_ANGLE || '45'),
        },
      };

      const configManager = new ConfigManager(config);

      expect(configManager.get('NASA_API_KEY')).toBe('test-api-key');
      expect(configManager.get('NODE_ENV')).toBe('production');
      expect(configManager.get('PORT')).toBe(8080);
      expect(configManager.get('HOST')).toBe('example.com');
      expect(configManager.get('CACHE_TTL')).toBe(600000);
      expect(configManager.get('RATE_LIMIT_REQUESTS')).toBe(120);
      expect(configManager.get('LOG_LEVEL')).toBe('debug');
      expect(configManager.get('ENABLE_CACHING')).toBe(false);
    });
  });

  describe('Environment Validation', () => {
    test('should pass validation with valid configuration', () => {
      const validConfig = {
        NASA_API_KEY: 'valid-api-key',
        NODE_ENV: 'production',
        PORT: 3000,
        CACHE_TTL: 300000,
        RATE_LIMIT_REQUESTS: 60,
        JWT_SECRET: 'secure-secret',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        HOST: 'localhost',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: true,
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 50,
          asteroidDensity: 3000,
          impactVelocity: 17,
          impactAngle: 45,
        },
      };

      expect(() => validateEnvironment(validConfig)).not.toThrow();
    });

    test('should fail validation when NASA_API_KEY is DEMO_KEY in production', () => {
      const invalidConfig = {
        NASA_API_KEY: 'DEMO_KEY',
        NODE_ENV: 'production',
        PORT: 3000,
        CACHE_TTL: 300000,
        RATE_LIMIT_REQUESTS: 60,
        JWT_SECRET: 'secure-secret',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        HOST: 'localhost',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: true,
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 50,
          asteroidDensity: 3000,
          impactVelocity: 17,
          impactAngle: 45,
        },
      };

      expect(() => validateEnvironment(invalidConfig)).toThrow(
        'NASA_API_KEY must be set in production environment'
      );
    });

    test('should fail validation with invalid port number', () => {
      const invalidConfig = {
        NASA_API_KEY: 'valid-api-key',
        NODE_ENV: 'production',
        PORT: 70000, // Invalid port
        CACHE_TTL: 300000,
        RATE_LIMIT_REQUESTS: 60,
        JWT_SECRET: 'secure-secret',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        HOST: 'localhost',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: true,
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 50,
          asteroidDensity: 3000,
          impactVelocity: 17,
          impactAngle: 45,
        },
      };

      expect(() => validateEnvironment(invalidConfig)).toThrow(
        'PORT must be between 1 and 65535'
      );
    });

    test('should fail validation with negative cache TTL', () => {
      const invalidConfig = {
        NASA_API_KEY: 'valid-api-key',
        NODE_ENV: 'production',
        PORT: 3000,
        CACHE_TTL: -1000, // Invalid TTL
        RATE_LIMIT_REQUESTS: 60,
        JWT_SECRET: 'secure-secret',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        HOST: 'localhost',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: true,
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 50,
          asteroidDensity: 3000,
          impactVelocity: 17,
          impactAngle: 45,
        },
      };

      expect(() => validateEnvironment(invalidConfig)).toThrow(
        'CACHE_TTL must be a positive number'
      );
    });

    test('should fail validation with invalid rate limit', () => {
      const invalidConfig = {
        NASA_API_KEY: 'valid-api-key',
        NODE_ENV: 'production',
        PORT: 3000,
        CACHE_TTL: 300000,
        RATE_LIMIT_REQUESTS: 0, // Invalid rate limit
        JWT_SECRET: 'secure-secret',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        HOST: 'localhost',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: true,
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 50,
          asteroidDensity: 3000,
          impactVelocity: 17,
          impactAngle: 45,
        },
      };

      expect(() => validateEnvironment(invalidConfig)).toThrow(
        'RATE_LIMIT_REQUESTS must be at least 1'
      );
    });
  });

  describe('ConfigManager', () => {
    let configManager;
    let testConfig;

    beforeEach(() => {
      testConfig = {
        NASA_API_KEY: 'test-api-key',
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: 'localhost',
        CACHE_TTL: 300000,
        RATE_LIMIT_REQUESTS: 60,
        JWT_SECRET: 'test-secret',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: false,
        SENTRY_DSN: 'https://test-sentry-dsn.com',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        REDIS_URL: 'redis://localhost:6379',
        USGS_API_KEY: 'test-usgs-key',
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 100,
          asteroidDensity: 2500,
          impactVelocity: 20,
          impactAngle: 30,
        },
      };

      configManager = new ConfigManager(testConfig);
    });

    test('should get configuration values', () => {
      expect(configManager.get('NASA_API_KEY')).toBe('test-api-key');
      expect(configManager.get('PORT')).toBe(3000);
      expect(configManager.get('ENABLE_CACHING')).toBe(true);
    });

    test('should check if feature is enabled', () => {
      expect(configManager.isFeatureEnabled('ENABLE_CACHING')).toBe(true);
      expect(configManager.isFeatureEnabled('ENABLE_LOGGING')).toBe(false);
      expect(configManager.isFeatureEnabled('NASA_API_KEY')).toBe(false); // Non-boolean value
    });

    test('should get API configuration', () => {
      const apiConfig = configManager.getAPIConfig();

      expect(apiConfig.nasa.apiKey).toBe('test-api-key');
      expect(apiConfig.nasa.baseURL).toBe('https://api.nasa.gov/neo/rest/v1');
      expect(apiConfig.nasa.donkiURL).toBe('https://api.nasa.gov/DONKI');
      expect(apiConfig.nasa.eonetURL).toBe('https://eonet.gsfc.nasa.gov/api/v2.1');
      expect(apiConfig.usgs.apiKey).toBe('test-usgs-key');
      expect(apiConfig.usgs.earthquakeURL).toBe('https://earthquake.usgs.gov/fdsnws/event/1/query');
    });

    test('should get cache configuration', () => {
      const cacheConfig = configManager.getCacheConfig();

      expect(cacheConfig.enabled).toBe(true);
      expect(cacheConfig.ttl).toBe(300000);
      expect(cacheConfig.redisUrl).toBe('redis://localhost:6379');
    });

    test('should get rate limit configuration', () => {
      const rateLimitConfig = configManager.getRateLimitConfig();

      expect(rateLimitConfig.enabled).toBe(true);
      expect(rateLimitConfig.requestsPerMinute).toBe(60);
    });

    test('should get logging configuration', () => {
      const loggingConfig = configManager.getLoggingConfig();

      expect(loggingConfig.enabled).toBe(false);
      expect(loggingConfig.level).toBe('info');
      expect(loggingConfig.sentryDsn).toBe('https://test-sentry-dsn.com');
    });

    test('should get simulation defaults', () => {
      const simulationDefaults = configManager.getSimulationDefaults();

      expect(simulationDefaults.asteroidDiameter).toBe(100);
      expect(simulationDefaults.asteroidDensity).toBe(2500);
      expect(simulationDefaults.impactVelocity).toBe(20);
      expect(simulationDefaults.impactAngle).toBe(30);
    });

    test('should check environment type correctly', () => {
      expect(configManager.isDev()).toBe(true);
      expect(configManager.isProd()).toBe(false);
      expect(configManager.isTest()).toBe(false);
    });

    test('should handle production environment', () => {
      const prodConfig = { ...testConfig, NODE_ENV: 'production' };
      const prodConfigManager = new ConfigManager(prodConfig);

      expect(prodConfigManager.isProd()).toBe(true);
      expect(prodConfigManager.isDev()).toBe(false);
      expect(prodConfigManager.isTest()).toBe(false);
    });

    test('should handle test environment', () => {
      const testEnvConfig = { ...testConfig, NODE_ENV: 'test' };
      const testConfigManager = new ConfigManager(testEnvConfig);

      expect(testConfigManager.isTest()).toBe(true);
      expect(testConfigManager.isDev()).toBe(false);
      expect(testConfigManager.isProd()).toBe(false);
    });

    test('should validate production configuration on creation', () => {
      const invalidProdConfig = {
        ...testConfig,
        NODE_ENV: 'production',
        NASA_API_KEY: 'DEMO_KEY', // Invalid for production
      };

      expect(() => new ConfigManager(invalidProdConfig)).toThrow(
        'NASA_API_KEY must be set in production environment'
      );
    });

    test('should not validate non-production configuration', () => {
      const devConfigWithDemoKey = {
        ...testConfig,
        NODE_ENV: 'development',
        NASA_API_KEY: 'DEMO_KEY', // Valid for development
      };

      expect(() => new ConfigManager(devConfigWithDemoKey)).not.toThrow();
    });
  });

  describe('Type Parsing', () => {
    test('should parse integer values correctly', () => {
      process.env.PORT = '8080';
      process.env.CACHE_TTL = '600000';
      process.env.RATE_LIMIT_REQUESTS = '120';

      const config = {
        PORT: parseInt(process.env.PORT || '3001', 10),
        CACHE_TTL: parseInt(process.env.CACHE_TTL || '300000', 10),
        RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || '60', 10),
      };

      expect(config.PORT).toBe(8080);
      expect(config.CACHE_TTL).toBe(600000);
      expect(config.RATE_LIMIT_REQUESTS).toBe(120);
    });

    test('should parse float values correctly', () => {
      process.env.DEFAULT_ASTEROID_DIAMETER = '75.5';
      process.env.DEFAULT_ASTEROID_DENSITY = '2750.25';
      process.env.DEFAULT_IMPACT_VELOCITY = '19.8';
      process.env.DEFAULT_IMPACT_ANGLE = '37.5';

      const simulationParams = {
        asteroidDiameter: parseFloat(process.env.DEFAULT_ASTEROID_DIAMETER || '50'),
        asteroidDensity: parseFloat(process.env.DEFAULT_ASTEROID_DENSITY || '3000'),
        impactVelocity: parseFloat(process.env.DEFAULT_IMPACT_VELOCITY || '17'),
        impactAngle: parseFloat(process.env.DEFAULT_IMPACT_ANGLE || '45'),
      };

      expect(simulationParams.asteroidDiameter).toBe(75.5);
      expect(simulationParams.asteroidDensity).toBe(2750.25);
      expect(simulationParams.impactVelocity).toBe(19.8);
      expect(simulationParams.impactAngle).toBe(37.5);
    });

    test('should parse boolean values correctly', () => {
      process.env.ENABLE_CACHING = 'false';
      process.env.ENABLE_RATE_LIMITING = 'true';
      process.env.ENABLE_LOGGING = 'false';

      const booleanConfig = {
        ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
        ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
        ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
      };

      expect(booleanConfig.ENABLE_CACHING).toBe(false);
      expect(booleanConfig.ENABLE_RATE_LIMITING).toBe(true);
      expect(booleanConfig.ENABLE_LOGGING).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing optional environment variables', () => {
      const config = {
        DATABASE_URL: process.env.DATABASE_URL,
        SENTRY_DSN: process.env.SENTRY_DSN,
        USGS_API_KEY: process.env.USGS_API_KEY || '',
      };

      expect(config.DATABASE_URL).toBeUndefined();
      expect(config.SENTRY_DSN).toBeUndefined();
      expect(config.USGS_API_KEY).toBe('');
    });

    test('should handle invalid numeric environment variables', () => {
      process.env.PORT = 'invalid-port';
      process.env.CACHE_TTL = 'not-a-number';

      const config = {
        PORT: parseInt(process.env.PORT || '3001', 10),
        CACHE_TTL: parseInt(process.env.CACHE_TTL || '300000', 10),
      };

      expect(isNaN(config.PORT)).toBe(true);
      expect(isNaN(config.CACHE_TTL)).toBe(true);
    });

    test('should handle multiple validation errors', () => {
      const invalidConfig = {
        NASA_API_KEY: 'DEMO_KEY',
        NODE_ENV: 'production',
        PORT: -1, // Invalid port
        CACHE_TTL: -1000, // Invalid TTL
        RATE_LIMIT_REQUESTS: 0, // Invalid rate limit
        JWT_SECRET: 'test-secret',
        ACCESS_TOKEN_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        HOST: 'localhost',
        LOG_LEVEL: 'info',
        ENABLE_CACHING: true,
        ENABLE_RATE_LIMITING: true,
        ENABLE_LOGGING: true,
        DEFAULT_SIMULATION_PARAMS: {
          asteroidDiameter: 50,
          asteroidDensity: 3000,
          impactVelocity: 17,
          impactAngle: 45,
        },
      };

      expect(() => validateEnvironment(invalidConfig)).toThrow();
    });
  });
});