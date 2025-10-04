import globalButtonUtils from '../../src/utils/GlobalButtonUtils.js';

// Mock DOM methods
const mockQuerySelectorAll = jest.fn();
const mockQuerySelector = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockGetBoundingClientRect = jest.fn();
const mockAppendChild = jest.fn();
const mockRemove = jest.fn();
const mockSetAttribute = jest.fn();
const mockGetAttribute = jest.fn();

// Mock MutationObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
global.MutationObserver = jest.fn().mockImplementation((callback) => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  callback
}));

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    querySelectorAll: mockQuerySelectorAll,
    querySelector: mockQuerySelector,
    createElement: jest.fn((tagName) => ({
      tagName: tagName.toUpperCase(),
      style: {},
      textContent: '',
      appendChild: mockAppendChild,
      remove: mockRemove,
      setAttribute: mockSetAttribute,
      getAttribute: mockGetAttribute,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      getBoundingClientRect: mockGetBoundingClientRect,
      className: '',
      id: ''
    })),
    body: {
      appendChild: mockAppendChild
    },
    head: {
      appendChild: mockAppendChild
    }
  },
  writable: true
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    buttonController: undefined,
    uiUtilities: undefined
  },
  writable: true
});

describe('GlobalButtonUtils', () => {
  let buttonUtils;
  let mockButton;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a fresh instance for each test
    buttonUtils = globalButtonUtils;
    buttonUtils.destroy(); // Reset state
    
    // Mock button element
    mockButton = {
      tagName: 'BUTTON',
      style: {},
      textContent: 'Test Button',
      className: 'test-btn',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      getBoundingClientRect: mockGetBoundingClientRect,
      appendChild: mockAppendChild,
      setAttribute: mockSetAttribute,
      getAttribute: mockGetAttribute,
      click: jest.fn()
    };

    // Setup default mock returns
    mockQuerySelectorAll.mockReturnValue([mockButton]);
    mockQuerySelector.mockReturnValue(null);
    mockGetBoundingClientRect.mockReturnValue({
      width: 100,
      height: 40,
      left: 10,
      top: 20
    });
    mockGetAttribute.mockReturnValue(null);
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(buttonUtils.activeButtons).toBeInstanceOf(Set);
      expect(buttonUtils.hoverStates).toBeInstanceOf(Map);
      expect(buttonUtils.clickHandlers).toBeInstanceOf(Map);
      expect(buttonUtils.initialized).toBe(false);
    });

    test('should initialize only once', () => {
      buttonUtils.initialize();
      expect(buttonUtils.initialized).toBe(true);
      
      const firstCallCount = mockAddEventListener.mock.calls.length;
      
      buttonUtils.initialize();
      expect(mockAddEventListener.mock.calls.length).toBe(firstCallCount);
    });

    test('should setup global event listeners on initialization', () => {
      buttonUtils.initialize();
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      );
      expect(MutationObserver).toHaveBeenCalledWith(expect.any(Function));
      expect(mockObserve).toHaveBeenCalledWith(
        document.body,
        { childList: true, subtree: true }
      );
    });
  });

  describe('scanAndEnhanceButtons', () => {
    test('should scan and enhance buttons', () => {
      const enhanceButtonSpy = jest.spyOn(buttonUtils, 'enhanceButton');
      
      buttonUtils.scanAndEnhanceButtons();
      
      expect(mockQuerySelectorAll).toHaveBeenCalledWith(
        'button, .cta-btn, .btn, [role="button"]'
      );
      expect(enhanceButtonSpy).toHaveBeenCalledWith(mockButton);
      expect(buttonUtils.activeButtons.has(mockButton)).toBe(true);
    });

    test('should not enhance already active buttons', () => {
      const enhanceButtonSpy = jest.spyOn(buttonUtils, 'enhanceButton');
      
      buttonUtils.activeButtons.add(mockButton);
      buttonUtils.scanAndEnhanceButtons();
      
      expect(enhanceButtonSpy).not.toHaveBeenCalled();
    });

    test('should handle multiple buttons', () => {
      const mockButton2 = { ...mockButton, textContent: 'Button 2' };
      mockQuerySelectorAll.mockReturnValue([mockButton, mockButton2]);
      
      const enhanceButtonSpy = jest.spyOn(buttonUtils, 'enhanceButton');
      
      buttonUtils.scanAndEnhanceButtons();
      
      expect(enhanceButtonSpy).toHaveBeenCalledTimes(2);
      expect(buttonUtils.activeButtons.has(mockButton)).toBe(true);
      expect(buttonUtils.activeButtons.has(mockButton2)).toBe(true);
    });
  });

  describe('enhanceButton', () => {
    test('should call all enhancement methods', () => {
      const addRippleEffectSpy = jest.spyOn(buttonUtils, 'addRippleEffect');
      const addHoverEnhancementsSpy = jest.spyOn(buttonUtils, 'addHoverEnhancements');
      const addKeyboardSupportSpy = jest.spyOn(buttonUtils, 'addKeyboardSupport');
      const addTouchSupportSpy = jest.spyOn(buttonUtils, 'addTouchSupport');
      const addAccessibilityEnhancementsSpy = jest.spyOn(buttonUtils, 'addAccessibilityEnhancements');
      
      buttonUtils.enhanceButton(mockButton);
      
      expect(addRippleEffectSpy).toHaveBeenCalledWith(mockButton);
      expect(addHoverEnhancementsSpy).toHaveBeenCalledWith(mockButton);
      expect(addKeyboardSupportSpy).toHaveBeenCalledWith(mockButton);
      expect(addTouchSupportSpy).toHaveBeenCalledWith(mockButton);
      expect(addAccessibilityEnhancementsSpy).toHaveBeenCalledWith(mockButton);
    });
  });

  describe('addRippleEffect', () => {
    test('should add click event listener for ripple effect', () => {
      buttonUtils.addRippleEffect(mockButton);
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });

    test('should create ripple element on click', () => {
      const mockRipple = {
        style: {},
        remove: mockRemove
      };
      document.createElement.mockReturnValue(mockRipple);
      
      buttonUtils.addRippleEffect(mockButton);
      
      // Simulate click event
      const clickHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'click'
      )[1];
      
      const mockEvent = {
        clientX: 50,
        clientY: 30
      };
      
      clickHandler(mockEvent);
      
      expect(document.createElement).toHaveBeenCalledWith('span');
      expect(mockButton.appendChild).toHaveBeenCalledWith(mockRipple);
      expect(mockButton.style.position).toBe('relative');
      expect(mockButton.style.overflow).toBe('hidden');
    });

    test('should add ripple animation styles if not exists', () => {
      const mockStyle = {
        id: '',
        textContent: ''
      };
      document.createElement.mockReturnValue(mockStyle);
      
      buttonUtils.addRippleEffect(mockButton);
      
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(mockStyle.id).toBe('ripple-animation');
      expect(mockStyle.textContent).toContain('@keyframes ripple');
    });

    test('should not add duplicate ripple animation styles', () => {
      mockQuerySelector.mockReturnValue({ id: 'ripple-animation' });
      
      buttonUtils.addRippleEffect(mockButton);
      
      expect(document.createElement).not.toHaveBeenCalledWith('style');
    });
  });

  describe('addHoverEnhancements', () => {
    test('should add mouseenter and mouseleave event listeners', () => {
      buttonUtils.addHoverEnhancements(mockButton);
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function)
      );
    });

    test('should set hover state on mouseenter', () => {
      buttonUtils.addHoverEnhancements(mockButton);
      
      const mouseenterHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mouseenter'
      )[1];
      
      mouseenterHandler();
      
      expect(buttonUtils.hoverStates.get(mockButton)).toBe(true);
      expect(mockButton.style.transition).toBe('all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    });

    test('should handle mouseleave with timeout', (done) => {
      buttonUtils.addHoverEnhancements(mockButton);
      
      const mouseleaveHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mouseleave'
      )[1];
      
      mouseleaveHandler();
      
      setTimeout(() => {
        expect(buttonUtils.hoverStates.get(mockButton)).toBe(false);
        done();
      }, 150);
    });
  });

  describe('addKeyboardSupport', () => {
    test('should add keydown event listener', () => {
      buttonUtils.addKeyboardSupport(mockButton);
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    test('should trigger click on Enter key', () => {
      buttonUtils.addKeyboardSupport(mockButton);
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];
      
      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn()
      };
      
      keydownHandler(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockButton.click).toHaveBeenCalled();
    });

    test('should trigger click on Space key', () => {
      buttonUtils.addKeyboardSupport(mockButton);
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];
      
      const mockEvent = {
        key: ' ',
        preventDefault: jest.fn()
      };
      
      keydownHandler(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockButton.click).toHaveBeenCalled();
    });

    test('should not trigger click on other keys', () => {
      buttonUtils.addKeyboardSupport(mockButton);
      
      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )[1];
      
      const mockEvent = {
        key: 'Tab',
        preventDefault: jest.fn()
      };
      
      keydownHandler(mockEvent);
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockButton.click).not.toHaveBeenCalled();
    });
  });

  describe('addTouchSupport', () => {
    test('should add touchstart and touchend event listeners', () => {
      buttonUtils.addTouchSupport(mockButton);
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: true }
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
        { passive: false }
      );
    });

    test('should scale button on touchstart', () => {
      buttonUtils.addTouchSupport(mockButton);
      
      const touchstartHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )[1];
      
      touchstartHandler({});
      
      expect(mockButton.style.transform).toBe('scale(0.98)');
    });

    test('should reset transform on touchend', (done) => {
      buttonUtils.addTouchSupport(mockButton);
      
      const touchendHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )[1];
      
      const mockEvent = {
        preventDefault: jest.fn()
      };
      
      touchendHandler(mockEvent);
      
      setTimeout(() => {
        expect(mockButton.style.transform).toBe('');
        done();
      }, 150);
    });

    test('should prevent ghost clicks for short touches', () => {
      buttonUtils.addTouchSupport(mockButton);
      
      const touchstartHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )[1];
      const touchendHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )[1];
      
      const mockEvent = {
        preventDefault: jest.fn()
      };
      
      touchstartHandler({});
      touchendHandler(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('addAccessibilityEnhancements', () => {
    test('should add role attribute for non-button elements', () => {
      mockButton.tagName = 'DIV';
      
      buttonUtils.addAccessibilityEnhancements(mockButton);
      
      expect(mockSetAttribute).toHaveBeenCalledWith('role', 'button');
    });

    test('should not add role attribute for button elements', () => {
      mockButton.tagName = 'BUTTON';
      
      buttonUtils.addAccessibilityEnhancements(mockButton);
      
      expect(mockSetAttribute).not.toHaveBeenCalledWith('role', 'button');
    });

    test('should add tabindex if not present', () => {
      buttonUtils.addAccessibilityEnhancements(mockButton);
      
      expect(mockSetAttribute).toHaveBeenCalledWith('tabindex', '0');
    });

    test('should not add tabindex if already present', () => {
      mockGetAttribute.mockReturnValue('1');
      
      buttonUtils.addAccessibilityEnhancements(mockButton);
      
      expect(mockSetAttribute).not.toHaveBeenCalledWith('tabindex', '0');
    });

    test('should add focus and blur event listeners', () => {
      buttonUtils.addAccessibilityEnhancements(mockButton);
      
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );
    });

    test('should set focus outline on focus', () => {
      buttonUtils.addAccessibilityEnhancements(mockButton);
      
      const focusHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'focus'
      )[1];
      
      focusHandler();
      
      expect(mockButton.style.outline).toBe('2px solid rgba(252, 61, 33, 0.5)');
      expect(mockButton.style.outlineOffset).toBe('2px');
    });

    test('should remove focus outline on blur', () => {
      buttonUtils.addAccessibilityEnhancements(mockButton);
      
      const blurHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'blur'
      )[1];
      
      blurHandler();
      
      expect(mockButton.style.outline).toBe('');
      expect(mockButton.style.outlineOffset).toBe('');
    });
  });

  describe('getButtonState', () => {
    test('should return correct button state', () => {
      buttonUtils.activeButtons.add(mockButton);
      buttonUtils.hoverStates.set(mockButton, true);
      buttonUtils.clickHandlers.set(mockButton, jest.fn());
      
      const state = buttonUtils.getButtonState(mockButton);
      
      expect(state).toEqual({
        isHovered: true,
        isActive: true,
        hasClickHandler: true
      });
    });

    test('should return default state for unknown button', () => {
      const state = buttonUtils.getButtonState(mockButton);
      
      expect(state).toEqual({
        isHovered: false,
        isActive: false,
        hasClickHandler: false
      });
    });
  });

  describe('registerClickHandler', () => {
    test('should register click handler for buttons matching selector', () => {
      const mockHandler = jest.fn();
      const selector = '.test-btn';
      
      buttonUtils.registerClickHandler(selector, mockHandler);
      
      expect(mockQuerySelectorAll).toHaveBeenCalledWith(selector);
      expect(buttonUtils.clickHandlers.get(mockButton)).toBe(mockHandler);
      expect(mockAddEventListener).toHaveBeenCalledWith('click', mockHandler);
    });

    test('should handle multiple buttons with same selector', () => {
      const mockButton2 = { ...mockButton, textContent: 'Button 2' };
      mockQuerySelectorAll.mockReturnValue([mockButton, mockButton2]);
      
      const mockHandler = jest.fn();
      const selector = '.test-btn';
      
      buttonUtils.registerClickHandler(selector, mockHandler);
      
      expect(buttonUtils.clickHandlers.get(mockButton)).toBe(mockHandler);
      expect(buttonUtils.clickHandlers.get(mockButton2)).toBe(mockHandler);
    });
  });

  describe('debugButtonStates', () => {
    test('should log button states to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      buttonUtils.activeButtons.add(mockButton);
      buttonUtils.hoverStates.set(mockButton, true);
      
      buttonUtils.debugButtonStates();
      
      expect(consoleSpy).toHaveBeenCalledWith('Active buttons:', 1);
      expect(consoleSpy).toHaveBeenCalledWith('Button 1:', {
        element: mockButton,
        text: 'Test Button',
        classes: 'test-btn',
        state: {
          isHovered: true,
          isActive: true,
          hasClickHandler: false
        }
      });
      
      consoleSpy.mockRestore();
    });

    test('should handle buttons with no text content', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockButton.textContent = null;
      
      buttonUtils.activeButtons.add(mockButton);
      
      buttonUtils.debugButtonStates();
      
      expect(consoleSpy).toHaveBeenCalledWith('Button 1:', {
        element: mockButton,
        text: undefined,
        classes: 'test-btn',
        state: {
          isHovered: false,
          isActive: true,
          hasClickHandler: false
        }
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    test('should clear all collections and reset state', () => {
      buttonUtils.activeButtons.add(mockButton);
      buttonUtils.hoverStates.set(mockButton, true);
      buttonUtils.clickHandlers.set(mockButton, jest.fn());
      buttonUtils.initialized = true;
      
      buttonUtils.destroy();
      
      expect(buttonUtils.activeButtons.size).toBe(0);
      expect(buttonUtils.hoverStates.size).toBe(0);
      expect(buttonUtils.clickHandlers.size).toBe(0);
      expect(buttonUtils.initialized).toBe(false);
    });
  });

  describe('Global Window Integration', () => {
    test('should expose buttonController on window', () => {
      expect(window.buttonController).toBe(globalButtonUtils);
    });

    test('should expose uiUtilities on window', () => {
      expect(window.uiUtilities).toHaveProperty('enhanceButton');
      expect(window.uiUtilities).toHaveProperty('getButtonState');
      expect(window.uiUtilities).toHaveProperty('debugButtons');
    });

    test('should bind methods correctly in uiUtilities', () => {
      const mockButton = { test: true };
      const enhanceButtonSpy = jest.spyOn(globalButtonUtils, 'enhanceButton');
      const getButtonStateSpy = jest.spyOn(globalButtonUtils, 'getButtonState');
      const debugButtonStatesSpy = jest.spyOn(globalButtonUtils, 'debugButtonStates');
      
      window.uiUtilities.enhanceButton(mockButton);
      window.uiUtilities.getButtonState(mockButton);
      window.uiUtilities.debugButtons();
      
      expect(enhanceButtonSpy).toHaveBeenCalledWith(mockButton);
      expect(getButtonStateSpy).toHaveBeenCalledWith(mockButton);
      expect(debugButtonStatesSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null button gracefully', () => {
      expect(() => {
        buttonUtils.enhanceButton(null);
      }).toThrow();
    });

    test('should handle button without getBoundingClientRect', () => {
      const incompleteButton = {
        addEventListener: mockAddEventListener,
        style: {}
      };
      
      expect(() => {
        buttonUtils.addRippleEffect(incompleteButton);
      }).not.toThrow();
    });

    test('should handle missing document methods gracefully', () => {
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = null;
      
      expect(() => {
        buttonUtils.scanAndEnhanceButtons();
      }).toThrow();
      
      document.querySelectorAll = originalQuerySelectorAll;
    });

    test('should handle buttons without style property', () => {
      const buttonWithoutStyle = {
        addEventListener: mockAddEventListener,
        getBoundingClientRect: mockGetBoundingClientRect,
        appendChild: mockAppendChild,
        setAttribute: mockSetAttribute,
        getAttribute: mockGetAttribute,
        tagName: 'BUTTON'
      };
      
      expect(() => {
        buttonUtils.enhanceButton(buttonWithoutStyle);
      }).not.toThrow();
    });
  });
});