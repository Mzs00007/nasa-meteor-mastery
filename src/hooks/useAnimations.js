import { useRef, useEffect, useCallback } from 'react';
import * as animations from '../utils/animations';

/**
 * Custom hook for managing animations in React components
 * Provides easy access to animation utilities with React lifecycle integration
 */
export const useAnimations = () => {
  const animationRefs = useRef(new Map());

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      animationRefs.current.forEach(animation => {
        if (animation && typeof animation.pause === 'function') {
          animation.pause();
        }
      });
      animationRefs.current.clear();
    };
  }, []);

  /**
   * Store animation reference for cleanup
   * @param {string} key - Unique key for the animation
   * @param {Object} animation - Anime.js animation instance
   */
  const storeAnimation = useCallback((key, animation) => {
    // Pause previous animation with same key if exists
    const existingAnimation = animationRefs.current.get(key);
    if (existingAnimation && typeof existingAnimation.pause === 'function') {
      existingAnimation.pause();
    }
    
    animationRefs.current.set(key, animation);
    return animation;
  }, []);

  /**
   * Animate element entrance
   * @param {Element} element - DOM element to animate
   * @param {string} type - Animation type ('fade', 'slide', 'scale', 'bounce')
   * @param {Object} options - Animation options
   */
  const animateEntrance = useCallback((element, type = 'fade', options = {}) => {
    if (!element) return null;

    const key = `entrance-${element.id || Math.random()}`;
    let animation;

    switch (type) {
      case 'slide':
        animation = animations.slideInTop(element, options);
        break;
      case 'scale':
        animation = animations.scaleIn(element, options);
        break;
      case 'bounce':
        animation = animations.bounceIn(element, options);
        break;
      case 'fade':
      default:
        animation = animations.fadeIn(element, options);
        break;
    }

    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate element exit
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateExit = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `exit-${element.id || Math.random()}`;
    const animation = animations.fadeOut(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate loading state
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateLoading = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `loading-${element.id || Math.random()}`;
    const animation = animations.loadingSpinner(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate pulse effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animatePulse = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `pulse-${element.id || Math.random()}`;
    const animation = animations.pulse(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate shake effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateShake = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `shake-${element.id || Math.random()}`;
    const animation = animations.shake(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate meteor trail effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateMeteorTrail = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `meteor-${element.id || Math.random()}`;
    const animation = animations.meteorTrail(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate impact ripple effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateImpactRipple = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `impact-${element.id || Math.random()}`;
    const animation = animations.impactRipple(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate map marker bounce
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateMapMarker = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `marker-${element.id || Math.random()}`;
    const animation = animations.mapMarkerBounce(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate progress bar
   * @param {Element} element - DOM element to animate
   * @param {number} progress - Progress percentage (0-100)
   * @param {Object} options - Animation options
   */
  const animateProgress = useCallback((element, progress, options = {}) => {
    if (!element) return null;

    const key = `progress-${element.id || Math.random()}`;
    const animation = animations.progressBar(element, progress, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate staggered elements
   * @param {NodeList|Array} elements - Elements to animate
   * @param {Object} options - Animation options
   */
  const animateStagger = useCallback((elements, options = {}) => {
    if (!elements || elements.length === 0) return null;

    const key = `stagger-${Math.random()}`;
    const animation = animations.staggerFadeIn(elements, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate fade in effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateFadeIn = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `fadeIn-${element.id || Math.random()}`;
    const animation = animations.fadeIn(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate scale in effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateScaleIn = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `scaleIn-${element.id || Math.random()}`;
    const animation = animations.scaleIn(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate bounce in effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateBounceIn = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `bounceIn-${element.id || Math.random()}`;
    const animation = animations.bounceIn(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate progress bar
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateProgressBar = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `progressBar-${element.id || Math.random()}`;
    const animation = animations.progressBar(element, options.progress || 100, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate count up effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateCountUp = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `countUp-${element.id || Math.random()}`;
    const animation = animations.countUp(element, options.from || 0, options.to || 100, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate stagger fade in effect
   * @param {NodeList|Array} elements - Elements to animate
   * @param {Object} options - Animation options
   */
  const animateStaggerFadeIn = useCallback((elements, options = {}) => {
    if (!elements || elements.length === 0) return null;

    const key = `staggerFadeIn-${Math.random()}`;
    const animation = animations.staggerFadeIn(elements, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Animate typewriter effect
   * @param {Element} element - DOM element to animate
   * @param {Object} options - Animation options
   */
  const animateTypewriter = useCallback((element, options = {}) => {
    if (!element) return null;

    const key = `typewriter-${element.id || Math.random()}`;
    const animation = animations.typewriter(element, options);
    
    return storeAnimation(key, animation);
  }, [storeAnimation]);

  /**
   * Stop specific animation
   * @param {string} key - Animation key
   */
  const stopAnimation = useCallback((key) => {
    const animation = animationRefs.current.get(key);
    if (animation && typeof animation.pause === 'function') {
      animation.pause();
      animationRefs.current.delete(key);
    }
  }, []);

  /**
   * Stop all animations
   */
  const stopAllAnimations = useCallback(() => {
    animationRefs.current.forEach(animation => {
      if (animation && typeof animation.pause === 'function') {
        animation.pause();
      }
    });
    animationRefs.current.clear();
  }, []);

  return {
    // Animation functions
    animateEntrance,
    animateExit,
    animateLoading,
    animatePulse,
    animateShake,
    animateMeteorTrail,
    animateImpactRipple,
    animateMapMarker,
    animateProgress,
    animateStagger,
    animateFadeIn,
    animateScaleIn,
    animateBounceIn,
    animateProgressBar,
    animateCountUp,
    animateStaggerFadeIn,
    animateTypewriter,
    
    // Control functions
    stopAnimation,
    stopAllAnimations,
    
    // Direct access to animation utilities
    animations
  };
};

/**
 * Hook for entrance animations on component mount
 * @param {Object} options - Animation options
 */
export const useEntranceAnimation = (options = {}) => {
  const elementRef = useRef(null);
  const { animateEntrance } = useAnimations();

  useEffect(() => {
    if (elementRef.current) {
      animateEntrance(elementRef.current, options.type || 'fade', {
        delay: options.delay || 0,
        duration: options.duration || 800,
        ...options
      });
    }
  }, [animateEntrance, options]);

  return elementRef;
};

/**
 * Hook for loading animations
 * @param {boolean} isLoading - Loading state
 * @param {Object} options - Animation options
 */
export const useLoadingAnimation = (isLoading, options = {}) => {
  const elementRef = useRef(null);
  const { animateLoading, stopAnimation } = useAnimations();
  const animationKeyRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      if (isLoading) {
        const animation = animateLoading(elementRef.current, options);
        animationKeyRef.current = `loading-${elementRef.current.id || Math.random()}`;
      } else if (animationKeyRef.current) {
        stopAnimation(animationKeyRef.current);
        animationKeyRef.current = null;
      }
    }
  }, [isLoading, animateLoading, stopAnimation, options]);

  return elementRef;
};

export default useAnimations;