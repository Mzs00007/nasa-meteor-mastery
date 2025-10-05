import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryContext } from './StorytellingFramework';

export const CharacterGuide = () => {
  const { currentChapter, achievements, updateProgress } = useContext(StoryContext);
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [characterState, setCharacterState] = useState('idle'); // idle, speaking, celebrating
  const [showHint, setShowHint] = useState(false);

  // Character messages based on current context and user behavior
  const characterMessages = {
    welcome: {
      greeting: "🚀 Welcome to Mission Control! I'm Commander Nova, your space exploration guide.",
      hint: "Click on any element to learn more about it. I'll be here to help you navigate!",
      celebration: "Great! You're getting the hang of space exploration!"
    },
    simulation: {
      greeting: "🛰️ Ready to simulate asteroid impacts? Let's set up your mission parameters.",
      hint: "Try adjusting the asteroid size and velocity. Each parameter affects the impact differently!",
      celebration: "Excellent simulation setup! You're thinking like a real NASA scientist!"
    },
    results: {
      greeting: "📊 Amazing! Your simulation is complete. Let's analyze the data together.",
      hint: "Hover over the charts to see detailed information. The 3D view shows the impact trajectory!",
      celebration: "Outstanding analysis! You've mastered the art of impact assessment!"
    },
    navigation: {
      greeting: "🎯 I see you're exploring the navigation panel. Smart move!",
      hint: "You can move this control panel to any corner. Find your perfect mission control setup!",
      celebration: "Perfect! You've customized your workspace like a true mission commander!"
    }
  };

  // Detect user interactions and provide contextual guidance
  useEffect(() => {
    const handleUserInteraction = (event) => {
      const target = event.target;
      
      // Detect clicks on interactive elements
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        setCharacterState('celebrating');
        setTimeout(() => setCharacterState('idle'), 2000);
      }
      
      // Detect hover on charts or complex elements
      if (target.closest('.recharts-wrapper') || target.closest('.chart-container')) {
        setShowHint(true);
        setCurrentMessage(characterMessages[currentChapter]?.hint || "Explore this data visualization!");
        setTimeout(() => setShowHint(false), 3000);
      }
    };

    // Detect when user seems lost (no interaction for a while)
    let inactivityTimer;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setIsVisible(true);
        setCurrentMessage("Need help? I'm here to guide you through your space mission!");
        setCharacterState('speaking');
      }, 30000); // Show help after 30 seconds of inactivity
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('mousemove', resetInactivityTimer);
      document.removeEventListener('click', resetInactivityTimer);
      clearTimeout(inactivityTimer);
    };
  }, [currentChapter]);

  // Show character when chapter changes
  useEffect(() => {
    if (currentChapter) {
      setIsVisible(true);
      setCurrentMessage(characterMessages[currentChapter]?.greeting || "Welcome to your space mission!");
      setCharacterState('speaking');
      
      // Auto-hide after showing greeting
      setTimeout(() => {
        setIsVisible(false);
        setCharacterState('idle');
      }, 5000);
    }
  }, [currentChapter]);

  // Character animations
  const characterVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    speaking: {
      scale: [1, 1.05, 1],
      rotate: [-2, 2, -2, 0],
      transition: { duration: 0.6, repeat: 2 }
    },
    celebrating: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: { duration: 0.8 }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {(isVisible || showHint) && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed bottom-6 left-6 z-50 flex items-end gap-3"
        >
          {/* Character Avatar */}
          <motion.div
            variants={characterVariants}
            animate={characterState}
            className="relative"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
              <span className="text-2xl">👨‍🚀</span>
            </div>
            
            {/* Status indicator */}
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
              animate={{
                scale: characterState === 'speaking' ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: characterState === 'speaking' ? Infinity : 0 }}
            />
          </motion.div>

          {/* Message Bubble */}
          <AnimatePresence mode="wait">
            {currentMessage && (
              <motion.div
                key={currentMessage}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="max-w-xs bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-white/20"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {currentMessage}
                  </p>
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setShowHint(false);
                      setCurrentMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                
                {/* Speech bubble tail */}
                <div className="absolute bottom-4 -left-2 w-0 h-0 border-t-8 border-t-white/95 border-r-8 border-r-transparent" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick action buttons */}
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setCurrentMessage("💡 Tip: Use the navigation panel to move between different mission areas. Each section has unique tools and data!");
                  setCharacterState('speaking');
                }}
                className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-yellow-600 transition-colors"
                title="Get a helpful tip"
              >
                💡
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setCurrentMessage("🎯 Try clicking on charts, buttons, and panels to discover interactive features. Everything here is designed for exploration!");
                  setCharacterState('speaking');
                }}
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
                title="Show interactive elements"
              >
                🎯
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CharacterGuide;