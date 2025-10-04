import PropTypes from 'prop-types';
import React, { useContext } from 'react';

import './Icon.css';
import IconContext from './IconContext';

/**
 * Universal Icon Component supporting:
 * - Material Icons (font-based)
 * - Custom SVG icons
 * - Responsive sizing (touch, standard, small)
 * - Theming support
 * - Accessibility features
 */
const Icon = ({
  name,
  size,
  color,
  className = '',
  onClick,
  ariaLabel,
  role = 'img',
  spin = false,
  pulse = false,
  style = {},
  ...props
}) => {
  const iconContext = useContext(IconContext);

  // Use context defaults if not provided
  const iconSize = size || iconContext?.defaultSize || 'standard';
  const iconColor = color || iconContext?.defaultColor || 'inherit';
  // Determine if it's a Material Icon or custom SVG
  const isMaterialIcon = !name?.includes('/') && !name?.endsWith('.svg');

  // Size classes
  const sizeClass = `icon-${iconSize}`;

  // Additional classes
  const additionalClasses = [
    sizeClass,
    spin && 'icon-spin',
    pulse && 'icon-pulse',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Handle Material Icons
  if (isMaterialIcon) {
    return (
      <span
        className={`material-icons ${additionalClasses}`}
        style={{ color: iconColor, ...style }}
        onClick={onClick}
        role={role}
        aria-label={ariaLabel || name}
        {...props}
      >
        {name}
      </span>
    );
  }

  // Handle SVG icons (future implementation)
  // For now, we'll use Material Icons as fallback
  return (
    <span
      className={`material-icons ${additionalClasses}`}
      style={{ color: iconColor, ...style }}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel || 'icon'}
      {...props}
    >
      {name || 'image'}
    </span>
  );
};

Icon.propTypes = {
  /** Icon name (Material Icon name or SVG path) */
  name: PropTypes.string.isRequired,
  /** Size variant: 'touch', 'standard', 'small', 'xsmall' */
  size: PropTypes.oneOf(['touch', 'standard', 'small', 'xsmall']),
  /** Color of the icon */
  color: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Click handler */
  onClick: PropTypes.func,
  /** ARIA label for accessibility */
  ariaLabel: PropTypes.string,
  /** ARIA role */
  role: PropTypes.string,
  /** Spin animation */
  spin: PropTypes.bool,
  /** Pulse animation */
  pulse: PropTypes.bool,
  /** Additional inline styles */
  style: PropTypes.object,
};

export default Icon;
