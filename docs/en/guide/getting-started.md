# Getting Started

Welcome to Context Action! This guide will help you get up and running with type-safe action pipeline management in your React applications.

## What is Context Action?

Context Action is a TypeScript library that provides a powerful and flexible action pipeline system with seamless React integration. It allows you to:

- Define type-safe actions with strict TypeScript checking
- Chain multiple handlers with priority control
- Handle both synchronous and asynchronous operations
- Integrate seamlessly with React Context and hooks

## Installation

Install both the core library and React integration:

::: code-group

```bash [npm]
npm install @context-action/core @context-action/react
```

```bash [pnpm]
pnpm add @context-action/core @context-action/react
```

```bash [yarn]
yarn add @context-action/core @context-action/react
```

:::

## Basic Concepts

### Action Types

First, define your action types using TypeScript interfaces:

```typescript
import { ActionPayloadMap } from '@context-action/core';

interface AppActions extends ActionPayloadMap {
  // Actions with payloads
  setCount: number;
  updateUser: { id: string; name: string };
  
  // Actions without payloads  
  increment: void;
  reset: void;
}
```

### Action Context

Create an action context for your application:

```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();
```

### Using in Components

Wrap your app with the Provider and use hooks to dispatch actions and register handlers:

```tsx
function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  const dispatch = useAction();

  // Register action handlers
  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  });

  useActionHandler('setCount', (newCount) => {
    setCount(newCount);
  });

  useActionHandler('reset', () => {
    setCount(0);
  });

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch('increment')}>
        Increment
      </button>
      <button onClick={() => dispatch('setCount', 42)}>
        Set to 42
      </button>
      <button onClick={() => dispatch('reset')}>
        Reset
      </button>
    </div>
  );
}
```

## Advanced Features

### Handler Priority

Control the execution order of handlers with priorities:

```typescript
useActionHandler('increment', () => {
  console.log('This runs first');
}, { priority: 10 });

useActionHandler('increment', () => {
  console.log('This runs second');
}, { priority: 5 });
```

### Async Handlers

Handle asynchronous operations with blocking and non-blocking modes:

```typescript
// Blocking: waits for completion
useActionHandler('saveData', async (data) => {
  await api.save(data);
}, { blocking: true });

// Non-blocking: fires and forgets
useActionHandler('logEvent', async (event) => {
  await analytics.track(event);
}, { blocking: false });
```

### Pipeline Control

Control pipeline execution with the controller:

```typescript
useActionHandler('validate', (data, controller) => {
  if (!isValid(data)) {
    controller.abort('Invalid data');
    return;
  }
  
  // Modify the payload for next handlers
  controller.modifyPayload(payload => ({
    ...payload,
    validated: true
  }));
  
  controller.next();
});
```

## Next Steps

- Learn about [Action Pipeline](/guide/action-pipeline) concepts
- Explore [Handler Configuration](/guide/handler-configuration) options
- Check out [Examples](/examples/) for real-world usage patterns
- Browse the [API Reference](/api/) for detailed documentation

## Need Help?

- [GitHub Issues](https://github.com/mineclover/context-action/issues) - Report bugs or request features
- [GitHub Discussions](https://github.com/mineclover/context-action/discussions) - Ask questions and share ideas