import React, { useState, useEffect, useRef } from 'react';
import '../../styles/glassmorphic.css';

// Glass Button Component
export const GlassButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon = null,
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClass = 'glass-btn';
  const variantClass =
    variant === 'primary' ? 'glass-btn-primary' : 'glass-btn-secondary';
  const sizeClass =
    size === 'large'
      ? 'glass-btn-large'
      : size === 'icon'
        ? 'glass-btn-icon'
        : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className='flex-shrink-0'>{icon}</span>}
      {children}
    </button>
  );
};

// Glass Panel Component
export const GlassPanel = ({
  children,
  floating = false,
  className = '',
  ...props
}) => {
  const baseClass = floating ? 'glass-panel-floating' : 'glass-panel';

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Glass Card Component
export const GlassCard = ({
  children,
  compact = false,
  className = '',
  ...props
}) => {
  const baseClass = compact ? 'glass-card-compact' : 'glass-card';

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Glass Input Component
export const GlassInput = ({ label, error, className = '', ...props }) => {
  return (
    <div className='space-y-2'>
      {label && (
        <label className='block text-sm font-medium text-white/80'>
          {label}
        </label>
      )}
      <input
        className={`glass-input ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className='text-red-400 text-sm'>{error}</p>}
    </div>
  );
};

// Glass Modal Component
export const GlassModal = ({ isOpen, onClose, children, className = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className='glass-modal-backdrop' onClick={onClose} />
      <div className={`glass-modal ${className}`}>{children}</div>
    </>
  );
};

// Glass Navigation Component
export const GlassNav = ({ children, className = '' }) => {
  return (
    <nav className={`glass-nav ${className}`}>
      <div className='flex items-center justify-between'>{children}</div>
    </nav>
  );
};

// Glass Sidebar Component
export const GlassSidebar = ({ isOpen, onClose, children, className = '' }) => {
  return (
    <>
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-998'
          onClick={onClose}
        />
      )}
      <div className={`glass-sidebar ${isOpen ? 'open' : ''} ${className}`}>
        {children}
      </div>
    </>
  );
};

// Glass Stat Display Component
export const GlassStat = ({ value, label, unit = '', className = '' }) => {
  return (
    <div className={`glass-stat ${className}`}>
      <div className='glass-stat-value'>
        {value}
        {unit}
      </div>
      <div className='glass-stat-label'>{label}</div>
    </div>
  );
};

// Glass Progress Bar Component
export const GlassProgress = ({ value = 0, max = 100, className = '' }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`glass-progress ${className}`}>
      <div
        className='glass-progress-fill'
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Glass Tooltip Component
export const GlassTooltip = ({
  children,
  content,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const updateTooltipPosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top, left;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
        default:
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      }

      setTooltipStyle({ top, left });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updateTooltipPosition();
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className='inline-block'
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`glass-tooltip visible ${className}`}
          style={tooltipStyle}
        >
          {content}
        </div>
      )}
    </>
  );
};

// Glass Toggle Component
export const GlassToggle = ({
  checked = false,
  onChange,
  label,
  className = '',
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div
        className={`glass-toggle ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        onKeyDown={handleKeyPress}
        role="switch"
        tabIndex={0}
        aria-checked={checked}
        aria-label={label || 'Toggle'}
      />
      {label && (
        <span className='text-white/80 text-sm font-medium'>{label}</span>
      )}
    </div>
  );
};

// Glass Icon Button Component
export const GlassIconButton = ({
  icon,
  onClick,
  tooltip,
  className = '',
  ...props
}) => {
  const button = (
    <button
      className={`glass-btn glass-btn-icon glass-btn-secondary ${className}`}
      onClick={onClick}
      {...props}
    >
      {icon}
    </button>
  );

  if (tooltip) {
    return <GlassTooltip content={tooltip}>{button}</GlassTooltip>;
  }

  return button;
};

// Glass Slider Component
export const GlassSlider = ({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = '',
  className = '',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className='flex justify-between items-center'>
          <label className='text-sm font-medium text-white/80'>{label}</label>
          <span className='text-sm text-white/60'>
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className='relative'>
        <input
          type='range'
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className='w-full h-2 bg-transparent appearance-none cursor-pointer slider'
          style={{
            background: `linear-gradient(to right, rgba(252, 61, 33, 0.8) 0%, rgba(252, 61, 33, 0.8) ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`,
          }}
        />
        <style jsx>
          {`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(
                135deg,
                rgba(252, 61, 33, 0.9),
                rgba(11, 61, 145, 0.9)
              );
              border: 2px solid rgba(255, 255, 255, 0.3);
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              backdrop-filter: blur(10px);
            }

            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(
                135deg,
                rgba(252, 61, 33, 0.9),
                rgba(11, 61, 145, 0.9)
              );
              border: 2px solid rgba(255, 255, 255, 0.3);
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
          `}
        </style>
      </div>
    </div>
  );
};

// Glass Loading Spinner Component
export const GlassSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className='glass-base rounded-full animate-spin border-2 border-transparent border-t-white/60 border-r-white/60' />
    </div>
  );
};

export default {
  GlassButton,
  GlassPanel,
  GlassCard,
  GlassInput,
  GlassModal,
  GlassNav,
  GlassSidebar,
  GlassStat,
  GlassProgress,
  GlassTooltip,
  GlassToggle,
  GlassIconButton,
  GlassSlider,
  GlassSpinner,
};
