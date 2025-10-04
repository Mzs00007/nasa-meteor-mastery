const express = require('express');
const router = express.Router();
const { getMeteorData, calculateImpact } = require('../controllers/meteorController');

// Get meteor data
router.get('/', getMeteorData);

// Calculate impact based on parameters
router.post('/calculate-impact', calculateImpact);

module.exports = router;