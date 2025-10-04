/**
 * UI Utilities
 * Centralized utilities for tooltips, descriptions, statistics,
 * and other UI helper functions for the Meteor Madness application
 */

class UIUtilities {
  constructor() {
    this.tooltips = new Map();
    this.descriptions = new Map();
    this.statistics = new Map();
    this.notifications = [];
    this.themes = new Map();
  }

  // Tooltip Management
  registerTooltip(elementId, content, position = 'top', delay = 500) {
    this.tooltips.set(elementId, {
      content,
      position,
      delay,
      visible: false,
    });
  }

  getTooltip(elementId) {
    return this.tooltips.get(elementId);
  }

  showTooltip(elementId) {
    const tooltip = this.tooltips.get(elementId);
    if (tooltip) {
      tooltip.visible = true;
      this.tooltips.set(elementId, tooltip);
    }
  }

  hideTooltip(elementId) {
    const tooltip = this.tooltips.get(elementId);
    if (tooltip) {
      tooltip.visible = false;
      this.tooltips.set(elementId, tooltip);
    }
  }

  // Description Management
  registerDescription(componentId, title, content, category = 'general') {
    this.descriptions.set(componentId, {
      title,
      content,
      category,
      lastUpdated: new Date().toISOString(),
    });
  }

  getDescription(componentId) {
    return this.descriptions.get(componentId);
  }

  getDescriptionsByCategory(category) {
    const descriptions = [];
    this.descriptions.forEach((desc, id) => {
      if (desc.category === category) {
        descriptions.push({ id, ...desc });
      }
    });
    return descriptions;
  }

  // Statistics Management
  updateStatistic(statId, value, unit = '', format = 'number') {
    this.statistics.set(statId, {
      value,
      unit,
      format,
      timestamp: new Date().toISOString(),
      history: this.getStatisticHistory(statId),
    });
  }

  getStatistic(statId) {
    return this.statistics.get(statId);
  }

  getStatisticHistory(statId) {
    const current = this.statistics.get(statId);
    if (current && current.history) {
      return [
        ...current.history,
        {
          value: current.value,
          timestamp: current.timestamp,
        },
      ].slice(-10); // Keep last 10 values
    }
    return [];
  }

  formatStatistic(statId) {
    const stat = this.getStatistic(statId);
    if (!stat) {
      return '';
    }

    const { value, unit, format } = stat;

    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return `$${Math.round(value).toLocaleString()}`;
      case 'scientific':
        return `${value.toExponential(2)} ${unit}`;
      case 'decimal':
        return `${value.toFixed(2)} ${unit}`;
      case 'integer':
        return `${Math.round(value)} ${unit}`;
      default:
        return `${value} ${unit}`;
    }
  }

  // Notification System
  addNotification(message, type = 'info', duration = 5000) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date().toISOString(),
      duration,
      visible: true,
    };

    this.notifications.push(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }

    return notification.id;
  }

  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(
      n => n.id !== notificationId
    );
  }

  getNotifications() {
    return this.notifications.filter(n => n.visible);
  }

  clearAllNotifications() {
    this.notifications = [];
  }

  // Theme Management
  registerTheme(themeName, themeConfig) {
    this.themes.set(themeName, {
      ...themeConfig,
      registered: new Date().toISOString(),
    });
  }

  getTheme(themeName) {
    return this.themes.get(themeName);
  }

  applyTheme(themeName) {
    const theme = this.getTheme(themeName);
    if (theme) {
      // Apply CSS custom properties
      Object.entries(theme.colors || {}).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--color-${key}`, value);
      });

      Object.entries(theme.fonts || {}).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--font-${key}`, value);
      });

      Object.entries(theme.spacing || {}).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--spacing-${key}`, value);
      });

      // Apply theme class
      document.body.className = `theme-${themeName}`;

      return true;
    }
    return false;
  }

  // Animation Utilities
  animateValue(element, start, end, duration = 1000, easing = 'easeOutCubic') {
    // Handle invalid parameters gracefully
    if (element === null || element === undefined || typeof start !== 'number' || typeof end !== 'number') {
      return;
    }

    const startTime = performance.now();

    const easingFunctions = {
      linear: t => t,
      easeInCubic: t => t * t * t,
      easeOutCubic: t => 1 - Math.pow(1 - t, 3),
      easeInOutCubic: t =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    };

    const easingFunction = easingFunctions[easing] || easingFunctions.linear;

    const animate = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunction(progress);

      const currentValue = start + (end - start) * easedProgress;

      if (element && element.textContent !== undefined) {
        element.textContent = Math.round(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // Accessibility Utilities
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  focusElement(elementId, delay = 0) {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
      }
    }, delay);
  }

  // Responsive Utilities
  getBreakpoint() {
    const width = window.innerWidth;
    if (width < 640) {
      return 'sm';
    }
    if (width < 768) {
      return 'md';
    }
    if (width < 1024) {
      return 'lg';
    }
    if (width < 1280) {
      return 'xl';
    }
    return '2xl';
  }

  isMobile() {
    return this.getBreakpoint() === 'sm';
  }

  isTablet() {
    return ['sm', 'md'].includes(this.getBreakpoint());
  }

  isDesktop() {
    return ['lg', 'xl', '2xl'].includes(this.getBreakpoint());
  }

  // Performance Utilities
  debounce(func, wait) {
    if (typeof func !== 'function') {
      throw new TypeError('Expected a function');
    }
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    if (typeof func !== 'function') {
      throw new TypeError('Expected a function');
    }
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Validation Utilities
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validateNumber(value, min = -Infinity, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  validateRequired(value) {
    return value !== null && value !== undefined && value !== '';
  }

  // Formatting Utilities
  formatNumber(number, decimals = 2) {
    return number.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  formatDate(date, format = 'short') {
    const options = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
      time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    };

    return new Intl.DateTimeFormat(
      'en-US',
      options[format] || options.short
    ).format(new Date(date));
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
      return '0 Bytes';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  // Setup default configurations
  setupDefaultTooltips() {
    // Simulation tooltips
    this.registerTooltip(
      'asteroid-size',
      'Diameter of the asteroid in meters. Larger asteroids cause more damage.',
      'top'
    );
    this.registerTooltip(
      'asteroid-velocity',
      'Impact velocity in km/s. Higher velocities increase impact energy.',
      'top'
    );
    this.registerTooltip(
      'asteroid-angle',
      'Entry angle in degrees. Steeper angles concentrate impact energy.',
      'top'
    );
    this.registerTooltip(
      'asteroid-material',
      'Material composition affects fragmentation and impact characteristics.',
      'top'
    );

    // Navigation tooltips
    this.registerTooltip(
      'nav-simulation',
      'Configure and run asteroid impact simulations',
      'bottom'
    );
    this.registerTooltip(
      'nav-impact',
      'View impact maps and damage assessments',
      'bottom'
    );
    this.registerTooltip(
      'nav-history',
      'Browse previous simulation results',
      'bottom'
    );
    this.registerTooltip(
      'nav-nasa',
      'Access real-time NASA asteroid data',
      'bottom'
    );
  }

  setupDefaultDescriptions() {
    // Component descriptions
    this.registerDescription(
      'simulation-setup',
      'Simulation Setup',
      'Configure asteroid parameters and run impact simulations using NASA data and advanced physics models.',
      'simulation'
    );

    this.registerDescription(
      'impact-map',
      'Impact Visualization',
      'Interactive map showing potential impact zones, damage radius, and affected populations.',
      'visualization'
    );

    this.registerDescription(
      'nasa-integration',
      'NASA Data Integration',
      'Real-time access to NASA CNEOS asteroid tracking data and orbital mechanics.',
      'data'
    );
  }

  setupDefaultThemes() {
    // Meteor Madness theme
    this.registerTheme('meteor-madness', {
      colors: {
        primary: '#3b82f6',
        secondary: '#f472b6',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        accent: '#60a5fa',
      },
      fonts: {
        heading: 'Orbitron, sans-serif',
        body: 'Roboto, sans-serif',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
    });
  }
}

// Create singleton instance
const uiUtilities = new UIUtilities();

// Initialize default configurations
uiUtilities.setupDefaultTooltips();
uiUtilities.setupDefaultDescriptions();
uiUtilities.setupDefaultThemes();

// Export utility functions for direct use (no React dependency)
export const getUIUtilities = () => {
  return {
    // Tooltip methods
    registerTooltip: (id, content, options) =>
      uiUtilities.registerTooltip(id, content, options),
    getTooltip: id => uiUtilities.getTooltip(id),
    showTooltip: id => uiUtilities.showTooltip(id),
    hideTooltip: id => uiUtilities.hideTooltip(id),

    // Description methods
    registerDescription: (id, title, content, category) =>
      uiUtilities.registerDescription(id, title, content, category),
    getDescription: id => uiUtilities.getDescription(id),
    getDescriptionsByCategory: category =>
      uiUtilities.getDescriptionsByCategory(category),

    // Statistics methods
    updateStatistic: (key, value) => uiUtilities.updateStatistic(key, value),
    getStatistic: key => uiUtilities.getStatistic(key),
    formatStatistic: (key, value) => uiUtilities.formatStatistic(key, value),

    // Notification methods
    addNotification: (message, type, duration) =>
      uiUtilities.addNotification(message, type, duration),
    removeNotification: id => uiUtilities.removeNotification(id),
    getNotifications: () => uiUtilities.getNotifications(),
    clearAllNotifications: () => uiUtilities.clearAllNotifications(),

    // Theme methods
    registerTheme: (name, config) => uiUtilities.registerTheme(name, config),
    getTheme: name => uiUtilities.getTheme(name),
    applyTheme: name => uiUtilities.applyTheme(name),

    // Accessibility methods
    announceToScreenReader: message =>
      uiUtilities.announceToScreenReader(message),
    focusElement: element => uiUtilities.focusElement(element),

    // Responsive methods
    getBreakpoint: () => uiUtilities.getBreakpoint(),
    isMobile: () => uiUtilities.isMobile(),
    isTablet: () => uiUtilities.isTablet(),
    isDesktop: () => uiUtilities.isDesktop(),

    // Utility methods
    debounce: (func, delay) => uiUtilities.debounce(func, delay),
    throttle: (func, delay) => uiUtilities.throttle(func, delay),

    // Validation methods
    validateEmail: email => uiUtilities.validateEmail(email),
    validateNumber: (value, min, max) =>
      uiUtilities.validateNumber(value, min, max),
    validateRequired: value => uiUtilities.validateRequired(value),

    // Formatting methods
    formatNumber: (number, decimals) =>
      uiUtilities.formatNumber(number, decimals),
    formatDate: (date, format) => uiUtilities.formatDate(date, format),
    formatFileSize: bytes => uiUtilities.formatFileSize(bytes),

    // Animation methods
    animateValue: (element, start, end, duration, callback) =>
      uiUtilities.animateValue(element, start, end, duration, callback),
  };
};

export default uiUtilities;
