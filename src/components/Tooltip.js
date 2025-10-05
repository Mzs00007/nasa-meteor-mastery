import PropTypes from 'prop-types';
import React from 'react';

/**
 * Advanced Tooltip Component with Material Design 3 styling
 * Features delayed appearance, multiple positioning options, and accessibility support
 */
const Tooltip = ({
  children,
  text,
  position = 'top',
  delay = 500,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`tooltip-container ${className}`}
      style={{ '--tooltip-delay': `${delay}ms` }}
      {...props}
    >
      {children}
      <span
        className={`tooltip-text tooltip-${position}`}
        role='tooltip'
        aria-hidden={true}
      >
        {text}
      </span>
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  delay: PropTypes.number,
  className: PropTypes.string,
};

export default Tooltip;
