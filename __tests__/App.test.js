import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import App from '../src/App';

// Mock the components to isolate App testing
jest.mock('../src/components/Navbar', () => () => (
  <div data-testid='navbar'>Navbar</div>
));
jest.mock('../src/components/AsteroidInput', () => () => (
  <div data-testid='asteroid-input'>AsteroidInput</div>
));
jest.mock('../src/components/SimulationHistory', () => () => (
  <div data-testid='simulation-history'>SimulationHistory</div>
));
jest.mock('../src/components/Orbit3DView', () => () => (
  <div data-testid='orbit-3d-view'>Orbit3DView</div>
));
jest.mock('../src/components/ImpactMap2D', () => () => (
  <div data-testid='impact-map-2d'>ImpactMap2D</div>
));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders all main sections', () => {
    render(<App />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('asteroid-input')).toBeInTheDocument();
    expect(screen.getByTestId('simulation-history')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-3d-view')).toBeInTheDocument();
    expect(screen.getByTestId('impact-map-2d')).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    render(<App />);

    // Check for main container classes
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    const mainContainer = screen
      .getByTestId('asteroid-input')
      .closest('.container-fluid');
    expect(mainContainer).toBeInTheDocument();
  });

  test('responsive design elements', () => {
    render(<App />);

    // Check for responsive grid classes
    const inputPanel = screen
      .getByTestId('asteroid-input')
      .closest('.col-xl-4');
    const visualizationPanel = screen
      .getByTestId('orbit-3d-view')
      .closest('.col-xl-8');

    expect(inputPanel).toBeInTheDocument();
    expect(visualizationPanel).toBeInTheDocument();
  });
});
