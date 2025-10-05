import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';

import Tooltip from './Tooltip';

/**
 * Accessible Dropdown Component with keyboard navigation,
 * screen reader support, and ARIA attributes
 */
const AccessibleDropdown = ({
  options,
  value,
  onChange,
  label = '',
  placeholder = 'Select an option',
  tooltip = '',
  disabled = false,
  error = '',
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setFocusedIndex(-1);
    }
  };

  const handleSelect = option => {
    if (onChange) {
      onChange(option.value);
    }
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  const handleKeyDown = e => {
    if (disabled) {
      return;
    }

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleToggle();
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setFocusedIndex(prev => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Tab':
        if (isOpen) {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex]);
          }
        }
        break;
      default:
        // Type-ahead functionality
        if (e.key.length === 1) {
          const char = e.key.toLowerCase();
          const index = options.findIndex(option =>
            option.label.toLowerCase().startsWith(char)
          );
          if (index !== -1) {
            setFocusedIndex(index);
          }
        }
    }
  };

  const dropdownId = `dropdown-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      ref={dropdownRef}
      className={`dropdown-container ${disabled ? 'dropdown-disabled' : ''} ${className}`}
    >
      {label && (
        <label htmlFor={dropdownId} className='dropdown-label'>
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

      <button
        ref={buttonRef}
        id={dropdownId}
        type='button'
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-labelledby={`${dropdownId}-label`}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className='dropdown-button'
        {...props}
      >
        <span className='dropdown-value'>{displayValue}</span>
        <span className='dropdown-arrow' aria-hidden={true}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <ul
          role='listbox'
          aria-labelledby={dropdownId}
          className='dropdown-menu'
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role='option'
              aria-selected={option.value === value}
              className={`dropdown-item ${
                option.value === value ? 'dropdown-item-selected' : ''
              } ${index === focusedIndex ? 'dropdown-item-focused' : ''}`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {option.label}
              {option.value === value && (
                <span className='dropdown-checkmark' aria-hidden={true}>
                  ✓
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className='dropdown-error' role='alert'>
          {error}
        </div>
      )}

      {/* Screen reader status */}
      <span className='sr-only' aria-live='polite'>
        {isOpen ? `${options.length} options available` : ''}
      </span>
    </div>
  );
};

AccessibleDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  tooltip: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default AccessibleDropdown;
