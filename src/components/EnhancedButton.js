import PropTypes from 'prop-types';
import React from 'react';
import '../styles/impact-map-enhanced.css';

const EnhancedButton = ({
  children,
  variant = 'default',
  size = 'medium',
  disabled = false,
  loading = false,
  pulse = false,
  icon = null,
  onClick,
  className = '',
  ...props
}) => {
  const getButtonClasses = () => {
    const classes = ['glass-button'];
    
    // Variant classes
    switch (variant) {
      case 'primary':
        classes.push('primary');
        break;
      case 'secondary':
        classes.push('secondary');
        break;
      case 'danger':
        classes.push('danger');
        break;
      case 'success':
        classes.push('success');
        break;
      default:
        break;
    }
    
    // Size classes
    switch (size) {
      case 'small':
        classes.push('small');
        break;
      case 'large':
        classes.push('large');
        break;
      default:
        break;
    }
    
    // State classes
    if (pulse) {
      classes.push('pulse');
    }
    if (loading) {
      classes.push('loading');
    }
    if (disabled) {
      classes.push('disabled');
    }
    
    // Custom classes
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };

  const handleClick = (e) => {
    if (disabled || loading) {
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={getButtonClasses()}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="button-spinner">
          <div className="spinner" />
        </div>
      )}
      {icon && !loading && (
        <span className="button-icon">{icon}</span>
      )}
      <span className="button-text">{children}</span>
    </button>
  );
};

EnhancedButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  pulse: PropTypes.bool,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  type: PropTypes.string
};

EnhancedButton.defaultProps = {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  pulse: false,
  icon: null,
  onClick: null,
  className: '',
  type: 'button'
};

// Icon Button Component
export const IconButton = ({
  icon,
  active = false,
  disabled = false,
  onClick,
  className = '',
  title = '',
  ...props
}) => {
  const classes = [
    'icon-button',
    active && 'active',
    disabled && 'disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {icon}
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string
};

IconButton.defaultProps = {
  active: false,
  disabled: false,
  onClick: null,
  className: '',
  title: ''
};

// View Mode Button Component
export const ViewModeButton = ({
  icon,
  active = false,
  disabled = false,
  onClick,
  className = '',
  title = '',
  ...props
}) => {
  const classes = [
    'view-mode-btn',
    active && 'active',
    disabled && 'disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {icon}
    </button>
  );
};

ViewModeButton.propTypes = {
  icon: PropTypes.node.isRequired,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string
};

ViewModeButton.defaultProps = {
  active: false,
  disabled: false,
  onClick: null,
  className: '',
  title: ''
};

// Zoom Button Component
export const ZoomButton = ({
  icon,
  disabled = false,
  onClick,
  className = '',
  title = '',
  ...props
}) => {
  const classes = [
    'zoom-btn',
    disabled && 'disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {icon}
    </button>
  );
};

ZoomButton.propTypes = {
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  title: PropTypes.string
};

ZoomButton.defaultProps = {
  onClick: null,
  disabled: false,
  className: '',
  title: ''
};

// Layer Toggle Component
export const LayerToggle = ({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const classes = [
    'layer-toggle',
    active && 'active',
    disabled && 'disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <span className="layer-toggle-icon">{icon}</span>
      <span className="layer-toggle-label">{label}</span>
    </button>
  );
};

LayerToggle.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

LayerToggle.defaultProps = {
  icon: null,
  label: '',
  active: false,
  disabled: false,
  onClick: null,
  className: ''
};

// Floating Action Button Component
export const FloatingActionButton = ({
  icon,
  onClick,
  className = '',
  title = '',
  ...props
}) => {
  const classes = [
    'fab',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      title={title}
      {...props}
    >
      {icon}
    </button>
  );
};

FloatingActionButton.propTypes = {
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string
};

FloatingActionButton.defaultProps = {
  onClick: null,
  className: '',
  title: ''
};

// Toggle Switch Component
export const ToggleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <label className={`toggle-switch ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <span className="toggle-slider" />
    </label>
  );
};

ToggleSwitch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

ToggleSwitch.defaultProps = {
  checked: false,
  onChange: null,
  disabled: false,
  className: ''
};

// Range Slider Component
export const RangeSlider = ({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`range-slider ${className}`}>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

RangeSlider.propTypes = {
  value: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

RangeSlider.defaultProps = {
  value: 0,
  min: 0,
  max: 100,
  step: 1,
  onChange: null,
  disabled: false,
  className: ''
};

export default EnhancedButton;