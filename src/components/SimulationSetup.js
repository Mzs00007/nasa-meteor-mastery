import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useSimulation } from '../context/SimulationContext';

import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import Advanced2DImpactMap from './Advanced2DImpactMap';
import EnhancedInteractiveMap from './EnhancedInteractiveMap';
import RealisticImpactMap from './RealisticImpactMap';
import EnhancedSimulationResultsMap from './EnhancedSimulationResultsMap';
import Enhanced2DLocationSelector from './Enhanced2DLocationSelector';

import NavigationGuide from './NavigationGuide';
import GlamourousLaunchButton from './ui/GlamourousLaunchButton';
import SimulationProcessVisualization from './ui/SimulationProcessVisualization';
import SimulationDataView from './SimulationDataView';
import SimulationComparisonView from './SimulationComparisonView';
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
import {
  ModernSpinner,
  SkeletonText,
  SkeletonCard,
  LoadingButton,
  ProgressBar,
  LoadingOverlay
} from './ui/ModernLoadingComponents';
import '../styles/glassmorphic.css';

// Error Boundary Component
class SimulationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('SimulationSetup Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
          <GlassCard className="p-8 max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Simulation Error</h2>
            <p className="text-gray-300 mb-6">
              Something went wrong with the simulation setup. Please refresh the page and try again.
            </p>
            <GlassButton 
              onClick={() => window.location.reload()} 
              variant="primary"
            >
              🔄 Reload Page
            </GlassButton>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

const SimulationSetup = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAsteroid, setSelectedAsteroid] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [viewMode, setViewMode] = useState('2d-map'); // '2d-map', 'data', 'comparison'
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNavigationGuide, setShowNavigationGuide] = useState(false);
  const [simulationCompleted, setSimulationCompleted] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [visualizationComplete, setVisualizationComplete] = useState(false);
  const [showProcessVisualization, setShowProcessVisualization] = useState(false);

  const {
    nasaAsteroidData,
    nasaDataLoading,
    nasaDataError,
    asteroidParams,
    setAsteroidParams,
    runSimulation,
    simulationResults,
    impactLocation,
    setImpactLocation,
    loading,
    fetchNasaAsteroidData,
    preventNavigation,
    setPreventNavigation,
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
    if (selectedAsteroid && nasaAsteroidData?.length > 0) {
      try {
        const asteroid = nasaAsteroidData.find(a => a.id === selectedAsteroid);
        if (asteroid) {
          setAsteroidParams({
            ...asteroidParams,
            diameter: asteroid.diameter || 100,
            velocity: asteroid.velocity || 20,
            name: asteroid.name || 'Unknown Asteroid',
          });
        }
      } catch (error) {
        console.error('Error processing asteroid data:', error);
      }
    }
  }, [selectedAsteroid, nasaAsteroidData]);

  // Prevent navigation during simulation runs
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (preventNavigation) {
        e.preventDefault();
        e.returnValue = 'Simulation is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handlePopState = (e) => {
      if (preventNavigation) {
        const confirmLeave = window.confirm(
          'Simulation visualization is in progress. Are you sure you want to leave? Your progress will be lost.'
        );
        if (!confirmLeave) {
          e.preventDefault();
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    };

    if (preventNavigation) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      // Push current state to prevent back navigation
      window.history.pushState(null, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [preventNavigation]);

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
    setPreventNavigation(true);
    setSimulationCompleted(false);
    setVisualizationComplete(false);
    setUserNotes('');
    setShowProcessVisualization(true);
    
    try {
      // Validate parameters before running simulation
      if (!asteroidParams?.diameter || asteroidParams.diameter <= 0) {
        throw new Error('Invalid asteroid diameter');
      }
      if (!asteroidParams?.velocity || asteroidParams.velocity <= 0) {
        throw new Error('Invalid asteroid velocity');
      }
      if (!asteroidParams?.composition) {
        throw new Error('Asteroid composition not selected');
      }

      await runSimulation(asteroidParams);
      setSimulationCompleted(true);
      // Don't show navigation guide until user completes visualization
    } catch (error) {
      console.error('Simulation failed:', error);
      // Show user-friendly error message
      alert(`Simulation failed: ${error.message || 'Unknown error occurred'}`);
      setPreventNavigation(false);
      setShowProcessVisualization(false);
    } finally {
      setSimulationRunning(false);
    }
  };

  const handleProcessVisualizationComplete = (processResults) => {
    setShowProcessVisualization(false);
    
    // Process and store the actual simulation results
    if (processResults) {
      console.log('Simulation completed with results:', processResults);
      
      // Update simulation data with the comprehensive results
      const comprehensiveResults = {
        ...simulationResults,
        detailedResults: processResults,
        timestamp: new Date().toISOString(),
        impactLocation: impactLocation,
        asteroidParams: asteroidParams
      };
      
      // Store results for display in results page
      localStorage.setItem('lastSimulationResults', JSON.stringify(comprehensiveResults));
      
      // Note: simulationResults is managed by SimulationContext, no need to set it here
      console.log('Comprehensive results stored:', comprehensiveResults);
    }
  };

  const handleVisualizationComplete = (notes) => {
    setUserNotes(notes);
    setVisualizationComplete(true);
    setPreventNavigation(false);
    setShowNavigationGuide(true);
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
            {preventNavigation && (
              <div className='flex items-center space-x-3'>
                <div className='text-yellow-400 text-sm font-medium'>
                  🔒 Navigation locked during simulation
                </div>
                <GlassButton
                  variant='warning'
                  size='sm'
                  onClick={() => {
                    setPreventNavigation(false);
                    setShowProcessVisualization(false);
                  }}
                  title='Unlock navigation to move between pages'
                  className='animate-pulse'
                >
                  🔓 Unlock Navigation
                </GlassButton>
              </div>
            )}
            {preventNavigation ? (
              <GlassButton
                variant='secondary'
                size='sm'
                disabled
                title='Navigation disabled during simulation visualization'
                onClick={() => alert('Please complete the simulation visualization before navigating away.')}
              >
                📊 View Results
              </GlassButton>
            ) : (
              <Link to='/simulation/results'>
                <GlassButton
                  variant='primary'
                  size='sm'
                  title='View detailed simulation results and analysis'
                >
                  📊 View Results
                </GlassButton>
              </Link>
            )}
            {preventNavigation ? (
              <GlassButton
                variant='secondary'
                size='sm'
                disabled
                title='Navigation disabled during simulation visualization'
                onClick={() => alert('Please complete the simulation visualization before navigating away.')}
              >
                🗺️ Impact Map
              </GlassButton>
            ) : (
              <Link to='/impact'>
                <GlassButton
                  variant='secondary'
                  size='sm'
                  title='Navigate to impact map visualization'
                >
                  🗺️ Impact Map
                </GlassButton>
              </Link>
            )}
            {preventNavigation ? (
              <GlassButton
                variant='secondary'
                size='sm'
                disabled
                title='Navigation disabled during simulation visualization'
                onClick={() => alert('Please complete the simulation visualization before navigating away.')}
              >
                📊 History
              </GlassButton>
            ) : (
              <Link to='/history'>
                <GlassButton
                  variant='secondary'
                  size='sm'
                  title='View simulation history and past results'
                >
                  📊 History
                </GlassButton>
              </Link>
            )}
            {preventNavigation ? (
              <GlassButton
                variant='secondary'
                size='sm'
                disabled
                title='Navigation disabled during simulation visualization'
                onClick={() => alert('Please complete the simulation visualization before navigating away.')}
              >
                🛰️ NASA Data
              </GlassButton>
            ) : (
              <Link to='/nasa-integrations'>
                <GlassButton variant='secondary' size='sm'>
                  🛰️ NASA Data
                </GlassButton>
              </Link>
            )}
            {preventNavigation ? (
              <GlassButton
                variant='secondary'
                size='sm'
                disabled
                title='Navigation disabled during simulation visualization'
                onClick={() => alert('Please complete the simulation visualization before navigating away.')}
              >
                🌌 Solar System
              </GlassButton>
            ) : (
              <Link to='/solar-system'>
                <GlassButton variant='secondary' size='sm'>
                  🌌 Solar System
                </GlassButton>
              </Link>
            )}
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
          <GlassCard className='p-4 enhanced-form-card'>
            <div className="form-header">
              <h3 className='text-lg font-semibold text-white mb-2 flex items-center'>
                <span className="parameter-icon">🌠</span>
                Asteroid Parameters
              </h3>
              <p className="text-sm text-gray-400 mb-4">Configure the physical properties of your asteroid</p>
            </div>

            {/* Diameter */}
            <div className='mb-6 parameter-group'>
              <div className="parameter-header">
                <label className='block text-sm font-medium text-gray-300 mb-2 flex items-center justify-between'>
                  <span>Diameter</span>
                  <span className="parameter-value">{asteroidParams.diameter}m</span>
                </label>
                <div className="parameter-description text-xs text-gray-400 mb-3">
                  Size affects impact energy exponentially. Larger asteroids create devastating global effects.
                </div>
              </div>
              <div className="slider-container">
                <GlassSlider
                  min={1}
                  max={10000}
                  value={asteroidParams.diameter}
                  onChange={value => handleParameterChange('diameter', value)}
                  className='w-full enhanced-slider'
                />
                <div className='flex justify-between text-xs text-gray-400 mt-2'>
                  <span className="range-label">1m (small)</span>
                  <span className="range-label">10km (extinction-level)</span>
                </div>
              </div>
              <div className="impact-indicator mt-2">
                <div className={`impact-level ${asteroidParams.diameter < 100 ? 'low' : asteroidParams.diameter < 1000 ? 'medium' : 'high'}`}>
                  {asteroidParams.diameter < 100 && '🟢 Local damage'}
                  {asteroidParams.diameter >= 100 && asteroidParams.diameter < 1000 && '🟡 Regional impact'}
                  {asteroidParams.diameter >= 1000 && '🔴 Global catastrophe'}
                </div>
              </div>
            </div>

            {/* Velocity */}
            <div className='mb-6 parameter-group'>
              <div className="parameter-header">
                <label className='block text-sm font-medium text-gray-300 mb-2 flex items-center justify-between'>
                  <span>Velocity</span>
                  <span className="parameter-value">{asteroidParams.velocity} km/s</span>
                </label>
                <div className="parameter-description text-xs text-gray-400 mb-3">
                  Entry speed determines kinetic energy. Faster impacts create more devastating effects.
                </div>
              </div>
              <div className="slider-container">
                <GlassSlider
                  min={11}
                  max={72}
                  value={asteroidParams.velocity}
                  onChange={value => handleParameterChange('velocity', value)}
                  className='w-full enhanced-slider'
                />
                <div className='flex justify-between text-xs text-gray-400 mt-2'>
                  <span className="range-label">11 km/s (minimum)</span>
                  <span className="range-label">72 km/s (maximum)</span>
                </div>
              </div>
              <div className="velocity-indicator mt-2">
                <div className="text-xs text-blue-300">
                  ⚡ Kinetic Energy: ~{((asteroidParams.diameter ** 3) * (asteroidParams.velocity ** 2) / 1000000).toFixed(2)} relative units
                </div>
              </div>
            </div>

            {/* Entry Angle */}
            <div className='mb-6 parameter-group'>
              <div className="parameter-header">
                <label className='block text-sm font-medium text-gray-300 mb-2 flex items-center justify-between'>
                  <span>Entry Angle</span>
                  <span className="parameter-value">{asteroidParams.angle}°</span>
                </label>
                <div className="parameter-description text-xs text-gray-400 mb-3">
                  Steeper angles create deeper craters, while shallow angles cause wider destruction.
                </div>
              </div>
              <div className="slider-container">
                <GlassSlider
                  min={0}
                  max={90}
                  value={asteroidParams.angle}
                  onChange={value => handleParameterChange('angle', value)}
                  className='w-full enhanced-slider'
                />
                <div className='flex justify-between text-xs text-gray-400 mt-2'>
                  <span className="range-label">0° (grazing)</span>
                  <span className="range-label">90° (vertical)</span>
                </div>
              </div>
              <div className="angle-visualization mt-2">
                <div className="text-xs text-purple-300 flex items-center">
                  <span className="mr-2">📐</span>
                  {asteroidParams.angle < 30 && 'Shallow impact - wide destruction zone'}
                  {asteroidParams.angle >= 30 && asteroidParams.angle < 60 && 'Moderate angle - balanced impact'}
                  {asteroidParams.angle >= 60 && 'Steep impact - deep crater formation'}
                </div>
              </div>
            </div>

            {/* Material Selection */}
            <div className='mb-6 parameter-group'>
              <div className="parameter-header">
                <label className='block text-sm font-medium text-gray-300 mb-3'>
                  Material Composition
                </label>
                <div className="parameter-description text-xs text-gray-400 mb-4">
                  Different materials have varying densities and structural properties affecting impact dynamics.
                </div>
              </div>
              <div className='grid grid-cols-3 gap-3 material-grid'>
                {materials.map(material => (
                  <GlassButton
                    key={material.id}
                    variant={
                      asteroidParams.composition === material.id
                        ? 'primary'
                        : 'secondary'
                    }
                    size='sm'
                    className={`flex flex-col items-center p-4 material-button transition-all duration-300 ${
                      asteroidParams.composition === material.id ? 'selected-material' : ''
                    }`}
                    onClick={() =>
                      handleParameterChange('composition', material.id)
                    }
                  >
                    <span className='text-2xl mb-2 material-icon'>{material.icon}</span>
                    <span className='text-sm font-medium'>{material.name}</span>
                    <span className='text-xs text-gray-400 mt-1'>
                      {material.id === 'iron' && 'Dense, high impact'}
                      {material.id === 'stone' && 'Moderate density'}
                      {material.id === 'ice' && 'Low density, fragile'}
                    </span>
                  </GlassButton>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className='mb-4 advanced-toggle'>
              <GlassToggle
                checked={showAdvanced}
                onChange={setShowAdvanced}
                label='Advanced Options'
                className="enhanced-toggle"
              />
              <div className="text-xs text-gray-400 mt-1">
                Access additional simulation parameters and settings
              </div>
            </div>

            {/* Advanced Parameters */}
            {showAdvanced && (
              <div className='space-y-4 border-t border-white/10 pt-4 advanced-section animate-fadeIn'>
                <div className="parameter-group">
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Impact Date
                  </label>
                  <div className="parameter-description text-xs text-gray-400 mb-3">
                    Set the date for your simulation scenario
                  </div>
                  <GlassInput
                    type='date'
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className='w-full enhanced-input'
                  />
                </div>
              </div>
            )}
          </GlassCard>

          {/* NASA Real-time Data */}
          <GlassCard className='p-4'>
            <div className="flex items-center justify-between mb-4">
              <h3 className='text-lg font-semibold text-white'>
                🛰️ NASA Real-time Data
              </h3>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={fetchNasaAsteroidData}
                disabled={nasaDataLoading}
                className="text-xs"
              >
                {nasaDataLoading ? '🔄' : '🔄'} Refresh
              </GlassButton>
            </div>
            {nasaDataLoading ? (
              <div className='space-y-4'>
                <div className='flex items-center justify-center py-2'>
                  <ModernSpinner variant="orbit" size="sm" />
                  <span className='ml-3 text-sm text-gray-300'>
                    Fetching real-time asteroid data from NASA...
                  </span>
                </div>
                <SkeletonText lines={3} />
                <div className="space-y-2">
                  <div className="h-10 bg-white/5 rounded-lg animate-pulse"></div>
                  <SkeletonText lines={2} />
                </div>
              </div>
            ) : nasaDataError ? (
              <div className='text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20'>
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  {nasaDataError}
                </div>
                <GlassButton 
                  variant="secondary"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={fetchNasaAsteroidData}
                >
                  🔄 Retry Loading NASA Data
                </GlassButton>
              </div>
            ) : (
              <div className='space-y-3'>
                <select
                  className='glass-input w-full'
                  value={selectedAsteroid}
                  onChange={e => setSelectedAsteroid(e.target.value)}
                >
                  <option value=''>Select a NASA asteroid</option>
                  {nasaAsteroidData?.map(asteroid => (
                    <option key={asteroid?.id || Math.random()} value={asteroid?.id || ''}>
                      {asteroid?.name || 'Unknown'} ({asteroid?.diameter || 'N/A'}m, {asteroid?.velocity || 'N/A'}
                      km/s)
                      {asteroid?.isPotentiallyHazardous ? ' ⚠️' : ''}
                    </option>
                  )) || []}
                </select>
                {selectedAsteroid && (
                  <div
                    className={`text-sm p-3 rounded-lg border transition-all duration-300 ${
                      nasaAsteroidData?.find(a => a.id === selectedAsteroid)
                        ?.isPotentiallyHazardous
                        ? 'bg-red-500/10 border-red-500/20 text-red-300'
                        : 'bg-green-500/10 border-green-500/20 text-green-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">
                        {nasaAsteroidData?.find(a => a.id === selectedAsteroid)
                          ?.isPotentiallyHazardous ? '⚠️' : '✅'}
                      </span>
                      Selected:{' '}
                      {
                        nasaAsteroidData?.find(a => a.id === selectedAsteroid)
                          ?.name || 'Unknown Asteroid'
                      }
                    </div>
                    {nasaAsteroidData?.find(a => a.id === selectedAsteroid)
                      ?.isPotentiallyHazardous && (
                      <div className="text-xs mt-1 text-red-400">
                        POTENTIALLY HAZARDOUS OBJECT
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          {/* Impact Location Selector */}
          <GlassCard className='p-4'>
            <h3 className='text-lg font-semibold text-white mb-4 flex items-center'>
              <span className="mr-2">🎯</span>
              Impact Location
            </h3>
            <Enhanced2DLocationSelector />
          </GlassCard>

          {/* Run Simulation Button */}
          <div className="flex justify-center w-full">
            <GlamourousLaunchButton
              onClick={handleRunSimulation}
              isLoading={simulationRunning || loading}
              disabled={simulationRunning || loading}
              title='Start asteroid impact simulation with current parameters'
            />
          </div>
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
                  variant={viewMode === '2d-map' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setViewMode('2d-map')}
                  title='Switch to 2D impact map with realistic crater visualization'
                >
                  🗺️ 2D Impact Map
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
            <div className='space-y-6'>
              {/* Results Header */}
              <div className='text-center'>
                <h3 className='text-2xl font-bold text-white mb-2'>
                  {simulationResults ? '🎯 Simulation Results' : '🌠 Impact Simulation Preview'}
                </h3>
                <p className='text-gray-300'>
                  {simulationResults 
                    ? `Impact analysis for ${asteroidParams.diameter}m ${asteroidParams.composition} asteroid`
                    : `Preview for ${asteroidParams.diameter}m ${asteroidParams.composition} asteroid - Run simulation to see actual impact`
                  }
                </p>
              </div>

              {/* Key Statistics */}
              {simulationResults && (
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                  <GlassStat
                    label='Impact Energy'
                    value={simulationResults?.energy || simulationResults?.impactEnergy ? `${((simulationResults.energy || simulationResults.impactEnergy) / 4.184e15).toFixed(2)} MT` : 'Calculating...'}
                    icon='💥'
                  />
                  <GlassStat
                    label='Crater Diameter'
                    value={simulationResults?.craterDiameter ? `${(simulationResults.craterDiameter / 1000).toFixed(1)} km` : 'Calculating...'}
                    icon='🕳️'
                  />
                  <GlassStat
                    label='Impact Location'
                    value={impactLocation?.latitude && impactLocation?.longitude ? `${impactLocation.latitude.toFixed(2)}°, ${impactLocation.longitude.toFixed(2)}°` : 'Not calculated'}
                    icon='🎯'
                  />
                  <GlassStat
                    label='Simulation ID'
                    value={simulationResults?.simulationId?.slice(0, 8) || 'N/A'}
                    icon='🆔'
                  />
                </div>
              )}

              {/* Visualization Area */}
              {viewMode === '2d-map' ? (
                <EnhancedSimulationResultsMap
                  simulationResults={simulationResults}
                  impactLocation={impactLocation}
                  asteroidParams={asteroidParams}
                  onLocationSelect={(coords) => setImpactLocation({ latitude: coords[0], longitude: coords[1] })}
                  showSimulation={simulationCompleted}
                />
              ) : viewMode === 'data' ? (
                <SimulationDataView 
                  simulationResults={simulationResults}
                  asteroidParams={asteroidParams}
                  impactLocation={impactLocation}
                />
              ) : viewMode === 'comparison' ? (
                <SimulationComparisonView 
                  simulationResults={simulationResults}
                  asteroidParams={asteroidParams}
                />
              ) : simulationResults ? (
                <div className='bg-black/20 rounded-lg p-6 min-h-[300px] flex items-center justify-center border border-white/10'>
                  <div className='text-center text-gray-300'>
                    <div className='text-4xl mb-4'>🌠</div>
                    <div className='text-lg font-medium mb-2'>Select a View</div>
                    <p className='text-sm'>Choose a display mode above to view simulation results</p>
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
              

            </div>
          </GlassCard>
        </div>
      </div>
      
      {/* Navigation Guide Popup */}
      <NavigationGuide
        isOpen={showNavigationGuide}
        onClose={() => setShowNavigationGuide(false)}
        simulationType="basic"
      />

      {/* Simulation Process Visualization */}
      <SimulationProcessVisualization
        isVisible={showProcessVisualization}
        onComplete={handleProcessVisualizationComplete}
        simulationData={simulationResults}
        asteroidParams={{
          diameter: asteroidParams.diameter,
          velocity: asteroidParams.velocity,
          composition: asteroidParams.composition,
          angle: asteroidParams.angle
        }}
        impactLocation={impactLocation}
      />
    </div>
  );
};

// Wrap the component with error boundary
const SimulationSetupWithErrorBoundary = () => (
  <SimulationErrorBoundary>
    <SimulationSetup />
  </SimulationErrorBoundary>
);

export default SimulationSetupWithErrorBoundary;
