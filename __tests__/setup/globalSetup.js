/**
 * Global Setup for Jest Tests
 * Configures the testing environment before all tests run
 */

module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REACT_APP_API_URL = 'http://localhost:3001';
  process.env.REACT_APP_CESIUM_TOKEN = 'test-token';

  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    // Uncomment to suppress console.log in tests
    // log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  // Mock window.matchMedia for responsive design tests
  Object.defineProperty(global, 'window', {
    value: {
      matchMedia: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {}, // deprecated
        removeListener: () => {}, // deprecated
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    },
    writable: true,
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null;
    }
    disconnect() {
      return null;
    }
    unobserve() {
      return null;
    }
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {
      return null;
    }
    disconnect() {
      return null;
    }
    unobserve() {
      return null;
    }
  };

  // Mock WebGL context for Cesium tests
  const mockWebGLContext = {
    canvas: global.document?.createElement('canvas') || {},
    getExtension: () => null,
    getParameter: () => null,
    createShader: () => null,
    shaderSource: () => {},
    compileShader: () => {},
    createProgram: () => null,
    attachShader: () => {},
    linkProgram: () => {},
    useProgram: () => {},
    createBuffer: () => null,
    bindBuffer: () => {},
    bufferData: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    drawArrays: () => {},
    clear: () => {},
    clearColor: () => {},
    enable: () => {},
    disable: () => {},
    viewport: () => {},
  };

  // Mock HTMLCanvasElement.getContext
  if (global.HTMLCanvasElement) {
    global.HTMLCanvasElement.prototype.getContext = function(contextType) {
      if (contextType === 'webgl' || contextType === 'webgl2') {
        return mockWebGLContext;
      }
      return null;
    };
  }

  // Mock URL.createObjectURL
  if (!global.URL) {
    global.URL = {};
  }
  global.URL.createObjectURL = () => 'mocked-url';
  global.URL.revokeObjectURL = () => {};

  console.log('🚀 Global test setup completed');
};
