import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import { useStoreSelector } from '../../../src/stores/hooks/useStoreSelector';

// Simple useStoreValue for testing - matching existing test pattern
function useStoreValue<T>(store: any): T {
  if (!store) {
    return undefined as any;
  }
  return useStoreSelector(store, (value: T) => value);
}

describe('useStoreValue usage examples', () => {
  describe('Basic store subscription patterns', () => {
    // @doc-extract: basic-subscription
    // @doc-category: getting-started
    // @doc-priority: high
    // @doc-description: 스토어 값 구독 및 리렌더링 기본 패턴
    it('should subscribe to store value and trigger re-renders on updates', async () => {
      // Create store with initial data
      const userStore = createStore('user', {
        name: 'John',
        age: 30,
        email: 'john@example.com'
      });

      interface UserData {
        name: string;
        age: number;
        email: string;
      }

      // Test component that subscribes to store
      function UserDisplay() {
        const user = useStoreValue<UserData>(userStore);

        return (
          <div>
            <span data-testid="name">{user.name}</span>
            <span data-testid="age">{user.age}</span>
            <span data-testid="email">{user.email}</span>
          </div>
        );
      }

      const { getByTestId } = render(<UserDisplay />);

      // Initial render verification
      expect(getByTestId('name')).toHaveTextContent('John');
      expect(getByTestId('age')).toHaveTextContent('30');
      expect(getByTestId('email')).toHaveTextContent('john@example.com');

      // Update store and verify re-render
      act(() => {
        userStore.setValue({
          name: 'Jane',
          age: 25,
          email: 'jane@example.com'
        });
      });

      // Wait for async update
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('name')).toHaveTextContent('Jane');
      expect(getByTestId('age')).toHaveTextContent('25');
      expect(getByTestId('email')).toHaveTextContent('jane@example.com');

      userStore.dispose();
    });

    it('should handle primitive value stores efficiently', async () => {
      // Different types of primitive stores
      const counterStore = createStore('counter', 0);
      const messageStore = createStore('message', 'Hello World');
      const isLoadingStore = createStore('loading', false);

      function Dashboard() {
        const counter = useStoreValue<number>(counterStore);
        const message = useStoreValue<string>(messageStore);
        const isLoading = useStoreValue<boolean>(isLoadingStore);

        return (
          <div>
            <div data-testid="counter">Count: {counter}</div>
            <div data-testid="message">{message}</div>
            <div data-testid="loading">{isLoading ? 'Loading...' : 'Ready'}</div>
            <button
              data-testid="increment"
              onClick={() => counterStore.setValue(counter + 1)}
            >
              Increment
            </button>
            <button
              data-testid="toggle-loading"
              onClick={() => isLoadingStore.setValue(!isLoading)}
            >
              Toggle Loading
            </button>
          </div>
        );
      }

      const { getByTestId } = render(<Dashboard />);

      // Initial state
      expect(getByTestId('counter')).toHaveTextContent('Count: 0');
      expect(getByTestId('message')).toHaveTextContent('Hello World');
      expect(getByTestId('loading')).toHaveTextContent('Ready');

      // Test counter increment
      fireEvent.click(getByTestId('increment'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('counter')).toHaveTextContent('Count: 1');

      // Test loading toggle
      fireEvent.click(getByTestId('toggle-loading'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('loading')).toHaveTextContent('Loading...');

      // Cleanup
      [counterStore, messageStore, isLoadingStore].forEach(store => store.dispose());
    });
  });

  describe('Complex data operations', () => {
    it('should handle nested object updates with proper immutability', async () => {
      interface Settings {
        theme: 'light' | 'dark';
        notifications: {
          email: boolean;
          push: boolean;
        };
      }

      const settingsStore = createStore<Settings>('settings', {
        theme: 'light',
        notifications: {
          email: true,
          push: false
        }
      });

      function SettingsPanel() {
        const settings = useStoreValue<Settings>(settingsStore);

        const toggleTheme = () => {
          settingsStore.update(current => ({
            ...current,
            theme: current.theme === 'light' ? 'dark' : 'light'
          }));
        };

        const toggleEmail = () => {
          settingsStore.update(current => ({
            ...current,
            notifications: {
              ...current.notifications,
              email: !current.notifications.email
            }
          }));
        };

        return (
          <div>
            <div data-testid="theme">Theme: {settings.theme}</div>
            <div data-testid="email">
              Email: {settings.notifications.email ? 'enabled' : 'disabled'}
            </div>
            <button data-testid="toggle-theme" onClick={toggleTheme}>
              Toggle Theme
            </button>
            <button data-testid="toggle-email" onClick={toggleEmail}>
              Toggle Email
            </button>
          </div>
        );
      }

      const { getByTestId } = render(<SettingsPanel />);

      // Initial state
      expect(getByTestId('theme')).toHaveTextContent('Theme: light');
      expect(getByTestId('email')).toHaveTextContent('Email: enabled');

      // Test theme toggle
      fireEvent.click(getByTestId('toggle-theme'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('theme')).toHaveTextContent('Theme: dark');

      // Test email toggle
      fireEvent.click(getByTestId('toggle-email'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('email')).toHaveTextContent('Email: disabled');

      settingsStore.dispose();
    });

    it('should handle array operations with proper state management', async () => {
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      const todosStore = createStore<Todo[]>('todos', [
        { id: 1, text: 'Learn React', completed: false },
        { id: 2, text: 'Build App', completed: false }
      ]);

      function TodoList() {
        const todos = useStoreValue<Todo[]>(todosStore);

        const toggleTodo = (id: number) => {
          todosStore.update(current =>
            current.map(todo =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
          );
        };

        const addTodo = () => {
          const newId = Math.max(...todos.map(t => t.id)) + 1;
          todosStore.update(current => [
            ...current,
            { id: newId, text: 'New Task', completed: false }
          ]);
        };

        const completedCount = todos.filter(t => t.completed).length;

        return (
          <div>
            <div data-testid="summary">{completedCount} completed</div>
            <button data-testid="toggle-1" onClick={() => toggleTodo(1)}>
              Toggle First
            </button>
            <button data-testid="add" onClick={addTodo}>
              Add Todo
            </button>
          </div>
        );
      }

      const { getByTestId } = render(<TodoList />);

      // Initial state
      expect(getByTestId('summary')).toHaveTextContent('0 completed');

      // Toggle completion
      fireEvent.click(getByTestId('toggle-1'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('summary')).toHaveTextContent('1 completed');

      // Add new todo
      fireEvent.click(getByTestId('add'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('summary')).toHaveTextContent('1 completed');

      todosStore.dispose();
    });
  });

  describe('Performance and multiple subscribers', () => {
    it('should handle multiple components subscribing to the same store', async () => {
      interface SharedData {
        count: number;
        message: string;
      }

      const sharedStore = createStore<SharedData>('shared', {
        count: 0,
        message: 'Hello'
      });

      function Counter() {
        const data = useStoreValue<SharedData>(sharedStore);
        return <div data-testid="counter">Count: {data.count}</div>;
      }

      function Message() {
        const data = useStoreValue<SharedData>(sharedStore);
        return <div data-testid="message">Message: {data.message}</div>;
      }

      function Controls() {
        const data = useStoreValue<SharedData>(sharedStore);

        const increment = () => {
          sharedStore.update(current => ({
            ...current,
            count: current.count + 1
          }));
        };

        return (
          <div>
            <div data-testid="current">{data.count}</div>
            <button data-testid="increment" onClick={increment}>
              Increment
            </button>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <Counter />
            <Message />
            <Controls />
          </div>
        );
      }

      const { getByTestId } = render(<App />);

      // Initial state
      expect(getByTestId('counter')).toHaveTextContent('Count: 0');
      expect(getByTestId('message')).toHaveTextContent('Message: Hello');
      expect(getByTestId('current')).toHaveTextContent('0');

      // Update - all components should reflect change
      fireEvent.click(getByTestId('increment'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('counter')).toHaveTextContent('Count: 1');
      expect(getByTestId('current')).toHaveTextContent('1');

      sharedStore.dispose();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle store disposal gracefully', async () => {
      const tempStore = createStore('temp', { value: 'initial' });

      function TempComponent() {
        const data = useStoreValue<{ value: string }>(tempStore);
        return <div data-testid="temp">{data.value}</div>;
      }

      const { getByTestId, unmount } = render(<TempComponent />);

      expect(getByTestId('temp')).toHaveTextContent('initial');

      // Update store
      act(() => {
        tempStore.setValue({ value: 'updated' });
      });

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('temp')).toHaveTextContent('updated');

      // Cleanup
      unmount();
      tempStore.dispose();

      expect(tempStore.isStoreDisposed()).toBe(true);
    });

    it('should handle null stores gracefully', () => {
      function SafeComponent() {
        const nullValue = useStoreValue(null);

        return (
          <div data-testid="safe">
            {nullValue === undefined ? 'undefined' : 'defined'}
          </div>
        );
      }

      const { getByTestId } = render(<SafeComponent />);
      expect(getByTestId('safe')).toHaveTextContent('undefined');
    });
  });
});