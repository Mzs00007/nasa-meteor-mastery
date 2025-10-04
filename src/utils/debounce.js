/**
 * Debounce utility function for performance optimization
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce time in milliseconds
 * @param {boolean} immediate - Whether to trigger immediately
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    // Handle special cases for wait parameter
    if (isNaN(wait)) {
      wait = 0;
    }
    if (wait === Infinity || wait > 2147483647) {
      // For Infinity delay or delays larger than 32-bit signed int max, never call the function
      return;
    }

    // Capture the context at call time
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * Throttle utility function for performance optimization
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle time in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Enhanced debounce with leading and trailing options
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce time in milliseconds
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Whether to trigger on leading edge
 * @param {boolean} options.trailing - Whether to trigger on trailing edge
 * @returns {Function} - Debounced function
 */
export function enhancedDebounce(func, wait, options = {}) {
  let timeout;
  let lastArgs;
  let lastThis;
  let result;

  const { leading = false, trailing = true } = options;

  const later = () => {
    timeout = null;
    if (trailing && lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }
  };

  return function (...args) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    lastArgs = args;
    lastThis = context;

    if (leading && !timeout) {
      result = func.apply(context, args);
    }

    timeout = setTimeout(later, wait);

    return result;
  };
}
