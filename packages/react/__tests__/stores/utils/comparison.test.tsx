/**
 * @fileoverview Tests for comparison utility functions
 */

import { shallowEqual, deepEqual, defaultEqualityFn } from '../../../src/stores/hooks/useStoreSelector';

describe('Comparison utilities', () => {
  describe('defaultEqualityFn', () => {
    it('should use Object.is for comparison', () => {
      expect(defaultEqualityFn(1, 1)).toBe(true);
      expect(defaultEqualityFn(1, 2)).toBe(false);
      expect(defaultEqualityFn('a', 'a')).toBe(true);
      expect(defaultEqualityFn('a', 'b')).toBe(false);
      expect(defaultEqualityFn(null, null)).toBe(true);
      expect(defaultEqualityFn(undefined, undefined)).toBe(true);
      expect(defaultEqualityFn(null, undefined)).toBe(false);
    });

    it('should handle NaN correctly', () => {
      expect(defaultEqualityFn(NaN, NaN)).toBe(true);
      expect(defaultEqualityFn(NaN, 1)).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('should return true for identical values', () => {
      const obj = { a: 1, b: 2 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('should return true for shallow equal objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallowEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('should return false for different objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should handle nested objects (shallow only)', () => {
      const nested1 = { inner: { value: 1 } };
      const nested2 = { inner: { value: 1 } };
      const nested3 = { inner: nested1.inner };
      
      expect(shallowEqual(nested1, nested2)).toBe(false); // Different references
      expect(shallowEqual(nested1, nested3)).toBe(true); // Same reference
    });

    it('should handle primitives', () => {
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual('a', 'a')).toBe(true);
      expect(shallowEqual(true, true)).toBe(true);
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(undefined, undefined)).toBe(true);
      
      expect(shallowEqual(1, 2)).toBe(false);
      expect(shallowEqual('a', 'b')).toBe(false);
      expect(shallowEqual(true, false)).toBe(false);
      expect(shallowEqual(null, undefined)).toBe(false);
    });
  });

  describe('deepEqual', () => {
    it('should return true for identical values', () => {
      const obj = { a: 1, b: 2 };
      expect(deepEqual(obj, obj)).toBe(true);
    });

    it('should return true for deep equal objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 } };
      const obj2 = { a: 1, b: { c: 2, d: 3 } };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different nested objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 } };
      const obj2 = { a: 1, b: { c: 2, d: 4 } };
      expect(deepEqual(obj1, obj2)).toBe(false);
    });

    it('should handle arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false);
    });

    it('should handle mixed types', () => {
      expect(deepEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
      expect(deepEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false);
    });

    it('should handle primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
      
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
    });
  });
});