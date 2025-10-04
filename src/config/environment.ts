// Environment Configuration with TypeScript support and comprehensive API settings

interface EnvironmentConfig {
  // API Configuration
  NASA_API_KEY: string;
  USGS_API_KEY?: string;

  // Server Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;

  // Database Configuration
  DATABASE_URL?: string;
  REDIS_URL?: string;

  // Cache Configuration
  CACHE_TTL: number;
  RATE_LIMIT_REQUESTS: number;

  // Security Configuration
  JWT_SECRET: string;
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY: string;

  // External Services
  SENTRY_DSN?: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // Feature Flags
  ENABLE_CACHING: boolean;
  ENABLE_RATE_LIMITING: boolean;
  ENABLE_LOGGING: boolean;

  // Simulation Defaults
  DEFAULT_SIMULATION_PARAMS: {
    asteroidDiameter: number;
    asteroidDensity: number;
    impactVelocity: number;
    impactAngle: number;
  };
}

// Default environment configuration
const defaultConfig: EnvironmentConfig = {
  // API Configuration
  NASA_API_KEY: process.env.NASA_API_KEY || 'DEMO_KEY',
  USGS_API_KEY: process.env.USGS_API_KEY || '',

  // Server Configuration
  NODE_ENV:
    (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || 'localhost',

  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Cache Configuration
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300000', 10), // 5 minutes
  RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || '60', 10), // requests per minute

  // Security Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',

  // External Services
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_LEVEL:
    (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',

  // Feature Flags
  ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',

  // Simulation Defaults
  DEFAULT_SIMULATION_PARAMS: {
    asteroidDiameter: parseFloat(process.env.DEFAULT_ASTEROID_DIAMETER || '50'),
    asteroidDensity: parseFloat(process.env.DEFAULT_ASTEROID_DENSITY || '3000'),
    impactVelocity: parseFloat(process.env.DEFAULT_IMPACT_VELOCITY || '17'),
    impactAngle: parseFloat(process.env.DEFAULT_IMPACT_ANGLE || '45'),
  },
};

// Environment validation
function validateEnvironment(config: EnvironmentConfig): void {
  const errors: string[] = [];

  // Validate NASA API key in production
  if (config.NODE_ENV === 'production' && config.NASA_API_KEY === 'DEMO_KEY') {
    errors.push('NASA_API_KEY must be set in production environment');
  }

  // Validate port number
  if (config.PORT < 1 || config.PORT > 65535) {
    errors.push(`PORT must be between 1 and 65535, got ${config.PORT}`);
  }

  // Validate cache TTL
  if (config.CACHE_TTL < 0) {
    errors.push('CACHE_TTL must be a positive number');
  }

  // Validate rate limit
  if (config.RATE_LIMIT_REQUESTS < 1) {
    errors.push('RATE_LIMIT_REQUESTS must be at least 1');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

// Configuration utilities
class ConfigManager {
  private config: EnvironmentConfig;
  private isProduction: boolean;

  constructor(config: EnvironmentConfig) {
    this.config = config;
    this.isProduction = config.NODE_ENV === 'production';

    if (this.isProduction) {
      validateEnvironment(config);
    }
  }

  // Get configuration value
  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  // Check if feature is enabled
  isFeatureEnabled(feature: keyof EnvironmentConfig): boolean {
    const value = this.config[feature];
    return typeof value === 'boolean' ? value : false;
  }

  // Get API configuration
  getAPIConfig() {
    return {
      nasa: {
        apiKey: this.config.NASA_API_KEY,
        baseURL: 'https://api.nasa.gov/neo/rest/v1',
        donkiURL: 'https://api.nasa.gov/DONKI',
        eonetURL: 'https://eonet.gsfc.nasa.gov/api/v2.1',
      },
      usgs: {
        apiKey: this.config.USGS_API_KEY,
        earthquakeURL: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
        elevationURL: 'https://nationalmap.gov/epqs/pqs.php',
        waterURL: 'https://waterservices.usgs.gov/nwis',
      },
    };
  }

  // Get cache configuration
  getCacheConfig() {
    return {
      enabled: this.config.ENABLE_CACHING,
      ttl: this.config.CACHE_TTL,
      redisUrl: this.config.REDIS_URL,
    };
  }

  // Get rate limiting configuration
  getRateLimitConfig() {
    return {
      enabled: this.config.ENABLE_RATE_LIMITING,
      requestsPerMinute: this.config.RATE_LIMIT_REQUESTS,
    };
  }

  // Get logging configuration
  getLoggingConfig() {
    return {
      enabled: this.config.ENABLE_LOGGING,
      level: this.config.LOG_LEVEL,
      sentryDsn: this.config.SENTRY_DSN,
    };
  }

  // Get simulation defaults
  getSimulationDefaults() {
    return this.config.DEFAULT_SIMULATION_PARAMS;
  }

  // Check if running in production
  isProd(): boolean {
    return this.isProduction;
  }

  // Check if running in development
  isDev(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  // Check if running in test
  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
}

// Create and export configuration instance
const environmentConfig = new ConfigManager(defaultConfig);

// Export types and utilities
export type { EnvironmentConfig };
export { environmentConfig, validateEnvironment, ConfigManager };

export default environmentConfig;
