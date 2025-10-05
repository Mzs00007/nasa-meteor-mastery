import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryContext } from './StorytellingFramework';

// Enhanced Loading States Component
export const EnhancedLoadingStates = ({ isLoading, loadingMessage, progress = 0 }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {loadingMessage || 'Processing Mission Data'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            Analyzing space data{dots}
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <p className="text-sm text-gray-500">
            {progress}% Complete
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Interactive Element Highlighter
export const InteractiveElementHighlighter = () => {
  const [highlightedElements, setHighlightedElements] = useState([]);
  const [showHighlights, setShowHighlights] = useState(false);

  useEffect(() => {
    const findInteractiveElements = () => {
      const selectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        '[role="button"]:not([disabled])',
        '[onclick]',
        '.clickable',
        '.interactive'
      ];

      const elements = [];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (el.offsetParent !== null) { // Element is visible
            const rect = el.getBoundingClientRect();
            elements.push({
              id: Math.random().toString(36).substr(2, 9),
              element: el,
              rect: rect,
              type: el.tagName.toLowerCase(),
              text: el.textContent?.trim().substring(0, 50) || 'Interactive Element'
            });
          }
        });
      });

      setHighlightedElements(elements);
    };

    if (showHighlights) {
      findInteractiveElements();
      const interval = setInterval(findInteractiveElements, 1000);
      return () => clearInterval(interval);
    }
  }, [showHighlights]);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowHighlights(!showHighlights)}
        className={`fixed top-20 right-4 z-40 px-4 py-2 rounded-lg shadow-lg transition-colors ${
          showHighlights 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {showHighlights ? '🔍 Hide Interactive Elements' : '🔍 Show Interactive Elements'}
      </motion.button>

      {/* Highlights overlay */}
      <AnimatePresence>
        {showHighlights && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-30"
          >
            {highlightedElements.map(({ id, rect, text, type }) => (
              <motion.div
                key={id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  position: 'absolute',
                  left: rect.left - 4,
                  top: rect.top - 4,
                  width: rect.width + 8,
                  height: rect.height + 8,
                }}
                className="border-2 border-yellow-400 bg-yellow-400/20 rounded pointer-events-none"
              >
                <div className="absolute -top-8 left-0 bg-yellow-400 text-black text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs truncate">
                  {type.toUpperCase()}: {text}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Feature Discovery Panel
export const FeatureDiscoveryPanel = () => {
  const { currentChapter, updateProgress } = useContext(StoryContext);
  const [isOpen, setIsOpen] = useState(false);
  const [discoveredFeatures, setDiscoveredFeatures] = useState(new Set());

  const features = {
    welcome: [
      { id: 'navigation', name: 'Moveable Navigation Panel', description: 'Drag and position your control center anywhere on screen' },
      { id: 'themes', name: 'Theme Customization', description: 'Change the visual appearance of your mission control' },
      { id: 'notifications', name: 'Smart Notifications', description: 'Draggable notifications that keep you informed' }
    ],
    simulation: [
      { id: 'parameters', name: 'Simulation Parameters', description: 'Adjust asteroid size, velocity, and composition' },
      { id: 'realtime', name: 'Real-time Calculations', description: 'Watch physics calculations update in real-time' },
      { id: 'presets', name: 'Quick Presets', description: 'Use predefined scenarios for common asteroid types' }
    ],
    results: [
      { id: 'charts', name: 'Interactive Charts', description: 'Hover and click on data points for detailed information' },
      { id: '3dview', name: '3D Visualization', description: 'Rotate and zoom the 3D impact visualization' },
      { id: 'export', name: 'Data Export', description: 'Download simulation results in various formats' }
    ]
  };

  const currentFeatures = features[currentChapter] || [];

  const markFeatureDiscovered = (featureId) => {
    setDiscoveredFeatures(prev => new Set([...prev, featureId]));
    updateProgress('feature_discovery', featureId);
  };

  return (
    <>
      {/* Discovery toggle button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-32 right-4 z-40 w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center"
        title="Feature Discovery"
      >
        🎯
      </motion.button>

      {/* Discovery panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-44 right-4 z-40 w-80 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-white/20 p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                🎯 Feature Discovery
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {currentFeatures.map(feature => {
                const isDiscovered = discoveredFeatures.has(feature.id);
                return (
                  <motion.div
                    key={feature.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isDiscovered 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer'
                    }`}
                    onClick={() => !isDiscovered && markFeatureDiscovered(feature.id)}
                    whileHover={!isDiscovered ? { scale: 1.02 } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                        isDiscovered ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {isDiscovered ? '✓' : '?'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">
                          {feature.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress:</span>
                <span>{discoveredFeatures.size}/{currentFeatures.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <motion.div
                  className="bg-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(discoveredFeatures.size / currentFeatures.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Scientific Context Provider
export const ScientificContextProvider = ({ children }) => {
  const [showContext, setShowContext] = useState(false);
  const [contextData, setContextData] = useState(null);

  const scientificContexts = {
    asteroid_impact: {
      title: "Asteroid Impact Science",
      content: "When asteroids enter Earth's atmosphere, they create spectacular fireballs. The energy released depends on size, velocity, and composition. Most small asteroids burn up completely, but larger ones can reach the surface and create craters.",
      facts: [
        "The Chicxulub impact 66 million years ago created a 150km crater",
        "Most meteorites are fragments of asteroids",
        "NASA tracks over 90% of near-Earth asteroids larger than 1km"
      ]
    },
    orbital_mechanics: {
      title: "Orbital Mechanics",
      content: "Objects in space follow predictable paths governed by gravity. Understanding these orbits helps us predict asteroid trajectories and plan spacecraft missions.",
      facts: [
        "Kepler's laws describe planetary motion",
        "Gravity assists can accelerate spacecraft",
        "Orbital periods depend on distance from the central body"
      ]
    }
  };

  const showScientificContext = (contextKey) => {
    setContextData(scientificContexts[contextKey]);
    setShowContext(true);
  };

  return (
    <>
      {children}
      
      {/* Scientific context panel */}
      <AnimatePresence>
        {showContext && contextData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  🔬 {contextData.title}
                </h2>
                <button
                  onClick={() => setShowContext(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <p className="text-gray-700 mb-4 leading-relaxed">
                {contextData.content}
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  🌟 Did You Know?
                </h3>
                <ul className="space-y-2">
                  {contextData.facts.map((fact, index) => (
                    <li key={index} className="text-blue-700 text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default {
  EnhancedLoadingStates,
  InteractiveElementHighlighter,
  FeatureDiscoveryPanel,
  ScientificContextProvider
};