import PropTypes from 'prop-types';
import React, { useState } from 'react';

import Tooltip from './Tooltip';

/**
 * Accessible Toggle Switch Component with ARIA roles,
 * keyboard navigation, and visual feedback
 */
const AccessibleToggle = ({
  checked,
  onChange,
  label = '',
  tooltip = '',
  disabled = false,
  size = 'medium',
  showLabels = true,
  onLabel = 'On',
  offLabel = 'Off',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const toggleId = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const toggleClasses = `
    toggle-switch
    toggle-${size}
    ${checked ? 'toggle-on' : 'toggle-off'}
    ${disabled ? 'toggle-disabled' : ''}
    ${isFocused ? 'toggle-focused' : ''}
    ${className}
  `.trim();

  const toggleElement = (
    <div className={toggleClasses}>
      {label && (
        <label htmlFor={toggleId} className='toggle-label'>
          {label}
          {tooltip && (
            <Tooltip text={tooltip} position='right'>
              <span className='info-icon' aria-hidden='true'>
                ℹ️
              </span>
            </Tooltip>
          )}
        </label>
      )}

      <div className='toggle-container'>
        {showLabels && (
          <span className='toggle-label-off' aria-hidden='true'>
            {offLabel}
          </span>
        )}

        <button
          id={toggleId}
          type='button'
          role='switch'
          aria-checked={checked}
          aria-label={label || `${checked ? onLabel : offLabel} toggle`}
          disabled={disabled}
          onClick={handleToggle}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className='toggle-button'
          {...props}
        >
          <span className='toggle-track' />
          <span className='toggle-thumb' />
        </button>

        {showLabels && (
          <span className='toggle-label-on' aria-hidden='true'>
            {onLabel}
          </span>
        )}
      </div>

      {/* Screen reader only status */}
      <span className='sr-only' aria-live='polite'>
        {checked ? onLabel : offLabel}
      </span>
    </div>
  );

  return toggleElement;
};

AccessibleToggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  tooltip: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showLabels: PropTypes.bool,
  onLabel: PropTypes.string,
  offLabel: PropTypes.string,
  className: PropTypes.string,
};

export default AccessibleToggle;
