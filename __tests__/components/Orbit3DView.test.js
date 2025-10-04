import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Orbit3DView from '../../src/components/Orbit3DView';
import { SimulationProvider } from '../../src/context/SimulationContext';

// Mock Three.js and related dependencies
jest.mock('three', () => ({
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    domElement: document.createElement('div'),
  })),
  PerspectiveCamera: jest.fn(() => ({
    position: { set: jest.fn() },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn(),
  })),
  Scene: jest.fn(() => ({
    add: jest.fn(),
  })),
  Color: jest.fn(),
  AmbientLight: jest.fn(() => ({
    intensity: 0.3,
  })),
  DirectionalLight: jest.fn(() => ({
    position: { set: jest.fn() },
    intensity: 1.0,
    castShadow: true,
  })),
  PointLight: jest.fn(() => ({
    position: { set: jest.fn() },
    intensity: 2.0,
    distance: 1000,
  })),
  Mesh: jest.fn(() => ({
    position: { set: jest.fn() },
    rotation: { set: jest.fn() },
    scale: { set: jest.fn() },
  })),
  SphereGeometry: jest.fn(),
  MeshPhongMaterial: jest.fn(() => ({
    color: 0xffffff,
  })),
  MeshStandardMaterial: jest.fn(() => ({
    color: 0xffffff,
  })),
  TextureLoader: jest.fn(() => ({
    load: jest.fn((url, onLoad) => onLoad && onLoad({})),
  })),
  Group: jest.fn(() => ({
    add: jest.fn(),
    position: { set: jest.fn() },
    rotation: { set: jest.fn() },
  })),
  BufferGeometry: jest.fn(),
  LineBasicMaterial: jest.fn(),
  Line: jest.fn(),
  Vector3: jest.fn(() => ({
    set: jest.fn(),
  })),
}));

jest.mock('three/examples/jsm/controls/OrbitControls', () => {
  return jest.fn(() => ({
    update: jest.fn(),
  }));
});

jest.mock('three/examples/jsm/postprocessing/EffectComposer', () => {
  return jest.fn(() => ({
    addPass: jest.fn(),
    setSize: jest.fn(),
  }));
});

jest.mock('three/examples/jsm/postprocessing/RenderPass', () => {
  return jest.fn();
});

jest.mock('three/examples/jsm/postprocessing/UnrealBloomPass', () => {
  return jest.fn(() => ({
    strength: 1.0,
    radius: 0.5,
    threshold: 0.1,
  }));
});

describe('Orbit3DView Component', () => {
  const mockContextValue = {
    currentSimulation: {
      asteroid: {
        diameter: 100,
        velocity: 20000,
        trajectory: [],
      },
      impactLocation: { lat: 40.7128, lng: -74.006 },
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
    renderWithProvider(<Orbit3DView />);
    expect(screen.getByText('3D Orbit Visualization')).toBeInTheDocument();
  });

  test('renders visualization container', () => {
    renderWithProvider(<Orbit3DView />);
    expect(screen.getByTestId('orbit-3d-container')).toBeInTheDocument();
  });

  test('renders control buttons', () => {
    renderWithProvider(<Orbit3DView />);

    expect(screen.getByText('Solar System View')).toBeInTheDocument();
    expect(screen.getByText('Earth View')).toBeInTheDocument();
    expect(screen.getByText('Impact View')).toBeInTheDocument();
  });

  test('renders animation controls', () => {
    renderWithProvider(<Orbit3DView />);

    expect(screen.getByText('Animation Speed:')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  test('shows no simulation message when no data', () => {
    renderWithProvider(<Orbit3DView />, {
      providerProps: { currentSimulation: null },
    });

    expect(
      screen.getByText('No simulation data available')
    ).toBeInTheDocument();
  });

  test('handles view mode changes', () => {
    renderWithProvider(<Orbit3DView />);

    const solarSystemButton = screen.getByText('Solar System View');
    fireEvent.click(solarSystemButton);

    expect(solarSystemButton).toHaveClass('btn-primary');
  });

  test('updates animation speed', () => {
    renderWithProvider(<Orbit3DView />);

    const speedSlider = screen.getByRole('slider');
    fireEvent.change(speedSlider, { target: { value: '2' } });

    expect(speedSlider.value).toBe('2');
  });

  test('renders with correct styling classes', () => {
    renderWithProvider(<Orbit3DView />);

    const container = screen.getByTestId('orbit-3d-container');
    expect(container).toHaveClass('visualization-container');
    expect(container).toHaveClass('large');
  });

  test('displays current view mode information', () => {
    renderWithProvider(<Orbit3DView />);

    expect(screen.getByText(/current view:/i)).toBeInTheDocument();
    expect(screen.getByText('Solar System')).toBeInTheDocument();
  });
});
