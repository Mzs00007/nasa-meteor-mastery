// TypeScript Simulation Controller with comprehensive error handling and validation

import { v4 as uuidv4 } from 'uuid';
import {
  runImpactSimulation,
  validateAsteroidParams,
  AsteroidParams,
  SimulationResult
} from '../utils/physics-calculations';

/**
 * In-memory storage for simulations (would use a database in production)
 */
const simulations: Record<string, SimulationResult & { id: string; timestamp: Date }> = {};

/**
 * Run a new simulation
 */
export async function runSimulation(
  asteroidParams: AsteroidParams
): Promise<{
  success: boolean;
  data?: {
    simulationId: string;
    impactLocation: { lat: number; lng: number };
    impactEnergy: number;
    craterDiameter: number;
    trajectory: Array<{ x: number; y: number; z: number }>;
  };
  message?: string;
  error?: string;
}> {
  try {
    // Validate input parameters
    if (!asteroidParams) {
      return {
        success: false,
        message: 'Missing asteroid parameters'
      };
    }

    // Validate asteroid parameters
    const validationErrors = validateAsteroidParams(asteroidParams);
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: 'Invalid asteroid parameters',
        error: validationErrors.join(', ')
      };
    }

    // Generate simulation ID
    const simulationId = uuidv4();
    
    // Run the impact simulation
    const simulationResult = runImpactSimulation(asteroidParams);
    
    // Store simulation results
    simulations[simulationId] = {
      id: simulationId,
      timestamp: new Date(),
      ...simulationResult
    };

    return {
      success: true,
      data: {
        simulationId,
        impactLocation: simulationResult.impactLocation,
        impactEnergy: simulationResult.impactEnergy,
        craterDiameter: simulationResult.craterDiameter,
        trajectory: simulationResult.trajectory.slice(0, 10) // Send partial trajectory to reduce payload
      }
    };
  } catch (error) {
    console.error('Simulation error:', error);
    return {
      success: false,
      message: 'Error running simulation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get simulation results by ID
 */
export async function getSimulationResults(
  simulationId: string
): Promise<{
  success: boolean;
  data?: SimulationResult & { id: string; timestamp: Date };
  message?: string;
  error?: string;
}> {
  try {
    if (!simulationId) {
      return {
        success: false,
        message: 'Missing simulation ID'
      };
    }

    const simulation = simulations[simulationId];
    if (!simulation) {
      return {
        success: false,
        message: 'Simulation not found'
      };
    }

    return {
      success: true,
      data: simulation
    };
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    return {
      success: false,
      message: 'Error fetching simulation results',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all simulations (for debugging and monitoring)
 */
export async function getAllSimulations(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    timestamp: Date;
    asteroidParams: AsteroidParams;
    impactEnergy: number;
    craterDiameter: number;
  }>;
  message?: string;
  error?: string;
}> {
  try {
    const simulationList = Object.values(simulations).map(sim => ({
      id: sim.id,
      timestamp: sim.timestamp,
      asteroidParams: sim.asteroidParams,
      impactEnergy: sim.impactEnergy,
      craterDiameter: sim.craterDiameter
    }));

    return {
      success: true,
      data: simulationList
    };
  } catch (error) {
    console.error('Error fetching all simulations:', error);
    return {
      success: false,
      message: 'Error fetching simulations',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete simulation by ID
 */
export async function deleteSimulation(
  simulationId: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!simulationId) {
      return {
        success: false,
        message: 'Missing simulation ID'
      };
    }

    if (!simulations[simulationId]) {
      return {
        success: false,
        message: 'Simulation not found'
      };
    }

    delete simulations[simulationId];
    
    return {
      success: true,
      message: 'Simulation deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting simulation:', error);
    return {
      success: false,
      message: 'Error deleting simulation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clear all simulations (for testing and cleanup)
 */
export async function clearAllSimulations(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const simulationCount = Object.keys(simulations).length;
    Object.keys(simulations).forEach(key => {
      delete simulations[key];
    });

    return {
      success: true,
      message: `Cleared ${simulationCount} simulations`
    };
  } catch (error) {
    console.error('Error clearing simulations:', error);
    return {
      success: false,
      message: 'Error clearing simulations',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get simulation statistics
 */
export async function getSimulationStats(): Promise<{
  success: boolean;
  data?: {
    totalSimulations: number;
    averageImpactEnergy: number;
    maxImpactEnergy: number;
    minImpactEnergy: number;
    recentSimulations: Array<{
      id: string;
      timestamp: Date;
      impactEnergy: number;
    }>;
  };
  message?: string;
  error?: string;
}> {
  try {
    const simulationValues = Object.values(simulations);
    
    if (simulationValues.length === 0) {
      return {
        success: true,
        data: {
          totalSimulations: 0,
          averageImpactEnergy: 0,
          maxImpactEnergy: 0,
          minImpactEnergy: 0,
          recentSimulations: []
        }
      };
    }

    const impactEnergies = simulationValues.map(sim => sim.impactEnergy);
    const averageImpactEnergy = impactEnergies.reduce((sum, energy) => sum + energy, 0) / impactEnergies.length;
    const maxImpactEnergy = Math.max(...impactEnergies);
    const minImpactEnergy = Math.min(...impactEnergies);

    // Get recent simulations (last 5)
    const recentSimulations = simulationValues
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(sim => ({
        id: sim.id,
        timestamp: sim.timestamp,
        impactEnergy: sim.impactEnergy
      }));

    return {
      success: true,
      data: {
        totalSimulations: simulationValues.length,
        averageImpactEnergy,
        maxImpactEnergy,
        minImpactEnergy,
        recentSimulations
      }
    };
  } catch (error) {
    console.error('Error fetching simulation stats:', error);
    return {
      success: false,
      message: 'Error fetching simulation statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Export types for external use
 */
export type { AsteroidParams, SimulationResult };

export default {
  runSimulation,
  getSimulationResults,
  getAllSimulations,
  deleteSimulation,
  clearAllSimulations,
  getSimulationStats
};