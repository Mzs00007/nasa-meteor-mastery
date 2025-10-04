import React from 'react';
import PropTypes from 'prop-types';

/**
 * ResponsiveContainer - A flexible container component that adapts to different screen sizes
 * Provides consistent responsive behavior across the application
 */
const ResponsiveContainer = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'responsive',
  maxWidth = 'responsive',
  as = 'div'
}) => {
  const Component = as;
  
  // Base classes for responsive behavior
  const baseClasses = 'w-full mx-auto';
  
  // Variant-specific classes
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm',
    panel: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700',
    card: 'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700',
    transparent: 'bg-transparent',
    cosmic: 'bg-gradient-to-br from-nasa-blue/10 to-nasa-red/10 backdrop-blur-sm rounded-xl border border-nasa-blue/20'
  };
  
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-3 lg:p-4',
    responsive: 'p-3 sm:p-4 md:p-6 lg:p-8',
    lg: 'p-4 sm:p-6 md:p-8 lg:p-10',
    xl: 'p-6 sm:p-8 md:p-10 lg:p-12'
  };
  
  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
    responsive: 'max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl'
  };
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    paddingClasses[padding] || paddingClasses.responsive,
    maxWidthClasses[maxWidth] || maxWidthClasses.responsive,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <Component className={combinedClasses}>
      {children}
    </Component>
  );
};

ResponsiveContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'panel', 'card', 'transparent', 'cosmic']),
  padding: PropTypes.oneOf(['none', 'sm', 'responsive', 'lg', 'xl']),
  maxWidth: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '4xl', '6xl', 'full', 'responsive']),
  as: PropTypes.string
};

export default ResponsiveContainer;