/**
 * Cesium Mock for Testing
 * Provides mock implementations of Cesium classes and functions
 */

// Mock Cesium Ion
const Ion = {
  defaultAccessToken: ''
};

// Mock Viewer class
class Viewer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.isDestroyed = false;
    
    // Mock camera
    this.camera = {
      setView: jest.fn(),
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 },
      right: { x: 1, y: 0, z: 0 }
    };
    
    // Mock scene
    this.scene = {
      globe: {
        enableLighting: false,
        show: true
      },
      primitives: {
        add: jest.fn(),
        remove: jest.fn(),
        removeAll: jest.fn()
      },
      canvas: {
        width: 800,
        height: 600
      }
    };
    
    // Mock terrain provider
    this.terrainProvider = null;
    
    // Mock entities
    this.entities = {
      add: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn(),
      values: []
    };
    
    // Mock data sources
    this.dataSources = {
      add: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    };
  }
  
  destroy() {
    this.isDestroyed = true;
  }
  
  render() {
    // Mock render function
  }
}

// Mock IonImageryProvider
class IonImageryProvider {
  constructor(options = {}) {
    this.assetId = options.assetId || 3954;
    this.ready = true;
  }
}

// Mock CesiumTerrainProvider
class CesiumTerrainProvider {
  constructor(options = {}) {
    this.ready = true;
  }
  
  static fromIonAssetId(assetId) {
    return Promise.resolve(new CesiumTerrainProvider({ assetId }));
  }
}

// Mock Cartesian3
const Cartesian3 = {
  fromDegrees: jest.fn((longitude, latitude, height = 0) => ({
    x: longitude,
    y: latitude,
    z: height
  })),
  fromRadians: jest.fn((longitude, latitude, height = 0) => ({
    x: longitude,
    y: latitude,
    z: height
  })),
  ZERO: { x: 0, y: 0, z: 0 },
  UNIT_X: { x: 1, y: 0, z: 0 },
  UNIT_Y: { x: 0, y: 1, z: 0 },
  UNIT_Z: { x: 0, y: 0, z: 1 }
};

// Mock Cartesian2
const Cartesian2 = {
  fromElements: jest.fn((x, y) => ({ x, y })),
  ZERO: { x: 0, y: 0 },
  UNIT_X: { x: 1, y: 0 },
  UNIT_Y: { x: 0, y: 1 }
};

// Mock Color
const Color = {
  RED: { red: 1, green: 0, blue: 0, alpha: 1 },
  GREEN: { red: 0, green: 1, blue: 0, alpha: 1 },
  BLUE: { red: 0, green: 0, blue: 1, alpha: 1 },
  WHITE: { red: 1, green: 1, blue: 1, alpha: 1 },
  BLACK: { red: 0, green: 0, blue: 0, alpha: 1 },
  YELLOW: { red: 1, green: 1, blue: 0, alpha: 1 },
  fromCssColorString: jest.fn((color) => ({ red: 1, green: 1, blue: 1, alpha: 1 }))
};

// Mock Entity
class Entity {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36);
    this.name = options.name || '';
    this.position = options.position || null;
    this.billboard = options.billboard || null;
    this.point = options.point || null;
    this.label = options.label || null;
  }
}

// Mock BillboardGraphics
class BillboardGraphics {
  constructor(options = {}) {
    this.image = options.image || '';
    this.scale = options.scale || 1.0;
    this.show = options.show !== false;
  }
}

// Mock PointGraphics
class PointGraphics {
  constructor(options = {}) {
    this.pixelSize = options.pixelSize || 10;
    this.color = options.color || Color.YELLOW;
    this.show = options.show !== false;
  }
}

// Mock LabelGraphics
class LabelGraphics {
  constructor(options = {}) {
    this.text = options.text || '';
    this.font = options.font || '12pt sans-serif';
    this.fillColor = options.fillColor || Color.WHITE;
    this.show = options.show !== false;
  }
}

// Mock Math utilities
const CesiumMath = {
  PI: Math.PI,
  PI_OVER_TWO: Math.PI / 2,
  PI_OVER_THREE: Math.PI / 3,
  PI_OVER_FOUR: Math.PI / 4,
  PI_OVER_SIX: Math.PI / 6,
  TWO_PI: Math.PI * 2,
  toRadians: jest.fn((degrees) => degrees * Math.PI / 180),
  toDegrees: jest.fn((radians) => radians * 180 / Math.PI)
};

// Mock Clock
class Clock {
  constructor() {
    this.currentTime = new Date();
    this.multiplier = 1.0;
    this.shouldAnimate = true;
  }
}

// Mock JulianDate
const JulianDate = {
  now: jest.fn(() => new Date()),
  fromDate: jest.fn((date) => date),
  toDate: jest.fn((julianDate) => julianDate)
};

// Export all mocks
module.exports = {
  Ion,
  Viewer,
  IonImageryProvider,
  CesiumTerrainProvider,
  Cartesian3,
  Cartesian2,
  Color,
  Entity,
  BillboardGraphics,
  PointGraphics,
  LabelGraphics,
  Math: CesiumMath,
  Clock,
  JulianDate,
  
  // Additional commonly used Cesium classes
  Ellipsoid: {
    WGS84: {
      radii: { x: 6378137.0, y: 6378137.0, z: 6356752.3142451793 }
    }
  },
  
  Rectangle: {
    fromDegrees: jest.fn((west, south, east, north) => ({
      west, south, east, north
    }))
  },
  
  HeightReference: {
    NONE: 0,
    CLAMP_TO_GROUND: 1,
    RELATIVE_TO_GROUND: 2
  },
  
  HorizontalOrigin: {
    CENTER: 0,
    LEFT: 1,
    RIGHT: -1
  },
  
  VerticalOrigin: {
    CENTER: 0,
    BOTTOM: 1,
    TOP: -1
  }
};