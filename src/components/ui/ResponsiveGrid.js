import React from 'react';
import PropTypes from 'prop-types';

/**
 * ResponsiveGrid - A grid component that automatically adjusts columns based on screen size
 * Provides consistent responsive grid layouts across the application
 */
const ResponsiveGrid = ({ 
  children, 
  className = '', 
  columns = 'auto',
  gap = 'responsive',
  minItemWidth = '250px',
  alignItems = 'stretch',
  justifyItems = 'stretch'
}) => {
  // Base grid classes
  const baseClasses = 'grid w-full';
  
  // Column configuration
  const getColumnClasses = () => {
    if (columns === 'auto') {
      // Auto-fit columns based on minimum item width
      return `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
    }
    
    if (typeof columns === 'object') {
      // Custom responsive columns
      const { xs = 1, sm = 2, md = 3, lg = 4, xl = 4 } = columns;
      return `grid-cols-${xs} sm:grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl}`;
    }
    
    if (typeof columns === 'number') {
      // Fixed number of columns
      return `grid-cols-${Math.min(columns, 1)} sm:grid-cols-${Math.min(columns, 2)} md:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns}`;
    }
    
    // Custom column string
    return columns;
  };
  
  // Gap classes
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1 sm:gap-2',
    sm: 'gap-2 sm:gap-3 lg:gap-4',
    responsive: 'gap-3 sm:gap-4 md:gap-6 lg:gap-8',
    lg: 'gap-4 sm:gap-6 md:gap-8 lg:gap-10',
    xl: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12'
  };
  
  // Alignment classes
  const alignmentClasses = {
    alignItems: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    },
    justifyItems: {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      stretch: 'justify-items-stretch'
    }
  };
  
  // Combine all classes
  const combinedClasses = [
    baseClasses,
    getColumnClasses(),
    gapClasses[gap] || gapClasses.responsive,
    alignmentClasses.alignItems[alignItems],
    alignmentClasses.justifyItems[justifyItems],
    className
  ].filter(Boolean).join(' ');
  
  // Custom CSS for auto-fit with minimum width
  const customStyle = columns === 'auto' && minItemWidth ? {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), 1fr))`
  } : {};
  
  return (
    <div 
      className={combinedClasses}
      style={customStyle}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveGridItem - A grid item component with responsive utilities
 */
export const ResponsiveGridItem = ({ 
  children, 
  className = '', 
  colSpan = 1,
  rowSpan = 1,
  order = 'auto'
}) => {
  // Column span classes
  const getColSpanClasses = () => {
    if (typeof colSpan === 'object') {
      const { xs = 1, sm = 1, md = 1, lg = 1, xl = 1 } = colSpan;
      return `col-span-${xs} sm:col-span-${sm} md:col-span-${md} lg:col-span-${lg} xl:col-span-${xl}`;
    }
    return `col-span-${colSpan}`;
  };
  
  // Row span classes
  const getRowSpanClasses = () => {
    if (typeof rowSpan === 'object') {
      const { xs = 1, sm = 1, md = 1, lg = 1, xl = 1 } = rowSpan;
      return `row-span-${xs} sm:row-span-${sm} md:row-span-${md} lg:row-span-${lg} xl:row-span-${xl}`;
    }
    return `row-span-${rowSpan}`;
  };
  
  // Order classes
  const getOrderClasses = () => {
    if (order === 'auto') return '';
    if (typeof order === 'object') {
      const { xs = 'auto', sm = 'auto', md = 'auto', lg = 'auto', xl = 'auto' } = order;
      const orderClass = (val) => val === 'auto' ? '' : `order-${val}`;
      return [
        orderClass(xs),
        sm !== 'auto' ? `sm:${orderClass(sm)}` : '',
        md !== 'auto' ? `md:${orderClass(md)}` : '',
        lg !== 'auto' ? `lg:${orderClass(lg)}` : '',
        xl !== 'auto' ? `xl:${orderClass(xl)}` : ''
      ].filter(Boolean).join(' ');
    }
    return `order-${order}`;
  };
  
  const combinedClasses = [
    getColSpanClasses(),
    getRowSpanClasses(),
    getOrderClasses(),
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

ResponsiveGrid.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  columns: PropTypes.oneOfType([
    PropTypes.oneOf(['auto']),
    PropTypes.number,
    PropTypes.string,
    PropTypes.shape({
      xs: PropTypes.number,
      sm: PropTypes.number,
      md: PropTypes.number,
      lg: PropTypes.number,
      xl: PropTypes.number
    })
  ]),
  gap: PropTypes.oneOf(['none', 'xs', 'sm', 'responsive', 'lg', 'xl']),
  minItemWidth: PropTypes.string,
  alignItems: PropTypes.oneOf(['start', 'center', 'end', 'stretch']),
  justifyItems: PropTypes.oneOf(['start', 'center', 'end', 'stretch'])
};

ResponsiveGridItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  colSpan: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      xs: PropTypes.number,
      sm: PropTypes.number,
      md: PropTypes.number,
      lg: PropTypes.number,
      xl: PropTypes.number
    })
  ]),
  rowSpan: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      xs: PropTypes.number,
      sm: PropTypes.number,
      md: PropTypes.number,
      lg: PropTypes.number,
      xl: PropTypes.number
    })
  ]),
  order: PropTypes.oneOfType([
    PropTypes.oneOf(['auto']),
    PropTypes.number,
    PropTypes.shape({
      xs: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number]),
      sm: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number]),
      md: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number]),
      lg: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number]),
      xl: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number])
    })
  ])
};

export default ResponsiveGrid;