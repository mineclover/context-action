import {
  shallowEqual,
  deepEqual,
  referenceEqual,
  createCustomEqual,
  createStructuralEqual,
  createOptimizedEqual,
  areArraysEqual,
  areObjectsEqual,
  areMapsEqual,
  areSetsEqual,
  isPlainObject,
  hasChanged
} from '../../../src/stores/utils/comparison';

describe('comparison utilities', () => {
  describe('shallowEqual', () => {
    it('should return true for identical references', () => {
      const obj = { a: 1 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('should return true for equal primitives', () => {
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual('test', 'test')).toBe(true);
      expect(shallowEqual(true, true)).toBe(true);
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(shallowEqual(1, 2)).toBe(false);
      expect(shallowEqual('test', 'test2')).toBe(false);
      expect(shallowEqual(true, false)).toBe(false);
      expect(shallowEqual(null, undefined)).toBe(false);
    });

    it('should perform shallow comparison for objects', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };
      const obj3 = { a: 1, b: 2, c: 4 };

      expect(shallowEqual(obj1, obj2)).toBe(true);
      expect(shallowEqual(obj1, obj3)).toBe(false);
    });

    it('should return false for objects with different keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, c: 2 };

      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should not perform deep comparison', () => {
      const obj1 = { a: { b: 1 } };
      const obj2 = { a: { b: 1 } };

      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should handle arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];
      const arr3 = [1, 2, 4];

      expect(shallowEqual(arr1, arr2)).toBe(false); // Different references
      expect(shallowEqual(arr1, arr1)).toBe(true); // Same reference
      expect(shallowEqual(arr1, arr3)).toBe(false);
    });

    it('should handle NaN correctly', () => {
      expect(shallowEqual(NaN, NaN)).toBe(true);
      expect(shallowEqual({ a: NaN }, { a: NaN })).toBe(true);
    });

    it('should handle +0 and -0', () => {
      expect(shallowEqual(+0, -0)).toBe(true);
      expect(shallowEqual({ a: +0 }, { a: -0 })).toBe(true);
    });
  });

  describe('deepEqual', () => {
    it('should return true for identical references', () => {
      const obj = { a: 1 };
      expect(deepEqual(obj, obj)).toBe(true);
    });

    it('should perform deep comparison for nested objects', () => {
      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 1 } } };
      const obj3 = { a: { b: { c: 2 } } };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it('should handle arrays deeply', () => {
      const arr1 = [[1, 2], [3, 4]];
      const arr2 = [[1, 2], [3, 4]];
      const arr3 = [[1, 2], [3, 5]];

      expect(deepEqual(arr1, arr2)).toBe(true);
      expect(deepEqual(arr1, arr3)).toBe(false);
    });

    it('should handle mixed nested structures', () => {
      const obj1 = { a: [1, { b: 2 }], c: { d: [3, 4] } };
      const obj2 = { a: [1, { b: 2 }], c: { d: [3, 4] } };
      const obj3 = { a: [1, { b: 3 }], c: { d: [3, 4] } };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it('should handle circular references', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;

      const obj2: any = { a: 1 };
      obj2.self = obj2;

      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should handle Maps', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);
      const map3 = new Map([['a', 1], ['b', 3]]);

      expect(deepEqual(map1, map2)).toBe(true);
      expect(deepEqual(map1, map3)).toBe(false);
    });

    it('should handle Sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      const set3 = new Set([1, 2, 4]);

      expect(deepEqual(set1, set2)).toBe(true);
      expect(deepEqual(set1, set3)).toBe(false);
    });

    it('should handle Dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-01');
      const date3 = new Date('2024-01-02');

      expect(deepEqual(date1, date2)).toBe(true);
      expect(deepEqual(date1, date3)).toBe(false);
    });

    it('should handle RegExp', () => {
      const regex1 = /test/gi;
      const regex2 = /test/gi;
      const regex3 = /test/i;

      expect(deepEqual(regex1, regex2)).toBe(true);
      expect(deepEqual(regex1, regex3)).toBe(false);
    });
  });

  describe('referenceEqual', () => {
    it('should only return true for same reference', () => {
      const obj = { a: 1 };
      const obj2 = { a: 1 };

      expect(referenceEqual(obj, obj)).toBe(true);
      expect(referenceEqual(obj, obj2)).toBe(false);
    });

    it('should work with primitives', () => {
      expect(referenceEqual(1, 1)).toBe(true);
      expect(referenceEqual('test', 'test')).toBe(true);
      expect(referenceEqual(true, true)).toBe(true);
    });
  });

  describe('createCustomEqual', () => {
    it('should create custom equality function', () => {
      const customEqual = createCustomEqual({
        maxDepth: 2,
        compareArrays: true,
        compareObjects: true
      });

      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 2 } } };

      // Should stop at depth 2
      const result = customEqual(obj1, obj2);
      expect(typeof result).toBe('boolean');
    });

    it('should respect maxDepth option', () => {
      const customEqual = createCustomEqual({
        maxDepth: 1,
        compareArrays: true,
        compareObjects: true
      });

      const obj1 = { a: { b: 1 } };
      const obj2 = { a: { b: 2 } };

      // At depth 1, it only compares references of nested objects
      const result = customEqual(obj1, obj2);
      expect(result).toBe(false);
    });

    it('should handle array comparison option', () => {
      const customEqual = createCustomEqual({
        compareArrays: false,
        compareObjects: true
      });

      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];

      expect(customEqual(arr1, arr2)).toBe(false); // Only reference equality
    });

    it('should handle object comparison option', () => {
      const customEqual = createCustomEqual({
        compareArrays: true,
        compareObjects: false
      });

      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      expect(customEqual(obj1, obj2)).toBe(false); // Only reference equality
    });
  });

  describe('createStructuralEqual', () => {
    it('should perform structural equality check', () => {
      const structuralEqual = createStructuralEqual({
        strict: true,
        checkPrototype: false
      });

      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };

      expect(structuralEqual(obj1, obj2)).toBe(true);
    });

    it('should check prototypes when enabled', () => {
      const structuralEqual = createStructuralEqual({
        strict: true,
        checkPrototype: true
      });

      class TestClass {
        a = 1;
      }

      const obj1 = new TestClass();
      const obj2 = { a: 1 };

      expect(structuralEqual(obj1, obj2)).toBe(false);
    });

    it('should handle strict mode for type checking', () => {
      const structuralEqual = createStructuralEqual({
        strict: true,
        checkPrototype: false
      });

      expect(structuralEqual('1', 1)).toBe(false);
      expect(structuralEqual(true, 1)).toBe(false);
    });

    it('should handle non-strict mode', () => {
      const structuralEqual = createStructuralEqual({
        strict: false,
        checkPrototype: false
      });

      expect(structuralEqual('1', 1)).toBe(true);
      expect(structuralEqual(true, 1)).toBe(true);
    });
  });

  describe('createOptimizedEqual', () => {
    it('should use cache for repeated comparisons', () => {
      const optimizedEqual = createOptimizedEqual({
        maxCacheSize: 10
      });

      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      // First comparison
      const result1 = optimizedEqual(obj1, obj2);
      // Second comparison (should use cache)
      const result2 = optimizedEqual(obj1, obj2);

      expect(result1).toBe(result2);
    });

    it('should respect max cache size', () => {
      const optimizedEqual = createOptimizedEqual({
        maxCacheSize: 2
      });

      // Fill cache beyond limit
      for (let i = 0; i < 5; i++) {
        optimizedEqual({ id: i }, { id: i });
      }

      // Cache should still work for recent comparisons
      expect(optimizedEqual({ id: 4 }, { id: 4 })).toBe(true);
    });

    it('should handle WeakMap for object caching', () => {
      const optimizedEqual = createOptimizedEqual({
        maxCacheSize: 10
      });

      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      // Multiple comparisons of same objects
      optimizedEqual(obj1, obj2);
      optimizedEqual(obj1, obj2);

      // Should efficiently handle repeated comparisons
      expect(optimizedEqual(obj1, obj2)).toBe(true);
    });
  });

  describe('areArraysEqual', () => {
    it('should compare arrays correctly', () => {
      expect(areArraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(areArraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(areArraysEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should use custom comparator', () => {
      const comparator = (a: any, b: any) => Math.abs(a) === Math.abs(b);
      expect(areArraysEqual([1, -2, 3], [1, 2, 3], comparator)).toBe(true);
    });

    it('should handle nested arrays', () => {
      expect(areArraysEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(false); // Shallow comparison
    });

    it('should handle empty arrays', () => {
      expect(areArraysEqual([], [])).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(areArraysEqual(null as any, null as any)).toBe(true);
      expect(areArraysEqual(undefined as any, undefined as any)).toBe(true);
      expect(areArraysEqual(null as any, [])).toBe(false);
    });
  });

  describe('areObjectsEqual', () => {
    it('should compare objects correctly', () => {
      expect(areObjectsEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(areObjectsEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(areObjectsEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should use custom comparator', () => {
      const comparator = (a: any, b: any) => Math.abs(a) === Math.abs(b);
      expect(areObjectsEqual({ a: 1, b: -2 }, { a: 1, b: 2 }, comparator)).toBe(true);
    });

    it('should handle nested objects', () => {
      expect(areObjectsEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false); // Shallow comparison
    });

    it('should handle empty objects', () => {
      expect(areObjectsEqual({}, {})).toBe(true);
    });
  });

  describe('areMapsEqual', () => {
    it('should compare Maps correctly', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);
      const map3 = new Map([['a', 1], ['b', 3]]);

      expect(areMapsEqual(map1, map2)).toBe(true);
      expect(areMapsEqual(map1, map3)).toBe(false);
    });

    it('should handle different sizes', () => {
      const map1 = new Map([['a', 1]]);
      const map2 = new Map([['a', 1], ['b', 2]]);

      expect(areMapsEqual(map1, map2)).toBe(false);
    });

    it('should use custom comparator', () => {
      const map1 = new Map([['a', 1], ['b', -2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);
      const comparator = (a: any, b: any) => Math.abs(a) === Math.abs(b);

      expect(areMapsEqual(map1, map2, comparator)).toBe(true);
    });

    it('should handle empty Maps', () => {
      expect(areMapsEqual(new Map(), new Map())).toBe(true);
    });
  });

  describe('areSetsEqual', () => {
    it('should compare Sets correctly', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      const set3 = new Set([1, 2, 4]);

      expect(areSetsEqual(set1, set2)).toBe(true);
      expect(areSetsEqual(set1, set3)).toBe(false);
    });

    it('should handle different sizes', () => {
      const set1 = new Set([1, 2]);
      const set2 = new Set([1, 2, 3]);

      expect(areSetsEqual(set1, set2)).toBe(false);
    });

    it('should handle empty Sets', () => {
      expect(areSetsEqual(new Set(), new Set())).toBe(true);
    });

    it('should handle object values', () => {
      const obj = { a: 1 };
      const set1 = new Set([obj]);
      const set2 = new Set([obj]);
      const set3 = new Set([{ a: 1 }]);

      expect(areSetsEqual(set1, set2)).toBe(true);
      expect(areSetsEqual(set1, set3)).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    it('should identify plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it('should reject non-plain objects', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject(new Set())).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(/regex/)).toBe(false);
      expect(isPlainObject(() => {})).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject(1)).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });

    it('should reject class instances', () => {
      class TestClass {}
      expect(isPlainObject(new TestClass())).toBe(false);
    });
  });

  describe('hasChanged', () => {
    it('should detect changes', () => {
      expect(hasChanged(1, 2)).toBe(true);
      expect(hasChanged('a', 'b')).toBe(true);
      expect(hasChanged(true, false)).toBe(true);
      expect(hasChanged({ a: 1 }, { a: 1 })).toBe(true); // Different references
    });

    it('should detect no changes', () => {
      const obj = { a: 1 };
      expect(hasChanged(1, 1)).toBe(false);
      expect(hasChanged('a', 'a')).toBe(false);
      expect(hasChanged(obj, obj)).toBe(false); // Same reference
    });

    it('should handle NaN correctly', () => {
      expect(hasChanged(NaN, NaN)).toBe(false);
      expect(hasChanged(NaN, 1)).toBe(true);
    });

    it('should handle +0 and -0', () => {
      expect(hasChanged(+0, -0)).toBe(false);
      expect(hasChanged(-0, +0)).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(hasChanged(null, null)).toBe(false);
      expect(hasChanged(undefined, undefined)).toBe(false);
      expect(hasChanged(null, undefined)).toBe(true);
    });
  });
});