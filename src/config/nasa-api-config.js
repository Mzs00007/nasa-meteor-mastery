/**
 * NASA API Configuration Module
 * Comprehensive configuration for all NASA and partner APIs
 * API Key: 0QqBLAX6AX8mBZjLyihSsd1LmA4Q3rfS0BVszjEF
 */

export const NASA_API_CONFIG = {
  // Main NASA API Key - MANDATORY for all NASA API calls
  API_KEY: '0QqBLAX6AX8mBZjLyihSsd1LmA4Q3rfS0BVszjEF',
  
  // Rate limiting configuration
  RATE_LIMITS: {
    REQUESTS_PER_HOUR: 1000,
    REQUESTS_PER_DAY: 10000,
    MIN_INTERVAL: 100, // milliseconds between requests
  },

  // NASA API Endpoints - All MANDATORY
  ENDPOINTS: {
    // Astronomy Picture of the Day
    APOD: {
      BASE_URL: 'https://api.nasa.gov/planetary/apod',
      DESCRIPTION: 'Daily astronomy images and explanations; educational panel',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
    },

    // Near Earth Object Web Service
    NEOWS: {
      BASE_URL: 'https://api.nasa.gov/neo/rest/v1',
      DESCRIPTION: 'Real-time asteroid orbits, impact risk, trajectory',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 15 * 60 * 1000, // 15 minutes
      ENDPOINTS: {
        FEED: '/feed',
        BROWSE: '/neo/browse',
        LOOKUP: '/neo/{asteroid_id}',
        STATS: '/stats',
      },
    },

    // DONKI Space Weather Database
    DONKI: {
      BASE_URL: 'https://api.nasa.gov/DONKI',
      DESCRIPTION: 'Solar flares, geomagnetic storms—space weather impacts',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 10 * 60 * 1000, // 10 minutes
      ENDPOINTS: {
        NOTIFICATIONS: '/notifications',
        FLR: '/FLR', // Solar Flare
        SEP: '/SEP', // Solar Energetic Particle
        MPC: '/MPC', // Magnetopause Crossing
        GST: '/GST', // Geomagnetic Storm
        IPS: '/IPS', // Interplanetary Shock
        CME: '/CME', // Coronal Mass Ejection
        CMEAnalysis: '/CMEAnalysis',
        HSS: '/HSS', // High Speed Stream
        WSAEnlilSimulations: '/WSAEnlilSimulations',
      },
    },

    // EONET Natural Event Tracker
    EONET: {
      BASE_URL: 'https://eonet.gsfc.nasa.gov/api/v3',
      DESCRIPTION: 'Natural Earth events data (wildfires, storms, volcanoes)',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 30 * 60 * 1000, // 30 minutes
      ENDPOINTS: {
        EVENTS: '/events',
        CATEGORIES: '/categories',
        LAYERS: '/layers',
        SOURCES: '/sources',
      },
    },

    // EPIC Earth Polychromatic Imaging Camera
    EPIC: {
      BASE_URL: 'https://api.nasa.gov/EPIC/api',
      DESCRIPTION: 'Daily Earth satellite images, overlays for visual realism',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
      ENDPOINTS: {
        NATURAL: '/natural',
        ENHANCED: '/enhanced',
        IMAGES: '/natural/images',
        DATE: '/natural/date',
        AVAILABLE: '/natural/available',
      },
    },

    // Exoplanet Archive API
    EXOPLANET: {
      BASE_URL: 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync',
      DESCRIPTION: 'Data on discovered exoplanets, scientific info',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
      QUERY_PARAMS: {
        QUERY: 'query',
        FORMAT: 'format',
      },
    },

    // GIBS Global Imagery Browse Services
    GIBS: {
      BASE_URL: 'https://gibs.earthdata.nasa.gov',
      DESCRIPTION: 'Real-time satellite imagery base map layers',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
      ENDPOINTS: {
        WMTS: '/wmts/epsg4326/best',
        WMS: '/wms/epsg4326/best',
        CAPABILITIES: '/wmts/epsg4326/best/wmts.cgi',
      },
    },

    // Mars InSight Weather Service
    MARS_INSIGHT: {
      BASE_URL: 'https://api.nasa.gov/insight_weather',
      DESCRIPTION: 'Live Mars weather—simulation and educational content',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
    },

    // Mars Rover Photos API
    MARS_ROVER: {
      BASE_URL: 'https://api.nasa.gov/mars-photos/api/v1',
      DESCRIPTION: 'Recent Mars rover images and metadata',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
      ENDPOINTS: {
        ROVERS: '/rovers',
        PHOTOS: '/rovers/{rover}/photos',
        MANIFESTS: '/manifests/{rover}',
      },
      ROVERS: ['curiosity', 'opportunity', 'spirit', 'perseverance', 'ingenuity'],
    },

    // NASA Image and Video Library API
    NASA_LIBRARY: {
      BASE_URL: 'https://images-api.nasa.gov',
      DESCRIPTION: 'Archive of NASA mission and astrophotography images',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
      ENDPOINTS: {
        SEARCH: '/search',
        ASSET: '/asset',
        METADATA: '/metadata',
        CAPTIONS: '/captions',
      },
    },

    // Satellite Situation Center (SSC)
    SSC: {
      BASE_URL: 'https://sscweb.gsfc.nasa.gov/WS/sscr/2',
      DESCRIPTION: 'Real-time satellite position and status',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 5 * 60 * 1000, // 5 minutes
      ENDPOINTS: {
        SATELLITES: '/satellites',
        LOCATIONS: '/locations',
        CONJUNCTIONS: '/conjunctions',
      },
    },

    // SSD/CNEOS Solar System Dynamics
    SSD: {
      BASE_URL: 'https://ssd-api.jpl.nasa.gov',
      DESCRIPTION: 'Precise planetary positions, NEOs, orbital element data',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
      ENDPOINTS: {
        HORIZONS: '/horizons_api.py',
        SBDB: '/sbdb_api.py',
        CAD: '/cad_api.py',
        EPHEMERIS: '/ephemeris_api.py',
      },
    },

    // Techport NASA Technology Projects
    TECHPORT: {
      BASE_URL: 'https://api.nasa.gov/techport/api',
      DESCRIPTION: 'Current NASA tech project metadata',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
      ENDPOINTS: {
        PROJECTS: '/projects',
        PROJECT: '/projects/{projectId}',
      },
    },

    // TechTransfer Patents & Software
    TECHTRANSFER: {
      BASE_URL: 'https://api.nasa.gov/techtransfer/api',
      DESCRIPTION: 'NASA technology transfer & patent databases',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
      ENDPOINTS: {
        SOFTWARE: '/software',
        PATENTS: '/patents',
        SPINOFFS: '/spinoffs',
      },
    },

    // TLE API Two Line Elements
    TLE: {
      BASE_URL: 'https://api.nasa.gov/tle',
      DESCRIPTION: 'Real-time satellite orbit elements',
      REQUIRES_API_KEY: true,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
      ENDPOINTS: {
        POSITIONS: '/positions',
        ELEMENTS: '/elements',
      },
    },

    // Planetary Trek WMTS APIs
    TREK: {
      VESTA: {
        BASE_URL: 'https://trek.nasa.gov/tiles/apiv1/vesta',
        DESCRIPTION: 'Vesta planetary mapping layers',
        REQUIRES_API_KEY: false,
      },
      MOON: {
        BASE_URL: 'https://trek.nasa.gov/tiles/apiv1/moon',
        DESCRIPTION: 'Moon planetary mapping layers',
        REQUIRES_API_KEY: false,
      },
      MARS: {
        BASE_URL: 'https://trek.nasa.gov/tiles/apiv1/mars',
        DESCRIPTION: 'Mars planetary mapping layers',
        REQUIRES_API_KEY: false,
      },
    },
  },

  // Partner API Endpoints - All MANDATORY
  PARTNER_APIS: {
    // USGS Earthquake API
    USGS_EARTHQUAKE: {
      BASE_URL: 'https://earthquake.usgs.gov/fdsnws/event/1',
      DESCRIPTION: 'Earthquake events data for impact simulation',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 15 * 60 * 1000, // 15 minutes
      ENDPOINTS: {
        QUERY: '/query',
        COUNT: '/count',
        VERSION: '/version',
        CATALOGS: '/catalogs',
        CONTRIBUTORS: '/contributors',
      },
    },

    // USGS Elevation / National Map APIs
    USGS_ELEVATION: {
      BASE_URL: 'https://nationalmap.gov/epqs',
      DESCRIPTION: 'Elevation modelling for crater and terrain',
      REQUIRES_API_KEY: false,
      CACHE_TTL: 60 * 60 * 1000, // 1 hour
      ENDPOINTS: {
        PQS: '/pqs.php',
      },
    },

    // OpenWeatherMap API (optional, free tier)
    OPENWEATHER: {
      BASE_URL: 'https://api.openweathermap.org/data/2.5',
      DESCRIPTION: 'Meteorological conditions post-impact',
      REQUIRES_API_KEY: true,
      API_KEY_PARAM: 'appid',
      CACHE_TTL: 10 * 60 * 1000, // 10 minutes
      ENDPOINTS: {
        WEATHER: '/weather',
        FORECAST: '/forecast',
        ONECALL: '/onecall',
      },
    },
  },

  // Request configuration
  REQUEST_CONFIG: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    HEADERS: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'NASA-Meteor-Mastery/1.0',
    },
  },

  // Cache configuration
  CACHE_CONFIG: {
    MAX_SIZE: 1000, // Maximum number of cached items
    DEFAULT_TTL: 15 * 60 * 1000, // 15 minutes default
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour cleanup interval
  },

  // Error handling configuration
  ERROR_CONFIG: {
    MAX_CONSECUTIVE_ERRORS: 5,
    CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute
    FALLBACK_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Helper function to build API URL with key
export const buildAPIUrl = (endpoint, params = {}, requiresKey = true) => {
  const url = new URL(endpoint);
  
  if (requiresKey) {
    url.searchParams.append('api_key', NASA_API_CONFIG.API_KEY);
  }
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

// Helper function to get endpoint configuration
export const getEndpointConfig = (apiName, endpointName = null) => {
  const api = NASA_API_CONFIG.ENDPOINTS[apiName] || NASA_API_CONFIG.PARTNER_APIS[apiName];
  if (!api) {
    throw new Error(`API configuration not found: ${apiName}`);
  }
  
  if (endpointName && api.ENDPOINTS) {
    const endpoint = api.ENDPOINTS[endpointName];
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${apiName}.${endpointName}`);
    }
    return { ...api, ENDPOINT: endpoint };
  }
  
  return api;
};

// Export default configuration
export default NASA_API_CONFIG;