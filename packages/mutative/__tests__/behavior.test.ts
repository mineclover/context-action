import { describe, expect, it } from 'vitest';
import {
  MutativeUtils,
  applyPatches,
  deepClone,
  produce,
  produceWithPatches,
} from '../src';

describe('@context-action/mutative adapter behavior matrix', () => {
  describe('immutable updates and patch boundaries', () => {
    it('preserves structural sharing through the adapter', () => {
      const base = {
        changed: { value: 0 },
        untouched: { value: 1 },
      };

      const next = produce(base, (draft) => {
        draft.changed.value = 2;
      });

      expect(next.changed).not.toBe(base.changed);
      expect(next.untouched).toBe(base.untouched);
    });

    it('supports Map and Set updates through produceWithPatches', () => {
      const key = { id: 1 };
      const base = {
        values: new Map([[key, { count: 0 }]]),
        selected: new Set(['a']),
      };

      const [next, patches, inversePatches] = produceWithPatches(base, (draft) => {
        draft.values.get(key)!.count = 1;
        draft.selected.add('b');
      });

      expect(next.values.get(key)).toEqual({ count: 1 });
      expect([...next.selected]).toEqual(['a', 'b']);
      expect(applyPatches(base, patches)).toEqual(next);
      expect(applyPatches(next, inversePatches)).toEqual(base);
    });

    it('supports mutable patch application without replacing the root', () => {
      const base = { count: 0 };
      const [, patches] = produceWithPatches(base, (draft) => {
        draft.count = 4;
      });

      const target = { count: 0 };
      expect(applyPatches(target, patches, { mutable: true })).toBeUndefined();
      expect(target).toEqual({ count: 4 });
    });

    it('exposes the same draft helpers through MutativeUtils', () => {
      const base = { count: 0 };
      const next = MutativeUtils.produce(base, (draft) => {
        expect(MutativeUtils.isDraft(draft)).toBe(true);
        expect(MutativeUtils.original(draft)).toBe(base);
        draft.count = 1;
        expect(MutativeUtils.current(draft)).toEqual({ count: 1 });
      });

      expect(next).toEqual({ count: 1 });
      expect(MutativeUtils.isDraft(next)).toBe(false);
    });
  });

  describe('clone and fallback boundaries', () => {
    it('deep clones nested Map and Set values without sharing them', () => {
      const source = {
        map: new Map([['nested', { count: 1 }]]),
        set: new Set([{ enabled: true }]),
      };

      const cloned = deepClone(source);
      expect(cloned).toEqual(source);
      expect(cloned).not.toBe(source);
      expect(cloned.map).not.toBe(source.map);
      expect(cloned.map.get('nested')).not.toBe(source.map.get('nested'));
      expect(cloned.set).not.toBe(source.set);
      expect([...cloned.set][0]).not.toBe([...source.set][0]);
    });

    it('keeps primitive and function references stable in deepClone', () => {
      const fn = () => 'value';
      expect(deepClone(1)).toBe(1);
      expect(deepClone('value')).toBe('value');
      expect(deepClone(fn)).toBe(fn);
    });

    it('preserves Date and RegExp instances when cloning', () => {
      const source = {
        date: new Date('2026-01-01T00:00:00.000Z'),
        pattern: /context-action/gi,
      };

      const cloned = deepClone(source);
      expect(cloned.date).toEqual(source.date);
      expect(cloned.date).not.toBe(source.date);
      expect(cloned.pattern).toEqual(source.pattern);
      expect(cloned.pattern).not.toBe(source.pattern);
    });
  });
});
