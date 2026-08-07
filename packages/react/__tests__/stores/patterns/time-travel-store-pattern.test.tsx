import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import {
  createTimeTravelStoreContext,
  TimeTravelStoreManager,
} from '../../../src/stores/patterns/time-travel-store-pattern';
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';
import { isTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';

// Test store types
interface TestStores {
  counter: { count: number; lastAction: string };
  user: { name: string; age: number };
  settings: { theme: string };
}

describe('createTimeTravelStoreContext', () => {
  describe('Basic Context Creation', () => {
    it('should create context with all hooks', () => {
      const context = createTimeTravelStoreContext<TestStores>('Test', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
        user: { initialValue: { name: 'Guest', age: 0 } },
        settings: { initialValue: { theme: 'light' } },
      });

      expect(context.Provider).toBeDefined();
      expect(context.useStore).toBeDefined();
      expect(context.useTimeTravelStore).toBeDefined();
      expect(context.useStorePath).toBeDefined();
      expect(context.useStoreSelector).toBeDefined();
      expect(context.useTimeTravelControls).toBeDefined();
      expect(context.useStoreManager).toBeDefined();
      expect(context.useStoreInfo).toBeDefined();
      expect(context.useStoreClear).toBeDefined();
      expect(context.withProvider).toBeDefined();
      expect(context.contextName).toBe('Test');
    });
  });

  describe('Provider and useStore', () => {
    const {
      Provider,
      useStore,
      useTimeTravelStore,
      useTimeTravelControls,
    } = createTimeTravelStoreContext<TestStores>('App', {
      counter: { initialValue: { count: 0, lastAction: 'init' }, maxHistory: 10 },
      user: { initialValue: { name: 'Guest', age: 0 } },
      settings: { initialValue: { theme: 'light' }, timeTravel: false },
    });

    function CounterDisplay() {
      const store = useStore('counter');
      const { count, lastAction } = useStoreValue(store);
      return (
        <div>
          <span data-testid="count">{count}</span>
          <span data-testid="action">{lastAction}</span>
        </div>
      );
    }

    it('keeps time-travel stores alive through StrictMode effect replay', async () => {
      const Stores = createTimeTravelStoreContext('StrictTimeTravel', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
      });
      let store: ReturnType<typeof Stores.useStore<'counter'>> | undefined;

      function Consumer() {
        store = Stores.useStore('counter');
        useStoreValue(store);
        return null;
      }

      const rendered = render(
        <React.StrictMode>
          <Stores.Provider>
            <Consumer />
          </Stores.Provider>
        </React.StrictMode>,
      );

      await act(async () => {
        await Promise.resolve();
      });
      expect(store && 'isStoreDisposed' in store && store.isStoreDisposed()).toBe(false);
      rendered.unmount();
    });

    function CounterControls() {
      const store = useTimeTravelStore('counter');
      const { canUndo, canRedo, undo, redo, position, historyLength } = useTimeTravelControls('counter');

      return (
        <div>
          <button
            data-testid="increment"
            onClick={() => store.setValue({ count: store.getValue().count + 1, lastAction: 'inc' })}
          >
            +
          </button>
          <button data-testid="undo" onClick={() => undo()} disabled={!canUndo}>
            Undo
          </button>
          <button data-testid="redo" onClick={() => redo()} disabled={!canRedo}>
            Redo
          </button>
          <span data-testid="position">{position}</span>
          <span data-testid="history-length">{historyLength}</span>
        </div>
      );
    }

    function SettingsDisplay() {
      const store = useStore('settings');
      const { theme } = useStoreValue(store);
      return <span data-testid="theme">{theme}</span>;
    }

    it('should render initial values', () => {
      render(
        <Provider>
          <CounterDisplay />
        </Provider>
      );

      expect(screen.getByTestId('count').textContent).toBe('0');
      expect(screen.getByTestId('action').textContent).toBe('init');
    });

    it('should update values on setValue', async () => {
      render(
        <Provider>
          <CounterDisplay />
          <CounterControls />
        </Provider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('increment'));
      });

      expect(screen.getByTestId('count').textContent).toBe('1');
      expect(screen.getByTestId('action').textContent).toBe('inc');
    });

    it('should support undo/redo', async () => {
      render(
        <Provider>
          <CounterDisplay />
          <CounterControls />
        </Provider>
      );

      // Increment twice
      await act(async () => {
        fireEvent.click(screen.getByTestId('increment'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('increment'));
      });

      expect(screen.getByTestId('count').textContent).toBe('2');

      // Undo
      await act(async () => {
        fireEvent.click(screen.getByTestId('undo'));
      });

      expect(screen.getByTestId('count').textContent).toBe('1');

      // Redo
      await act(async () => {
        fireEvent.click(screen.getByTestId('redo'));
      });

      expect(screen.getByTestId('count').textContent).toBe('2');
    });

    it('should track position and history length', async () => {
      render(
        <Provider>
          <CounterDisplay />
          <CounterControls />
        </Provider>
      );

      expect(screen.getByTestId('position').textContent).toBe('0');
      expect(screen.getByTestId('history-length').textContent).toBe('1');

      await act(async () => {
        fireEvent.click(screen.getByTestId('increment'));
      });

      expect(screen.getByTestId('position').textContent).toBe('1');
      expect(screen.getByTestId('history-length').textContent).toBe('2');
    });

    it('should disable undo button when canUndo is false', () => {
      render(
        <Provider>
          <CounterControls />
        </Provider>
      );

      expect(screen.getByTestId('undo')).toBeDisabled();
    });

    it('should disable redo button when canRedo is false', () => {
      render(
        <Provider>
          <CounterControls />
        </Provider>
      );

      expect(screen.getByTestId('redo')).toBeDisabled();
    });
  });

  describe('timeTravel: false option', () => {
    const {
      Provider,
      useStore,
      useTimeTravelControls,
    } = createTimeTravelStoreContext<TestStores>('Mixed', {
      counter: { initialValue: { count: 0, lastAction: 'init' } },
      user: { initialValue: { name: 'Guest', age: 0 } },
      settings: { initialValue: { theme: 'light' }, timeTravel: false },
    });

    function SettingsComponent() {
      const store = useStore('settings');
      const { theme } = useStoreValue(store);

      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button
            data-testid="toggle-theme"
            onClick={() => store.setValue({ theme: theme === 'light' ? 'dark' : 'light' })}
          >
            Toggle
          </button>
        </div>
      );
    }

    it('should create regular Store when timeTravel: false', () => {
      let storeRef: any;

      function StoreChecker() {
        storeRef = useStore('settings');
        return null;
      }

      render(
        <Provider>
          <StoreChecker />
        </Provider>
      );

      expect(isTimeTravelStore(storeRef)).toBe(false);
    });

    it('should throw when using useTimeTravelControls on non-time-travel store', () => {
      function InvalidComponent() {
        try {
          useTimeTravelControls('settings');
          return <span>Should not render</span>;
        } catch (error) {
          return <span data-testid="error">{(error as Error).message}</span>;
        }
      }

      render(
        <Provider>
          <InvalidComponent />
        </Provider>
      );

      expect(screen.getByTestId('error').textContent).toContain('does not have time travel enabled');
    });

    it('should work as regular store without undo/redo', async () => {
      render(
        <Provider>
          <SettingsComponent />
        </Provider>
      );

      expect(screen.getByTestId('theme').textContent).toBe('light');

      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-theme'));
        // Wait for RAF-based notification to complete
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });
  });

  describe('useStorePath hook', () => {
    const {
      Provider,
      useStore,
      useStorePath,
    } = createTimeTravelStoreContext<{ nested: { a: { b: number }; c: string } }>('Nested', {
      nested: { initialValue: { a: { b: 1 }, c: 'hello' } },
    });

    function PathComponent() {
      const bValue = useStorePath('nested', ['a', 'b']) as number;
      return <span data-testid="b-value">{bValue}</span>;
    }

    function FullComponent() {
      const store = useStore('nested');
      const value = useStoreValue(store);
      return (
        <div>
          <span data-testid="full">{JSON.stringify(value)}</span>
          <button
            data-testid="update-b"
            onClick={() => store.setValue({ ...value, a: { b: value.a.b + 1 } })}
          >
            Update B
          </button>
          <button
            data-testid="update-c"
            onClick={() => store.setValue({ ...value, c: value.c + '!' })}
          >
            Update C
          </button>
        </div>
      );
    }

    it('should subscribe to specific path', () => {
      render(
        <Provider>
          <PathComponent />
        </Provider>
      );

      expect(screen.getByTestId('b-value').textContent).toBe('1');
    });

    it('should update when path value changes', async () => {
      render(
        <Provider>
          <PathComponent />
          <FullComponent />
        </Provider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-b'));
      });

      expect(screen.getByTestId('b-value').textContent).toBe('2');
    });
  });

  describe('useStoreSelector hook', () => {
    const {
      Provider,
      useStore,
      useStoreSelector,
    } = createTimeTravelStoreContext<{ user: { firstName: string; lastName: string; age: number } }>('Selector', {
      user: { initialValue: { firstName: 'John', lastName: 'Doe', age: 30 } },
    });

    function FullNameComponent() {
      const fullName = useStoreSelector(
        'user',
        (user) => `${user.firstName} ${user.lastName}`,
        { dependsOn: [['firstName'], ['lastName']] }
      );
      return <span data-testid="full-name">{fullName}</span>;
    }

    function UserControls() {
      const store = useStore('user');
      const value = useStoreValue(store);

      return (
        <div>
          <button
            data-testid="change-first"
            onClick={() => store.setValue({ ...value, firstName: 'Jane' })}
          >
            Change First
          </button>
          <button
            data-testid="change-age"
            onClick={() => store.setValue({ ...value, age: value.age + 1 })}
          >
            Change Age
          </button>
        </div>
      );
    }

    it('should compute selected value', () => {
      render(
        <Provider>
          <FullNameComponent />
        </Provider>
      );

      expect(screen.getByTestId('full-name').textContent).toBe('John Doe');
    });

    it('should update when dependent paths change', async () => {
      render(
        <Provider>
          <FullNameComponent />
          <UserControls />
        </Provider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('change-first'));
      });

      expect(screen.getByTestId('full-name').textContent).toBe('Jane Doe');
    });
  });

  describe('TimeTravelStoreManager', () => {
    it('should create and manage stores', () => {
      const manager = new TimeTravelStoreManager<TestStores>('test-manager', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
        user: { initialValue: { name: 'Guest', age: 0 } },
        settings: { initialValue: { theme: 'light' }, timeTravel: false },
      });

      const counterStore = manager.getStore('counter');
      const userStore = manager.getStore('user');
      const settingsStore = manager.getStore('settings');

      expect(counterStore).toBeDefined();
      expect(userStore).toBeDefined();
      expect(settingsStore).toBeDefined();

      expect(isTimeTravelStore(counterStore)).toBe(true);
      expect(isTimeTravelStore(settingsStore)).toBe(false);
    });

    it('should return same store instance on multiple getStore calls', () => {
      const manager = new TimeTravelStoreManager<TestStores>('test-manager', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
        user: { initialValue: { name: 'Guest', age: 0 } },
        settings: { initialValue: { theme: 'light' } },
      });

      const store1 = manager.getStore('counter');
      const store2 = manager.getStore('counter');

      expect(store1).toBe(store2);
    });

    it('should provide manager info', () => {
      const manager = new TimeTravelStoreManager<TestStores>('test-manager', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
        user: { initialValue: { name: 'Guest', age: 0 } },
        settings: { initialValue: { theme: 'light' } },
      });

      // Access stores to create them
      manager.getStore('counter');
      manager.getStore('user');

      const info = manager.getInfo();

      expect(info.name).toBe('test-manager');
      expect(info.storeCount).toBe(2);
      expect(info.availableStores).toContain('counter');
      expect(info.availableStores).toContain('user');
      expect(info.availableStores).toContain('settings');
    });

    it('should check hasTimeTravel correctly', () => {
      const manager = new TimeTravelStoreManager<TestStores>('test-manager', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
        user: { initialValue: { name: 'Guest', age: 0 } },
        settings: { initialValue: { theme: 'light' }, timeTravel: false },
      });

      expect(manager.hasTimeTravel('counter')).toBe(true);
      expect(manager.hasTimeTravel('settings')).toBe(false);
    });

    it('should clear all stores', () => {
      const manager = new TimeTravelStoreManager<TestStores>('test-manager', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
        user: { initialValue: { name: 'Guest', age: 0 } },
        settings: { initialValue: { theme: 'light' } },
      });

      manager.getStore('counter');
      manager.getStore('user');

      expect(manager.getInfo().storeCount).toBe(2);

      manager.clear();

      expect(manager.getInfo().storeCount).toBe(0);
    });
  });

  describe('withProvider HOC', () => {
    const { withProvider, useStore } = createTimeTravelStoreContext<TestStores>('HOC', {
      counter: { initialValue: { count: 0, lastAction: 'init' } },
      user: { initialValue: { name: 'Guest', age: 0 } },
      settings: { initialValue: { theme: 'light' } },
    });

    function InnerComponent() {
      const store = useStore('counter');
      const { count } = useStoreValue(store);
      return <span data-testid="count">{count}</span>;
    }

    it('should wrap component with provider', () => {
      const WrappedComponent = withProvider(InnerComponent);

      render(<WrappedComponent />);

      expect(screen.getByTestId('count').textContent).toBe('0');
    });

    it('should accept custom displayName', () => {
      const WrappedComponent = withProvider(InnerComponent, {
        displayName: 'CustomWrapped',
      });

      expect(WrappedComponent.displayName).toBe('CustomWrapped');
    });
  });

  describe('Error handling', () => {
    it('should throw when useStore is used outside Provider', () => {
      const { useStore } = createTimeTravelStoreContext<TestStores>('NoProvider', {
        counter: { initialValue: { count: 0, lastAction: 'init' } },
        user: { initialValue: { name: 'Guest', age: 0 } },
        settings: { initialValue: { theme: 'light' } },
      });

      function InvalidComponent() {
        try {
          useStore('counter');
          return <span>Should not render</span>;
        } catch (error) {
          return <span data-testid="error">{(error as Error).message}</span>;
        }
      }

      render(<InvalidComponent />);

      expect(screen.getByTestId('error').textContent).toContain('must be used within');
    });
  });
});
