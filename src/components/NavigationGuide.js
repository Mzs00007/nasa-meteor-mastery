import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NavigationGuide.css';

const NavigationGuide = ({ isOpen, onClose, simulationType = 'basic' }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const navigationOptions = [
    {
      id: 'view-results',
      title: '📊 View Detailed Results',
      description: 'Explore comprehensive simulation data, impact zones, and damage assessments',
      action: () => {
        const resultsPath = simulationType === 'advanced' ? '/simulation/advanced-results' : '/simulation/results';
        navigate(resultsPath);
        onClose();
      },
      icon: '🔍',
      category: 'Analysis'
    },
    {
      id: 'compare-data',
      title: '⚖️ Compare Simulations',
      description: 'Compare this simulation with previous runs or different scenarios',
      action: () => {
        navigate('/simulation/comparison');
        onClose();
      },
      icon: '📈',
      category: 'Analysis'
    },
    {
      id: 'new-simulation',
      title: '🚀 Run New Simulation',
      description: 'Start a fresh simulation with different parameters',
      action: () => {
        navigate('/simulation/setup');
        onClose();
      },
      icon: '🔄',
      category: 'Simulation'
    },
    {
      id: 'live-tracking',
      title: '🛰️ Live Asteroid Tracking',
      description: 'Monitor real-time asteroid data and run live simulations',
      action: () => {
        navigate('/simulation/live');
        onClose();
      },
      icon: '📡',
      category: 'Real-time'
    },
    {
      id: 'advanced-setup',
      title: '⚙️ Advanced Simulation',
      description: 'Access advanced parameters and detailed modeling options',
      action: () => {
        navigate('/simulation/advanced');
        onClose();
      },
      icon: '🔧',
      category: 'Simulation'
    },
    {
      id: 'dashboard',
      title: '🏠 Return to Dashboard',
      description: 'Go back to the main dashboard to explore other features',
      action: () => {
        navigate('/dashboard');
        onClose();
      },
      icon: '🏡',
      category: 'Navigation'
    }
  ];

  const categories = [...new Set(navigationOptions.map(option => option.category))];

  const handleStepNavigation = (direction) => {
    if (direction === 'next' && currentStep < categories.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (direction === 'prev' && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCurrentCategoryOptions = () => {
    const currentCategory = categories[currentStep];
    return navigationOptions.filter(option => option.category === currentCategory);
  };

  if (!isOpen) return null;

  return (
    <div className="navigation-guide-overlay">
      <div className="navigation-guide-modal">
        <div className="navigation-guide-header">
          <h2>🎯 Simulation Complete!</h2>
          <p>Where would you like to go next? Let me guide you step by step.</p>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="navigation-guide-content">
          <div className="step-indicator">
            <span className="step-text">
              Step {currentStep + 1} of {categories.length}: {categories[currentStep]}
            </span>
            <div className="step-progress">
              <div 
                className="step-progress-bar" 
                style={{ width: `${((currentStep + 1) / categories.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="navigation-options">
            <h3>📂 {categories[currentStep]} Options</h3>
            <div className="options-grid">
              {getCurrentCategoryOptions().map((option) => (
                <div 
                  key={option.id} 
                  className="navigation-option"
                  onClick={option.action}
                >
                  <div className="option-icon">{option.icon}</div>
                  <div className="option-content">
                    <h4>{option.title}</h4>
                    <p>{option.description}</p>
                  </div>
                  <div className="option-arrow">→</div>
                </div>
              ))}
            </div>
          </div>

          <div className="navigation-controls">
            <button 
              className="nav-button prev" 
              onClick={() => handleStepNavigation('prev')}
              disabled={currentStep === 0}
            >
              ← Previous Category
            </button>
            
            <div className="category-dots">
              {categories.map((_, index) => (
                <button
                  key={index}
                  className={`category-dot ${index === currentStep ? 'active' : ''}`}
                  onClick={() => setCurrentStep(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button 
              className="nav-button next" 
              onClick={() => handleStepNavigation('next')}
              disabled={currentStep === categories.length - 1}
            >
              Next Category →
            </button>
          </div>

          <div className="quick-actions">
            <button className="quick-action stay" onClick={onClose}>
              📍 Stay Here
            </button>
            <button 
              className="quick-action results" 
              onClick={() => {
                const resultsPath = simulationType === 'advanced' ? '/simulation/advanced-results' : '/simulation/results';
                navigate(resultsPath);
                onClose();
              }}
            >
              🚀 View Results Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationGuide;