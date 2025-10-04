import PropTypes from 'prop-types';
import React, { createContext, useContext, useMemo } from 'react';

const IconContext = createContext({});

/**
 * Icon Context Provider for managing icon theming and configuration
 */
export const IconProvider = ({ children, config = {} }) => {
  const contextValue = useMemo(
    () => ({
      // Default configuration
      defaultSize: config.defaultSize || 'standard',
      defaultColor: config.defaultColor || 'inherit',
      useMaterialIcons: config.useMaterialIcons !== false,
      enableAnimations: config.enableAnimations !== false,

      // Icon mappings for custom SVG icons
      iconMappings: {
        satellite: '/assets/icons/satellite.svg',
        asteroid: '/assets/icons/asteroid.svg',
        orbit: '/assets/icons/orbit.svg',
        impact: '/assets/icons/impact.svg',
        ...config.iconMappings,
      },

      // Theme-aware icon colors
      getThemeColor: (theme = 'light') => ({
        primary: theme === 'light' ? '#1976d2' : '#90caf9',
        secondary: theme === 'light' ? '#dc004e' : '#f48fb1',
        error: theme === 'light' ? '#d32f2f' : '#f44336',
        warning: theme === 'light' ? '#ff9800' : '#ffb74d',
        success: theme === 'light' ? '#388e3c' : '#81c784',
        info: theme === 'light' ? '#0288d1' : '#4fc3f7',
      }),

      // Size definitions in pixels
      sizes: {
        touch: 48,
        standard: 40,
        small: 32,
        xsmall: 24,
      },
    }),
    [config]
  );

  return (
    <IconContext.Provider value={contextValue}>{children}</IconContext.Provider>
  );
};

IconProvider.propTypes = {
  children: PropTypes.node.isRequired,
  config: PropTypes.shape({
    defaultSize: PropTypes.oneOf(['touch', 'standard', 'small', 'xsmall']),
    defaultColor: PropTypes.string,
    useMaterialIcons: PropTypes.bool,
    enableAnimations: PropTypes.bool,
    iconMappings: PropTypes.object,
  }),
};

/**
 * Hook to use the icon context
 */
export const useIcon = () => {
  const context = useContext(IconContext);
  if (!context) {
    throw new Error('useIcon must be used within an IconProvider');
  }
  return context;
};

/**
 * Higher-order component to inject icon context
 */
export const withIcon = Component => {
  const WithIcon = props => {
    const iconContext = useIcon();
    return <Component {...props} icon={iconContext} />;
  };

  WithIcon.displayName = `WithIcon(${Component.displayName || Component.name})`;
  return WithIcon;
};

export default IconContext;
