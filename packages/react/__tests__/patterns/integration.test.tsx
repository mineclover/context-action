import React, { useCallback } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { createActionContext } from '../../src/actions/ActionContext';
import { createStoreContext } from '../../src/stores/patterns/declarative-store-pattern-v2';
import { useStoreSelector } from '../../src/stores/hooks/useStoreSelector';
import type { ActionPayloadMap } from '@context-action/core';

// Simple useStoreValue for testing - matching existing test pattern
function useStoreValue<T>(store: any): T {
  if (!store) {
    return undefined as any;
  }
  return useStoreSelector(store, (value: T) => value);
}

describe('Pattern Integration Tests', () => {
  describe('Action Only + Store Only Pattern Integration', () => {
    it('should integrate Action Context with Store Context for complete application flow', async () => {
      // Store Only Pattern - Data Layer
      const {
        Provider: AppStoreProvider,
        useStore: useAppStore
      } = createStoreContext('App', {
        user: { name: '', email: '', isLoggedIn: false },
        ui: { isLoading: false, message: '' },
        data: { items: [] as string[], count: 0 }
      });

      // Action Only Pattern - Business Logic Layer
      interface AppActions extends ActionPayloadMap {
        login: { email: string; password: string };
        logout: void;
        addItem: { name: string };
        loadData: void;
        showMessage: { text: string };
      }

      const {
        Provider: AppActionProvider,
        useActionDispatch: useAppAction,
        useActionHandler: useAppActionHandler
      } = createActionContext<AppActions>('AppActions');

      const mockApiCall = jest.fn();
      const handlerCalls: any[] = [];

      // Business Logic Component (Handler Registration)
      function AppLogic({ children }: { children: React.ReactNode }) {
        const userStore = useAppStore('user');
        const uiStore = useAppStore('ui');
        const dataStore = useAppStore('data');

        // Login handler
        useAppActionHandler('login', useCallback(async (payload) => {
          handlerCalls.push({ action: 'login', payload });

          // Set loading state
          uiStore.setValue({ isLoading: true, message: 'Logging in...' });

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 50));
          mockApiCall.mockResolvedValue({ success: true, user: { name: 'John Doe', email: payload.email } });
          const result = await mockApiCall(payload);

          if (result.success) {
            userStore.setValue({
              name: result.user.name,
              email: result.user.email,
              isLoggedIn: true
            });
            uiStore.setValue({ isLoading: false, message: 'Login successful!' });
          }
        }, [userStore, uiStore]));

        // Logout handler
        useAppActionHandler('logout', useCallback(async () => {
          handlerCalls.push({ action: 'logout' });
          userStore.setValue({ name: '', email: '', isLoggedIn: false });
          uiStore.setValue({ isLoading: false, message: 'Logged out' });
        }, [userStore, uiStore]));

        // Add item handler
        useAppActionHandler('addItem', useCallback(async (payload) => {
          handlerCalls.push({ action: 'addItem', payload });
          dataStore.update(current => ({
            items: [...current.items, payload.name],
            count: current.count + 1
          }));
        }, [dataStore]));

        // Load data handler
        useAppActionHandler('loadData', useCallback(async () => {
          handlerCalls.push({ action: 'loadData' });
          uiStore.update(current => ({ ...current, isLoading: true }));

          // Simulate data loading
          await new Promise(resolve => setTimeout(resolve, 50));
          dataStore.setValue({ items: ['Item 1', 'Item 2', 'Item 3'], count: 3 });
          uiStore.update(current => ({ ...current, isLoading: false }));
        }, [dataStore, uiStore]));

        // Show message handler
        useAppActionHandler('showMessage', useCallback(async (payload) => {
          handlerCalls.push({ action: 'showMessage', payload });
          uiStore.update(current => ({ ...current, message: payload.text }));
        }, [uiStore]));

        return <>{children}</>;
      }

      // UI Components (View Layer)
      function UserDisplay() {
        const userStore = useAppStore('user');
        const user = useStoreValue<{ name: string; email: string; isLoggedIn: boolean }>(userStore);

        return (
          <div>
            <div data-testid="user-status">
              {user.isLoggedIn ? `Logged in as ${user.name}` : 'Not logged in'}
            </div>
            <div data-testid="user-email">{user.email}</div>
          </div>
        );
      }

      function UIStatus() {
        const uiStore = useAppStore('ui');
        const ui = useStoreValue<{ isLoading: boolean; message: string }>(uiStore);

        return (
          <div>
            <div data-testid="loading">{ui.isLoading ? 'Loading...' : 'Ready'}</div>
            <div data-testid="message">{ui.message}</div>
          </div>
        );
      }

      function DataDisplay() {
        const dataStore = useAppStore('data');
        const data = useStoreValue<{ items: string[]; count: number }>(dataStore);

        return (
          <div>
            <div data-testid="item-count">Items: {data.count}</div>
            <div data-testid="items">{data.items.join(', ')}</div>
          </div>
        );
      }

      function AppControls() {
        const dispatch = useAppAction();

        return (
          <div>
            <button
              data-testid="login"
              onClick={() => dispatch('login', { email: 'test@example.com', password: 'password' })}
            >
              Login
            </button>
            <button
              data-testid="logout"
              onClick={() => dispatch('logout')}
            >
              Logout
            </button>
            <button
              data-testid="add-item"
              onClick={() => dispatch('addItem', { name: 'New Item' })}
            >
              Add Item
            </button>
            <button
              data-testid="load-data"
              onClick={() => dispatch('loadData')}
            >
              Load Data
            </button>
            <button
              data-testid="show-message"
              onClick={() => dispatch('showMessage', { text: 'Hello World!' })}
            >
              Show Message
            </button>
          </div>
        );
      }

      // Complete Application Integration
      function App() {
        return (
          <AppActionProvider>
            <AppStoreProvider>
              <AppLogic>
                <UserDisplay />
                <UIStatus />
                <DataDisplay />
                <AppControls />
              </AppLogic>
            </AppStoreProvider>
          </AppActionProvider>
        );
      }

      const { getByTestId } = render(<App />);

      // Initial state verification
      expect(getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(getByTestId('loading')).toHaveTextContent('Ready');
      expect(getByTestId('item-count')).toHaveTextContent('Items: 0');
      expect(getByTestId('items')).toHaveTextContent('');

      // Test login flow
      fireEvent.click(getByTestId('login'));

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('Loading...');
        expect(getByTestId('message')).toHaveTextContent('Logging in...');
      });

      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('Logged in as John Doe');
        expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
        expect(getByTestId('loading')).toHaveTextContent('Ready');
        expect(getByTestId('message')).toHaveTextContent('Login successful!');
      });

      // Test data operations
      fireEvent.click(getByTestId('add-item'));

      await waitFor(() => {
        expect(getByTestId('item-count')).toHaveTextContent('Items: 1');
        expect(getByTestId('items')).toHaveTextContent('New Item');
      });

      fireEvent.click(getByTestId('load-data'));

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('Loading...');
      });

      await waitFor(() => {
        expect(getByTestId('item-count')).toHaveTextContent('Items: 3');
        expect(getByTestId('items')).toHaveTextContent('Item 1, Item 2, Item 3');
        expect(getByTestId('loading')).toHaveTextContent('Ready');
      });

      // Test message display
      fireEvent.click(getByTestId('show-message'));

      await waitFor(() => {
        expect(getByTestId('message')).toHaveTextContent('Hello World!');
      });

      // Test logout
      fireEvent.click(getByTestId('logout'));

      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('Not logged in');
        expect(getByTestId('user-email')).toHaveTextContent('');
        expect(getByTestId('message')).toHaveTextContent('Logged out');
      });

      // Verify all handlers were called
      expect(handlerCalls).toHaveLength(5);
      expect(handlerCalls.map(call => call.action)).toEqual([
        'login', 'addItem', 'loadData', 'showMessage', 'logout'
      ]);
      expect(mockApiCall).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
    });

    it('should handle complex cross-pattern coordination with multiple stores and actions', async () => {
      // Multi-domain Store Architecture
      const {
        Provider: UserStoreProvider,
        useStore: useUserStore
      } = createStoreContext('User', {
        profile: { id: null as number | null, name: '', role: 'user' as 'user' | 'admin' },
        preferences: { theme: 'light' as 'light' | 'dark', language: 'en' }
      });

      const {
        Provider: AppStoreProvider,
        useStore: useAppStore
      } = createStoreContext('App', {
        navigation: { currentPage: 'home', history: [] as string[] },
        cache: { data: {} as Record<string, any>, lastUpdate: 0 }
      });

      // Multi-domain Action Architecture
      interface UserActions extends ActionPayloadMap {
        updateProfile: { name: string; role: 'user' | 'admin' };
        changeTheme: { theme: 'light' | 'dark' };
        switchLanguage: { language: string };
      }

      interface AppActions extends ActionPayloadMap {
        navigate: { page: string };
        cacheData: { key: string; data: any };
        clearCache: void;
      }

      const userContext = createActionContext<UserActions>('UserActions');
      const appContext = createActionContext<AppActions>('AppActions');

      const events: any[] = [];

      // User Domain Logic
      function UserLogic({ children }: { children: React.ReactNode }) {
        const profileStore = useUserStore('profile');
        const preferencesStore = useUserStore('preferences');

        userContext.useActionHandler('updateProfile', useCallback(async (payload) => {
          events.push({ domain: 'user', action: 'updateProfile', payload });
          profileStore.setValue({ id: 1, name: payload.name, role: payload.role });
        }, [profileStore]));

        userContext.useActionHandler('changeTheme', useCallback(async (payload) => {
          events.push({ domain: 'user', action: 'changeTheme', payload });
          preferencesStore.update(current => ({ ...current, theme: payload.theme }));
        }, [preferencesStore]));

        userContext.useActionHandler('switchLanguage', useCallback(async (payload) => {
          events.push({ domain: 'user', action: 'switchLanguage', payload });
          preferencesStore.update(current => ({ ...current, language: payload.language }));
        }, [preferencesStore]));

        return <>{children}</>;
      }

      // App Domain Logic
      function AppLogic({ children }: { children: React.ReactNode }) {
        const navigationStore = useAppStore('navigation');
        const cacheStore = useAppStore('cache');

        appContext.useActionHandler('navigate', useCallback(async (payload) => {
          events.push({ domain: 'app', action: 'navigate', payload });
          navigationStore.update(current => ({
            currentPage: payload.page,
            history: [...current.history, payload.page]
          }));
        }, [navigationStore]));

        appContext.useActionHandler('cacheData', useCallback(async (payload) => {
          events.push({ domain: 'app', action: 'cacheData', payload });
          cacheStore.update(current => ({
            data: { ...current.data, [payload.key]: payload.data },
            lastUpdate: Date.now()
          }));
        }, [cacheStore]));

        appContext.useActionHandler('clearCache', useCallback(async () => {
          events.push({ domain: 'app', action: 'clearCache' });
          cacheStore.setValue({ data: {}, lastUpdate: 0 });
        }, [cacheStore]));

        return <>{children}</>;
      }

      // UI Components
      function UserSection() {
        const userDispatch = userContext.useActionDispatch();
        const profileStore = useUserStore('profile');
        const preferencesStore = useUserStore('preferences');
        const profile = useStoreValue<{ id: number | null; name: string; role: 'user' | 'admin' }>(profileStore);
        const preferences = useStoreValue<{ theme: 'light' | 'dark'; language: string }>(preferencesStore);

        return (
          <div>
            <div data-testid="profile">Name: {profile.name}, Role: {profile.role}</div>
            <div data-testid="preferences">Theme: {preferences.theme}, Language: {preferences.language}</div>
            <button
              data-testid="update-profile"
              onClick={() => userDispatch('updateProfile', { name: 'John Admin', role: 'admin' })}
            >
              Update Profile
            </button>
            <button
              data-testid="change-theme"
              onClick={() => userDispatch('changeTheme', { theme: 'dark' })}
            >
              Change Theme
            </button>
            <button
              data-testid="switch-language"
              onClick={() => userDispatch('switchLanguage', { language: 'ko' })}
            >
              Switch Language
            </button>
          </div>
        );
      }

      function AppSection() {
        const appDispatch = appContext.useActionDispatch();
        const navigationStore = useAppStore('navigation');
        const cacheStore = useAppStore('cache');
        const navigation = useStoreValue<{ currentPage: string; history: string[] }>(navigationStore);
        const cache = useStoreValue<{ data: Record<string, any>; lastUpdate: number }>(cacheStore);

        return (
          <div>
            <div data-testid="navigation">
              Page: {navigation.currentPage}, History: {navigation.history.length}
            </div>
            <div data-testid="cache">
              Cache: {Object.keys(cache.data).length} items, Updated: {cache.lastUpdate}
            </div>
            <button
              data-testid="navigate"
              onClick={() => appDispatch('navigate', { page: 'profile' })}
            >
              Navigate
            </button>
            <button
              data-testid="cache-data"
              onClick={() => appDispatch('cacheData', { key: 'user', data: { name: 'Cached User' } })}
            >
              Cache Data
            </button>
            <button
              data-testid="clear-cache"
              onClick={() => appDispatch('clearCache')}
            >
              Clear Cache
            </button>
          </div>
        );
      }

      // Complete Multi-Domain Application
      function App() {
        return (
          <userContext.Provider>
            <appContext.Provider>
              <UserStoreProvider>
                <AppStoreProvider>
                  <UserLogic>
                    <AppLogic>
                      <UserSection />
                      <AppSection />
                    </AppLogic>
                  </UserLogic>
                </AppStoreProvider>
              </UserStoreProvider>
            </appContext.Provider>
          </userContext.Provider>
        );
      }

      const { getByTestId } = render(<App />);

      // Initial state verification
      expect(getByTestId('profile')).toHaveTextContent('Name: , Role: user');
      expect(getByTestId('preferences')).toHaveTextContent('Theme: light, Language: en');
      expect(getByTestId('navigation')).toHaveTextContent('Page: home, History: 0');
      expect(getByTestId('cache')).toHaveTextContent('Cache: 0 items, Updated: 0');

      // Test user domain actions
      fireEvent.click(getByTestId('update-profile'));
      fireEvent.click(getByTestId('change-theme'));
      fireEvent.click(getByTestId('switch-language'));

      await waitFor(() => {
        expect(getByTestId('profile')).toHaveTextContent('Name: John Admin, Role: admin');
        expect(getByTestId('preferences')).toHaveTextContent('Theme: dark, Language: ko');
      });

      // Test app domain actions
      fireEvent.click(getByTestId('navigate'));
      fireEvent.click(getByTestId('cache-data'));

      await waitFor(() => {
        expect(getByTestId('navigation')).toHaveTextContent('Page: profile, History: 1');
        expect(getByTestId('cache')).toHaveTextContent('Cache: 1 items');
      });

      fireEvent.click(getByTestId('clear-cache'));

      await waitFor(() => {
        expect(getByTestId('cache')).toHaveTextContent('Cache: 0 items, Updated: 0');
      });

      // Verify all events across domains
      expect(events).toHaveLength(6);
      expect(events.map(e => `${e.domain}:${e.action}`)).toEqual([
        'user:updateProfile',
        'user:changeTheme',
        'user:switchLanguage',
        'app:navigate',
        'app:cacheData',
        'app:clearCache'
      ]);
    });
  });

  describe('Real-world application patterns', () => {
    it('should demonstrate a complete todo application with complex state management', async () => {
      // Todo Store Architecture
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
        priority: 'low' | 'medium' | 'high';
        category: string;
        createdAt: number;
      }

      const {
        Provider: TodoStoreProvider,
        useStore: useTodoStore
      } = createStoreContext('Todo', {
        todos: [] as Todo[],
        filter: {
          status: 'all' as 'all' | 'active' | 'completed',
          category: 'all',
          priority: 'all' as 'all' | 'low' | 'medium' | 'high'
        },
        ui: {
          selectedTodo: null as number | null,
          isEditing: false,
          searchQuery: ''
        },
        stats: {
          total: 0,
          completed: 0,
          byCategory: {} as Record<string, number>,
          byPriority: {} as Record<string, number>
        }
      });

      // Todo Actions
      interface TodoActions extends ActionPayloadMap {
        addTodo: { text: string; priority: 'low' | 'medium' | 'high'; category: string };
        toggleTodo: { id: number };
        deleteTodo: { id: number };
        editTodo: { id: number; text: string; priority: 'low' | 'medium' | 'high'; category: string };
        setFilter: {
          status?: 'all' | 'active' | 'completed';
          category?: string;
          priority?: 'all' | 'low' | 'medium' | 'high';
        };
        selectTodo: { id: number | null };
        setSearchQuery: { query: string };
        clearCompleted: void;
        updateStats: void;
      }

      const {
        Provider: TodoActionProvider,
        useActionDispatch: useTodoAction,
        useActionHandler: useTodoActionHandler
      } = createActionContext<TodoActions>('TodoActions');

      let todoIdCounter = 1;
      const actionLog: string[] = [];

      // Business Logic
      function TodoLogic({ children }: { children: React.ReactNode }) {
        const todosStore = useTodoStore('todos');
        const filterStore = useTodoStore('filter');
        const uiStore = useTodoStore('ui');
        const statsStore = useTodoStore('stats');

        // Helper function to calculate stats
        const calculateStats = (todos: Todo[]) => {
          const total = todos.length;
          const completed = todos.filter(t => t.completed).length;
          const byCategory = todos.reduce((acc, todo) => {
            acc[todo.category] = (acc[todo.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const byPriority = todos.reduce((acc, todo) => {
            acc[todo.priority] = (acc[todo.priority] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return { total, completed, byCategory, byPriority };
        };

        useTodoActionHandler('addTodo', useCallback(async (payload) => {
          actionLog.push(`addTodo: ${payload.text}`);
          const newTodo: Todo = {
            id: todoIdCounter++,
            text: payload.text,
            completed: false,
            priority: payload.priority,
            category: payload.category,
            createdAt: Date.now()
          };

          const currentTodos = todosStore.getValue();
          const updatedTodos = [...currentTodos, newTodo];
          todosStore.setValue(updatedTodos);
          statsStore.setValue(calculateStats(updatedTodos));
        }, [todosStore, statsStore]));

        useTodoActionHandler('toggleTodo', useCallback(async (payload) => {
          actionLog.push(`toggleTodo: ${payload.id}`);
          const currentTodos = todosStore.getValue();
          const updatedTodos = currentTodos.map(todo =>
            todo.id === payload.id ? { ...todo, completed: !todo.completed } : todo
          );
          todosStore.setValue(updatedTodos);
          statsStore.setValue(calculateStats(updatedTodos));
        }, [todosStore, statsStore]));

        useTodoActionHandler('deleteTodo', useCallback(async (payload) => {
          actionLog.push(`deleteTodo: ${payload.id}`);
          const currentTodos = todosStore.getValue();
          const updatedTodos = currentTodos.filter(todo => todo.id !== payload.id);
          todosStore.setValue(updatedTodos);
          statsStore.setValue(calculateStats(updatedTodos));

          // Clear selection if deleted todo was selected
          const currentUI = uiStore.getValue();
          if (currentUI.selectedTodo === payload.id) {
            uiStore.update(current => ({ ...current, selectedTodo: null }));
          }
        }, [todosStore, statsStore, uiStore]));

        useTodoActionHandler('setFilter', useCallback(async (payload) => {
          actionLog.push(`setFilter: ${JSON.stringify(payload)}`);
          filterStore.update(current => ({ ...current, ...payload }));
        }, [filterStore]));

        useTodoActionHandler('selectTodo', useCallback(async (payload) => {
          actionLog.push(`selectTodo: ${payload.id}`);
          uiStore.update(current => ({ ...current, selectedTodo: payload.id }));
        }, [uiStore]));

        useTodoActionHandler('setSearchQuery', useCallback(async (payload) => {
          actionLog.push(`setSearchQuery: ${payload.query}`);
          uiStore.update(current => ({ ...current, searchQuery: payload.query }));
        }, [uiStore]));

        useTodoActionHandler('clearCompleted', useCallback(async () => {
          actionLog.push('clearCompleted');
          const currentTodos = todosStore.getValue();
          const updatedTodos = currentTodos.filter(todo => !todo.completed);
          todosStore.setValue(updatedTodos);
          statsStore.setValue(calculateStats(updatedTodos));
        }, [todosStore, statsStore]));

        return <>{children}</>;
      }

      // UI Components
      function TodoForm() {
        const dispatch = useTodoAction();

        return (
          <button
            data-testid="add-todo"
            onClick={() => dispatch('addTodo', {
              text: 'New Todo Item',
              priority: 'medium',
              category: 'work'
            })}
          >
            Add Todo
          </button>
        );
      }

      function TodoList() {
        const dispatch = useTodoAction();
        const todosStore = useTodoStore('todos');
        const filterStore = useTodoStore('filter');
        const uiStore = useTodoStore('ui');

        const todos = useStoreValue<Todo[]>(todosStore);
        const filter = useStoreValue<{ status: 'all' | 'active' | 'completed'; category: string; priority: 'all' | 'low' | 'medium' | 'high' }>(filterStore);
        const ui = useStoreValue<{ selectedTodo: number | null; isEditing: boolean; searchQuery: string }>(uiStore);

        // Filter todos based on current filters
        const filteredTodos = todos.filter(todo => {
          if (filter.status === 'active' && todo.completed) return false;
          if (filter.status === 'completed' && !todo.completed) return false;
          if (filter.category !== 'all' && todo.category !== filter.category) return false;
          if (filter.priority !== 'all' && todo.priority !== filter.priority) return false;
          if (ui.searchQuery && !todo.text.toLowerCase().includes(ui.searchQuery.toLowerCase())) return false;
          return true;
        });

        return (
          <div>
            <div data-testid="todo-count">Showing: {filteredTodos.length} todos</div>
            <div data-testid="first-todo">
              {filteredTodos.length > 0 ? filteredTodos[0]!.text : 'No todos'}
            </div>
            {filteredTodos.length > 0 && (
              <button
                data-testid="toggle-first"
                onClick={() => dispatch('toggleTodo', { id: filteredTodos[0]!.id })}
              >
                Toggle First
              </button>
            )}
          </div>
        );
      }

      function TodoFilters() {
        const dispatch = useTodoAction();

        return (
          <div>
            <button
              data-testid="filter-active"
              onClick={() => dispatch('setFilter', { status: 'active' })}
            >
              Show Active
            </button>
            <button
              data-testid="filter-completed"
              onClick={() => dispatch('setFilter', { status: 'completed' })}
            >
              Show Completed
            </button>
            <button
              data-testid="filter-all"
              onClick={() => dispatch('setFilter', { status: 'all' })}
            >
              Show All
            </button>
            <button
              data-testid="set-search"
              onClick={() => dispatch('setSearchQuery', { query: 'New' })}
            >
              Search "New"
            </button>
            <button
              data-testid="clear-completed"
              onClick={() => dispatch('clearCompleted')}
            >
              Clear Completed
            </button>
          </div>
        );
      }

      function TodoStats() {
        const statsStore = useTodoStore('stats');
        const stats = useStoreValue<{ total: number; completed: number; byCategory: Record<string, number>; byPriority: Record<string, number> }>(statsStore);

        return (
          <div>
            <div data-testid="stats-total">Total: {stats.total}</div>
            <div data-testid="stats-completed">Completed: {stats.completed}</div>
            <div data-testid="stats-remaining">Remaining: {stats.total - stats.completed}</div>
          </div>
        );
      }

      // Complete Todo Application
      function TodoApp() {
        return (
          <TodoActionProvider>
            <TodoStoreProvider>
              <TodoLogic>
                <TodoForm />
                <TodoList />
                <TodoFilters />
                <TodoStats />
              </TodoLogic>
            </TodoStoreProvider>
          </TodoActionProvider>
        );
      }

      const { getByTestId } = render(<TodoApp />);

      // Initial state
      expect(getByTestId('todo-count')).toHaveTextContent('Showing: 0 todos');
      expect(getByTestId('first-todo')).toHaveTextContent('No todos');
      expect(getByTestId('stats-total')).toHaveTextContent('Total: 0');

      // Add todos
      fireEvent.click(getByTestId('add-todo'));
      fireEvent.click(getByTestId('add-todo'));

      await waitFor(() => {
        expect(getByTestId('todo-count')).toHaveTextContent('Showing: 2 todos');
        expect(getByTestId('first-todo')).toHaveTextContent('New Todo Item');
        expect(getByTestId('stats-total')).toHaveTextContent('Total: 2');
        expect(getByTestId('stats-completed')).toHaveTextContent('Completed: 0');
      });

      // Toggle first todo
      fireEvent.click(getByTestId('toggle-first'));

      await waitFor(() => {
        expect(getByTestId('stats-completed')).toHaveTextContent('Completed: 1');
        expect(getByTestId('stats-remaining')).toHaveTextContent('Remaining: 1');
      });

      // Filter active todos
      fireEvent.click(getByTestId('filter-active'));

      await waitFor(() => {
        expect(getByTestId('todo-count')).toHaveTextContent('Showing: 1 todos');
      });

      // Filter completed todos
      fireEvent.click(getByTestId('filter-completed'));

      await waitFor(() => {
        expect(getByTestId('todo-count')).toHaveTextContent('Showing: 1 todos');
      });

      // Show all todos
      fireEvent.click(getByTestId('filter-all'));

      await waitFor(() => {
        expect(getByTestId('todo-count')).toHaveTextContent('Showing: 2 todos');
      });

      // Search functionality
      fireEvent.click(getByTestId('set-search'));

      await waitFor(() => {
        expect(getByTestId('todo-count')).toHaveTextContent('Showing: 2 todos');
      });

      // Clear completed todos
      fireEvent.click(getByTestId('clear-completed'));

      await waitFor(() => {
        expect(getByTestId('stats-total')).toHaveTextContent('Total: 1');
        expect(getByTestId('stats-completed')).toHaveTextContent('Completed: 0');
        expect(getByTestId('todo-count')).toHaveTextContent('Showing: 1 todos');
      });

      // Verify action log
      expect(actionLog).toContain('addTodo: New Todo Item');
      expect(actionLog).toContain('toggleTodo: 1');
      expect(actionLog).toContain('setFilter: {"status":"active"}');
      expect(actionLog).toContain('clearCompleted');
    });
  });
});