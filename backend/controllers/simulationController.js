const { v4: uuidv4 } = require('uuid');
const { calculateTrajectory } = require('../utils/calculations');

// In-memory storage for simulations (would use a database in production)
const simulations = {};

/**
 * Run a new simulation
 * @route POST /api/simulations/run
 */
exports.runSimulation = async (req, res) => {
  try {
    const { asteroidParams } = req.body;
    
    if (!asteroidParams) {
      return res.status(400).json({
        success: false,
        message: 'Missing asteroid parameters'
      });
    }

    // Generate simulation ID
    const simulationId = uuidv4();
    
    // Calculate trajectory and impact
    const trajectory = calculateTrajectory(asteroidParams);
    
    // Generate impact location
    const impactLocation = {
      lat: parseFloat((Math.random() * 140 - 70).toFixed(4)),
      lng: parseFloat((Math.random() * 340 - 170).toFixed(4))
    };
    
    // Calculate impact energy
    const { diameter, density, velocity, angle } = asteroidParams;
    const impactEnergy = calculateImpactEnergy(diameter, density, velocity, angle);
    
    // Calculate crater diameter
    const craterDiameter = calculateCraterDiameter(impactEnergy);
    
    // Store simulation results
    simulations[simulationId] = {
      id: simulationId,
      timestamp: new Date(),
      asteroidParams,
      trajectory,
      impactLocation,
      impactEnergy,
      craterDiameter
    };

    res.json({
      success: true,
      data: {
        simulationId,
        impactLocation,
        impactEnergy,
        craterDiameter,
        trajectory: trajectory.slice(0, 10) // Send partial trajectory to reduce payload
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error running simulation',
      error: error.message
    });
  }
};

/**
 * Get simulation results by ID
 * @route GET /api/simulations/:id
 */
exports.getSimulationResults = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!simulations[id]) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    res.json({
      success: true,
      data: simulations[id]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching simulation results',
      error: error.message
    });
  }
};

// Helper functions
function calculateImpactEnergy(diameter, density, velocity, angle) {
  // Convert diameter from meters to kilometers
  const radiusKm = diameter / 2000;
  
  // Calculate volume in cubic kilometers
  const volumeKm3 = (4/3) * Math.PI * Math.pow(radiusKm, 3);
  
  // Calculate mass in kilograms
  const massKg = volumeKm3 * density * 1e12;
  
  // Calculate kinetic energy in joules (1/2 * m * v^2)
  const velocityMs = velocity * 1000; // Convert km/s to m/s
  const kineticEnergyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  
  // Apply angle factor (vertical impact has maximum energy transfer)
  const angleFactor = Math.sin(angle * Math.PI / 180);
  
  // Convert to megatons of TNT (1 megaton = 4.184e15 joules)
  const energyMegatons = (kineticEnergyJoules * Math.pow(angleFactor, 2)) / 4.184e15;
  
  return energyMegatons;
}

function calculateCraterDiameter(impactEnergyMegatons) {
  // Simplified formula based on energy scaling
  return Math.pow(impactEnergyMegatons, 1/3) * 0.015 * 1000; // in meters
}