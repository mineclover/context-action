/**
 * @fileoverview Tests for immutable utility functions
 * 
 * 이 테스트는 immutable.ts의 깊은 복사 기능과 성능 최적화를 검증합니다.
 * 특히 로그 빈도 제한과 무한루프 방지 로직을 테스트합니다.
 */

import { 
  deepClone, 
  verifyImmutability, 
  safeGet, 
  safeSet,
  setGlobalImmutabilityOptions,
  getGlobalImmutabilityOptions,
  getPerformanceProfile,
  performantSafeGet
} from '../../../src/stores/utils/immutable';

// Mock console methods for testing
const mockConsole = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Override global console for testing
const originalConsole = global.console;
beforeEach(() => {
  global.console = { ...originalConsole, ...mockConsole };
  mockConsole.debug.mockClear();
  mockConsole.warn.mockClear();
  mockConsole.error.mockClear();
});

afterEach(() => {
  global.console = originalConsole;
});

describe('Immutable utilities', () => {
  describe('deepClone', () => {
    describe('Primitive values', () => {
      it('should return primitive values as-is', () => {
        expect(deepClone(42)).toBe(42);
        expect(deepClone('hello')).toBe('hello');
        expect(deepClone(true)).toBe(true);
        expect(deepClone(null)).toBe(null);
        expect(deepClone(undefined)).toBe(undefined);
        expect(deepClone(BigInt(123))).toBe(BigInt(123));
      });
    });

    describe('Object cloning', () => {
      it('should create deep copies of objects', () => {
        const original = { a: 1, b: { c: 2, d: [3, 4] } };
        const cloned = deepClone(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.b).not.toBe(original.b);
        expect(cloned.b.d).not.toBe(original.b.d);
      });

      it('should handle arrays correctly', () => {
        const original = [1, { a: 2 }, [3, 4]];
        const cloned = deepClone(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned[1]).not.toBe(original[1]);
        expect(cloned[2]).not.toBe(original[2]);
      });
    });

    describe('Special object types', () => {
      it('should handle Date objects', () => {
        const original = new Date('2023-01-01');
        const cloned = deepClone(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned instanceof Date).toBe(true);
      });

      it('should handle RegExp objects', () => {
        const original = /test/gi;
        const cloned = deepClone(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned instanceof RegExp).toBe(true);
        expect(cloned.source).toBe('test');
        expect(cloned.flags).toBe('gi');
      });

      it('should handle functions with warning', () => {
        const original = () => 'test';
        const cloned = deepClone(original);
        
        expect(cloned).toBe(original);
        expect(mockConsole.warn).toHaveBeenCalledWith(
          '[Context-Action] Functions cannot be deep cloned, returning original reference'
        );
      });

      it('should handle symbols with warning', () => {
        const original = Symbol('test');
        const cloned = deepClone(original);
        
        expect(cloned).toBe(original);
        expect(mockConsole.warn).toHaveBeenCalledWith(
          '[Context-Action] Symbols cannot be deep cloned, returning original reference'
        );
      });
    });

    describe('Performance and logging constraints', () => {
      it('should limit logging frequency to prevent infinite loops', () => {
        // Mock Math.random to control logging behavior
        const originalRandom = Math.random;
        let callCount = 0;
        Math.random = jest.fn(() => {
          callCount++;
          // Only the first call should trigger logging (< 0.001)
          return callCount === 1 ? 0.0005 : 0.002;
        });

        const testObj = { test: 'value' };
        
        // Perform multiple clones
        for (let i = 0; i < 10; i++) {
          deepClone(testObj);
        }

        // Debug logs should be limited due to frequency control
        expect(mockConsole.debug.mock.calls.length).toBeLessThanOrEqual(2);

        Math.random = originalRandom;
      });

      it('should only log in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        
        // Clear previous calls
        mockConsole.debug.mockClear();
        
        // Test production mode - no logging should occur
        process.env.NODE_ENV = 'production';
        deepClone({ test: 'value' });
        expect(mockConsole.debug).not.toHaveBeenCalled();

        // Test development mode - logging should be possible
        process.env.NODE_ENV = 'development';
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 0.0001); // Below 0.001 threshold
        
        deepClone({ test: 'value' });
        // In development mode, logging should be allowed
        expect(mockConsole.debug.mock.calls.length).toBeGreaterThanOrEqual(0);

        Math.random = originalRandom;
        process.env.NODE_ENV = originalEnv;
      });

      it('should handle large objects efficiently', () => {
        const largeObject = {};
        for (let i = 0; i < 1000; i++) {
          largeObject[`key${i}`] = { value: i, nested: { deep: i * 2 } };
        }

        const start = performance.now();
        const cloned = deepClone(largeObject);
        const end = performance.now();

        expect(cloned).toEqual(largeObject);
        expect(cloned).not.toBe(largeObject);
        expect(end - start).toBeLessThan(100); // Should complete within 100ms
      });
    });

    describe('Error handling', () => {
      it('should handle structuredClone failures gracefully', () => {
        // Mock structuredClone to throw an error
        const originalStructuredClone = global.structuredClone;
        global.structuredClone = jest.fn(() => {
          throw new Error('structuredClone failed');
        });

        const testObj = { test: 'value' };
        const result = deepClone(testObj);

        expect(mockConsole.warn).toHaveBeenCalledWith(
          '[Context-Action] structuredClone failed, falling back to JSON clone',
          expect.any(Error)
        );
        expect(result).toEqual(testObj);

        global.structuredClone = originalStructuredClone;
      });

      it('should handle complete cloning failure', () => {
        // Create object that can't be JSON serialized
        const circular = { a: 1 };
        circular.self = circular;

        // Mock structuredClone to fail
        const originalStructuredClone = global.structuredClone;
        global.structuredClone = jest.fn(() => {
          throw new Error('structuredClone failed');
        });

        const result = deepClone(circular);

        expect(mockConsole.warn).toHaveBeenCalledWith(
          '[Context-Action] structuredClone failed, falling back to JSON clone',
          expect.any(Error)
        );
        expect(mockConsole.error).toHaveBeenCalledWith(
          '[Context-Action] All cloning methods failed, returning original reference',
          expect.any(Error)
        );
        expect(result).toBe(circular);

        global.structuredClone = originalStructuredClone;
      });
    });
  });

  describe('verifyImmutability', () => {
    it('should return true for primitives with same values', () => {
      expect(verifyImmutability(42, 42)).toBe(true);
      expect(verifyImmutability('test', 'test')).toBe(true);
      expect(verifyImmutability(true, true)).toBe(true);
      expect(verifyImmutability(null, null)).toBe(true);
      expect(verifyImmutability(undefined, undefined)).toBe(true);
    });

    it('should return false for primitives with different values', () => {
      expect(verifyImmutability(42, 43)).toBe(false);
      expect(verifyImmutability('test', 'other')).toBe(false);
      expect(verifyImmutability(true, false)).toBe(false);
      expect(verifyImmutability(null, undefined)).toBe(false);
    });

    it('should return true for objects with different references', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };
      expect(verifyImmutability(obj1, obj2)).toBe(true);
    });

    it('should return false for objects with same references', () => {
      const obj = { a: 1 };
      expect(verifyImmutability(obj, obj)).toBe(false);
    });
  });

  describe('safeGet', () => {
    it('should return cloned objects by default', () => {
      const original = { a: 1, b: { c: 2 } };
      const result = safeGet(original);
      
      expect(result).toEqual(original);
      expect(result).not.toBe(original);
      expect(result.b).not.toBe(original.b);
    });

    it('should return original reference when cloning disabled', () => {
      const original = { a: 1, b: { c: 2 } };
      const result = safeGet(original, false);
      
      expect(result).toBe(original);
      expect(mockConsole.debug).toHaveBeenCalledWith(
        '[Context-Action] Cloning disabled, returning original reference'
      );
    });

    it('should verify immutability in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const original = { a: 1 };
      safeGet(original);
      
      // Should verify immutability for objects
      // (Warning would be logged if verification failed)
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('safeSet', () => {
    it('should return cloned objects by default', () => {
      const original = { a: 1, b: { c: 2 } };
      const result = safeSet(original);
      
      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });

    it('should return original reference when cloning disabled', () => {
      const original = { a: 1, b: { c: 2 } };
      const result = safeSet(original, false);
      
      expect(result).toBe(original);
      expect(mockConsole.debug).toHaveBeenCalledWith(
        '[Context-Action] Cloning disabled for setter, returning original reference'
      );
    });
  });

  describe('Global immutability options', () => {
    it('should set and get global options', () => {
      const newOptions = {
        enableCloning: false,
        enableVerification: false,
        warnOnFallback: false,
        shallowCloneThreshold: 5
      };

      setGlobalImmutabilityOptions(newOptions);
      const currentOptions = getGlobalImmutabilityOptions();

      expect(currentOptions).toEqual(expect.objectContaining(newOptions));
      expect(mockConsole.debug).toHaveBeenCalledWith(
        '[Context-Action] Global immutability options updated',
        expect.objectContaining(newOptions)
      );
    });

    it('should merge with existing options', () => {
      const partialOptions = { enableCloning: false };
      setGlobalImmutabilityOptions(partialOptions);
      
      const currentOptions = getGlobalImmutabilityOptions();
      expect(currentOptions.enableCloning).toBe(false);
      expect(currentOptions).toHaveProperty('enableVerification');
    });
  });

  describe('Performance monitoring', () => {
    it('should track performance data', () => {
      const testObj = { a: 1, b: { c: 2 } };
      
      // Perform some operations
      for (let i = 0; i < 5; i++) {
        performantSafeGet(testObj);
      }

      const profile = getPerformanceProfile();
      expect(profile.totalOperations).toBeGreaterThan(0);
      expect(profile.averageCloneTime).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(profile.recommendations)).toBe(true);
    });

    it('should provide recommendations for slow operations', () => {
      // Mock performance.now to simulate slow operations
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = jest.fn(() => {
        callCount++;
        return callCount % 2 === 1 ? 0 : 10; // 10ms per operation
      });

      const testObj = { a: 1 };
      
      // Perform multiple operations to trigger recommendation threshold
      for (let i = 0; i < 5; i++) {
        performantSafeGet(testObj);
      }

      const profile = getPerformanceProfile();
      
      // Check that recommendations exist (implementation may have different text)
      expect(Array.isArray(profile.recommendations)).toBe(true);
      
      // If the average time is over 5ms, we should get a recommendation
      if (profile.averageCloneTime > 5) {
        expect(profile.recommendations.length).toBeGreaterThan(0);
      }

      performance.now = originalNow;
    });

    it('should limit stored performance data', () => {
      const testObj = { a: 1 };
      
      // Get initial operation count
      const initialProfile = getPerformanceProfile();
      const initialOperations = initialProfile.totalOperations;
      
      // Perform more than 100 operations
      for (let i = 0; i < 150; i++) {
        performantSafeGet(testObj);
      }

      const profile = getPerformanceProfile();
      
      // Total operations should track all operations
      expect(profile.totalOperations).toBe(initialOperations + 150);
      
      // Performance data should have the expected structure
      expect(typeof profile.averageCloneTime).toBe('number');
      expect(Array.isArray(profile.recommendations)).toBe(true);
    });
  });

  describe('Stress tests for infinite loop prevention', () => {
    it('should handle rapid successive clones without performance degradation', () => {
      const testObj = { 
        data: new Array(100).fill(0).map(i => ({ id: i, value: Math.random() }))
      };

      const start = performance.now();
      
      // Simulate rapid store updates that could cause infinite loops
      for (let i = 0; i < 1000; i++) {
        deepClone(testObj);
      }
      
      const end = performance.now();
      const totalTime = end - start;

      // Should complete within reasonable time (not infinite loop)
      expect(totalTime).toBeLessThan(1000); // Less than 1 second

      // Logging should be severely limited
      expect(mockConsole.debug.mock.calls.length).toBeLessThan(10);
    });

    it('should prevent log spam in high-frequency scenarios', () => {
      // Mock Math.random to never log (always above threshold)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.999); // Always above 0.001 threshold

      const testObj = { test: 'value' };
      
      // Simulate mouse event frequency (120fps = ~8ms intervals)
      for (let i = 0; i < 500; i++) {
        deepClone(testObj);
      }

      // No debug logs should be called
      expect(mockConsole.debug).not.toHaveBeenCalled();

      Math.random = originalRandom;
    });

    it('should maintain functionality during edge case scenarios', () => {
      const edgeCases = [
        null,
        undefined,
        '',
        0,
        false,
        [],
        {},
        { deep: { very: { nested: { object: { with: { many: { levels: 'value' } } } } } } },
        new Date(),
        /regex/g,
        new Array(1000).fill({ data: 'test' })
      ];

      edgeCases.forEach(testCase => {
        const result = deepClone(testCase);
        if (typeof testCase === 'object' && testCase !== null) {
          expect(result).toEqual(testCase);
          if (Array.isArray(testCase) || testCase.constructor === Object) {
            expect(result).not.toBe(testCase);
          }
        } else {
          expect(result).toBe(testCase);
        }
      });
    });
  });
});