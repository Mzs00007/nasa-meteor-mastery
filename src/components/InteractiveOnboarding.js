import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryContext } from './StorytellingFramework';

const OnboardingTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const { advanceChapter, addAchievement } = useContext(StoryContext);

  useEffect(() => {
    // Check if user has seen tutorial before
    const tutorialSeen = localStorage.getItem('meteor-mastery-tutorial-seen');
    if (!tutorialSeen) {
      setIsActive(true);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const tutorialSteps = [
    {
      target: '.navigation-panel',
      title: "🎯 Mission Control Center",
      content: "This is your mission control panel! It can move to any corner of your screen. Try clicking the position buttons to find your perfect command center location.",
      position: 'right',
      action: 'highlight',
      storyContext: "Every space mission needs a reliable control center. This panel is your lifeline to mission success!"
    },
    {
      target: '.simulation-controls',
      title: "🚀 Simulation Controls",
      content: "Here's where the magic happens! Configure asteroid parameters, set trajectories, and launch simulations to protect Earth.",
      position: 'bottom',
      action: 'pulse',
      storyContext: "These controls are based on real NASA technology used for planetary defense missions."
    },
    {
      target: '.results-visualization',
      title: "📊 Mission Analysis",
      content: "Your simulation results appear here with interactive charts and 3D visualizations. Every data point could save millions of lives!",
      position: 'left',
      action: 'glow',
      storyContext: "Real NASA scientists use similar visualizations to track potentially hazardous asteroids."
    },
    {
      target: '.export-controls',
      title: "📋 Mission Reports",
      content: "Export your findings to share with the global space community. Your discoveries could influence real planetary defense strategies!",
      position: 'top',
      action: 'bounce',
      storyContext: "NASA shares asteroid data with space agencies worldwide through similar reporting systems."
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    localStorage.setItem('meteor-mastery-tutorial-seen', 'true');
  };

  const completeTutorial = () => {
    setIsActive(false);
    localStorage.setItem('meteor-mastery-tutorial-seen', 'true');
    advanceChapter('discovery');
    addAchievement({
      name: "Mission Briefing Complete",
      description: "Successfully completed the onboarding tutorial",
      points: 100,
      icon: "🎓"
    });
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive) {
    return hasSeenTutorial ? (
      <button
        onClick={restartTutorial}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors z-40"
      >
        🎓 Replay Tutorial
      </button>
    ) : null;
  }

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 z-50"
        style={{ pointerEvents: 'none' }}
      />

      {/* Tutorial Spotlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed z-50"
        style={{
          // Position based on target element (simplified for demo)
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto'
        }}
      >
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 text-white rounded-xl shadow-2xl border border-blue-400 max-w-md">
          {/* Header */}
          <div className="p-4 border-b border-blue-400">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{currentTutorialStep.title}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-300">
                  {currentStep + 1} / {tutorialSteps.length}
                </span>
                <button
                  onClick={skipTutorial}
                  className="text-gray-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm leading-relaxed mb-4">
              {currentTutorialStep.content}
            </p>
            
            {/* Story Context */}
            <div className="bg-blue-800 bg-opacity-50 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <span className="text-lg mr-2">💡</span>
                <div>
                  <h4 className="text-xs font-semibold text-blue-300 mb-1">Did You Know?</h4>
                  <p className="text-xs text-blue-100">{currentTutorialStep.storyContext}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded text-sm transition-colors"
              >
                ← Previous
              </button>

              <button
                onClick={skipTutorial}
                className="px-3 py-1 text-gray-300 hover:text-white text-sm transition-colors"
              >
                Skip Tutorial
              </button>

              <button
                onClick={nextStep}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Complete 🚀' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animated Arrow Pointer */}
      <motion.div
        className="fixed z-40 pointer-events-none"
        animate={{
          y: [0, -10, 0],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          // Position arrow based on tutorial step (simplified)
          top: '40%',
          left: '30%',
          fontSize: '2rem'
        }}
      >
        👆
      </motion.div>
    </AnimatePresence>
  );
};

// Contextual Help System
export const ContextualHelp = ({ target, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="text-blue-400 hover:text-blue-300 text-sm ml-1"
      >
        ❓
      </button>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute z-50 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg max-w-xs ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <div className="relative">
              {content}
              {/* Arrow */}
              <div
                className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 ${
                  position === 'top'
                    ? 'top-full border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'
                    : 'bottom-full border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const InteractiveOnboarding = OnboardingTutorial;
export { ContextualHelp };
export default OnboardingTutorial;