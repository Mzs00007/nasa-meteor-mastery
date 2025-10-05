import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdvancedSimulationResults from './components/AdvancedSimulationResults';
import AsteroidInput from './components/AsteroidInput';
import BackButton from './components/BackButton';
import EducationalContent from './components/EducationalContent';
import GlamorousLandingPage from './components/GlamorousLandingPage';
import ImpactMap2D from './components/ImpactMap2D';
import ImpactMapPage from './components/ImpactMapPage';
import InteractiveSimulationResults from './components/InteractiveSimulationResults';
import LiveAsteroidData from './components/LiveAsteroidData';
import LiveAsteroidSimulation from './components/LiveAsteroidSimulation';
import MeteorInterception from './components/MeteorInterception';
import MeteorologicalSimulation from './components/MeteorologicalSimulation';
import CesiumEarthVisualization from './components/mission-control/CesiumEarthVisualization';
import ISSTrackingVisualization from './components/mission-control/ISSTrackingVisualization';
import NASAMissionControl from './components/mission-control/NASAMissionControl';
import OpenMCTMissionControl from './components/mission-control/OpenMCTMissionControl';
import OrbitalMechanicsVisualization from './components/mission-control/OrbitalMechanicsVisualization';
import SatelliteConstellationTracker from './components/mission-control/SatelliteConstellationTracker';
// import SolarSystemNEOVisualization from './components/mission-control/SolarSystemNEOVisualization'; // Temporarily disabled
import UniverseVisualization from './components/mission-control/UniverseVisualization';
import NASAIntegrationPanel from './components/NASAIntegrationPanel';
import ComprehensiveAPIDashboard from './components/Dashboard/ComprehensiveAPIDashboard';
import SolarSystemPage from './components/SolarSystemPage';
import Navbar from './components/Navbar';
import Orbit3DView from './components/Orbit3DView';
import RealTimeStatusIndicator from './components/RealTimeStatusIndicator';
import SimulationHistory from './components/SimulationHistory';
import SimulationSetup from './components/SimulationSetup';
import SpaceWeatherMonitor from './components/mission-control/SpaceWeatherMonitor';
import TutorialGuide from './components/TutorialGuide';
import { SimulationProvider } from './context/SimulationContext';
// import { StoryProvider } from './components/StorytellingFramework';
// import { InteractiveOnboarding } from './components/InteractiveOnboarding';
// import { CharacterGuide } from './components/CharacterGuide';
// import { 
//   InteractiveElementHighlighter, 
//   FeatureDiscoveryPanel,
//   ScientificContextProvider 
// } from './components/UXImprovements';
import appController from './controllers/AppController';
import globalButtonUtils from './utils/GlobalButtonUtils';
import { getUIUtilities } from './utils/UIUtilities';
import './styles/tailwind.css'; // Unified CSS with Tailwind, Bootstrap, W3.CSS, and custom styles

// Create App Controller Context
const AppControllerContext = createContext(null);

// Custom hook to use App Controller
export const useAppController = () => {
  const context = useContext(AppControllerContext);
  if (!context) {
    throw new Error(
      'useAppController must be used within AppControllerProvider'
    );
  }
  return context;
};

// App Controller Provider Component
const AppControllerProvider = ({ children }) => {
  const [controllerAPI, setControllerAPI] = useState(null);

  useEffect(() => {
    // Initialize the controller API
    const api = appController.getAPI();
    setControllerAPI(api);

    // Cleanup on unmount
    return () => {
      appController.destroy();
    };
  }, []);

  if (!controllerAPI) {
    return <div>Initializing application...</div>;
  }

  return (
    <AppControllerContext.Provider value={controllerAPI}>
      {children}
    </AppControllerContext.Provider>
  );
};

function App() {
  const [activeTheme, setActiveTheme] = useState('theme-meteor-madness');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side', '3d-only', '2d-only'
  const [showInterceptionControls, setShowInterceptionControls] =
    useState(false);
  const uiUtilities = getUIUtilities();

  useEffect(() => {
    // Initialize global button utilities
    globalButtonUtils.initialize();

    // Initialize app controller
    appController.on('viewChanged', ({ current }) => {
      console.log('View changed to:', current);
    });

    appController.on('loadingChanged', isLoading => {
      setIsLoading(isLoading);
    });

    appController.on('errorAdded', error => {
      console.error('App error:', error);
    });

    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false);
      uiUtilities.addNotification(
        'Application loaded successfully!',
        'success',
        3000
      );
    }, 1500);

    return () => {
      clearTimeout(timer);
      appController.off('viewChanged');
      appController.off('loadingChanged');
      appController.off('errorAdded');
    };
  }, [uiUtilities]);

  const handleThemeChange = theme => {
    setActiveTheme(theme);
    appController.updatePreference('theme', theme);
    uiUtilities.applyTheme(theme);
  };

  const handleViewModeChange = mode => {
    setViewMode(mode);
    appController.updatePreference('viewMode', mode);
  };

  const toggleInterceptionControls = () => {
    setShowInterceptionControls(!showInterceptionControls);
  };

  return (
    <AppControllerProvider>
      <SimulationProvider>
        {/* <StoryProvider>
          <ScientificContextProvider> */}
            <BrowserRouter>
              <div className={`app ${activeTheme}`}>
            {isLoading ? (
              <div className='loading-screen'>
                <div className='loading-content'>
                  <h1 className='text-gradient'>Meteor Madness</h1>
                  <div className='loading-spinner' />
                  <p>Initializing advanced simulation environment...</p>
                  <div className='loading-progress'>
                    <div className='loading-bar' />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Navbar
                  onThemeChange={handleThemeChange}
                  activeTheme={activeTheme}
                />
                <BackButton />
                <div className='app-content'>
                  <Routes>
                    <Route path='/' element={<GlamorousLandingPage />} />
                    <Route path='/simulation' element={<SimulationSetup />} />
                    <Route
                      path='/simulation/results'
                      element={<InteractiveSimulationResults />}
                    />
                    <Route path='/impact' element={<ImpactMapPage />} />
                    <Route path='/history' element={<SimulationHistory />} />
                    <Route
                      path='/nasa-integrations'
                      element={<NASAIntegrationPanel />}
                    />
                    <Route
                      path='/comprehensive-apis'
                      element={<ComprehensiveAPIDashboard />}
                    />
                    <Route
                      path='/simulation/advanced-results'
                      element={<AdvancedSimulationResults />}
                    />
                    <Route path='/education' element={<EducationalContent />} />
                    <Route path='/tutorials' element={<TutorialGuide />} />
                    <Route
                      path='/live-asteroids'
                      element={<LiveAsteroidData />}
                    />
                    <Route
                      path='/live-simulation'
                      element={<LiveAsteroidSimulation />}
                    />
                    <Route
                      path='/mission-control'
                      element={<OpenMCTMissionControl />}
                    />
                    <Route
                      path='/universe-visualization'
                      element={<UniverseVisualization />}
                    />
                    <Route
                      path='/neo-visualization'
                      element={<div style={{padding: '20px', textAlign: 'center', fontSize: '18px', color: '#666'}}>NEO Visualization temporarily disabled for maintenance</div>}
                    />
                    <Route
                      path='/orbital-mechanics'
                      element={<OrbitalMechanicsVisualization />}
                    />
                    <Route
                      path='/iss-tracking'
                      element={<ISSTrackingVisualization />}
                    />
                    <Route
                      path='/satellite-tracking'
                      element={<SatelliteConstellationTracker />}
                    />
                    <Route
                      path='/space-weather'
                      element={<SpaceWeatherMonitor />}
                    />
                    <Route
                      path='/nasa-mission-control'
                      element={<NASAMissionControl />}
                    />
                    <Route
                      path='/cesium-earth'
                      element={<CesiumEarthVisualization />}
                    />
                    <Route
                      path='/meteorological-simulation'
                      element={<MeteorologicalSimulation />}
                    />
                    <Route
                      path='/solar-system'
                      element={<SolarSystemPage />}
                    />
                    <Route path='*' element={<Navigate to='/' replace />} />
                  </Routes>
                </div>

                {/* Real-time status indicator for WebSocket connection */}
                <RealTimeStatusIndicator position='top-right' showDetails />

                {/* Interactive Onboarding System */}
                {/* <InteractiveOnboarding /> */}

                {/* Character Guide */}
                {/* <CharacterGuide /> */}

                {/* UX Improvement Components */}
                {/* <InteractiveElementHighlighter />
                <FeatureDiscoveryPanel /> */}

                {/* Notification System */}
                <NotificationContainer />
              </>
            )}
              </div>
            </BrowserRouter>
          {/* </ScientificContextProvider>
        </StoryProvider> */}
      </SimulationProvider>
    </AppControllerProvider>
  );
}

// Notification Container Component
const NotificationContainer = () => {
  const uiUtils = getUIUtilities();
  const notifications = uiUtils.getNotifications();
  const removeNotification = uiUtils.removeNotification;
  const [draggedNotification, setDraggedNotification] = useState(null);
  const [notificationPositions, setNotificationPositions] = useState({});

  const handleDragStart = (e, notificationId) => {
    setDraggedNotification(notificationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e, notificationId) => {
    setDraggedNotification(null);
    const rect = e.target.getBoundingClientRect();
    const newPosition = {
      x: e.clientX - rect.width / 2,
      y: e.clientY - rect.height / 2
    };
    
    setNotificationPositions(prev => ({
      ...prev,
      [notificationId]: newPosition
    }));
  };

  const getNotificationStyle = (notificationId) => {
    const position = notificationPositions[notificationId];
    if (position) {
      return {
        position: 'fixed',
        left: `${Math.max(0, Math.min(position.x, window.innerWidth - 300))}px`,
        top: `${Math.max(0, Math.min(position.y, window.innerHeight - 100))}px`,
        zIndex: 1000
      };
    }
    return {};
  };

  return (
    <div className='notification-container fixed top-4 right-4 z-50 space-y-2'>
      {notifications.map(notification => (
        <div
          key={notification.id}
          draggable
          onDragStart={(e) => handleDragStart(e, notification.id)}
          onDragEnd={(e) => handleDragEnd(e, notification.id)}
          style={getNotificationStyle(notification.id)}
          className={`notification notification-${notification.type} 
                     bg-white/90 dark:bg-gray-800/90 border-l-4 p-4 rounded-lg shadow-xl 
                     transform transition-all duration-300 ease-in-out cursor-move
                     backdrop-filter blur(10px) border border-white/20
                     ${notification.type === 'error' ? 'border-l-red-500' : ''}
                     ${notification.type === 'success' ? 'border-l-green-500' : ''}
                     ${notification.type === 'warning' ? 'border-l-yellow-500' : ''}
                     ${notification.type === 'info' ? 'border-l-blue-500' : ''}
                     ${draggedNotification === notification.id ? 'scale-105 rotate-2' : 'hover:scale-102'}`}
        >
          <div className='flex justify-between items-start'>
            <div className='flex items-center space-x-2'>
              <div className='drag-handle text-gray-400 cursor-move'>⋮⋮</div>
              <p className='text-sm text-gray-700 dark:text-gray-300 select-none'>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className='ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-6 h-6 
                         flex items-center justify-center transition-colors'
            >
              ×
            </button>
          </div>
          
          {/* Auto-hide progress bar */}
          {notification.duration > 0 && (
            <div className='mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1'>
              <div 
                className={`h-1 rounded-full transition-all ease-linear
                           ${notification.type === 'error' ? 'bg-red-500' : ''}
                           ${notification.type === 'success' ? 'bg-green-500' : ''}
                           ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                           ${notification.type === 'info' ? 'bg-blue-500' : ''}`}
                style={{
                  width: '100%',
                  animation: `shrink ${notification.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default App;
