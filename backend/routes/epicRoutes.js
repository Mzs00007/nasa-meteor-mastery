const express = require('express');
const router = express.Router();

// Mock EPIC data for fallback when NASA API is unavailable
const mockEPICData = [
  {
    identifier: "20240101_000000",
    caption: "This image was taken by NASA's EPIC camera onboard the NOAA DSCOVR spacecraft",
    image: "epic_1b_20240101000000",
    version: "03",
    centroid_coordinates: {
      lat: 0.0,
      lon: 0.0
    },
    dscovr_j2000_position: {
      x: -1234567.89,
      y: 234567.89,
      z: -345678.90
    },
    lunar_j2000_position: {
      x: 123456.78,
      y: -234567.89,
      z: 345678.90
    },
    sun_j2000_position: {
      x: 987654.32,
      y: -876543.21,
      z: 765432.10
    },
    attitude_quaternions: {
      q0: 0.1234,
      q1: 0.5678,
      q2: 0.9012,
      q3: 0.3456
    },
    date: "2024-01-01 00:00:00",
    coords: {
      centroid_coordinates: {
        lat: 0.0,
        lon: 0.0
      },
      dscovr_j2000_position: {
        x: -1234567.89,
        y: 234567.89,
        z: -345678.90
      },
      lunar_j2000_position: {
        x: 123456.78,
        y: -234567.89,
        z: 345678.90
      },
      sun_j2000_position: {
        x: 987654.32,
        y: -876543.21,
        z: 765432.10
      },
      attitude_quaternions: {
        q0: 0.1234,
        q1: 0.5678,
        q2: 0.9012,
        q3: 0.3456
      }
    }
  },
  {
    identifier: "20240101_120000",
    caption: "Earth as seen from the DSCOVR spacecraft showing the sunlit side of our planet",
    image: "epic_1b_20240101120000",
    version: "03",
    centroid_coordinates: {
      lat: 15.5,
      lon: -45.2
    },
    dscovr_j2000_position: {
      x: -1234567.89,
      y: 234567.89,
      z: -345678.90
    },
    lunar_j2000_position: {
      x: 123456.78,
      y: -234567.89,
      z: 345678.90
    },
    sun_j2000_position: {
      x: 987654.32,
      y: -876543.21,
      z: 765432.10
    },
    attitude_quaternions: {
      q0: 0.2345,
      q1: 0.6789,
      q2: 0.0123,
      q3: 0.4567
    },
    date: "2024-01-01 12:00:00",
    coords: {
      centroid_coordinates: {
        lat: 15.5,
        lon: -45.2
      },
      dscovr_j2000_position: {
        x: -1234567.89,
        y: 234567.89,
        z: -345678.90
      },
      lunar_j2000_position: {
        x: 123456.78,
        y: -234567.89,
        z: 345678.90
      },
      sun_j2000_position: {
        x: 987654.32,
        y: -876543.21,
        z: 765432.10
      },
      attitude_quaternions: {
        q0: 0.2345,
        q1: 0.6789,
        q2: 0.0123,
        q3: 0.4567
      }
    }
  },
  {
    identifier: "20240101_180000",
    caption: "Beautiful view of Earth showing cloud formations and continental features",
    image: "epic_1b_20240101180000",
    version: "03",
    centroid_coordinates: {
      lat: -22.8,
      lon: 78.3
    },
    dscovr_j2000_position: {
      x: -1234567.89,
      y: 234567.89,
      z: -345678.90
    },
    lunar_j2000_position: {
      x: 123456.78,
      y: -234567.89,
      z: 345678.90
    },
    sun_j2000_position: {
      x: 987654.32,
      y: -876543.21,
      z: 765432.10
    },
    attitude_quaternions: {
      q0: 0.3456,
      q1: 0.7890,
      q2: 0.1234,
      q3: 0.5678
    },
    date: "2024-01-01 18:00:00",
    coords: {
      centroid_coordinates: {
        lat: -22.8,
        lon: 78.3
      },
      dscovr_j2000_position: {
        x: -1234567.89,
        y: 234567.89,
        z: -345678.90
      },
      lunar_j2000_position: {
        x: 123456.78,
        y: -234567.89,
        z: 345678.90
      },
      sun_j2000_position: {
        x: 987654.32,
        y: -876543.21,
        z: 765432.10
      },
      attitude_quaternions: {
        q0: 0.3456,
        q1: 0.7890,
        q2: 0.1234,
        q3: 0.5678
      }
    }
  }
];

// GET /api/epic/images - Get EPIC images for a specific date or latest
router.get('/images', async (req, res) => {
  try {
    const { date } = req.query;
    
    console.log(`EPIC Images request - Date: ${date || 'latest'}`);
    
    // For now, return mock data since NASA API has connectivity issues
    // In production, this would attempt to fetch from NASA API first, then fallback to mock data
    
    const responseData = mockEPICData.map(item => ({
      ...item,
      // Generate image URL that points to a placeholder or cached image
      imageUrl: `https://epic.gsfc.nasa.gov/archive/natural/2024/01/01/png/${item.image}.png`
    }));
    
    res.json({
      success: true,
      data: responseData,
      count: responseData.length,
      date: date || new Date().toISOString().split('T')[0],
      source: 'fallback_data',
      message: 'Using fallback EPIC data due to NASA API connectivity issues'
    });
    
  } catch (error) {
    console.error('Error fetching EPIC images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EPIC images',
      error: error.message
    });
  }
});

// GET /api/epic/available - Get available dates for EPIC images
router.get('/available', async (req, res) => {
  try {
    // Return mock available dates
    const availableDates = [];
    const today = new Date();
    
    // Generate last 30 days as available dates
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      availableDates.push(date.toISOString().split('T')[0]);
    }
    
    res.json({
      success: true,
      data: availableDates,
      count: availableDates.length,
      source: 'fallback_data'
    });
    
  } catch (error) {
    console.error('Error fetching available EPIC dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available EPIC dates',
      error: error.message
    });
  }
});

module.exports = router;