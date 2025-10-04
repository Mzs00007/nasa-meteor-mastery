/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { SimulationProvider, useSimulation } from '../../src/context/SimulationContext';

// Mock dependencies
jest.mock('../../src/config', () => ({
  API_URL: 'http://localhost:3001',
}));

jest.mock('../../src/services/nasaService', () => ({
  nasaService: {
    getNeoFeed: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Test component to access context
const TestComponent = () => {
  const context = useSimulation();
  return (
    <div>
      <div data-testid="asteroid-diameter">{context.asteroidParams.diameter}</div>
      <div data-testid="asteroid-velocity">{context.asteroidParams.velocity}</div>
      <div data-testid="asteroid-angle">{context.asteroidParams.angle}</div>
      <div data-testid="asteroid-composition">{context.asteroidParams.composition}</div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="error">{context.error || 'null'}</div>
      <div data-testid="view">{context.view}</div>
      <div data-testid="nasa-data-loading">{context.nasaDataLoading.toString()}</div>
      <div data-testid="meteor-data-length">{context.meteorData.length}</div>
      <div data-testid="nasa-asteroid-data-length">{context.nasaAsteroidData.length}</div>
      <button 
        data-testid="run-simulation" 
        onClick={context.runSimulation}
      >
        Run Simulation
      </button>
      <button 
        data-testid="clear-history" 
        onClick={context.clearSimulationHistory}
      >
        Clear History
      </button>
      <button 
        data-testid="fetch-nasa-data" 
        onClick={context.fetchNasaAsteroidData}
      >
        Fetch NASA Data
      </button>
      <button 
        data-testid="set-params" 
        onClick={() => context.setAsteroidParams({
          diameter: 200,
          velocity: 25,
          angle: 60,
          composition: 'stone'
        })}
      >
        Set Params
      </button>
      <button 
        data-testid="set-view" 
        onClick={() => context.setView('orbit')}
      >
        Set View
      </button>
      <button 
        data-testid="set-location" 
        onClick={() => context.setImpactLocation({ latitude: 40.7128, longitude: -74.0060 })}
      >
        Set Location
      </button>
    </div>
  );
};

describe('SimulationContext', () => {
  const { nasaService } = require('../../src/services/nasaService');

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    fetch.mockClear();
    nasaService.getNeoFeed.mockClear();
  });

  describe('Provider Initialization', () => {
    test('should provide default values', () => {
      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      expect(screen.getByTestId('asteroid-diameter')).toHaveTextContent('100');
      expect(screen.getByTestId('asteroid-velocity')).toHaveTextContent('20');
      expect(screen.getByTestId('asteroid-angle')).toHaveTextContent('45');
      expect(screen.getByTestId('asteroid-composition')).toHaveTextContent('iron');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
      expect(screen.getByTestId('view')).toHaveTextContent('both');
      expect(screen.getByTestId('nasa-data-loading')).toHaveTextContent('false');
    });

    test('should fetch meteor and NASA data on mount', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Test Meteor', diameter: 50, velocity: 15, angle: 30, composition: 'stone' }
        ],
      });

      nasaService.getNeoFeed.mockResolvedValueOnce({
        near_earth_objects: {
          '2024-01-01': [
            {
              id: '123',
              name: 'Test Asteroid',
              estimated_diameter: { meters: { estimated_diameter_max: 100 } },
              close_approach_data: [{
                relative_velocity: { kilometers_per_second: 20 },
                close_approach_date: '2024-01-01',
                miss_distance: { kilometers: '1000000' }
              }],
              is_potentially_hazardous_asteroid: false,
              orbital_data: { orbit_class: { orbit_class_type: 'Apollo' } }
            }
          ]
        }
      });

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/meteors');
        expect(nasaService.getNeoFeed).toHaveBeenCalled();
      });
    });
  });

  describe('State Management', () => {
    test('should update asteroid parameters', async () => {
      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await act(async () => {
        screen.getByTestId('set-params').click();
      });

      expect(screen.getByTestId('asteroid-diameter')).toHaveTextContent('200');
      expect(screen.getByTestId('asteroid-velocity')).toHaveTextContent('25');
      expect(screen.getByTestId('asteroid-angle')).toHaveTextContent('60');
      expect(screen.getByTestId('asteroid-composition')).toHaveTextContent('stone');
    });

    test('should update view state', async () => {
      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await act(async () => {
        screen.getByTestId('set-view').click();
      });

      expect(screen.getByTestId('view')).toHaveTextContent('orbit');
    });

    test('should update impact location', async () => {
      const TestLocationComponent = () => {
        const { impactLocation } = useSimulation();
        return (
          <div>
            <div data-testid="latitude">{impactLocation.latitude}</div>
            <div data-testid="longitude">{impactLocation.longitude}</div>
          </div>
        );
      };

      render(
        <SimulationProvider>
          <TestLocationComponent />
          <TestComponent />
        </SimulationProvider>
      );

      await act(async () => {
        screen.getByTestId('set-location').click();
      });

      expect(screen.getByTestId('latitude')).toHaveTextContent('40.7128');
      expect(screen.getByTestId('longitude')).toHaveTextContent('-74.006');
    });
  });

  describe('Meteor Data Fetching', () => {
    test('should fetch meteor data successfully', async () => {
      const mockMeteorData = [
        { id: 1, name: 'Test Meteor 1', diameter: 50, velocity: 15, angle: 30, composition: 'stone' },
        { id: 2, name: 'Test Meteor 2', diameter: 75, velocity: 18, angle: 45, composition: 'iron' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMeteorData,
      });

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('meteor-data-length')).toHaveTextContent('2');
      });
    });

    test('should use fallback data when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('meteor-data-length')).toHaveTextContent('3');
      });
    });
  });

  describe('NASA Asteroid Data Fetching', () => {
    test('should fetch NASA data successfully', async () => {
      const mockNasaData = {
        near_earth_objects: {
          '2024-01-01': [
            {
              id: '123',
              name: 'Test Asteroid',
              estimated_diameter: { meters: { estimated_diameter_max: 100 } },
              close_approach_data: [{
                relative_velocity: { kilometers_per_second: 20 },
                close_approach_date: '2024-01-01',
                miss_distance: { kilometers: '1000000' }
              }],
              is_potentially_hazardous_asteroid: false,
              orbital_data: { orbit_class: { orbit_class_type: 'Apollo' } }
            }
          ]
        }
      };

      nasaService.getNeoFeed.mockResolvedValueOnce(mockNasaData);

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nasa-asteroid-data-length')).toHaveTextContent('1');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nasaAsteroidData',
        expect.any(String)
      );
    });

    test('should use cached data when available and fresh', async () => {
      const cachedData = JSON.stringify([
        { id: 'cached-1', name: 'Cached Asteroid', diameter: 150 }
      ]);
      const recentTimestamp = (Date.now() - 30 * 60 * 1000).toString(); // 30 minutes ago

      localStorageMock.getItem
        .mockReturnValueOnce(cachedData)
        .mockReturnValueOnce(recentTimestamp);

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nasa-asteroid-data-length')).toHaveTextContent('1');
      });

      expect(nasaService.getNeoFeed).not.toHaveBeenCalled();
    });

    test('should use fallback data when NASA API fails', async () => {
      nasaService.getNeoFeed.mockRejectedValueOnce(new Error('NASA API Error'));

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nasa-asteroid-data-length')).toHaveTextContent('2');
      });
    });
  });

  describe('Simulation Execution', () => {
    test('should run simulation with backend API', async () => {
      const mockSimulationResponse = {
        energy: 1000000,
        craterDiameter: 50,
        impactLocation: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: '2024-01-01T00:00:00.000Z',
        id: 'sim-123'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSimulationResponse,
      });

      const TestSimulationComponent = () => {
        const { simulationResults, simulationHistory } = useSimulation();
        return (
          <div>
            <div data-testid="simulation-energy">{simulationResults?.energy || 'null'}</div>
            <div data-testid="simulation-crater">{simulationResults?.craterDiameter || 'null'}</div>
            <div data-testid="history-length">{simulationHistory.length}</div>
          </div>
        );
      };

      render(
        <SimulationProvider>
          <TestComponent />
          <TestSimulationComponent />
        </SimulationProvider>
      );

      await act(async () => {
        screen.getByTestId('run-simulation').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('simulation-energy')).toHaveTextContent('1000000');
        expect(screen.getByTestId('simulation-crater')).toHaveTextContent('50');
        expect(screen.getByTestId('history-length')).toHaveTextContent('1');
      });
    });

    test('should fallback to client-side calculation when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const TestSimulationComponent = () => {
        const { simulationResults, simulationHistory } = useSimulation();
        return (
          <div>
            <div data-testid="simulation-energy">{simulationResults?.energy || 'null'}</div>
            <div data-testid="simulation-crater">{simulationResults?.craterDiameter || 'null'}</div>
            <div data-testid="history-length">{simulationHistory.length}</div>
          </div>
        );
      };

      render(
        <SimulationProvider>
          <TestComponent />
          <TestSimulationComponent />
        </SimulationProvider>
      );

      await act(async () => {
        screen.getByTestId('run-simulation').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('simulation-energy')).not.toHaveTextContent('null');
        expect(screen.getByTestId('simulation-crater')).not.toHaveTextContent('null');
        expect(screen.getByTestId('history-length')).toHaveTextContent('1');
      });
    });

    test('should clear simulation history', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const TestHistoryComponent = () => {
        const { simulationHistory } = useSimulation();
        return <div data-testid="history-count">{simulationHistory.length}</div>;
      };

      render(
        <SimulationProvider>
          <TestComponent />
          <TestHistoryComponent />
        </SimulationProvider>
      );

      // Run a simulation to create history
      await act(async () => {
        screen.getByTestId('run-simulation').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1');
      });

      // Clear history
      await act(async () => {
        screen.getByTestId('clear-history').click();
      });

      expect(screen.getByTestId('history-count')).toHaveTextContent('0');
    });
  });

  describe('Hook Usage', () => {
    test('should throw error when useSimulation is used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        useSimulation();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useSimulation must be used within a SimulationProvider');

      console.error = originalError;
    });
  });

  describe('Loading States', () => {
    test('should show loading state during simulation', async () => {
      fetch.mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            energy: 1000000,
            craterDiameter: 50,
            impactLocation: { latitude: 0, longitude: 0 },
          }),
        }), 100);
      }));

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      await act(async () => {
        screen.getByTestId('run-simulation').click();
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    test('should show NASA data loading state', async () => {
      nasaService.getNeoFeed.mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({
          near_earth_objects: { '2024-01-01': [] }
        }), 100);
      }));

      render(
        <SimulationProvider>
          <TestComponent />
        </SimulationProvider>
      );

      expect(screen.getByTestId('nasa-data-loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('nasa-data-loading')).toHaveTextContent('false');
      });
    });
  });
});
