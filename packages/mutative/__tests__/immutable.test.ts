/**
 * @fileoverview Tests for Mutative-based Immutability Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  produce,
  produceWithPatches,
  deepClone,
  safeGet,
  safeSet,
  applyPatches,
  MutativeUtils,
  setGlobalImmutabilityOptions,
  getGlobalImmutabilityOptions,
} from '../src/immutable';

describe('Mutative Immutability Utilities', () => {
  describe('produce', () => {
    it('should create immutable state updates', () => {
      const state = { count: 0, name: 'test' };
      const nextState = produce(state, (draft) => {
        draft.count = 1;
      });

      expect(nextState.count).toBe(1);
      expect(nextState.name).toBe('test');
      expect(nextState).not.toBe(state);
    });

    it('should handle nested objects', () => {
      const state = {
        user: { name: 'John', settings: { theme: 'light' } },
      };
      const nextState = produce(state, (draft) => {
        draft.user.settings.theme = 'dark';
      });

      expect(nextState.user.settings.theme).toBe('dark');
      expect(nextState).not.toBe(state);
    });

    it('should handle arrays', () => {
      const state = { items: [1, 2, 3] };
      const nextState = produce(state, (draft) => {
        draft.items.push(4);
      });

      expect(nextState.items).toEqual([1, 2, 3, 4]);
      expect(nextState.items).not.toBe(state.items);
    });

    it('should handle returning new value from producer', () => {
      const state = { count: 0 };
      const nextState = produce(state, () => {
        return { count: 10 };
      });

      expect(nextState.count).toBe(10);
    });
  });

  describe('produceWithPatches', () => {
    it('should return state with patches', () => {
      const state = { count: 0 };
      const [nextState, patches, inversePatches] = produceWithPatches(
        state,
        (draft) => {
          draft.count = 1;
        }
      );

      expect(nextState.count).toBe(1);
      expect(patches.length).toBeGreaterThan(0);
      expect(inversePatches.length).toBeGreaterThan(0);
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toStrictEqual(original);
      // deepClone creates a new copy for immutability
      expect(cloned).not.toBe(original);
    });

    it('should deep clone arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(original);

      expect(cloned).toStrictEqual(original);
      // deepClone creates a new copy for immutability
      expect(cloned).not.toBe(original);
    });

    it('should return same value for primitives', () => {
      expect(deepClone(1)).toBe(1);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should return same reference for functions', () => {
      const fn = () => {};
      expect(deepClone(fn)).toBe(fn);
    });
  });

  describe('safeGet/safeSet', () => {
    it('should clone when enableCloning=true', () => {
      const original = { a: 1 };
      const result = safeGet(original, true);

      expect(result).toStrictEqual(original);
      // safeGet creates a new copy when cloning is enabled
      expect(result).not.toBe(original);
    });

    it('should return same reference with enableCloning=false', () => {
      const original = { a: 1 };
      const result = safeGet(original, false);

      expect(result).toBe(original);
    });

    it('safeSet should clone when enableCloning=true', () => {
      const original = { a: 1 };
      const result = safeSet(original, true);

      expect(result).toStrictEqual(original);
      // safeSet creates a new copy when cloning is enabled
      expect(result).not.toBe(original);
    });
  });

  describe('applyPatches', () => {
    it('should apply patches to state', () => {
      const state = { count: 0 };
      const [, patches] = produceWithPatches(state, (draft) => {
        draft.count = 5;
      });

      const newState = applyPatches(state, patches);
      expect(newState.count).toBe(5);
    });
  });

  describe('MutativeUtils', () => {
    it('should provide isDraft check', () => {
      expect(MutativeUtils.isDraft({})).toBe(false);
    });

    it('should provide produce function', () => {
      const state = { count: 0 };
      const nextState = MutativeUtils.produce(state, (draft) => {
        draft.count = 1;
      });
      expect(nextState.count).toBe(1);
    });
  });

  describe('Global Options', () => {
    beforeEach(() => {
      // Reset to defaults
      setGlobalImmutabilityOptions({
        enableCloning: true,
        enableVerification: process.env.NODE_ENV === 'development',
        warnOnFallback: true,
      });
    });

    it('should get and set global options', () => {
      setGlobalImmutabilityOptions({ enableCloning: false });
      const options = getGlobalImmutabilityOptions();

      expect(options.enableCloning).toBe(false);
    });

    it('should preserve other options when setting partial options', () => {
      const initialOptions = getGlobalImmutabilityOptions();
      setGlobalImmutabilityOptions({ warnOnFallback: false });
      const updatedOptions = getGlobalImmutabilityOptions();

      expect(updatedOptions.enableCloning).toBe(initialOptions.enableCloning);
      expect(updatedOptions.warnOnFallback).toBe(false);
    });
  });
});
