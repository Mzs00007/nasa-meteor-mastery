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
    // Don't automatically fetch NASA data on app initialization
    // fetchNasaAsteroidData();
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

  // Comprehensive impact calculations
  const calculateCraterDiameter = (energy, velocity, angle) => {
    // Crater diameter formula based on energy (simplified)
    const energyMegatons = energy / (4.184e15); // Convert to megatons TNT
    return Math.pow(energyMegatons, 0.25) * 1.8 * 1609.34; // Convert to meters
  };

  const calculateCraterDepth = (diameter) => {
    return diameter * 0.2; // Depth is typically 20% of diameter
  };

  const calculateCasualties = (radius, populationDensity = 100) => {
    const area = Math.PI * Math.pow(radius * 1609.34, 2); // Convert miles to meters
    return Math.floor(area * populationDensity / 1000000); // People per sq km
  };

  const calculateFireballRadius = (energy) => {
    const energyMegatons = energy / (4.184e15);
    return Math.pow(energyMegatons, 0.4) * 1.5; // Miles
  };

  const calculateShockwaveDecibels = (energy) => {
    const energyMegatons = energy / (4.184e15);
    return 180 + 20 * Math.log10(energyMegatons);
  };

  const calculateWindSpeed = (energy, distance) => {
    const energyMegatons = energy / (4.184e15);
    const baseSpeed = Math.pow(energyMegatons, 0.33) * 500;
    return baseSpeed / Math.pow(distance, 0.7); // mph
  };

  const calculateEarthquakeMagnitude = (energy) => {
    const energyJoules = energy;
    return (Math.log10(energyJoules) - 4.8) / 1.5;
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

  const calculateComprehensiveImpactData = () => {
    try {
      const energy = calculateImpactEnergy();
      const energyMegatons = energy / (4.184e15);
      const velocityMph = asteroidParams.velocity * 2236.94; // km/s to mph
      
      // Crater calculations
      const craterDiameter = calculateCraterDiameter(energy, asteroidParams.velocity, asteroidParams.angle);
      const craterDepth = calculateCraterDepth(craterDiameter);
      const craterRadiusMiles = (craterDiameter / 2) / 1609.34;
      const craterCasualties = calculateCasualties(craterRadiusMiles, 150);

      // Fireball calculations
      const fireballRadius = calculateFireballRadius(energy);
      const fireballCasualties = calculateCasualties(fireballRadius, 120);
      const thirdDegreeBurnRadius = fireballRadius * 1.8;
      const secondDegreeBurnRadius = fireballRadius * 2.5;
      const clothesFireRadius = fireballRadius * 4.8;
      const treesFireRadius = fireballRadius * 8.9;

      // Shockwave calculations
      const shockwaveDecibels = calculateShockwaveDecibels(energy);
      const lungDamageRadius = Math.pow(energyMegatons, 0.33) * 2.1;
      const eardrumRuptureRadius = Math.pow(energyMegatons, 0.33) * 2.7;
      const buildingCollapseRadius = Math.pow(energyMegatons, 0.33) * 4.7;
      const homeCollapseRadius = Math.pow(energyMegatons, 0.33) * 6.2;
      const shockwaveCasualties = calculateCasualties(lungDamageRadius, 80);

      // Wind blast calculations
      const peakWindSpeed = calculateWindSpeed(energy, 1);
      const windBlastRadius = Math.pow(energyMegatons, 0.33) * 1.4;
      const homeLevelRadius = Math.pow(energyMegatons, 0.33) * 2.3;
      const tornadoRadius = Math.pow(energyMegatons, 0.33) * 4.1;
      const treesDownRadius = Math.pow(energyMegatons, 0.33) * 6.7;
      const windBlastCasualties = calculateCasualties(windBlastRadius, 100);

      // Earthquake calculations
      const earthquakeMagnitude = calculateEarthquakeMagnitude(energy);
      const earthquakeRadius = Math.pow(10, earthquakeMagnitude) * 0.01;
      const earthquakeCasualties = calculateCasualties(earthquakeRadius, 50);

      // Frequency calculation
      const impactFrequency = Math.pow(energyMegatons, 0.8) * 10000;

      return {
        energy,
        energyMegatons,
        velocityMph,
        impactFrequency,
        crater: {
          diameter: craterDiameter,
          depth: craterDepth,
          radiusMiles: craterRadiusMiles,
          casualties: craterCasualties,
          tntEquivalent: energyMegatons * 1e6 // tons
        },
        fireball: {
          radius: fireballRadius,
          casualties: fireballCasualties,
          thirdDegreeBurns: calculateCasualties(thirdDegreeBurnRadius, 80),
          secondDegreeBurns: calculateCasualties(secondDegreeBurnRadius, 60),
          clothesFireRadius,
          treesFireRadius
        },
        shockwave: {
          decibels: shockwaveDecibels,
          casualties: shockwaveCasualties,
          lungDamageRadius,
          eardrumRuptureRadius,
          buildingCollapseRadius,
          homeCollapseRadius
        },
        windBlast: {
          peakSpeed: peakWindSpeed,
          casualties: windBlastCasualties,
          windBlastRadius,
          homeLevelRadius,
          tornadoRadius,
          treesDownRadius
        },
        earthquake: {
          magnitude: earthquakeMagnitude,
          casualties: earthquakeCasualties,
          radius: earthquakeRadius
        }
      };
    } catch (err) {
      throw new Error(`Failed to calculate comprehensive impact data: ${err.message}`);
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
      // Calculate comprehensive impact data
      const impactData = calculateComprehensiveImpactData();
      const energy = impactData.energy;
      const craterDiameter = impactData.crater.diameter;

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
        impactData, // Include comprehensive impact data
        parameters: { ...asteroidParams }, // Include simulation parameters
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
            impactData, // Include comprehensive impact data in history
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
