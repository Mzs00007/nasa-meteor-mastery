import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import { GlassCard, GlassButton, GlassProgress } from './ui/GlassComponents';

const TutorialGuide = () => {
  const navigate = useNavigate();
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState(new Set());

  const tutorials = {
    'basic-simulation': {
      title: '🚀 Your First Simulation',
      description:
        'Learn how to set up and run a basic asteroid impact simulation',
      difficulty: 'Beginner',
      duration: '5 minutes',
      steps: [
        {
          title: 'Welcome to Meteor Mastery!',
          content:
            "Let's start with your first asteroid impact simulation. This tutorial will guide you through the basic setup process.",
          action: null,
          tip: "Take your time and don't worry about making mistakes - you can always restart!",
        },
        {
          title: 'Navigate to Simulation Setup',
          content:
            'First, we need to go to the simulation setup page where you can configure your asteroid parameters.',
          action: () => navigate('/simulation'),
          tip: 'Click the button below to navigate to the simulation setup page.',
        },
        {
          title: 'Choose Asteroid Size',
          content:
            'The diameter of your asteroid is one of the most important factors. Start with a medium-sized asteroid (100-500 meters).',
          action: null,
          tip: 'Larger asteroids create more devastating impacts, but smaller ones are more common.',
        },
        {
          title: 'Set Impact Velocity',
          content:
            'Asteroid velocity determines the kinetic energy. Typical velocities range from 11-72 km/s. Try starting with 20 km/s.',
          action: null,
          tip: 'Remember: Energy = ½mv². Doubling velocity quadruples the energy!',
        },
        {
          title: 'Select Entry Angle',
          content:
            'The angle at which the asteroid enters the atmosphere affects the impact. Steeper angles (closer to 90°) create more intense impacts.',
          action: null,
          tip: 'Most asteroids enter at shallow angles (15-45°) due to orbital mechanics.',
        },
        {
          title: 'Choose Target Location',
          content:
            'Click on the map to select where your asteroid will impact. Different locations have different population densities and terrain types.',
          action: null,
          tip: 'Try both land and ocean impacts to see the difference in effects.',
        },
        {
          title: 'Run Your Simulation',
          content:
            "Once you've set all parameters, click 'Launch Simulation' to see the results. The simulation will calculate impact effects, crater formation, and environmental consequences.",
          action: null,
          tip: "Don't forget to check out the different view modes: 3D, Map, and Data views!",
        },
        {
          title: 'Analyze Results',
          content:
            'Review the simulation results including impact energy, crater size, affected area, and environmental effects. Try adjusting parameters and running again!',
          action: null,
          tip: 'Use the export features to save your results for later analysis.',
        },
      ],
    },
    'advanced-features': {
      title: '⚡ Advanced Simulation Features',
      description:
        'Explore atmospheric modeling, fragmentation, and detailed impact analysis',
      difficulty: 'Intermediate',
      duration: '10 minutes',
      steps: [
        {
          title: 'Advanced Simulation Setup',
          content:
            'Advanced simulations include atmospheric modeling, fragmentation analysis, and detailed environmental effects.',
          action: () => navigate('/simulation/advanced'),
          tip: 'Advanced features provide more realistic and detailed results.',
        },
        {
          title: 'Atmospheric Parameters',
          content:
            "Adjust atmospheric density and entry altitude to see how they affect the asteroid's journey through the atmosphere.",
          action: null,
          tip: 'Higher atmospheric density increases heating and fragmentation.',
        },
        {
          title: 'Fragmentation Modeling',
          content:
            'Choose between different fragmentation models to simulate how the asteroid breaks apart during entry.',
          action: null,
          tip: 'Fragmentation can significantly reduce ground impact energy.',
        },
        {
          title: 'Environmental Conditions',
          content:
            'Set weather conditions, seasonal factors, and magnetic field effects for more realistic simulations.',
          action: null,
          tip: 'These factors can affect atmospheric entry and impact consequences.',
        },
        {
          title: 'Detailed Results Analysis',
          content:
            'Advanced simulations provide trajectory data, fragmentation analysis, and comprehensive environmental impact assessments.',
          action: null,
          tip: 'Use the charts and graphs to understand the physics behind the impact.',
        },
      ],
    },
    'live-data': {
      title: '🛰️ Working with Live NASA Data',
      description:
        "Learn to use real-time asteroid data from NASA's NEO database",
      difficulty: 'Intermediate',
      duration: '8 minutes',
      steps: [
        {
          title: 'NASA Live Data Integration',
          content:
            "Meteor Mastery integrates with NASA's Near-Earth Object database to provide real-time asteroid information.",
          action: () => navigate('/live-asteroids'),
          tip: 'Live data is updated regularly and includes recently discovered asteroids.',
        },
        {
          title: 'Browse Current Asteroids',
          content:
            'Explore the list of currently tracked near-Earth asteroids. Each entry shows size, velocity, and approach distance.',
          action: null,
          tip: 'Look for asteroids with close approach dates to see current threats.',
        },
        {
          title: 'Select an Asteroid',
          content:
            'Click on any asteroid to see detailed information including orbital parameters and physical characteristics.',
          action: null,
          tip: "Pay attention to the 'Potentially Hazardous' designation for asteroids that warrant monitoring.",
        },
        {
          title: 'Run Live Simulation',
          content:
            "Use the 'Simulate Impact' button to run a hypothetical impact scenario with the selected asteroid's real parameters.",
          action: () => navigate('/live-simulation'),
          tip: 'This shows what would happen if the asteroid actually hit Earth.',
        },
        {
          title: 'Compare Scenarios',
          content:
            'Try simulating different asteroids to compare their potential impact effects and understand the range of possible outcomes.',
          action: null,
          tip: 'Notice how size and velocity differences dramatically affect impact consequences.',
        },
      ],
    },
    'data-analysis': {
      title: '📊 Data Analysis & Export',
      description:
        'Learn to analyze simulation results and export data for further study',
      difficulty: 'Advanced',
      duration: '7 minutes',
      steps: [
        {
          title: 'Understanding Results',
          content:
            'Simulation results include multiple data types: impact energy, crater formation, seismic effects, and environmental consequences.',
          action: null,
          tip: 'Each metric tells part of the story - look at them together for the full picture.',
        },
        {
          title: 'Visualization Tools',
          content:
            'Use the different view modes (3D, Map, Charts) to visualize results from multiple perspectives.',
          action: null,
          tip: '3D view shows the impact crater, Map view shows affected areas, Charts show quantitative data.',
        },
        {
          title: 'Export Options',
          content:
            'Export your simulation data as PDF reports or CSV files for detailed analysis in external tools.',
          action: null,
          tip: 'PDF reports are great for presentations, CSV files for statistical analysis.',
        },
        {
          title: 'Historical Comparisons',
          content:
            'Compare your simulation results with historical impact events like Tunguska or Chicxulub.',
          action: null,
          tip: 'This helps put the scale of your simulated impact into perspective.',
        },
        {
          title: 'Simulation History',
          content:
            'Review your previous simulations to track your learning progress and compare different scenarios.',
          action: () => navigate('/history'),
          tip: 'Use the history to build a library of different impact scenarios.',
        },
      ],
    },
  };

  const startTutorial = tutorialKey => {
    setActiveTutorial(tutorialKey);
    setCurrentStep(0);
  };

  const nextStep = () => {
    const tutorial = tutorials[activeTutorial];
    if (currentStep < tutorial.steps.length - 1) {
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

  const completeTutorial = () => {
    setCompletedTutorials(prev => new Set([...prev, activeTutorial]));
    setActiveTutorial(null);
    setCurrentStep(0);
  };

  const exitTutorial = () => {
    setActiveTutorial(null);
    setCurrentStep(0);
  };

  const executeStepAction = () => {
    const step = tutorials[activeTutorial].steps[currentStep];
    if (step.action) {
      step.action();
    }
  };

  const getDifficultyColor = difficulty => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-400';
      case 'Intermediate':
        return 'text-yellow-400';
      case 'Advanced':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyIcon = difficulty => {
    switch (difficulty) {
      case 'Beginner':
        return '🟢';
      case 'Intermediate':
        return '🟡';
      case 'Advanced':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (activeTutorial) {
    const tutorial = tutorials[activeTutorial];
    const step = tutorial.steps[currentStep];
    const progress = ((currentStep + 1) / tutorial.steps.length) * 100;

    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden'>
        <EnhancedMeteorBackground />

        <div className='relative z-10 container mx-auto px-4 py-8'>
          {/* Tutorial Header */}
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-white mb-2'>
              {tutorial.title}
            </h1>
            <div className='flex justify-center items-center space-x-4 text-gray-300'>
              <span>
                Step {currentStep + 1} of {tutorial.steps.length}
              </span>
              <span>•</span>
              <span className={getDifficultyColor(tutorial.difficulty)}>
                {getDifficultyIcon(tutorial.difficulty)} {tutorial.difficulty}
              </span>
            </div>
            <div className='max-w-md mx-auto mt-4'>
              <GlassProgress value={progress} />
            </div>
          </div>

          {/* Tutorial Content */}
          <div className='max-w-2xl mx-auto'>
            <GlassCard className='p-8'>
              <h2 className='text-2xl font-semibold text-white mb-4'>
                {step.title}
              </h2>
              <p className='text-gray-300 text-lg leading-relaxed mb-6'>
                {step.content}
              </p>

              {step.tip && (
                <div className='bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6'>
                  <div className='flex items-start space-x-3'>
                    <span className='text-blue-400 text-xl'>💡</span>
                    <div>
                      <h4 className='text-blue-300 font-semibold mb-1'>Tip</h4>
                      <p className='text-blue-200 text-sm'>{step.tip}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {step.action && (
                <div className='mb-6'>
                  <GlassButton
                    variant='primary'
                    onClick={executeStepAction}
                    className='w-full'
                    title='Navigate to the relevant section to practice this step'
                  >
                    🎯 Take Me There
                  </GlassButton>
                </div>
              )}

              {/* Navigation */}
              <div className='flex justify-between items-center'>
                <div className='flex space-x-3'>
                  <GlassButton
                    variant='secondary'
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    title='Go back to the previous tutorial step'
                  >
                    ← Previous
                  </GlassButton>
                  <GlassButton
                    variant='secondary'
                    onClick={exitTutorial}
                    title='Exit tutorial and return to tutorial selection'
                  >
                    Exit Tutorial
                  </GlassButton>
                </div>

                <GlassButton
                  variant='primary'
                  onClick={nextStep}
                  title={
                    currentStep === tutorial.steps.length - 1
                      ? 'Complete this tutorial and mark as finished'
                      : 'Proceed to the next tutorial step'
                  }
                >
                  {currentStep === tutorial.steps.length - 1
                    ? 'Complete Tutorial'
                    : 'Next →'}
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden'>
      <EnhancedMeteorBackground />

      <div className='relative z-10 container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            📚 Tutorial Center
          </h1>
          <p className='text-xl text-gray-300 mb-6'>
            Step-by-step guides to master asteroid impact simulation
          </p>
        </div>

        {/* Tutorial Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto'>
          {Object.entries(tutorials).map(([key, tutorial]) => (
            <GlassCard
              key={key}
              className='p-6 hover:bg-white/10 transition-all duration-300'
            >
              <div className='flex items-start justify-between mb-4'>
                <h3 className='text-xl font-semibold text-white'>
                  {tutorial.title}
                </h3>
                {completedTutorials.has(key) && (
                  <span className='text-green-400 text-2xl'>✅</span>
                )}
              </div>

              <p className='text-gray-300 mb-4'>{tutorial.description}</p>

              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center space-x-4 text-sm'>
                  <span className={getDifficultyColor(tutorial.difficulty)}>
                    {getDifficultyIcon(tutorial.difficulty)}{' '}
                    {tutorial.difficulty}
                  </span>
                  <span className='text-gray-400'>⏱️ {tutorial.duration}</span>
                  <span className='text-gray-400'>
                    📝 {tutorial.steps.length} steps
                  </span>
                </div>
              </div>

              <GlassButton
                variant={completedTutorials.has(key) ? 'secondary' : 'primary'}
                onClick={() => startTutorial(key)}
                className='w-full'
                title={
                  completedTutorials.has(key)
                    ? `Review the ${tutorial.title} tutorial`
                    : `Start the ${tutorial.title} tutorial`
                }
              >
                {completedTutorials.has(key)
                  ? 'Review Tutorial'
                  : 'Start Tutorial'}
              </GlassButton>
            </GlassCard>
          ))}
        </div>

        {/* Progress Summary */}
        <div className='mt-12 max-w-2xl mx-auto'>
          <GlassCard className='p-6 text-center'>
            <h3 className='text-xl font-semibold text-white mb-4'>
              Your Progress
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <div className='text-3xl font-bold text-green-400 mb-2'>
                  {completedTutorials.size}
                </div>
                <div className='text-gray-300'>Completed</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-blue-400 mb-2'>
                  {Object.keys(tutorials).length}
                </div>
                <div className='text-gray-300'>Total Tutorials</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-purple-400 mb-2'>
                  {Math.round(
                    (completedTutorials.size / Object.keys(tutorials).length) *
                      100
                  )}
                  %
                </div>
                <div className='text-gray-300'>Progress</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default TutorialGuide;
