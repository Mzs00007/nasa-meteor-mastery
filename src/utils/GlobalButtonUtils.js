/**
 * Global Button Utilities
 * Provides window-accessible button functionality for enhanced user experience
 */

class GlobalButtonUtils {
  constructor() {
    this.activeButtons = new Set();
    this.hoverStates = new Map();
    this.clickHandlers = new Map();
    this.initialized = false;
  }

  // Initialize global button utilities
  initialize() {
    if (this.initialized) {
      return;
    }

    this.setupGlobalEventListeners();
    this.initialized = true;

    // Global Button Utils initialized silently
  }

  // Setup global event listeners for all buttons
  setupGlobalEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      this.scanAndEnhanceButtons();
    });

    // Re-scan when new content is added
    const observer = new MutationObserver(() => {
      this.scanAndEnhanceButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Scan and enhance all buttons on the page
  scanAndEnhanceButtons() {
    const buttons = document.querySelectorAll(
      'button, .cta-btn, .btn, [role="button"]'
    );

    buttons.forEach(button => {
      if (!this.activeButtons.has(button)) {
        this.enhanceButton(button);
        this.activeButtons.add(button);
      }
    });
  }

  // Enhance individual button with improved interactions
  enhanceButton(button) {
    // Add ripple effect
    this.addRippleEffect(button);

    // Add enhanced hover states
    this.addHoverEnhancements(button);

    // Add keyboard support
    this.addKeyboardSupport(button);

    // Add touch support
    this.addTouchSupport(button);

    // Add accessibility improvements
    this.addAccessibilityEnhancements(button);
  }

  // Add ripple effect to buttons
  addRippleEffect(button) {
    button.addEventListener('click', e => {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1;
      `;

      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });

    // Add ripple animation if not exists
    if (!document.querySelector('#ripple-animation')) {
      const style = document.createElement('style');
      style.id = 'ripple-animation';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Add enhanced hover states
  addHoverEnhancements(button) {
    let hoverTimeout;

    button.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      this.hoverStates.set(button, true);
      button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    button.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        this.hoverStates.set(button, false);
      }, 100);
    });
  }

  // Add keyboard support
  addKeyboardSupport(button) {
    button.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  }

  // Add touch support
  addTouchSupport(button) {
    let touchStartTime;

    button.addEventListener(
      'touchstart',
      e => {
        touchStartTime = Date.now();
        button.style.transform = 'scale(0.98)';
      },
      { passive: true }
    );

    button.addEventListener(
      'touchend',
      e => {
        const touchDuration = Date.now() - touchStartTime;

        setTimeout(() => {
          button.style.transform = '';
        }, 100);

        // Prevent ghost clicks
        if (touchDuration < 500) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  // Add accessibility enhancements
  addAccessibilityEnhancements(button) {
    // Ensure proper ARIA attributes
    if (!button.getAttribute('role') && button.tagName !== 'BUTTON') {
      button.setAttribute('role', 'button');
    }

    if (!button.getAttribute('tabindex')) {
      button.setAttribute('tabindex', '0');
    }

    // Add focus indicators
    button.addEventListener('focus', () => {
      button.style.outline = '2px solid rgba(252, 61, 33, 0.5)';
      button.style.outlineOffset = '2px';
    });

    button.addEventListener('blur', () => {
      button.style.outline = '';
      button.style.outlineOffset = '';
    });
  }

  // Get button state
  getButtonState(button) {
    return {
      isHovered: this.hoverStates.get(button) || false,
      isActive: this.activeButtons.has(button),
      hasClickHandler: this.clickHandlers.has(button),
    };
  }

  // Register click handler
  registerClickHandler(selector, handler) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
      this.clickHandlers.set(button, handler);
      button.addEventListener('click', handler);
    });
  }

  // Debug button states
  debugButtonStates() {
    const buttons = Array.from(this.activeButtons);
    console.log('Active buttons:', buttons.length);

    buttons.forEach((button, index) => {
      const state = this.getButtonState(button);
      console.log(`Button ${index + 1}:`, {
        element: button,
        text: button.textContent?.trim(),
        classes: button.className,
        state,
      });
    });
  }

  // Cleanup
  destroy() {
    this.activeButtons.clear();
    this.hoverStates.clear();
    this.clickHandlers.clear();
    this.initialized = false;
  }
}

// Create global instance
const globalButtonUtils = new GlobalButtonUtils();

// Make it available globally
if (typeof window !== 'undefined') {
  window.buttonController = globalButtonUtils;
  window.uiUtilities = {
    enhanceButton: globalButtonUtils.enhanceButton.bind(globalButtonUtils),
    getButtonState: globalButtonUtils.getButtonState.bind(globalButtonUtils),
    debugButtons: globalButtonUtils.debugButtonStates.bind(globalButtonUtils),
  };
}

export default globalButtonUtils;
