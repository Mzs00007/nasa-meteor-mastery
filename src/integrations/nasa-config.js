// NASA Open Source Integration Configuration
// This file configures all NASA open source repositories for the Meteor Madness project

export const NASA_INTEGRATIONS = {
  // NASA 3D Models and Textures
  NASA_3D_RESOURCES: {
    enabled: true,
    repository: 'https://github.com/nasa/NASA-3D-Resources',
    localPath: '/public/assets/nasa-3d-models',
    fileTypes: ['.obj', '.mtl', '.dae', '.stl', '.fbx'],
    categories: ['spacecraft', 'celestial-bodies', 'mission-assets'],
  },

  // NASA Printable STL Files
  NASA_STL_FILES: {
    enabled: true,
    repository: 'https://github.com/va3c/nasa-samples',
    localPath: '/public/assets/stl-models',
    educationalUse: true,
    printReady: true,
  },

  // NASA OpenMCT Mission Control
  OPENMCT: {
    enabled: true,
    repository: 'https://github.com/nasa/openmct',
    apiEndpoint: '/api/nasa/telemetry',
    features: ['real-time-telemetry', 'dashboard', 'plugins', 'extensibility'],
  },

  // NASA Mission Visualization
  MISSION_VIZ: {
    enabled: true,
    repository: 'https://github.com/nasa/mission-viz',
    orbitalDataPath: '/public/assets/orbital-data',
    capabilities: [
      'orbital-mechanics',
      'trajectory-visualization',
      'mission-planning',
    ],
  },

  // OpenSpace Universe Visualization
  OPENSPACE: {
    enabled: true,
    repository: 'https://github.com/OpenSpace/OpenSpace',
    universeScale: 'astronomical',
    dataSources: ['hipparcos', 'gaia', 'nasa-neo', 'solar-system'],
  },

  // OpenVisus NASA Dashboard
  OPENVISUS: {
    enabled: true,
    repository: 'https://github.com/sci-visus/Openvisus-NASA-Dashboard',
    dashboardType: 'jupyter-based',
    dataTypes: ['climate', 'atmospheric', 'ocean', 'earth-science'],
  },

  // Astronomical Data from NASA Horizons
  ASTRO_DATA: {
    enabled: true,
    repository: 'https://github.com/erictang000/astro-data',
    scrapingEnabled: true,
    dataSources: ['jpl-horizons', 'planetary-positions', 'celestial-events'],
  },

  // Solar System NEO Visualization
  NEO_VISUALIZATION: {
    enabled: true,
    repository: 'https://github.com/KCBF/NASA_skynext',
    interactive3D: true,
    objects: [
      'near-earth-objects',
      'solar-system-bodies',
      'comets',
      'asteroids',
    ],
  },

  // NeoMa Earth Detection
  NEOMA: {
    enabled: true,
    repository: 'https://github.com/diyapratheep/Neoma',
    tracking: ['celestial-motion', 'neo-proximity', 'earth-approaches'],
    alertSystem: true,
  },

  // NASA CFL3D Computational Fluid Dynamics
  CFL3D: {
    enabled: true,
    repository: 'https://github.com/nasa/CFL3D',
    simulationType: 'computational-fluid-dynamics',
    applications: ['aerospace', 'planetary-sciences', 'impact-modeling'],
  },

  // LiveView Imaging Spectrometer
  LIVEVIEW: {
    enabled: true,
    repository: 'https://github.com/nasa-jpl/LiveViewOpenCL',
    realTime: true,
    capabilities: ['spectral-analysis', 'imaging', 'opencl-accelerated'],
  },
};

// Additional NASA Data Sources
export const NASA_DATA_SOURCES = {
  NASA_3D_PORTAL: 'https://science.nasa.gov/3d-resources/',
  DATA_GOV_3D: 'https://catalog.data.gov/dataset/nasa-3d-models-galileo-b5645',
  CELESTIAL_MAPPING: 'https://gknorman-nasa.github.io/CMSHomePage/',
  JPL_HORIZONS: 'https://ssd.jpl.nasa.gov/horizons/app.html#/',
  NEO_WS: 'https://api.nasa.gov/neo/rest/v1/neo/browse/',
  EARTH_DATA: 'https://earthdata.nasa.gov/',
};

// API Endpoints Configuration
export const NASA_API_ENDPOINTS = {
  BASE: '/api/nasa',
  ENDPOINTS: {
    THREE_D_MODELS: '/3d-models',
    TELEMETRY: '/telemetry',
    NEO_DATA: '/neo-data',
    ORBITAL_DATA: '/orbital-data',
    SIMULATION: '/simulation-data',
    VISUALIZATION: '/visualization',
  },
};

// Data Processing Configuration
export const DATA_PROCESSING = {
  REAL_TIME_SCRAPING: true,
  DATA_CACHE_TTL: 3600, // 1 hour in seconds
  MAX_FILE_SIZE: 104857600, // 100MB
  SUPPORTED_FORMATS: ['json', 'csv', 'xml', 'stl', 'obj', 'fbx'],
};

// License Compliance
export const LICENSES = {
  NASA_OPEN_SOURCE: true,
  MIT: true,
  APACHE_2: true,
  BSD_3: true,
  ATTRIBUTION_REQUIRED: true,
};
