# @context-action/react

React integration layer providing Context and hooks for seamless state management.

## Installation

```bash
npm install @context-action/core @context-action/react
```

## Overview

The React package provides:

- **createActionContext**: Factory function to create React Context for actions
- **Hooks**: Easy-to-use hooks for action dispatching and handler registration
- **Provider**: React Context Provider component
- **Type Safety**: Full TypeScript support with React integration

## Key Features

- 🎯 **React Integration**: Seamless Context and hooks integration
- 🔒 **Type-safe Hooks**: TypeScript-powered hooks with full type inference
- 🔄 **Automatic Cleanup**: Handlers automatically unregister on component unmount
- ⚡ **Performance**: Optimized with React's built-in optimization patterns
- 🧩 **Component Isolation**: Each component can register its own handlers

## Basic Usage

```typescript
import React, { useState } from 'react';
import { createActionContext } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

// Define your actions
interface AppActions extends ActionPayloadMap {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
}

// Create action context
const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();

function App() {
  return (
    <Provider>
      <Counter />
      <Controls />
    </Provider>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  
  // Register action handlers
  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('decrement', () => setCount(prev => prev - 1));
  useActionHandler('setCount', (newCount) => setCount(newCount));
  useActionHandler('reset', () => setCount(0));

  return <div>Count: {count}</div>;
}

function Controls() {
  const dispatch = useAction();

  return (
    <div>
      <button onClick={() => dispatch('increment')}>+</button>
      <button onClick={() => dispatch('decrement')}>-</button>
      <button onClick={() => dispatch('setCount', 10)}>Set 10</button>
      <button onClick={() => dispatch('reset')}>Reset</button>
    </div>
  );
}
```

## API Reference

### Functions

- [`createActionContext`](../generated/functions/createAction.md) - Create React Context for action management

### Return Types

The `createActionContext` function returns an object with:

- **Provider**: React Context Provider component
- **useAction**: Hook to get the ActionRegister instance
- **useActionHandler**: Hook to register action handlers
- **useActionContext**: Hook to access the raw context (advanced usage)

## Hooks

### useAction()

Get the ActionRegister instance to dispatch actions:

```typescript
function MyComponent() {
  const dispatch = useAction();
  
  const handleClick = () => {
    dispatch('myAction', { data: 'example' });
  };
  
  return <button onClick={handleClick}>Dispatch Action</button>;
}
```

### useActionHandler(action, handler, config?)

Register a handler for an action:

```typescript
function MyComponent() {
  const [data, setData] = useState(null);
  
  // Basic handler
  useActionHandler('loadData', (newData) => {
    setData(newData);
  });
  
  // Handler with configuration
  useActionHandler('priorityAction', (payload) => {
    console.log('High priority handler');
  }, { priority: 10 });
  
  // Async handler
  useActionHandler('asyncAction', async (payload) => {
    await api.process(payload);
  }, { blocking: true });
  
  return <div>{data}</div>;
}
```

## Advanced Patterns

### Multiple Handlers

Multiple components can register handlers for the same action:

```typescript
function Logger() {
  useActionHandler('userAction', (action) => {
    console.log('User action:', action);
  }, { priority: 1 }); // Log first
  
  return null;
}

function Analytics() {
  useActionHandler('userAction', async (action) => {
    await analytics.track(action);
  }, { priority: 0, blocking: false }); // Track after logging
  
  return null;
}

function App() {
  return (
    <Provider>
      <Logger />
      <Analytics />
      <MainApp />
    </Provider>
  );
}
```

### Conditional Handlers

Register handlers based on conditions:

```typescript
function ConditionalHandler({ isEnabled }) {
  useActionHandler('conditionalAction', (payload) => {
    if (isEnabled) {
      console.log('Handler is enabled:', payload);
    }
  });
  
  return null;
}
```

### Handler Cleanup

Handlers are automatically cleaned up when components unmount, but you can also manually control registration:

```typescript
function ManualHandler() {
  const dispatch = useAction();
  
  useEffect(() => {
    const unregister = action.register('manualAction', (payload) => {
      console.log('Manual handler:', payload);
    });
    
    // Cleanup on specific condition
    return () => {
      if (shouldCleanup) {
        unregister();
      }
    };
  }, [action]);
  
  return null;
}
```

## Best Practices

### 1. Define Actions Centrally

Create a central file for your action definitions:

```typescript
// actions.ts
import { ActionPayloadMap } from '@context-action/core';

export interface AppActions extends ActionPayloadMap {
  // User actions
  login: { email: string; password: string };
  logout: void;
  updateProfile: { name: string; email: string };
  
  // Data actions
  loadData: string; // resource id
  saveData: { id: string; data: any };
  deleteData: string; // resource id
  
  // UI actions
  showModal: { type: string; props: any };
  hideModal: void;
  showNotification: { message: string; type: 'success' | 'error' };
}
```

### 2. Use Descriptive Action Names

```typescript
// Good
interface AppActions extends ActionPayloadMap {
  updateUserProfile: UserProfile;
  deleteUserAccount: { userId: string };
  showDeleteConfirmationModal: { itemId: string };
}

// Avoid
interface AppActions extends ActionPayloadMap {
  update: any;
  delete: string;
  show: any;
}
```

### 3. Separate Concerns

Keep different responsibilities in separate components:

```typescript
// Data management
function DataManager() {
  useActionHandler('loadUsers', async () => {
    const users = await api.getUsers();
    dispatch('usersLoaded', users);
  });
  
  return null;
}

// UI state management  
function UIManager() {
  const [modal, setModal] = useState(null);
  
  useActionHandler('showModal', (modal) => setModal(modal));
  useActionHandler('hideModal', () => setModal(null));
  
  return modal ? <Modal {...modal} /> : null;
}
```

### 4. Handle Errors Gracefully

```typescript
function ErrorHandler() {
  useActionHandler('apiCall', async (payload, controller) => {
    try {
      const result = await api.call(payload);
      controller.modifyPayload(() => ({ ...payload, result }));
    } catch (error) {
      console.error('API call failed:', error);
      controller.abort('API call failed');
    }
  }, { priority: 10 });
  
  return null;
}
```

## Migration from Other Libraries

### From Redux

```typescript
// Redux
const INCREMENT = 'INCREMENT';
const increment = () => ({ type: INCREMENT });
const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case INCREMENT:
      return state + 1;
    default:
      return state;
  }
};

// Context Action
interface AppActions extends ActionPayloadMap {
  increment: void;
}

function Counter() {
  const [count, setCount] = useState(0);
  const dispatch = useAction();
  
  useActionHandler('increment', () => setCount(prev => prev + 1));
  
  return (
    <button onClick={() => dispatch('increment')}>
      Count: {count}
    </button>
  );
}
```

### From Context + useReducer

```typescript
// Context + useReducer
const CounterContext = createContext();
const counterReducer = (state, action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    default:
      return state;
  }
};

// Context Action
interface AppActions extends ActionPayloadMap {
  increment: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();

function Counter() {
  const [count, setCount] = useState(0);
  
  useActionHandler('increment', () => setCount(prev => prev + 1));
  
  // Rest of component...
}
```

## Next Steps

- Explore [Core API](/api/core/) for advanced pipeline features
- Check out [Examples](/examples/) for real-world usage patterns
- Read the [Getting Started Guide](/guide/getting-started) for comprehensive tutorials