import { render, screen } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import ImpactMap2D from '../../src/components/ImpactMap2D';
import { SimulationProvider } from '../../src/context/SimulationContext';

// Mock D3 and other dependencies
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    append: jest.fn(() => ({
      attr: jest.fn(() => ({
        style: jest.fn(() => ({
          call: jest.fn(),
        })),
      })),
    })),
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn(() => ({
              style: jest.fn(() => ({
                text: jest.fn(),
              })),
            })),
          })),
        })),
      })),
    })),
  })),
  geoMercator: jest.fn(() => ({
    scale: jest.fn(() => ({
      translate: jest.fn(() => ({
        center: jest.fn(),
      })),
    })),
  })),
  geoPath: jest.fn(() => ({
    pointRadius: jest.fn(),
  })),
}));

jest.mock('topojson-client', () => ({
  feature: jest.fn(() => ({
    features: [],
  })),
}));

describe('ImpactMap2D Component', () => {
  const mockContextValue = {
    currentSimulation: {
      impactLocation: { lat: 40.7128, lng: -74.006 },
      craterDiameter: 1000,
      impactEnergy: 1e6,
    },
    simulationHistory: [],
  };

  const renderWithProvider = (ui, { providerProps, ...renderOptions } = {}) => {
    return render(
      <SimulationProvider value={{ ...mockContextValue, ...providerProps }}>
        {ui}
      </SimulationProvider>,
      renderOptions
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderWithProvider(<ImpactMap2D />);
    expect(screen.getByText('2D Impact Map')).toBeInTheDocument();
  });

  test('renders map container', () => {
    renderWithProvider(<ImpactMap2D />);
    expect(screen.getByTestId('impact-map-container')).toBeInTheDocument();
  });

  test('renders legend section', () => {
    renderWithProvider(<ImpactMap2D />);
    expect(screen.getByText('Impact Scale')).toBeInTheDocument();
  });

  test('shows no impact message when no simulation data', () => {
    renderWithProvider(<ImpactMap2D />, {
      providerProps: { currentSimulation: null },
    });

    expect(
      screen.getByText('No impact simulation data available')
    ).toBeInTheDocument();
  });

  test('displays impact information when simulation data exists', () => {
    renderWithProvider(<ImpactMap2D />);

    expect(screen.getByText(/latitude:/i)).toBeInTheDocument();
    expect(screen.getByText(/longitude:/i)).toBeInTheDocument();
    expect(screen.getByText(/crater diameter:/i)).toBeInTheDocument();
    expect(screen.getByText(/impact energy:/i)).toBeInTheDocument();
  });

  test('formats impact energy correctly', () => {
    renderWithProvider(<ImpactMap2D />);

    expect(screen.getByText(/1\.00 MT/i)).toBeInTheDocument();
  });

  test('handles different energy magnitudes', () => {
    renderWithProvider(<ImpactMap2D />, {
      providerProps: {
        currentSimulation: {
          impactLocation: { lat: 40.7128, lng: -74.006 },
          craterDiameter: 1000,
          impactEnergy: 1e9, // 1 GT
        },
      },
    });

    expect(screen.getByText(/1\.00 GT/i)).toBeInTheDocument();
  });

  test('renders responsive design elements', () => {
    renderWithProvider(<ImpactMap2D />);

    const container = screen.getByTestId('impact-map-container');
    expect(container).toHaveClass('visualization-container');
    expect(container).toHaveClass('large');
  });
});
