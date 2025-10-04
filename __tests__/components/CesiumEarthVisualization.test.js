/**
 * CesiumEarthVisualization Component Test Suite
 * Tests for the 3D Earth visualization component using CesiumJS
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import CesiumEarthVisualization from '../../src/components/mission-control/CesiumEarthVisualization';

// Mock Cesium module
jest.mock('cesium', () => ({
  Ion: {
    defaultAccessToken: '',
  },
  Viewer: jest.fn().mockImplementation((container, options) => ({
    destroy: jest.fn(),
    camera: {
      setView: jest.fn(),
    },
    terrainProvider: null,
    scene: {
      globe: {
        enableLighting: false,
      },
    },
  })),
  IonImageryProvider: jest.fn().mockImplementation(() => ({})),
  CesiumTerrainProvider: {
    fromIonAssetId: jest.fn().mockResolvedValue({}),
  },
  Cartesian3: {
    fromDegrees: jest.fn().mockReturnValue({}),
  },
}));

// Mock CSS imports
jest.mock(
  '../../src/components/mission-control/CesiumEarthVisualization.css',
  () => ({})
);

describe('CesiumEarthVisualization Component', () => {
  let mockViewer;
  let mockCesium;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockViewer = {
      destroy: jest.fn(),
      camera: {
        setView: jest.fn(),
      },
      terrainProvider: null,
      scene: {
        globe: {
          enableLighting: false,
        },
      },
    };

    mockCesium = require('cesium');
    mockCesium.Viewer.mockImplementation(() => mockViewer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render loading state initially', () => {
      render(<CesiumEarthVisualization />);

      expect(
        screen.getByText('Loading Earth visualization...')
      ).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('should render Cesium container after loading', async () => {
      render(<CesiumEarthVisualization />);

      await waitFor(
        () => {
          expect(screen.getByTestId('cesium-container')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    test('should have correct CSS classes applied', () => {
      render(<CesiumEarthVisualization />);

      const container = screen.getByTestId('cesium-earth-container');
      expect(container).toHaveClass('cesium-earth-container');
    });
  });

  describe('Cesium Initialization', () => {
    test('should initialize Cesium viewer with correct options', async () => {
      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(mockCesium.Viewer).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            imageryProvider: expect.any(Object),
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            infoBox: false,
            selectionIndicator: false,
          })
        );
      });
    });

    test('should set up terrain provider asynchronously', async () => {
      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(
          mockCesium.CesiumTerrainProvider.fromIonAssetId
        ).toHaveBeenCalledWith(1);
      });
    });

    test('should set initial camera position', async () => {
      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(mockViewer.camera.setView).toHaveBeenCalledWith({
          destination: expect.any(Object),
        });
      });
    });

    test('should handle terrain provider loading errors gracefully', async () => {
      // Mock terrain provider to reject
      mockCesium.CesiumTerrainProvider.fromIonAssetId.mockRejectedValue(
        new Error('Terrain loading failed')
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Could not load terrain provider, using default:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should display error message when Cesium initialization fails', async () => {
      // Mock Cesium.Viewer to throw an error
      mockCesium.Viewer.mockImplementation(() => {
        throw new Error('Cesium initialization failed');
      });

      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(
          screen.getByText('Error loading Earth visualization')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Cesium initialization failed')
        ).toBeInTheDocument();
      });
    });

    test('should handle missing container reference', () => {
      // Mock useRef to return null
      const originalUseRef = React.useRef;
      React.useRef = jest.fn(() => ({ current: null }));

      render(<CesiumEarthVisualization />);

      // Should not attempt to initialize Cesium
      expect(mockCesium.Viewer).not.toHaveBeenCalled();

      React.useRef = originalUseRef;
    });
  });

  describe('Component Lifecycle', () => {
    test('should cleanup Cesium viewer on unmount', async () => {
      const { unmount } = render(<CesiumEarthVisualization />);

      // Wait for initialization
      await waitFor(() => {
        expect(mockCesium.Viewer).toHaveBeenCalled();
      });

      // Unmount component
      unmount();

      // Verify cleanup
      expect(mockViewer.destroy).toHaveBeenCalled();
    });

    test('should not cleanup if viewer was not initialized', () => {
      const { unmount } = render(<CesiumEarthVisualization />);

      // Unmount immediately before initialization
      unmount();

      // Should not call destroy on undefined viewer
      expect(mockViewer.destroy).not.toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    test('should initialize within reasonable time', async () => {
      const start = Date.now();

      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(mockCesium.Viewer).toHaveBeenCalled();
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should initialize within 2 seconds
    });

    test('should handle multiple rapid re-renders', async () => {
      const { rerender } = render(<CesiumEarthVisualization />);

      // Rapidly re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<CesiumEarthVisualization />);
      }

      await waitFor(() => {
        // Should only initialize once despite multiple renders
        expect(mockCesium.Viewer).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        const container = screen.getByTestId('cesium-container');
        expect(container).toHaveAttribute(
          'aria-label',
          'Interactive 3D Earth visualization'
        );
      });
    });

    test('should provide loading state for screen readers', () => {
      render(<CesiumEarthVisualization />);

      const loadingElement = screen.getByText('Loading Earth visualization...');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Integration Tests', () => {
    test('should work with different screen sizes', async () => {
      // Mock different viewport sizes
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;

      // Test mobile size
      window.innerWidth = 375;
      window.innerHeight = 667;

      const { rerender } = render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(mockCesium.Viewer).toHaveBeenCalled();
      });

      // Test desktop size
      window.innerWidth = 1920;
      window.innerHeight = 1080;

      rerender(<CesiumEarthVisualization />);

      // Restore original values
      window.innerWidth = originalInnerWidth;
      window.innerHeight = originalInnerHeight;
    });

    test('should handle WebGL context loss gracefully', async () => {
      // Mock WebGL context loss
      const mockCanvas = document.createElement('canvas');
      const mockContext = mockCanvas.getContext('webgl');

      render(<CesiumEarthVisualization />);

      await waitFor(() => {
        expect(mockCesium.Viewer).toHaveBeenCalled();
      });

      // Simulate context loss
      if (mockContext) {
        const lostContextExtension =
          mockContext.getExtension('WEBGL_lose_context');
        if (lostContextExtension) {
          lostContextExtension.loseContext();
        }
      }

      // Component should handle this gracefully without crashing
      expect(screen.getByTestId('cesium-earth-container')).toBeInTheDocument();
    });
  });
});
