import { describe, expect, it } from 'vitest';
import { createTimeTravel, produceWithPatches } from '../src';

describe('@context-action/mutative time-travel behavior matrix', () => {
  it('supports automatic archive, undo, redo, go, and reset', () => {
    const travel = createTimeTravel({ count: 0 });

    travel.setState((draft) => {
      draft.count = 1;
    });
    travel.setState((draft) => {
      draft.count = 2;
    });

    expect(travel.getPosition()).toBe(2);
    expect(travel.getState()).toEqual({ count: 2 });
    expect(travel.canBack()).toBe(true);
    expect(travel.canForward()).toBe(false);

    travel.back();
    expect(travel.getState()).toEqual({ count: 1 });
    travel.forward();
    expect(travel.getState()).toEqual({ count: 2 });

    travel.go(0);
    expect(travel.getState()).toEqual({ count: 0 });
    expect(travel.getHistory()).toEqual([{ count: 0 }, { count: 1 }, { count: 2 }]);

    travel.reset();
    expect(travel.getPosition()).toBe(0);
    expect(travel.getState()).toEqual({ count: 0 });
  });

  it('drops the oldest entries when maxHistory is reached', () => {
    const travel = createTimeTravel({ count: 0 }, { maxHistory: 2 });

    travel.setState((draft) => {
      draft.count = 1;
    });
    travel.setState((draft) => {
      draft.count = 2;
    });
    travel.setState((draft) => {
      draft.count = 3;
    });

    expect(travel.getPosition()).toBe(2);
    expect(travel.getPatches().patches).toHaveLength(2);
    travel.back(2);
    expect(travel.getState()).toEqual({ count: 1 });
    expect(travel.canBack()).toBe(false);
  });

  it('truncates the redo branch after a new update', () => {
    const travel = createTimeTravel({ count: 0 });

    travel.setState((draft) => {
      draft.count = 1;
    });
    travel.setState((draft) => {
      draft.count = 2;
    });
    travel.back();
    travel.setState((draft) => {
      draft.count = 3;
    });

    expect(travel.getState()).toEqual({ count: 3 });
    expect(travel.canForward()).toBe(false);
    expect(travel.getPatches().patches).toHaveLength(2);
  });

  it('supports manual archive mode and exposes archive controls', () => {
    const travel = createTimeTravel(
      { count: 0 },
      { autoArchive: false, maxHistory: 5 }
    );
    const controls = travel.getControls();

    travel.setState((draft) => {
      draft.count = 1;
    });
    travel.setState((draft) => {
      draft.count = 2;
    });

    expect(controls.canArchive()).toBe(true);
    expect(controls.position).toBe(1);
    controls.archive();
    expect(controls.canArchive()).toBe(false);
    expect(controls.position).toBe(1);

    controls.back();
    expect(travel.getState()).toEqual({ count: 0 });
    controls.forward();
    expect(travel.getState()).toEqual({ count: 2 });
  });

  it('restores a supplied initial history position', () => {
    const [, patches, inversePatches] = produceWithPatches(
      { count: 0 },
      (draft) => {
        draft.count = 1;
      }
    );
    const travel = createTimeTravel(
      { count: 1 },
      {
        initialPosition: 1,
        initialPatches: { patches: [patches], inversePatches: [inversePatches] },
      }
    );

    travel.back();
    expect(travel.getState()).toEqual({ count: 0 });
    travel.forward();
    expect(travel.getState()).toEqual({ count: 1 });
  });

  it('keeps the root reference in mutable mode while moving through history', () => {
    const travel = createTimeTravel({ count: 0 }, { mutable: true });
    const root = travel.getState();

    travel.setState((draft) => {
      draft.count = 1;
    });
    expect(travel.getState()).toBe(root);
    expect(root).toEqual({ count: 1 });

    travel.back();
    expect(travel.getState()).toBe(root);
    expect(root).toEqual({ count: 0 });
  });

  it('resets mutable Map roots to their initial entries', () => {
    const travel = createTimeTravel(new Map([['initial', 1]]), {
      mutable: true,
    });

    travel.setState((draft) => {
      draft.set('added', 2);
    });
    travel.reset();

    expect([...travel.getState().entries()]).toEqual([['initial', 1]]);
  });

  it('keeps root replacement updates undoable in mutable mode', () => {
    const travel = createTimeTravel({ count: 0 }, { mutable: true });

    travel.setState(() => ({ count: 1 }));
    expect(travel.getState()).toEqual({ count: 1 });

    travel.back();
    expect(travel.getState()).toEqual({ count: 0 });
    travel.forward();
    expect(travel.getState()).toEqual({ count: 1 });
  });

  it('uses the configured root path format when notifying reset transitions', () => {
    const travel = createTimeTravel(
      { count: 0 },
      { patchesOptions: { pathAsArray: false } }
    );
    const changedPatches: unknown[] = [];

    travel.subscribe((_state, _history, _position, patches) => {
      changedPatches.push(patches);
    });
    travel.setState((draft) => {
      draft.count = 1;
    });
    travel.reset();

    expect(changedPatches[1]).toEqual([
      { op: 'replace', path: '', value: { count: 0 } },
    ]);
  });

  it('notifies subscribers and stops notifying after unsubscribe', () => {
    const travel = createTimeTravel({ count: 0 });
    const calls: Array<{ count: number; position: number }> = [];
    const unsubscribe = travel.subscribe((state, _patches, position) => {
      calls.push({ count: state.count, position });
    });

    travel.setState((draft) => {
      draft.count = 1;
    });
    unsubscribe();
    travel.setState((draft) => {
      draft.count = 2;
    });

    expect(calls).toEqual([{ count: 1, position: 1 }]);
  });

  it('separates transition patches from the complete history for listeners', () => {
    const travel = createTimeTravel({ count: 0 });
    const notifications: Array<{
      historyLength: number;
      changedPatches: unknown;
    }> = [];

    travel.subscribe((_state, history, _position, changedPatches) => {
      notifications.push({
        historyLength: history.patches.length,
        changedPatches,
      });
    });

    travel.setState((draft) => {
      draft.count = 1;
    });
    travel.setState((draft) => {
      draft.count = 2;
    });
    travel.back();

    expect(notifications[1]).toEqual({
      historyLength: 2,
      changedPatches: [{ op: 'replace', path: ['count'], value: 2 }],
    });
    expect(notifications[2]).toEqual({
      historyLength: 2,
      changedPatches: [{ op: 'replace', path: ['count'], value: 1 }],
    });
  });
});
