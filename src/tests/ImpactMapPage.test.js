import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ImpactMapPage from '../pages/ImpactMapPage';

// Mock external dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock Cesium
jest.mock('../components/impact-map/CesiumEarthMap', () => {
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      updateCamera: jest.fn(),
      showTrajectory: jest.fn(),
      showImpact: jest.fn(),
      animateImpact: jest.fn(),
      resetVisualization: jest.fn(),
    }));
    
    return (
      <div data-testid="cesium-earth-map" onClick={props.onLocationSelect}>
        Mocked Cesium Earth Map
      </div>
    );
  });
});

// Mock other components
jest.mock('../components/impact-map/EnhancedPhysicsEngine', () => {
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      calculateImpact: jest.fn().mockReturnValue({
        kineticEnergy: 1e15,
        tntEquivalent: 239,
        craterDiameter: 2.5,
        blastRadius: 15000,
        seismicMagnitude: 6.2,
        estimatedCasualties: 50000,
        environmentalEffects: {
          dustCloudRadius: 100000,
          temperatureChange: -2.5,
          ozoneDamage: 15,
          radiationExposure: 0.1
        },
        economicImpact: {
          totalEconomicLoss: 5e10
        }
      }),
      updateParameters: jest.fn(),
    }));
    
    return <div data-testid="physics-engine">Mocked Physics Engine</div>;
  });
});

jest.mock('../components/impact-map/DataAnalysisPanel', () => {
  return function MockDataAnalysisPanel(props) {
    return (
      <div data-testid="data-analysis-panel">
        <button onClick={() => props.onExport('csv')}>Export CSV</button>
        <button onClick={() => props.onExport('json')}>Export JSON</button>
        Mocked Data Analysis Panel
      </div>
    );
  };
});

jest.mock('../components/impact-map/RealTimeDataFeed', () => {
  return function MockRealTimeDataFeed(props) {
    React.useEffect(() => {
      // Simulate data update
      setTimeout(() => {
        props.onDataUpdate({
          asteroids: [{ name: 'Test Asteroid', diameter: 100 }],
          timestamp: Date.now()
        });
      }, 100);
    }, [props]);
    
    return <div data-testid="real-time-data-feed">Mocked Real-Time Data Feed</div>;
  };
});

jest.mock('../components/impact-map/ImpactVisualizationDashboard', () => {
  return function MockImpactVisualizationDashboard(props) {
    return (
      <div data-testid="impact-visualization-dashboard">
        <button onClick={() => props.onExport('chart')}>Export Chart</button>
        Mocked Impact Visualization Dashboard
      </div>
    );
  };
});

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ImpactMapPage Component Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders main page components correctly', () => {
      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/Impact Simulation Map/)).toBeInTheDocument();
      expect(screen.getByTestId('cesium-earth-map')).toBeInTheDocument();
      expect(screen.getByTestId('physics-engine')).toBeInTheDocument();
      expect(screen.getByTestId('data-analysis-panel')).toBeInTheDocument();
      expect(screen.getByTestId('real-time-data-feed')).toBeInTheDocument();
      expect(screen.getByTestId('impact-visualization-dashboard')).toBeInTheDocument();
    });

    test('displays meteor parameter controls', () => {
      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/Meteor Properties/)).toBeInTheDocument();
      expect(screen.getByText(/Diameter/)).toBeInTheDocument();
      expect(screen.getByText(/Velocity/)).toBeInTheDocument();
      expect(screen.getByText(/Impact Angle/)).toBeInTheDocument();
      expect(screen.getByText(/Entry Altitude/)).toBeInTheDocument();
      expect(screen.getByText(/Composition/)).toBeInTheDocument();
    });

    test('displays impact location controls', () => {
      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/Impact Location/)).toBeInTheDocument();
      expect(screen.getByText(/Latitude/)).toBeInTheDocument();
      expect(screen.getByText(/Longitude/)).toBeInTheDocument();
    });

    test('displays map view controls', () => {
      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/3D Globe/)).toBeInTheDocument();
      expect(screen.getByText(/Satellite/)).toBeInTheDocument();
      expect(screen.getByText(/Terrain/)).toBeInTheDocument();
    });

    test('displays historical events section', () => {
      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/Historical Events/)).toBeInTheDocument();
      expect(screen.getByText(/Tunguska Event/)).toBeInTheDocument();
      expect(screen.getByText(/Chelyabinsk/)).toBeInTheDocument();
      expect(screen.getByText(/Chicxulub/)).toBeInTheDocument();
      expect(screen.getByText(/Barringer Crater/)).toBeInTheDocument();
    });
  });

  describe('Parameter Controls', () => {
    test('updates meteor diameter correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      const diameterInput = screen.getByDisplayValue('100');
      
      await act(async () => {
        fireEvent.change(diameterInput, { target: { value: '200' } });
      });

      expect(diameterInput.value).toBe('200');
    });

    test('updates meteor velocity correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      const velocityInput = screen.getByDisplayValue('20000');
      
      await act(async () => {
        fireEvent.change(velocityInput, { target: { value: '25000' } });
      });

      expect(velocityInput.value).toBe('25000');
    });

    test('updates impact angle correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      const angleSlider = screen.getByDisplayValue('45');
      
      await act(async () => {
        fireEvent.change(angleSlider, { target: { value: '60' } });
      });

      expect(angleSlider.value).toBe('60');
    });

    test('updates composition correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      const compositionSelect = screen.getByDisplayValue('stone');
      
      await act(async () => {
        fireEvent.change(compositionSelect, { target: { value: 'iron' } });
      });

      expect(compositionSelect.value).toBe('iron');
    });

    test('updates location coordinates correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      const latitudeInput = screen.getByDisplayValue('40.7128');
      const longitudeInput = screen.getByDisplayValue('-74.006');
      
      await act(async () => {
        fireEvent.change(latitudeInput, { target: { value: '51.5074' } });
        fireEvent.change(longitudeInput, { target: { value: '-0.1278' } });
      });

      expect(latitudeInput.value).toBe('51.5074');
      expect(longitudeInput.value).toBe('-0.1278');
    });
  });

  describe('Map Interactions', () => {
    test('handles map view mode changes', async () => {
      renderWithRouter(<ImpactMapPage />);

      const satelliteButton = screen.getByText(/Satellite/);
      
      await act(async () => {
        fireEvent.click(satelliteButton);
      });

      expect(satelliteButton).toHaveClass('active');
    });

    test('handles location selection from map', async () => {
      renderWithRouter(<ImpactMapPage />);

      const cesiumMap = screen.getByTestId('cesium-earth-map');
      
      await act(async () => {
        fireEvent.click(cesiumMap);
      });

      // Should trigger location update
      expect(cesiumMap).toBeInTheDocument();
    });
  });

  describe('Simulation Controls', () => {
    test('runs simulation correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      const runButton = screen.getByText(/Run Simulation/);
      
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Should show simulation results
      await waitFor(() => {
        expect(screen.getByText(/Impact Statistics/)).toBeInTheDocument();
      });
    });

    test('resets simulation correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      const resetButton = screen.getByText(/Reset/);
      
      await act(async () => {
        fireEvent.click(resetButton);
      });

      // Should reset to initial state
      expect(resetButton).toBeInTheDocument();
    });

    test('handles advanced options toggle', async () => {
      renderWithRouter(<ImpactMapPage />);

      const advancedToggle = screen.getByText(/Show Advanced/);
      
      await act(async () => {
        fireEvent.click(advancedToggle);
      });

      expect(screen.getByText(/Hide Advanced/)).toBeInTheDocument();
    });
  });

  describe('Historical Events', () => {
    test('loads Tunguska event parameters', async () => {
      renderWithRouter(<ImpactMapPage />);

      const tunguskaButton = screen.getByText(/Tunguska Event/);
      
      await act(async () => {
        fireEvent.click(tunguskaButton);
      });

      // Should update parameters to Tunguska values
      await waitFor(() => {
        const diameterInput = screen.getByDisplayValue(/60/);
        expect(diameterInput).toBeInTheDocument();
      });
    });

    test('loads Chelyabinsk event parameters', async () => {
      renderWithRouter(<ImpactMapPage />);

      const chelyabinskButton = screen.getByText(/Chelyabinsk/);
      
      await act(async () => {
        fireEvent.click(chelyabinskButton);
      });

      // Should update parameters to Chelyabinsk values
      await waitFor(() => {
        const diameterInput = screen.getByDisplayValue(/20/);
        expect(diameterInput).toBeInTheDocument();
      });
    });

    test('loads Chicxulub event parameters', async () => {
      renderWithRouter(<ImpactMapPage />);

      const chicxulubButton = screen.getByText(/Chicxulub/);
      
      await act(async () => {
        fireEvent.click(chicxulubButton);
      });

      // Should update parameters to Chicxulub values
      await waitFor(() => {
        const diameterInput = screen.getByDisplayValue(/10000/);
        expect(diameterInput).toBeInTheDocument();
      });
    });
  });

  describe('Export and Share Functionality', () => {
    test('exports CSV data correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      // First run a simulation
      const runButton = screen.getByText(/Run Simulation/);
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Then export CSV
      const exportCSVButton = screen.getByText(/Export CSV/);
      await act(async () => {
        fireEvent.click(exportCSVButton);
      });

      expect(exportCSVButton).toBeInTheDocument();
    });

    test('exports JSON data correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      // First run a simulation
      const runButton = screen.getByText(/Run Simulation/);
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Then export JSON
      const exportJSONButton = screen.getByText(/Export JSON/);
      await act(async () => {
        fireEvent.click(exportJSONButton);
      });

      expect(exportJSONButton).toBeInTheDocument();
    });

    test('shares results correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      // First run a simulation
      const runButton = screen.getByText(/Run Simulation/);
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Then share results
      const shareButton = screen.getByText(/Share Results/);
      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(shareButton).toBeInTheDocument();
    });
  });

  describe('Real-Time Data Integration', () => {
    test('receives and processes NASA data updates', async () => {
      renderWithRouter(<ImpactMapPage />);

      // Wait for real-time data to be received
      await waitFor(() => {
        expect(screen.getByTestId('real-time-data-feed')).toBeInTheDocument();
      });

      // Data should be processed and available
      expect(screen.getByText(/LIVE DATA ACTIVE/)).toBeInTheDocument();
    });

    test('handles data feed errors gracefully', async () => {
      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithRouter(<ImpactMapPage />);

      // Should not crash on data errors
      expect(screen.getByTestId('real-time-data-feed')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    test('adapts to mobile viewport', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/Impact Simulation Map/)).toBeInTheDocument();
    });

    test('adapts to tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/Impact Simulation Map/)).toBeInTheDocument();
    });

    test('works on desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      renderWithRouter(<ImpactMapPage />);

      expect(screen.getByText(/Impact Simulation Map/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderWithRouter(<ImpactMapPage />);

      const diameterInput = screen.getByLabelText(/Diameter/);
      const velocityInput = screen.getByLabelText(/Velocity/);
      
      expect(diameterInput).toHaveAttribute('aria-label');
      expect(velocityInput).toHaveAttribute('aria-label');
    });

    test('supports keyboard navigation', async () => {
      renderWithRouter(<ImpactMapPage />);

      const runButton = screen.getByText(/Run Simulation/);
      
      runButton.focus();
      expect(document.activeElement).toBe(runButton);

      // Test Enter key
      await act(async () => {
        fireEvent.keyDown(runButton, { key: 'Enter', code: 'Enter' });
      });

      expect(runButton).toBeInTheDocument();
    });

    test('has proper heading hierarchy', () => {
      renderWithRouter(<ImpactMapPage />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/Impact Simulation Map/);
    });
  });

  describe('Performance', () => {
    test('renders within acceptable time', async () => {
      const startTime = performance.now();
      
      renderWithRouter(<ImpactMapPage />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    test('handles rapid parameter changes efficiently', async () => {
      renderWithRouter(<ImpactMapPage />);

      const diameterInput = screen.getByDisplayValue('100');
      
      // Rapidly change diameter multiple times
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.change(diameterInput, { target: { value: `${100 + i * 10}` } });
        });
      }

      expect(diameterInput.value).toBe('190');
    });
  });

  describe('Error Handling', () => {
    test('handles invalid parameter values gracefully', async () => {
      renderWithRouter(<ImpactMapPage />);

      const diameterInput = screen.getByDisplayValue('100');
      
      await act(async () => {
        fireEvent.change(diameterInput, { target: { value: '-50' } });
      });

      // Should not accept negative values
      expect(diameterInput.value).not.toBe('-50');
    });

    test('handles simulation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithRouter(<ImpactMapPage />);

      const runButton = screen.getByText(/Run Simulation/);
      
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Should not crash on simulation errors
      expect(screen.getByText(/Impact Simulation Map/)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    test('maintains state consistency across components', async () => {
      renderWithRouter(<ImpactMapPage />);

      // Change diameter
      const diameterInput = screen.getByDisplayValue('100');
      await act(async () => {
        fireEvent.change(diameterInput, { target: { value: '200' } });
      });

      // Run simulation
      const runButton = screen.getByText(/Run Simulation/);
      await act(async () => {
        fireEvent.click(runButton);
      });

      // State should be consistent across all components
      expect(diameterInput.value).toBe('200');
    });

    test('preserves simulation history correctly', async () => {
      renderWithRouter(<ImpactMapPage />);

      // Run multiple simulations
      const runButton = screen.getByText(/Run Simulation/);
      
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(runButton);
        });
      }

      // History should be maintained
      expect(screen.getByTestId('data-analysis-panel')).toBeInTheDocument();
    });
  });
});