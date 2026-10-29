import { act, renderHook } from '@testing-library/react';
import { createBackendStore } from '@context-action/react/backend';
import { useStorePath, useStoreValue } from '@context-action/react';
// Explicit workspace-only prototype, not a public package subpath.
import { createTravelsV3Backend } from '../../../../mutative/examples/travels-v3/backend';

type State = { count: number; label: string };
const nativeStructuredClone = globalThis.structuredClone;

beforeAll(() => {
  // jsdom does not supply structuredClone. These fixtures are durable JSON;
  // production code still requires the native Node/modern-browser capability.
  if (!globalThis.structuredClone) {
    globalThis.structuredClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  }
});

afterAll(() => {
  if (nativeStructuredClone) globalThis.structuredClone = nativeStructuredClone;
  else Reflect.deleteProperty(globalThis, 'structuredClone');
});

describe('Travels v3 workspace prototype through the existing React backend boundary', () => {
  it('reacts to writes, grouped commits and undo/redo without changing the React API', async () => {
    const backend = createTravelsV3Backend('react-experiment', { count: 0, label: 'initial' });
    const store = createBackendStore('react-experiment', backend);
    const { result, unmount } = renderHook(() => useStoreValue(store));
    try {
      expect(result.current.count).toBe(0);
      await act(async () => { store.update(draft => { draft.count = 1; return undefined; }); });
      expect(result.current.count).toBe(1);
      await act(async () => {
        backend.batch(() => {
          backend.update(draft => { draft.count += 1; return undefined; });
          backend.update(draft => { draft.count += 1; return undefined; });
        });
      });
      expect(result.current.count).toBe(3);
      await act(async () => { backend.undo(); });
      expect(result.current.count).toBe(1);
      await act(async () => { backend.redo(); });
      expect(result.current.count).toBe(3);
    } finally {
      unmount();
      store.dispose();
      backend.dispose();
    }
  });

  it('uses transition patches to skip unrelated path updates', async () => {
    const backend = createTravelsV3Backend('path-experiment', { count: 0, label: 'initial' });
    const store = createBackendStore('path-experiment', backend);
    let renders = 0;
    const { result, unmount } = renderHook(() => {
      renders += 1;
      return useStorePath<State, number>(store, ['count']);
    });
    try {
      const before = renders;
      await act(async () => { backend.update(draft => { draft.label = 'other'; return undefined; }); });
      expect(result.current).toBe(0);
      expect(renders).toBe(before);
      await act(async () => { backend.update(draft => { draft.count = 1; return undefined; }); });
      expect(result.current).toBe(1);
    } finally {
      unmount();
      store.dispose();
      backend.dispose();
    }
  });

  it.each(['shared', 'owned'] as const)('honors the existing %s backend ownership option', ownership => {
    const backend = createTravelsV3Backend('ownership-experiment', { count: 0 });
    const store = createBackendStore('ownership-experiment', backend, { ownership });
    store.dispose();
    expect(backend.isDisposed()).toBe(ownership === 'owned');
    backend.dispose();
  });
});
