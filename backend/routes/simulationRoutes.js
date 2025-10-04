const express = require('express');
const router = express.Router();
const { runSimulation, getSimulationResults } = require('../controllers/simulationController');

// Run a new simulation
router.post('/run', runSimulation);

// Get simulation results by ID
router.get('/:id', getSimulationResults);

module.exports = router;