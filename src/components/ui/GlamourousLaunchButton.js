import React, { useState, useEffect } from 'react';
import './GlamourousLaunchButton.css';

const GlamourousLaunchButton = ({ 
  onClick, 
  isLoading = false, 
  disabled = false, 
  loadingText = "Launching Simulation...",
  children = "Launch Simulation",
  className = "",
  ...props 
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled || isLoading) return;

    setIsClicked(true);
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    // Reset click state
    setTimeout(() => setIsClicked(false), 200);

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`glamorous-launch-btn ${isLoading ? 'loading' : ''} ${disabled ? 'disabled' : ''} ${isClicked ? 'clicked' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Background glow layers */}
      <div className="btn-glow-layer-1"></div>
      <div className="btn-glow-layer-2"></div>
      <div className="btn-glow-layer-3"></div>
      
      {/* Animated border */}
      <div className="btn-animated-border"></div>
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="btn-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      
      {/* Content container */}
      <div className="btn-content">
        {isLoading ? (
          <>
            <div className="btn-loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <span className="btn-text">{loadingText}</span>
          </>
        ) : (
          <>
            <span className="btn-icon">🚀</span>
            <span className="btn-text">{children}</span>
          </>
        )}
      </div>
      
      {/* Particle effects */}
      <div className="btn-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>
    </button>
  );
};

export default GlamourousLaunchButton;