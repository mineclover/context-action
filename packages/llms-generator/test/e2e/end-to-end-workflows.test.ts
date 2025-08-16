import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { EnhancedConfigManager } from '../../src/core/EnhancedConfigManager';
import { AdaptiveDocumentSelector } from '../../src/core/AdaptiveDocumentSelector';
import { QualityEvaluator } from '../../src/core/QualityEvaluator';

describe('End-to-End Workflows', () => {
  let testEnvironmentDir: string;
  let projectDocsDir: string;
  let outputDir: string;
  let configPath: string;

  beforeAll(async () => {
    // Create realistic project environment
    testEnvironmentDir = path.join(__dirname, '../temp/e2e-project');
    projectDocsDir = path.join(testEnvironmentDir, 'docs');
    outputDir = path.join(testEnvironmentDir, 'generated');
    configPath = path.join(testEnvironmentDir, 'llms-config.json');

    await setupRealisticProject();
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testEnvironmentDir)) {
      fs.rmSync(testEnvironmentDir, { recursive: true, force: true });
    }
  });

  async function setupRealisticProject() {
    // Create directory structure
    const dirs = [
      projectDocsDir,
      path.join(projectDocsDir, 'guides'),
      path.join(projectDocsDir, 'api'),
      path.join(projectDocsDir, 'examples'),
      path.join(projectDocsDir, 'troubleshooting'),
      outputDir
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Create realistic documentation files
    const documentStructure = [
      {
        path: 'README.md',
        content: `# Context-Action Framework

A revolutionary state management library for React applications that provides document-centric context separation and effective artifact management.

## Quick Start

\`\`\`bash
npm install @context-action/core @context-action/react
\`\`\`

## Features

- Document-centric context separation
- Type-safe action dispatching
- Reactive store management
- MVVM architecture support

For detailed documentation, see the [Getting Started Guide](guides/getting-started.md).
`,
        metadata: {
          category: 'overview',
          priority: 100,
          tags: ['introduction', 'overview', 'quick-start']
        }
      },
      {
        path: 'guides/getting-started.md',
        content: `# Getting Started with Context-Action

This comprehensive guide will help you integrate Context-Action into your React application.

## Installation

### Using npm
\`\`\`bash
npm install @context-action/core @context-action/react
\`\`\`

### Using yarn
\`\`\`bash
yarn add @context-action/core @context-action/react
\`\`\`

## Basic Setup

### 1. Create Your First Action Context

\`\`\`typescript
import { createActionContext } from '@context-action/react';

interface UserActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  resetUsers: void;
}

const { Provider: UserActionProvider, useActionDispatch, useActionHandler } = 
  createActionContext<UserActions>('UserActions');
\`\`\`

### 2. Setup Your Provider

\`\`\`tsx
function App() {
  return (
    <UserActionProvider>
      <UserComponent />
    </UserActionProvider>
  );
}
\`\`\`

### 3. Implement Action Handlers

\`\`\`tsx
function UserComponent() {
  const dispatch = useActionDispatch();
  
  useActionHandler('updateUser', async (payload, controller) => {
    try {
      await userService.updateUser(payload);
      // Handle success
    } catch (error) {
      controller.abort('Failed to update user', error);
    }
  });
  
  return (
    <button onClick={() => dispatch('updateUser', { 
      id: '123', 
      name: 'John Doe', 
      email: 'john@example.com' 
    })}>
      Update User
    </button>
  );
}
\`\`\`

## Next Steps

- Learn about [Store Integration](store-integration.md)
- Explore [Advanced Patterns](../examples/advanced-patterns.md)
- Check out [API Reference](../api/)
`,
        metadata: {
          category: 'guide',
          priority: 95,
          tags: ['beginner', 'tutorial', 'setup', 'installation'],
          dependencies: {
            followups: ['guides/store-integration.md', 'api/actions.md']
          }
        }
      },
      {
        path: 'guides/store-integration.md',
        content: `# Store Integration Guide

Learn how to integrate stores with Context-Action for complete state management.

## Declarative Store Pattern

The declarative store pattern provides type-safe state management with excellent type inference.

\`\`\`typescript
import { createDeclarativeStorePattern } from '@context-action/react';

const { 
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager 
} = createDeclarativeStorePattern('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light', notifications: true } },
  cart: { initialValue: [] }
});
\`\`\`

## Using Stores in Components

\`\`\`tsx
function UserProfile() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
\`\`\`

## Store Integration with Actions

\`\`\`tsx
function UserActions() {
  const userStore = useAppStore('user');
  
  useActionHandler('updateUser', async (payload, controller) => {
    // 1. Read current state
    const currentUser = userStore.getValue();
    
    // 2. Execute business logic
    const updatedUser = await userService.update(payload);
    
    // 3. Update store
    userStore.setValue(updatedUser);
  });
}
\`\`\`

## Advanced Store Patterns

### Computed Values

\`\`\`typescript
const computedName = useStoreComputed(userStore, user => 
  \`\${user.firstName} \${user.lastName}\`
);
\`\`\`

### Store Subscriptions

\`\`\`typescript
useStoreSubscription(userStore, user => {
  console.log('User changed:', user);
});
\`\`\`
`,
        metadata: {
          category: 'guide',
          priority: 90,
          tags: ['intermediate', 'stores', 'state-management'],
          dependencies: {
            prerequisites: ['guides/getting-started.md'],
            references: ['api/stores.md']
          }
        }
      },
      {
        path: 'api/actions.md',
        content: `# Action API Reference

Complete API reference for action management in Context-Action.

## createActionContext<T>(name: string)

Creates a new action context for managing actions of type T.

### Parameters

- \`name\`: Unique identifier for the action context
- \`T\`: TypeScript interface extending ActionPayloadMap

### Returns

Object containing:
- \`Provider\`: React context provider component
- \`useActionDispatch\`: Hook for dispatching actions
- \`useActionHandler\`: Hook for registering action handlers

### Example

\`\`\`typescript
interface AppActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
  updateProfile: { name: string; email: string };
}

const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<AppActions>('App');
\`\`\`

## useActionDispatch()

Returns a function for dispatching actions.

### Return Type

\`\`\`typescript
type ActionDispatch<T> = <K extends keyof T>(
  type: K,
  payload: T[K]
) => Promise<ActionResult>;
\`\`\`

### Usage

\`\`\`typescript
const dispatch = useActionDispatch<AppActions>();

// Dispatch with payload
await dispatch('login', { username: 'user', password: 'pass' });

// Dispatch without payload
await dispatch('logout');
\`\`\`

## useActionHandler(type, handler)

Registers an action handler for the specified action type.

### Parameters

- \`type\`: Action type to handle
- \`handler\`: Async function that processes the action

### Handler Signature

\`\`\`typescript
type ActionHandler<T> = (
  payload: T,
  controller: ActionController
) => Promise<void>;
\`\`\`

### ActionController

The controller provides utilities for action handling:

- \`abort(reason: string, error?: Error)\`: Abort the action with an error
- \`retry(attempts?: number)\`: Retry the action
- \`delay(ms: number)\`: Add delay before continuing

### Example

\`\`\`typescript
useActionHandler('login', async (payload, controller) => {
  try {
    const response = await authService.login(payload);
    if (!response.success) {
      controller.abort('Login failed', new Error(response.error));
      return;
    }
    // Handle successful login
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      await controller.retry(3);
    } else {
      controller.abort('Login failed', error);
    }
  }
});
\`\`\`

## ActionPayloadMap

Base interface that all action type definitions must extend.

\`\`\`typescript
interface ActionPayloadMap {
  [actionType: string]: any;
}
\`\`\`

## Best Practices

1. **Type Safety**: Always define strict TypeScript interfaces
2. **Error Handling**: Use controller.abort() for proper error handling
3. **Async Operations**: All handlers should be async
4. **Single Responsibility**: Each handler should handle one specific action
5. **Testing**: Test handlers in isolation using mock controllers
`,
        metadata: {
          category: 'api',
          priority: 85,
          tags: ['reference', 'api', 'actions', 'typescript'],
          dependencies: {
            references: ['guides/getting-started.md', 'api/stores.md']
          }
        }
      },
      {
        path: 'api/stores.md',
        content: `# Store API Reference

Complete API reference for store management in Context-Action.

## createDeclarativeStorePattern<T>(name, stores)

Creates a declarative store pattern with type-safe store management.

### Parameters

- \`name\`: Unique identifier for the store pattern
- \`stores\`: Object defining store schemas

### Store Schema Types

\`\`\`typescript
type StoreSchema<T> = {
  initialValue: T;
  persist?: boolean;
  validation?: (value: T) => boolean;
};
\`\`\`

### Example

\`\`\`typescript
const { Provider, useStore, useStoreManager } = 
  createDeclarativeStorePattern('App', {
    user: { 
      initialValue: { id: '', name: '', email: '' },
      persist: true,
      validation: (user) => !!user.id
    },
    settings: { 
      initialValue: { theme: 'light' },
      persist: true
    }
  });
\`\`\`

## Store Instance Methods

### getValue(): T

Returns the current value of the store.

\`\`\`typescript
const userStore = useStore('user');
const currentUser = userStore.getValue();
\`\`\`

### setValue(value: T): void

Sets a new value for the store.

\`\`\`typescript
userStore.setValue({ id: '123', name: 'John', email: 'john@example.com' });
\`\`\`

### update(updater: (current: T) => T): void

Updates the store using an updater function.

\`\`\`typescript
userStore.update(user => ({ ...user, name: 'John Doe' }));
\`\`\`

### subscribe(callback: (value: T) => void): () => void

Subscribes to store changes. Returns an unsubscribe function.

\`\`\`typescript
const unsubscribe = userStore.subscribe(user => {
  console.log('User changed:', user);
});

// Later...
unsubscribe();
\`\`\`

### reset(): void

Resets the store to its initial value.

\`\`\`typescript
userStore.reset();
\`\`\`

## React Hooks

### useStoreValue(store)

Subscribes to store changes and returns the current value.

\`\`\`typescript
const userStore = useStore('user');
const user = useStoreValue(userStore);
\`\`\`

### useStoreComputed(store, selector)

Creates a computed value based on store state.

\`\`\`typescript
const fullName = useStoreComputed(userStore, user => 
  \`\${user.firstName} \${user.lastName}\`
);
\`\`\`

### useStoreSubscription(store, callback)

Sets up a subscription to store changes.

\`\`\`typescript
useStoreSubscription(userStore, user => {
  // React to user changes
  analytics.track('user_changed', user);
});
\`\`\`

## Store Manager

The store manager provides utilities for managing multiple stores.

### getAllStores(): Record<string, Store<any>>

Returns all stores in the pattern.

### getStoreValue<K>(key: K): T[K]

Gets the value of a specific store.

### setStoreValue<K>(key: K, value: T[K]): void

Sets the value of a specific store.

### resetAllStores(): void

Resets all stores to their initial values.

## Persistence

Stores with \`persist: true\` automatically save to localStorage.

### Custom Persistence

\`\`\`typescript
const storePattern = createDeclarativeStorePattern('App', {
  user: {
    initialValue: defaultUser,
    persist: true,
    persistKey: 'app_user_data',
    serializer: {
      serialize: (value) => JSON.stringify(value),
      deserialize: (data) => JSON.parse(data)
    }
  }
});
\`\`\`

## Validation

Store validation runs on every setValue call.

\`\`\`typescript
const stores = createDeclarativeStorePattern('App', {
  email: {
    initialValue: '',
    validation: (email) => /^[^@]+@[^@]+\.[^@]+$/.test(email)
  }
});
\`\`\`
`,
        metadata: {
          category: 'api',
          priority: 85,
          tags: ['reference', 'api', 'stores', 'typescript'],
          dependencies: {
            references: ['guides/store-integration.md', 'api/actions.md']
          }
        }
      },
      {
        path: 'examples/basic-todo-app.md',
        content: `# Basic Todo App Example

A complete example showing how to build a todo application using Context-Action.

## Project Structure

\`\`\`
src/
├── components/
│   ├── TodoList.tsx
│   ├── TodoItem.tsx
│   └── AddTodoForm.tsx
├── actions/
│   └── todoActions.ts
├── stores/
│   └── todoStores.ts
└── App.tsx
\`\`\`

## Store Definition

\`\`\`typescript
// stores/todoStores.ts
import { createDeclarativeStorePattern } from '@context-action/react';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export const {
  Provider: TodoStoreProvider,
  useStore: useTodoStore,
  useStoreManager: useTodoStoreManager
} = createDeclarativeStorePattern('Todo', {
  todos: { 
    initialValue: [] as Todo[],
    persist: true 
  },
  filter: { 
    initialValue: 'all' as 'all' | 'active' | 'completed' 
  }
});
\`\`\`

## Action Definitions

\`\`\`typescript
// actions/todoActions.ts
import { createActionContext, ActionPayloadMap } from '@context-action/react';

export interface TodoActions extends ActionPayloadMap {
  addTodo: { text: string };
  toggleTodo: { id: string };
  deleteTodo: { id: string };
  clearCompleted: void;
  setFilter: { filter: 'all' | 'active' | 'completed' };
}

export const {
  Provider: TodoActionProvider,
  useActionDispatch: useTodoActions,
  useActionHandler: useTodoActionHandler
} = createActionContext<TodoActions>('TodoActions');
\`\`\`

## Action Handlers

\`\`\`typescript
// components/TodoList.tsx
import { useTodoStore, useTodoActionHandler } from '../stores/todoStores';
import { generateId } from '../utils';

export function TodoActionHandlers() {
  const todosStore = useTodoStore('todos');

  useTodoActionHandler('addTodo', async (payload, controller) => {
    const newTodo = {
      id: generateId(),
      text: payload.text.trim(),
      completed: false,
      createdAt: new Date()
    };

    if (!newTodo.text) {
      controller.abort('Todo text cannot be empty');
      return;
    }

    todosStore.update(todos => [...todos, newTodo]);
  });

  useTodoActionHandler('toggleTodo', async (payload) => {
    todosStore.update(todos =>
      todos.map(todo =>
        todo.id === payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  });

  useTodoActionHandler('deleteTodo', async (payload) => {
    todosStore.update(todos =>
      todos.filter(todo => todo.id !== payload.id)
    );
  });

  useTodoActionHandler('clearCompleted', async () => {
    todosStore.update(todos =>
      todos.filter(todo => !todo.completed)
    );
  });

  return null; // This component only handles actions
}
\`\`\`

## Components

\`\`\`tsx
// components/TodoList.tsx
import { useStoreValue } from '@context-action/react';
import { useTodoStore, useTodoActions } from '../stores/todoStores';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const todosStore = useTodoStore('todos');
  const filterStore = useTodoStore('filter');
  
  const todos = useStoreValue(todosStore);
  const filter = useStoreValue(filterStore);
  const dispatch = useTodoActions();

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div className="todo-list">
      <div className="filters">
        {(['all', 'active', 'completed'] as const).map(filterType => (
          <button
            key={filterType}
            className={filter === filterType ? 'active' : ''}
            onClick={() => dispatch('setFilter', { filter: filterType })}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>
      
      <ul>
        {filteredTodos.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
      
      {todos.some(todo => todo.completed) && (
        <button
          className="clear-completed"
          onClick={() => dispatch('clearCompleted')}
        >
          Clear Completed
        </button>
      )}
    </div>
  );
}
\`\`\`

## App Setup

\`\`\`tsx
// App.tsx
import { TodoStoreProvider, TodoActionProvider } from './stores/todoStores';
import { TodoActionHandlers } from './components/TodoActionHandlers';
import { TodoList } from './components/TodoList';
import { AddTodoForm } from './components/AddTodoForm';

export function App() {
  return (
    <TodoStoreProvider>
      <TodoActionProvider>
        <TodoActionHandlers />
        <div className="app">
          <h1>Todo App</h1>
          <AddTodoForm />
          <TodoList />
        </div>
      </TodoActionProvider>
    </TodoStoreProvider>
  );
}
\`\`\`

## Key Concepts Demonstrated

1. **Store Pattern**: Using declarative stores for state management
2. **Action Pattern**: Centralized action dispatching and handling
3. **Separation of Concerns**: Clear separation between UI, actions, and state
4. **Type Safety**: Full TypeScript integration throughout
5. **Persistence**: Automatic localStorage persistence for todos
6. **Error Handling**: Proper error handling in action handlers

This example shows the complete lifecycle of a Context-Action application from setup to implementation.
`,
        metadata: {
          category: 'example',
          priority: 80,
          tags: ['example', 'tutorial', 'practical', 'todo-app'],
          dependencies: {
            prerequisites: ['guides/getting-started.md', 'guides/store-integration.md'],
            references: ['api/actions.md', 'api/stores.md']
          }
        }
      },
      {
        path: 'troubleshooting/common-issues.md',
        content: `# Troubleshooting Common Issues

Solutions for common problems encountered when using Context-Action.

## Installation Issues

### "Module not found" errors

**Problem**: Getting errors like \`Cannot resolve module '@context-action/react'\`

**Solutions**:

1. Ensure you've installed both packages:
   \`\`\`bash
   npm install @context-action/core @context-action/react
   \`\`\`

2. Clear node_modules and reinstall:
   \`\`\`bash
   rm -rf node_modules package-lock.json
   npm install
   \`\`\`

3. Check TypeScript configuration includes node_modules resolution.

### Peer dependency warnings

**Problem**: Warnings about React peer dependencies

**Solution**: Ensure your React version is compatible (16.8+):
\`\`\`bash
npm list react
\`\`\`

## Runtime Issues

### "Handler not found" Error

**Problem**: Getting \`ActionError: No handler found for action 'actionName'\`

**Cause**: Action dispatched before handler registration or handler not properly registered.

**Solutions**:

1. Ensure handlers are registered before components mount:
   \`\`\`tsx
   function ActionSetup({ children }) {
     useActionHandler('myAction', handler);
     return children;
   }
   \`\`\`

2. Use useEffect for complex handler setup:
   \`\`\`tsx
   useEffect(() => {
     const unregister = registerActionHandler('myAction', handler);
     return unregister;
   }, []);
   \`\`\`

3. Check handler registration order in component hierarchy.

### Store not updating components

**Problem**: Store changes not triggering component re-renders

**Solutions**:

1. Use \`useStoreValue()\` instead of direct \`getValue()\`:
   \`\`\`tsx
   // ✅ Correct - reactive
   const value = useStoreValue(store);
   
   // ❌ Wrong - not reactive
   const value = store.getValue();
   \`\`\`

2. Ensure store updates use \`setValue()\` or \`update()\`:
   \`\`\`tsx
   // ✅ Correct
   store.setValue(newValue);
   store.update(current => ({ ...current, field: newValue }));
   
   // ❌ Wrong - mutating directly
   const current = store.getValue();
   current.field = newValue; // Won't trigger updates
   \`\`\`

### Memory Leaks

**Problem**: Memory usage growing over time

**Causes and Solutions**:

1. **Unregistered handlers**:
   \`\`\`tsx
   useEffect(() => {
     const unregister = useActionHandler('action', handler);
     return unregister; // Important!
   }, []);
   \`\`\`

2. **Store subscriptions not cleaned up**:
   \`\`\`tsx
   useEffect(() => {
     const unsubscribe = store.subscribe(handler);
     return unsubscribe; // Important!
   }, []);
   \`\`\`

3. **Component not unmounting properly**:
   Check for circular references or missing cleanup.

## TypeScript Issues

### Type errors with ActionPayloadMap

**Problem**: \`Type 'X' is not assignable to type 'ActionPayloadMap'\`

**Solution**: Ensure your interface extends ActionPayloadMap:
\`\`\`typescript
interface MyActions extends ActionPayloadMap {
  action1: { data: string };
  action2: void;
}
\`\`\`

### Generic type inference issues

**Problem**: TypeScript can't infer types properly

**Solutions**:

1. Provide explicit generic parameters:
   \`\`\`typescript
   const dispatch = useActionDispatch<MyActions>();
   \`\`\`

2. Use const assertions for action types:
   \`\`\`typescript
   dispatch('myAction' as const, payload);
   \`\`\`

### Store type errors

**Problem**: Store types not inferred correctly

**Solution**: Use explicit typing in store pattern:
\`\`\`typescript
const stores = createDeclarativeStorePattern('App', {
  user: { initialValue: {} as User },
  settings: { initialValue: {} as Settings }
});
\`\`\`

## Performance Issues

### Slow action dispatching

**Causes and Solutions**:

1. **Heavy synchronous operations in handlers**:
   \`\`\`tsx
   // ❌ Blocking
   useActionHandler('heavyAction', async (payload) => {
     heavySyncOperation(); // Blocks UI
   });
   
   // ✅ Non-blocking
   useActionHandler('heavyAction', async (payload) => {
     await new Promise(resolve => setTimeout(resolve, 0));
     heavySyncOperation();
   });
   \`\`\`

2. **Too many store updates**:
   Batch multiple updates:
   \`\`\`tsx
   store.update(current => ({
     ...current,
     field1: value1,
     field2: value2
   }));
   \`\`\`

### Excessive re-renders

**Solutions**:

1. **Use React.memo for expensive components**:
   \`\`\`tsx
   const ExpensiveComponent = React.memo(({ data }) => {
     // Expensive rendering
   });
   \`\`\`

2. **Split store subscriptions**:
   \`\`\`tsx
   // Instead of subscribing to entire store
   const user = useStoreValue(userStore);
   
   // Subscribe to specific fields
   const userName = useStoreValue(userStore, user => user.name);
   \`\`\`

## Testing Issues

### Mocking Context-Action in tests

**Setup**:
\`\`\`typescript
// test-utils.tsx
export function createMockActionContext() {
  const dispatch = jest.fn();
  const registerHandler = jest.fn();
  
  return {
    dispatch,
    registerHandler,
    Provider: ({ children }) => children
  };
}
\`\`\`

### Testing async actions

**Example**:
\`\`\`typescript
test('should handle async action', async () => {
  const handler = jest.fn();
  renderWithContext(<Component />, { handlers: { myAction: handler } });
  
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(handler).toHaveBeenCalled();
  });
});
\`\`\`

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/context-action/framework/issues)
2. Review the [API Documentation](../api/)
3. Look at more [Examples](../examples/)
4. Join our [Discord Community](https://discord.gg/context-action)

Remember to include:
- Context-Action version
- React version
- Code sample demonstrating the issue
- Expected vs actual behavior
`,
        metadata: {
          category: 'support',
          priority: 85,
          tags: ['troubleshooting', 'debugging', 'support', 'common-issues'],
          dependencies: {
            references: [
              'guides/getting-started.md',
              'api/actions.md',
              'api/stores.md'
            ]
          }
        }
      }
    ];

    // Write documents
    documentStructure.forEach(doc => {
      const fullPath = path.join(projectDocsDir, doc.path);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, doc.content);
    });

    // Create priority.json file
    const priorityData = documentStructure.reduce((acc, doc) => {
      acc[doc.path] = {
        priority: doc.metadata.priority,
        category: doc.metadata.category,
        tags: doc.metadata.tags,
        dependencies: doc.metadata.dependencies || {}
      };
      return acc;
    }, {} as any);

    fs.writeFileSync(
      path.join(projectDocsDir, 'priority.json'),
      JSON.stringify(priorityData, null, 2)
    );

    // Create comprehensive configuration
    const config = {
      paths: {
        docs: projectDocsDir,
        output: outputDir,
        priority: path.join(projectDocsDir, 'priority.json')
      },
      generation: {
        defaultCharacterLimits: [1000, 3000, 8000],
        qualityThreshold: 75,
        defaultStrategy: 'balanced'
      },
      categories: {
        overview: {
          name: 'Overview',
          description: 'Project overview and introduction',
          priority: 100,
          defaultStrategy: 'overview-first',
          tags: ['introduction', 'overview']
        },
        guide: {
          name: 'Guides',
          description: 'Step-by-step guides and tutorials',
          priority: 90,
          defaultStrategy: 'tutorial-first',
          tags: ['beginner', 'tutorial', 'practical']
        },
        api: {
          name: 'API Reference',
          description: 'Complete API documentation',
          priority: 85,
          defaultStrategy: 'reference-first',
          tags: ['reference', 'api', 'technical']
        },
        example: {
          name: 'Examples',
          description: 'Code examples and demonstrations',
          priority: 80,
          defaultStrategy: 'example-first',
          tags: ['practical', 'example', 'code']
        },
        support: {
          name: 'Support',
          description: 'Troubleshooting and support',
          priority: 75,
          defaultStrategy: 'problem-solving',
          tags: ['troubleshooting', 'support', 'debugging']
        }
      },
      tags: {
        introduction: {
          name: 'Introduction',
          description: 'Introductory content',
          weight: 1.3,
          compatibleWith: ['overview', 'beginner'],
          audience: ['new-users']
        },
        beginner: {
          name: 'Beginner',
          description: 'Beginner-friendly content',
          weight: 1.2,
          compatibleWith: ['tutorial', 'practical'],
          audience: ['new-users', 'beginners']
        },
        intermediate: {
          name: 'Intermediate',
          description: 'Intermediate level content',
          weight: 1.0,
          compatibleWith: ['practical', 'technical'],
          audience: ['developers']
        },
        advanced: {
          name: 'Advanced',
          description: 'Advanced level content',
          weight: 0.9,
          compatibleWith: ['technical', 'patterns'],
          audience: ['experts', 'senior-developers']
        },
        reference: {
          name: 'Reference',
          description: 'Reference documentation',
          weight: 1.1,
          compatibleWith: ['api', 'technical'],
          audience: ['developers', 'all-users']
        },
        practical: {
          name: 'Practical',
          description: 'Practical, hands-on content',
          weight: 1.2,
          compatibleWith: ['example', 'tutorial'],
          audience: ['developers', 'all-users']
        },
        troubleshooting: {
          name: 'Troubleshooting',
          description: 'Problem-solving content',
          weight: 1.1,
          compatibleWith: ['support', 'debugging'],
          audience: ['all-users']
        }
      },
      dependencies: {
        enabled: true,
        maxDepth: 3,
        includeOptional: true,
        conflictResolution: 'higher-score-wins'
      },
      composition: {
        strategies: {
          balanced: {
            name: 'Balanced Strategy',
            algorithm: 'hybrid',
            criteria: {
              categoryWeight: 0.3,
              tagWeight: 0.3,
              dependencyWeight: 0.2,
              priorityWeight: 0.2
            }
          },
          'beginner-focused': {
            name: 'Beginner Focused',
            algorithm: 'greedy',
            criteria: {
              categoryWeight: 0.2,
              tagWeight: 0.5,
              dependencyWeight: 0.2,
              priorityWeight: 0.1
            }
          },
          'reference-focused': {
            name: 'Reference Focused',
            algorithm: 'knapsack',
            criteria: {
              categoryWeight: 0.4,
              tagWeight: 0.2,
              dependencyWeight: 0.1,
              priorityWeight: 0.3
            }
          }
        },
        defaultStrategy: 'balanced'
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  function runCLI(args: string[], timeout: number = 30000): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve) => {
      const child = spawn('node', ['./dist/cli.js', ...args], {
        cwd: path.join(__dirname, '../../'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({ exitCode: -1, stdout, stderr: stderr + '\nProcess timed out' });
      }, timeout);

      child.on('exit', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code || 0,
          stdout,
          stderr
        });
      });
    });
  }

  describe('Complete Project Documentation Workflow', () => {
    it('should generate comprehensive project documentation summary', async () => {
      const result = await runCLI([
        'generate',
        '--config', configPath,
        '--chars', '5000',
        '--strategy', 'balanced',
        '--tags', 'introduction,beginner,practical',
        '--output', path.join(outputDir, 'project-summary.md'),
        '--performance-metrics',
        '--verbose'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generation completed');
      expect(result.stdout).toContain('Processing time:');
      expect(result.stdout).toContain('Documents processed:');

      const summaryFile = path.join(outputDir, 'project-summary.md');
      expect(fs.existsSync(summaryFile)).toBe(true);

      const content = fs.readFileSync(summaryFile, 'utf8');
      expect(content).toContain('Context-Action Framework');
      expect(content).toContain('Getting Started');
      expect(content).toMatch(/npm install|yarn add/); // Installation instructions
      expect(content.length).toBeLessThanOrEqual(5500); // Within character limit
    });

    it('should generate API-focused documentation for developers', async () => {
      const result = await runCLI([
        'generate',
        '--config', configPath,
        '--categories', 'api',
        '--tags', 'reference,technical',
        '--chars', '4000',
        '--strategy', 'reference-focused',
        '--output', path.join(outputDir, 'api-reference.md')
      ]);

      expect(result.exitCode).toBe(0);

      const apiFile = path.join(outputDir, 'api-reference.md');
      const content = fs.readFileSync(apiFile, 'utf8');
      
      expect(content).toContain('Action API Reference');
      expect(content).toContain('Store API Reference');
      expect(content).toContain('createActionContext');
      expect(content).toContain('useActionDispatch');
      expect(content).toMatch(/typescript|TypeScript/i);
    });

    it('should generate beginner-friendly onboarding documentation', async () => {
      const result = await runCLI([
        'generate',
        '--config', configPath,
        '--tags', 'beginner,tutorial,introduction',
        '--chars', '3000',
        '--strategy', 'beginner-focused',
        '--output', path.join(outputDir, 'onboarding-guide.md'),
        '--quality-threshold', '80'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Quality threshold: 80');

      const onboardingFile = path.join(outputDir, 'onboarding-guide.md');
      const content = fs.readFileSync(onboardingFile, 'utf8');
      
      expect(content).toContain('Getting Started');
      expect(content).toMatch(/installation|install/i);
      expect(content).toMatch(/basic.*setup/i);
      expect(content).not.toContain('Advanced'); // Should not include advanced content
    });

    it('should create comprehensive troubleshooting guide', async () => {
      const result = await runCLI([
        'generate',
        '--config', configPath,
        '--categories', 'support',
        '--tags', 'troubleshooting,debugging',
        '--chars', '6000',
        '--output', path.join(outputDir, 'troubleshooting-guide.md')
      ]);

      expect(result.exitCode).toBe(0);

      const troubleshootingFile = path.join(outputDir, 'troubleshooting-guide.md');
      const content = fs.readFileSync(troubleshootingFile, 'utf8');
      
      expect(content).toContain('Troubleshooting');
      expect(content).toContain('Common Issues');
      expect(content).toMatch(/error|issue|problem/i);
      expect(content).toMatch(/solution|fix|resolve/i);
    });
  });

  describe('Multi-Version Documentation Generation', () => {
    it('should generate multiple versions for different use cases', async () => {
      const versions = [
        {
          name: 'quick-start',
          chars: 1000,
          tags: 'introduction,overview',
          description: 'Quick overview for immediate understanding'
        },
        {
          name: 'comprehensive',
          chars: 8000,
          tags: 'beginner,intermediate,practical',
          description: 'Comprehensive guide covering all basics'
        },
        {
          name: 'developer-reference',
          chars: 5000,
          tags: 'reference,api,technical',
          description: 'Complete API reference for developers'
        }
      ];

      const results = await Promise.all(
        versions.map(version =>
          runCLI([
            'generate',
            '--config', configPath,
            '--chars', version.chars.toString(),
            '--tags', version.tags,
            '--output', path.join(outputDir, `${version.name}.md`),
            '--metadata'
          ])
        )
      );

      // All generations should succeed
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Generation completed');

        const outputFile = path.join(outputDir, `${versions[index].name}.md`);
        expect(fs.existsSync(outputFile)).toBe(true);

        const content = fs.readFileSync(outputFile, 'utf8');
        expect(content.length).toBeLessThanOrEqual(versions[index].chars * 1.1); // 10% tolerance
      });

      // Verify content differences
      const quickStart = fs.readFileSync(path.join(outputDir, 'quick-start.md'), 'utf8');
      const comprehensive = fs.readFileSync(path.join(outputDir, 'comprehensive.md'), 'utf8');
      const devReference = fs.readFileSync(path.join(outputDir, 'developer-reference.md'), 'utf8');

      expect(comprehensive.length).toBeGreaterThan(quickStart.length);
      expect(devReference).toContain('API Reference');
      expect(quickStart).toContain('Context-Action');
    });

    it('should generate documentation for different audience types', async () => {
      const audiences = [
        { name: 'newcomers', tags: 'introduction,beginner', audience: 'new-users' },
        { name: 'developers', tags: 'api,reference,technical', audience: 'developers' },
        { name: 'experts', tags: 'advanced,patterns', audience: 'experts' }
      ];

      for (const audience of audiences) {
        const result = await runCLI([
          'generate',
          '--config', configPath,
          '--tags', audience.tags,
          '--audience', audience.audience,
          '--chars', '3000',
          '--output', path.join(outputDir, `${audience.name}-guide.md`)
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(`Target audience: ${audience.audience}`);

        const outputFile = path.join(outputDir, `${audience.name}-guide.md`);
        expect(fs.existsSync(outputFile)).toBe(true);
      }
    });
  });

  describe('Quality and Analysis Workflows', () => {
    it('should perform comprehensive project analysis', async () => {
      const result = await runCLI([
        'analyze',
        '--config', configPath,
        '--comprehensive',
        '--format', 'json',
        '--output', path.join(outputDir, 'project-analysis.json')
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Analysis completed');

      const analysisFile = path.join(outputDir, 'project-analysis.json');
      const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

      expect(analysis.totalDocuments).toBeGreaterThan(5);
      expect(analysis.categories).toHaveProperty('guide');
      expect(analysis.categories).toHaveProperty('api');
      expect(analysis.tags).toHaveProperty('beginner');
      expect(analysis.dependencyAnalysis).toBeDefined();
      expect(analysis.qualityMetrics.averageScore).toBeGreaterThan(70);
    });

    it('should validate project documentation structure', async () => {
      const result = await runCLI([
        'validate',
        '--config', configPath,
        '--documents',
        '--dependencies',
        '--coverage',
        '--format', 'json',
        '--output', path.join(outputDir, 'validation-report.json')
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Validation completed');

      const validationFile = path.join(outputDir, 'validation-report.json');
      const validation = JSON.parse(fs.readFileSync(validationFile, 'utf8'));

      expect(validation.configurationValid).toBe(true);
      expect(validation.documentsValid).toBe(true);
      expect(validation.dependenciesValid).toBe(true);
      expect(validation.coverage.categoryDistribution).toBeDefined();
    });

    it('should generate quality improvement recommendations', async () => {
      const result = await runCLI([
        'analyze',
        '--config', configPath,
        '--quality-report',
        '--recommendations',
        '--output', path.join(outputDir, 'quality-recommendations.json')
      ]);

      expect(result.exitCode).toBe(0);

      const recommendationsFile = path.join(outputDir, 'quality-recommendations.json');
      const recommendations = JSON.parse(fs.readFileSync(recommendationsFile, 'utf8'));

      expect(recommendations.overallScore).toBeGreaterThan(0);
      expect(Array.isArray(recommendations.recommendations)).toBe(true);
      expect(recommendations.metrics).toBeDefined();
      expect(recommendations.actionPlan).toBeDefined();
    });
  });

  describe('Integration with Core System', () => {
    it('should validate "적절히" concept through full workflow', async () => {
      // Test the core "appropriate selection" concept through complete workflow
      const configManager = new EnhancedConfigManager();
      const config = await configManager.loadConfig(configPath);
      
      const selector = new AdaptiveDocumentSelector(config);
      const qualityEvaluator = new QualityEvaluator(config);

      // Simulate CLI workflow
      const constraints = {
        maxCharacters: 4000,
        targetCharacterLimit: 4000,
        context: {
          targetTags: ['beginner', 'practical', 'tutorial'],
          tagWeights: { beginner: 1.3, practical: 1.2, tutorial: 1.1 },
          selectedDocuments: [],
          maxCharacters: 4000,
          targetCharacterLimit: 4000
        }
      };

      // This would normally be done by CLI scanning documents
      const mockDocuments = [
        {
          document: { id: 'getting-started', title: 'Getting Started', source_path: 'guides/getting-started.md', category: 'guide' },
          tags: { primary: ['beginner', 'tutorial'], audience: ['new-users'], complexity: 'basic' },
          priority: { score: 95, tier: 'critical' as const }
        },
        {
          document: { id: 'api-actions', title: 'API Actions', source_path: 'api/actions.md', category: 'api' },
          tags: { primary: ['reference', 'api'], audience: ['developers'], complexity: 'intermediate' },
          priority: { score: 85, tier: 'important' as const }
        }
      ] as any;

      const result = await selector.selectDocuments(mockDocuments, constraints, {
        strategy: 'balanced'
      });

      // Should appropriately select beginner-focused content
      expect(result.selectedDocuments.length).toBeGreaterThan(0);
      expect(result.optimization.qualityScore).toBeGreaterThan(0.7);

      // Quality should reflect appropriate selection
      const qualityReport = qualityEvaluator.evaluateQuality(
        result.selectedDocuments,
        constraints,
        result
      );

      expect(qualityReport.overallScore).toBeGreaterThan(75);
      expect(qualityReport.metrics['audience-alignment'].value).toBeGreaterThan(0.8);
      expect(qualityReport.grade).toMatch(/^[ABC]/);
    });

    it('should demonstrate end-to-end workflow performance', async () => {
      const startTime = Date.now();

      // Generate multiple outputs in parallel to test performance
      const tasks = [
        runCLI(['generate', '--config', configPath, '--chars', '2000', '--tags', 'beginner', '--output', path.join(outputDir, 'perf-1.md')]),
        runCLI(['generate', '--config', configPath, '--chars', '3000', '--tags', 'reference', '--output', path.join(outputDir, 'perf-2.md')]),
        runCLI(['analyze', '--config', configPath, '--format', 'json', '--output', path.join(outputDir, 'perf-analysis.json')])
      ];

      const results = await Promise.all(tasks);
      const totalTime = Date.now() - startTime;

      // All tasks should complete successfully
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });

      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(15000); // Under 15 seconds

      // All outputs should exist
      expect(fs.existsSync(path.join(outputDir, 'perf-1.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'perf-2.md'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'perf-analysis.json'))).toBe(true);

      console.log(`End-to-end workflow completed in ${totalTime}ms`);
    });
  });

  describe('Error Recovery in Real Scenarios', () => {
    it('should handle corrupted project files gracefully', async () => {
      // Corrupt a document file
      const corruptFile = path.join(projectDocsDir, 'corrupted.md');
      fs.writeFileSync(corruptFile, 'Invalid content with\x00null bytes and \uFFFD replacement chars');

      const result = await runCLI([
        'generate',
        '--config', configPath,
        '--output', path.join(outputDir, 'recovery-test.md'),
        '--error-recovery'
      ]);

      // Should complete despite corruption
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('recovered from errors');

      const outputFile = path.join(outputDir, 'recovery-test.md');
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should provide meaningful error messages for configuration issues', async () => {
      const invalidConfig = path.join(outputDir, 'invalid-config.json');
      fs.writeFileSync(invalidConfig, '{ invalid json content');

      const result = await runCLI([
        'validate',
        '--config', invalidConfig
      ]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('JSON');
      expect(result.stderr).toContain('invalid');
    });
  });
});