import React, { useRef, useEffect } from 'react';
import { useAnimations, useEntranceAnimation } from '../../hooks/useAnimations';
import * as animations from '../../utils/animations';
import './ModernLoadingComponents.css';

// Enhanced Loading Spinner with multiple variants
export const ModernSpinner = ({ 
  size = 'medium', 
  variant = 'default', 
  className = '',
  color = 'primary' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-purple-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    danger: 'border-red-500',
    white: 'border-white'
  };

  const variants = {
    default: 'modern-spinner-default',
    pulse: 'modern-spinner-pulse',
    dots: 'modern-spinner-dots',
    orbit: 'modern-spinner-orbit',
    wave: 'modern-spinner-wave'
  };

  if (variant === 'dots') {
    return (
      <div className={`modern-spinner-dots-container ${sizeClasses[size]} ${className}`}>
        <div className={`modern-spinner-dot ${colorClasses[color]}`}></div>
        <div className={`modern-spinner-dot ${colorClasses[color]}`}></div>
        <div className={`modern-spinner-dot ${colorClasses[color]}`}></div>
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={`modern-spinner-wave-container ${sizeClasses[size]} ${className}`}>
        <div className={`modern-spinner-wave-bar ${colorClasses[color]}`}></div>
        <div className={`modern-spinner-wave-bar ${colorClasses[color]}`}></div>
        <div className={`modern-spinner-wave-bar ${colorClasses[color]}`}></div>
        <div className={`modern-spinner-wave-bar ${colorClasses[color]}`}></div>
        <div className={`modern-spinner-wave-bar ${colorClasses[color]}`}></div>
      </div>
    );
  }

  return (
    <div className={`${variants[variant]} ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      {variant === 'orbit' && (
        <>
          <div className="modern-spinner-orbit-center"></div>
          <div className="modern-spinner-orbit-ring"></div>
        </>
      )}
    </div>
  );
};

// Skeleton Loading Components
export const SkeletonText = ({ 
  lines = 1, 
  width = '100%', 
  height = '1rem',
  className = '' 
}) => {
  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton-text"
          style={{
            width: Array.isArray(width) ? width[index] || width[0] : width,
            height: height,
            marginBottom: index < lines - 1 ? '0.5rem' : '0'
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ 
  showAvatar = false, 
  showImage = false, 
  lines = 3,
  className = '' 
}) => {
  return (
    <div className={`skeleton-card ${className}`}>
      {showImage && <div className="skeleton-image" />}
      <div className="skeleton-card-content">
        {showAvatar && (
          <div className="skeleton-header">
            <div className="skeleton-avatar" />
            <div className="skeleton-header-text">
              <SkeletonText lines={2} width={['60%', '40%']} height="0.875rem" />
            </div>
          </div>
        )}
        <SkeletonText 
          lines={lines} 
          width={['100%', '90%', '75%']} 
          height="1rem" 
        />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ 
  rows = 5, 
  columns = 4,
  showHeader = true,
  className = '' 
}) => {
  return (
    <div className={`skeleton-table ${className}`}>
      {showHeader && (
        <div className="skeleton-table-header">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="skeleton-table-header-cell" />
          ))}
        </div>
      )}
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="skeleton-table-cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Progress Indicators
export const ProgressBar = ({ 
  progress = 0, 
  showPercentage = true, 
  size = 'medium',
  variant = 'default',
  className = '',
  animated = true 
}) => {
  const progressRef = useRef(null);
  const fillRef = useRef(null);
  const { animateProgressBar, animateCountUp } = useAnimations();

  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const variants = {
    default: 'progress-bar-default',
    gradient: 'progress-bar-gradient',
    striped: 'progress-bar-striped',
    glow: 'progress-bar-glow'
  };

  useEffect(() => {
    if (animated && fillRef.current) {
      // Animate progress bar fill
      animateProgressBar(fillRef.current, {
        width: `${Math.min(100, Math.max(0, progress))}%`,
        duration: 800,
        easing: 'easeOutCubic'
      });

      // Animate percentage counter if visible
      if (showPercentage && progressRef.current) {
        const percentageElement = progressRef.current.querySelector('.progress-percentage');
        if (percentageElement) {
          animateCountUp(percentageElement, {
            from: 0,
            to: Math.round(progress),
            duration: 800,
            suffix: '%'
          });
        }
      }
    }
  }, [progress, animated, animateProgressBar, animateCountUp, showPercentage]);

  return (
    <div ref={progressRef} className={`progress-container ${className}`}>
      <div className={`progress-bar ${sizeClasses[size]} ${variants[variant]} ${animated ? 'animated' : ''}`}>
        <div 
          ref={fillRef}
          className="progress-fill"
          style={{ width: animated ? '0%' : `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <span className="progress-percentage">
          {animated ? '0%' : `${Math.round(progress)}%`}
        </span>
      )}
    </div>
  );
};

export const CircularProgress = ({ 
  progress = 0, 
  size = 80, 
  strokeWidth = 8,
  showPercentage = true,
  className = '',
  color = 'primary' 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-blue-500',
    secondary: 'stroke-purple-500',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    danger: 'stroke-red-500'
  };

  return (
    <div className={`circular-progress ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`circular-progress-circle ${colorClasses[color]}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showPercentage && (
        <div className="circular-progress-text">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({ 
  isVisible = false, 
  message = 'Loading...', 
  spinner = 'default',
  backdrop = true,
  className = '' 
}) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const { animateFadeIn, animateScaleIn, animatePulse } = useAnimations();

  useEffect(() => {
    if (isVisible && overlayRef.current && contentRef.current) {
      // Animate overlay entrance
      animateFadeIn(overlayRef.current, { duration: 300 });
      
      // Animate content entrance with scale
      animateScaleIn(contentRef.current, { 
        duration: 400, 
        delay: 100,
        scale: [0.8, 1]
      });

      // Add pulse animation to spinner
      const spinner = contentRef.current.querySelector('.modern-spinner-default, .modern-spinner-pulse, .modern-spinner-dots-container, .modern-spinner-orbit, .modern-spinner-wave-container');
      if (spinner) {
        animatePulse(spinner, { duration: 2000, loop: true });
      }
    }
  }, [isVisible, animateFadeIn, animateScaleIn, animatePulse]);

  if (!isVisible) return null;

  return (
    <div 
      ref={overlayRef}
      className={`loading-overlay ${backdrop ? 'with-backdrop' : ''} ${className}`}
    >
      <div ref={contentRef} className="loading-overlay-content">
        <ModernSpinner variant={spinner} size="large" color="white" />
        {message && <p className="loading-overlay-message">{message}</p>}
      </div>
    </div>
  );
};

// Pulse Loading Component
export const PulseLoader = ({ 
  count = 3, 
  size = 'medium', 
  color = 'primary',
  className = '' 
}) => {
  const loaderRef = useRef(null);
  const { animateStaggerFadeIn, animatePulse } = useAnimations();

  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    white: 'bg-white'
  };

  useEffect(() => {
    if (loaderRef.current) {
      const dots = loaderRef.current.querySelectorAll('.pulse-dot');
      
      // Animate dots entrance with stagger
      animateStaggerFadeIn(dots, {
        duration: 600,
        delay: 200,
        stagger: 100
      });

      // Add continuous pulse animation
      dots.forEach((dot, index) => {
        animatePulse(dot, {
          duration: 1400,
          delay: index * 200,
          loop: true,
          scale: [0.8, 1.2, 0.8]
        });
      });
    }
  }, [count, animateStaggerFadeIn, animatePulse]);

  return (
    <div ref={loaderRef} className={`pulse-loader ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`pulse-dot ${sizeClasses[size]} ${colorClasses[color]}`}
        />
      ))}
    </div>
  );
};

// Loading Button Component
export const LoadingButton = ({ 
  children, 
  isLoading = false, 
  loadingText = 'Loading...', 
  spinner = 'default',
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`loading-button ${isLoading ? 'loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <ModernSpinner variant={spinner} size="small" color="white" />
          <span className="loading-button-text">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Shimmer Effect Component
export const ShimmerEffect = ({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = '4px',
  className = '' 
}) => {
  return (
    <div
      className={`shimmer-effect ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
};

export default {
  ModernSpinner,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  ProgressBar,
  CircularProgress,
  LoadingOverlay,
  PulseLoader,
  LoadingButton,
  ShimmerEffect
};