import { apply, create, produce } from '../src';

describe('@context-action/mutative-core', () => {
  it('keeps create and produce as exact aliases', () => {
    expect(produce).toBe(create);

    const base = { count: 0 };
    const next = produce(base, (draft) => {
      draft.count += 1;
    });

    expect(next).toEqual({ count: 1 });
    expect(base).toEqual({ count: 0 });
  });

  it('supports array updates and patch replay', () => {
    const base = { items: ['a', 'b'] };
    const [next, patches, inversePatches] = create(
      base,
      (draft) => {
        draft.items.push('c');
      },
      { enablePatches: true }
    );

    expect(next.items).toEqual(['a', 'b', 'c']);
    expect(apply(base, patches)).toEqual(next);
    expect(apply(next, inversePatches)).toEqual(base);
  });
});
