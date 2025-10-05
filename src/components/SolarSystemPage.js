import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import {
  GlassButton,
  GlassPanel,
  GlassCard,
  GlassNav,
} from './ui/GlassComponents';
import SolarSystemPanel from './SolarSystemPanel';
import PlanetInfoPanel from './PlanetInfoPanel';
import SolarSystemNEOVisualization from './mission-control/SolarSystemNEOVisualization';
import { SolarSystemCalculator } from '../utils/SolarSystemCalculator';
import { AstronomicalDataService } from '../services/AstronomicalDataService';
import { PLANETARY_DATA } from '../data/planetaryData';
import '../styles/glassmorphic.css';

/**
 * Solar System Explorer Page
 * A comprehensive page for exploring our solar system with live 3D models and data
 */
const SolarSystemPage = () => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [showPlanetInfo, setShowPlanetInfo] = useState(false);
  const [astronomicalData, setAstronomicalData] = useState(null);
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'neo', 'planets'
  const [livePositions, setLivePositions] = useState({});

  // Initialize astronomical services
  useEffect(() => {
    const initializeData = async () => {
      try {
        const calculator = new SolarSystemCalculator();
        const dataService = new AstronomicalDataService();
        
        // Get current planetary positions
        const positions = await calculator.getLivePlanetaryPositions(new Date());
        setLivePositions(positions);
        
        // Get astronomical data
        const astroData = await dataService.getAstronomicalData();
        setAstronomicalData(astroData);
      } catch (error) {
        console.error('Error initializing astronomical data:', error);
      }
    };

    initializeData();
  }, []);

  const handlePlanetSelect = (planetName) => {
    const planetData = PLANETARY_DATA[planetName?.toLowerCase()];
    if (planetData) {
      setSelectedPlanet({
        name: planetName,
        ...planetData,
        livePosition: livePositions[planetName?.toLowerCase()]
      });
      setShowPlanetInfo(true);
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'neo':
        return (
          <div className='w-full'>
            <GlassPanel className='p-6 mb-6'>
              <h2 className='text-2xl font-bold text-white mb-2'>Near Earth Objects</h2>
              <p className='text-gray-300'>Real-time tracking of asteroids and comets near Earth</p>
            </GlassPanel>
            <div className='h-[600px]'>
              <SolarSystemNEOVisualization />
            </div>
          </div>
        );
      case 'planets':
        return (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {Object.entries(PLANETARY_DATA).map(([key, planet]) => (
              key !== 'sun' && (
                <GlassCard 
                  key={key} 
                  className='p-4 cursor-pointer hover:scale-105 transition-transform'
                  onClick={() => handlePlanetSelect(planet.name)}
                >
                  <div className='text-3xl mb-2 text-center'>
                    {key === 'mercury' ? '☿️' :
                     key === 'venus' ? '♀️' :
                     key === 'earth' ? '🌍' :
                     key === 'mars' ? '♂️' :
                     key === 'jupiter' ? '♃' :
                     key === 'saturn' ? '♄' :
                     key === 'uranus' ? '♅' :
                     key === 'neptune' ? '♆' : '🪐'}
                  </div>
                  <h3 className='text-lg font-semibold text-white mb-1'>{planet.name}</h3>
                  <p className='text-gray-300 text-xs mb-2'>{planet.type}</p>
                  <div className='text-xs text-gray-400'>
                    <div>Radius: {planet.radius?.toLocaleString()} km</div>
                    <div>Distance: {(planet.distanceFromSun / 1e6)?.toFixed(1)} million km</div>
                    {livePositions[key] && (
                      <div className='text-green-400 mt-1'>● Live Data Available</div>
                    )}
                  </div>
                </GlassCard>
              )
            ))}
          </div>
        );
      default:
        return (
          <div className='space-y-6'>
            {/* Feature Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <GlassCard className='p-6 text-center'>
                <div className='text-4xl mb-3'>☀️</div>
                <h3 className='text-xl font-semibold text-white mb-2'>The Sun</h3>
                <p className='text-gray-300 text-sm'>
                  Our star and the center of our solar system
                </p>
                <div className='mt-3 text-xs text-gray-400'>
                  {astronomicalData?.solarData && (
                    <div>Solar Activity: {astronomicalData.solarData.solarCycle?.phase || 'Normal'}</div>
                  )}
                </div>
              </GlassCard>

              <GlassCard className='p-6 text-center'>
                <div className='text-4xl mb-3'>🪐</div>
                <h3 className='text-xl font-semibold text-white mb-2'>Planets</h3>
                <p className='text-gray-300 text-sm'>
                  Eight planets with real-time positions
                </p>
                <div className='mt-3'>
                  <GlassButton 
                    size='sm' 
                    onClick={() => setCurrentView('planets')}
                  >
                    Explore Planets
                  </GlassButton>
                </div>
              </GlassCard>

              <GlassCard className='p-6 text-center'>
                <div className='text-4xl mb-3'>☄️</div>
                <h3 className='text-xl font-semibold text-white mb-2'>Near Earth Objects</h3>
                <p className='text-gray-300 text-sm'>
                  Track asteroids and comets near Earth
                </p>
                <div className='mt-3'>
                  <GlassButton 
                    size='sm' 
                    onClick={() => setCurrentView('neo')}
                  >
                    View NEOs
                  </GlassButton>
                </div>
              </GlassCard>

              <GlassCard className='p-6 text-center'>
                <div className='text-4xl mb-3'>🌙</div>
                <h3 className='text-xl font-semibold text-white mb-2'>Moons</h3>
                <p className='text-gray-300 text-sm'>
                  Natural satellites with orbital data
                </p>
                <div className='mt-3 text-xs text-gray-400'>
                  {Object.values(PLANETARY_DATA).reduce((total, planet) => 
                    total + (planet.moons?.length || 0), 0)} known moons
                </div>
              </GlassCard>

              <GlassCard className='p-6 text-center'>
                <div className='text-4xl mb-3'>🌌</div>
                <h3 className='text-xl font-semibold text-white mb-2'>Live Simulation</h3>
                <p className='text-gray-300 text-sm'>
                  Real-time orbital mechanics
                </p>
                <div className='mt-3 text-xs text-green-400'>
                  ● Connected to NASA APIs
                </div>
              </GlassCard>

              <GlassCard className='p-6 text-center'>
                <div className='text-4xl mb-3'>🚀</div>
                <h3 className='text-xl font-semibold text-white mb-2'>Exploration</h3>
                <p className='text-gray-300 text-sm'>
                  Space missions and discoveries
                </p>
                <div className='mt-3'>
                  <Link to='/nasa-integrations'>
                    <GlassButton size='sm'>
                      NASA Data
                    </GlassButton>
                  </Link>
                </div>
              </GlassCard>
            </div>
          </div>
        );
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
            <GlassButton
              variant={currentView === 'overview' ? 'primary' : 'secondary'}
              size='sm'
              onClick={() => setCurrentView('overview')}
            >
              🏠 Overview
            </GlassButton>
            <GlassButton
              variant={currentView === 'planets' ? 'primary' : 'secondary'}
              size='sm'
              onClick={() => setCurrentView('planets')}
            >
              🪐 Planets
            </GlassButton>
            <GlassButton
              variant={currentView === 'neo' ? 'primary' : 'secondary'}
              size='sm'
              onClick={() => setCurrentView('neo')}
            >
              ☄️ NEOs
            </GlassButton>
            <Link to='/simulation'>
              <GlassButton
                variant='secondary'
                size='sm'
                title='Go back to simulation setup'
              >
                🚀 Simulation
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
      <div className='pt-20 min-h-screen p-6'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Live 3D Solar System Model - Top of Page */}
          <GlassPanel className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h1 className='text-3xl font-bold text-white mb-2'>
                  🌌 Live Solar System Explorer
                </h1>
                <p className='text-gray-300'>
                  Interactive 3D model with real-time planetary positions and NASA data
                </p>
              </div>
              <div className='text-right text-sm text-gray-400'>
                <div>Last Updated: {new Date().toLocaleTimeString()}</div>
                <div className='text-green-400'>● Live Data Active</div>
              </div>
            </div>
            
            {/* 3D Solar System Panel */}
            <div className='h-[500px] rounded-lg overflow-hidden'>
              <SolarSystemPanel />
            </div>
          </GlassPanel>

          {/* Dynamic Content Based on Current View */}
          {renderMainContent()}

          {/* Action Buttons - Only show in overview */}
          {currentView === 'overview' && (
            <div className='flex justify-center space-x-4 pt-6'>
              <Link to='/simulation'>
                <GlassButton variant='primary'>
                  🚀 Start Simulation
                </GlassButton>
              </Link>
              <GlassButton 
                variant='secondary'
                onClick={() => setCurrentView('planets')}
              >
                🪐 Explore Planets
              </GlassButton>
              <GlassButton 
                variant='secondary'
                onClick={() => setCurrentView('neo')}
              >
                ☄️ Track NEOs
              </GlassButton>
            </div>
          )}
        </div>
      </div>

      {/* Planet Info Panel */}
      {showPlanetInfo && selectedPlanet && (
        <PlanetInfoPanel
          planetData={selectedPlanet}
          isVisible={showPlanetInfo}
          onClose={() => setShowPlanetInfo(false)}
          position={{ x: '50%', y: '50%' }}
        />
      )}
    </div>
  );
};

export default SolarSystemPage;