// Helper Utilities for Meteor Madness

class FormatUtils {
  // Format large numbers with commas
  static formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  // Format very large numbers with SI prefixes
  static formatSINumber(num, decimals = 1) {
    if (num === null || num === undefined) {
      return 'N/A';
    }

    const si = [
      { value: 1e18, symbol: 'E' },
      { value: 1e15, symbol: 'P' },
      { value: 1e12, symbol: 'T' },
      { value: 1e9, symbol: 'G' },
      { value: 1e6, symbol: 'M' },
      { value: 1e3, symbol: 'k' },
    ];

    const regex = /\.0+$|(\.[0-9]*[1-9])0+$/;

    for (let i = 0; i < si.length; i++) {
      if (num >= si[i].value) {
        return (
          (num / si[i].value).toFixed(decimals).replace(regex, '$1') +
          si[i].symbol
        );
      }
    }

    return num.toString().replace(regex, '$1');
  }

  // Format distance with appropriate units
  static formatDistance(meters, decimals = 1) {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(decimals)} km`;
    }
    return `${meters.toFixed(decimals)} m`;
  }

  // Format energy with appropriate units
  static formatEnergy(joules, decimals = 1) {
    if (joules >= 1e15) {
      return `${(joules / 4.184e15).toFixed(decimals)} megatons TNT`;
    }
    if (joules >= 1e12) {
      return `${(joules / 1e12).toFixed(decimals)} TJ`;
    }
    if (joules >= 1e9) {
      return `${(joules / 1e9).toFixed(decimals)} GJ`;
    }
    return `${joules.toFixed(decimals)} J`;
  }

  // Format velocity with appropriate units
  static formatVelocity(mps, decimals = 1) {
    return `${mps.toFixed(decimals)} m/s`;
  }

  // Format percentage
  static formatPercent(decimal, decimals = 1) {
    return `${(decimal * 100).toFixed(decimals)}%`;
  }

  // Format date and time
  static formatDateTime(date, includeTime = true) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
  }

  // Format duration
  static formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }

    return parts.join(' ') || '0m';
  }
}

class ValidationUtils {
  // Validate numeric input
  static validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  // Validate required field
  static validateRequired(value) {
    return value !== null && value !== undefined && value !== '';
  }

  // Validate email format
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Validate URL format
  static validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate latitude
  static validateLatitude(lat) {
    return this.validateNumber(lat, -90, 90);
  }

  // Validate longitude
  static validateLongitude(lng) {
    return this.validateNumber(lng, -180, 180);
  }

  // Validate coordinates
  static validateCoordinates(lat, lng) {
    return this.validateLatitude(lat) && this.validateLongitude(lng);
  }

  // Validate asteroid diameter
  static validateAsteroidDiameter(diameter) {
    return this.validateNumber(diameter, 0.1, 100000);
  }

  // Validate asteroid velocity
  static validateAsteroidVelocity(velocity) {
    return this.validateNumber(velocity, 1, 100000);
  }

  // Get validation error message
  static getErrorMessage(field, value, constraints = {}) {
    if (!this.validateRequired(value)) {
      return `${field} is required`;
    }

    if (!this.validateNumber(value, constraints.min, constraints.max)) {
      if (constraints.min !== undefined && constraints.max !== undefined) {
        return `${field} must be between ${constraints.min} and ${constraints.max}`;
      } else if (constraints.min !== undefined) {
        return `${field} must be at least ${constraints.min}`;
      } else if (constraints.max !== undefined) {
        return `${field} must be at most ${constraints.max}`;
      }
    }

    return null;
  }
}

class StorageUtils {
  // Local storage operations
  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  }

  static getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }

  // Session storage operations
  static setSessionItem(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('SessionStorage set error:', error);
      return false;
    }
  }

  static getSessionItem(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return defaultValue;
    }
  }

  // Storage with expiration
  static setWithExpiry(key, value, ttl) {
    const item = {
      value: value,
      expiry: Date.now() + ttl,
    };
    return this.setItem(key, item);
  }

  static getWithExpiry(key) {
    const item = this.getItem(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.removeItem(key);
      return null;
    }

    return item.value;
  }
}

class DOMUtils {
  // Create element with attributes
  static createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'html') {
        element.innerHTML = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });

    // Append children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });

    return element;
  }

  // Remove all children from element
  static clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  // Add event listener with cleanup
  static addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  }

  // Debounce function
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) {
          func.apply(this, args);
        }
      };

      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) {
        func.apply(this, args);
      }
    };
  }

  // Throttle function
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Check if element is in viewport
  static isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Smooth scroll to element
  static smoothScrollTo(element, offset = 0) {
    const elementPosition =
      element.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth',
    });
  }
}

class MathUtils {
  // Linear interpolation
  static lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  // Clamp value between min and max
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Map value from one range to another
  static map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  // Random number between min and max
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Random integer between min and max (inclusive)
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Round to specified decimal places
  static round(value, decimals = 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  // Calculate distance between two points
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  // Calculate angle between two points
  static angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  // Convert degrees to radians
  static degToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // Convert radians to degrees
  static radToDeg(radians) {
    return (radians * 180) / Math.PI;
  }
}

class ColorUtils {
  // Convert hex to RGB
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // Convert RGB to hex
  static rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  // Generate random color
  static randomColor() {
    return `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`;
  }

  // Lighten color
  static lightenColor(hex, amount = 0.2) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) {
      return hex;
    }

    return this.rgbToHex(
      Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount)),
      Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount)),
      Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount))
    );
  }

  // Darken color
  static darkenColor(hex, amount = 0.2) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) {
      return hex;
    }

    return this.rgbToHex(
      Math.max(0, Math.floor(rgb.r * (1 - amount))),
      Math.max(0, Math.floor(rgb.g * (1 - amount))),
      Math.max(0, Math.floor(rgb.b * (1 - amount)))
    );
  }

  // Calculate color contrast ratio
  static contrastRatio(color1, color2) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return 1;
    }

    const luminance1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const luminance2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);

    return (
      (Math.max(luminance1, luminance2) + 0.05) /
      (Math.min(luminance1, luminance2) + 0.05)
    );
  }

  static calculateLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
}

class AccessibilityUtils {
  // Check if reduced motion is preferred
  static prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Check if high contrast is preferred
  static prefersHighContrast() {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  // Check if dark mode is preferred
  static prefersDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Make element focusable
  static makeFocusable(element) {
    element.setAttribute('tabindex', '0');
    return element;
  }

  // Add ARIA label
  static setAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
    return element;
  }

  // Add ARIA description
  static setAriaDescription(element, description) {
    element.setAttribute('aria-describedby', description);
    return element;
  }

  // Check if element is accessible to screen readers
  static isScreenReaderAccessible(element) {
    return (
      !element.hasAttribute('aria-hidden') &&
      element.getAttribute('role') !== 'presentation' &&
      !element.hasAttribute('hidden')
    );
  }
}

// Export all utility classes
window.FormatUtils = FormatUtils;
window.ValidationUtils = ValidationUtils;
window.StorageUtils = StorageUtils;
window.DOMUtils = DOMUtils;
window.MathUtils = MathUtils;
window.ColorUtils = ColorUtils;
window.AccessibilityUtils = AccessibilityUtils;

// Helper Utilities loaded silently
