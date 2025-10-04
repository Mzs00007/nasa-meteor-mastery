import React from 'react';
import '../styles/glassmorphic.css';

// Glass Button Component
export const GlassButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  ...props
}) => {
  const baseClass = 'glass-button';
  const variantClass = `glass-button-${variant}`;
  const sizeClass = `glass-button-${size}`;

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Glass Panel Component
export const GlassPanel = ({ children, className = '', ...props }) => {
  return (
    <div className={`glass-panel ${className}`} {...props}>
      {children}
    </div>
  );
};

// Glass Card Component
export const GlassCard = ({ children, className = '', ...props }) => {
  return (
    <div className={`glass-card ${className}`} {...props}>
      {children}
    </div>
  );
};

// Glass Input Component
export const GlassInput = ({
  type = 'text',
  placeholder = '',
  className = '',
  disabled = false,
  value,
  onChange,
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`glass-input ${className}`}
      disabled={disabled}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

// Glass Modal Component
export const GlassModal = ({
  isOpen,
  onClose,
  children,
  className = '',
  title = '',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='glass-modal-overlay' onClick={onClose}>
      <div
        className={`glass-modal ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className='glass-modal-header'>
            <h3 className='glass-modal-title'>{title}</h3>
            <button className='glass-modal-close' onClick={onClose}>
              ×
            </button>
          </div>
        )}
        <div className='glass-modal-content'>{children}</div>
      </div>
    </div>
  );
};

// Glass Navigation Component
export const GlassNav = ({ children, className = '', ...props }) => {
  return (
    <nav className={`glass-nav ${className}`} {...props}>
      {children}
    </nav>
  );
};

// Glass Sidebar Component
export const GlassSidebar = ({
  children,
  isOpen = true,
  className = '',
  position = 'left',
}) => {
  return (
    <div
      className={`glass-sidebar glass-sidebar-${position} ${isOpen ? 'open' : 'closed'} ${className}`}
    >
      {children}
    </div>
  );
};

// Glass Stat Component
export const GlassStat = ({
  label,
  value,
  icon = '',
  className = '',
  trend = null,
}) => {
  return (
    <div className={`glass-stat ${className}`}>
      {icon && <div className='glass-stat-icon'>{icon}</div>}
      <div className='glass-stat-content'>
        <div className='glass-stat-value'>{value}</div>
        <div className='glass-stat-label'>{label}</div>
        {trend && (
          <div
            className={`glass-stat-trend ${trend > 0 ? 'positive' : 'negative'}`}
          >
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};

// Glass Progress Component
export const GlassProgress = ({
  value = 0,
  max = 100,
  className = '',
  showLabel = true,
  label = '',
}) => {
  const percentage = (value / max) * 100;

  return (
    <div className={`glass-progress ${className}`}>
      {showLabel && (
        <div className='glass-progress-label'>
          {label || `${Math.round(percentage)}%`}
        </div>
      )}
      <div className='glass-progress-bar'>
        <div
          className='glass-progress-fill'
          style={{ width: `${percentage}%` }}
        />
      </div>
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
  return (
    <div className={`glass-tooltip-container ${className}`}>
      {children}
      <div className={`glass-tooltip glass-tooltip-${position}`}>{content}</div>
    </div>
  );
};

// Glass Toggle Component
export const GlassToggle = ({
  checked = false,
  onChange,
  label = '',
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`glass-toggle-container ${className}`}>
      <label className='glass-toggle-label'>
        <input
          type='checkbox'
          checked={checked}
          onChange={e => onChange && onChange(e.target.checked)}
          disabled={disabled}
          className='glass-toggle-input'
        />
        <span className='glass-toggle-slider' />
        {label && <span className='glass-toggle-text'>{label}</span>}
      </label>
    </div>
  );
};

// Glass Icon Button Component
export const GlassIconButton = ({
  icon,
  onClick,
  className = '',
  size = 'md',
  disabled = false,
  ...props
}) => {
  return (
    <button
      className={`glass-icon-button glass-icon-button-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
};

// Glass Slider Component
export const GlassSlider = ({
  min = 0,
  max = 100,
  value = 50,
  onChange,
  className = '',
  disabled = false,
}) => {
  const handleChange = e => {
    if (onChange) {
      onChange(Number(e.target.value));
    }
  };

  return (
    <div className={`glass-slider-container ${className}`}>
      <input
        type='range'
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className='glass-slider w-full'
      />
    </div>
  );
};

// Glass Spinner Component
export const GlassSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`glass-spinner ${sizeClasses[size]} ${className}`}>
      <div className='animate-spin rounded-full border-2 border-white/20 border-t-white/80' />
    </div>
  );
};
