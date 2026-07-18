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
});
