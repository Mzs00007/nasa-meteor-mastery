import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import Icon from './Icon';
import '../styles/main.css';

// NavLink component for consistent styling
const NavLink = ({ onClick, icon, text, title }) => (
  <button
    onClick={onClick}
    className='px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center space-x-2'
    title={title}
  >
    <Icon name={icon} size='small' />
    <span className='hidden xl:block'>{text}</span>
  </button>
);

const Navbar = ({ onThemeChange, currentTheme }) => {
  const { setView, view } = useSimulation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('both');

  useEffect(() => {
    // Set active tab based on current view
    setActiveTab(view || 'both');
  }, [view]);

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
    // Navigate to orbital mechanics visualization
    window.location.href = '/orbital-mechanics';
    setIsMenuOpen(false);
  };

  const handleUniverseVisualizationNavigation = () => {
    // Navigate to universe visualization
    window.location.href = '/universe-visualization';
    setIsMenuOpen(false);
  };

  const handleNEOVisualizationNavigation = () => {
    // Navigate to NEO visualization
    window.location.href = '/neo-visualization';
    setIsMenuOpen(false);
  };

  const handleISSTrackingNavigation = () => {
    // Navigate to ISS tracking visualization
    window.location.href = '/iss-tracking';
    setIsMenuOpen(false);
  };

  const handleSatelliteTrackingNavigation = () => {
    // Navigate to satellite constellation tracker
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
    <nav className='fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-lg border-b border-white/10 shadow-2xl'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 lg:h-20'>
          {/* Logo Section */}
          <div className='flex items-center space-x-3'>
            <a href='#!' className='flex items-center space-x-2 group'>
              <div className='p-2 bg-gradient-to-br from-nasa-blue to-nasa-red rounded-xl group-hover:scale-110 transition-transform duration-300'>
                <Icon
                  name='brightness_high'
                  className='text-white'
                  size='small'
                />
              </div>
              <span className='hidden sm:block text-xl lg:text-2xl font-bold bg-gradient-to-r from-nasa-blue to-nasa-red bg-clip-text text-transparent'>
                Meteor Mastery
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-1'>
            {/* View Controls */}
            <div className='flex items-center space-x-1 bg-white/5 rounded-xl p-1 mr-4'>
              <button
                onClick={() => handleViewChange('both')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'both' 
                    ? 'bg-nasa-blue text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title='Switch to combined 3D and 2D view display'
              >
                <Icon name='view_agenda' size='small' />
                <span>Both Views</span>
              </button>
              <button
                onClick={() => handleViewChange('3d')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === '3d' 
                    ? 'bg-nasa-blue text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title='Switch to 3D orbital visualization view'
              >
                <Icon name='3d_rotation' size='small' />
                <span>3D View</span>
              </button>
              <button
                onClick={() => handleViewChange('2d')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === '2d' 
                    ? 'bg-nasa-blue text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title='Switch to 2D impact map view'
              >
                <Icon name='map' size='small' />
                <span>2D Map</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className='flex items-center space-x-1'>
              <NavLink onClick={handleOrbitalMechanicsNavigation} icon='public' text='Orbital' />
              <NavLink onClick={handleUniverseVisualizationNavigation} icon='stars' text='Universe' />
              <NavLink onClick={handleNEOVisualizationNavigation} icon='dangerous' text='NEO' />
              <NavLink onClick={handleLiveAsteroidDataNavigation} icon='radar' text='Live Data' />
              <NavLink onClick={handleLiveSimulationNavigation} icon='rocket_launch' text='Simulation' />
              <NavLink onClick={handleISSTrackingNavigation} icon='satellite' text='ISS' />
              <NavLink onClick={handleSatelliteTrackingNavigation} icon='satellite_alt' text='Satellites' />
              <NavLink onClick={handleSpaceWeatherNavigation} icon='wb_sunny' text='Weather' />
              <NavLink onClick={handleComprehensiveAPIsNavigation} icon='api' text='APIs' />
              <NavLink onClick={handleMissionControlNavigation} icon='dashboard' text='Mission' />
              <NavLink onClick={handleHistoryNavigation} icon='history' text='History' />
            </div>

            {/* Theme Selector */}
            <div className='ml-4 relative'>
              <select
                value={currentTheme}
                onChange={handleThemeChange}
                className='bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-nasa-blue focus:border-transparent appearance-none cursor-pointer min-w-[120px]'
              >
                <option value='light' className='bg-gray-800 text-white'>Light Mode</option>
                <option value='dark' className='bg-gray-800 text-white'>Dark Mode</option>
                <option value='nasa' className='bg-gray-800 text-white'>NASA Theme</option>
              </select>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className='lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label='Toggle navigation menu'
          >
            <Icon name={isMenuOpen ? 'close' : 'menu'} size='small' />
          </button>
        </div>

        {/* Mobile Navigation Menu */}
         <div
           className={`lg:hidden transition-all duration-300 ease-in-out ${
             isMenuOpen 
               ? 'max-h-screen opacity-100 pb-6' 
               : 'max-h-0 opacity-0 overflow-hidden'
           }`}
         >
           <div className='pt-4 space-y-4'>
             {/* Mobile View Controls */}
             <div className='space-y-2'>
               <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider px-3'>View Controls</h3>
               <div className='grid grid-cols-3 gap-2 px-3'>
                 <button
                   onClick={() => handleViewChange('both')}
                   className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                     activeTab === 'both' 
                       ? 'bg-nasa-blue text-white shadow-lg' 
                       : 'text-gray-300 hover:text-white hover:bg-white/10 bg-white/5'
                   }`}
                 >
                   <Icon name='view_agenda' size='small' />
                   <span>Both</span>
                 </button>
                 <button
                   onClick={() => handleViewChange('3d')}
                   className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                     activeTab === '3d' 
                       ? 'bg-nasa-blue text-white shadow-lg' 
                       : 'text-gray-300 hover:text-white hover:bg-white/10 bg-white/5'
                   }`}
                 >
                   <Icon name='3d_rotation' size='small' />
                   <span>3D</span>
                 </button>
                 <button
                   onClick={() => handleViewChange('2d')}
                   className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                     activeTab === '2d' 
                       ? 'bg-nasa-blue text-white shadow-lg' 
                       : 'text-gray-300 hover:text-white hover:bg-white/10 bg-white/5'
                   }`}
                 >
                   <Icon name='map' size='small' />
                   <span>2D</span>
                 </button>
               </div>
             </div>

             {/* Mobile Navigation Links */}
             <div className='space-y-2'>
               <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider px-3'>Navigation</h3>
               <div className='grid grid-cols-2 gap-2 px-3'>
                 <MobileNavLink onClick={handleOrbitalMechanicsNavigation} icon='public' text='Orbital Mechanics' />
                 <MobileNavLink onClick={handleUniverseVisualizationNavigation} icon='stars' text='Universe' />
                 <MobileNavLink onClick={handleNEOVisualizationNavigation} icon='dangerous' text='NEO Tracking' />
                 <MobileNavLink onClick={handleLiveAsteroidDataNavigation} icon='radar' text='Live Data' />
                 <MobileNavLink onClick={handleLiveSimulationNavigation} icon='rocket_launch' text='Simulation' />
                 <MobileNavLink onClick={handleISSTrackingNavigation} icon='satellite' text='ISS Tracking' />
                 <MobileNavLink onClick={handleSatelliteTrackingNavigation} icon='satellite_alt' text='Satellites' />
                 <MobileNavLink onClick={handleSpaceWeatherNavigation} icon='wb_sunny' text='Space Weather' />
                 <MobileNavLink onClick={handleComprehensiveAPIsNavigation} icon='api' text='NASA APIs' />
                 <MobileNavLink onClick={handleMissionControlNavigation} icon='dashboard' text='Mission Control' />
                 <MobileNavLink onClick={handleHistoryNavigation} icon='history' text='History' />
                 <MobileNavLink onClick={handleMeteorologicalSimulationNavigation} icon='cloud' text='Meteorology' />
               </div>
             </div>

             {/* Mobile Theme Selector */}
             <div className='px-3 space-y-2'>
               <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Theme</h3>
               <select
                 value={currentTheme}
                 onChange={handleThemeChange}
                 className='w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-nasa-blue focus:border-transparent appearance-none cursor-pointer'
               >
                 <option value='light' className='bg-gray-800 text-white'>Light Mode</option>
                 <option value='dark' className='bg-gray-800 text-white'>Dark Mode</option>
                 <option value='nasa' className='bg-gray-800 text-white'>NASA Theme</option>
               </select>
             </div>
           </div>
         </div>
       </div>
     </nav>
   );
 };

// Mobile NavLink component
const MobileNavLink = ({ onClick, icon, text }) => (
  <button
    onClick={onClick}
    className='p-3 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 bg-white/5 transition-all duration-200 flex flex-col items-center space-y-1 min-h-[4rem]'
  >
    <Icon name={icon} size='small' />
    <span className='text-center leading-tight'>{text}</span>
  </button>
);

export default Navbar;
