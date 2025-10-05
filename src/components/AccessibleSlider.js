import PropTypes from 'prop-types';
import React, { useState, useCallback, useRef } from 'react';

import { debounce } from '../utils/debounce';

import Tooltip from './Tooltip';

/**
 * Accessible Slider Component with real-time feedback, tooltips,
 * debounced input, and full ARIA support
 */
const AccessibleSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = '',
  tooltip = '',
  disabled = false,
  showValue = true,
  debounceTime = 300,
  className = '',
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    debounce(newValue => {
      if (onChange) {
        onChange(newValue);
      }
    }, debounceTime),
    [onChange, debounceTime]
  );

  const handleChange = newValue => {
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleInputChange = e => {
    const newValue = parseFloat(e.target.value);
    handleChange(newValue);
  };

  const handleKeyPress = e => {
    if (disabled) {
      return;
    }

    const stepAmount = step || 1;
    let newValue = localValue;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(max, localValue + stepAmount);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(min, localValue - stepAmount);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      case 'PageUp':
        newValue = Math.min(max, localValue + stepAmount * 10);
        break;
      case 'PageDown':
        newValue = Math.max(min, localValue - stepAmount * 10);
        break;
      default:
        return;
    }

    e.preventDefault();
    handleChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;
  const sliderId = `slider-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const sliderElement = (
    <div
      className={`slider-control ${disabled ? 'slider-disabled' : ''} ${className}`}
    >
      {label && (
        <label htmlFor={sliderId} className='control-label'>
          {label}
          {tooltip && (
            <Tooltip text={tooltip} position='right'>
              <span className='info-icon' aria-hidden={true}>
                ℹ️
              </span>
            </Tooltip>
          )}
        </label>
      )}

      <div className='slider-wrapper'>
        <input
          ref={sliderRef}
          id={sliderId}
          type='range'
          value={localValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          aria-valuenow={localValue}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={`${localValue} ${label}`}
          aria-disabled={disabled}
          className='slider-input'
          {...props}
        />

        <div className='slider-track'>
          <div
            className='slider-fill'
            style={{ width: `${percentage}%` }}
            aria-hidden={true}
          />
        </div>

        {showValue && (
          <div className='slider-value' aria-hidden={true}>
            {localValue}
          </div>
        )}
      </div>

      {/* Real-time feedback tooltip during drag */}
      {isDragging && (
        <div className='slider-tooltip' style={{ left: `${percentage}%` }}>
          {localValue}
        </div>
      )}
    </div>
  );

  return sliderElement;
};

AccessibleSlider.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  label: PropTypes.string,
  tooltip: PropTypes.string,
  disabled: PropTypes.bool,
  showValue: PropTypes.bool,
  debounceTime: PropTypes.number,
  className: PropTypes.string,
};

export default AccessibleSlider;
