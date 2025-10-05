const express = require('express');
const axios = require('axios');
const router = express.Router();

// Simple in-memory cache for NEO data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// NASA API configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const NASA_NEO_BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

// Helper function to check cache
function getCachedData(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}

// Helper function to set cache
function setCachedData(key, data) {
    cache.set(key, {
        data: data,
        timestamp: Date.now()
    });
}

// Helper function to validate date format
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// Helper function to get fallback data
function getFallbackNeoData() {
    const today = new Date().toISOString().split('T')[0];
    return {
        element_count: 3,
        status: "fallback",
        message: "Using fallback data due to API unavailability",
        near_earth_objects: {
            [today]: [
                {
                    id: "2023001",
                    name: "(2023 AA1)",
                    estimated_diameter: {
                        meters: {
                            estimated_diameter_min: 45.2,
                            estimated_diameter_max: 101.1
                        },
                        kilometers: {
                            estimated_diameter_min: 0.0452,
                            estimated_diameter_max: 0.1011
                        }
                    },
                    is_potentially_hazardous_asteroid: false,
                    close_approach_data: [
                        {
                            close_approach_date: today,
                            close_approach_date_full: `${today}T14:30`,
                            epoch_date_close_approach: Date.now(),
                            relative_velocity: {
                                kilometers_per_second: "18.7",
                                kilometers_per_hour: "67320.0",
                                miles_per_hour: "41825.5"
                            },
                            miss_distance: {
                                astronomical: "0.0234",
                                lunar: "9.1",
                                kilometers: "3500000",
                                miles: "2175000"
                            },
                            orbiting_body: "Earth"
                        }
                    ],
                    absolute_magnitude_h: 22.1,
                    nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2023001"
                },
                {
                    id: "2023002",
                    name: "(2023 BB2)",
                    estimated_diameter: {
                        meters: {
                            estimated_diameter_min: 120.5,
                            estimated_diameter_max: 269.8
                        },
                        kilometers: {
                            estimated_diameter_min: 0.1205,
                            estimated_diameter_max: 0.2698
                        }
                    },
                    is_potentially_hazardous_asteroid: true,
                    close_approach_data: [
                        {
                            close_approach_date: today,
                            close_approach_date_full: `${today}T09:15`,
                            epoch_date_close_approach: Date.now(),
                            relative_velocity: {
                                kilometers_per_second: "24.3",
                                kilometers_per_hour: "87480.0",
                                miles_per_hour: "54350.2"
                            },
                            miss_distance: {
                                astronomical: "0.0156",
                                lunar: "6.1",
                                kilometers: "2340000",
                                miles: "1454000"
                            },
                            orbiting_body: "Earth"
                        }
                    ],
                    absolute_magnitude_h: 19.8,
                    nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2023002"
                },
                {
                    id: "2023003",
                    name: "(2023 CC3)",
                    estimated_diameter: {
                        meters: {
                            estimated_diameter_min: 78.9,
                            estimated_diameter_max: 176.4
                        },
                        kilometers: {
                            estimated_diameter_min: 0.0789,
                            estimated_diameter_max: 0.1764
                        }
                    },
                    is_potentially_hazardous_asteroid: false,
                    close_approach_data: [
                        {
                            close_approach_date: today,
                            close_approach_date_full: `${today}T21:45`,
                            epoch_date_close_approach: Date.now(),
                            relative_velocity: {
                                kilometers_per_second: "15.2",
                                kilometers_per_hour: "54720.0",
                                miles_per_hour: "34000.8"
                            },
                            miss_distance: {
                                astronomical: "0.0445",
                                lunar: "17.3",
                                kilometers: "6670000",
                                miles: "4145000"
                            },
                            orbiting_body: "Earth"
                        }
                    ],
                    absolute_magnitude_h: 20.5,
                    nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2023003"
                }
            ]
        }
    };
}

// GET /api/neo/feed - Get NEO feed data
router.get('/feed', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Use today's date if no dates provided
        const today = new Date().toISOString().split('T')[0];
        const startDate = start_date || today;
        const endDate = end_date || today;
        
        // Validate date format
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).json({
                error: "Invalid date format. Use YYYY-MM-DD",
                status: "error"
            });
        }
        
        // Check cache first
        const cacheKey = `neo:feed:${startDate}:${endDate}`;
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        // Make request to NASA API
        const url = `${NASA_NEO_BASE_URL}/feed`;
        const params = {
            start_date: startDate,
            end_date: endDate,
            api_key: NASA_API_KEY
        };
        
        try {
            const response = await axios.get(url, { 
                params,
                timeout: 10000 // 10 second timeout
            });
            
            const data = response.data;
            
            // Cache the successful response
            setCachedData(cacheKey, data);
            
            return res.json(data);
            
        } catch (apiError) {
            console.error('NASA API Error:', apiError.message);
            
            // Return fallback data instead of error
            const fallbackData = getFallbackNeoData();
            setCachedData(cacheKey, fallbackData);
            
            return res.json(fallbackData);
        }
        
    } catch (error) {
        console.error('NEO feed error:', error);
        
        // Return fallback data for any other errors
        const fallbackData = getFallbackNeoData();
        res.json(fallbackData);
    }
});

// GET /api/neo/browse - Browse NEOs with pagination
router.get('/browse', async (req, res) => {
    try {
        const { page = 0, size = 20 } = req.query;
        
        // Check cache first
        const cacheKey = `neo:browse:${page}:${size}`;
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        // Make request to NASA API
        const url = `${NASA_NEO_BASE_URL}/neo/browse`;
        const params = {
            page: parseInt(page),
            size: parseInt(size),
            api_key: NASA_API_KEY
        };
        
        try {
            const response = await axios.get(url, { 
                params,
                timeout: 10000
            });
            
            const data = response.data;
            
            // Cache the successful response
            setCachedData(cacheKey, data);
            
            return res.json(data);
            
        } catch (apiError) {
            console.error('NASA API Error:', apiError.message);
            console.log('DEBUG: Returning fallback data for browse route');
            
            // Return fallback browse data
            const fallbackData = {
                page: {
                    size: parseInt(size),
                    total_elements: 0,
                    total_pages: 0,
                    number: parseInt(page)
                },
                near_earth_objects: [],
                status: "fallback"
            };
            
            return res.json(fallbackData);
        }
        
    } catch (error) {
        console.error('NEO browse error:', error);
        res.status(500).json({
            error: "Internal server error",
            status: "error"
        });
    }
});

// GET /api/neo/stats - Get NEO statistics
router.get('/stats', async (req, res) => {
    try {
        // Check cache first
        const cacheKey = 'neo:stats';
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        // Make request to NASA API
        const url = `${NASA_NEO_BASE_URL}/stats`;
        const params = {
            api_key: NASA_API_KEY
        };
        
        try {
            const response = await axios.get(url, { 
                params,
                timeout: 10000
            });
            
            const data = response.data;
            
            // Cache the successful response (longer TTL for stats)
            cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return res.json(data);
            
        } catch (apiError) {
            console.error('NASA API Error:', apiError.message);
            
            // Return fallback stats data
            const fallbackData = {
                near_earth_object_count: 34000,
                close_approach_count: 45000,
                last_updated: new Date().toISOString(),
                source: "NASA/JPL",
                nasa_jpl_url: "http://neo.jpl.nasa.gov/",
                status: "fallback"
            };
            
            return res.json(fallbackData);
        }
        
    } catch (error) {
        console.error('NEO stats error:', error);
        res.status(500).json({
            error: "Internal server error",
            status: "error"
        });
    }
});

// GET /api/neo/:id - Get specific NEO by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check cache first
        const cacheKey = `neo:lookup:${id}`;
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        
        // Make request to NASA API
        const url = `${NASA_NEO_BASE_URL}/neo/${id}`;
        const params = {
            api_key: NASA_API_KEY
        };
        
        try {
            const response = await axios.get(url, { 
                params,
                timeout: 10000
            });
            
            const data = response.data;
            
            // Cache the successful response
            setCachedData(cacheKey, data);
            
            return res.json(data);
            
        } catch (apiError) {
            if (apiError.response && apiError.response.status === 404) {
                return res.status(404).json({
                    error: "NEO not found",
                    status: "error"
                });
            }
            
            console.error('NASA API Error:', apiError.message);
            return res.status(500).json({
                error: "Failed to fetch NEO data",
                status: "error"
            });
        }
        
    } catch (error) {
        console.error('NEO lookup error:', error);
        res.status(500).json({
            error: "Internal server error",
            status: "error"
        });
    }
});


// GET /api/neo/stats - Get NEO statistics
module.exports = router;