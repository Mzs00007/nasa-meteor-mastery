import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import Icon from './Icon';
import '../styles/main.css';

// Enhanced NavLink component with better animations
const NavLink = ({ onClick, icon, text, title, isActive = false }) => (
  <button
    onClick={onClick}
    className={`enhanced-nav-item enhanced-btn enhanced-focus group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 ${
      isActive 
        ? 'bg-gradient-to-r from-nasa-blue to-nasa-red text-white shadow-lg shadow-nasa-blue/25 active' 
        : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/10'
    }`}
    title={title}
  >
    <Icon name={icon} size='small' className="enhanced-icon transition-transform duration-300 group-hover:rotate-12" />
    <span className='hidden xl:block transition-all duration-300'>{text}</span>
    {/* Animated underline */}
    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-nasa-blue to-nasa-red transition-all duration-300 ${
      isActive ? 'w-full' : 'w-0 group-hover:w-3/4'
    }`} />
  </button>
);

const Navbar = ({ onThemeChange, currentTheme }) => {
  const { setView, view, preventNavigation, setPreventNavigation } = useSimulation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('both');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Set active tab based on current view
    setActiveTab(view || 'both');
  }, [view]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleViewChange = view => {
    setView(view);
    setActiveTab(view);
    setIsMenuOpen(false);
  };

  const handleThemeChange = e => {
    const theme = e.target.value;
    onThemeChange(theme);
  };

  const handleOrbitalMechanicsNavigation = () => {
    window.location.href = '/orbital-mechanics';
    setIsMenuOpen(false);
  };

  const handleUniverseVisualizationNavigation = () => {
    window.location.href = '/universe-visualization';
    setIsMenuOpen(false);
  };

  const handleNEOVisualizationNavigation = () => {
    window.location.href = '/neo-visualization';
    setIsMenuOpen(false);
  };

  const handleISSTrackingNavigation = () => {
    window.location.href = '/iss-tracking';
    setIsMenuOpen(false);
  };

  const handleSatelliteTrackingNavigation = () => {
    window.location.href = '/satellite-tracking';
    setIsMenuOpen(false);
  };

  const handleSpaceWeatherNavigation = () => {
    window.location.href = '/space-weather';
    setIsMenuOpen(false);
  };

  const handleLiveAsteroidDataNavigation = () => {
    window.location.href = '/live-asteroids';
    setIsMenuOpen(false);
  };

  const handleLiveSimulationNavigation = () => {
    window.location.href = '/live-simulation';
    setIsMenuOpen(false);
  };

  const handleMissionControlNavigation = () => {
    window.location.href = '/mission-control';
    setIsMenuOpen(false);
  };

  const handleMeteorologicalSimulationNavigation = () => {
    window.location.href = '/meteorological-simulation';
    setIsMenuOpen(false);
  };

  const handleCesiumEarthNavigation = () => {
    window.location.href = '/cesium-earth';
    setIsMenuOpen(false);
  };

  const handleComprehensiveAPIsNavigation = () => {
    window.location.href = '/comprehensive-apis';
    setIsMenuOpen(false);
  };

  const handleHistoryNavigation = () => {
    window.location.href = '/history';
    setIsMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-gradient-to-r from-slate-900/98 via-blue-900/98 to-slate-900/98 backdrop-blur-xl shadow-2xl shadow-black/20' 
        : 'bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-lg'
    } border-b border-white/10`}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'h-14 lg:h-16' : 'h-16 lg:h-20'
        }`}>
          {/* Enhanced Logo Section */}
          <div className='flex items-center space-x-3'>
            <a href='#!' className='flex items-center space-x-3 group'>
              <div className='relative p-2.5 bg-gradient-to-br from-nasa-blue via-purple-600 to-nasa-red rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-nasa-blue/25'>
                <Icon
                  name='brightness_high'
                  className='text-white transition-transform duration-500 group-hover:rotate-180'
                  size='small'
                />
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-nasa-blue to-nasa-red rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl" />
              </div>
              <div className="flex flex-col">
                <span className='hidden sm:block text-xl lg:text-2xl font-bold bg-gradient-to-r from-nasa-blue via-purple-400 to-nasa-red bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105'>
                  Meteor Mastery
                </span>
                <span className='hidden lg:block text-xs text-gray-400 font-medium tracking-wider'>
                  NASA Space Defense
                </span>
              </div>
            </a>
          </div>

          {/* Enhanced Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-2'>
            {/* Navigation Links with improved styling */}
            <div className='flex items-center space-x-1 bg-white/5 rounded-2xl p-1.5 backdrop-blur-sm border border-white/10'>
              <NavLink 
                onClick={handleNEOVisualizationNavigation} 
                icon='dangerous' 
                text='NEO' 
                title='Near-Earth Object Tracking'
                isActive={window.location.pathname === '/neo-visualization'}
              />
              <NavLink 
                onClick={handleUniverseVisualizationNavigation} 
                icon='stars' 
                text='Universe' 
                title='Universe Visualization'
                isActive={window.location.pathname === '/universe-visualization'}
              />
            </div>

            {/* Navigation Lock/Unlock Button */}
            {preventNavigation && (
              <div className='ml-4 flex items-center space-x-3'>
                <div className='text-yellow-400 text-sm font-medium flex items-center space-x-2'>
                  <span>🔒</span>
                  <span className='hidden lg:block'>Navigation Locked</span>
                </div>
                <button
                  onClick={() => setPreventNavigation(false)}
                  className='bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 animate-pulse'
                  title='Unlock navigation to move between pages'
                >
                  🔓 Unlock
                </button>
              </div>
            )}

            {/* Enhanced Theme Selector */}
            <div className='ml-4 relative group'>
              <select
                value={currentTheme}
                onChange={handleThemeChange}
                className='enhanced-input enhanced-focus bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-nasa-blue focus:border-transparent appearance-none cursor-pointer min-w-[140px] transition-all duration-300 hover:bg-white/15 hover:border-white/30 backdrop-blur-sm'
              >
                <option value='light' className='bg-gray-800 text-white'>🌞 Light Mode</option>
                <option value='dark' className='bg-gray-800 text-white'>🌙 Dark Mode</option>
                <option value='nasa' className='bg-gray-800 text-white'>🚀 NASA Theme</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Icon name="expand_more" size="small" className="text-gray-400 group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
          </div>

          {/* Enhanced Mobile Menu Button */}
          <button
            className='md:hidden relative p-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label='Toggle navigation menu'
          >
            <div className="relative">
              <Icon 
                name={isMenuOpen ? 'close' : 'menu'} 
                size='small' 
                className="transition-transform duration-300 group-hover:scale-110" 
              />
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-nasa-blue to-nasa-red rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10" />
            </div>
          </button>
        </div>

        {/* Enhanced Mobile Navigation Menu */}
        <div
          className={`md:hidden transition-all duration-500 ease-out overflow-hidden ${
            isMenuOpen 
              ? 'max-h-screen opacity-100 pb-6 transform translate-y-0' 
              : 'max-h-0 opacity-0 transform -translate-y-4'
          }`}
        >
          <div className='pt-6 space-y-6'>
            {/* Mobile Navigation Links with improved layout */}
            <div className='space-y-3'>
              <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider px-3 flex items-center space-x-2'>
                <Icon name="explore" size="small" />
                <span>Navigation</span>
              </h3>
              <div className='grid grid-cols-1 gap-3 px-3'>
                <MobileNavLink 
                  onClick={handleNEOVisualizationNavigation} 
                  icon='dangerous' 
                  text='NEO Tracking' 
                  description="Monitor near-Earth objects"
                />
                <MobileNavLink 
                  onClick={handleUniverseVisualizationNavigation} 
                  icon='stars' 
                  text='Universe Explorer' 
                  description="Explore the cosmos in 3D"
                />
              </div>
            </div>

            {/* Mobile Navigation Lock/Unlock Button */}
            {preventNavigation && (
              <div className='px-3 space-y-3'>
                <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-2'>
                  <span>🔒</span>
                  <span>Navigation Status</span>
                </h3>
                <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <span className='text-yellow-400 text-lg'>🔒</span>
                      <div>
                        <div className='text-yellow-400 font-medium text-sm'>Navigation Locked</div>
                        <div className='text-yellow-300/70 text-xs'>Simulation in progress</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPreventNavigation(false);
                        setIsMenuOpen(false);
                      }}
                      className='bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 animate-pulse'
                    >
                      🔓 Unlock
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Mobile Theme Selector */}
            <div className='px-3 space-y-3'>
              <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-2'>
                <Icon name="palette" size="small" />
                <span>Theme</span>
              </h3>
              <div className="relative">
                <select
                  value={currentTheme}
                  onChange={handleThemeChange}
                  className='w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-nasa-blue focus:border-transparent appearance-none cursor-pointer transition-all duration-300 hover:bg-white/15 backdrop-blur-sm'
                >
                  <option value='light' className='bg-gray-800 text-white'>🌞 Light Mode</option>
                  <option value='dark' className='bg-gray-800 text-white'>🌙 Dark Mode</option>
                  <option value='nasa' className='bg-gray-800 text-white'>🚀 NASA Theme</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Icon name="expand_more" size="small" className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='px-3 pt-2 border-t border-white/10'>
              <div className='flex justify-center'>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className='px-6 py-2 bg-gradient-to-r from-nasa-blue to-nasa-red text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-nasa-blue/25'
                >
                  Close Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Enhanced Mobile NavLink component
const MobileNavLink = ({ onClick, icon, text, description }) => (
  <button
    onClick={onClick}
    className='w-full p-4 rounded-xl text-left text-gray-300 hover:text-white hover:bg-white/10 bg-white/5 transition-all duration-300 flex items-center space-x-4 group hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10 border border-white/5 hover:border-white/20'
  >
    <div className="p-2 bg-gradient-to-br from-nasa-blue/20 to-nasa-red/20 rounded-lg group-hover:from-nasa-blue/30 group-hover:to-nasa-red/30 transition-all duration-300">
      <Icon name={icon} size='small' className="transition-transform duration-300 group-hover:scale-110" />
    </div>
    <div className="flex-1">
      <div className='font-medium text-sm'>{text}</div>
      {description && (
        <div className='text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors duration-300'>
          {description}
        </div>
      )}
    </div>
    <Icon name="arrow_forward_ios" size="small" className="text-gray-500 group-hover:text-gray-300 transition-all duration-300 group-hover:translate-x-1" />
  </button>
);

export default Navbar;
