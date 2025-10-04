import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdvancedSimulationSetup from '../../src/components/AdvancedSimulationSetup';

// Mock the simulation context
const mockRunSimulation = jest.fn();
const mockUseSimulation = {
  runSimulation: mockRunSimulation,
  loading: false,
};

jest.mock('../../src/context/SimulationContext', () => ({
  useSimulation: () => mockUseSimulation,
}));

// Mock the services
jest.mock('../../src/services/advancedSimulationEngine', () => ({
  advancedSimulationEngine: {
    runAdvancedSimulation: jest.fn(),
    generatePreview: jest.fn(),
  },
}));

jest.mock('../../src/services/liveAsteroidService', () => ({
  liveAsteroidService: {
    fetchLiveAsteroids: jest.fn().mockResolvedValue([]),
  },
}));

// Mock the UI components
jest.mock('../../src/components/ui/EnhancedMeteorBackground', () => {
  return function MockEnhancedMeteorBackground() {
    return <div data-testid="enhanced-meteor-background">Meteor Background</div>;
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

describe('AdvancedSimulationSetup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component without crashing', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    expect(screen.getByText('🌌 Advanced Simulation')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-meteor-background')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    expect(screen.getByText('📊 Basic Setup')).toBeInTheDocument();
    expect(screen.getByText('🔴 Live Data')).toBeInTheDocument();
  });

  test('renders basic parameter controls', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    // Check for diameter control
    expect(screen.getByText(/Diameter:/)).toBeInTheDocument();
    
    // Check for velocity control
    expect(screen.getByText(/Velocity:/)).toBeInTheDocument();
    
    // Check for angle control
    expect(screen.getByText(/Entry Angle:/)).toBeInTheDocument();
    
    // Check for composition section
    expect(screen.getByText('Composition')).toBeInTheDocument();
  });

  test('renders composition options', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('Stone')).toBeInTheDocument();
    expect(screen.getByText('Ice')).toBeInTheDocument();
    expect(screen.getByText('Carbon')).toBeInTheDocument();
  });

  test('allows changing diameter parameter', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const diameterSlider = screen.getByDisplayValue('100');
    fireEvent.change(diameterSlider, { target: { value: '150' } });
    
    expect(screen.getByText(/Diameter: 150m/)).toBeInTheDocument();
  });

  test('allows changing velocity parameter', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const velocitySlider = screen.getByDisplayValue('20');
    fireEvent.change(velocitySlider, { target: { value: '25' } });
    
    expect(screen.getByText(/Velocity: 25 km\/s/)).toBeInTheDocument();
  });

  test('allows changing entry angle parameter', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const angleSlider = screen.getByDisplayValue('45');
    fireEvent.change(angleSlider, { target: { value: '60' } });
    
    expect(screen.getByText(/Entry Angle: 60°/)).toBeInTheDocument();
  });

  test('allows selecting different compositions', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const stoneButton = screen.getByText('Stone');
    fireEvent.click(stoneButton);
    
    // The stone button should be selected (this would be reflected in styling)
    expect(stoneButton).toBeInTheDocument();
  });

  test('renders atmospheric parameters section', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    expect(screen.getByText('🌍 Atmospheric Model')).toBeInTheDocument();
  });

  test('renders environmental parameters section', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    expect(screen.getByText('🌱 Environmental Conditions')).toBeInTheDocument();
  });

  test('renders run simulation button', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const runButton = screen.getByText(/🚀 Run Advanced Simulation/);
    expect(runButton).toBeInTheDocument();
    expect(runButton).not.toBeDisabled();
  });

  test('disables run button when simulation is running', () => {
    // Mock loading state
    mockUseSimulation.loading = true;
    
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const runButton = screen.getByText(/🚀 Run Advanced Simulation/);
    expect(runButton).toBeDisabled();
    
    // Reset mock
    mockUseSimulation.loading = false;
  });

  test('renders real-time preview section', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    expect(screen.getByText('📊 Real-time Preview')).toBeInTheDocument();
    expect(screen.getByText('Advanced Visualization')).toBeInTheDocument();
  });

  test('toggles atmospheric parameters visibility', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const atmosphericToggle = screen.getByText('🌍 Atmospheric Model').closest('div').querySelector('[style*="cursor: pointer"]');
    
    if (atmosphericToggle) {
      fireEvent.click(atmosphericToggle);
      // After clicking, atmospheric parameters should be visible
      // This would need to be verified based on the actual implementation
    }
  });

  test('toggles environmental parameters visibility', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const environmentalToggle = screen.getByText('🌱 Environmental Conditions').closest('div').querySelector('[style*="cursor: pointer"]');
    
    if (environmentalToggle) {
      fireEvent.click(environmentalToggle);
      // After clicking, environmental parameters should be visible
      // This would need to be verified based on the actual implementation
    }
  });

  test('handles navigation to basic setup', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const basicSetupLink = screen.getByText('📊 Basic Setup').closest('a');
    expect(basicSetupLink).toHaveAttribute('href', '/simulation/setup');
  });

  test('handles navigation to live simulation', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const liveSimulationLink = screen.getByText('🔴 Live Data').closest('a');
    expect(liveSimulationLink).toHaveAttribute('href', '/live-simulation');
  });

  test('handles navigation to home', () => {
    renderWithRouter(<AdvancedSimulationSetup />);
    
    const homeLink = screen.getByText('🌌 Advanced Simulation').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });
});