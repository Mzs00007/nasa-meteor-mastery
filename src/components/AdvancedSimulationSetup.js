import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useSimulation } from '../context/SimulationContext';
import { advancedSimulationEngine } from '../services/advancedSimulationEngine';
import { liveAsteroidService } from '../services/liveAsteroidService';

// Glass UI Components
import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';

const AdvancedSimulationSetup = () => {
  const navigate = useNavigate();
  const { runSimulation, loading } = useSimulation();

  // Advanced simulation parameters
  const [advancedParams, setAdvancedParams] = useState({
    // Basic parameters
    diameter: 100,
    velocity: 20,
    angle: 45,
    composition: 'iron',

    // Advanced atmospheric parameters
    atmosphericDensity: 1.0,
    entryAltitude: 100000,
    fragmentationModel: 'pancake',
    ablationModel: 'detailed',
    shockwaveModel: 'advanced',

    // Target parameters
    targetLocation: { lat: 0, lng: 0 },
    targetTerrain: 'land',
    targetPopulation: 'urban',

    // Environmental conditions
    weatherConditions: 'clear',
    seasonalEffects: true,
    magneticFieldEffects: true,
  });

  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAtmospheric, setShowAtmospheric] = useState(false);
  const [showEnvironmental, setShowEnvironmental] = useState(false);
  const [liveAsteroids, setLiveAsteroids] = useState([]);
  const [selectedLiveAsteroid, setSelectedLiveAsteroid] = useState('');
  const [realTimePreview, setRealTimePreview] = useState(null);

  // Material compositions with enhanced properties
  const compositions = [
    {
      id: 'iron',
      name: 'Iron',
      icon: '🔩',
      density: 7870,
      description: 'Dense metallic asteroid',
    },
    {
      id: 'stone',
      name: 'Stone',
      icon: '🪨',
      density: 3500,
      description: 'Rocky silicate asteroid',
    },
    {
      id: 'ice',
      name: 'Ice',
      icon: '🧊',
      density: 917,
      description: 'Icy comet-like object',
    },
    {
      id: 'carbonaceous',
      name: 'Carbon',
      icon: '⚫',
      density: 2200,
      description: 'Carbon-rich primitive asteroid',
    },
  ];

  // Fragmentation models
  const fragmentationModels = [
    {
      id: 'pancake',
      name: 'Pancake Model',
      description: 'Flattening and breakup',
    },
    {
      id: 'catastrophic',
      name: 'Catastrophic',
      description: 'Complete disruption',
    },
    {
      id: 'progressive',
      name: 'Progressive',
      description: 'Gradual fragmentation',
    },
  ];

  // Terrain types
  const terrainTypes = [
    { id: 'land', name: 'Land', icon: '🏔️' },
    { id: 'ocean', name: 'Ocean', icon: '🌊' },
    { id: 'ice', name: 'Ice Sheet', icon: '🧊' },
    { id: 'desert', name: 'Desert', icon: '🏜️' },
  ];

  // Load live asteroid data
  useEffect(() => {
    const loadLiveData = async () => {
      try {
        const data = await liveAsteroidService.getLiveAsteroids();
        setLiveAsteroids(data.slice(0, 20)); // Limit to 20 for performance
      } catch (error) {
        console.error('Failed to load live asteroid data:', error);
      }
    };

    loadLiveData();
  }, []);

  // Real-time parameter preview
  useEffect(() => {
    const generatePreview = async () => {
      try {
        // Quick estimation for real-time preview
        const mass =
          (4 / 3) *
            Math.PI *
            Math.pow(advancedParams.diameter / 2, 3) *
            compositions.find(c => c.id === advancedParams.composition)
              ?.density || 3500;

        const kineticEnergy =
          0.5 * mass * Math.pow(advancedParams.velocity * 1000, 2);
        const tntEquivalent = kineticEnergy / 4.184e9;
        const craterDiameter = 1.8 * Math.pow(tntEquivalent, 0.25) * 1000;

        setRealTimePreview({
          mass: mass,
          kineticEnergy: kineticEnergy,
          tntEquivalent: tntEquivalent,
          estimatedCraterDiameter: craterDiameter,
          devastationRadius: Math.pow(tntEquivalent / 1000, 1 / 3) * 1000,
        });
      } catch (error) {
        console.error('Preview calculation error:', error);
      }
    };

    const debounceTimer = setTimeout(generatePreview, 300);
    return () => clearTimeout(debounceTimer);
  }, [advancedParams]);

  const handleParameterChange = (param, value) => {
    setAdvancedParams(prev => ({
      ...prev,
      [param]: value,
    }));
  };

  const handleLiveAsteroidSelect = asteroidId => {
    const asteroid = liveAsteroids.find(a => a.id === asteroidId);
    if (asteroid) {
      setAdvancedParams(prev => ({
        ...prev,
        diameter: asteroid.diameter,
        velocity: asteroid.velocity,
        composition: asteroid.estimatedComposition || 'stone',
      }));
      setSelectedLiveAsteroid(asteroidId);
    }
  };

  const handleRunAdvancedSimulation = async () => {
    setSimulationRunning(true);
    try {
      console.log(
        '🚀 Running advanced simulation with parameters:',
        advancedParams
      );

      const results =
        await advancedSimulationEngine.runAdvancedSimulation(advancedParams);
      setSimulationResults(results);

      // Navigate to advanced results page
      navigate('/simulation/advanced-results', {
        state: { results, parameters: advancedParams },
      });
    } catch (error) {
      console.error('Advanced simulation failed:', error);
      alert(`Simulation failed: ${error.message}`);
    } finally {
      setSimulationRunning(false);
    }
  };

  const formatNumber = (num, decimals = 2) => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(decimals)}B`;
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(decimals)}M`;
    }
    if (num >= 1e3) {
      return `${(num / 1e3).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  return (
    <div className='min-h-screen relative overflow-hidden'>
      <EnhancedMeteorBackground />

      {/* Glass Navigation */}
      <nav 
        className='fixed top-0 left-0 right-0 z-50'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className='flex items-center justify-between px-6 py-4'>
          <Link
            to='/'
            className='text-xl font-bold text-white hover:text-blue-300 transition-colors'
          >
            🌌 Advanced Simulation
          </Link>
          <div className='flex items-center space-x-4'>
            <Link to='/simulation/setup'>
              <button 
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                📊 Basic Setup
              </button>
            </Link>
            <Link to='/live-simulation'>
              <button 
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                🛰️ Live Data
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className='pt-20 min-h-screen flex flex-col xl:flex-row'>
        {/* Left Panel - Parameters */}
        <div className='w-full xl:w-1/3 p-6 space-y-6 max-h-screen overflow-y-auto'>
          {/* Header */}
          <div 
            className='p-6'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h1 className='text-2xl font-bold text-white mb-2'>
              🔬 Advanced Simulation
            </h1>
            <p className='text-gray-300 text-sm'>
              Sophisticated atmospheric modeling and impact analysis
            </p>
          </div>

          {/* Live Asteroid Selection */}
          <div 
            className='p-4'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h3 className='text-lg font-semibold text-white mb-4'>
              🛰️ Live NASA Data
            </h3>
            <select
              className='glass-input w-full mb-3'
              value={selectedLiveAsteroid}
              onChange={e => handleLiveAsteroidSelect(e.target.value)}
            >
              <option value=''>Select live asteroid data</option>
              {liveAsteroids.map(asteroid => (
                <option key={asteroid.id} value={asteroid.id}>
                  {asteroid.name} - {asteroid.diameter}m, {asteroid.velocity}
                  km/s
                  {asteroid.isPotentiallyHazardous ? ' ⚠️' : ''}
                </option>
              ))}
            </select>
            {selectedLiveAsteroid && (
              <div className='text-xs text-green-300 bg-green-500/10 p-2 rounded border border-green-500/20'>
                Using live NASA data for{' '}
                {liveAsteroids.find(a => a.id === selectedLiveAsteroid)?.name}
              </div>
            )}
          </div>

          {/* Basic Parameters */}
          <div 
            className='p-4'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h3 className='text-lg font-semibold text-white mb-4'>
              🌠 Basic Parameters
            </h3>

            {/* Diameter */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Diameter: {advancedParams.diameter}m
              </label>
              <input
                type='range'
                min={1}
                max={10000}
                value={advancedParams.diameter}
                onChange={e => handleParameterChange('diameter', parseInt(e.target.value))}
                className='w-full'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  height: '8px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Velocity */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Velocity: {advancedParams.velocity} km/s
              </label>
              <input
                type='range'
                min={11}
                max={72}
                value={advancedParams.velocity}
                onChange={e => handleParameterChange('velocity', parseInt(e.target.value))}
                className='w-full'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  height: '8px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Entry Angle */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Entry Angle: {advancedParams.angle}°
              </label>
              <input
                type='range'
                min={0}
                max={90}
                value={advancedParams.angle}
                onChange={e => handleParameterChange('angle', parseInt(e.target.value))}
                className='w-full'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  height: '8px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Composition */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-300 mb-3'>
                Composition
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {compositions.map(comp => (
                  <button
                    key={comp.id}
                    className='flex flex-col items-center p-3'
                    onClick={() =>
                      handleParameterChange('composition', comp.id)
                    }
                    style={{
                      background: advancedParams.composition === comp.id 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))'
                        : 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${advancedParams.composition === comp.id 
                        ? 'rgba(59, 130, 246, 0.5)' 
                        : 'rgba(255, 255, 255, 0.2)'}`,
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <span className='text-lg mb-1'>{comp.icon}</span>
                    <span className='text-xs'>{comp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Atmospheric Parameters */}
          <div 
            className='p-4'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>
                🌍 Atmospheric Model
              </h3>
              <div 
                onClick={() => setShowAtmospheric(!showAtmospheric)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <span>Show</span>
                <div
                  style={{
                    width: '40px',
                    height: '20px',
                    background: showAtmospheric 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))'
                      : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: showAtmospheric ? '22px' : '2px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                </div>
              </div>
            </div>

            {showAtmospheric && (
              <div className='space-y-4'>
                {/* Atmospheric Density */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Atmospheric Density: {advancedParams.atmosphericDensity}x
                  </label>
                  <input
                    type='range'
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    value={advancedParams.atmosphericDensity}
                    onChange={e =>
                      handleParameterChange('atmosphericDensity', parseFloat(e.target.value))
                    }
                    className='w-full'
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      height: '8px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                {/* Entry Altitude */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Entry Altitude:{' '}
                    {(advancedParams.entryAltitude / 1000).toFixed(0)} km
                  </label>
                  <input
                    type='range'
                    min={50000}
                    max={200000}
                    step={5000}
                    value={advancedParams.entryAltitude}
                    onChange={e =>
                      handleParameterChange('entryAltitude', parseInt(e.target.value))
                    }
                    className='w-full'
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      height: '8px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                {/* Fragmentation Model */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Fragmentation Model
                  </label>
                  <select
                    className='glass-input w-full'
                    value={advancedParams.fragmentationModel}
                    onChange={e =>
                      handleParameterChange(
                        'fragmentationModel',
                        e.target.value
                      )
                    }
                  >
                    {fragmentationModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Environmental Parameters */}
          <div 
            className='p-4'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>
                🌎 Environmental Conditions
              </h3>
              <div 
                onClick={() => setShowEnvironmental(!showEnvironmental)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <span>Show</span>
                <div
                  style={{
                    width: '40px',
                    height: '20px',
                    background: showEnvironmental 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))'
                      : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: showEnvironmental ? '22px' : '2px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                </div>
              </div>
            </div>

            {showEnvironmental && (
              <div className='space-y-4'>
                {/* Target Terrain */}
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Target Terrain
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    {terrainTypes.map(terrain => (
                      <button
                        key={terrain.id}
                        className='flex items-center justify-center p-2'
                        onClick={() =>
                          handleParameterChange('targetTerrain', terrain.id)
                        }
                        style={{
                          background: advancedParams.targetTerrain === terrain.id 
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))'
                            : 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${advancedParams.targetTerrain === terrain.id 
                            ? 'rgba(59, 130, 246, 0.5)' 
                            : 'rgba(255, 255, 255, 0.2)'}`,
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        <span className='mr-1'>{terrain.icon}</span>
                        <span className='text-xs'>{terrain.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Location */}
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Latitude
                    </label>
                    <input
                      type='number'
                      min={-90}
                      max={90}
                      step={0.1}
                      value={advancedParams.targetLocation.lat}
                      onChange={e =>
                        handleParameterChange('targetLocation', {
                          ...advancedParams.targetLocation,
                          lat: parseFloat(e.target.value) || 0,
                        })
                      }
                      className='w-full'
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Longitude
                    </label>
                    <input
                      type='number'
                      min={-180}
                      max={180}
                      step={0.1}
                      value={advancedParams.targetLocation.lng}
                      onChange={e =>
                        handleParameterChange('targetLocation', {
                          ...advancedParams.targetLocation,
                          lng: parseFloat(e.target.value) || 0,
                        })
                      }
                      className='w-full'
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Run Simulation */}
          <button
            className='w-full'
            onClick={handleRunAdvancedSimulation}
            disabled={simulationRunning}
            style={{
              padding: '16px 24px',
              background: simulationRunning 
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: simulationRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              opacity: simulationRunning ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!simulationRunning) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!simulationRunning) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }
            }}
          >
            {simulationRunning ? (
              <>
                <span className='mr-2'>⏳</span>
                Running Advanced Simulation...
              </>
            ) : (
              <>🚀 Launch Advanced Simulation</>
            )}
          </button>
        </div>

        {/* Right Panel - Real-time Preview */}
        <div className='w-full xl:w-2/3 p-6 space-y-6'>
          {/* Real-time Preview */}
          <div 
            className='p-6'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h2 className='text-xl font-semibold text-white mb-4'>
              📊 Real-time Preview
            </h2>

            {realTimePreview && (
              <div className='grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                <div 
                  className='p-4'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className='text-2xl mb-2'>⚖️</div>
                  <div className='text-sm text-gray-300'>Mass</div>
                  <div className='text-lg font-semibold text-white'>{formatNumber(realTimePreview.mass)} kg</div>
                </div>
                <div 
                  className='p-4'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className='text-2xl mb-2'>⚡</div>
                  <div className='text-sm text-gray-300'>Kinetic Energy</div>
                  <div className='text-lg font-semibold text-white'>{formatNumber(realTimePreview.kineticEnergy / 1e15)} PJ</div>
                </div>
                <div 
                  className='p-4'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className='text-2xl mb-2'>💥</div>
                  <div className='text-sm text-gray-300'>TNT Equivalent</div>
                  <div className='text-lg font-semibold text-white'>{formatNumber(realTimePreview.tntEquivalent)} tons</div>
                </div>
                <div 
                  className='p-4'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className='text-2xl mb-2'>🕳️</div>
                  <div className='text-sm text-gray-300'>Crater Diameter</div>
                  <div className='text-lg font-semibold text-white'>{formatNumber(realTimePreview.estimatedCraterDiameter)} m</div>
                </div>
                <div 
                  className='p-4'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className='text-2xl mb-2'>💀</div>
                  <div className='text-sm text-gray-300'>Devastation Radius</div>
                  <div className='text-lg font-semibold text-white'>{formatNumber(realTimePreview.devastationRadius)} m</div>
                </div>
                <div 
                  className='p-4'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className='text-2xl mb-2'>
                    {compositions.find(c => c.id === advancedParams.composition)?.icon || '❓'}
                  </div>
                  <div className='text-sm text-gray-300'>Composition</div>
                  <div className='text-lg font-semibold text-white'>
                    {compositions.find(c => c.id === advancedParams.composition)?.name || 'Unknown'}
                  </div>
                </div>
              </div>
            )}

            {/* Visualization Placeholder */}
            <div 
              className='p-6 min-h-[400px] flex items-center justify-center'
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className='text-center text-gray-300'>
                <div className='text-6xl mb-4'>🌌</div>
                <div className='text-xl font-medium mb-2'>
                  Advanced Visualization
                </div>
                <p className='text-sm max-w-md'>
                  Real-time atmospheric entry modeling, fragmentation analysis,
                  and impact visualization
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSimulationSetup;
