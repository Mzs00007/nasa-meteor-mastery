import React, { useState, useRef, useEffect } from 'react';
import './CleanModernComponents.css';

// Clean Modern Button Component
export const CleanButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon = null,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'clean-btn';
  const variantClass = `clean-btn--${variant}`;
  const sizeClass = `clean-btn--${size}`;
  const loadingClass = loading ? 'clean-btn--loading' : '';
  const disabledClass = disabled ? 'clean-btn--disabled' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className='clean-btn__spinner' />}
      {icon && !loading && <span className='clean-btn__icon'>{icon}</span>}
      <span className='clean-btn__text'>{children}</span>
    </button>
  );
};

// Clean Modern Card Component
export const CleanCard = ({
  children,
  variant = 'default',
  padding = 'normal',
  className = '',
  ...props
}) => {
  const baseClass = 'clean-card';
  const variantClass = `clean-card--${variant}`;
  const paddingClass = `clean-card--${padding}`;

  return (
    <div
      className={`${baseClass} ${variantClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Clean Modern Input Component
export const CleanInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  icon = null,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div
      className={`clean-input ${focused ? 'clean-input--focused' : ''} ${error ? 'clean-input--error' : ''} ${className}`}
    >
      {label && (
        <label
          className={`clean-input__label ${hasValue || focused ? 'clean-input__label--active' : ''}`}
        >
          {label}
        </label>
      )}
      <div className='clean-input__wrapper'>
        {icon && <span className='clean-input__icon'>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className='clean-input__field'
          {...props}
        />
      </div>
      {error && <span className='clean-input__error'>{error}</span>}
    </div>
  );
};

// Clean Modern Slider Component
export const CleanSlider = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  description = '',
  className = '',
  ...props
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`clean-slider ${className}`}>
      <div className='clean-slider__header'>
        <label className='clean-slider__label'>{label}</label>
        <span className='clean-slider__value'>
          {value}
          {unit}
        </span>
      </div>
      <div className='clean-slider__wrapper'>
        <input
          type='range'
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className='clean-slider__input'
          style={{ '--percentage': `${percentage}%` }}
          {...props}
        />
      </div>
      {description && (
        <span className='clean-slider__description'>{description}</span>
      )}
    </div>
  );
};

// Clean Modern Select Component
export const CleanSelect = ({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select an option',
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div
      className={`clean-select ${isOpen ? 'clean-select--open' : ''} ${className}`}
      ref={selectRef}
    >
      {label && <label className='clean-select__label'>{label}</label>}
      <div className='clean-select__trigger' onClick={() => setIsOpen(!isOpen)}>
        <span className='clean-select__value'>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className='clean-select__arrow'>▼</span>
      </div>
      {isOpen && (
        <div className='clean-select__dropdown'>
          {options.map(option => (
            <div
              key={option.value}
              className={`clean-select__option ${option.value === value ? 'clean-select__option--selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Clean Modern Toggle Component
export const CleanToggle = ({
  label,
  checked,
  onChange,
  description = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`clean-toggle ${className}`}>
      <div className='clean-toggle__wrapper'>
        <label className='clean-toggle__container'>
          <input
            type='checkbox'
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className='clean-toggle__input'
            {...props}
          />
          <span className='clean-toggle__slider' />
        </label>
        <div className='clean-toggle__content'>
          <span className='clean-toggle__label'>{label}</span>
          {description && (
            <span className='clean-toggle__description'>{description}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Clean Modern Progress Component
export const CleanProgress = ({
  value,
  max = 100,
  label = '',
  showPercentage = true,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`clean-progress ${className}`}>
      {(label || showPercentage) && (
        <div className='clean-progress__header'>
          {label && <span className='clean-progress__label'>{label}</span>}
          {showPercentage && (
            <span className='clean-progress__percentage'>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className='clean-progress__track'>
        <div
          className={`clean-progress__fill clean-progress__fill--${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Clean Modern Badge Component
export const CleanBadge = ({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}) => {
  const baseClass = 'clean-badge';
  const variantClass = `clean-badge--${variant}`;
  const sizeClass = `clean-badge--${size}`;

  return (
    <span
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Clean Modern Section Component
export const CleanSection = ({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  icon = null,
  className = '',
  headerActions = null,
  ...rest
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Only allow safe attributes on the root element to avoid React warnings
  const allowedAttrs = {};
  Object.entries(rest).forEach(([key, value]) => {
    if (
      key === 'id' ||
      key === 'role' ||
      key === 'style' ||
      key.startsWith('data-') ||
      key.startsWith('aria-')
    ) {
      allowedAttrs[key] = value;
    }
  });

  return (
    <div className={`clean-section ${className}`} {...allowedAttrs}>
      <div
        className={`clean-section__header ${collapsible ? 'clean-section__header--clickable' : ''}`}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        {icon && <span className='clean-section__icon'>{icon}</span>}
        <h3 className='clean-section__title'>{title}</h3>
        {headerActions && (
          <div className='clean-section__actions'>
            {headerActions}
          </div>
        )}
        {collapsible && (
          <span
            className={`clean-section__toggle ${isCollapsed ? 'clean-section__toggle--collapsed' : ''}`}
          >
            ▼
          </span>
        )}
      </div>
      <div
        className={`clean-section__content ${isCollapsed ? 'clean-section__content--collapsed' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};
