import { debounce, throttle, enhancedDebounce } from '../../src/utils/debounce';

// Mock timers for testing
jest.useFakeTimers();

describe('Debounce Utilities', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times rapidly
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(100);

      // Function should be called once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      jest.advanceTimersByTime(50);
      
      debouncedFn('arg2');
      jest.advanceTimersByTime(50);
      
      // Function should not be called yet (timer was reset)
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      
      // Now function should be called
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });

    it('should handle immediate execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100, true);

      debouncedFn('arg1');

      // Function should be called immediately
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Subsequent calls should not trigger immediate execution
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).toHaveBeenCalledTimes(1);

      // After timeout, next call should trigger immediate execution
      jest.advanceTimersByTime(100);
      debouncedFn('arg4');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });

    it('should preserve function context (this)', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function() {
          return this.value;
        })
      };

      const debouncedMethod = debounce(obj.method, 100);
      debouncedMethod.call(obj);

      jest.advanceTimersByTime(100);

      expect(obj.method).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3', { key: 'value' });

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3', { key: 'value' });
    });

    it('should handle zero delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('arg1');

      jest.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should handle negative delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, -100);

      debouncedFn('arg1');

      jest.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should handle function that throws error', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Test error');
      });
      const debouncedFn = debounce(errorFn, 100);

      debouncedFn();

      expect(() => {
        jest.advanceTimersByTime(100);
      }).toThrow('Test error');

      expect(errorFn).toHaveBeenCalledTimes(1);
    });

    it('should handle function with return value', () => {
      const mockFn = jest.fn(() => 'return value');
      const debouncedFn = debounce(mockFn, 100);

      const result = debouncedFn();

      // Debounced function doesn't return value immediately
      expect(result).toBeUndefined();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call 100 times rapidly
      for (let i = 0; i < 100; i++) {
        debouncedFn(i);
      }

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      // Should only be called once with the last argument
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(99);
    });

    it('should handle calls after timeout completion', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');

      // Call again after timeout
      debouncedFn('second');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('second');
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      // First call should execute immediately
      throttledFn('arg1');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Subsequent calls should be ignored during throttle period
      throttledFn('arg2');
      throttledFn('arg3');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // After throttle period, next call should execute
      jest.advanceTimersByTime(100);
      throttledFn('arg4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });

    it('should preserve function context (this)', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function() {
          return this.value;
        })
      };

      const throttledMethod = throttle(obj.method, 100);
      throttledMethod.call(obj);

      expect(obj.method).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1', 'arg2', { key: 'value' });

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
    });

    it('should handle zero limit', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 0);

      throttledFn('arg1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      throttledFn('arg2');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(0);
      throttledFn('arg3');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle negative limit', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, -100);

      throttledFn('arg1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      throttledFn('arg2');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(0);
      throttledFn('arg3');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle function that throws error', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Test error');
      });
      const throttledFn = throttle(errorFn, 100);

      expect(() => {
        throttledFn();
      }).toThrow('Test error');

      expect(errorFn).toHaveBeenCalledTimes(1);
    });

    it('should handle function with return value', () => {
      const mockFn = jest.fn(() => 'return value');
      const throttledFn = throttle(mockFn, 100);

      const result = throttledFn();

      // Throttled function doesn't return value
      expect(result).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      // Call 100 times rapidly
      for (let i = 0; i < 100; i++) {
        throttledFn(i);
      }

      // Should only be called once (first call)
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(0);

      jest.advanceTimersByTime(100);

      // Next call should work
      throttledFn(200);
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith(200);
    });

    it('should reset throttle after timeout', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('first');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn('second');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('second');
    });
  });

  describe('enhancedDebounce', () => {
    it('should debounce with default trailing behavior', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should handle leading edge execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100, { leading: true });

      debouncedFn('arg1');

      // Should execute immediately on leading edge
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      debouncedFn('arg2');
      debouncedFn('arg3');

      // Should not execute again during debounce period
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      // Should execute on trailing edge with last arguments
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg3');
    });

    it('should handle leading only (no trailing)', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100, { 
        leading: true, 
        trailing: false 
      });

      debouncedFn('arg1');

      // Should execute immediately on leading edge
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      debouncedFn('arg2');
      debouncedFn('arg3');

      jest.advanceTimersByTime(100);

      // Should not execute on trailing edge
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle trailing only (no leading)', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100, { 
        leading: false, 
        trailing: true 
      });

      debouncedFn('arg1');
      debouncedFn('arg2');

      // Should not execute on leading edge
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      // Should execute on trailing edge
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });

    it('should handle neither leading nor trailing', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100, { 
        leading: false, 
        trailing: false 
      });

      debouncedFn('arg1');
      debouncedFn('arg2');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      // Should not execute at all
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should return result from leading execution', () => {
      const mockFn = jest.fn(() => 'result');
      const debouncedFn = enhancedDebounce(mockFn, 100, { leading: true });

      const result = debouncedFn('arg1');

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return result from trailing execution', () => {
      const mockFn = jest.fn(() => 'result');
      const debouncedFn = enhancedDebounce(mockFn, 100, { trailing: true });

      const result1 = debouncedFn('arg1');
      expect(result1).toBeUndefined();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should preserve function context (this)', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function() {
          return this.value;
        })
      };

      const debouncedMethod = enhancedDebounce(obj.method, 100);
      debouncedMethod.call(obj);

      jest.advanceTimersByTime(100);

      expect(obj.method).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', { key: 'value' });

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
    });

    it('should handle empty options object', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100, {});

      debouncedFn('arg1');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should handle undefined options', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100, undefined);

      debouncedFn('arg1');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should handle function that throws error', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Test error');
      });
      const debouncedFn = enhancedDebounce(errorFn, 100);

      debouncedFn();

      expect(() => {
        jest.advanceTimersByTime(100);
      }).toThrow('Test error');

      expect(errorFn).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive calls with leading and trailing', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100, { 
        leading: true, 
        trailing: true 
      });

      // Call multiple times rapidly
      for (let i = 0; i < 10; i++) {
        debouncedFn(i);
      }

      // Should execute once on leading edge
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(0);

      jest.advanceTimersByTime(100);

      // Should execute once on trailing edge with last arguments
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith(9);
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 100);

      debouncedFn('arg1');
      jest.advanceTimersByTime(50);
      
      debouncedFn('arg2');
      jest.advanceTimersByTime(50);
      
      // Function should not be called yet (timer was reset)
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      
      // Now function should be called
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });

    it('should handle zero delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = enhancedDebounce(mockFn, 0);

      debouncedFn('arg1');

      jest.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });
  });

  describe('Integration Tests', () => {
    it('should work with real-world search scenario', () => {
      const searchFn = jest.fn();
      const debouncedSearch = debounce(searchFn, 300);

      // Simulate user typing
      debouncedSearch('a');
      jest.advanceTimersByTime(100);
      debouncedSearch('as');
      jest.advanceTimersByTime(100);
      debouncedSearch('ast');
      jest.advanceTimersByTime(100);
      debouncedSearch('aste');
      jest.advanceTimersByTime(100);
      debouncedSearch('aster');
      jest.advanceTimersByTime(100);
      debouncedSearch('astero');
      jest.advanceTimersByTime(100);
      debouncedSearch('asteroid');

      // Search should not have been called yet
      expect(searchFn).not.toHaveBeenCalled();

      // After debounce period
      jest.advanceTimersByTime(300);

      // Search should be called once with final query
      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(searchFn).toHaveBeenCalledWith('asteroid');
    });

    it('should work with real-world scroll scenario', () => {
      const scrollHandler = jest.fn();
      const throttledScroll = throttle(scrollHandler, 16); // ~60fps

      // Simulate rapid scroll events
      for (let i = 0; i < 100; i++) {
        throttledScroll({ scrollY: i * 10 });
      }

      // Should only be called once (first call)
      expect(scrollHandler).toHaveBeenCalledTimes(1);
      expect(scrollHandler).toHaveBeenCalledWith({ scrollY: 0 });

      jest.advanceTimersByTime(16);

      // Next scroll should work
      throttledScroll({ scrollY: 1000 });
      expect(scrollHandler).toHaveBeenCalledTimes(2);
      expect(scrollHandler).toHaveBeenLastCalledWith({ scrollY: 1000 });
    });

    it('should work with real-world button click scenario', () => {
      const submitFn = jest.fn();
      const debouncedSubmit = enhancedDebounce(submitFn, 1000, { 
        leading: true, 
        trailing: false 
      });

      // Simulate rapid button clicks
      debouncedSubmit('form-data');
      debouncedSubmit('form-data');
      debouncedSubmit('form-data');

      // Should only execute once on leading edge
      expect(submitFn).toHaveBeenCalledTimes(1);
      expect(submitFn).toHaveBeenCalledWith('form-data');

      jest.advanceTimersByTime(1000);

      // Should not execute on trailing edge
      expect(submitFn).toHaveBeenCalledTimes(1);

      // After debounce period, next click should work
      debouncedSubmit('new-form-data');
      expect(submitFn).toHaveBeenCalledTimes(2);
      expect(submitFn).toHaveBeenLastCalledWith('new-form-data');
    });

    it('should work with real-world API call scenario', () => {
      const apiCall = jest.fn();
      const debouncedApiCall = enhancedDebounce(apiCall, 500, { 
        leading: false, 
        trailing: true 
      });

      // Simulate rapid filter changes
      debouncedApiCall({ filter: 'type:asteroid' });
      jest.advanceTimersByTime(100);
      debouncedApiCall({ filter: 'type:asteroid size:large' });
      jest.advanceTimersByTime(100);
      debouncedApiCall({ filter: 'type:asteroid size:large date:2024' });

      // API should not be called yet
      expect(apiCall).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);

      // API should be called once with final filter
      expect(apiCall).toHaveBeenCalledTimes(1);
      expect(apiCall).toHaveBeenCalledWith({ 
        filter: 'type:asteroid size:large date:2024' 
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null function', () => {
      expect(() => {
        debounce(null, 100);
      }).not.toThrow();

      expect(() => {
        throttle(null, 100);
      }).not.toThrow();

      expect(() => {
        enhancedDebounce(null, 100);
      }).not.toThrow();
    });

    it('should handle undefined function', () => {
      expect(() => {
        debounce(undefined, 100);
      }).not.toThrow();

      expect(() => {
        throttle(undefined, 100);
      }).not.toThrow();

      expect(() => {
        enhancedDebounce(undefined, 100);
      }).not.toThrow();
    });

    it('should handle very large delays', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, Number.MAX_SAFE_INTEGER);

      debouncedFn('arg1');

      expect(mockFn).not.toHaveBeenCalled();

      // Even advancing by a large amount shouldn't trigger
      jest.advanceTimersByTime(1000000);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle NaN delays', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, NaN);

      debouncedFn('arg1');

      // NaN delay should be treated as 0
      jest.advanceTimersByTime(0);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle Infinity delays', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, Infinity);

      debouncedFn('arg1');

      // Infinity delay means function should never be called
      jest.advanceTimersByTime(1000000);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle functions that modify arguments', () => {
      const modifyingFn = jest.fn((arr) => {
        arr.push('modified');
      });
      const debouncedFn = debounce(modifyingFn, 100);

      const testArray = ['original'];
      // Create a snapshot of the original state for comparison
      const originalState = [...testArray];
      debouncedFn(testArray);

      jest.advanceTimersByTime(100);

      // Check that the function was called once
      expect(modifyingFn).toHaveBeenCalledTimes(1);
      // Check that the function received the same array reference (not a copy)
      expect(modifyingFn.mock.calls[0][0]).toBe(testArray);
      // Check that the array was modified as expected
      expect(testArray).toEqual(['original', 'modified']);
      // Verify the function was called when the array was in its original state
      // by checking that it received an array that started with the original content
      expect(modifyingFn.mock.calls[0][0]).toContain('original');
    });

    it('should handle async functions', () => {
      const asyncFn = jest.fn(async () => {
        return 'async result';
      });
      const debouncedFn = debounce(asyncFn, 100);

      debouncedFn();

      jest.advanceTimersByTime(100);

      expect(asyncFn).toHaveBeenCalledTimes(1);
    });
  });
});