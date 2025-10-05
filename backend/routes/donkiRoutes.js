const express = require('express');
const axios = require('axios');
const router = express.Router();

// NASA DONKI API configuration
const NASA_API_KEY = process.env.NASA_API_KEY || '0QqBLAX6AX8mBZjLyihSsd1LmA4Q3rfS0BVszjEF';
const DONKI_BASE_URL = 'https://api.nasa.gov/DONKI';

// Helper function to make DONKI API requests
async function makeDonkiRequest(endpoint, params = {}) {
  try {
    const url = `${DONKI_BASE_URL}${endpoint}`;
    const response = await axios.get(url, {
      params: {
        api_key: NASA_API_KEY,
        ...params
      },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error(`DONKI API Error for ${endpoint}:`, error.message);
    throw error;
  }
}

// Get space weather notifications
router.get('/notifications', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const params = {};
    
    if (type && type !== 'all') params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/notifications', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch space weather notifications',
      error: error.message
    });
  }
});

// Get solar flares
router.get('/flares', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/FLR', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch solar flares',
      error: error.message
    });
  }
});

// Get coronal mass ejections
router.get('/cme', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/CME', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coronal mass ejections',
      error: error.message
    });
  }
});

// Get geomagnetic storms
router.get('/storms', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/GST', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geomagnetic storms',
      error: error.message
    });
  }
});

// Get solar energetic particle events
router.get('/sep', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/SEP', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch solar energetic particle events',
      error: error.message
    });
  }
});

// Get magnetopause crossing events
router.get('/mpc', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/MPC', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch magnetopause crossing events',
      error: error.message
    });
  }
});

// Get radiation belt enhancement events
router.get('/rbe', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/RBE', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch radiation belt enhancement events',
      error: error.message
    });
  }
});

// Get high speed stream events
router.get('/hss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await makeDonkiRequest('/HSS', params);
    
    res.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch high speed stream events',
      error: error.message
    });
  }
});

module.exports = router;