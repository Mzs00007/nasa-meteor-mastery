import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import AsteroidInput from '../../src/components/AsteroidInput';
import {
  SimulationProvider,
  useSimulation,
} from '../../src/context/SimulationContext';

// Mock the API calls
jest.mock('../../src/utils/api', () => ({
  fetchAsteroidData: jest.fn().mockResolvedValue({
    name: 'Test Asteroid',
    diameter: 100,
    velocity: 20000,
    density: 3000,
  }),
}));

describe('AsteroidInput Component', () => {
  const mockContextValue = {
    currentSimulation: null,
    simulationHistory: [],
    addSimulation: jest.fn(),
    setCurrentSimulation: jest.fn(),
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
    renderWithProvider(<AsteroidInput />);
    expect(screen.getByText('Asteroid Parameters')).toBeInTheDocument();
  });

  test('renders all input fields', () => {
    renderWithProvider(<AsteroidInput />);

    expect(screen.getByLabelText(/diameter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/velocity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/density/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/angle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/material/i)).toBeInTheDocument();
  });

  test('renders action buttons', () => {
    renderWithProvider(<AsteroidInput />);

    expect(screen.getByText('Simulate Impact')).toBeInTheDocument();
    expect(screen.getByText('Fetch Random Asteroid')).toBeInTheDocument();
    expect(screen.getByText('Clear Form')).toBeInTheDocument();
  });

  test('handles form input changes', () => {
    renderWithProvider(<AsteroidInput />);

    const diameterInput = screen.getByLabelText(/diameter/i);
    fireEvent.change(diameterInput, { target: { value: '100' } });

    expect(diameterInput.value).toBe('100');
  });

  test('validates input values', () => {
    renderWithProvider(<AsteroidInput />);

    const diameterInput = screen.getByLabelText(/diameter/i);
    fireEvent.change(diameterInput, { target: { value: '-10' } });

    // Should show validation error
    expect(screen.getByText(/positive number/i)).toBeInTheDocument();
  });

  test('clears form when clear button is clicked', () => {
    renderWithProvider(<AsteroidInput />);

    const diameterInput = screen.getByLabelText(/diameter/i);
    fireEvent.change(diameterInput, { target: { value: '100' } });

    const clearButton = screen.getByText('Clear Form');
    fireEvent.click(clearButton);

    expect(diameterInput.value).toBe('');
  });

  test('disables simulate button when form is invalid', () => {
    renderWithProvider(<AsteroidInput />);

    const simulateButton = screen.getByText('Simulate Impact');
    expect(simulateButton).toBeDisabled();
  });

  test('enables simulate button when form is valid', () => {
    renderWithProvider(<AsteroidInput />);

    const diameterInput = screen.getByLabelText(/diameter/i);
    const velocityInput = screen.getByLabelText(/velocity/i);
    const densityInput = screen.getByLabelText(/density/i);

    fireEvent.change(diameterInput, { target: { value: '100' } });
    fireEvent.change(velocityInput, { target: { value: '20000' } });
    fireEvent.change(densityInput, { target: { value: '3000' } });

    const simulateButton = screen.getByText('Simulate Impact');
    expect(simulateButton).not.toBeDisabled();
  });
});
