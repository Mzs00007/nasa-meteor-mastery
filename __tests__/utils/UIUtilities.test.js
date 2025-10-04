import uiUtilities, { getUIUtilities } from '../../src/utils/UIUtilities.js';

// Mock DOM methods
const mockSetProperty = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockGetElementById = jest.fn();
const mockFocus = jest.fn();

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      style: {
        setProperty: mockSetProperty
      }
    },
    body: {
      className: '',
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    },
    createElement: jest.fn((tagName) => ({
      tagName: tagName.toUpperCase(),
      setAttribute: jest.fn(),
      textContent: '',
      className: ''
    })),
    getElementById: mockGetElementById
  },
  writable: true
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 1024,
    performance: {
      now: jest.fn(() => Date.now())
    },
    requestAnimationFrame: jest.fn(callback => setTimeout(callback, 16))
  },
  writable: true
});

// Mock global requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 16));

// Mock Intl.DateTimeFormat
global.Intl = {
  DateTimeFormat: jest.fn().mockImplementation(() => ({
    format: jest.fn((date) => '12/25/2023')
  }))
};

describe('UIUtilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset UIUtilities state
    uiUtilities.tooltips.clear();
    uiUtilities.descriptions.clear();
    uiUtilities.statistics.clear();
    uiUtilities.notifications = [];
    uiUtilities.themes.clear();
    
    // Reset window width
    window.innerWidth = 1024;
    
    // Reset document body className
    document.body.className = '';
    
    // Setup default mock returns
    mockGetElementById.mockReturnValue({
      focus: mockFocus
    });
  });

  describe('Constructor', () => {
    test('should initialize with empty collections', () => {
      const newUtilities = new (uiUtilities.constructor)();
      
      expect(newUtilities.tooltips).toBeInstanceOf(Map);
      expect(newUtilities.descriptions).toBeInstanceOf(Map);
      expect(newUtilities.statistics).toBeInstanceOf(Map);
      expect(newUtilities.notifications).toEqual([]);
      expect(newUtilities.themes).toBeInstanceOf(Map);
    });
  });

  describe('Tooltip Management', () => {
    test('should register tooltip with default options', () => {
      uiUtilities.registerTooltip('test-element', 'Test content');
      
      const tooltip = uiUtilities.getTooltip('test-element');
      expect(tooltip).toEqual({
        content: 'Test content',
        position: 'top',
        delay: 500,
        visible: false
      });
    });

    test('should register tooltip with custom options', () => {
      uiUtilities.registerTooltip('test-element', 'Test content', 'bottom', 1000);
      
      const tooltip = uiUtilities.getTooltip('test-element');
      expect(tooltip).toEqual({
        content: 'Test content',
        position: 'bottom',
        delay: 1000,
        visible: false
      });
    });

    test('should show tooltip', () => {
      uiUtilities.registerTooltip('test-element', 'Test content');
      uiUtilities.showTooltip('test-element');
      
      const tooltip = uiUtilities.getTooltip('test-element');
      expect(tooltip.visible).toBe(true);
    });

    test('should hide tooltip', () => {
      uiUtilities.registerTooltip('test-element', 'Test content');
      uiUtilities.showTooltip('test-element');
      uiUtilities.hideTooltip('test-element');
      
      const tooltip = uiUtilities.getTooltip('test-element');
      expect(tooltip.visible).toBe(false);
    });

    test('should handle non-existent tooltip gracefully', () => {
      expect(uiUtilities.getTooltip('non-existent')).toBeUndefined();
      
      expect(() => {
        uiUtilities.showTooltip('non-existent');
        uiUtilities.hideTooltip('non-existent');
      }).not.toThrow();
    });
  });

  describe('Description Management', () => {
    test('should register description with default category', () => {
      uiUtilities.registerDescription('test-component', 'Test Title', 'Test content');
      
      const description = uiUtilities.getDescription('test-component');
      expect(description).toEqual({
        title: 'Test Title',
        content: 'Test content',
        category: 'general',
        lastUpdated: expect.any(String)
      });
    });

    test('should register description with custom category', () => {
      uiUtilities.registerDescription('test-component', 'Test Title', 'Test content', 'custom');
      
      const description = uiUtilities.getDescription('test-component');
      expect(description.category).toBe('custom');
    });

    test('should get descriptions by category', () => {
      uiUtilities.registerDescription('comp1', 'Title 1', 'Content 1', 'category1');
      uiUtilities.registerDescription('comp2', 'Title 2', 'Content 2', 'category1');
      uiUtilities.registerDescription('comp3', 'Title 3', 'Content 3', 'category2');
      
      const category1Descriptions = uiUtilities.getDescriptionsByCategory('category1');
      expect(category1Descriptions).toHaveLength(2);
      expect(category1Descriptions[0].id).toBe('comp1');
      expect(category1Descriptions[1].id).toBe('comp2');
    });

    test('should return empty array for non-existent category', () => {
      const descriptions = uiUtilities.getDescriptionsByCategory('non-existent');
      expect(descriptions).toEqual([]);
    });
  });

  describe('Statistics Management', () => {
    test('should update statistic with default options', () => {
      uiUtilities.updateStatistic('test-stat', 42);
      
      const statistic = uiUtilities.getStatistic('test-stat');
      expect(statistic).toEqual({
        value: 42,
        unit: '',
        format: 'number',
        timestamp: expect.any(String),
        history: []
      });
    });

    test('should update statistic with custom options', () => {
      uiUtilities.updateStatistic('test-stat', 42, 'km', 'decimal');
      
      const statistic = uiUtilities.getStatistic('test-stat');
      expect(statistic).toEqual({
        value: 42,
        unit: 'km',
        format: 'decimal',
        timestamp: expect.any(String),
        history: []
      });
    });

    test('should maintain statistic history', () => {
      uiUtilities.updateStatistic('test-stat', 10);
      uiUtilities.updateStatistic('test-stat', 20);
      uiUtilities.updateStatistic('test-stat', 30);
      
      const statistic = uiUtilities.getStatistic('test-stat');
      expect(statistic.history).toHaveLength(2);
      expect(statistic.history[0].value).toBe(10);
      expect(statistic.history[1].value).toBe(20);
    });

    test('should limit history to 10 entries', () => {
      for (let i = 1; i <= 15; i++) {
        uiUtilities.updateStatistic('test-stat', i);
      }
      
      const statistic = uiUtilities.getStatistic('test-stat');
      expect(statistic.history).toHaveLength(10);
      expect(statistic.history[0].value).toBe(5);
      expect(statistic.history[9].value).toBe(14);
    });

    test('should format statistics correctly', () => {
      uiUtilities.updateStatistic('percentage-stat', 0.75, '', 'percentage');
      uiUtilities.updateStatistic('currency-stat', 1234.56, '', 'currency');
      uiUtilities.updateStatistic('scientific-stat', 123456, 'm', 'scientific');
      uiUtilities.updateStatistic('decimal-stat', 42.123, 'km', 'decimal');
      uiUtilities.updateStatistic('integer-stat', 42.7, 'items', 'integer');
      uiUtilities.updateStatistic('default-stat', 42, 'units', 'number');
      
      expect(uiUtilities.formatStatistic('percentage-stat')).toBe('75.0%');
      expect(uiUtilities.formatStatistic('currency-stat')).toBe('$1,235');
      expect(uiUtilities.formatStatistic('scientific-stat')).toBe('1.23e+5 m');
      expect(uiUtilities.formatStatistic('decimal-stat')).toBe('42.12 km');
      expect(uiUtilities.formatStatistic('integer-stat')).toBe('43 items');
      expect(uiUtilities.formatStatistic('default-stat')).toBe('42 units');
    });

    test('should return empty string for non-existent statistic', () => {
      expect(uiUtilities.formatStatistic('non-existent')).toBe('');
    });
  });

  describe('Notification System', () => {
    test('should add notification with default options', () => {
      const id = uiUtilities.addNotification('Test message');
      
      const notifications = uiUtilities.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toEqual({
        id: expect.any(Number),
        message: 'Test message',
        type: 'info',
        timestamp: expect.any(String),
        duration: 5000,
        visible: true
      });
    });

    test('should add notification with custom options', () => {
      const id = uiUtilities.addNotification('Error message', 'error', 3000);
      
      const notifications = uiUtilities.getNotifications();
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].duration).toBe(3000);
    });

    test('should auto-remove notification after duration', (done) => {
      const id = uiUtilities.addNotification('Test message', 'info', 100);
      
      expect(uiUtilities.getNotifications()).toHaveLength(1);
      
      setTimeout(() => {
        expect(uiUtilities.getNotifications()).toHaveLength(0);
        done();
      }, 150);
    });

    test('should not auto-remove notification with duration 0', (done) => {
      const id = uiUtilities.addNotification('Persistent message', 'info', 0);
      
      setTimeout(() => {
        expect(uiUtilities.getNotifications()).toHaveLength(1);
        done();
      }, 100);
    });

    test('should remove notification manually', () => {
      const id = uiUtilities.addNotification('Test message');
      expect(uiUtilities.getNotifications()).toHaveLength(1);
      
      uiUtilities.removeNotification(id);
      expect(uiUtilities.getNotifications()).toHaveLength(0);
    });

    test('should clear all notifications', () => {
      uiUtilities.addNotification('Message 1');
      uiUtilities.addNotification('Message 2');
      uiUtilities.addNotification('Message 3');
      
      expect(uiUtilities.getNotifications()).toHaveLength(3);
      
      uiUtilities.clearAllNotifications();
      expect(uiUtilities.getNotifications()).toHaveLength(0);
    });
  });

  describe('Theme Management', () => {
    test('should register theme', () => {
      const themeConfig = {
        colors: { primary: '#ff0000' },
        fonts: { heading: 'Arial' }
      };
      
      uiUtilities.registerTheme('test-theme', themeConfig);
      
      const theme = uiUtilities.getTheme('test-theme');
      expect(theme).toEqual({
        ...themeConfig,
        registered: expect.any(String)
      });
    });

    test('should apply theme successfully', () => {
      const themeConfig = {
        colors: { primary: '#ff0000', secondary: '#00ff00' },
        fonts: { heading: 'Arial', body: 'Helvetica' },
        spacing: { sm: '8px', md: '16px' }
      };
      
      uiUtilities.registerTheme('test-theme', themeConfig);
      const result = uiUtilities.applyTheme('test-theme');
      
      expect(result).toBe(true);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', '#ff0000');
      expect(mockSetProperty).toHaveBeenCalledWith('--color-secondary', '#00ff00');
      expect(mockSetProperty).toHaveBeenCalledWith('--font-heading', 'Arial');
      expect(mockSetProperty).toHaveBeenCalledWith('--font-body', 'Helvetica');
      expect(mockSetProperty).toHaveBeenCalledWith('--spacing-sm', '8px');
      expect(mockSetProperty).toHaveBeenCalledWith('--spacing-md', '16px');
      expect(document.body.className).toBe('theme-test-theme');
    });

    test('should return false for non-existent theme', () => {
      const result = uiUtilities.applyTheme('non-existent');
      expect(result).toBe(false);
    });

    test('should handle theme with missing properties', () => {
      uiUtilities.registerTheme('minimal-theme', {});
      const result = uiUtilities.applyTheme('minimal-theme');
      
      expect(result).toBe(true);
      expect(document.body.className).toBe('theme-minimal-theme');
    });
  });

  describe('Animation Utilities', () => {
    test('should animate value with default options', () => {
      const mockElement = { textContent: '0' };
      
      uiUtilities.animateValue(mockElement, 0, 100);
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should animate value with custom duration and easing', () => {
      const mockElement = { textContent: '0' };
      
      uiUtilities.animateValue(mockElement, 0, 100, 2000, 'easeInCubic');
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should handle element without textContent', () => {
      const mockElement = {};
      
      expect(() => {
        uiUtilities.animateValue(mockElement, 0, 100);
      }).not.toThrow();
    });

    test('should handle null element', () => {
      expect(() => {
        uiUtilities.animateValue(null, 0, 100);
      }).not.toThrow();
    });
  });

  describe('Accessibility Utilities', () => {
    test('should announce to screen reader', () => {
      const mockElement = {
        setAttribute: jest.fn(),
        textContent: '',
        className: ''
      };
      document.createElement.mockReturnValue(mockElement);
      
      uiUtilities.announceToScreenReader('Test announcement');
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
      expect(mockElement.className).toBe('sr-only');
      expect(mockElement.textContent).toBe('Test announcement');
      expect(mockAppendChild).toHaveBeenCalledWith(mockElement);
    });

    test('should focus element with default delay', (done) => {
      const mockElement = { focus: mockFocus };
      mockGetElementById.mockReturnValue(mockElement);
      
      uiUtilities.focusElement('test-element');
      
      setTimeout(() => {
        expect(mockGetElementById).toHaveBeenCalledWith('test-element');
        expect(mockFocus).toHaveBeenCalled();
        done();
      }, 10);
    });

    test('should focus element with custom delay', (done) => {
      const mockElement = { focus: mockFocus };
      mockGetElementById.mockReturnValue(mockElement);
      
      uiUtilities.focusElement('test-element', 50);
      
      setTimeout(() => {
        expect(mockGetElementById).toHaveBeenCalledWith('test-element');
        expect(mockFocus).toHaveBeenCalled();
        done();
      }, 60);
    });

    test('should handle non-existent element gracefully', () => {
      mockGetElementById.mockReturnValue(null);
      
      expect(() => {
        uiUtilities.focusElement('non-existent');
      }).not.toThrow();
    });
  });

  describe('Responsive Utilities', () => {
    test('should detect small breakpoint', () => {
      window.innerWidth = 500;
      expect(uiUtilities.getBreakpoint()).toBe('sm');
      expect(uiUtilities.isMobile()).toBe(true);
      expect(uiUtilities.isTablet()).toBe(true);
      expect(uiUtilities.isDesktop()).toBe(false);
    });

    test('should detect medium breakpoint', () => {
      window.innerWidth = 700;
      expect(uiUtilities.getBreakpoint()).toBe('md');
      expect(uiUtilities.isMobile()).toBe(false);
      expect(uiUtilities.isTablet()).toBe(true);
      expect(uiUtilities.isDesktop()).toBe(false);
    });

    test('should detect large breakpoint', () => {
      window.innerWidth = 900;
      expect(uiUtilities.getBreakpoint()).toBe('lg');
      expect(uiUtilities.isMobile()).toBe(false);
      expect(uiUtilities.isTablet()).toBe(false);
      expect(uiUtilities.isDesktop()).toBe(true);
    });

    test('should detect extra large breakpoint', () => {
      window.innerWidth = 1200;
      expect(uiUtilities.getBreakpoint()).toBe('xl');
      expect(uiUtilities.isDesktop()).toBe(true);
    });

    test('should detect 2xl breakpoint', () => {
      window.innerWidth = 1400;
      expect(uiUtilities.getBreakpoint()).toBe('2xl');
      expect(uiUtilities.isDesktop()).toBe(true);
    });
  });

  describe('Performance Utilities', () => {
    test('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = uiUtilities.debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    test('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = uiUtilities.throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation Utilities', () => {
    test('should validate email addresses', () => {
      expect(uiUtilities.validateEmail('test@example.com')).toBe(true);
      expect(uiUtilities.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(uiUtilities.validateEmail('invalid-email')).toBe(false);
      expect(uiUtilities.validateEmail('test@')).toBe(false);
      expect(uiUtilities.validateEmail('@example.com')).toBe(false);
    });

    test('should validate numbers', () => {
      expect(uiUtilities.validateNumber('42')).toBe(true);
      expect(uiUtilities.validateNumber('42.5')).toBe(true);
      expect(uiUtilities.validateNumber('42', 0, 100)).toBe(true);
      expect(uiUtilities.validateNumber('150', 0, 100)).toBe(false);
      expect(uiUtilities.validateNumber('-10', 0, 100)).toBe(false);
      expect(uiUtilities.validateNumber('not-a-number')).toBe(false);
    });

    test('should validate required values', () => {
      expect(uiUtilities.validateRequired('value')).toBe(true);
      expect(uiUtilities.validateRequired(0)).toBe(true);
      expect(uiUtilities.validateRequired(false)).toBe(true);
      expect(uiUtilities.validateRequired('')).toBe(false);
      expect(uiUtilities.validateRequired(null)).toBe(false);
      expect(uiUtilities.validateRequired(undefined)).toBe(false);
    });
  });

  describe('Formatting Utilities', () => {
    test('should format numbers', () => {
      expect(uiUtilities.formatNumber(1234.5678)).toBe('1,234.57');
      expect(uiUtilities.formatNumber(1234.5678, 0)).toBe('1,235');
      expect(uiUtilities.formatNumber(1234.5678, 4)).toBe('1,234.5678');
    });

    test('should format dates', () => {
      const testDate = new Date('2023-12-25T10:30:00');
      
      uiUtilities.formatDate(testDate, 'short');
      uiUtilities.formatDate(testDate, 'long');
      uiUtilities.formatDate(testDate, 'time');
      
      expect(Intl.DateTimeFormat).toHaveBeenCalledTimes(3);
    });

    test('should format file sizes', () => {
      expect(uiUtilities.formatFileSize(0)).toBe('0 Bytes');
      expect(uiUtilities.formatFileSize(1024)).toBe('1 KB');
      expect(uiUtilities.formatFileSize(1048576)).toBe('1 MB');
      expect(uiUtilities.formatFileSize(1073741824)).toBe('1 GB');
      expect(uiUtilities.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('Default Setup Methods', () => {
    test('should setup default tooltips', () => {
      uiUtilities.tooltips.clear();
      uiUtilities.setupDefaultTooltips();
      
      expect(uiUtilities.tooltips.size).toBeGreaterThan(0);
      expect(uiUtilities.getTooltip('asteroid-size')).toBeDefined();
      expect(uiUtilities.getTooltip('nav-simulation')).toBeDefined();
    });

    test('should setup default descriptions', () => {
      uiUtilities.descriptions.clear();
      uiUtilities.setupDefaultDescriptions();
      
      expect(uiUtilities.descriptions.size).toBeGreaterThan(0);
      expect(uiUtilities.getDescription('simulation-setup')).toBeDefined();
      expect(uiUtilities.getDescription('impact-map')).toBeDefined();
    });

    test('should setup default themes', () => {
      uiUtilities.themes.clear();
      uiUtilities.setupDefaultThemes();
      
      expect(uiUtilities.themes.size).toBeGreaterThan(0);
      expect(uiUtilities.getTheme('meteor-madness')).toBeDefined();
      
      const theme = uiUtilities.getTheme('meteor-madness');
      expect(theme.colors).toBeDefined();
      expect(theme.fonts).toBeDefined();
      expect(theme.spacing).toBeDefined();
    });
  });

  describe('getUIUtilities Export', () => {
    test('should return utility functions object', () => {
      const utilities = getUIUtilities();
      
      expect(utilities).toHaveProperty('registerTooltip');
      expect(utilities).toHaveProperty('getTooltip');
      expect(utilities).toHaveProperty('registerDescription');
      expect(utilities).toHaveProperty('updateStatistic');
      expect(utilities).toHaveProperty('addNotification');
      expect(utilities).toHaveProperty('registerTheme');
      expect(utilities).toHaveProperty('validateEmail');
      expect(utilities).toHaveProperty('formatNumber');
      expect(utilities).toHaveProperty('debounce');
      expect(utilities).toHaveProperty('getBreakpoint');
    });

    test('should bind methods correctly', () => {
      const utilities = getUIUtilities();
      
      utilities.registerTooltip('test', 'content');
      expect(uiUtilities.getTooltip('test')).toBeDefined();
      
      utilities.updateStatistic('test-stat', 42);
      expect(uiUtilities.getStatistic('test-stat')).toBeDefined();
      
      const notificationId = utilities.addNotification('test message');
      expect(uiUtilities.getNotifications()).toHaveLength(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid animation parameters', () => {
      expect(() => {
        uiUtilities.animateValue(null, 'invalid', 100);
      }).not.toThrow();
    });

    test('should handle invalid statistic formats', () => {
      uiUtilities.updateStatistic('test-stat', 42, 'units', 'invalid-format');
      expect(uiUtilities.formatStatistic('test-stat')).toBe('42 units');
    });

    test('should handle invalid breakpoint detection', () => {
      window.innerWidth = -100;
      expect(uiUtilities.getBreakpoint()).toBe('sm');
    });

    test('should handle debounce with invalid parameters', () => {
      expect(() => {
        const debouncedFn = uiUtilities.debounce(null, 100);
        debouncedFn();
      }).toThrow();
    });

    test('should handle throttle with invalid parameters', () => {
      expect(() => {
        const throttledFn = uiUtilities.throttle(null, 100);
        throttledFn();
      }).toThrow();
    });
  });
});