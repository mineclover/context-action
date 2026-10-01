import { describe, expect, it, vi } from 'vitest';
import { createTimeTravel, produceWithPatches } from '../src';

describe('@context-action/mutative time-travel behavior matrix', () => {
  it('groups synchronous updates into one history entry', () => {
    const travel = createTimeTravel({ count: 0 });
    let notifications = 0;
    travel.subscribe(() => { notifications += 1; });

    travel.batch(() => {
      travel.setState({ count: 1 });
      travel.setState({ count: 2 });
    });

    expect(travel.getState()).toEqual({ count: 2 });
    expect(travel.getPosition()).toBe(1);
    expect(travel.getHistory()).toEqual([{ count: 0 }, { count: 2 }]);
    expect(notifications).toBe(1);
  });

  it('cancels an active batch without archiving rejected changes', () => {
    const travel = createTimeTravel({ count: 0 });

    travel.beginBatch({ label: 'rejected' });
    travel.setState((draft) => {
      draft.count = 1;
    });
    travel.cancelBatch();

    expect(travel.getState()).toEqual({ count: 0 });
    expect(travel.getPosition()).toBe(0);
    expect(travel.getHistory()).toEqual([{ count: 0 }]);
  });

  it('restores nested batch frames without losing outer updates', () => {
    const travel = createTimeTravel({ count: 0 });

    travel.beginBatch({ label: 'outer' });
    travel.setState((draft) => { draft.count = 1; });
    travel.beginBatch({ label: 'nested' });
    travel.setState((draft) => { draft.count = 2; });
    travel.cancelBatch();
    expect(travel.getState()).toEqual({ count: 1 });
    travel.endBatch();

    expect(travel.getHistory()).toEqual([{ count: 0 }, { count: 1 }]);
  });

  it('rolls back a rejected synchronous batch', () => {
    const travel = createTimeTravel({ count: 0 });
    const listener = vi.fn();
    travel.subscribe(listener);

    expect(() => travel.batch(() => {
      travel.setState((draft) => { draft.count = 1; });
      throw new Error('sync rejection');
    })).toThrow('sync rejection');

    expect(travel.getState()).toEqual({ count: 0 });
    expect(travel.getPosition()).toBe(0);
    expect(travel.getHistory()).toEqual([{ count: 0 }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('rolls back a rejected asynchronous batch', async () => {
    const travel = createTimeTravel({ count: 0 });

    await expect(travel.batch(async () => {
      travel.setState((draft) => { draft.count = 1; });
      await Promise.resolve();
      throw new Error('async rejection');
    })).rejects.toThrow('async rejection');

    expect(travel.getState()).toEqual({ count: 0 });
    expect(travel.getPosition()).toBe(0);
    expect(travel.getHistory()).toEqual([{ count: 0 }]);
  });

  it('allows a caught nested rejection without committing its changes', () => {
    const travel = createTimeTravel({ count: 0 });

    travel.batch(() => {
      travel.setState((draft) => { draft.count = 1; });
      expect(() => travel.batch(() => {
        travel.setState((draft) => { draft.count = 2; });
        throw new Error('nested rejection');
      })).toThrow('nested rejection');
      expect(travel.getState()).toEqual({ count: 1 });
    });

    expect(travel.getState()).toEqual({ count: 1 });
    expect(travel.getHistory()).toEqual([{ count: 0 }, { count: 1 }]);
  });

  it('rejects invalid positions and step counts before applying patches', () => {
    const travel = createTimeTravel({ count: 0 });
    expect(() => travel.go(Number.NaN)).toThrow('safe integer');
    expect(() => travel.back(-1)).toThrow('safe integer');
    expect(() => travel.forward(Infinity)).toThrow('safe integer');
    expect(travel.getPosition()).toBe(0);
  });

  it('clamps back oversteps at the beginning of the retained history', () => {
    const empty = createTimeTravel({ count: 0 }, { maxHistory: 0 });
    expect(() => empty.back()).not.toThrow();
    expect(empty.getPosition()).toBe(0);
    expect(empty.getState()).toEqual({ count: 0 });

    const travel = createTimeTravel({ count: 0 }, { maxHistory: 2 });
    travel.setState((draft) => { draft.count = 1; });
    travel.setState((draft) => { draft.count = 2; });
    expect(() => travel.back(99)).not.toThrow();
    expect(travel.getPosition()).toBe(0);
    expect(travel.getState()).toEqual({ count: 0 });
  });

  it('does not fabricate a duplicate history entry when manual history is disabled', () => {
    const travel = createTimeTravel(
      { count: 0 },
      { autoArchive: false, maxHistory: 0 },
    );
    travel.setState((draft) => { draft.count = 1; });

    expect(travel.getHistory()).toEqual([{ count: 1 }]);
    expect(travel.getPatches().patches).toHaveLength(1);
    travel.archive();
    expect(travel.getHistory()).toEqual([{ count: 1 }]);
  });

  it('rejects invalid history bounds before creating a timeline', () => {
    for (const maxHistory of [Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
      expect(() => createTimeTravel({ count: 0 }, { maxHistory })).toThrow(
        'maxHistory must be a non-negative safe integer',
      );
    }
    for (const initialPosition of [Number.NaN, Number.POSITIVE_INFINITY, 1.5, -1]) {
      expect(() => createTimeTravel({ count: 0 }, { initialPosition })).toThrow(
        'initialPosition must be a non-negative safe integer',
      );
    }
  });

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

  it('isolates listener failures and validates the public subscribe boundary', () => {
    const errors: unknown[] = [];
    const travel = createTimeTravel(
      { count: 0 },
      { onListenerError: (error) => errors.push(error) },
    );
    const failed = vi.fn(() => { throw new Error('listener failed'); });
    const healthy = vi.fn();
    travel.subscribe(failed);
    travel.subscribe(healthy);

    expect(() => travel.setState((draft) => { draft.count = 1; })).not.toThrow();
    expect(travel.getState()).toEqual({ count: 1 });
    expect(failed).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(new Error('listener failed'));

    expect(() => (travel.subscribe as unknown as (listener: unknown) => void)(null)).toThrow(
      TypeError,
    );
  });

  it('preserves the mutable root reference when a batch is rejected', () => {
    const travel = createTimeTravel({ count: 0 }, { mutable: true });
    const root = travel.getState();

    expect(() => travel.batch(() => {
      travel.setState((draft) => { draft.count = 1; });
      throw new Error('rejected batch');
    })).toThrow('rejected batch');

    expect(travel.getState()).toBe(root);
    expect(root).toEqual({ count: 0 });
    expect(travel.getPosition()).toBe(0);
    expect(travel.getHistory()).toEqual([{ count: 0 }]);
  });

  it.each([false, true])('returns defensive history entries in mutable=%s mode', (mutable) => {
    const travel = createTimeTravel(
      { nested: { count: 0 } },
      { mutable },
    );
    travel.setState((draft) => { draft.nested.count = 1; });

    const history = travel.getHistory();
    (history[1] as { nested: { count: number } }).nested.count = 9;
    (history[0] as { nested: { count: number } }).nested.count = 8;

    expect(travel.getState()).toEqual({ nested: { count: 1 } });
    expect(travel.getHistory()).toEqual([
      { nested: { count: 0 } },
      { nested: { count: 1 } },
    ]);
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
