import React, { type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { act } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import {
  useStoreValue,
  useStoreValues,
} from '../../../src/stores/hooks/useStoreValue';

async function renderAndHydrate(
  element: ReactElement,
  afterServerRender?: () => void,
) {
  const container = document.createElement('div');
  const recoverableErrors: unknown[] = [];
  container.innerHTML = renderToString(element);
  afterServerRender?.();
  document.body.appendChild(container);

  let root: Root | undefined;
  await act(async () => {
    root = hydrateRoot(container, element, {
      onRecoverableError: (error) => recoverableErrors.push(error),
    });
  });

  return {
    container,
    recoverableErrors,
    async cleanup() {
      if (root) {
        await act(async () => root?.unmount());
      }
      container.remove();
    },
  };
}

describe('useStoreValue server snapshots', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('hydrates an object selector without React snapshot warnings', async () => {
    const store = createStore('ssr-object-selector', {
      user: { name: 'Ada', role: 'admin' },
    });

    function ObjectSelectorView() {
      const user = useStoreValue(store, (state) => ({
        name: state.user.name,
        role: state.user.role,
      }));

      return <p>{user.name}:{user.role}</p>;
    }

    const hydration = await renderAndHydrate(<ObjectSelectorView />);

    expect(hydration.container.textContent).toBe('Ada:admin');
    await hydration.cleanup();
    store.dispose();

    expect(hydration.recoverableErrors).toEqual([]);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('hydrates useStoreValues without React snapshot warnings', async () => {
    const store = createStore('ssr-store-values', {
      count: 3,
      label: 'ready',
    });
    const selectors = {
      count: (state: { count: number; label: string }) => state.count,
      label: (state: { count: number; label: string }) => state.label,
    };

    function StoreValuesView() {
      const values = useStoreValues(store, selectors);

      return <p>{values?.label}:{values?.count}</p>;
    }

    const hydration = await renderAndHydrate(<StoreValuesView />);

    expect(hydration.container.textContent).toBe('ready:3');
    await hydration.cleanup();
    store.dispose();

    expect(hydration.recoverableErrors).toEqual([]);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('releases the server-only snapshot cache after hydration commits', async () => {
    const store = createStore('ssr-cache-lifecycle', {
      user: { name: 'Ada', role: 'admin' },
    });
    const initialSnapshot = store.getSnapshot();
    const capturedRefs: Array<{ current: unknown }> = [];
    const originalUseRef = React.useRef;
    const useRefSpy = jest.spyOn(React, 'useRef').mockImplementation((
      (initialValue: unknown) => {
        const ref = originalUseRef(initialValue);
        capturedRefs.push(ref as { current: unknown });
        return ref;
      }
    ) as typeof React.useRef);

    function CacheLifecycleView() {
      const user = useStoreValue(store, (state) => ({
        name: state.user.name,
        role: state.user.role,
      }));

      return <p>{user.name}:{user.role}</p>;
    }

    let hydration: Awaited<ReturnType<typeof renderAndHydrate>> | undefined;
    try {
      hydration = await renderAndHydrate(
        <CacheLifecycleView />,
        () => {
          // Server hook state is unrelated to the client hydration lifetime.
          capturedRefs.length = 0;
        },
      );

      expect(hydration.container.textContent).toBe('Ada:admin');
      expect(capturedRefs.some(ref => {
        const current = ref.current;
        return typeof current === 'object'
          && current !== null
          && 'sourceSnapshot' in current
          && current.sourceSnapshot === initialSnapshot;
      })).toBe(false);
    } finally {
      useRefSpy.mockRestore();
      await hydration?.cleanup();
      store.dispose();
    }

    expect(hydration?.recoverableErrors).toEqual([]);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
