import { animate as anime, stagger, createTimeline, remove } from 'animejs';

/**
 * Animation utility module using Anime.js
 * Provides common animations for the Meteor Mastery application
 */

// Default animation configurations
const DEFAULT_DURATION = 800;
const DEFAULT_EASING = 'easeOutExpo';

/**
 * Fade in animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const fadeIn = (target, options = {}) => {
  return anime({
    targets: target,
    opacity: [0, 1],
    duration: options.duration || DEFAULT_DURATION,
    easing: options.easing || DEFAULT_EASING,
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Fade out animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const fadeOut = (target, options = {}) => {
  return anime({
    targets: target,
    opacity: [1, 0],
    duration: options.duration || DEFAULT_DURATION,
    easing: options.easing || DEFAULT_EASING,
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Slide in from left animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const slideInLeft = (target, options = {}) => {
  return anime({
    targets: target,
    translateX: [-100, 0],
    opacity: [0, 1],
    duration: options.duration || DEFAULT_DURATION,
    easing: options.easing || DEFAULT_EASING,
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Slide in from right animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const slideInRight = (target, options = {}) => {
  return anime({
    targets: target,
    translateX: [100, 0],
    opacity: [0, 1],
    duration: options.duration || DEFAULT_DURATION,
    easing: options.easing || DEFAULT_EASING,
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Slide in from top animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const slideInTop = (target, options = {}) => {
  return anime({
    targets: target,
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: options.duration || DEFAULT_DURATION,
    easing: options.easing || DEFAULT_EASING,
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Scale in animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const scaleIn = (target, options = {}) => {
  return anime({
    targets: target,
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: options.duration || DEFAULT_DURATION,
    easing: options.easing || DEFAULT_EASING,
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Bounce in animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const bounceIn = (target, options = {}) => {
  return anime({
    targets: target,
    scale: [0, 1],
    opacity: [0, 1],
    duration: options.duration || 1000,
    easing: 'easeOutBounce',
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Pulse animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const pulse = (target, options = {}) => {
  return anime({
    targets: target,
    scale: [1, 1.05, 1],
    duration: options.duration || 600,
    easing: 'easeInOutSine',
    loop: options.loop || false,
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Shake animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const shake = (target, options = {}) => {
  return anime({
    targets: target,
    translateX: [
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: 0, duration: 100 }
    ],
    duration: options.duration || 500,
    easing: 'easeInOutSine',
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Loading spinner animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const loadingSpinner = (target, options = {}) => {
  return anime({
    targets: target,
    rotate: '1turn',
    duration: options.duration || 1000,
    easing: 'linear',
    loop: true,
    delay: options.delay || 0,
    ...options
  });
};

/**
 * Stagger animation for multiple elements
 * @param {string|NodeList} targets - CSS selector or NodeList
 * @param {Object} options - Animation options
 */
export const staggerFadeIn = (targets, options = {}) => {
  return anime({
    targets: targets,
    opacity: [0, 1],
    translateY: [20, 0],
    duration: options.duration || DEFAULT_DURATION,
    easing: options.easing || DEFAULT_EASING,
    delay: stagger(options.staggerDelay || 100),
    complete: options.complete || null,
    ...options
  });
};

/**
 * Progress bar animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {number} progress - Progress percentage (0-100)
 * @param {Object} options - Animation options
 */
export const progressBar = (target, progress, options = {}) => {
  return anime({
    targets: target,
    width: `${progress}%`,
    duration: options.duration || 1000,
    easing: options.easing || 'easeOutExpo',
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Typewriter effect animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {string} text - Text to type
 * @param {Object} options - Animation options
 */
export const typewriter = (target, text, options = {}) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;

  element.textContent = '';
  const chars = text.split('');
  
  return anime({
    targets: { progress: 0 },
    progress: chars.length,
    duration: options.duration || (chars.length * 50),
    easing: 'linear',
    update: function(anim) {
      const progress = Math.floor(anim.animatables[0].target.progress);
      element.textContent = chars.slice(0, progress).join('');
    },
    complete: options.complete || null,
    ...options
  });
};

/**
 * Meteor trail animation (specific to the app theme)
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const meteorTrail = (target, options = {}) => {
  return anime({
    targets: target,
    translateX: ['-100vw', '100vw'],
    translateY: ['0vh', '50vh'],
    opacity: [0, 1, 0],
    scale: [0.5, 1, 0.5],
    duration: options.duration || 2000,
    easing: 'easeInOutQuad',
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Impact ripple animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const impactRipple = (target, options = {}) => {
  return anime({
    targets: target,
    scale: [0, 3],
    opacity: [1, 0],
    duration: options.duration || 1500,
    easing: 'easeOutExpo',
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Map marker bounce animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} options - Animation options
 */
export const mapMarkerBounce = (target, options = {}) => {
  return anime({
    targets: target,
    translateY: [0, -20, 0],
    scale: [1, 1.1, 1],
    duration: options.duration || 800,
    easing: 'easeOutBounce',
    delay: options.delay || 0,
    complete: options.complete || null,
    ...options
  });
};

/**
 * Count up animation
 * @param {string|Element} target - CSS selector or DOM element
 * @param {number} from - Starting number
 * @param {number} to - Ending number
 * @param {Object} options - Animation options
 */
export const countUp = (target, from = 0, to = 100, options = {}) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return null;

  const obj = { value: from };
  
  return anime({
    targets: obj,
    value: to,
    duration: options.duration || 1000,
    easing: options.easing || DEFAULT_EASING,
    delay: options.delay || 0,
    update: () => {
      element.textContent = Math.round(obj.value) + (options.suffix || '');
    },
    complete: options.complete || null,
    ...options
  });
};



/**
 * Create a timeline for complex animations
 * @param {Array} animations - Array of animation configurations
 */
export const createTimelineUtil = (animations = []) => {
  const tl = createTimeline({
    autoplay: false
  });

  animations.forEach(animation => {
    tl.add(animation);
  });

  return tl;
};

/**
 * Stop all animations on target
 * @param {string|Element} target - CSS selector or DOM element
 */
export const stopAnimations = (target) => {
  remove(target);
};

// Export anime instance for advanced usage
export { anime };

// Export default configurations
export const animationConfig = {
  DEFAULT_DURATION,
  DEFAULT_EASING,
  easings: {
    elastic: 'easeOutElastic(1, .8)',
    bounce: 'easeOutBounce',
    smooth: 'easeOutExpo',
    quick: 'easeOutQuart'
  }
};