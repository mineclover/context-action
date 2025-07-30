# Jotai Integration

The `@context-action/jotai` package provides seamless integration between Context Action and Jotai atoms, enabling powerful state management with atomic updates.

## Installation

::: code-group

```bash [npm]
npm install @context-action/jotai jotai
```

```bash [pnpm]
pnpm add @context-action/jotai jotai
```

```bash [yarn]
yarn add @context-action/jotai jotai
```

:::

## createAtomContext

Creates a context-based atom that can be shared across components using React Context.

### Syntax

```typescript
function createAtomContext<T>(initialValue: T): {
  Provider: React.ComponentType<{ children: ReactNode }>;
  useAtomContext: () => AtomContextType<T>;
  useAtomState: () => [T, (update: T | ((prev: T) => T)) => void];
  useAtomReadOnly: () => T;
  useAtomSelect: <R>(callback: (item: T) => R) => R;
  useAtomSetter: () => (update: T | ((prev: T) => T)) => void;
}
```

### Parameters

- `initialValue: T` - The initial value for the atom

### Returns

An object containing:

- **`Provider`** - Context provider component that wraps your app
- **`useAtomContext`** - Hook to access the atom context (low-level)
- **`useAtomState`** - Hook that returns both value and setter (like `useState`)
- **`useAtomReadOnly`** - Hook that returns only the current value
- **`useAtomSelect`** - Hook that returns a derived/selected value
- **`useAtomSetter`** - Hook that returns only the setter function

## Usage Examples

### Basic Usage

```typescript
import { createAtomContext } from '@context-action/jotai';

interface AppState {
  count: number;
  user: string | null;
}

const initialState: AppState = {
  count: 0,
  user: null
};

const { 
  Provider, 
  useAtomState, 
  useAtomReadOnly, 
  useAtomSelect,
  useAtomSetter 
} = createAtomContext(initialState);

function App() {
  return (
    <Provider>
      <Counter />
      <UserDisplay />
    </Provider>
  );
}
```

### Reading and Writing State

```typescript
function Counter() {
  const [state, setState] = useAtomState();
  
  const increment = () => {
    setState(prev => ({ ...prev, count: prev.count + 1 }));
  };
  
  const reset = () => {
    setState(prev => ({ ...prev, count: 0 }));
  };
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Read-Only Access

```typescript
function CountDisplay() {
  const state = useAtomReadOnly();
  
  return <div>Current count: {state.count}</div>;
}
```

### Selective Updates

```typescript
function UserDisplay() {
  // Only re-render when user changes, not count
  const user = useAtomSelect(state => state.user);
  
  return <div>User: {user || 'Not logged in'}</div>;
}
```

### Setter Only

```typescript
function UserControls() {
  const setState = useAtomSetter();
  
  const login = (username: string) => {
    setState(prev => ({ ...prev, user: username }));
  };
  
  const logout = () => {
    setState(prev => ({ ...prev, user: null }));
  };
  
  return (
    <div>
      <button onClick={() => login('John')}>Login as John</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Advanced Patterns

### Combining with Action Context

```typescript
import { createActionContext } from '@context-action/react';
import { createAtomContext } from '@context-action/jotai';

interface AppState {
  count: number;
  todos: string[];
}

interface AppActions {
  increment: void;
  addTodo: string;
  reset: void;
}

const { Provider: StateProvider, useAtomState } = createAtomContext<AppState>({
  count: 0,
  todos: []
});

const { Provider: ActionProvider, useActionHandler } = createActionContext<AppActions>();

function TodoApp() {
  return (
    <StateProvider>
      <ActionProvider>
        <TodoManager />
      </ActionProvider>
    </StateProvider>
  );
}

function TodoManager() {
  const [state, setState] = useAtomState();
  
  useActionHandler('increment', () => {
    setState(prev => ({ ...prev, count: prev.count + 1 }));
  });
  
  useActionHandler('addTodo', (todo) => {
    setState(prev => ({ ...prev, todos: [...prev.todos, todo] }));
  });
  
  useActionHandler('reset', () => {
    setState({ count: 0, todos: [] });
  });
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <p>Todos: {state.todos.length}</p>
    </div>
  );
}
```

### Performance Optimization

```typescript
function OptimizedComponent() {
  // Only re-render when specific parts of state change
  const count = useAtomSelect(state => state.count);
  const todoCount = useAtomSelect(state => state.todos.length);
  
  return (
    <div>
      <div>Count: {count}</div>
      <div>Todo Count: {todoCount}</div>
    </div>
  );
}
```

## TypeScript Support

The Jotai integration provides full TypeScript support with proper type inference:

```typescript
interface UserState {
  id: number;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const { Provider, useAtomSelect, useAtomSetter } = createAtomContext<UserState>({
  id: 0,
  name: '',
  email: '',
  preferences: {
    theme: 'light',
    notifications: true
  }
});

// Type-safe selectors
const theme = useAtomSelect(state => state.preferences.theme); // 'light' | 'dark'
const userId = useAtomSelect(state => state.id); // number

// Type-safe updates
const setState = useAtomSetter();
setState(prev => ({
  ...prev,
  preferences: {
    ...prev.preferences,
    theme: 'dark' // TypeScript ensures this is valid
  }
}));
```

## API Reference

### Provider

Context provider that makes the atom available to child components.

```typescript
<Provider>
  {/* Your app components */}
</Provider>
```

### useAtomState

Returns both the current state and a setter function.

```typescript
const [state, setState] = useAtomState();
```

### useAtomReadOnly

Returns only the current state (read-only access).

```typescript
const state = useAtomReadOnly();
```

### useAtomSelect

Returns a derived value from the state. Only re-renders when the selected value changes.

```typescript
const selectedValue = useAtomSelect(state => state.someProperty);
```

### useAtomSetter

Returns only the setter function for updating state.

```typescript
const setState = useAtomSetter();
```

### useAtomContext

Low-level hook for accessing the atom context directly. Typically not needed in most use cases.

```typescript
const context = useAtomContext();
```

## Best Practices

1. **Use `useAtomSelect` for performance** - Only subscribe to the parts of state you need
2. **Separate providers logically** - Use multiple atom contexts for different domains
3. **Combine with actions** - Use together with `@context-action/react` for complete state management
4. **Type your state** - Always use TypeScript interfaces for better developer experience
5. **Keep atoms focused** - Don't put everything in one giant atom, split by domain

## Migration from useState

```typescript
// Before (useState)
function MyComponent() {
  const [state, setState] = useState(initialState);
  // ...
}

// After (createAtomContext)
const { Provider, useAtomState } = createAtomContext(initialState);

function MyComponent() {
  const [state, setState] = useAtomState();
  // Same API, but now shareable across components!
}
```