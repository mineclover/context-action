import { describe, expect, it } from 'vitest';
import { createTimeTravel } from '../src';

describe('@context-action/mutative time-travel core contract propagation', () => {
  it('replays Set history with insertion order intact', () => {
    const timeTravel = createTimeTravel({ values: new Set([1, 2]) });

    timeTravel.setState((draft) => {
      draft.values.delete(1);
      draft.values.add(3);
    });
    timeTravel.back();

    expect([...timeTravel.getState().values]).toEqual([1, 2]);
  });

  it('propagates enableAutoFreeze to state updates', () => {
    const timeTravel = createTimeTravel(
      { nested: { count: 0 } },
      { enableAutoFreeze: true }
    );

    timeTravel.setState((draft) => {
      draft.nested.count = 1;
    });

    expect(Object.isFrozen(timeTravel.getState())).toBe(true);
    expect(Object.isFrozen(timeTravel.getState().nested)).toBe(true);
  });
});
