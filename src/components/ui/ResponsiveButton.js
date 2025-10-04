import React from 'react';
import PropTypes from 'prop-types';

/**
 * ResponsiveButton - A button component that adapts to different screen sizes
 * Provides consistent responsive behavior and touch-friendly interactions
 */
const ResponsiveButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'responsive',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  // Base responsive classes
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'touch-manipulation', // Improves touch responsiveness
    'select-none', // Prevents text selection
    fullWidth ? 'w-full' : 'w-auto'
  ].join(' ');
  
  // Variant-specific classes
  const variantClasses = {
    primary: [
      'bg-nasa-blue hover:bg-nasa-blue/90 active:bg-nasa-blue/80',
      'text-white border border-nasa-blue',
      'focus:ring-nasa-blue/50',
      'shadow-sm hover:shadow-md active:shadow-sm'
    ].join(' '),
    
    secondary: [
      'bg-gray-100 hover:bg-gray-200 active:bg-gray-300',
      'dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500',
      'text-gray-900 dark:text-gray-100',
      'border border-gray-300 dark:border-gray-600',
      'focus:ring-gray-500/50',
      'shadow-sm hover:shadow-md active:shadow-sm'
    ].join(' '),
    
    danger: [
      'bg-nasa-red hover:bg-nasa-red/90 active:bg-nasa-red/80',
      'text-white border border-nasa-red',
      'focus:ring-nasa-red/50',
      'shadow-sm hover:shadow-md active:shadow-sm'
    ].join(' '),
    
    success: [
      'bg-green-600 hover:bg-green-700 active:bg-green-800',
      'text-white border border-green-600',
      'focus:ring-green-500/50',
      'shadow-sm hover:shadow-md active:shadow-sm'
    ].join(' '),
    
    outline: [
      'bg-transparent hover:bg-nasa-blue/10 active:bg-nasa-blue/20',
      'text-nasa-blue border-2 border-nasa-blue',
      'focus:ring-nasa-blue/50',
      'hover:border-nasa-blue/80'
    ].join(' '),
    
    ghost: [
      'bg-transparent hover:bg-gray-100 active:bg-gray-200',
      'dark:hover:bg-gray-800 dark:active:bg-gray-700',
      'text-gray-700 dark:text-gray-300',
      'border border-transparent',
      'focus:ring-gray-500/50'
    ].join(' '),
    
    cosmic: [
      'bg-gradient-to-r from-nasa-blue to-cosmic-purple',
      'hover:from-nasa-blue/90 hover:to-cosmic-purple/90',
      'active:from-nasa-blue/80 active:to-cosmic-purple/80',
      'text-white border border-transparent',
      'focus:ring-cosmic-purple/50',
      'shadow-cosmic hover:shadow-orbit active:shadow-cosmic'
    ].join(' ')
  };
  
  // Size-specific classes (responsive)
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs min-h-[32px] sm:px-3 sm:py-1.5 sm:text-sm sm:min-h-[36px]',
    sm: 'px-3 py-1.5 text-sm min-h-[36px] sm:px-4 sm:py-2 sm:text-base sm:min-h-[40px]',
    responsive: 'px-4 py-2 text-sm min-h-[44px] sm:px-5 sm:py-2.5 sm:text-base sm:min-h-[48px] lg:px-6 lg:py-3 lg:text-lg lg:min-h-[52px]',
    lg: 'px-5 py-2.5 text-base min-h-[48px] sm:px-6 sm:py-3 sm:text-lg sm:min-h-[52px] lg:px-8 lg:py-4 lg:text-xl lg:min-h-[56px]',
    xl: 'px-6 py-3 text-lg min-h-[52px] sm:px-8 sm:py-4 sm:text-xl sm:min-h-[56px] lg:px-10 lg:py-5 lg:text-2xl lg:min-h-[64px]'
  };
  
  // Border radius classes
  const radiusClasses = 'rounded-md sm:rounded-lg lg:rounded-xl';
  
  // Loading state classes
  const loadingClasses = loading ? 'cursor-wait' : '';
  
  // Combine all classes
  const combinedClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.responsive,
    radiusClasses,
    loadingClasses,
    className
  ].filter(Boolean).join(' ');
  
  // Handle click with loading state
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };
  
  // Render icon
  const renderIcon = () => {
    if (loading) {
      return (
        <svg 
          className="animate-spin h-4 w-4 sm:h-5 sm:w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }
    
    if (icon) {
      return React.cloneElement(icon, {
        className: `h-4 w-4 sm:h-5 sm:w-5 ${icon.props.className || ''}`
      });
    }
    
    return null;
  };
  
  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon() && (
        <span className={children ? 'mr-2' : ''}>
          {renderIcon()}
        </span>
      )}
      
      {children && (
        <span className="truncate">
          {children}
        </span>
      )}
      
      {iconPosition === 'right' && renderIcon() && (
        <span className={children ? 'ml-2' : ''}>
          {renderIcon()}
        </span>
      )}
    </button>
  );
};

ResponsiveButton.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'ghost', 'cosmic']),
  size: PropTypes.oneOf(['xs', 'sm', 'responsive', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.element,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

export default ResponsiveButton;