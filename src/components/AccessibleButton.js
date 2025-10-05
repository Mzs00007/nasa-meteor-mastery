import PropTypes from 'prop-types';
import React from 'react';

import Tooltip from './Tooltip';

/**
 * Accessible Button Component with full ARIA support, keyboard navigation,
 * and real-time feedback animations
 */
const AccessibleButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  tooltip = '',
  tooltipPosition = 'top',
  ariaLabel = '',
  className = '',
  type = 'button',
  ...props
}) => {
  const handleClick = e => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  const baseClasses = `
    btn-${variant}
    btn-${size}
    ${disabled ? 'btn-disabled' : ''}
    ${loading ? 'btn-loading' : ''}
    ${className}
    focus-accessible
    transition-all duration-200
    transform hover:scale-105 active:scale-95
  `.trim();

  const buttonContent = (
    <button
      type={type}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : '')}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={baseClasses}
      {...props}
    >
      {loading && (
        <span className='btn-spinner' aria-hidden={true}>
          <span className='spinner-cosmic' />
        </span>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>{children}</span>
    </button>
  );

  if (tooltip && !disabled) {
    return (
      <Tooltip text={tooltip} position={tooltipPosition}>
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
};

AccessibleButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'danger',
    'success',
    'space',
    'cosmic',
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  tooltip: PropTypes.string,
  tooltipPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default AccessibleButton;
