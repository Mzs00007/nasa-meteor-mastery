import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Storytelling Context for managing narrative state
export const StoryContext = React.createContext();

export const StoryProvider = ({ children }) => {
  const [currentChapter, setCurrentChapter] = useState('welcome');
  const [userProgress, setUserProgress] = useState({
    chaptersCompleted: [],
    achievements: [],
    totalScore: 0
  });
  const [showCharacterGuide, setShowCharacterGuide] = useState(true);
  const [narrativeMode, setNarrativeMode] = useState(true);

  const storyChapters = {
    welcome: {
      title: "Welcome to Mission Control",
      character: "Dr. Sarah Chen, NASA Mission Specialist",
      narrative: "Welcome, Space Guardian! I'm Dr. Sarah Chen, and I need your help. Earth faces a potential asteroid threat, and you're our newest recruit in the Planetary Defense Program.",
      objectives: ["Learn about asteroid detection", "Understand the mission"],
      nextChapter: "discovery"
    },
    discovery: {
      title: "The Discovery",
      character: "Dr. Sarah Chen",
      narrative: "Our deep space telescopes have detected several Near-Earth Objects (NEOs). Your mission: analyze these cosmic visitors and determine which ones pose a threat to our planet.",
      objectives: ["Explore the simulation interface", "Learn navigation controls"],
      nextChapter: "analysis"
    },
    analysis: {
      title: "Scientific Analysis",
      character: "Dr. Marcus Rodriguez, Astrophysicist",
      narrative: "Now comes the critical part - analyzing asteroid trajectories. Every parameter you adjust could mean the difference between a safe passage and a catastrophic impact.",
      objectives: ["Configure simulation parameters", "Run trajectory analysis"],
      nextChapter: "decision"
    },
    decision: {
      title: "The Critical Decision",
      character: "Commander Lisa Park",
      narrative: "Based on your analysis, we need to make crucial decisions. Should we deploy a deflection mission? Alert global authorities? The fate of Earth rests in your capable hands.",
      objectives: ["Interpret simulation results", "Make mission recommendations"],
      nextChapter: "hero"
    },
    hero: {
      title: "Planetary Hero",
      character: "Dr. Sarah Chen",
      narrative: "Congratulations! Your expertise has helped protect Earth from potential asteroid threats. You're now a certified member of our Planetary Defense Team!",
      objectives: ["Celebrate your achievement", "Explore advanced features"],
      nextChapter: null
    }
  };

  const advanceChapter = (chapterId) => {
    setCurrentChapter(chapterId);
    setUserProgress(prev => ({
      ...prev,
      chaptersCompleted: [...prev.chaptersCompleted, prev.currentChapter]
    }));
  };

  const addAchievement = (achievement) => {
    setUserProgress(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievement],
      totalScore: prev.totalScore + achievement.points
    }));
  };

  return (
    <StoryContext.Provider value={{
      currentChapter,
      storyChapters,
      userProgress,
      showCharacterGuide,
      narrativeMode,
      advanceChapter,
      addAchievement,
      setShowCharacterGuide,
      setNarrativeMode
    }}>
      {children}
    </StoryContext.Provider>
  );
};

// Character Guide Component
export const CharacterGuide = () => {
  const { currentChapter, storyChapters, showCharacterGuide } = useContext(StoryContext);
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (showCharacterGuide && currentChapter) {
      setIsVisible(true);
      setCurrentMessage(storyChapters[currentChapter]?.narrative || '');
    }
  }, [currentChapter, showCharacterGuide, storyChapters]);

  if (!showCharacterGuide || !isVisible) return null;

  const currentStory = storyChapters[currentChapter];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 max-w-md bg-gradient-to-r from-blue-900 to-purple-900 text-white rounded-lg shadow-2xl border border-blue-400 z-50"
      >
        {/* Character Avatar */}
        <div className="flex items-start p-4">
          <div className="flex-shrink-0 mr-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xl">👩‍🚀</span>
            </div>
          </div>
          
          {/* Message Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-blue-200">
                {currentStory?.character}
              </h4>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-300 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm leading-relaxed mb-3">
              {currentMessage}
            </p>
            
            {/* Objectives */}
            {currentStory?.objectives && (
              <div className="mb-3">
                <h5 className="text-xs font-semibold text-blue-300 mb-1">Mission Objectives:</h5>
                <ul className="text-xs space-y-1">
                  {currentStory.objectives.map((objective, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-400 mr-2">•</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsVisible(false)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
              >
                Got it! 🚀
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Progress Tracker Component
export const ProgressTracker = () => {
  const { userProgress, storyChapters } = useContext(StoryContext);
  
  const totalChapters = Object.keys(storyChapters).length;
  const completedChapters = userProgress.chaptersCompleted.length;
  const progressPercentage = (completedChapters / totalChapters) * 100;

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg backdrop-blur-sm z-40">
      <div className="flex items-center space-x-3">
        <div className="text-sm font-medium">Mission Progress</div>
        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-gray-300">
          {completedChapters}/{totalChapters}
        </div>
      </div>
      
      {/* Score Display */}
      <div className="text-xs text-yellow-400 mt-1">
        Score: {userProgress.totalScore} pts
      </div>
    </div>
  );
};

// Achievement Notification Component
export const AchievementNotification = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-20 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm"
    >
      <div className="flex items-center">
        <div className="text-2xl mr-3">🏆</div>
        <div>
          <h4 className="font-bold text-sm">Achievement Unlocked!</h4>
          <p className="text-xs">{achievement.name}</p>
          <p className="text-xs text-yellow-100">+{achievement.points} points</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryProvider;