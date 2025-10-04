import React, { createContext, useContext, useState, useEffect } from 'react';

import { API_URL } from '../config';
import { nasaService } from '../services/nasaService';

export const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const [asteroidParams, setAsteroidParams] = useState({
    diameter: 100, // meters
    velocity: 20, // km/s
    angle: 45, // degrees
    composition: 'iron', // iron, stone, or ice
  });

  const [impactLocation, setImpactLocation] = useState({
    latitude: 0,
    longitude: 0,
  });

  const [simulationResults, setSimulationResults] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meteorData, setMeteorData] = useState([]);
  const [nasaAsteroidData, setNasaAsteroidData] = useState([]);
  const [view, setView] = useState('both'); // both, orbit, impact
  const [nasaDataLoading, setNasaDataLoading] = useState(false);
  const [nasaDataError, setNasaDataError] = useState(null);

  // Fetch meteor data on component mount
  useEffect(() => {
    fetchMeteorData();
    fetchNasaAsteroidData();
  }, []);

  const fetchMeteorData = async () => {
    try {
      // If backend is not available, use fallback data
      const fallbackData = [
        {
          id: 1,
          name: 'Chelyabinsk',
          diameter: 20,
          velocity: 19,
          angle: 18,
          composition: 'stone',
        },
        {
          id: 2,
          name: 'Tunguska',
          diameter: 60,
          velocity: 20,
          angle: 45,
          composition: 'ice',
        },
        {
          id: 3,
          name: 'Chicxulub',
          diameter: 10000,
          velocity: 20,
          angle: 60,
          composition: 'iron',
        },
      ];

      try {
        const response = await fetch(`${API_URL}/api/meteors`);
        if (response.ok) {
          const data = await response.json();
          setMeteorData(data);
        } else {
          setMeteorData(fallbackData);
        }
      } catch (err) {
        setMeteorData(fallbackData);
      }
    } catch (err) {
      console.error('Failed to fetch meteor data:', err);
      setError('Failed to fetch meteor data. Using default values.');
    }
  };

  const fetchNasaAsteroidData = async () => {
    try {
      setNasaDataLoading(true);
      setNasaDataError(null);

      // Check if we have cached data that's less than 1 hour old
      const cachedData = localStorage.getItem('nasaAsteroidData');
      const cacheTimestamp = localStorage.getItem('nasaAsteroidDataTimestamp');

      if (cachedData && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        if (cacheAge < oneHour) {
          // Use cached data if it's fresh
          const parsedData = JSON.parse(cachedData);
          setNasaAsteroidData(parsedData);
          setNasaDataLoading(false);
          return;
        }
      }

      // Try to fetch real-time NASA NEO data
      const data = await nasaService.getNeoFeed();

      if (data && data.near_earth_objects) {
        // Transform NASA data into a format usable by our simulation
        const asteroids = Object.values(data.near_earth_objects)
          .flat()
          .filter(neo => neo.estimated_diameter && neo.close_approach_data)
          .map(neo => ({
            id: neo.id,
            name: neo.name,
            nasaId: neo.id,
            diameter: neo.estimated_diameter.meters.estimated_diameter_max,
            velocity:
              neo.close_approach_data[0]?.relative_velocity
                ?.kilometers_per_second || 20,
            approachDate: neo.close_approach_data[0]?.close_approach_date,
            missDistance: neo.close_approach_data[0]?.miss_distance?.kilometers,
            isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
            orbitClass:
              neo.orbital_data?.orbit_class?.orbit_class_type || 'Unknown',
            source: 'nasa',
          }))
          .filter(asteroid => asteroid.diameter > 0);

        setNasaAsteroidData(asteroids);

        // Cache the data for future use
        localStorage.setItem('nasaAsteroidData', JSON.stringify(asteroids));
        localStorage.setItem(
          'nasaAsteroidDataTimestamp',
          Date.now().toString()
        );
      } else {
        setNasaDataError('No real-time data available');
      }
    } catch (error) {
      console.error('Failed to fetch NASA asteroid data:', error);
      setNasaDataError('Failed to fetch real-time NASA data');

      // Fallback: use sample NASA-like data
      const fallbackAsteroids = [
        {
          id: 'nasa-2001fo32',
          name: '(2001 FO32)',
          nasaId: '2001FO32',
          diameter: 550,
          velocity: 34.4,
          approachDate: '2021-03-21',
          missDistance: '2000000',
          isPotentiallyHazardous: true,
          orbitClass: 'Apollo',
          source: 'nasa',
        },
        {
          id: 'nasa-99942',
          name: '99942 Apophis',
          nasaId: '99942',
          diameter: 370,
          velocity: 30.7,
          approachDate: '2029-04-13',
          missDistance: '31600',
          isPotentiallyHazardous: true,
          orbitClass: 'Aten',
          source: 'nasa',
        },
      ];

      setNasaAsteroidData(fallbackAsteroids);

      // Cache the fallback data as well
      localStorage.setItem(
        'nasaAsteroidData',
        JSON.stringify(fallbackAsteroids)
      );
      localStorage.setItem('nasaAsteroidDataTimestamp', Date.now().toString());
    } finally {
      setNasaDataLoading(false);
    }
  };

  const calculateImpactEnergy = () => {
    try {
      const density = {
        iron: 7800, // kg/m³
        stone: 3000,
        ice: 900,
      };

      const volume =
        (4 / 3) * Math.PI * Math.pow(asteroidParams.diameter / 2, 3);
      const mass = volume * density[asteroidParams.composition];
      const velocityMs = asteroidParams.velocity * 1000; // convert km/s to m/s
      const energy = 0.5 * mass * Math.pow(velocityMs, 2);

      return energy; // Joules
    } catch (err) {
      throw new Error(`Failed to calculate impact energy: ${err.message}`);
    }
  };

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to use backend API
      try {
        const response = await fetch(`${API_URL}/api/simulations/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(asteroidParams),
        });

        if (response.ok) {
          const data = await response.json();
          setImpactLocation({
            latitude: data.impactLocation.latitude,
            longitude: data.impactLocation.longitude,
          });
          setSimulationResults({
            energy: data.energy,
            craterDiameter: data.craterDiameter,
            timestamp: data.timestamp || new Date().toISOString(),
            id: data.id || `sim-${Date.now()}`,
          });

          // Add to simulation history
          setSimulationHistory(prev => [
            {
              id: data.id || `sim-${Date.now()}`,
              params: { ...asteroidParams },
              results: {
                energy: data.energy,
                craterDiameter: data.craterDiameter,
                impactLocation: data.impactLocation,
                timestamp: data.timestamp || new Date().toISOString(),
              },
            },
            ...prev.slice(0, 9), // Keep only the 10 most recent simulations
          ]);

          return;
        }
      } catch (err) {
        // Fallback to client-side calculation if API fails
      }
      const energy = calculateImpactEnergy();
      const craterDiameter = Math.pow(energy, 1 / 3) * 0.0123; // simplified crater estimation

      // Calculate random impact location
      const newLocation = {
        latitude: parseFloat((Math.random() * 180 - 90).toFixed(2)),
        longitude: parseFloat((Math.random() * 360 - 180).toFixed(2)),
      };

      const simulationId = `sim-${Date.now()}`;
      const timestamp = new Date().toISOString();

      setImpactLocation(newLocation);
      setSimulationResults({
        energy,
        craterDiameter,
        timestamp,
        id: simulationId,
      });

      // Add to simulation history
      setSimulationHistory(prev => [
        {
          id: simulationId,
          params: { ...asteroidParams },
          results: {
            energy,
            craterDiameter,
            impactLocation: newLocation,
            timestamp,
          },
        },
        ...prev.slice(0, 9), // Keep only the 10 most recent simulations
      ]);
    } catch (err) {
      setError(err.message);
      setSimulationResults(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSimulationHistory = () => {
    setSimulationHistory([]);
  };

  const value = {
    asteroidParams,
    setAsteroidParams,
    impactLocation,
    setImpactLocation,
    simulationResults,
    simulationHistory,
    clearSimulationHistory,
    loading,
    error,
    runSimulation,
    meteorData,
    nasaAsteroidData,
    nasaDataLoading,
    nasaDataError,
    fetchNasaAsteroidData,
    view,
    setView,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
