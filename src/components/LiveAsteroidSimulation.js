import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSimulation } from '../context/SimulationContext';

import LiveAsteroidData from './LiveAsteroidData';
import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import NavigationGuide from './NavigationGuide';


const LiveAsteroidSimulation = () => {
  const navigate = useNavigate();
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [simulationParams, setSimulationParams] = useState({
    entryAngle: 45,
    targetLocation: { lat: 40.7128, lng: -74.006, name: 'New York City' },
    atmosphericDensity: 1.225,
    showAdvanced: false,
  });
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [showNavigationGuide, setShowNavigationGuide] = useState(false);

  const { setAsteroidParams, runSimulation, simulationResults, loading } =
    useSimulation();

  // Predefined target locations
  const targetLocations = [
    { lat: 40.7128, lng: -74.006, name: 'New York City' },
    { lat: 51.5074, lng: -0.1278, name: 'London' },
    { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
    { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
    { lat: 55.7558, lng: 37.6176, name: 'Moscow' },
    { lat: 19.4326, lng: -99.1332, name: 'Mexico City' },
    { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro' },
    { lat: 28.6139, lng: 77.209, name: 'New Delhi' },
  ];

  const handleAsteroidSelect = asteroid => {
    setSelectedAsteroid(asteroid);

    // Update simulation context with asteroid data
    setAsteroidParams({
      diameter: asteroid.diameter,
      velocity: asteroid.velocity,
      composition: asteroid.composition || 'stone',
      name: asteroid.name,
      mass:
        asteroid.mass ||
        calculateMass(asteroid.diameter, asteroid.composition || 'stone'),
      density: getDensityByComposition(asteroid.composition || 'stone'),
    });
  };

  const calculateMass = (diameter, composition) => {
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const density = getDensityByComposition(composition);
    return volume * density;
  };

  const getDensityByComposition = composition => {
    const densities = {
      iron: 7800,
      stone: 3000,
      ice: 900,
      carbonaceous: 2000,
      metallic: 7800,
      rocky: 3000,
    };
    return densities[composition] || 3000;
  };

  const handleRunSimulation = async () => {
    if (!selectedAsteroid) {
      alert('Please select an asteroid first');
      return;
    }

    setIsRunningSimulation(true);

    try {
      const simulationData = {
        asteroid: {
          ...selectedAsteroid,
          entryAngle: simulationParams.entryAngle,
          targetLocation: simulationParams.targetLocation,
        },
        parameters: simulationParams,
        timestamp: new Date().toISOString(),
      };

      await runSimulation(simulationData);

      // Show navigation guide instead of automatically navigating
      setShowNavigationGuide(true);
    } catch (error) {
      console.error('Simulation failed:', error);
      alert('Simulation failed. Please try again.');
    } finally {
      setIsRunningSimulation(false);
    }
  };

  const getImpactRiskLevel = asteroid => {
    if (!asteroid) {
      return 'unknown';
    }

    const { diameter, velocity, missDistance } = asteroid;

    if (asteroid.isPotentiallyHazardous) {
      if (missDistance && missDistance.au < 0.05 && diameter > 100) {
        return 'extreme';
      } else if (missDistance && missDistance.au < 0.1 && diameter > 50) {
        return 'high';
      }
      return 'medium';
    }

    return 'low';
  };

  const getRiskColor = level => {
    switch (level) {
      case 'extreme':
        return 'text-red-500';
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDistance = missDistance => {
    if (!missDistance) {
      return 'Unknown';
    }

    if (missDistance.au < 0.01) {
      return `${(missDistance.km / 1000).toFixed(0)}k km`;
    } else if (missDistance.au < 1) {
      return `${missDistance.lunar.toFixed(1)} LD`;
    }
    return `${missDistance.au.toFixed(3)} AU`;
  };

  return (
    <div className='min-h-screen relative'>
      <EnhancedMeteorBackground />

      <div className='relative z-10 container mx-auto px-4 py-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div 
            className='p-6 mb-8'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className='text-center'>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4'>
                🌌 Live Asteroid Impact Simulation
              </h1>
              <p className='text-lg md:text-xl text-white/80 max-w-3xl mx-auto'>
                Select real asteroids from NASA's live data and simulate their
                potential Earth impact scenarios
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
            {/* Live Asteroid Data - Takes up 2 columns on XL screens */}
            <div className='xl:col-span-2'>
              <LiveAsteroidData
                onAsteroidSelect={handleAsteroidSelect}
                selectedAsteroidId={selectedAsteroid?.id}
              />
            </div>

            {/* Simulation Setup Panel */}
            <div className='space-y-6'>
              {/* Selected Asteroid Info */}
              {selectedAsteroid ? (
                <div 
                  className='p-6'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <h3 className='text-2xl font-bold text-white mb-4'>
                    🎯 Selected Asteroid
                  </h3>

                  <div className='space-y-4'>
                    <div>
                      <h4 className='text-lg font-semibold text-white'>
                        {selectedAsteroid.name}
                      </h4>
                      <p className='text-white/60 text-sm'>
                        ID: {selectedAsteroid.id}
                      </p>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <div className='text-2xl mb-2'>📏</div>
                        <div className='text-white font-semibold'>{selectedAsteroid.diameter}m</div>
                        <div className='text-white/60 text-sm'>Diameter</div>
                      </div>
                      
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <div className='text-2xl mb-2'>⚡</div>
                        <div className='text-white font-semibold'>{selectedAsteroid.velocity.toFixed(1)} km/s</div>
                        <div className='text-white/60 text-sm'>Velocity</div>
                      </div>

                      {selectedAsteroid.missDistance && (
                        <>
                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '8px',
                              padding: '16px',
                              textAlign: 'center',
                              transition: 'transform 0.2s ease'
                            }}
                          >
                            <div className='text-2xl mb-2'>📍</div>
                            <div className='text-white font-semibold'>{formatDistance(selectedAsteroid.missDistance)}</div>
                            <div className='text-white/60 text-sm'>Distance</div>
                          </div>
                          
                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '8px',
                              padding: '16px',
                              textAlign: 'center',
                              transition: 'transform 0.2s ease'
                            }}
                            className={getRiskColor(getImpactRiskLevel(selectedAsteroid))}
                          >
                            <div className='text-2xl mb-2'>⚠️</div>
                            <div className='text-white font-semibold'>{getImpactRiskLevel(selectedAsteroid).toUpperCase()}</div>
                            <div className='text-white/60 text-sm'>Risk Level</div>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedAsteroid.isPotentiallyHazardous && (
                      <div className='p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg'>
                        <p className='text-yellow-300 text-sm'>
                          ⚠️ This is a Potentially Hazardous Asteroid (PHA)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div 
                  className='p-6'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className='text-center text-white/60'>
                    <div className='text-4xl mb-4'>🎯</div>
                    <h3 className='text-xl font-medium mb-2'>
                      Select an Asteroid
                    </h3>
                    <p>
                      Choose an asteroid from the live data to begin simulation
                      setup
                    </p>
                  </div>
                </div>
              )}

              {/* Simulation Parameters */}
              {selectedAsteroid && (
                <div 
                  className='p-6'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <h3 className='text-xl font-bold text-white mb-4'>
                    ⚙️ Simulation Parameters
                  </h3>

                  <div className='space-y-6'>
                    {/* Entry Angle */}
                    <div>
                      <label className='block text-white/80 text-sm font-medium mb-2'>
                        Entry Angle: {simulationParams.entryAngle}°
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={simulationParams.entryAngle}
                        onChange={(e) => setSimulationParams({
                          ...simulationParams,
                          entryAngle: parseInt(e.target.value),
                        })}
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '3px',
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitAppearance: 'none'
                        }}
                        className="slider"
                      />
                      <style jsx>{`
                        .slider::-webkit-slider-thumb {
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          border-radius: 50%;
                          cursor: pointer;
                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        }
                        .slider::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          border-radius: 50%;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        }
                      `}</style>
                      <p className='text-white/60 text-xs mt-1'>
                        Steeper angles cause more atmospheric heating
                      </p>
                    </div>

                    {/* Target Location */}
                    <div>
                      <label className='block text-white/80 text-sm font-medium mb-2'>
                        Target Location
                      </label>
                      <select
                        value={`${simulationParams.targetLocation.lat},${simulationParams.targetLocation.lng}`}
                        onChange={e => {
                          const [lat, lng] = e.target.value
                            .split(',')
                            .map(Number);
                          const location = targetLocations.find(
                            loc => loc.lat === lat && loc.lng === lng
                          );
                          setSimulationParams({
                            ...simulationParams,
                            targetLocation: location,
                          });
                        }}
                        className='w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50'
                      >
                        {targetLocations.map(location => (
                          <option
                            key={`${location.lat},${location.lng}`}
                            value={`${location.lat},${location.lng}`}
                            className='bg-gray-800 text-white'
                          >
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Advanced Parameters Toggle */}
                    <div className='mb-6'>
                      <label className='flex items-center cursor-pointer'>
                        <span className='text-white/80 text-sm font-medium mr-3'>
                          Show Advanced Parameters
                        </span>
                        <div 
                          className='relative'
                          onClick={() => setSimulationParams({
                            ...simulationParams,
                            showAdvanced: !simulationParams.showAdvanced,
                          })}
                          style={{
                            width: '48px',
                            height: '24px',
                            background: simulationParams.showAdvanced 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                              : 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              background: 'white',
                              borderRadius: '50%',
                              position: 'absolute',
                              top: '1px',
                              left: simulationParams.showAdvanced ? '26px' : '1px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}
                          />
                        </div>
                      </label>
                    </div>

                    {/* Advanced Parameters */}
                    {simulationParams.showAdvanced && (
                      <div className='space-y-4 p-4 bg-white/5 rounded-lg border border-white/10'>
                        <div>
                          <label className='block text-white/80 text-sm font-medium mb-2'>
                            Atmospheric Density:{' '}
                            {simulationParams.atmosphericDensity} kg/m³
                          </label>
                          <input
                            type="range"
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            value={simulationParams.atmosphericDensity}
                            onChange={(e) => setSimulationParams({
                              ...simulationParams,
                              atmosphericDensity: parseFloat(e.target.value),
                            })}
                            style={{
                              width: '100%',
                              height: '6px',
                              background: 'rgba(255, 255, 255, 0.2)',
                              borderRadius: '3px',
                              outline: 'none',
                              cursor: 'pointer',
                              appearance: 'none',
                              WebkitAppearance: 'none'
                            }}
                            className="slider"
                          />
                          <style jsx>{`
                            .slider::-webkit-slider-thumb {
                              appearance: none;
                              width: 20px;
                              height: 20px;
                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              border-radius: 50%;
                              cursor: pointer;
                              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                            }
                            .slider::-moz-range-thumb {
                              width: 20px;
                              height: 20px;
                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              border-radius: 50%;
                              cursor: pointer;
                              border: none;
                              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                            }
                          `}</style>
                          <p className='text-white/60 text-xs mt-1'>
                            Higher density increases atmospheric braking
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Run Simulation Button */}
                    <button
                      onClick={handleRunSimulation}
                      disabled={!selectedAsteroid || isRunningSimulation}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        background: (!selectedAsteroid || isRunningSimulation)
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: (!selectedAsteroid || isRunningSimulation) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        opacity: (!selectedAsteroid || isRunningSimulation) ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!(!selectedAsteroid || isRunningSimulation)) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(!selectedAsteroid || isRunningSimulation)) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                        }
                      }}
                    >
                      {isRunningSimulation ? (
                        <div className='flex items-center justify-center space-x-2'>
                          <div 
                            style={{
                              width: '20px',
                              height: '20px',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}
                          />
                          <style jsx>{`
                            @keyframes spin {
                              0% { transform: rotate(0deg); }
                              100% { transform: rotate(360deg); }
                            }
                          `}</style>
                          <span>Running Simulation...</span>
                        </div>
                      ) : (
                        <div className='flex items-center justify-center space-x-2'>
                          <span>🚀</span>
                          <span>Run Impact Simulation</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              {selectedAsteroid && (
                <div 
                  className='p-4'
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <h4 className='text-lg font-semibold text-white mb-3'>
                    📊 Quick Impact Estimates
                  </h4>

                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-white/70'>Kinetic Energy:</span>
                      <span className='text-white'>
                        {(
                          (0.5 *
                            calculateMass(
                              selectedAsteroid.diameter,
                              selectedAsteroid.composition || 'stone'
                            ) *
                            Math.pow(selectedAsteroid.velocity * 1000, 2)) /
                          1e15
                        ).toFixed(2)}{' '}
                        PJ
                      </span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-white/70'>TNT Equivalent:</span>
                      <span className='text-white'>
                        {(
                          (0.5 *
                            calculateMass(
                              selectedAsteroid.diameter,
                              selectedAsteroid.composition || 'stone'
                            ) *
                            Math.pow(selectedAsteroid.velocity * 1000, 2)) /
                          4.184e15
                        ).toFixed(2)}{' '}
                        MT
                      </span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-white/70'>Crater Diameter:</span>
                      <span className='text-white'>
                        ~{(selectedAsteroid.diameter * 10).toFixed(0)}m
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Guide Popup */}
      <NavigationGuide
        isOpen={showNavigationGuide}
        onClose={() => setShowNavigationGuide(false)}
        simulationType="live"
      />
    </div>
  );
};

export default LiveAsteroidSimulation;
