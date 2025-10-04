import React, { useState, useRef, useEffect } from 'react';
import './ModernComponents.css';

/**
 * Modern Button Component
 */
export const ModernButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon = null,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const buttonClass = `modern-btn modern-btn--${variant} modern-btn--${size} ${className} ${loading ? 'modern-btn--loading' : ''} ${disabled ? 'modern-btn--disabled' : ''}`;

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className='modern-btn__spinner' />}
      {icon && !loading && <span className='modern-btn__icon'>{icon}</span>}
      <span className='modern-btn__text'>{children}</span>
    </button>
  );
};

/**
 * Modern Slider Component
 */
export const ModernSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = '',
  unit = '',
  showValue = true,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = e => {
    if (disabled) {
      return;
    }
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = e => {
    if (!isDragging || disabled) {
      return;
    }
    updateValue(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = e => {
    if (!sliderRef.current) {
      return;
    }

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    const newValue = min + percentage * (max - min);
    const steppedValue = Math.round(newValue / step) * step;

    onChange(Math.max(min, Math.min(max, steppedValue)));
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className={`modern-slider ${className} ${disabled ? 'modern-slider--disabled' : ''}`}
    >
      {label && (
        <div className='modern-slider__header'>
          <label className='modern-slider__label'>{label}</label>
          {showValue && (
            <span className='modern-slider__value'>
              {value.toLocaleString()}
              {unit}
            </span>
          )}
        </div>
      )}
      <div
        className='modern-slider__track'
        ref={sliderRef}
        onMouseDown={handleMouseDown}
      >
        <div
          className='modern-slider__fill'
          style={{ width: `${percentage}%` }}
        />
        <div
          className='modern-slider__thumb'
          style={{ left: `${percentage}%` }}
        />
      </div>
      <div className='modern-slider__range'>
        <span className='modern-slider__min'>{min.toLocaleString()}</span>
        <span className='modern-slider__max'>{max.toLocaleString()}</span>
      </div>
    </div>
  );
};

/**
 * Modern Card Component
 */
export const ModernCard = ({
  children,
  title = null,
  subtitle = null,
  icon = null,
  variant = 'default',
  hoverable = false,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const cardClass = `modern-card modern-card--${variant} ${hoverable ? 'modern-card--hoverable' : ''} ${className}`;

  return (
    <div className={cardClass} {...props}>
      {(title || subtitle || icon || collapsible) && (
        <div className='modern-card__header'>
          <div className='modern-card__header-content'>
            {icon && <div className='modern-card__icon'>{icon}</div>}
            <div className='modern-card__titles'>
              {title && <h3 className='modern-card__title'>{title}</h3>}
              {subtitle && <p className='modern-card__subtitle'>{subtitle}</p>}
            </div>
          </div>
          {collapsible && (
            <button
              className='modern-card__collapse-btn'
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <span
                className={`modern-card__collapse-icon ${isCollapsed ? 'collapsed' : ''}`}
              >
                ▼
              </span>
            </button>
          )}
        </div>
      )}
      <div className={`modern-card__content ${isCollapsed ? 'collapsed' : ''}`}>
        {children}
      </div>
    </div>
  );
};

/**
 * Modern Select Component
 */
export const ModernSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label = '',
  disabled = false,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = event => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`modern-select ${className} ${disabled ? 'modern-select--disabled' : ''}`}
      ref={selectRef}
    >
      {label && <label className='modern-select__label'>{label}</label>}
      <div
        className={`modern-select__trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className='modern-select__value'>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className='modern-select__arrow'>▼</span>
      </div>
      {isOpen && (
        <div className='modern-select__dropdown'>
          {options.map(option => (
            <div
              key={option.value}
              className={`modern-select__option ${option.value === value ? 'selected' : ''}`}
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

/**
 * Modern Input Component
 */
export const ModernInput = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label = '',
  error = '',
  icon = null,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputClass = `modern-input ${error ? 'modern-input--error' : ''} ${disabled ? 'modern-input--disabled' : ''} ${className}`;

  return (
    <div className={inputClass}>
      {label && <label className='modern-input__label'>{label}</label>}
      <div className='modern-input__wrapper'>
        {icon && <div className='modern-input__icon'>{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className='modern-input__field'
          {...props}
        />
      </div>
      {error && <span className='modern-input__error'>{error}</span>}
    </div>
  );
};

/**
 * Modern Toggle Component
 */
export const ModernToggle = ({
  checked,
  onChange,
  label = '',
  disabled = false,
  size = 'medium',
  className = '',
  ...props
}) => {
  const toggleClass = `modern-toggle modern-toggle--${size} ${disabled ? 'modern-toggle--disabled' : ''} ${className}`;

  return (
    <div className={toggleClass}>
      <label className='modern-toggle__wrapper'>
        <input
          type='checkbox'
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className='modern-toggle__input'
          {...props}
        />
        <span className='modern-toggle__slider' />
        {label && <span className='modern-toggle__label'>{label}</span>}
      </label>
    </div>
  );
};

/**
 * Modern Progress Bar Component
 */
export const ModernProgress = ({
  value,
  max = 100,
  label = '',
  showValue = true,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const progressClass = `modern-progress modern-progress--${variant} modern-progress--${size} ${className}`;

  return (
    <div className={progressClass} {...props}>
      {(label || showValue) && (
        <div className='modern-progress__header'>
          {label && <span className='modern-progress__label'>{label}</span>}
          {showValue && (
            <span className='modern-progress__value'>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className='modern-progress__track'>
        <div
          className='modern-progress__fill'
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Modern Badge Component
 */
export const ModernBadge = ({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}) => {
  const badgeClass = `modern-badge modern-badge--${variant} modern-badge--${size} ${className}`;

  return (
    <span className={badgeClass} {...props}>
      {children}
    </span>
  );
};

/**
 * Modern Tooltip Component
 */
export const ModernTooltip = ({
  children,
  content,
  position = 'top',
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`modern-tooltip ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          className={`modern-tooltip__content modern-tooltip__content--${position}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
