/**
 * @fileoverview Tests for path-based subscription hooks
 * Tests useStorePath and useStoreSelectorWithPaths functionality
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Store, createStore } from '../../../src/stores/core/Store';
import { useStorePath, useStoreSelectorWithPaths } from '../../../src/stores/hooks/useStorePath';

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Type helper for store state
type TestStoreState = { user: { name: string; age: number }; settings: { theme: string } };
type SelectorStoreState = { user: { firstName: string; lastName: string; age: number }; settings: { theme: string } };

describe('Store subscribeWithPatches', () => {
  let store: Store<TestStoreState>;

  beforeEach(() => {
    store = createStore('patch-test', {
      user: { name: 'John', age: 30 },
      settings: { theme: 'light' }
    });
  });

  afterEach(() => {
    store.dispose();
  });

  it('should call patch-aware listeners with patches on setValue', async () => {
    const patchListener = jest.fn();
    store.subscribeWithPatches(patchListener);

    act(() => {
      store.setValue({
        user: { name: 'Jane', age: 30 },
        settings: { theme: 'light' }
      });
    });

    await waitFor(() => {
      expect(patchListener).toHaveBeenCalled();
    });

    const patches = patchListener.mock.calls[0][0];
    expect(patches).toBeDefined();
    expect(Array.isArray(patches)).toBe(true);
  });

  it('should call patch-aware listeners with patches on update', async () => {
    const patchListener = jest.fn();
    store.subscribeWithPatches(patchListener);

    act(() => {
      store.update(draft => {
        draft.user.name = 'Jane';
        return draft;
      });
    });

    await waitFor(() => {
      expect(patchListener).toHaveBeenCalled();
    });

    const patches = patchListener.mock.calls[0][0];
    expect(patches).toBeDefined();
  });

  it('should return unsubscribe function', () => {
    const patchListener = jest.fn();
    const unsubscribe = store.subscribeWithPatches(patchListener);

    expect(typeof unsubscribe).toBe('function');

    unsubscribe();

    act(() => {
      store.setValue({
        user: { name: 'Jane', age: 30 },
        settings: { theme: 'light' }
      });
    });

    // Listener should not be called after unsubscribe
    expect(patchListener).not.toHaveBeenCalled();
  });

  it('should track last patches via getLastPatches', async () => {
    // Initially null
    expect(store.getLastPatches()).toBeNull();

    act(() => {
      store.update(draft => {
        draft.user.name = 'Jane';
        return draft;
      });
    });

    await waitFor(() => {
      const lastPatches = store.getLastPatches();
      expect(lastPatches).toBeDefined();
      expect(Array.isArray(lastPatches)).toBe(true);
    });
  });
});

describe('useStorePath', () => {
  let store: Store<TestStoreState>;

  beforeEach(() => {
    store = createStore('path-hook-test', {
      user: { name: 'John', age: 30 },
      settings: { theme: 'light' }
    });
  });

  afterEach(() => {
    store.dispose();
  });

  it('should return value at specified path', () => {
    function TestComponent() {
      const name = useStorePath<TestStoreState, string>(store, ['user', 'name']);
      return <div data-testid="name">{name}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('John');
  });

  it('should return nested object at path', () => {
    function TestComponent() {
      const user = useStorePath<TestStoreState, { name: string; age: number }>(store, ['user']);
      return <div data-testid="user">{JSON.stringify(user)}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('user').textContent).toBe('{"name":"John","age":30}');
  });

  it('should re-render when subscribed path changes', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const name = useStorePath<TestStoreState, string>(store, ['user', 'name']);
      return <div data-testid="name">{name}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('John');
    const initialRenderCount = renderCount.current;

    act(() => {
      store.update(draft => {
        draft.user.name = 'Jane';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Jane');
    });

    expect(renderCount.current).toBeGreaterThan(initialRenderCount);
  });

  it('should NOT re-render when unrelated path changes', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const name = useStorePath<TestStoreState, string>(store, ['user', 'name']);
      return <div data-testid="name">{name}</div>;
    }

    render(<TestComponent />);
    const initialRenderCount = renderCount.current;

    // Change settings.theme (unrelated to user.name)
    act(() => {
      store.update(draft => {
        draft.settings.theme = 'dark';
        return draft;
      });
    });

    // Wait a bit for any potential re-renders
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should not re-render because user.name didn't change
    expect(renderCount.current).toBe(initialRenderCount);
    expect(screen.getByTestId('name').textContent).toBe('John');
  });

  it('should re-render when parent path changes', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const name = useStorePath<TestStoreState, string>(store, ['user', 'name']);
      return <div data-testid="name">{name}</div>;
    }

    render(<TestComponent />);
    const initialRenderCount = renderCount.current;

    // Change entire user object (parent of user.name)
    act(() => {
      store.update(draft => {
        draft.user = { name: 'Jane', age: 25 };
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Jane');
    });

    expect(renderCount.current).toBeGreaterThan(initialRenderCount);
  });

  it('should handle array index paths', () => {
    const listStore = createStore('list-store', {
      items: ['a', 'b', 'c']
    });

    function TestComponent() {
      const firstItem = useStorePath<{ items: string[] }, string>(listStore, ['items', 0]);
      return <div data-testid="item">{firstItem}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('item').textContent).toBe('a');

    listStore.dispose();
  });

  it('should return undefined for non-existent paths', () => {
    function TestComponent() {
      const value = useStorePath(store, ['nonexistent', 'path'] as any);
      return <div data-testid="value">{value === undefined ? 'undefined' : String(value)}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('value').textContent).toBe('undefined');
  });

  it('should work with custom equality function', async () => {
    type PositionState = { player: { position: { x: number; y: number } } };
    const positionStore = createStore<PositionState>('position-store', {
      player: { position: { x: 0, y: 0 } }
    });

    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const position = useStorePath<PositionState, { x: number; y: number }>(positionStore, ['player', 'position'], {
        equalityFn: (a, b) => a?.x === b?.x && a?.y === b?.y
      });
      return <div data-testid="pos">{position ? `${position.x},${position.y}` : 'null'}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('pos').textContent).toBe('0,0');
    const initialRenderCount = renderCount.current;

    // Update with same x,y values but new object
    act(() => {
      positionStore.update(draft => {
        draft.player.position = { x: 0, y: 0 };
        return draft;
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should not re-render due to custom equality
    expect(renderCount.current).toBe(initialRenderCount);

    positionStore.dispose();
  });
});

describe('useStoreSelectorWithPaths', () => {
  let store: Store<SelectorStoreState>;

  beforeEach(() => {
    store = createStore('selector-path-test', {
      user: { firstName: 'John', lastName: 'Doe', age: 30 },
      settings: { theme: 'light' }
    });
  });

  afterEach(() => {
    store.dispose();
  });

  it('should return selected value', () => {
    function TestComponent() {
      const fullName = useStoreSelectorWithPaths(
        store,
        (state) => `${state.user.firstName} ${state.user.lastName}`,
        { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
      );
      return <div data-testid="name">{fullName}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('John Doe');
  });

  it('should re-render when dependent path changes', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const fullName = useStoreSelectorWithPaths(
        store,
        (state) => `${state.user.firstName} ${state.user.lastName}`,
        { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
      );
      return <div data-testid="name">{fullName}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('John Doe');
    const initialRenderCount = renderCount.current;

    act(() => {
      store.update(draft => {
        draft.user.firstName = 'Jane';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Jane Doe');
    });

    expect(renderCount.current).toBeGreaterThan(initialRenderCount);
  });

  it('should NOT re-render when non-dependent path changes', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const fullName = useStoreSelectorWithPaths(
        store,
        (state) => `${state.user.firstName} ${state.user.lastName}`,
        { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
      );
      return <div data-testid="name">{fullName}</div>;
    }

    render(<TestComponent />);
    const initialRenderCount = renderCount.current;

    // Change user.age (not in dependsOn)
    act(() => {
      store.update(draft => {
        draft.user.age = 31;
        return draft;
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should not re-render
    expect(renderCount.current).toBe(initialRenderCount);
  });

  it('should NOT re-render when completely unrelated path changes', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const fullName = useStoreSelectorWithPaths(
        store,
        (state) => `${state.user.firstName} ${state.user.lastName}`,
        { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
      );
      return <div data-testid="name">{fullName}</div>;
    }

    render(<TestComponent />);
    const initialRenderCount = renderCount.current;

    // Change settings.theme (completely unrelated)
    act(() => {
      store.update(draft => {
        draft.settings.theme = 'dark';
        return draft;
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should not re-render
    expect(renderCount.current).toBe(initialRenderCount);
  });

  it('should work without dependsOn (subscribes to all changes)', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      // Use a selector that returns a primitive (string) to avoid reference issues
      const theme = useStoreSelectorWithPaths(
        store,
        (state) => state.settings.theme
        // No dependsOn - subscribes to all changes
      );
      return <div data-testid="theme">{theme}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('theme').textContent).toBe('light');
    const initialRenderCount = renderCount.current;

    // Change the subscribed path
    act(() => {
      store.update(draft => {
        draft.settings.theme = 'dark';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    // Should have re-rendered
    expect(renderCount.current).toBeGreaterThan(initialRenderCount);
  });

  it('should work with custom equality function', async () => {
    const renderCount = { current: 0 };

    function TestComponent() {
      renderCount.current++;
      const user = useStoreSelectorWithPaths(
        store,
        (state) => ({ first: state.user.firstName, last: state.user.lastName }),
        {
          dependsOn: [['user', 'firstName'], ['user', 'lastName']],
          equalityFn: (a, b) => a.first === b.first && a.last === b.last
        }
      );
      return <div data-testid="name">{`${user.first} ${user.last}`}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('John Doe');
    const initialRenderCount = renderCount.current;

    // Update with same values
    act(() => {
      store.update(draft => {
        draft.user.firstName = 'John';
        draft.user.lastName = 'Doe';
        return draft;
      });
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should not re-render due to custom equality
    expect(renderCount.current).toBe(initialRenderCount);
  });

  it('should handle complex computed values', () => {
    type CartState = {
      items: { name: string; price: number; qty: number }[];
      discount: number;
    };

    const cartStore = createStore<CartState>('cart-store', {
      items: [
        { name: 'Apple', price: 1.5, qty: 3 },
        { name: 'Banana', price: 0.5, qty: 5 }
      ],
      discount: 0.1
    });

    function TestComponent() {
      const summary = useStoreSelectorWithPaths(
        cartStore,
        (state) => {
          const subtotal = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
          return {
            itemCount: state.items.length,
            subtotal,
            total: subtotal * (1 - state.discount)
          };
        },
        {
          dependsOn: [['items'], ['discount']],
          // Need equality function since selector returns new object each time
          equalityFn: (a, b) =>
            a.itemCount === b.itemCount &&
            a.subtotal === b.subtotal &&
            a.total === b.total
        }
      );
      return (
        <div data-testid="summary">
          {`${summary.itemCount} items, $${summary.total.toFixed(2)}`}
        </div>
      );
    }

    render(<TestComponent />);
    // (1.5*3 + 0.5*5) = 7.0, with 10% discount = 6.30
    expect(screen.getByTestId('summary').textContent).toBe('2 items, $6.30');

    cartStore.dispose();
  });
});

describe('Path matching logic', () => {
  it('should correctly identify when patches affect subscribed paths', async () => {
    type DeepState = {
      a: {
        b: { c: string };
        d: string;
      };
      e: string;
    };

    const store = createStore<DeepState>('path-match-test', {
      a: {
        b: { c: 'value' },
        d: 'other'
      },
      e: 'unrelated'
    });

    const renderCounts = {
      abc: 0,
      ab: 0,
      ad: 0,
      e: 0
    };

    function ABCComponent() {
      renderCounts.abc++;
      const value = useStorePath<DeepState, string>(store, ['a', 'b', 'c']);
      return <span data-testid="abc">{value}</span>;
    }

    function ABComponent() {
      renderCounts.ab++;
      const value = useStorePath<DeepState, { c: string }>(store, ['a', 'b']);
      return <span data-testid="ab">{JSON.stringify(value)}</span>;
    }

    function ADComponent() {
      renderCounts.ad++;
      const value = useStorePath<DeepState, string>(store, ['a', 'd']);
      return <span data-testid="ad">{value}</span>;
    }

    function EComponent() {
      renderCounts.e++;
      const value = useStorePath<DeepState, string>(store, ['e']);
      return <span data-testid="e">{value}</span>;
    }

    render(
      <>
        <ABCComponent />
        <ABComponent />
        <ADComponent />
        <EComponent />
      </>
    );

    const initialCounts = { ...renderCounts };

    // Change a.b.c - should affect abc and ab, not ad or e
    act(() => {
      store.update(draft => {
        draft.a.b.c = 'new-value';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('abc').textContent).toBe('new-value');
    });

    // abc should re-render (exact match)
    expect(renderCounts.abc).toBeGreaterThan(initialCounts.abc);
    // ab should re-render (child changed)
    expect(renderCounts.ab).toBeGreaterThan(initialCounts.ab);
    // ad should NOT re-render (sibling)
    expect(renderCounts.ad).toBe(initialCounts.ad);
    // e should NOT re-render (unrelated)
    expect(renderCounts.e).toBe(initialCounts.e);

    store.dispose();
  });
});
