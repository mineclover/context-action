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

describe('Array mutation scenarios', () => {
  it('should handle array push correctly', async () => {
    type ListState = { items: number[] };
    const store = createStore<ListState>('push-test', { items: [1, 2, 3] });

    const renderCounts = { array: 0, firstItem: 0 };

    function ArrayComponent() {
      renderCounts.array++;
      const items = useStorePath<ListState, number[]>(store, ['items']);
      return <span data-testid="array">{JSON.stringify(items)}</span>;
    }

    function FirstItemComponent() {
      renderCounts.firstItem++;
      const first = useStorePath<ListState, number>(store, ['items', 0]);
      return <span data-testid="first">{first}</span>;
    }

    render(
      <>
        <ArrayComponent />
        <FirstItemComponent />
      </>
    );

    expect(screen.getByTestId('array').textContent).toBe('[1,2,3]');
    const initialCounts = { ...renderCounts };

    // Push a new item
    act(() => {
      store.update(draft => {
        draft.items.push(4);
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('array').textContent).toBe('[1,2,3,4]');
    });

    // Array subscription should re-render
    expect(renderCounts.array).toBeGreaterThan(initialCounts.array);
    // First item subscription should NOT re-render (index 0 unchanged)
    expect(renderCounts.firstItem).toBe(initialCounts.firstItem);

    store.dispose();
  });

  it('should handle array unshift correctly', async () => {
    type ListState = { items: number[] };
    const store = createStore<ListState>('unshift-test', { items: [1, 2, 3] });

    const renderCounts = { array: 0, firstItem: 0, secondItem: 0 };

    function ArrayComponent() {
      renderCounts.array++;
      const items = useStorePath<ListState, number[]>(store, ['items']);
      return <span data-testid="array">{JSON.stringify(items)}</span>;
    }

    function FirstItemComponent() {
      renderCounts.firstItem++;
      const first = useStorePath<ListState, number>(store, ['items', 0]);
      return <span data-testid="first">{first}</span>;
    }

    function SecondItemComponent() {
      renderCounts.secondItem++;
      const second = useStorePath<ListState, number>(store, ['items', 1]);
      return <span data-testid="second">{second}</span>;
    }

    render(
      <>
        <ArrayComponent />
        <FirstItemComponent />
        <SecondItemComponent />
      </>
    );

    expect(screen.getByTestId('first').textContent).toBe('1');
    const initialCounts = { ...renderCounts };

    // Unshift shifts all indices
    act(() => {
      store.update(draft => {
        draft.items.unshift(0);
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('first').textContent).toBe('0');
    });

    // All subscriptions should re-render due to index shifts
    expect(renderCounts.array).toBeGreaterThan(initialCounts.array);
    expect(renderCounts.firstItem).toBeGreaterThan(initialCounts.firstItem);
    expect(renderCounts.secondItem).toBeGreaterThan(initialCounts.secondItem);

    store.dispose();
  });

  it('should handle array splice correctly', async () => {
    type ListState = { items: string[] };
    const store = createStore<ListState>('splice-test', { items: ['a', 'b', 'c', 'd'] });

    const renderCounts = { array: 0, index1: 0, index3: 0 };

    function ArrayComponent() {
      renderCounts.array++;
      const items = useStorePath<ListState, string[]>(store, ['items']);
      return <span data-testid="array">{JSON.stringify(items)}</span>;
    }

    function Index1Component() {
      renderCounts.index1++;
      const item = useStorePath<ListState, string>(store, ['items', 1]);
      return <span data-testid="index1">{item}</span>;
    }

    function Index3Component() {
      renderCounts.index3++;
      const item = useStorePath<ListState, string>(store, ['items', 3]);
      return <span data-testid="index3">{item}</span>;
    }

    render(
      <>
        <ArrayComponent />
        <Index1Component />
        <Index3Component />
      </>
    );

    expect(screen.getByTestId('index1').textContent).toBe('b');
    const initialCounts = { ...renderCounts };

    // Remove 'b' and 'c' (indices 1 and 2)
    act(() => {
      store.update(draft => {
        draft.items.splice(1, 2);
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('array').textContent).toBe('["a","d"]');
    });

    // Array and affected indices should re-render
    expect(renderCounts.array).toBeGreaterThan(initialCounts.array);
    expect(renderCounts.index1).toBeGreaterThan(initialCounts.index1);

    store.dispose();
  });

  it('should handle array item property change', async () => {
    type ListState = { items: Array<{ id: number; name: string }> };
    const store = createStore<ListState>('item-prop-test', {
      items: [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' }
      ]
    });

    const renderCounts = { itemName: 0, otherId: 0 };

    function ItemNameComponent() {
      renderCounts.itemName++;
      const name = useStorePath<ListState, string>(store, ['items', 0, 'name']);
      return <span data-testid="name">{name}</span>;
    }

    function OtherIdComponent() {
      renderCounts.otherId++;
      const id = useStorePath<ListState, number>(store, ['items', 1, 'id']);
      return <span data-testid="id">{id}</span>;
    }

    render(
      <>
        <ItemNameComponent />
        <OtherIdComponent />
      </>
    );

    expect(screen.getByTestId('name').textContent).toBe('first');
    const initialCounts = { ...renderCounts };

    // Change only items[0].name
    act(() => {
      store.update(draft => {
        draft.items[0]!.name = 'updated';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('updated');
    });

    // Only items[0].name subscription should re-render
    expect(renderCounts.itemName).toBeGreaterThan(initialCounts.itemName);
    // items[1].id should NOT re-render
    expect(renderCounts.otherId).toBe(initialCounts.otherId);

    store.dispose();
  });
});

describe('Nested array scenarios', () => {
  it('should handle matrix cell changes', async () => {
    type MatrixState = { board: number[][] };
    const store = createStore<MatrixState>('matrix-test', {
      board: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]
    });

    const renderCounts = { cell: 0, row: 0, otherCell: 0 };

    function CellComponent() {
      renderCounts.cell++;
      const cell = useStorePath<MatrixState, number>(store, ['board', 1, 1]);
      return <span data-testid="cell">{cell}</span>;
    }

    function RowComponent() {
      renderCounts.row++;
      const row = useStorePath<MatrixState, number[]>(store, ['board', 1]);
      return <span data-testid="row">{JSON.stringify(row)}</span>;
    }

    function OtherCellComponent() {
      renderCounts.otherCell++;
      const cell = useStorePath<MatrixState, number>(store, ['board', 0, 0]);
      return <span data-testid="other">{cell}</span>;
    }

    render(
      <>
        <CellComponent />
        <RowComponent />
        <OtherCellComponent />
      </>
    );

    expect(screen.getByTestId('cell').textContent).toBe('5');
    const initialCounts = { ...renderCounts };

    // Change center cell
    act(() => {
      store.update(draft => {
        draft.board[1]![1] = 99;
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('cell').textContent).toBe('99');
    });

    // Cell and row should re-render
    expect(renderCounts.cell).toBeGreaterThan(initialCounts.cell);
    expect(renderCounts.row).toBeGreaterThan(initialCounts.row);
    // Other cell should NOT re-render
    expect(renderCounts.otherCell).toBe(initialCounts.otherCell);

    store.dispose();
  });

  it('should handle deeply nested array in object', async () => {
    type ComplexState = {
      users: Array<{
        id: number;
        profile: { tags: string[] };
      }>;
    };

    const store = createStore<ComplexState>('complex-test', {
      users: [
        { id: 1, profile: { tags: ['admin', 'active'] } },
        { id: 2, profile: { tags: ['user'] } }
      ]
    });

    const renderCounts = { tag: 0, otherUserTags: 0 };

    function TagComponent() {
      renderCounts.tag++;
      const tag = useStorePath<ComplexState, string>(store, ['users', 0, 'profile', 'tags', 1]);
      return <span data-testid="tag">{tag}</span>;
    }

    function OtherUserTagsComponent() {
      renderCounts.otherUserTags++;
      const tags = useStorePath<ComplexState, string[]>(store, ['users', 1, 'profile', 'tags']);
      return <span data-testid="otherTags">{JSON.stringify(tags)}</span>;
    }

    render(
      <>
        <TagComponent />
        <OtherUserTagsComponent />
      </>
    );

    expect(screen.getByTestId('tag').textContent).toBe('active');
    const initialCounts = { ...renderCounts };

    // Change users[0].profile.tags[1]
    act(() => {
      store.update(draft => {
        draft.users[0]!.profile.tags[1] = 'inactive';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('tag').textContent).toBe('inactive');
    });

    // Only the specific tag should re-render
    expect(renderCounts.tag).toBeGreaterThan(initialCounts.tag);
    // Other user's tags should NOT re-render
    expect(renderCounts.otherUserTags).toBe(initialCounts.otherUserTags);

    store.dispose();
  });
});

describe('Edge cases', () => {
  it('should handle empty array', () => {
    type EmptyState = { items: never[] };
    const store = createStore<EmptyState>('empty-test', { items: [] });

    function TestComponent() {
      const items = useStorePath<EmptyState, never[]>(store, ['items']);
      return <span data-testid="items">{items.length}</span>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('items').textContent).toBe('0');

    store.dispose();
  });

  it('should handle null values in path', () => {
    type NullableState = { user: { name: string | null } };
    const store = createStore<NullableState>('null-test', { user: { name: null } });

    function TestComponent() {
      const name = useStorePath<NullableState, string | null>(store, ['user', 'name']);
      return <span data-testid="name">{name === null ? 'null' : name}</span>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('null');

    store.dispose();
  });

  it('should handle undefined intermediate path', () => {
    type PartialState = { user?: { profile?: { name: string } } };
    const store = createStore<PartialState>('partial-test', {});

    function TestComponent() {
      const name = useStorePath<PartialState, string | undefined>(
        store,
        ['user', 'profile', 'name'] as any
      );
      return <span data-testid="name">{name ?? 'undefined'}</span>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('undefined');

    store.dispose();
  });

  it('should handle root path subscription', async () => {
    type SimpleState = { count: number };
    const store = createStore<SimpleState>('root-test', { count: 0 });

    let renderCount = 0;

    function TestComponent() {
      renderCount++;
      const state = useStorePath<SimpleState, SimpleState>(store, []);
      return <span data-testid="count">{state.count}</span>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('count').textContent).toBe('0');
    const initialRenderCount = renderCount;

    act(() => {
      store.update(draft => {
        draft.count = 1;
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('1');
    });

    // Root subscription should re-render on any change
    expect(renderCount).toBeGreaterThan(initialRenderCount);

    store.dispose();
  });

  it('should handle special characters in object keys', () => {
    type SpecialState = { 'user-data': { 'first.name': string } };
    const store = createStore<SpecialState>('special-key-test', {
      'user-data': { 'first.name': 'John' }
    });

    function TestComponent() {
      const name = useStorePath<SpecialState, string>(store, ['user-data', 'first.name']);
      return <span data-testid="name">{name}</span>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('name').textContent).toBe('John');

    store.dispose();
  });

  it('should handle numeric string keys vs array indices', async () => {
    type MixedState = { data: { '0': string; items: string[] } };
    const store = createStore<MixedState>('mixed-test', {
      data: { '0': 'object-key', items: ['array-item'] }
    });

    const renderCounts = { objectKey: 0, arrayItem: 0 };

    function ObjectKeyComponent() {
      renderCounts.objectKey++;
      const value = useStorePath<MixedState, string>(store, ['data', '0']);
      return <span data-testid="obj">{value}</span>;
    }

    function ArrayItemComponent() {
      renderCounts.arrayItem++;
      const value = useStorePath<MixedState, string>(store, ['data', 'items', 0]);
      return <span data-testid="arr">{value}</span>;
    }

    render(
      <>
        <ObjectKeyComponent />
        <ArrayItemComponent />
      </>
    );

    expect(screen.getByTestId('obj').textContent).toBe('object-key');
    expect(screen.getByTestId('arr').textContent).toBe('array-item');
    const initialCounts = { ...renderCounts };

    // Change only the object key '0'
    act(() => {
      store.update(draft => {
        draft.data['0'] = 'updated';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('obj').textContent).toBe('updated');
    });

    // Object key should re-render
    expect(renderCounts.objectKey).toBeGreaterThan(initialCounts.objectKey);
    // Array item should NOT re-render (different path)
    expect(renderCounts.arrayItem).toBe(initialCounts.arrayItem);

    store.dispose();
  });

  it('should handle keys with special characters (slash and tilde)', async () => {
    // JSON Pointer (RFC 6901) requires escaping: '~' → '~0', '/' → '~1'
    type SpecialState = {
      'path/with/slash': { value: string };
      'tilde~char': { value: string };
      normal: { value: string };
    };
    const store = createStore<SpecialState>('special-chars-test', {
      'path/with/slash': { value: 'slash-value' },
      'tilde~char': { value: 'tilde-value' },
      normal: { value: 'normal-value' }
    });

    const renderCounts = { slash: 0, tilde: 0, normal: 0 };

    function SlashComponent() {
      renderCounts.slash++;
      const value = useStorePath<SpecialState, string>(store, ['path/with/slash', 'value']);
      return <span data-testid="slash">{value}</span>;
    }

    function TildeComponent() {
      renderCounts.tilde++;
      const value = useStorePath<SpecialState, string>(store, ['tilde~char', 'value']);
      return <span data-testid="tilde">{value}</span>;
    }

    function NormalComponent() {
      renderCounts.normal++;
      const value = useStorePath<SpecialState, string>(store, ['normal', 'value']);
      return <span data-testid="normal">{value}</span>;
    }

    render(
      <>
        <SlashComponent />
        <TildeComponent />
        <NormalComponent />
      </>
    );

    expect(screen.getByTestId('slash').textContent).toBe('slash-value');
    expect(screen.getByTestId('tilde').textContent).toBe('tilde-value');
    expect(screen.getByTestId('normal').textContent).toBe('normal-value');
    const initialCounts = { ...renderCounts };

    // Change only the slash key
    act(() => {
      store.update(draft => {
        draft['path/with/slash'].value = 'updated-slash';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('slash').textContent).toBe('updated-slash');
    });

    // Only slash should re-render
    expect(renderCounts.slash).toBeGreaterThan(initialCounts.slash);
    expect(renderCounts.tilde).toBe(initialCounts.tilde);
    expect(renderCounts.normal).toBe(initialCounts.normal);

    store.dispose();
  });

  it('should NOT match similar path names (boundary check)', async () => {
    // '/user' should NOT match '/users' - proper boundary handling
    type BoundaryState = {
      user: { name: string };
      users: { count: number };
      userName: string;
    };
    const store = createStore<BoundaryState>('boundary-test', {
      user: { name: 'John' },
      users: { count: 10 },
      userName: 'jane'
    });

    const renderCounts = { user: 0, users: 0, userName: 0 };

    function UserComponent() {
      renderCounts.user++;
      const value = useStorePath<BoundaryState, { name: string }>(store, ['user']);
      return <span data-testid="user">{value.name}</span>;
    }

    function UsersComponent() {
      renderCounts.users++;
      const value = useStorePath<BoundaryState, { count: number }>(store, ['users']);
      return <span data-testid="users">{value.count}</span>;
    }

    function UserNameComponent() {
      renderCounts.userName++;
      const value = useStorePath<BoundaryState, string>(store, ['userName']);
      return <span data-testid="userName">{value}</span>;
    }

    render(
      <>
        <UserComponent />
        <UsersComponent />
        <UserNameComponent />
      </>
    );

    expect(screen.getByTestId('user').textContent).toBe('John');
    expect(screen.getByTestId('users').textContent).toBe('10');
    expect(screen.getByTestId('userName').textContent).toBe('jane');
    const initialCounts = { ...renderCounts };

    // Change only 'user'
    act(() => {
      store.update(draft => {
        draft.user.name = 'Jane';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Jane');
    });

    // Only 'user' should re-render, NOT 'users' or 'userName'
    expect(renderCounts.user).toBeGreaterThan(initialCounts.user);
    expect(renderCounts.users).toBe(initialCounts.users);
    expect(renderCounts.userName).toBe(initialCounts.userName);

    store.dispose();
  });
});

describe('Stability tests', () => {
  it('should invalidate cache when path changes', async () => {
    type MultiPathState = {
      pathA: { value: string };
      pathB: { value: string };
    };
    const store = createStore<MultiPathState>('cache-invalidation-test', {
      pathA: { value: 'valueA' },
      pathB: { value: 'valueB' }
    });

    // Component that can switch paths
    function DynamicPathComponent({ path }: { path: ['pathA', 'value'] | ['pathB', 'value'] }) {
      const value = useStorePath<MultiPathState, string>(store, path);
      return <span data-testid="value">{value}</span>;
    }

    // Start with pathA
    const { rerender } = render(<DynamicPathComponent path={['pathA', 'value']} />);
    expect(screen.getByTestId('value').textContent).toBe('valueA');

    // Switch to pathB - cache should be invalidated and new value returned
    rerender(<DynamicPathComponent path={['pathB', 'value']} />);
    expect(screen.getByTestId('value').textContent).toBe('valueB');

    // Switch back to pathA
    rerender(<DynamicPathComponent path={['pathA', 'value']} />);
    expect(screen.getByTestId('value').textContent).toBe('valueA');

    store.dispose();
  });

  it('should handle path array reference changes with same values (stability)', async () => {
    type SimpleState = { user: { name: string } };
    const store = createStore<SimpleState>('path-ref-test', {
      user: { name: 'John' }
    });

    let renderCount = 0;
    let subscribeCount = 0;

    // Mock subscribe to track subscription calls
    const originalSubscribeWithPatches = store.subscribeWithPatches.bind(store);
    store.subscribeWithPatches = (listener) => {
      subscribeCount++;
      return originalSubscribeWithPatches(listener);
    };

    function TestComponent({ path }: { path: (string | number)[] }) {
      renderCount++;
      const value = useStorePath<SimpleState, string>(store, path);
      return <span data-testid="name">{value}</span>;
    }

    // Initial render with path
    const { rerender } = render(<TestComponent path={['user', 'name']} />);
    expect(screen.getByTestId('name').textContent).toBe('John');
    const initialRenderCount = renderCount;
    const initialSubscribeCount = subscribeCount;

    // Rerender with new array instance but same values
    // This should NOT cause subscription to be recreated
    rerender(<TestComponent path={['user', 'name']} />);

    // Should only cause one additional render (from rerender), not subscription recreation
    expect(renderCount).toBe(initialRenderCount + 1);
    // Subscribe should NOT be called again (path key is stable via JSON.stringify)
    expect(subscribeCount).toBe(initialSubscribeCount);

    store.dispose();
  });

  it('should handle dependsOn array reference changes with same values (stability)', async () => {
    type SelectorState = { user: { firstName: string; lastName: string } };
    const store = createStore<SelectorState>('depends-on-ref-test', {
      user: { firstName: 'John', lastName: 'Doe' }
    });

    let renderCount = 0;

    function TestComponent({ dependsOn }: { dependsOn: (string | number)[][] }) {
      renderCount++;
      const fullName = useStoreSelectorWithPaths(
        store,
        (state) => `${state.user.firstName} ${state.user.lastName}`,
        { dependsOn }
      );
      return <span data-testid="name">{fullName}</span>;
    }

    // Initial render
    const { rerender } = render(
      <TestComponent dependsOn={[['user', 'firstName'], ['user', 'lastName']]} />
    );
    expect(screen.getByTestId('name').textContent).toBe('John Doe');
    const initialRenderCount = renderCount;

    // Rerender with new array instances but same values
    rerender(
      <TestComponent dependsOn={[['user', 'firstName'], ['user', 'lastName']]} />
    );

    // Should only cause one additional render from rerender
    expect(renderCount).toBe(initialRenderCount + 1);

    // Verify the component still works correctly after rerender
    act(() => {
      store.update(draft => {
        draft.user.firstName = 'Jane';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Jane Doe');
    });

    store.dispose();
  });

  it('should correctly update value when path changes from deep to shallow', async () => {
    type NestedState = {
      level1: {
        level2: {
          level3: { value: string };
        };
      };
    };
    const store = createStore<NestedState>('depth-change-test', {
      level1: {
        level2: {
          level3: { value: 'deep' }
        }
      }
    });

    function TestComponent({ depth }: { depth: 1 | 2 | 3 }) {
      const paths = {
        1: ['level1'] as const,
        2: ['level1', 'level2'] as const,
        3: ['level1', 'level2', 'level3', 'value'] as const
      };
      const value = useStorePath<NestedState, unknown>(store, paths[depth] as any);
      return <span data-testid="value">{JSON.stringify(value)}</span>;
    }

    // Start at depth 3
    const { rerender } = render(<TestComponent depth={3} />);
    expect(screen.getByTestId('value').textContent).toBe('"deep"');

    // Move to depth 2
    rerender(<TestComponent depth={2} />);
    expect(screen.getByTestId('value').textContent).toBe('{"level3":{"value":"deep"}}');

    // Move to depth 1
    rerender(<TestComponent depth={1} />);
    expect(screen.getByTestId('value').textContent).toBe('{"level2":{"level3":{"value":"deep"}}}');

    // Back to depth 3
    rerender(<TestComponent depth={3} />);
    expect(screen.getByTestId('value').textContent).toBe('"deep"');

    store.dispose();
  });

  it('should handle rapid path changes without stale values', async () => {
    type MultiState = {
      a: string;
      b: string;
      c: string;
    };
    const store = createStore<MultiState>('rapid-change-test', {
      a: 'A',
      b: 'B',
      c: 'C'
    });

    function TestComponent({ pathKey }: { pathKey: 'a' | 'b' | 'c' }) {
      const value = useStorePath<MultiState, string>(store, [pathKey]);
      return <span data-testid="value">{value}</span>;
    }

    const { rerender } = render(<TestComponent pathKey="a" />);
    expect(screen.getByTestId('value').textContent).toBe('A');

    // Rapid path changes
    rerender(<TestComponent pathKey="b" />);
    expect(screen.getByTestId('value').textContent).toBe('B');

    rerender(<TestComponent pathKey="c" />);
    expect(screen.getByTestId('value').textContent).toBe('C');

    rerender(<TestComponent pathKey="a" />);
    expect(screen.getByTestId('value').textContent).toBe('A');

    rerender(<TestComponent pathKey="b" />);
    expect(screen.getByTestId('value').textContent).toBe('B');

    // All values should be correct, no stale cache issues
    store.dispose();
  });
});
