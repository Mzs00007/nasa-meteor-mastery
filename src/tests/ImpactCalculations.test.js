import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdvancedPhysicsEngine } from '../utils/AdvancedPhysicsEngine';
import DataAnalysisPanel from '../components/impact-map/DataAnalysisPanel';
import RealTimeDataFeed from '../components/impact-map/RealTimeDataFeed';
import ImpactVisualizationDashboard from '../components/impact-map/ImpactVisualizationDashboard';

// Mock external dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    canvas: ({ children, ...props }) => <canvas {...props}>{children}</canvas>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

describe('Enhanced Physics Engine Tests', () => {
  let physicsEngine;
  
  beforeEach(() => {
    physicsEngine = new AdvancedPhysicsEngine();
  });

  describe('Basic Impact Calculations', () => {
    test('calculates kinetic energy correctly', () => {
      const meteorParams = {
        diameter: 100, // meters
        velocity: 20, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);
      
      // Expected kinetic energy: 0.5 * mass * velocity^2
      // Mass = (4/3) * π * r^3 * density
      // For stone: density = 3000 kg/m³
      const radius = meteorParams.diameter / 2;
      const volume = (4/3) * Math.PI * Math.pow(radius, 3);
      const mass = volume * 3000; // stone density
      const expectedKineticEnergy = 0.5 * mass * Math.pow(meteorParams.velocity, 2);
      
      expect(results.kineticEnergy).toBeCloseTo(expectedKineticEnergy, -6); // Within 1 MJ
      expect(results.kineticEnergy).toBeGreaterThan(0);
    });

    test('calculates TNT equivalent correctly', () => {
      const meteorParams = {
        diameter: 50,
        velocity: 15, // km/s
        composition: 'iron',
        angle: 60,
        altitude: 80000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);
      
      // TNT equivalent should be kinetic energy / 4.184e9 (J per ton TNT)
      const expectedTNT = results.kineticEnergy / 4.184e9;
      
      expect(results.tntEquivalent).toBeCloseTo(expectedTNT, 3);
      expect(results.tntEquivalent).toBeGreaterThan(0);
    });

    test('calculates crater diameter using scaling laws', () => {
      const meteorParams = {
        diameter: 200,
        velocity: 25, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 120000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);
       
       // Crater diameter should scale with energy^0.25 approximately
       expect(results.craterDiameter).toBeGreaterThan(meteorParams.diameter);
       expect(results.craterDiameter).toBeLessThan(meteorParams.diameter * 50); // Reasonable upper bound
     });
 
     test('handles different compositions correctly', () => {
       const baseParams = {
         diameter: 100,
         velocity: 20, // km/s
         angle: 45,
         altitude: 100000
       };
 
       const stoneResults = physicsEngine.calculateComprehensiveImpact({
         ...baseParams,
         composition: 'stone'
       });
 
       const ironResults = physicsEngine.calculateComprehensiveImpact({
         ...baseParams,
         composition: 'iron'
       });
 
       const stonyIronResults = physicsEngine.calculateComprehensiveImpact({
         ...baseParams,
         composition: 'stony-iron'
       });

      // Iron should have higher kinetic energy due to higher density
      expect(ironResults.kineticEnergy).toBeGreaterThan(stoneResults.kineticEnergy);
      expect(stonyIronResults.kineticEnergy).toBeGreaterThan(stoneResults.kineticEnergy);
      expect(stonyIronResults.kineticEnergy).toBeLessThan(ironResults.kineticEnergy);
    });
  });

  describe('Atmospheric Entry Calculations', () => {
    test('calculates atmospheric density correctly', () => {
      const altitudes = [0, 10000, 50000, 100000];
      const densities = altitudes.map(alt => 
        physicsEngine.calculateAtmosphericDensity(alt)
      );

      // Density should decrease with altitude
      for (let i = 1; i < densities.length; i++) {
        expect(densities[i]).toBeLessThan(densities[i-1]);
      }

      // Sea level density should be approximately 1.225 kg/m³
      expect(densities[0]).toBeCloseTo(1.225, 2);
    });

    test('calculates drag force correctly', () => {
      const meteorParams = {
        diameter: 100,
        velocity: 20, // km/s
        composition: 'stone'
      };

      const dragForce = physicsEngine.calculateDragForce(
        meteorParams.velocity,
        meteorParams.diameter,
        1.225 // sea level density
      );

      // Drag force should be positive and proportional to velocity squared
      expect(dragForce).toBeGreaterThan(0);
      
      const dragForceDoubleVelocity = physicsEngine.calculateDragForce(
        meteorParams.velocity * 2,
        meteorParams.diameter,
        1.225
      );
      
      expect(dragForceDoubleVelocity).toBeCloseTo(dragForce * 4, -3);
    });

    test('simulates atmospheric entry correctly', () => {
      const meteorParams = {
        diameter: 100,
        velocity: 20, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const entryResults = physicsEngine.simulateAtmosphericEntry(meteorParams);

      expect(entryResults).toHaveProperty('finalVelocity');
      expect(entryResults).toHaveProperty('ablationMass');
      expect(entryResults).toHaveProperty('fragmentationAltitude');
      expect(entryResults).toHaveProperty('heatGenerated');

      // Final velocity should be less than initial velocity due to atmospheric drag
      expect(entryResults.finalVelocity).toBeLessThan(meteorParams.velocity);
      expect(entryResults.finalVelocity).toBeGreaterThan(0);

      // Some mass should be lost to ablation
      expect(entryResults.ablationMass).toBeGreaterThan(0);
    });
  });

  describe('Blast and Damage Calculations', () => {
    test('calculates blast radius correctly', () => {
      const meteorParams = {
        diameter: 100,
        velocity: 20, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);

      // Blast radius should scale with energy^(1/3) approximately
      expect(results.blastRadius).toBeGreaterThan(0);
      expect(results.blastRadius).toBeLessThan(100000); // Reasonable upper bound in meters
    });

    test('calculates seismic magnitude correctly', () => {
      const meteorParams = {
        diameter: 1000, // Large meteor
        velocity: 30, // km/s
        composition: 'iron',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);

      expect(results.seismicMagnitude).toBeGreaterThan(0);
      expect(results.seismicMagnitude).toBeLessThan(15); // Reasonable upper bound
    });

    test('estimates casualties based on population density', () => {
      const meteorParams = {
        diameter: 500,
        velocity: 25, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);

      expect(results.estimatedCasualties).toBeGreaterThanOrEqual(0);
      expect(typeof results.estimatedCasualties).toBe('number');
    });
  });

  describe('Environmental Effects', () => {
    test('calculates environmental effects correctly', () => {
      const meteorParams = {
        diameter: 1000,
        velocity: 30, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);

      expect(results.environmentalEffects).toHaveProperty('dustCloudRadius');
      expect(results.environmentalEffects).toHaveProperty('temperatureChange');
      expect(results.environmentalEffects).toHaveProperty('ozoneDamage');
      expect(results.environmentalEffects).toHaveProperty('radiationExposure');

      expect(results.environmentalEffects.dustCloudRadius).toBeGreaterThan(0);
    });
  });

  describe('Economic Impact', () => {
    test('estimates economic damage correctly', () => {
      const meteorParams = {
        diameter: 200,
        velocity: 20, // km/s
        composition: 'iron',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateComprehensiveImpact(meteorParams);

      expect(results.economicImpact).toHaveProperty('infrastructureDamage');
      expect(results.economicImpact).toHaveProperty('agriculturalLoss');
      expect(results.economicImpact).toHaveProperty('evacuationCosts');
      expect(results.economicImpact).toHaveProperty('totalEconomicLoss');

      expect(results.economicImpact.totalEconomicLoss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles zero diameter', () => {
      const meteorParams = {
        diameter: 0,
        velocity: 20, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateImpact(meteorParams);
      
      expect(results.kineticEnergy).toBe(0);
      expect(results.craterDiameter).toBe(0);
      expect(results.blastRadius).toBe(0);
    });

    test('handles zero velocity', () => {
      const meteorParams = {
        diameter: 100,
        velocity: 0,
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateImpact(meteorParams);
      
      expect(results.kineticEnergy).toBe(0);
      expect(results.tntEquivalent).toBe(0);
    });

    test('handles extreme values', () => {
      const meteorParams = {
        diameter: 10000, // 10km diameter
        velocity: 70, // Very high velocity
        composition: 'iron',
        angle: 90, // Vertical impact
        altitude: 200000
      };

      const results = physicsEngine.calculateImpact(meteorParams);
      
      expect(results.kineticEnergy).toBeGreaterThan(0);
      expect(results.kineticEnergy).toBeLessThan(Infinity);
      expect(results.craterDiameter).toBeGreaterThan(0);
      expect(results.seismicMagnitude).toBeGreaterThan(0);
    });

    test('handles invalid composition', () => {
      const meteorParams = {
        diameter: 100,
        velocity: 20, // km/s
        composition: 'invalid',
        angle: 45,
        altitude: 100000
      };

      const results = physicsEngine.calculateImpact(meteorParams);
      
      // Should default to stone composition
      expect(results.kineticEnergy).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('calculation performance is acceptable', () => {
      const meteorParams = {
        diameter: 100,
        velocity: 20, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        physicsEngine.calculateImpact(meteorParams);
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;
      
      // Each calculation should take less than 10ms
      expect(averageTime).toBeLessThan(10);
    });

    test('caching works correctly', () => {
      const meteorParams = {
        diameter: 100,
        velocity: 20, // km/s
        composition: 'stone',
        angle: 45,
        altitude: 100000
      };

      // First calculation
      const startTime1 = performance.now();
      const results1 = physicsEngine.calculateImpact(meteorParams);
      const endTime1 = performance.now();
      const time1 = endTime1 - startTime1;

      // Second calculation (should be cached)
      const startTime2 = performance.now();
      const results2 = physicsEngine.calculateImpact(meteorParams);
      const endTime2 = performance.now();
      const time2 = endTime2 - startTime2;

      // Results should be identical
      expect(results1).toEqual(results2);
      
      // Second calculation should be faster (cached)
      expect(time2).toBeLessThan(time1);
    });
  });
});

describe('Data Analysis Panel Tests', () => {
  const mockImpactResults = {
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
  };

  const mockSimulationHistory = [
    { timestamp: Date.now() - 3600000, results: mockImpactResults },
    { timestamp: Date.now() - 1800000, results: { ...mockImpactResults, tntEquivalent: 300 } },
    { timestamp: Date.now(), results: mockImpactResults }
  ];

  const mockNasaData = {
    asteroids: [
      { name: 'Test Asteroid', estimated_diameter_max: 500, close_approach_date: '2024-01-01' }
    ]
  };

  test('renders data analysis panel correctly', () => {
    render(
      <DataAnalysisPanel
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        nasaData={mockNasaData}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText(/Data Analysis/)).toBeInTheDocument();
    expect(screen.getByText(/Overview/)).toBeInTheDocument();
    expect(screen.getByText(/Statistics/)).toBeInTheDocument();
  });

  test('displays impact statistics correctly', () => {
    render(
      <DataAnalysisPanel
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        nasaData={mockNasaData}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText(/239/)).toBeInTheDocument(); // TNT equivalent
    expect(screen.getByText(/2.5/)).toBeInTheDocument(); // Crater diameter
    expect(screen.getByText(/6.2/)).toBeInTheDocument(); // Seismic magnitude
  });

  test('handles export functionality', () => {
    const mockOnExport = jest.fn();
    
    render(
      <DataAnalysisPanel
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        nasaData={mockNasaData}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByText(/Export Data/);
    fireEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalled();
  });

  test('calculates statistics correctly', () => {
    render(
      <DataAnalysisPanel
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        nasaData={mockNasaData}
        onExport={jest.fn()}
      />
    );

    // Should display average, min, max values from simulation history
    expect(screen.getByText(/Average/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum/)).toBeInTheDocument();
    expect(screen.getByText(/Minimum/)).toBeInTheDocument();
  });
});

describe('Real-Time Data Feed Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders real-time data feed correctly', () => {
    render(<RealTimeDataFeed onDataUpdate={jest.fn()} />);

    expect(screen.getByText(/Real-Time Data Feed/)).toBeInTheDocument();
    expect(screen.getByText(/Connection Status/)).toBeInTheDocument();
  });

  test('handles API fetch correctly', async () => {
    const mockData = {
      near_earth_objects: {
        '2024-01-01': [
          { name: 'Test Asteroid', estimated_diameter: { meters: { estimated_diameter_max: 100 } } }
        ]
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const mockOnDataUpdate = jest.fn();
    render(<RealTimeDataFeed onDataUpdate={mockOnDataUpdate} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Error'));

    const mockOnDataUpdate = jest.fn();
    render(<RealTimeDataFeed onDataUpdate={mockOnDataUpdate} />);

    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });
  });

  test('displays connection status correctly', () => {
    render(<RealTimeDataFeed onDataUpdate={jest.fn()} />);

    // Should show connecting status initially
    expect(screen.getByText(/Connecting/)).toBeInTheDocument();
  });
});

describe('Impact Visualization Dashboard Tests', () => {
  const mockImpactResults = {
    kineticEnergy: 1e15,
    tntEquivalent: 239,
    craterDiameter: 2.5,
    blastRadius: 15000,
    seismicMagnitude: 6.2,
    estimatedCasualties: 50000
  };

  const mockSimulationHistory = [
    { timestamp: Date.now() - 3600000, results: mockImpactResults },
    { timestamp: Date.now(), results: mockImpactResults }
  ];

  test('renders visualization dashboard correctly', () => {
    render(
      <ImpactVisualizationDashboard
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText(/Impact Visualization/)).toBeInTheDocument();
    expect(screen.getByText(/Overview/)).toBeInTheDocument();
  });

  test('displays different chart types', () => {
    render(
      <ImpactVisualizationDashboard
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText(/Bar Chart/)).toBeInTheDocument();
    expect(screen.getByText(/Line Chart/)).toBeInTheDocument();
    expect(screen.getByText(/Pie Chart/)).toBeInTheDocument();
  });

  test('handles tab switching correctly', () => {
    render(
      <ImpactVisualizationDashboard
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        onExport={jest.fn()}
      />
    );

    const energyTab = screen.getByText(/Energy Analysis/);
    fireEvent.click(energyTab);

    expect(screen.getByText(/Energy Distribution/)).toBeInTheDocument();
  });

  test('calculates risk assessment correctly', () => {
    render(
      <ImpactVisualizationDashboard
        impactResults={mockImpactResults}
        simulationHistory={mockSimulationHistory}
        onExport={jest.fn()}
      />
    );

    const riskTab = screen.getByText(/Risk Analysis/);
    fireEvent.click(riskTab);

    expect(screen.getByText(/Risk Level/)).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  test('physics engine integrates correctly with data analysis', () => {
    const physicsEngine = new EnhancedPhysicsEngine();
    
    const meteorParams = {
      diameter: 100,
      velocity: 20, // km/s
      composition: 'stone',
      angle: 45,
      altitude: 100000
    };

    const results = physicsEngine.calculateImpact(meteorParams);

    render(
      <DataAnalysisPanel
        impactResults={results}
        simulationHistory={[{ timestamp: Date.now(), results }]}
        nasaData={{}}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText(/Data Analysis/)).toBeInTheDocument();
  });

  test('all components work together correctly', () => {
    const physicsEngine = new AdvancedPhysicsEngine();
    
    const meteorParams = {
      diameter: 200,
      velocity: 25, // km/s
      composition: 'iron',
      angle: 60,
      altitude: 120000
    };

    const results = physicsEngine.calculateComprehensiveImpact(meteorParams);
    const simulationHistory = [{ timestamp: Date.now(), results }];

    const { container } = render(
      <div>
        <DataAnalysisPanel
          impactResults={results}
          simulationHistory={simulationHistory}
          nasaData={{}}
          onExport={jest.fn()}
        />
        <ImpactVisualizationDashboard
          impactResults={results}
          simulationHistory={simulationHistory}
          onExport={jest.fn()}
        />
        <RealTimeDataFeed onDataUpdate={jest.fn()} />
      </div>
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByText(/Data Analysis/)).toBeInTheDocument();
    expect(screen.getByText(/Impact Visualization/)).toBeInTheDocument();
    expect(screen.getByText(/Real-Time Data Feed/)).toBeInTheDocument();
  });
});

describe('Accuracy Validation Tests', () => {
  test('validates against known impact events', () => {
    const physicsEngine = new AdvancedPhysicsEngine();

    // Tunguska Event (1908) - estimated parameters
    const tunguskaParams = {
      diameter: 60, // estimated
      velocity: 27, // estimated (km/s)
      composition: 'stone',
      angle: 30, // estimated
      altitude: 8000 // estimated airburst altitude
    };

    const tunguskaResults = physicsEngine.calculateComprehensiveImpact(tunguskaParams);

    // Tunguska was estimated at 10-15 megatons
    expect(tunguskaResults.tntEquivalent).toBeGreaterThan(5);
    expect(tunguskaResults.tntEquivalent).toBeLessThan(30);

    // Chelyabinsk Event (2013) - known parameters
    const chelyabinskParams = {
      diameter: 20, // estimated
      velocity: 19, // estimated
      composition: 'stone',
      angle: 18, // estimated
      altitude: 23000 // estimated airburst altitude
    };

    const chelyabinskResults = physicsEngine.calculateComprehensiveImpact(chelyabinskParams);

    // Chelyabinsk was estimated at 0.4-0.5 megatons
    expect(chelyabinskResults.tntEquivalent).toBeGreaterThan(0.1);
    expect(chelyabinskResults.tntEquivalent).toBeLessThan(1.0);
  });

  test('validates scaling relationships', () => {
    const physicsEngine = new AdvancedPhysicsEngine();

    const baseParams = {
      diameter: 100,
      velocity: 20, // km/s
      composition: 'stone',
      angle: 45,
      altitude: 100000
    };

    // Test diameter scaling
    const results1 = physicsEngine.calculateComprehensiveImpact(baseParams);
    const results2 = physicsEngine.calculateComprehensiveImpact({
      ...baseParams,
      diameter: baseParams.diameter * 2
    });

    // Energy should scale with diameter^3 (mass scales with volume)
    const energyRatio = results2.kineticEnergy / results1.kineticEnergy;
    expect(energyRatio).toBeCloseTo(8, 0); // 2^3 = 8

    // Test velocity scaling
    const results3 = physicsEngine.calculateComprehensiveImpact({
      ...baseParams,
      velocity: baseParams.velocity * 2
    });

    // Energy should scale with velocity^2
    const velocityEnergyRatio = results3.kineticEnergy / results1.kineticEnergy;
    expect(velocityEnergyRatio).toBeCloseTo(4, 0); // 2^2 = 4
  });
});