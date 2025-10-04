// Configuration file for Meteor Madness

const CONFIG = {
  // NASA API Configuration
  NASA: {
    NEO_API_KEY: process.env.NASA_API_KEY || 'DEMO_KEY',
    NEO_BASE_URL: 'https://api.nasa.gov/neo/rest/v1',
    DONKI_BASE_URL: 'https://api.nasa.gov/DONKI',
    EONET_BASE_URL: 'https://eonet.gsfc.nasa.gov/api/v2.1',
  },

  // USGS API Configuration
  USGS: {
    EARTHQUAKE_API: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    ELEVATION_API: 'https://nationalmap.gov/epqs/pqs.php',
    WATER_API: 'https://waterservices.usgs.gov/nwis',
  },

  // Simulation Constants
  SIMULATION: {
    GRAVITY: 9.81, // m/s²
    EARTH_RADIUS: 6371000, // meters
    EARTH_MASS: 5.972e24, // kg
    ESCAPE_VELOCITY: 11200, // m/s

    // Material densities (kg/m³)
    DENSITIES: {
      stony: 3000,
      iron: 7800,
      carbonaceous: 2000,
      icy: 900,
    },

    // Impact energy constants
    ENERGY_CONVERSION: 4.184e15, // joules to megatons
    CRATER_CONSTANT: 1.2, // empirical constant for crater size
  },

  // Visualization Settings
  VISUALIZATION: {
    ORBIT_SCALE: 1000000, // scale factor for orbit visualization
    EARTH_SCALE: 1000, // scale factor for Earth
    TRAJECTORY_POINTS: 100, // number of points in trajectory

    // Colors
    COLORS: {
      earth: '#2E86AB',
      asteroid: '#FF6B6B',
      trajectory: '#FFE66D',
      impact: '#FF9F1C',
      safe: '#4ECDC4',
    },
  },

  // UI Settings
  UI: {
    DEFAULT_THEME: 'default',
    ANIMATION_DURATION: 1000, // ms
    DEBOUNCE_TIME: 300, // ms

    // Responsive breakpoints
    BREAKPOINTS: {
      mobile: 576,
      tablet: 768,
      desktop: 992,
      large: 1200,
    },
  },

  // Error Messages
  ERROR_MESSAGES: {
    API_UNAVAILABLE: 'NASA API is currently unavailable. Using demo data.',
    INVALID_INPUT: 'Please check your input values.',
    SIMULATION_FAILED: 'Simulation failed to calculate results.',
    NETWORK_ERROR: 'Network connection error.',
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    SIMULATION_COMPLETE: 'Simulation completed successfully!',
    DATA_LOADED: 'Asteroid data loaded from NASA.',
    SCENARIO_SAVED: 'Scenario saved successfully.',
  },
};

// Environment detection - using functions to avoid window access during import
const getEnv = () => ({
  IS_DEVELOPMENT:
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'),
  IS_PRODUCTION:
    typeof window !== 'undefined' &&
    !(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ),
  IS_MOBILE: typeof window !== 'undefined' && window.innerWidth <= 768,
  IS_TOUCH:
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0),
});

// Export configuration
if (typeof window !== 'undefined') {
  window.MeteorMadnessConfig = CONFIG;
  window.MeteorMadnessEnv = getEnv();
}

// Configuration loaded silently - use browser dev tools to inspect window.MeteorMadnessConfig
