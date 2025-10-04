import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import SimulationHistory from '../../src/components/SimulationHistory';
import { SimulationProvider } from '../../src/context/SimulationContext';

describe('SimulationHistory Component', () => {
  const mockSimulations = [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      asteroid: {
        diameter: 100,
        velocity: 20000,
        density: 3000,
        angle: 45,
        material: 'iron',
      },
      impactEnergy: 1.5e6,
      craterDiameter: 1200,
      impactLocation: { lat: 40.7128, lng: -74.006 },
    },
    {
      id: '2',
      timestamp: '2024-01-14T15:45:00Z',
      asteroid: {
        diameter: 50,
        velocity: 15000,
        density: 2500,
        angle: 30,
        material: 'stone',
      },
      impactEnergy: 5e5,
      craterDiameter: 600,
      impactLocation: { lat: 34.0522, lng: -118.2437 },
    },
  ];

  const mockContextValue = {
    currentSimulation: null,
    simulationHistory: mockSimulations,
    addSimulation: jest.fn(),
    setCurrentSimulation: jest.fn(),
    clearHistory: jest.fn(),
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
    renderWithProvider(<SimulationHistory />);
    expect(screen.getByText('Simulation History')).toBeInTheDocument();
  });

  test('renders history container', () => {
    renderWithProvider(<SimulationHistory />);
    expect(
      screen.getByTestId('simulation-history-container')
    ).toBeInTheDocument();
  });

  test('displays empty state when no history', () => {
    renderWithProvider(<SimulationHistory />, {
      providerProps: { simulationHistory: [] },
    });

    expect(screen.getByText('No simulation history yet')).toBeInTheDocument();
    expect(
      screen.getByText('Run your first simulation to see results here!')
    ).toBeInTheDocument();
  });

  test('displays simulation history items', () => {
    renderWithProvider(<SimulationHistory />);

    expect(screen.getByText('100 m')).toBeInTheDocument();
    expect(screen.getByText('20.00 km/s')).toBeInTheDocument();
    expect(screen.getByText('1.50 MT')).toBeInTheDocument();
    expect(screen.getByText('1.20 km')).toBeInTheDocument();
  });

  test('formats dates correctly', () => {
    renderWithProvider(<SimulationHistory />);

    expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/10:30 am/i)).toBeInTheDocument();
  });

  test('handles load previous simulation', () => {
    renderWithProvider(<SimulationHistory />);

    const loadButtons = screen.getAllByText('Load This Simulation');
    fireEvent.click(loadButtons[0]);

    expect(mockContextValue.setCurrentSimulation).toHaveBeenCalledWith(
      mockSimulations[0]
    );
  });

  test('handles clear history', () => {
    renderWithProvider(<SimulationHistory />);

    const clearButton = screen.getByText('Clear History');
    fireEvent.click(clearButton);

    expect(mockContextValue.clearHistory).toHaveBeenCalled();
  });

  test('displays correct number of history items', () => {
    renderWithProvider(<SimulationHistory />);

    const historyItems = screen.getAllByTestId('simulation-history-item');
    expect(historyItems).toHaveLength(2);
  });

  test('renders material type badges', () => {
    renderWithProvider(<SimulationHistory />);

    expect(screen.getByText('iron')).toBeInTheDocument();
    expect(screen.getByText('stone')).toBeInTheDocument();
    expect(screen.getByText('iron')).toHaveClass('badge');
    expect(screen.getByText('stone')).toHaveClass('badge');
  });

  test('formats energy values correctly for different magnitudes', () => {
    renderWithProvider(<SimulationHistory />, {
      providerProps: {
        simulationHistory: [
          {
            ...mockSimulations[0],
            impactEnergy: 1.5e9, // 1.5 GT
          },
        ],
      },
    });

    expect(screen.getByText('1.50 GT')).toBeInTheDocument();
  });

  test('renders with correct responsive classes', () => {
    renderWithProvider(<SimulationHistory />);

    const container = screen.getByTestId('simulation-history-container');
    expect(container).toHaveClass('history-panel-wrapper');
    expect(container).toHaveClass('mt-5');
  });
});
