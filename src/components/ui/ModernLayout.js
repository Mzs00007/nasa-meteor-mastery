import React from 'react';
import './ModernLayout.css';

export const ModernContainer = ({
  children,
  className = '',
  maxWidth = '1200px',
}) => (
  <div className={`modern-container ${className}`} style={{ maxWidth }}>
    {children}
  </div>
);

export const ModernGrid = ({
  children,
  className = '',
  columns = 'auto',
  gap = '1rem',
  responsive = true,
}) => (
  <div
    className={`modern-grid ${responsive ? 'responsive' : ''} ${className}`}
    style={{
      gridTemplateColumns: columns,
      gap,
    }}
  >
    {children}
  </div>
);

export const ModernSection = ({
  children,
  title,
  subtitle,
  icon,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <section
      className={`modern-section ${className} ${isCollapsed ? 'collapsed' : ''}`}
    >
      {title && (
        <div className='modern-section-header'>
          <div className='section-title-group'>
            {icon && <span className='section-icon'>{icon}</span>}
            <div>
              <h3 className='section-title'>{title}</h3>
              {subtitle && <p className='section-subtitle'>{subtitle}</p>}
            </div>
          </div>
          {collapsible && (
            <button
              className='collapse-toggle'
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
      )}
      <div className='modern-section-content'>{children}</div>
    </section>
  );
};

export const ModernPanel = ({
  children,
  className = '',
  variant = 'default',
  padding = 'normal',
  shadow = true,
}) => (
  <div
    className={`modern-panel ${variant} ${padding} ${shadow ? 'shadow' : ''} ${className}`}
  >
    {children}
  </div>
);

export const ModernSidebar = ({
  children,
  className = '',
  position = 'left',
  width = '300px',
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <aside
      className={`modern-sidebar ${position} ${isCollapsed ? 'collapsed' : ''} ${className}`}
      style={{ width: isCollapsed ? '60px' : width }}
    >
      {collapsible && (
        <button
          className='sidebar-toggle'
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {position === 'left'
            ? isCollapsed
              ? '▶'
              : '◀'
            : isCollapsed
              ? '◀'
              : '▶'}
        </button>
      )}
      <div className='sidebar-content'>{children}</div>
    </aside>
  );
};

export const ModernMain = ({ children, className = '' }) => (
  <main className={`modern-main ${className}`}>{children}</main>
);

export const ModernHeader = ({
  children,
  className = '',
  sticky = false,
  transparent = false,
}) => (
  <header
    className={`modern-header ${sticky ? 'sticky' : ''} ${transparent ? 'transparent' : ''} ${className}`}
  >
    {children}
  </header>
);

export const ModernFooter = ({ children, className = '' }) => (
  <footer className={`modern-footer ${className}`}>{children}</footer>
);

export const ModernSpacer = ({ size = '1rem', direction = 'vertical' }) => (
  <div
    className='modern-spacer'
    style={{
      [direction === 'vertical' ? 'height' : 'width']: size,
      [direction === 'vertical' ? 'width' : 'height']: '100%',
    }}
  />
);

export const ModernDivider = ({
  className = '',
  orientation = 'horizontal',
  variant = 'solid',
  spacing = '1rem',
}) => (
  <div
    className={`modern-divider ${orientation} ${variant} ${className}`}
    style={{
      margin: orientation === 'horizontal' ? `${spacing} 0` : `0 ${spacing}`,
    }}
  />
);
