// NASA Integration Panel Component
// Demonstrates all NASA open source repository integrations with real-time data
import React, { useState, useEffect } from 'react';

import {
  useNASAData,
  useISSData,
  useSpaceWeather,
  useEarthObservation,
  useMissionControl,
} from '../hooks/useWebSocket';
import {
  NASA_INTEGRATIONS,
  NASA_DATA_SOURCES,
} from '../integrations/nasa-config';
import {
  useNASA3DModels,
  useOpenMCTTelemetry,
  useOrbitalData,
  useNEOData,
  useCFDSimulation,
  useNASAIntegrationStatus,
} from '../integrations/nasa-integration-hooks';
import SpaceNewsPanel from './ui/SpaceNewsPanel';
import EnhancedSpaceWeatherPanel from './ui/EnhancedSpaceWeatherPanel';
import EnhancedISSPanel from './ui/EnhancedISSPanel';
import EnhancedNEOPanel from './ui/EnhancedNEOPanel';
import AsteroidImpactSimulation from './AsteroidImpactSimulation';

const NASAIntegrationPanel = () => {
  // Legacy hooks for backward compatibility
  const { models, loading: modelsLoading } = useNASA3DModels('all');
  const { telemetry, connected } = useOpenMCTTelemetry('meteor-mission');
  const { orbitalData } = useOrbitalData('earth');
  const { neos, loading: neosLoading } = useNEOData();
  const { simulationData, progress } = useCFDSimulation('meteor-impact');
  const integrationStatus = useNASAIntegrationStatus();

  // Real-time WebSocket data hooks
  const {
    neoData: realTimeNeoData,
    marsWeather,
    earthImagery,
    epicImages,
    loading: nasaLoading,
  } = useNASAData();
  const {
    issPosition,
    advancedIssData,
    starlinkData,
    spaceDebris,
    satellitePasses,
    loading: issLoading,
  } = useISSData();
  const {
    spaceWeather,
    solarActivity,
    geomagneticData,
    auroraForecast,
    loading: weatherLoading,
  } = useSpaceWeather();
  const {
    satelliteImagery,
    environmentalIndicators,
    naturalDisasters,
    loading: earthLoading,
  } = useEarthObservation();
  const {
    telemetry: missionTelemetry,
    orbitalMechanics,
    realTimeEvents,
    loading: missionLoading,
  } = useMissionControl();

  // State for active data view
  const [activeView, setActiveView] = useState('overview');

  return (
    <div className='bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse'>
          🌌 NASA Open Source Integration
        </h2>
        <p className='text-gray-300 mt-2'>
          Powered by official NASA repositories and community projects
        </p>
      </div>

      {/* Integration Status Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
        {Object.entries(integrationStatus).map(([key, status]) => (
          <div
            key={key}
            className={`p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
              status.enabled
                ? 'bg-green-900/30 border-green-500/50 hover:shadow-green-500/25'
                : 'bg-red-900/30 border-red-500/50'
            }`}
          >
            <h3 className='font-semibold text-lg mb-2'>
              {key.replace(/_/g, ' ')}
            </h3>
            <div className='flex items-center justify-between'>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  status.enabled
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {status.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
              {status.available && (
                <span className='px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs'>
                  AVAILABLE
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3D Models Section */}
      <div className='mb-8'>
        <h3 className='text-xl font-semibold mb-4 text-cyan-400'>
          🚀 3D Models & Assets
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {modelsLoading ? (
            <div className='col-span-3 text-center py-8'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto' />
              <p className='mt-2 text-gray-400'>Loading NASA 3D models...</p>
            </div>
          ) : (
            models.map(model => (
              <div
                key={model.id}
                className='bg-gray-800/50 p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 hover:scale-105'
              >
                <div className='flex items-center mb-2'>
                  <span className='w-3 h-3 bg-cyan-500 rounded-full mr-2' />
                  <h4 className='font-medium text-cyan-300'>{model.name}</h4>
                </div>
                <p className='text-sm text-gray-400'>Type: {model.type}</p>
                <p className='text-sm text-gray-400'>
                  Format: {model.format.toUpperCase()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Telemetry Data */}
      <div className='mb-8'>
        <h3 className='text-xl font-semibold mb-4 text-green-400'>
          📡 Mission Telemetry
        </h3>
        <div
          className={`p-4 rounded-xl border-2 ${
            connected
              ? 'bg-green-900/30 border-green-500/50'
              : 'bg-gray-800/50 border-gray-500/50'
          }`}
        >
          <div className='flex items-center mb-3'>
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className='text-sm'>
              {connected ? 'LIVE TELEMETRY' : 'DISCONNECTED'}
            </span>
          </div>

          {connected && telemetry && (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {Object.entries(telemetry).map(([key, value]) => (
                <div key={key} className='text-center'>
                  <div className='bg-gray-700/50 rounded p-2'>
                    <p className='text-xs text-gray-400 uppercase'>{key}</p>
                    <p className='font-mono text-green-300'>
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NEO Data */}
      <div className='mb-8'>
        <h3 className='text-xl font-semibold mb-4 text-orange-400'>
          ☄️ Near Earth Objects
        </h3>
        {neosLoading ? (
          <div className='text-center py-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto' />
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {neos.slice(0, 4).map(neo => (
              <div
                key={neo.id}
                className={`p-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  neo.hazard
                    ? 'bg-red-900/30 border-red-500/50 hover:shadow-red-500/25'
                    : 'bg-gray-800/50 border-orange-500/30'
                }`}
              >
                <div className='flex justify-between items-start mb-2'>
                  <h4 className='font-medium'>{neo.name}</h4>
                  {neo.hazard && (
                    <span className='px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs'>
                      HAZARD
                    </span>
                  )}
                </div>
                <div className='text-sm space-y-1'>
                  <p>Diameter: {neo.diameter.toFixed(0)} m</p>
                  <p>Velocity: {neo.velocity.toFixed(1)} km/s</p>
                  <p>
                    Miss Distance: {(neo.missDistance / 1000000).toFixed(1)}M km
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CFD Simulation */}
      <div className='mb-8'>
        <h3 className='text-xl font-semibold mb-4 text-purple-400'>
          🌪️ CFD Simulation
        </h3>
        <div className='bg-gray-800/50 p-4 rounded-xl border border-purple-500/30'>
          <div className='mb-3'>
            <div className='flex justify-between text-sm text-gray-400 mb-1'>
              <span>Meteor Impact Simulation</span>
              <span>{progress}%</span>
            </div>
            <div className='w-full bg-gray-700 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {simulationData && (
            <div className='grid grid-cols-2 gap-3 mt-3'>
              <div className='text-center'>
                <p className='text-xs text-gray-400'>Impact Energy</p>
                <p className='font-mono text-purple-300'>
                  {simulationData.impactEnergy.toFixed(0)} MJ
                </p>
              </div>
              <div className='text-center'>
                <p className='text-xs text-gray-400'>Crater Diameter</p>
                <p className='font-mono text-pink-300'>
                  {simulationData.craterDiameter.toFixed(1)} m
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Data Navigation */}
      <div className='mb-8'>
        <h3 className='text-xl font-semibold mb-4 text-cyan-400'>
          🌐 Real-Time Data Streams
        </h3>
        <div className='flex flex-wrap gap-2 mb-6'>
          {['overview', 'iss', 'neo', 'weather', 'earth', 'mission', 'asteroid', 'news'].map(
            view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeView === view
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                }`}
              >
                {view === 'news' ? '📰 NEWS' : 
                 view === 'asteroid' ? '☄️ ASTEROID IMPACT' : 
                 view.toUpperCase()}
              </button>
            )
          )}
        </div>

        {/* Real-Time Data Display */}
        {activeView === 'overview' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* ISS Position */}
            <div className='bg-green-900/30 p-4 rounded-xl border border-green-500/50'>
              <h4 className='text-green-400 font-semibold mb-2'>
                🛰️ ISS Position
              </h4>
              {issLoading ? (
                <div className='animate-pulse'>Loading...</div>
              ) : issPosition ? (
                <div className='space-y-1 text-sm'>
                  <p>Lat: {issPosition.latitude?.toFixed(4)}°</p>
                  <p>Lng: {issPosition.longitude?.toFixed(4)}°</p>
                  <p>Alt: {issPosition.altitude?.toFixed(0)} km</p>
                  <p>Speed: {issPosition.velocity?.toFixed(1)} km/h</p>
                </div>
              ) : (
                <p className='text-gray-400'>No data available</p>
              )}
            </div>

            {/* Space Weather */}
            <div className='bg-orange-900/30 p-4 rounded-xl border border-orange-500/50'>
              <h4 className='text-orange-400 font-semibold mb-2'>
                ☀️ Space Weather
              </h4>
              {weatherLoading ? (
                <div className='animate-pulse'>Loading...</div>
              ) : spaceWeather ? (
                <div className='space-y-1 text-sm'>
                  <p>
                    Solar Wind: {spaceWeather.solarWind?.speed?.toFixed(0)} km/s
                  </p>
                  <p>Kp Index: {spaceWeather.kpIndex}</p>
                  <p>X-ray Flux: {spaceWeather.xrayFlux}</p>
                  <p
                    className={`font-semibold ${spaceWeather.alertLevel === 'high' ? 'text-red-400' : 'text-green-400'}`}
                  >
                    Alert: {spaceWeather.alertLevel?.toUpperCase()}
                  </p>
                </div>
              ) : (
                <p className='text-gray-400'>No data available</p>
              )}
            </div>

            {/* NEO Data */}
            <div className='bg-purple-900/30 p-4 rounded-xl border border-purple-500/50'>
              <h4 className='text-purple-400 font-semibold mb-2'>
                ☄️ Near Earth Objects
              </h4>
              {nasaLoading ? (
                <div className='animate-pulse'>Loading...</div>
              ) : realTimeNeoData ? (
                <div className='space-y-1 text-sm'>
                  <p>Today's NEOs: {realTimeNeoData.todayCount}</p>
                  <p>Potentially Hazardous: {realTimeNeoData.hazardousCount}</p>
                  <p>
                    Closest Approach:{' '}
                    {realTimeNeoData.closestDistance?.toFixed(0)} km
                  </p>
                  <p>
                    Next Update:{' '}
                    {new Date(realTimeNeoData.nextUpdate).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className='text-gray-400'>No data available</p>
              )}
            </div>
          </div>
        )}

        {/* Enhanced ISS View */}
        {activeView === 'iss' && (
          <EnhancedISSPanel />
        )}

        {/* Enhanced NEO View */}
        {activeView === 'neo' && (
          <EnhancedNEOPanel />
        )}

        {/* Space Weather Detailed View */}
        {activeView === 'weather' && (
          <EnhancedSpaceWeatherPanel />
        )}

        {/* Earth Observation View */}
        {activeView === 'earth' && (
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-blue-900/30 p-4 rounded-xl border border-blue-500/50'>
                <h4 className='text-blue-400 font-semibold mb-3'>
                  🌍 Earth Imagery
                </h4>
                {earthImagery && (
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Latest Image:</span>
                      <span className='text-blue-300'>
                        {new Date(earthImagery.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Resolution:</span>
                      <span className='text-blue-300'>
                        {earthImagery.resolution}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Cloud Cover:</span>
                      <span className='text-blue-300'>
                        {earthImagery.cloudCover}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className='bg-green-900/30 p-4 rounded-xl border border-green-500/50'>
                <h4 className='text-green-400 font-semibold mb-3'>
                  🌱 Environmental Indicators
                </h4>
                {environmentalData && (
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Air Quality Index:</span>
                      <span className='text-green-300'>
                        {environmentalData.airQualityIndex}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Vegetation Index:</span>
                      <span className='text-green-300'>
                        {environmentalData.vegetationIndex?.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>
                        Temperature Anomaly:
                      </span>
                      <span className='text-green-300'>
                        {environmentalData.temperatureAnomaly?.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {naturalDisasters && naturalDisasters.length > 0 && (
              <div className='bg-red-900/30 p-4 rounded-xl border border-red-500/50'>
                <h4 className='text-red-400 font-semibold mb-3'>
                  ⚠️ Natural Disaster Monitoring
                </h4>
                <div className='space-y-2'>
                  {naturalDisasters.slice(0, 3).map((disaster, index) => (
                    <div
                      key={index}
                      className='text-sm p-2 bg-red-800/30 rounded border-l-2 border-red-500'
                    >
                      <div className='flex justify-between'>
                        <span className='text-red-300 font-medium'>
                          {disaster.type}
                        </span>
                        <span className='text-gray-400'>
                          {disaster.severity}
                        </span>
                      </div>
                      <p className='text-gray-300 mt-1'>{disaster.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mission Control View */}
        {activeView === 'mission' && (
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='bg-cyan-900/30 p-4 rounded-xl border border-cyan-500/50'>
                <h4 className='text-cyan-400 font-semibold mb-3'>
                  🚀 Mission Telemetry
                </h4>
                {missionTelemetry && (
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Active Missions:</span>
                      <span className='text-cyan-300'>
                        {missionTelemetry.activeMissions}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Data Rate:</span>
                      <span className='text-cyan-300'>
                        {missionTelemetry.dataRate} Mbps
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Signal Strength:</span>
                      <span className='text-cyan-300'>
                        {missionTelemetry.signalStrength} dBm
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>System Health:</span>
                      <span
                        className={`font-semibold ${missionTelemetry.systemHealth === 'nominal' ? 'text-green-400' : 'text-yellow-400'}`}
                      >
                        {missionTelemetry.systemHealth?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className='bg-purple-900/30 p-4 rounded-xl border border-purple-500/50'>
                <h4 className='text-purple-400 font-semibold mb-3'>
                  🛰️ Orbital Mechanics
                </h4>
                {orbitalData && (
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Orbital Period:</span>
                      <span className='text-purple-300'>
                        {orbitalData.period?.toFixed(1)} min
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Apogee:</span>
                      <span className='text-purple-300'>
                        {orbitalData.apogee?.toFixed(0)} km
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Perigee:</span>
                      <span className='text-purple-300'>
                        {orbitalData.perigee?.toFixed(0)} km
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Inclination:</span>
                      <span className='text-purple-300'>
                        {orbitalData.inclination?.toFixed(1)}°
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className='bg-yellow-900/30 p-4 rounded-xl border border-yellow-500/50'>
                <h4 className='text-yellow-400 font-semibold mb-3'>
                  📊 System Status
                </h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>WebSocket:</span>
                    <span className='text-green-400'>Connected</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Data Streams:</span>
                    <span className='text-yellow-300'>8 Active</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Last Update:</span>
                    <span className='text-yellow-300'>
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Asteroid Impact Simulation View */}
        {activeView === 'asteroid' && (
          <div className='space-y-4'>
            <div className='bg-gradient-to-br from-orange-900/30 via-red-900/30 to-purple-900/30 p-6 rounded-xl border border-orange-500/50'>
              <h4 className='text-orange-400 font-semibold mb-4 text-xl'>
                ☄️ Advanced Asteroid Impact Simulation
              </h4>
              <p className='text-gray-300 mb-4'>
                Experience realistic asteroid impact scenarios with advanced physics simulation, 
                visual effects, and detailed impact analysis similar to Universe Sandbox.
              </p>
              <AsteroidImpactSimulation />
            </div>
          </div>
        )}

        {/* Space News View */}
        {activeView === 'news' && (
          <div className='space-y-4'>
            <SpaceNewsPanel />
          </div>
        )}

        {/* Real-Time Events */}
        {realTimeEvents && realTimeEvents.length > 0 && (
          <div className='mt-6 bg-gray-800/50 p-4 rounded-xl border border-gray-500/50'>
            <h4 className='text-gray-300 font-semibold mb-3'>
              📡 Real-Time Events
            </h4>
            <div className='max-h-40 overflow-y-auto space-y-2'>
              {realTimeEvents.slice(-5).map((event, index) => (
                <div
                  key={index}
                  className='text-sm p-2 bg-gray-700/50 rounded border-l-2 border-cyan-500'
                >
                  <div className='flex justify-between'>
                    <span className='text-cyan-300'>{event.type}</span>
                    <span className='text-gray-400'>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className='text-gray-300 mt-1'>{event.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Sources Links */}
      <div>
        <h3 className='text-xl font-semibold mb-4 text-blue-400'>
          🔗 NASA Data Sources
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {Object.entries(NASA_DATA_SOURCES).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target='_blank'
              rel='noopener noreferrer'
              className='p-3 bg-gray-800/50 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 hover:scale-105 group'
            >
              <div className='flex items-center'>
                <span className='text-blue-400 group-hover:text-blue-300 transition-colors'>
                  🔗
                </span>
                <span className='ml-2 text-sm truncate'>
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
              <p className='text-xs text-gray-400 mt-1 truncate'>{url}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NASAIntegrationPanel;
