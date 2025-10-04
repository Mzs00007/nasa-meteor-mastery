import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useSimulation } from '../context/SimulationContext';

import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import {
  GlassButton,
  GlassPanel,
  GlassCard,
  GlassInput,
  GlassNav,
  GlassStat,
  GlassSlider,
  GlassToggle,
  GlassSpinner,
} from './ui/GlassComponents';
import '../styles/glassmorphic.css';

const SimulationSetup = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAsteroid, setSelectedAsteroid] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'data', 'comparison'
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    nasaAsteroidData,
    nasaDataLoading,
    nasaDataError,
    asteroidParams,
    setAsteroidParams,
    runSimulation,
    simulationResults,
    impactLocation,
    loading,
  } = useSimulation();

  // Preset configurations
  const presets = [
    {
      id: 'chelyabinsk',
      name: 'Chelyabinsk',
      icon: '💥',
      diameter: 20,
      velocity: 19,
      angle: 18,
      composition: 'stone',
      description: 'Russian meteor event (2013)',
    },
    {
      id: 'tunguska',
      name: 'Tunguska',
      icon: '🌋',
      diameter: 60,
      velocity: 20,
      angle: 45,
      composition: 'ice',
      description: 'Siberian explosion (1908)',
    },
    {
      id: 'chicxulub',
      name: 'Chicxulub',
      icon: '🦖',
      diameter: 10000,
      velocity: 20,
      angle: 60,
      composition: 'iron',
      description: 'Dinosaur extinction event',
    },
  ];

  const materials = [
    {
      id: 'iron',
      name: 'Iron',
      icon: '🔩',
      density: 7800,
      description: 'Metallic asteroid',
    },
    {
      id: 'stone',
      name: 'Stone',
      icon: '🪨',
      density: 3000,
      description: 'Rocky asteroid',
    },
    {
      id: 'ice',
      name: 'Ice',
      icon: '❄️',
      density: 900,
      description: 'Icy comet',
    },
  ];

  useEffect(() => {
    if (selectedAsteroid) {
      const asteroid = nasaAsteroidData.find(a => a.id === selectedAsteroid);
      if (asteroid) {
        setAsteroidParams({
          ...asteroidParams,
          diameter: asteroid.diameter,
          velocity: asteroid.velocity,
          name: asteroid.name,
        });
      }
    }
  }, [selectedAsteroid, nasaAsteroidData]);

  const handlePresetSelect = preset => {
    setActivePreset(preset.id);
    setAsteroidParams({
      ...asteroidParams,
      diameter: preset.diameter,
      velocity: preset.velocity,
      angle: preset.angle,
      composition: preset.composition,
    });
  };

  const handleParameterChange = (param, value) => {
    setAsteroidParams({
      ...asteroidParams,
      [param]: value,
    });
  };

  const handleRunSimulation = async () => {
    setSimulationRunning(true);
    try {
      await runSimulation(asteroidParams);
      // Navigate to results page after successful simulation
      navigate('/simulation/results');
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setSimulationRunning(false);
    }
  };

  return (
    <div className='min-h-screen relative overflow-hidden'>
      {/* Enhanced Meteor Background */}
      <EnhancedMeteorBackground />

      {/* Glass Navigation */}
      <GlassNav className='fixed top-0 left-0 right-0 z-50'>
        <div className='flex items-center justify-between px-6 py-4'>
          <Link
            to='/'
            className='text-xl font-bold text-white hover:text-blue-300 transition-colors'
          >
            🌌 Meteor Madness
          </Link>
          <div className='flex items-center space-x-4'>
            <Link to='/simulation/results'>
              <GlassButton
                variant='primary'
                size='sm'
                title='View detailed simulation results and analysis'
              >
                📊 View Results
              </GlassButton>
            </Link>
            <Link to='/impact'>
              <GlassButton
                variant='secondary'
                size='sm'
                title='Navigate to impact map visualization'
              >
                🗺️ Impact Map
              </GlassButton>
            </Link>
            <Link to='/history'>
              <GlassButton
                variant='secondary'
                size='sm'
                title='View simulation history and past results'
              >
                📊 History
              </GlassButton>
            </Link>
            <Link to='/nasa-integrations'>
              <GlassButton variant='secondary' size='sm'>
                🛰️ NASA Data
              </GlassButton>
            </Link>
          </div>
        </div>
      </GlassNav>

      {/* Main Content */}
      <div className='pt-20 min-h-screen flex flex-col lg:flex-row'>
        {/* Sidebar - Parameter Controls */}
        <div className='w-full lg:w-1/3 p-6 space-y-6'>
          {/* Header */}
          <GlassPanel className='p-6'>
            <h1 className='text-2xl font-bold text-white mb-2'>
              🚀 Simulation Setup
            </h1>
            <p className='text-gray-300 text-sm'>
              Configure asteroid parameters and run impact simulations using
              NASA data
            </p>
          </GlassPanel>

          {/* Quick Presets */}
          <GlassCard className='p-4'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              📋 Quick Presets
            </h3>
            <div className='grid grid-cols-1 gap-3'>
              {presets.map(preset => (
                <GlassButton
                  key={preset.id}
                  variant={activePreset === preset.id ? 'primary' : 'secondary'}
                  className='justify-start text-left p-4'
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-xl'>{preset.icon}</span>
                    <div>
                      <div className='font-medium'>{preset.name}</div>
                      <div className='text-xs opacity-75'>
                        {preset.description}
                      </div>
                    </div>
                  </div>
                </GlassButton>
              ))}
            </div>
          </GlassCard>

          {/* Asteroid Parameters */}
          <GlassCard className='p-4'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              🌠 Asteroid Parameters
            </h3>

            {/* Diameter */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Diameter: {asteroidParams.diameter}m
              </label>
              <GlassSlider
                min={1}
                max={10000}
                value={asteroidParams.diameter}
                onChange={value => handleParameterChange('diameter', value)}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-gray-400 mt-1'>
                <span>1m</span>
                <span>10km</span>
              </div>
            </div>

            {/* Velocity */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Velocity: {asteroidParams.velocity} km/s
              </label>
              <GlassSlider
                min={11}
                max={72}
                value={asteroidParams.velocity}
                onChange={value => handleParameterChange('velocity', value)}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-gray-400 mt-1'>
                <span>11 km/s</span>
                <span>72 km/s</span>
              </div>
            </div>

            {/* Entry Angle */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Entry Angle: {asteroidParams.angle}°
              </label>
              <GlassSlider
                min={0}
                max={90}
                value={asteroidParams.angle}
                onChange={value => handleParameterChange('angle', value)}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-gray-400 mt-1'>
                <span>0° (grazing)</span>
                <span>90° (vertical)</span>
              </div>
            </div>

            {/* Material Selection */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-300 mb-3'>
                Material Composition
              </label>
              <div className='grid grid-cols-3 gap-2'>
                {materials.map(material => (
                  <GlassButton
                    key={material.id}
                    variant={
                      asteroidParams.composition === material.id
                        ? 'primary'
                        : 'secondary'
                    }
                    size='sm'
                    className='flex flex-col items-center p-3'
                    onClick={() =>
                      handleParameterChange('composition', material.id)
                    }
                  >
                    <span className='text-lg mb-1'>{material.icon}</span>
                    <span className='text-xs'>{material.name}</span>
                  </GlassButton>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className='mb-4'>
              <GlassToggle
                checked={showAdvanced}
                onChange={setShowAdvanced}
                label='Advanced Options'
              />
            </div>

            {/* Advanced Parameters */}
            {showAdvanced && (
              <div className='space-y-4 border-t border-white/10 pt-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Impact Date
                  </label>
                  <GlassInput
                    type='date'
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className='w-full'
                  />
                </div>
              </div>
            )}
          </GlassCard>

          {/* NASA Real-time Data */}
          <GlassCard className='p-4'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              🛰️ NASA Real-time Data
            </h3>
            {nasaDataLoading ? (
              <div className='flex items-center justify-center py-4'>
                <GlassSpinner size='sm' />
                <span className='ml-2 text-sm text-gray-300'>
                  Loading NASA data...
                </span>
              </div>
            ) : nasaDataError ? (
              <div className='text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20'>
                {nasaDataError}
              </div>
            ) : (
              <div className='space-y-3'>
                <select
                  className='glass-input w-full'
                  value={selectedAsteroid}
                  onChange={e => setSelectedAsteroid(e.target.value)}
                >
                  <option value=''>Select a NASA asteroid</option>
                  {nasaAsteroidData.map(asteroid => (
                    <option key={asteroid.id} value={asteroid.id}>
                      {asteroid.name} ({asteroid.diameter}m, {asteroid.velocity}
                      km/s)
                      {asteroid.isPotentiallyHazardous ? ' ⚠️' : ''}
                    </option>
                  ))}
                </select>
                {selectedAsteroid && (
                  <div
                    className={`text-sm p-3 rounded-lg border ${
                      nasaAsteroidData.find(a => a.id === selectedAsteroid)
                        ?.isPotentiallyHazardous
                        ? 'bg-red-500/10 border-red-500/20 text-red-300'
                        : 'bg-green-500/10 border-green-500/20 text-green-300'
                    }`}
                  >
                    Selected:{' '}
                    {
                      nasaAsteroidData.find(a => a.id === selectedAsteroid)
                        ?.name
                    }
                    {nasaAsteroidData.find(a => a.id === selectedAsteroid)
                      ?.isPotentiallyHazardous && ' ⚠️ POTENTIALLY HAZARDOUS'}
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          {/* Run Simulation Button */}
          <GlassButton
            variant='primary'
            size='lg'
            className='w-full'
            onClick={handleRunSimulation}
            disabled={simulationRunning || loading}
            title='Start asteroid impact simulation with current parameters'
          >
            {simulationRunning || loading ? (
              <>
                <GlassSpinner size='sm' className='mr-2' />
                Running Simulation...
              </>
            ) : (
              <>🚀 Launch Simulation</>
            )}
          </GlassButton>
        </div>

        {/* Main Display Area */}
        <div className='w-full lg:w-2/3 p-6 space-y-6'>
          {/* View Mode Toggle */}
          <GlassPanel className='p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold text-white'>
                📊 Simulation Display
              </h2>
              <div className='flex space-x-2'>
                <GlassButton
                  variant={viewMode === '3d' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setViewMode('3d')}
                  title='Switch to 3D trajectory and impact visualization'
                >
                  🌐 3D View
                </GlassButton>
                <GlassButton
                  variant={viewMode === 'data' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setViewMode('data')}
                  title='Switch to detailed numerical analysis and charts'
                >
                  📈 Data View
                </GlassButton>
                <GlassButton
                  variant={viewMode === 'comparison' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setViewMode('comparison')}
                  title='Compare simulation results with historical events'
                >
                  ⚖️ Comparison
                </GlassButton>
              </div>
            </div>
          </GlassPanel>

          {/* Results Display */}
          <GlassCard className='p-6 min-h-[500px]'>
            {simulationResults ? (
              <div className='space-y-6'>
                {/* Results Header */}
                <div className='text-center'>
                  <h3 className='text-2xl font-bold text-white mb-2'>
                    🎯 Simulation Results
                  </h3>
                  <p className='text-gray-300'>
                    Impact analysis for {asteroidParams.diameter}m{' '}
                    {asteroidParams.composition} asteroid
                  </p>
                </div>

                {/* Key Statistics */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                  <GlassStat
                    label='Impact Energy'
                    value={`${(simulationResults.impactEnergy / 1e15).toFixed(2)} MT`}
                    icon='💥'
                  />
                  <GlassStat
                    label='Crater Diameter'
                    value={`${(simulationResults.craterDiameter / 1000).toFixed(1)} km`}
                    icon='🕳️'
                  />
                  <GlassStat
                    label='Impact Location'
                    value={impactLocation ? `${impactLocation.latitude.toFixed(2)}°, ${impactLocation.longitude.toFixed(2)}°` : 'Not calculated'}
                    icon='🎯'
                  />
                  <GlassStat
                    label='Simulation ID'
                    value={simulationResults.simulationId.slice(0, 8)}
                    icon='🆔'
                  />
                </div>

                {/* Visualization Area */}
                <div className='bg-black/20 rounded-lg p-6 min-h-[300px] flex items-center justify-center border border-white/10'>
                  <div className='text-center text-gray-300'>
                    <div className='text-4xl mb-4'>🌌</div>
                    <div className='text-lg font-medium mb-2'>
                      3D Visualization
                    </div>
                    <p className='text-sm'>
                      {viewMode === '3d' &&
                        'Interactive 3D trajectory and impact visualization'}
                      {viewMode === 'data' &&
                        'Detailed numerical analysis and charts'}
                      {viewMode === 'comparison' &&
                        'Comparison with historical events'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-center h-full min-h-[400px]'>
                <div className='text-center text-gray-400'>
                  <div className='text-6xl mb-4'>🌠</div>
                  <div className='text-xl font-medium mb-2'>
                    Ready for Simulation
                  </div>
                  <p className='text-sm max-w-md'>
                    Configure your asteroid parameters and click "Launch
                    Simulation" to see the impact analysis
                  </p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SimulationSetup;
