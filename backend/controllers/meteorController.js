const { calculateEnergyFromParams } = require('../utils/calculations');
const { getRandomMeteorData } = require('../data/meteorData');

/**
 * Get meteor data
 * @route GET /api/meteors
 */
exports.getMeteorData = async (req, res) => {
  try {
    const meteorData = getRandomMeteorData();
    res.json({
      success: true,
      data: meteorData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meteor data',
      error: error.message
    });
  }
};

/**
 * Calculate impact based on parameters
 * @route POST /api/meteors/calculate-impact
 */
exports.calculateImpact = async (req, res) => {
  try {
    const { diameter, density, velocity, angle } = req.body;
    
    if (!diameter || !density || !velocity || !angle) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Calculate impact energy
    const impactEnergy = calculateEnergyFromParams(diameter, density, velocity, angle);
    
    // Calculate crater diameter (simplified formula)
    const craterDiameter = Math.pow(impactEnergy, 1/3) * 0.015;
    
    // Generate random impact location
    const impactLocation = {
      lat: (Math.random() * 140 - 70).toFixed(4),
      lng: (Math.random() * 340 - 170).toFixed(4)
    };

    res.json({
      success: true,
      data: {
        impactEnergy,
        craterDiameter,
        impactLocation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating impact',
      error: error.message
    });
  }
};