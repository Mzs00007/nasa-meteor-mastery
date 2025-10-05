import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// import { StoryContext } from './StorytellingFramework';
// import { ContextualHelp } from './InteractiveOnboarding';

const MoveableNavigationPanel = ({ onClose }) => {
  const navigate = useNavigate();
  // const { currentChapter, storyChapters, addAchievement } = useContext(StoryContext);
  const [position, setPosition] = useState('top-left'); // top-left, top-right, bottom-left, bottom-right
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPositionHint, setShowPositionHint] = useState(false);
  const [hasUsedPositioning, setHasUsedPositioning] = useState(false);

  // Position configurations
  const positions = {
    'top-left': {
      top: '20px',
      left: '20px',
      right: 'auto',
      bottom: 'auto'
    },
    'top-right': {
      top: '20px',
      right: '20px',
      left: 'auto',
      bottom: 'auto'
    },
    'bottom-left': {
      bottom: '20px',
      left: '20px',
      top: 'auto',
      right: 'auto'
    },
    'bottom-right': {
      bottom: '20px',
      right: '20px',
      top: 'auto',
      left: 'auto'
    }
  };

  // Save position to localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('navigationPanelPosition');
    if (savedPosition && positions[savedPosition]) {
      setPosition(savedPosition);
    }
  }, []);

  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
    localStorage.setItem('navigationPanelPosition', newPosition);
    setIsExpanded(false);
    
    // Track user engagement and provide achievements
    if (!hasUsedPositioning) {
      setHasUsedPositioning(true);
      // addAchievement({
      //   name: "Mission Control Customization",
      //   description: "Personalized your command center position",
      //   points: 50,
      //   icon: "🎯"
      // });
    }
    
    // Show contextual feedback
    setShowPositionHint(true);
    setTimeout(() => setShowPositionHint(false), 2000);
  };

  const handleHomeNavigation = () => {
    navigate('/');
  };

  const panelVariants = {
    collapsed: {
      width: '60px',
      height: '60px',
      borderRadius: '30px'
    },
    expanded: {
      width: '200px',
      height: 'auto',
      borderRadius: '15px'
    }
  };

  const contentVariants = {
    collapsed: {
      opacity: 0,
      scale: 0
    },
    expanded: {
      opacity: 1,
      scale: 1
    }
  };

  return (
    <motion.div
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={panelVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        ...positions[position],
        zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        cursor: isDragging ? 'grabbing' : 'pointer'
      }}
      onClick={() => !isExpanded && setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Collapsed state - mission control icon with story context */}
      {!isExpanded && (
        <motion.div
          className="w-full h-full flex items-center justify-center relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-white text-2xl">🚀</span>
          
          {/* Pulsing indicator for new users */}
          {/* {currentChapter === 'welcome' && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )} */}
          
          {/* Position change feedback */}
          <AnimatePresence>
            {showPositionHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              >
                Perfect position! 🎯
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={contentVariants}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="p-4"
          >
            {/* Header with story context */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-sm">Mission Control</h3>
                {/* <ContextualHelp 
                  content="Your personal command center! Move it anywhere on screen for optimal mission monitoring. Real NASA mission control centers are customized for each mission's needs."
                /> */}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="text-white/70 hover:text-white transition-colors"
                title="Minimize control panel"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>

            {/* Main navigation button with story context */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleHomeNavigation();
              }}
              className="enhanced-btn enhanced-focus enhanced-glow w-full bg-white/20 hover:bg-white/30 text-white py-2 px-3 rounded-lg mb-3 flex items-center gap-2 transition-colors relative"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Return to Mission Headquarters"
            >
              <span>🏠</span>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Mission HQ</span>
                <span className="text-xs text-white/70">Return to base</span>
              </div>
              
              {/* Chapter-based visual indicator */}
              {/* {currentChapter === 'welcome' && (
                <motion.div
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-yellow-400">→</span>
                </motion.div>
              )} */}
            </motion.button>

            {/* Position controls with enhanced UX */}
            <div className="border-t border-white/20 pt-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-white/70">🎯</span>
                <span className="text-white/70 text-xs">Control Center Position</span>
                {/* <ContextualHelp 
                  content="Position your mission control for optimal viewing! NASA flight controllers arrange their workstations based on mission requirements and personal preference."
                  position="bottom"
                /> */}
              </div>
              
              {/* Visual position grid */}
              <div className="grid grid-cols-2 gap-1 mb-2">
                {Object.keys(positions).map((pos) => {
                  const isActive = position === pos;
                  const positionLabels = {
                    'top-left': '↖️ Top Left',
                    'top-right': '↗️ Top Right', 
                    'bottom-left': '↙️ Bottom Left',
                    'bottom-right': '↘️ Bottom Right'
                  };
                  
                  return (
                    <motion.button
                      key={pos}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePositionChange(pos);
                      }}
                      className={`text-xs py-2 px-2 rounded transition-all duration-200 relative ${
                        isActive
                          ? 'bg-blue-500/40 text-white border border-blue-400'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 border border-transparent'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={`Move control center to ${pos.replace('-', ' ')}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm">{positionLabels[pos].split(' ')[0]}</span>
                        <span className="text-xs leading-tight">{positionLabels[pos].substring(3)}</span>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Helpful tip for new users */}
              {!hasUsedPositioning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-blue-300 bg-blue-900/30 rounded p-2 mt-2"
                >
                  💡 Try different positions to find your perfect mission control setup!
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MoveableNavigationPanel;