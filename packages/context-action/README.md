# @context-action/core

A TypeScript library for type-safe action pipeline management with React integration.

## Features

- 🔒 **Type-safe**: Full TypeScript support with strict type checking
- ⚡ **Pipeline System**: Chain multiple handlers with priority control
- 🎯 **Context Integration**: Seamless React Context integration
- 🔄 **Async Support**: Handle both sync and async operations
- 🛡️ **Error Handling**: Built-in error handling and abort mechanisms
- 📦 **Lightweight**: Minimal bundle size with zero dependencies

## Installation

```bash
npm install @context-action/core
# or
yarn add @context-action/core
# or
pnpm add @context-action/core
```

## Quick Start

### 1. Define your action types

```typescript
import { ActionPayloadMap } from '@context-action/core';

interface AppActions extends ActionPayloadMap {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
}
```

### 2. Create action context

```typescript
import { createActionContext } from '@context-action/core';

const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();
```

### 3. Use in your React components

```typescript
function Counter() {
  const [count, setCount] = useState(0);
  const action = useAction();

  // Register action handlers
  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  }, { priority: 1 });

  useActionHandler('setCount', (payload) => {
    setCount(payload);
  });

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => action.dispatch('increment')}>+1</button>
      <button onClick={() => action.dispatch('setCount', 10)}>Set to 10</button>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}
```

## API Reference

### `createActionContext<T>()`

Creates a new action context with the specified action type map.

**Returns:**
- `Provider`: React context provider component
- `useAction()`: Hook to get the action dispatcher
- `useActionHandler()`: Hook to register action handlers
- `useActionContext()`: Hook to access the raw context

### `ActionRegister<T>`

Core class for managing action pipelines.

#### Methods

- `register(action, handler, config?)`: Register an action handler
- `dispatch(action, payload?)`: Dispatch an action through the pipeline

#### Handler Configuration

```typescript
interface HandlerConfig {
  priority?: number;    // Higher priority handlers run first (default: 0)
  id?: string;         // Unique identifier for the handler
  blocking?: boolean;  // Whether to wait for async handlers (default: false)
}
```

#### Pipeline Controller

Each handler receives a controller object:

```typescript
interface PipelineController<T> {
  next(): void;                           // Continue to next handler
  abort(reason?: string): void;           // Abort the pipeline
  modifyPayload(modifier: (payload: T) => T): void; // Modify payload for subsequent handlers
}
```

## Advanced Usage

### Priority-based Execution

```typescript
useActionHandler('saveData', () => {
  console.log('Validation');
}, { priority: 10 }); // Runs first

useActionHandler('saveData', () => {
  console.log('Save to database');
}, { priority: 5 }); // Runs second

useActionHandler('saveData', () => {
  console.log('Update UI');
}, { priority: 1 }); // Runs last
```

### Async Handlers

```typescript
useActionHandler('fetchData', async (payload, controller) => {
  try {
    const data = await api.fetch(payload.url);
    controller.modifyPayload(prev => ({ ...prev, data }));
  } catch (error) {
    controller.abort('Failed to fetch data');
  }
}, { blocking: true }); // Wait for this handler to complete
```

### Error Handling

```typescript
useActionHandler('riskyOperation', (payload, controller) => {
  if (!payload.isValid) {
    controller.abort('Invalid payload');
    return;
  }
  // Continue processing...
  controller.next();
});
```

## TypeScript Support

This library is written in TypeScript and provides full type safety:

```typescript
// ✅ Type-safe action dispatching
action.dispatch('setCount', 42);        // OK
action.dispatch('setCount', 'invalid'); // ❌ Type error

// ✅ Type-safe handler registration
useActionHandler('setCount', (count: number) => {
  // count is automatically typed as number
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache-2.0 © [mineclover](https://github.com/mineclover)