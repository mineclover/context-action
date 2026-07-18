import {
  apply,
  create,
  current,
  isDraft,
  isDraftable,
  makeCreator,
  original,
  rawReturn,
} from '../src';

describe('@context-action/mutative-core behavior matrix', () => {
  describe('copy-on-write semantics', () => {
    it('returns the original tree for a no-op recipe', () => {
      const base = { user: { name: 'Ada' }, items: [1, 2] };

      expect(create(base, () => {})).toBe(base);
    });

    it('shares untouched branches and copies only changed branches', () => {
      const base = {
        user: { name: 'Ada', preferences: { theme: 'light' } },
        items: [{ id: 1 }, { id: 2 }],
      };

      const next = create(base, (draft) => {
        draft.user.name = 'Grace';
        draft.items[1].id = 3;
      });

      expect(next).not.toBe(base);
      expect(next.user).not.toBe(base.user);
      expect(next.user.preferences).toBe(base.user.preferences);
      expect(next.items).not.toBe(base.items);
      expect(next.items[0]).toBe(base.items[0]);
      expect(next.items[1]).not.toBe(base.items[1]);
    });
  });

  describe('objects and arrays', () => {
    it('supports JSON pointer escaping in string patch paths', () => {
      const base = { 'a/b~c': 0 };
      const [next, patches, inversePatches] = create(
        base,
        (draft) => {
          draft['a/b~c'] = 1;
        },
        { enablePatches: { pathAsArray: false } }
      );

      expect(patches).toEqual([
        { op: 'replace', path: '/a~1b~0c', value: 1 },
      ]);
      expect(apply(base, patches)).toEqual(next);
      expect(apply(next, inversePatches)).toEqual(base);
    });

    it('handles array methods and can replay the generated patches', () => {
      const base = { items: [1, 2, 3] };
      const [next, patches, inversePatches] = create(
        base,
        (draft) => {
          draft.items.unshift(0);
          draft.items.splice(2, 1, 20, 21);
          draft.items.reverse();
          draft.items.pop();
        },
        { enablePatches: true }
      );

      expect(next.items).toEqual([3, 21, 20, 1]);
      expect(apply(base, patches)).toEqual(next);
      expect(apply(next, inversePatches)).toEqual(base);
    });

    it('preserves sparse array holes when an array is changed', () => {
      const base: { items: number[] } = { items: [] };
      base.items[1] = 2;

      const next = create(base, (draft) => {
        draft.items[2] = 3;
      });

      expect(next.items).toHaveLength(3);
      expect(0 in next.items).toBe(false);
      expect(1 in next.items).toBe(true);
      expect(2 in next.items).toBe(true);
    });

    it('can omit array length assignment from patches', () => {
      const [next, patches] = create(
        { items: [1, 2] },
        (draft) => {
          draft.items.push(3);
        },
        { enablePatches: { arrayLengthAssignment: false } }
      );

      expect(next.items).toEqual([1, 2, 3]);
      expect(
        patches.some(
          (patch) => patch.path[patch.path.length - 1] === 'length'
        )
      ).toBe(false);
    });
  });

  describe('Map and Set collections', () => {
    it('supports Map iteration, updates, deletion, and clearing', () => {
      const key = { id: 1 };
      const base = new Map<any, { count: number }>([
        [key, { count: 0 }],
        ['remove', { count: 1 }],
      ]);

      const next = create(base, (draft) => {
        const entry = draft.get(key);
        if (entry) entry.count = 2;
        draft.delete('remove');
        draft.set('new', { count: 3 });
      });

      expect(next.get(key)).toEqual({ count: 2 });
      expect(next.has('remove')).toBe(false);
      expect([...next.keys()]).toEqual([key, 'new']);
      expect([...next.values()]).toEqual([{ count: 2 }, { count: 3 }]);
      expect([...next.entries()]).toEqual([
        [key, { count: 2 }],
        ['new', { count: 3 }],
      ]);

      const cleared = create(next, (draft) => draft.clear());
      expect(cleared.size).toBe(0);
    });

    it('supports nested Set drafts and preserves Set iteration order', () => {
      const first = { id: 1, enabled: false };
      const second = { id: 2, enabled: false };
      const base = new Set([first, second]);

      const [next, patches, inversePatches] = create(
        base,
        (draft) => {
          for (const item of draft) {
            if (item.id === 2) item.enabled = true;
          }
          draft.delete(first);
          draft.add({ id: 3, enabled: true });
        },
        { enablePatches: true }
      );

      expect([...next].map((item) => item.id)).toEqual([2, 3]);
      expect([...apply(base, patches)].map((item) => item.id)).toEqual([2, 3]);
      expect([...apply(next, inversePatches)].map((item) => item.id)).toEqual([
        1, 2,
      ]);
    });

    it('treats adding an existing Set value as a no-op', () => {
      const value = { id: 1 };
      const base = new Set([value]);
      const [next, patches] = create(
        base,
        (draft) => draft.add(value),
        { enablePatches: true }
      );

      expect(next).toBe(base);
      expect(patches).toEqual([]);
    });
  });

  describe('draft helpers and creator overloads', () => {
    it('exposes draft, original, and current values only during a recipe', () => {
      const base = { nested: { count: 0 } };
      let draftSeen = false;
      let originalSeen: unknown;
      let currentSeen: unknown;

      const next = create(base, (draft) => {
        draftSeen = isDraft(draft) && isDraft(draft.nested);
        originalSeen = original(draft.nested);
        draft.nested.count = 1;
        currentSeen = current(draft);
      });

      expect(draftSeen).toBe(true);
      expect(originalSeen).toBe(base.nested);
      expect(currentSeen).toEqual({ nested: { count: 1 } });
      expect(isDraft(next)).toBe(false);
      expect(() => original(next)).toThrow(/draft/i);
      expect(() => current(next)).toThrow(/draft/i);
    });

    it('supports the curried makeCreator overload and option merging', () => {
      const update = makeCreator({ enableAutoFreeze: true })(
        (draft: { count: number }, amount: number) => {
          draft.count += amount;
        }
      );

      const next = update({ count: 1 }, 2);
      expect(next).toEqual({ count: 3 });
      expect(Object.isFrozen(next)).toBe(true);
    });

    it('supports manually finalized drafts', () => {
      const [draft, finalize] = create({ count: 0 }, { enablePatches: true });
      expect(isDraft(draft)).toBe(true);

      draft.count = 1;
      const [next, patches, inversePatches] = finalize();

      expect(next).toEqual({ count: 1 });
      expect(patches).toEqual([{ op: 'replace', path: ['count'], value: 1 }]);
      expect(apply(next, inversePatches)).toEqual({ count: 0 });
    });

    it('reports the supported draftability matrix', () => {
      expect(isDraftable({})).toBe(true);
      expect(isDraftable([])).toBe(true);
      expect(isDraftable(new Map())).toBe(true);
      expect(isDraftable(new Set())).toBe(true);
      expect(isDraftable(new Date())).toBe(false);
      expect(isDraftable(null)).toBe(false);
    });
  });

  describe('async, raw return, and apply modes', () => {
    it('supports asynchronous recipes', async () => {
      const next = await create({ count: 0 }, async (draft) => {
        await Promise.resolve();
        draft.count = 1;
      });

      expect(next).toEqual({ count: 1 });
    });

    it('revokes a draft when an asynchronous recipe rejects', async () => {
      let draft: { count: number } | undefined;
      const promise = create({ count: 0 }, async (currentDraft) => {
        draft = currentDraft;
        throw new Error('recipe failed');
      });

      await expect(promise).rejects.toThrow('recipe failed');
      expect(() => draft!.count).toThrow(/revoked/i);
    });

    it('supports mutable patch application and applying patches to a draft', () => {
      const base = { count: 0 };
      const [, patches] = create(
        base,
        (draft) => {
          draft.count = 1;
        },
        { enablePatches: true }
      );

      const mutableTarget = { count: 0 };
      expect(apply(mutableTarget, patches, { mutable: true })).toBeUndefined();
      expect(mutableTarget).toEqual({ count: 1 });

      const draftTarget = create({ count: 0 }, (draft) => {
        apply(draft, patches);
        expect(draft.count).toBe(1);
      });
      expect(draftTarget).toEqual({ count: 1 });
    });

    it('allows replacing a root through rawReturn and patch replay', () => {
      const replacement = { count: 10 };
      const [next, patches, inversePatches] = create(
        { count: 0 },
        () => rawReturn(replacement),
        { enablePatches: true }
      );

      expect(next).toBe(replacement);
      expect(apply({ count: 0 }, patches)).toEqual(replacement);
      expect(apply(next, inversePatches)).toEqual({ count: 0 });
    });

    it('rejects patch traversal through reserved object properties', () => {
      expect(() =>
        apply({}, [
          { op: 'add', path: ['__proto__', 'polluted'], value: true },
        ] as never)
      ).toThrow(/reserved/i);
    });
  });
});
