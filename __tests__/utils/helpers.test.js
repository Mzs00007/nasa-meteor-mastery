/**
 * @jest-environment jsdom
 */

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Load the helpers file
require('../../src/utils/helpers.js');

describe('FormatUtils', () => {
  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(FormatUtils.formatNumber(1234567)).toBe('1,234,567');
      expect(FormatUtils.formatNumber(1000)).toBe('1,000');
      expect(FormatUtils.formatNumber(123)).toBe('123');
    });

    it('should handle decimals', () => {
      expect(FormatUtils.formatNumber(1234.567, 2)).toBe('1,234.57');
      expect(FormatUtils.formatNumber(1000.1, 1)).toBe('1,000.1');
    });

    it('should handle null and undefined', () => {
      expect(FormatUtils.formatNumber(null)).toBe('N/A');
      expect(FormatUtils.formatNumber(undefined)).toBe('N/A');
    });

    it('should handle zero', () => {
      expect(FormatUtils.formatNumber(0)).toBe('0');
      expect(FormatUtils.formatNumber(0, 2)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(FormatUtils.formatNumber(-1234)).toBe('-1,234');
    });
  });

  describe('formatSINumber', () => {
    it('should format large numbers with SI prefixes', () => {
      expect(FormatUtils.formatSINumber(1500000000000000000)).toBe('1.5E');
      expect(FormatUtils.formatSINumber(2500000000000000)).toBe('2.5P');
      expect(FormatUtils.formatSINumber(3500000000000)).toBe('3.5T');
      expect(FormatUtils.formatSINumber(4500000000)).toBe('4.5G');
      expect(FormatUtils.formatSINumber(5500000)).toBe('5.5M');
      expect(FormatUtils.formatSINumber(6500)).toBe('6.5k');
    });

    it('should handle small numbers', () => {
      expect(FormatUtils.formatSINumber(123)).toBe('123');
      expect(FormatUtils.formatSINumber(0)).toBe('0');
    });

    it('should handle null and undefined', () => {
      expect(FormatUtils.formatSINumber(null)).toBe('N/A');
      expect(FormatUtils.formatSINumber(undefined)).toBe('N/A');
    });

    it('should handle custom decimals', () => {
      expect(FormatUtils.formatSINumber(1500000, 0)).toBe('2M');
      expect(FormatUtils.formatSINumber(1500000, 2)).toBe('1.50M');
    });
  });

  describe('formatDistance', () => {
    it('should format distances correctly', () => {
      expect(FormatUtils.formatDistance(1500)).toBe('1.5 km');
      expect(FormatUtils.formatDistance(500)).toBe('500.0 m');
      expect(FormatUtils.formatDistance(1000)).toBe('1.0 km');
    });

    it('should handle custom decimals', () => {
      expect(FormatUtils.formatDistance(1234, 0)).toBe('1 km');
      expect(FormatUtils.formatDistance(567, 2)).toBe('567.00 m');
    });
  });

  describe('formatEnergy', () => {
    it('should format energy with appropriate units', () => {
      expect(FormatUtils.formatEnergy(1e16)).toContain('megatons TNT');
      expect(FormatUtils.formatEnergy(1e13)).toContain('TJ');
      expect(FormatUtils.formatEnergy(1e10)).toContain('GJ');
      expect(FormatUtils.formatEnergy(1000)).toContain('J');
    });

    it('should handle custom decimals', () => {
      expect(FormatUtils.formatEnergy(1e13, 0)).toContain('TJ');
      expect(FormatUtils.formatEnergy(1e13, 2)).toContain('TJ');
    });
  });

  describe('formatVelocity', () => {
    it('should format velocity correctly', () => {
      expect(FormatUtils.formatVelocity(123.456)).toBe('123.5 m/s');
      expect(FormatUtils.formatVelocity(100, 0)).toBe('100 m/s');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages correctly', () => {
      expect(FormatUtils.formatPercent(0.1234)).toBe('12.3%');
      expect(FormatUtils.formatPercent(0.5, 0)).toBe('50%');
      expect(FormatUtils.formatPercent(1)).toBe('100.0%');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2023-12-25T15:30:00');
      const result = FormatUtils.formatDateTime(date);
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should format date only', () => {
      const date = new Date('2023-12-25T15:30:00');
      const result = FormatUtils.formatDateTime(date, false);
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(FormatUtils.formatDuration(90061)).toBe('1d 1h 1m');
      expect(FormatUtils.formatDuration(3661)).toBe('1h 1m');
      expect(FormatUtils.formatDuration(61)).toBe('1m');
      expect(FormatUtils.formatDuration(0)).toBe('0m');
    });

    it('should handle large durations', () => {
      expect(FormatUtils.formatDuration(172800)).toBe('2d');
    });
  });
});

describe('ValidationUtils', () => {
  describe('validateNumber', () => {
    it('should validate numbers correctly', () => {
      expect(ValidationUtils.validateNumber(5)).toBe(true);
      expect(ValidationUtils.validateNumber('5')).toBe(true);
      expect(ValidationUtils.validateNumber('abc')).toBe(false);
      expect(ValidationUtils.validateNumber(null)).toBe(false);
    });

    it('should validate number ranges', () => {
      expect(ValidationUtils.validateNumber(5, 0, 10)).toBe(true);
      expect(ValidationUtils.validateNumber(-1, 0, 10)).toBe(false);
      expect(ValidationUtils.validateNumber(15, 0, 10)).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should validate required fields', () => {
      expect(ValidationUtils.validateRequired('test')).toBe(true);
      expect(ValidationUtils.validateRequired(0)).toBe(true);
      expect(ValidationUtils.validateRequired(false)).toBe(true);
      expect(ValidationUtils.validateRequired('')).toBe(false);
      expect(ValidationUtils.validateRequired(null)).toBe(false);
      expect(ValidationUtils.validateRequired(undefined)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate email addresses', () => {
      expect(ValidationUtils.validateEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(ValidationUtils.validateEmail('invalid-email')).toBe(false);
      expect(ValidationUtils.validateEmail('test@')).toBe(false);
      expect(ValidationUtils.validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate URLs', () => {
      expect(ValidationUtils.validateURL('https://example.com')).toBe(true);
      expect(ValidationUtils.validateURL('http://test.org')).toBe(true);
      expect(ValidationUtils.validateURL('ftp://files.example.com')).toBe(true);
      expect(ValidationUtils.validateURL('invalid-url')).toBe(false);
      expect(ValidationUtils.validateURL('http://')).toBe(false);
    });
  });

  describe('validateLatitude', () => {
    it('should validate latitude values', () => {
      expect(ValidationUtils.validateLatitude(0)).toBe(true);
      expect(ValidationUtils.validateLatitude(45.5)).toBe(true);
      expect(ValidationUtils.validateLatitude(-89.9)).toBe(true);
      expect(ValidationUtils.validateLatitude(90)).toBe(true);
      expect(ValidationUtils.validateLatitude(-90)).toBe(true);
      expect(ValidationUtils.validateLatitude(91)).toBe(false);
      expect(ValidationUtils.validateLatitude(-91)).toBe(false);
    });
  });

  describe('validateLongitude', () => {
    it('should validate longitude values', () => {
      expect(ValidationUtils.validateLongitude(0)).toBe(true);
      expect(ValidationUtils.validateLongitude(123.45)).toBe(true);
      expect(ValidationUtils.validateLongitude(-179.9)).toBe(true);
      expect(ValidationUtils.validateLongitude(180)).toBe(true);
      expect(ValidationUtils.validateLongitude(-180)).toBe(true);
      expect(ValidationUtils.validateLongitude(181)).toBe(false);
      expect(ValidationUtils.validateLongitude(-181)).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should validate coordinate pairs', () => {
      expect(ValidationUtils.validateCoordinates(45.5, 123.4)).toBe(true);
      expect(ValidationUtils.validateCoordinates(91, 123.4)).toBe(false);
      expect(ValidationUtils.validateCoordinates(45.5, 181)).toBe(false);
    });
  });

  describe('validateAsteroidDiameter', () => {
    it('should validate asteroid diameter', () => {
      expect(ValidationUtils.validateAsteroidDiameter(100)).toBe(true);
      expect(ValidationUtils.validateAsteroidDiameter(0.5)).toBe(true);
      expect(ValidationUtils.validateAsteroidDiameter(0.05)).toBe(false);
      expect(ValidationUtils.validateAsteroidDiameter(200000)).toBe(false);
    });
  });

  describe('validateAsteroidVelocity', () => {
    it('should validate asteroid velocity', () => {
      expect(ValidationUtils.validateAsteroidVelocity(20)).toBe(true);
      expect(ValidationUtils.validateAsteroidVelocity(50000)).toBe(true);
      expect(ValidationUtils.validateAsteroidVelocity(0.5)).toBe(false);
      expect(ValidationUtils.validateAsteroidVelocity(200000)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return appropriate error messages', () => {
      expect(ValidationUtils.getErrorMessage('Test', '')).toBe('Test is required');
      expect(ValidationUtils.getErrorMessage('Number', 150, { min: 0, max: 100 }))
        .toBe('Number must be between 0 and 100');
      expect(ValidationUtils.getErrorMessage('Value', -5, { min: 0 }))
        .toBe('Value must be at least 0');
      expect(ValidationUtils.getErrorMessage('Value', 150, { max: 100 }))
        .toBe('Value must be at most 100');
      expect(ValidationUtils.getErrorMessage('Valid', 50, { min: 0, max: 100 }))
        .toBe(null);
    });
  });
});

describe('StorageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('localStorage operations', () => {
    it('should set items in localStorage', () => {
      localStorageMock.setItem.mockReturnValue(undefined);
      const result = StorageUtils.setItem('test', { value: 123 });
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test', '{"value":123}');
    });

    it('should handle localStorage set errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const result = StorageUtils.setItem('test', 'value');
      expect(result).toBe(false);
    });

    it('should get items from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('{"value":123}');
      const result = StorageUtils.getItem('test');
      
      expect(result).toEqual({ value: 123 });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test');
    });

    it('should return default value when item not found', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = StorageUtils.getItem('test', 'default');
      
      expect(result).toBe('default');
    });

    it('should handle localStorage get errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Parse error');
      });
      
      const result = StorageUtils.getItem('test', 'default');
      expect(result).toBe('default');
    });

    it('should remove items from localStorage', () => {
      localStorageMock.removeItem.mockReturnValue(undefined);
      const result = StorageUtils.removeItem('test');
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test');
    });

    it('should clear localStorage', () => {
      localStorageMock.clear.mockReturnValue(undefined);
      const result = StorageUtils.clear();
      
      expect(result).toBe(true);
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('sessionStorage operations', () => {
    it('should set items in sessionStorage', () => {
      sessionStorageMock.setItem.mockReturnValue(undefined);
      const result = StorageUtils.setSessionItem('test', { value: 123 });
      
      expect(result).toBe(true);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test', '{"value":123}');
    });

    it('should get items from sessionStorage', () => {
      sessionStorageMock.getItem.mockReturnValue('{"value":123}');
      const result = StorageUtils.getSessionItem('test');
      
      expect(result).toEqual({ value: 123 });
    });
  });

  describe('storage with expiry', () => {
    it('should set items with expiry', () => {
      localStorageMock.setItem.mockReturnValue(undefined);
      const result = StorageUtils.setWithExpiry('test', 'value', 1000);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should get non-expired items', () => {
      const futureTime = Date.now() + 10000;
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        value: 'test',
        expiry: futureTime
      }));
      
      const result = StorageUtils.getWithExpiry('test');
      expect(result).toBe('test');
    });

    it('should return null for expired items', () => {
      const pastTime = Date.now() - 10000;
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        value: 'test',
        expiry: pastTime
      }));
      
      const result = StorageUtils.getWithExpiry('test');
      expect(result).toBe(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test');
    });
  });
});

describe('DOMUtils', () => {
  describe('createElement', () => {
    it('should create elements with attributes', () => {
      const element = DOMUtils.createElement('div', {
        id: 'test',
        className: 'test-class',
        'data-value': '123'
      });
      
      expect(element.tagName).toBe('DIV');
      expect(element.id).toBe('test');
      expect(element.className).toBe('test-class');
      expect(element.getAttribute('data-value')).toBe('123');
    });

    it('should create elements with HTML content', () => {
      const element = DOMUtils.createElement('div', {
        html: '<span>Test</span>'
      });
      
      expect(element.innerHTML).toBe('<span>Test</span>');
    });

    it('should create elements with children', () => {
      const child1 = document.createElement('span');
      const element = DOMUtils.createElement('div', {}, [child1, 'Text node']);
      
      expect(element.children.length).toBe(1);
      expect(element.childNodes.length).toBe(2);
    });
  });

  describe('clearElement', () => {
    it('should remove all children from element', () => {
      const parent = document.createElement('div');
      parent.appendChild(document.createElement('span'));
      parent.appendChild(document.createElement('p'));
      
      DOMUtils.clearElement(parent);
      expect(parent.children.length).toBe(0);
    });
  });

  describe('addEventListener', () => {
    it('should add event listener and return cleanup function', () => {
      const element = document.createElement('button');
      const handler = jest.fn();
      
      const cleanup = DOMUtils.addEventListener(element, 'click', handler);
      
      element.click();
      expect(handler).toHaveBeenCalled();
      
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();
    
    it('should debounce function calls', () => {
      const func = jest.fn();
      const debouncedFunc = DOMUtils.debounce(func, 100);
      
      debouncedFunc();
      debouncedFunc();
      debouncedFunc();
      
      expect(func).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should handle immediate execution', () => {
      const func = jest.fn();
      const debouncedFunc = DOMUtils.debounce(func, 100, true);
      
      debouncedFunc();
      expect(func).toHaveBeenCalledTimes(1);
      
      debouncedFunc();
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();
    
    it('should throttle function calls', () => {
      const func = jest.fn();
      const throttledFunc = DOMUtils.throttle(func, 100);
      
      throttledFunc();
      throttledFunc();
      throttledFunc();
      
      expect(func).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });
  });

  describe('isInViewport', () => {
    it('should check if element is in viewport', () => {
      const element = document.createElement('div');
      
      // Mock getBoundingClientRect
      element.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        left: 100,
        bottom: 200,
        right: 200
      }));
      
      // Mock window dimensions
      Object.defineProperty(window, 'innerHeight', { value: 800 });
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      
      const result = DOMUtils.isInViewport(element);
      expect(result).toBe(true);
    });
  });

  describe('smoothScrollTo', () => {
    it('should scroll to element smoothly', () => {
      const element = document.createElement('div');
      
      element.getBoundingClientRect = jest.fn(() => ({
        top: 500
      }));
      
      Object.defineProperty(window, 'pageYOffset', { value: 100 });
      window.scrollTo = jest.fn();
      
      DOMUtils.smoothScrollTo(element, 50);
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 550, // 500 + 100 - 50
        behavior: 'smooth'
      });
    });
  });
});

describe('MathUtils', () => {
  describe('lerp', () => {
    it('should interpolate between values', () => {
      expect(MathUtils.lerp(0, 10, 0.5)).toBe(5);
      expect(MathUtils.lerp(10, 20, 0.25)).toBe(12.5);
      expect(MathUtils.lerp(0, 100, 0)).toBe(0);
      expect(MathUtils.lerp(0, 100, 1)).toBe(100);
    });
  });

  describe('clamp', () => {
    it('should clamp values between min and max', () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('map', () => {
    it('should map values from one range to another', () => {
      expect(MathUtils.map(5, 0, 10, 0, 100)).toBe(50);
      expect(MathUtils.map(2.5, 0, 10, 0, 100)).toBe(25);
      expect(MathUtils.map(0, 0, 10, 50, 150)).toBe(50);
    });
  });

  describe('random', () => {
    it('should generate random numbers in range', () => {
      const result = MathUtils.random(10, 20);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThan(20);
    });
  });

  describe('randomInt', () => {
    it('should generate random integers in range', () => {
      const result = MathUtils.randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('round', () => {
    it('should round to specified decimal places', () => {
      expect(MathUtils.round(3.14159, 2)).toBe(3.14);
      expect(MathUtils.round(3.14159, 0)).toBe(3);
      expect(MathUtils.round(3.14159, 4)).toBe(3.1416);
    });
  });

  describe('distance', () => {
    it('should calculate distance between points', () => {
      expect(MathUtils.distance(0, 0, 3, 4)).toBe(5);
      expect(MathUtils.distance(1, 1, 4, 5)).toBe(5);
    });
  });

  describe('angle', () => {
    it('should calculate angle between points', () => {
      expect(MathUtils.angle(0, 0, 1, 0)).toBe(0);
      expect(MathUtils.angle(0, 0, 0, 1)).toBe(Math.PI / 2);
    });
  });

  describe('degToRad', () => {
    it('should convert degrees to radians', () => {
      expect(MathUtils.degToRad(180)).toBe(Math.PI);
      expect(MathUtils.degToRad(90)).toBe(Math.PI / 2);
      expect(MathUtils.degToRad(0)).toBe(0);
    });
  });

  describe('radToDeg', () => {
    it('should convert radians to degrees', () => {
      expect(MathUtils.radToDeg(Math.PI)).toBe(180);
      expect(MathUtils.radToDeg(Math.PI / 2)).toBe(90);
      expect(MathUtils.radToDeg(0)).toBe(0);
    });
  });
});

describe('ColorUtils', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(ColorUtils.hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorUtils.hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorUtils.hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(ColorUtils.hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should return null for invalid hex', () => {
      expect(ColorUtils.hexToRgb('invalid')).toBe(null);
      expect(ColorUtils.hexToRgb('#gg0000')).toBe(null);
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(ColorUtils.rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(ColorUtils.rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(ColorUtils.rgbToHex(0, 0, 255)).toBe('#0000ff');
    });
  });

  describe('randomColor', () => {
    it('should generate random hex color', () => {
      const color = ColorUtils.randomColor();
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  describe('lightenColor', () => {
    it('should lighten colors', () => {
      const result = ColorUtils.lightenColor('#808080', 0.5);
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
      
      // Should return original color for invalid input
      expect(ColorUtils.lightenColor('invalid')).toBe('invalid');
    });
  });

  describe('darkenColor', () => {
    it('should darken colors', () => {
      const result = ColorUtils.darkenColor('#808080', 0.5);
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
      
      // Should return original color for invalid input
      expect(ColorUtils.darkenColor('invalid')).toBe('invalid');
    });
  });

  describe('contrastRatio', () => {
    it('should calculate contrast ratio', () => {
      const ratio = ColorUtils.contrastRatio('#ffffff', '#000000');
      expect(ratio).toBeGreaterThan(1);
      
      // Should return 1 for invalid colors
      expect(ColorUtils.contrastRatio('invalid', '#000000')).toBe(1);
    });
  });

  describe('calculateLuminance', () => {
    it('should calculate luminance correctly', () => {
      const luminance = ColorUtils.calculateLuminance(255, 255, 255);
      expect(luminance).toBeCloseTo(1, 1);
      
      const darkLuminance = ColorUtils.calculateLuminance(0, 0, 0);
      expect(darkLuminance).toBeCloseTo(0, 1);
    });
  });
});

describe('AccessibilityUtils', () => {
  describe('media query checks', () => {
    it('should check for reduced motion preference', () => {
      window.matchMedia.mockReturnValue({ matches: true });
      expect(AccessibilityUtils.prefersReducedMotion()).toBe(true);
      
      window.matchMedia.mockReturnValue({ matches: false });
      expect(AccessibilityUtils.prefersReducedMotion()).toBe(false);
    });

    it('should check for high contrast preference', () => {
      window.matchMedia.mockReturnValue({ matches: true });
      expect(AccessibilityUtils.prefersHighContrast()).toBe(true);
    });

    it('should check for dark mode preference', () => {
      window.matchMedia.mockReturnValue({ matches: true });
      expect(AccessibilityUtils.prefersDarkMode()).toBe(true);
    });
  });

  describe('element accessibility', () => {
    it('should make elements focusable', () => {
      const element = document.createElement('div');
      const result = AccessibilityUtils.makeFocusable(element);
      
      expect(result.getAttribute('tabindex')).toBe('0');
      expect(result).toBe(element);
    });

    it('should set ARIA labels', () => {
      const element = document.createElement('button');
      const result = AccessibilityUtils.setAriaLabel(element, 'Test button');
      
      expect(result.getAttribute('aria-label')).toBe('Test button');
      expect(result).toBe(element);
    });

    it('should set ARIA descriptions', () => {
      const element = document.createElement('input');
      const result = AccessibilityUtils.setAriaDescription(element, 'help-text');
      
      expect(result.getAttribute('aria-describedby')).toBe('help-text');
      expect(result).toBe(element);
    });

    it('should check screen reader accessibility', () => {
      const element = document.createElement('div');
      expect(AccessibilityUtils.isScreenReaderAccessible(element)).toBe(true);
      
      element.setAttribute('aria-hidden', 'true');
      expect(AccessibilityUtils.isScreenReaderAccessible(element)).toBe(false);
      
      element.removeAttribute('aria-hidden');
      element.setAttribute('role', 'presentation');
      expect(AccessibilityUtils.isScreenReaderAccessible(element)).toBe(false);
      
      element.removeAttribute('role');
      element.setAttribute('hidden', '');
      expect(AccessibilityUtils.isScreenReaderAccessible(element)).toBe(false);
    });
  });
});

describe('Global Window Exports', () => {
  it('should export all utility classes to window', () => {
    expect(window.FormatUtils).toBeDefined();
    expect(window.ValidationUtils).toBeDefined();
    expect(window.StorageUtils).toBeDefined();
    expect(window.DOMUtils).toBeDefined();
    expect(window.MathUtils).toBeDefined();
    expect(window.ColorUtils).toBeDefined();
    expect(window.AccessibilityUtils).toBeDefined();
  });

  it('should have all expected methods on exported classes', () => {
    expect(typeof window.FormatUtils.formatNumber).toBe('function');
    expect(typeof window.ValidationUtils.validateEmail).toBe('function');
    expect(typeof window.StorageUtils.setItem).toBe('function');
    expect(typeof window.DOMUtils.createElement).toBe('function');
    expect(typeof window.MathUtils.lerp).toBe('function');
    expect(typeof window.ColorUtils.hexToRgb).toBe('function');
    expect(typeof window.AccessibilityUtils.makeFocusable).toBe('function');
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle extreme values in formatters', () => {
    expect(FormatUtils.formatNumber(Infinity)).toBe('∞');
    expect(FormatUtils.formatNumber(-Infinity)).toBe('-∞');
    expect(FormatUtils.formatSINumber(0)).toBe('0');
    expect(FormatUtils.formatDistance(0)).toBe('0.0 m');
  });

  it('should handle invalid inputs gracefully', () => {
    expect(ValidationUtils.validateNumber('not-a-number')).toBe(false);
    expect(ValidationUtils.validateEmail('')).toBe(false);
    expect(ValidationUtils.validateURL('')).toBe(false);
  });

  it('should handle DOM operations safely', () => {
    const element = DOMUtils.createElement('div');
    expect(element).toBeInstanceOf(HTMLElement);
    
    DOMUtils.clearElement(element);
    expect(element.children.length).toBe(0);
  });

  it('should handle math operations with edge cases', () => {
    expect(MathUtils.clamp(Infinity, 0, 100)).toBe(100);
    expect(MathUtils.clamp(-Infinity, 0, 100)).toBe(0);
    expect(MathUtils.round(NaN, 2)).toBeNaN();
  });

  it('should handle color operations with invalid inputs', () => {
    expect(ColorUtils.hexToRgb('')).toBe(null);
    expect(ColorUtils.lightenColor('', 0.5)).toBe('');
    expect(ColorUtils.darkenColor('', 0.5)).toBe('');
  });
});