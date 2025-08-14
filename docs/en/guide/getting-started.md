# Getting Started

Context-Action provides two main patterns for state management in React applications.

## Quick Start

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createDeclarativeStorePattern` | Pure state management, data layers |

## 🎯 Action Only Pattern

Pure action dispatching without state management.

### Basic Usage
```tsx
import { createActionContext } from '@context-action/react';

// 1. Define Actions
interface EventActions {
  userClick: { x: number; y: number };
  analytics: { event: string; data: any };
}

// 2. Create Context
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

// 3. Provider Setup
function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. Component Usage
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  useEventActionHandler('userClick', (payload) => {
    console.log('User clicked at:', payload.x, payload.y);
  });
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}
```

## 🏪 Store Only Pattern

Type-safe state management without action dispatching.

### Basic Usage
```tsx
import { createDeclarativeStorePattern } from '@context-action/react';

// 1. Create Pattern
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' } }
});

// 2. Provider Setup
function App() {
  return (
    <AppStoreProvider>
      <UserComponent />
    </AppStoreProvider>
  );
}

// 3. Component Usage
function UserComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  const { updateStore } = useAppStoreManager();
  
  const updateUser = (newUser: any) => {
    updateStore('user', newUser);
  };
  
  return (
    <div>
      <p>User: {user.name}</p>
      <button onClick={() => updateUser({ name: 'John', email: 'john@example.com' })}>
        Update User
      </button>
    </div>
  );
}
```

## Pattern Composition

For complex applications, combine both patterns:

```tsx
function ComplexApp() {
  return (
    <AppStoreProvider>
      <EventActionProvider>
        <MyComponent />
      </EventActionProvider>
    </AppStoreProvider>
  );
}
```

## Next Steps

- [Action Pipeline](./action-pipeline.md) - Learn about action processing
- [Architecture](./architecture.md) - Understand the overall architecture
- [Hooks](./hooks.md) - Explore available React hooks
- [Best Practices](./best-practices.md) - Follow recommended patterns