import { apply, create, rawReturn, unsafe } from '../src';

describe('@context-action/mutative-core regressions', () => {
  it('restores Set insertion order when inverse patches are applied', () => {
    const base = { values: new Set([1, 2]) };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.values.delete(1);
        draft.values.add(3);
      },
      { enablePatches: true }
    );

    expect([...apply(base, patches).values]).toEqual([...next.values]);
    expect([...apply(next, inversePatches).values]).toEqual([...base.values]);
  });

  it('rejects lossy string patch paths for non-string Map keys', () => {
    const key = { id: 'key' };
    const base = { values: new Map([[key, { count: 0 }]]) };

    expect(() =>
      create(
        base,
        (draft) => {
          draft.values.get(key)!.count = 1;
        },
        { enablePatches: { pathAsArray: false } }
      )
    ).toThrow(/pathAsArray/i);
  });

  it('replays non-string Map keys when paths remain arrays', () => {
    const key = { id: 'key' };
    const base = { values: new Map([[key, { count: 0 }]]) };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.values.get(key)!.count = 1;
      },
      { enablePatches: true }
    );

    expect(apply(base, patches).values.get(key)!.count).toBe(1);
    expect(apply(next, inversePatches).values.get(key)!.count).toBe(0);
  });

  it('rejects lossy string patch paths for Symbol properties', () => {
    const key = Symbol('key');
    const base = { [key]: 0 };

    expect(() =>
      create(
        base,
        (draft) => {
          draft[key] = 1;
        },
        { enablePatches: { pathAsArray: false } }
      )
    ).toThrow(/pathAsArray/i);
  });

  it('keeps nested unsafe scopes readable in strict mode', () => {
    class MutableBox {
      value = 0;
    }
    const base = { box: new MutableBox() };

    const result = create(
      base,
      (draft) =>
        unsafe(() => {
          unsafe(() => {
            draft.box.value = 1;
          });
          draft.box.value = 2;
        }),
      { strict: true }
    );

    expect(result.box.value).toBe(2);
  });

  it('rejects non-draft replacement values in strict mode', () => {
    expect(() =>
      create(
        { count: 0 },
        () => ({ count: 1 }),
        { strict: true }
      )
    ).toThrow(/strict/i);
  });

  it('allows an explicit rawReturn escape hatch in strict mode', () => {
    const base = { count: 0 };
    const replacement = { count: 1 };

    expect(create(base, () => rawReturn(replacement), { strict: true })).toBe(
      replacement
    );
  });

  it('freezes Map and Set shells when autoFreeze is enabled', () => {
    const next = create(
      { map: new Map([['a', 1]]), set: new Set([1]) },
      (draft) => {
        draft.map.set('b', 2);
        draft.set.add(2);
      },
      { enableAutoFreeze: true }
    );

    expect(Object.isFrozen(next.map)).toBe(true);
    expect(Object.isFrozen(next.set)).toBe(true);
    expect(() => next.map.set('c', 3)).toThrow(/frozen/i);
    expect(() => next.set.add(3)).toThrow(/frozen/i);
  });

  it('replays native array shift/unshift/splice/reverse patches and ignores missing delete indices (v2.0.1 #213)', () => {
    const base = { items: ['a', 'b', 'c', 'd'] };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.items.shift();
        draft.items.unshift('z');
        draft.items.splice(2, 1, 'x', 'y');
        draft.items.reverse();
        delete (draft.items as Record<number, string>)[99];
      },
      { enablePatches: true }
    );

    expect(apply(base, patches)).toEqual(next);
    expect(apply(next, inversePatches)).toEqual(base);

    // Deleting an out-of-bounds index alone leaves a no-op draft unchanged
    const [noopNext, noopPatches] = create(
      base,
      (draft) => {
        delete (draft.items as Record<number, string>)[99];
      },
      { enablePatches: true }
    );
    expect(noopNext).toBe(base);
    expect(noopPatches).toEqual([]);
  });

  it('prevents duplicate patches for shared/moved drafts and protects outer drafts from inner create() finalization (v2.0.2 #218)', () => {
    const base: { list: number[][]; copy?: number[][] | number[] } = { list: [[7, 4]] };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        const first = draft.list[0];
        draft.copy = draft.list;
        first.push(9);
        draft.list.unshift(first);
      },
      { enablePatches: true }
    );

    expect(next.list).toEqual([[7, 4, 9], [7, 4, 9]]);
    expect(apply(base, patches)).toEqual(next);
    expect(apply(next, inversePatches)).toEqual(base);

    // Outer draft stays mutable and uncorrupted when passed into inner create()
    const outerBase = { slot: { nested: { count: 1 } }, extra: { tag: 'v1' } };
    const outerNext = create(outerBase, (outerDraft) => {
      const innerResult = create(outerDraft.extra, (innerDraft) => {
        innerDraft.tag = 'v2';
      });
      outerDraft.extra = innerResult;
      outerDraft.slot.nested.count = 2;
    });
    expect(outerNext).toEqual({ slot: { nested: { count: 2 } }, extra: { tag: 'v2' } });
    expect(outerBase).toEqual({ slot: { nested: { count: 1 } }, extra: { tag: 'v1' } });
  });

  it('restores Set with mutated items and additions/deletions on forward and inverse replay', () => {
    const itemA = { id: 'a', count: 1 };
    const itemB = { id: 'b', count: 2 };
    const base = { set: new Set([itemA, itemB]) };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        const [first] = draft.set;
        first.count = 10;
        draft.set.delete(first);
        draft.set.add({ id: 'c', count: 3 });
      },
      { enablePatches: true }
    );

    expect(Array.from(apply(base, patches).set)).toEqual(Array.from(next.set));
    expect(Array.from(apply(next, inversePatches).set)).toEqual([itemA, itemB]);
  });

  it('rejects __proto__ terminal patch paths and mutable root replacements', () => {
    const base: Record<string, unknown> = { nested: { safe: 1 } };
    expect(() =>
      apply(base, [{ op: 'replace', path: ['nested', '__proto__'], value: { polluted: true } }])
    ).toThrow(/__proto__/i);

    expect(() =>
      apply({ a: 1 }, [{ op: 'replace', path: [], value: { a: 2 } }], { mutable: true })
    ).toThrow();
  });

  it('preserves sparse array holes vs undefined across shrink-then-grow patches', () => {
    const base = { list: ['a', 'b', 'c'] };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.list.length = 1;
        draft.list.length = 3;
      },
      { enablePatches: true }
    );

    expect(1 in next.list).toBe(false);
    const forward = apply(base, patches);
    expect(1 in forward.list).toBe(false);
    expect(forward.list.length).toBe(3);

    const reversed = apply(forward, inversePatches);
    expect(reversed.list).toEqual(['a', 'b', 'c']);
    expect(1 in reversed.list).toBe(true);
  });
});
