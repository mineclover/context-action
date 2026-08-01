# @context-action/core

Type-safe action pipeline management library for **vanilla JavaScript/TypeScript** applications with advanced filtering, performance optimizations, and optional React integration support.

> **✨ Framework-Agnostic**: Works with vanilla JavaScript, React, Vue, Svelte, or any JavaScript environment. No framework dependencies required!

## Installation

```bash
npm install @context-action/core
# or
pnpm install @context-action/core
```

### CDN (for quick prototyping)

```html
<script type="module">
  import { ActionRegister } from 'https://esm.sh/@context-action/core@latest';
  // Your code here
</script>
```

## Quick Start

```typescript
import { ActionRegister } from '@context-action/core';

// Define your action types
interface MyActions {
  increment: void;
  setCount: number;
  updateUser: { id: string; name: string };
}

// Create action register
const actions = new ActionRegister<MyActions>({
  name: 'MyApp',
  registry: { debug: true }
});

// Register handlers with priorities
actions.register('increment', () => {
  console.log('Increment called');
}, { priority: 10 });

actions.register('setCount', (count) => {
  console.log(`Setting count to: ${count}`);
}, { priority: 5 });

// Dispatch actions
await actions.dispatch('increment');
await actions.dispatch('setCount', 42);
```

## Tool protocol boundary

MCP, JSON Schema, provider conversion, action schemas, and approval queues are
owned by [`@context-action/tool-protocol`](../tool-protocol/README.md). Core
only owns action registration and execution. This keeps the runtime usable
without a tool-calling or Zod dependency.

Install the protocol package separately when an integration needs it:

```bash
npm install @context-action/tool-protocol zod
```

The React-facing registry remains in `@context-action/react`; protocol symbols
such as `defineAction`, `listAllTools`, and `ToolManagementInterface` must be
imported from `@context-action/tool-protocol`.

## 🌟 Vanilla JavaScript Support

**@context-action/core works perfectly with vanilla JavaScript!** No React, Vue, or any framework required.

### Browser Example (HTML + JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Context-Action Example</title>
</head>
<body>
  <div id="counter">0</div>
  <button id="increment">Increment</button>

  <script type="module">
    import { ActionRegister } from 'https://esm.sh/@context-action/core@latest';

    // Simple store
    class Store {
      constructor(initialState) {
        this.state = initialState;
        this.listeners = new Set();
      }
      getValue() { return this.state; }
      setValue(newState) {
        this.state = newState;
        this.listeners.forEach(fn => fn(this.state));
      }
      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }
    }

    // Create store and actions
    const counterStore = new Store({ count: 0 });
    const actions = new ActionRegister({ name: 'Counter' });

    // Register handler
    actions.register('increment', () => {
      const current = counterStore.getValue();
      counterStore.setValue({ count: current.count + 1 });
    });

    // Subscribe to updates
    counterStore.subscribe(state => {
      document.getElementById('counter').textContent = state.count;
    });

    // Wire up button
    document.getElementById('increment').onclick = () => {
      actions.dispatch('increment');
    };
  </script>
</body>
</html>
```

### Node.js Example

```javascript
import { ActionRegister } from '@context-action/core';

const actions = new ActionRegister({ name: 'MyApp' });

actions.register('processData', async (data, controller) => {
  console.log('Processing:', data);

  // Business logic here
  const result = await someAsyncOperation(data);

  controller.setResult(result);
}, { priority: 100 });

// Dispatch action
const result = await actions.dispatchWithResult('processData', {
  input: 'example'
});

console.log('Result:', result.successResults);
```

**📚 Learn More:**
- [Vanilla JavaScript Guide](../../docs/en/guide/vanilla-js-guide.md) - Complete guide with examples
- [Live Examples](../../examples/vanilla-js/) - Interactive HTML examples (counter, todo app)

### Memory Management

```typescript
// A finite limit is opt-in and fails registration explicitly on overflow.
const actions = new ActionRegister<MyActions>({
  registry: {
    maxHandlersPerAction: 1000
  }
});

// Omit maxHandlersPerAction for the default unbounded registry.
// Use a finite limit only where registration ownership is bounded and overflow
// should be treated as a programming error.
```

## 🚀 New Features (v0.4.0+)

### Advanced Filtering System

Filter handlers by priority, ID, or custom conditions:

```typescript
// Filter by priority range
await actions.dispatch('updateUser', userData, {
  filter: {
    priority: { min: 10, max: 50 }  // Only handlers with priority 10-50
  }
});

// Filter by specific handler IDs
await actions.dispatch('processData', data, {
  filter: {
    handlerIds: ['validation', 'logging'],  // Only these handlers
    excludeHandlerIds: ['analytics']        // Exclude analytics handler
  }
});

// Custom filtering logic
await actions.dispatch('secureAction', data, {
  filter: {
    custom: (config) => config.blocking === true  // Only blocking handlers
  }
});

// Combined filtering
await actions.dispatch('complexAction', data, {
  filter: {
    priority: { min: 20 },
    excludeHandlerIds: ['debug'],
    custom: (config) => !config.id.includes('test')
  }
});
```

### Enhanced Handler Configuration

```typescript
actions.register('myAction', handler, {
  priority: 10,
  id: 'my-handler',
  blocking: true,
  once: false,
  debounce: 300,
  throttle: 1000,
  replaceExisting: true  // 🆕 Replace handler with same ID (great for React HMR)
});
```

### Immediate Execution & Queue Control

```typescript
// Queueing is opt-in for shared mutable state or explicit ordering.
const queuedActions = new ActionRegister<MyActions>({
  registry: { useConcurrencyQueue: true }
});

// Bypass an enabled queue for immediate execution.
await queuedActions.dispatch('urgentAction', data, {
  immediate: true
});

// Prioritize work within an enabled queue.
await queuedActions.dispatch('backgroundTask', data, {
  queuePriority: 5
});

// Wall-clock timeout (including enabled-queue wait and retry delay).
// Rejects with ActionTimeoutError while the internal operation drains safely.
await actions.dispatch('timedAction', data, { timeout: 5000 });
```

Dispatches run independently by default. When queueing is enabled, it is
single-slot. A handler that awaits another dispatch on the **same** register
must make that nested call explicit with `{ immediate: true }`; likewise, do
not set `queuePriority` on an awaited nested `dispatchWithResult` call.

Handlers that perform cancellable I/O can observe `controller.signal`. It is
aborted for caller cancellation, timeout, provider teardown, and register
shutdown.

A timeout is a caller boundary, not a rollback. A handler that ignores its
signal can continue while the register drains it for lifecycle cleanup; do not
retry a mutation after timeout unless its operation is idempotent.

### Result Collection with Strategies

```typescript
const result = await actions.dispatchWithResult('processData', data, {
  result: {
    collect: true,
    strategy: 'all',      // 'first' | 'last' | 'all' | 'merge' | 'custom'
    maxResults: 10,
    includeErrors: true
  }
});

console.log('Results:', result.results);
console.log('Execution time:', result.execution.duration);
console.log('Success:', result.success);
```

### React Integration Helpers

```typescript
import { 
  useActionHandler, 
  ReactDevUtils 
} from '@context-action/core';

// React hook pattern
function MyComponent() {
  const registry = useActionRegister();
  
  // Auto-cleanup on unmount, HMR support
  const handlerConfig = useActionHandler(
    registry,
    'userAction', 
    async (payload) => {
      // Handler logic
    },
    { priority: 10 },
    [] // dependencies
  );
  
  // Direct registry dispatch with error handling
  const handleDispatch = useCallback(async (action, payload) => {
    try {
      await registry.dispatch(action, payload);
    } catch (error) {
      console.error(`Failed to dispatch ${action}:`, error);
    }
  }, [registry]);
}

// Development utilities
ReactDevUtils.enableDebugMode();
const stats = ReactDevUtils.getStats(registry);
```

## Core Features

### 🎯 Type-Safe Action Pipeline
- **Full TypeScript support** with compile-time type checking
- **Priority-based execution** with configurable handler ordering
- **Pipeline control** - abort, modify payloads, conditional execution
- **Multiple execution modes** - sequential, parallel, race

### ⚡ Performance & Memory Optimizations
- **Explicit debug mode** — logs are emitted only with `registry.debug: true`
- **Optimized handler ID generation** without random numbers
- **Smart array filtering** - only copies when needed
- **Automatic memory cleanup** with idle handler cleanup
- **Opt-in concurrency queue** for explicit ordering

### 🔧 Advanced Configuration

```typescript
const registry = new ActionRegister<MyActions>({
  name: 'MyApp',
  registry: {
    debug: true,
    autoCleanup: true,
    defaultExecutionMode: 'sequential',
    useConcurrencyQueue: true,
    errorHandler: (error, context) => {
      console.error('Unhandled action error:', error);
    }
  }
});
```

### 🎛️ Pipeline Controller

Full control over pipeline execution:

```typescript
actions.register('validate', (data, controller) => {
  // Abort pipeline
  if (!data.isValid) {
    controller.abort('Validation failed');
    return;
  }
  
  // Modify payload for next handlers
  controller.modifyPayload(data => ({ 
    ...data, 
    validated: true,
    timestamp: Date.now()
  }));
  
  // Jump to high-priority handlers
  if (data.urgent) {
    controller.jumpToPriority(100);
  }
  
  // Set result for collection
  controller.setResult({ validation: 'passed' });
  
  // Early return with result
  if (data.fastPath) {
    controller.return({ fastPath: true });
  }
});
```

## Advanced Usage

### Action Guard (Debounce/Throttle)

```typescript
// Built-in debounce/throttle support
actions.register('searchUsers', searchHandler, {
  debounce: 300  // Wait 300ms after last call
});

actions.register('scrollHandler', updateUI, {
  throttle: 100  // Max once per 100ms
});

// Via dispatch options
await actions.dispatch('search', query, {
  debounce: 500
});
```

### Execution Modes

```typescript
// Set execution mode per action
actions.setActionExecutionMode('logEvent', 'parallel');
actions.setActionExecutionMode('fetchData', 'race');

// Override via dispatch options
await actions.dispatch('processFiles', files, {
  executionMode: 'parallel'
});
```

### Error Handling & Recovery

```typescript
actions.register('riskyOperation', async (data, controller) => {
  try {
    const result = await riskyAPI(data);
    return result;
  } catch (error) {
    if (error.retryable) {
      // Let other handlers try
      return undefined;
    } else {
      // Abort pipeline for critical errors
      controller.abort(`Critical error: ${error.message}`);
    }
  }
});

// With retry configuration
await actions.dispatch('apiCall', data, {
  retryOnError: {
    maxAttempts: 3, // Total attempts, including the first call
    delay: 1000
  }
});
```

### Statistics & Monitoring

```typescript
// Registry information
const info = actions.getRegistryInfo();
console.log(`Total actions: ${info.totalActions}`);
console.log(`Total handlers: ${info.totalHandlers}`);

// Action-specific statistics
const stats = actions.getActionStats('updateUser');
if (stats) {
  console.log(`Handler count: ${stats.handlerCount}`);
  console.log(`Success rate: ${stats.executionStats?.successRate}%`);
  console.log(`Average duration: ${stats.executionStats?.averageDuration}ms`);
}

// Clear statistics
actions.clearExecutionStats();
```

### Cleanup & Resource Management

```typescript
// Explicit cleanup when done
const registry = new ActionRegister({ name: 'MyApp' });

// Use the registry...

// Begin terminal cleanup. New work is rejected immediately.
registry.destroy();

// Or await proof that started handlers settled and cleanup callbacks ran.
await registry.destroyAsync();
```

## API Reference

### ActionRegister<T>

#### Registration Methods
- `register<K>(action, handler, config?)` - Register action handler
- `clearAction(action)` - Remove all handlers for action  
- `clearAll()` - Remove all handlers

#### Dispatch Methods
- `dispatch<K>(action, payload?, options?)` - Dispatch action
- `dispatchWithResult<K>(action, payload?, options?)` - Dispatch with detailed results

#### Information Methods
- `getHandlerCount(action)` - Get handler count for action
- `hasHandlers(action)` - Check if action has handlers
- `getRegisteredActions()` - Get all registered action names
- `getRegistryInfo()` - Get comprehensive registry information
- `getActionStats(action)` - Get detailed action statistics

#### Execution Mode Methods
- `setActionExecutionMode(action, mode)` - Set execution mode for action
- `getActionExecutionMode(action)` - Get execution mode for action
- `removeActionExecutionMode(action)` - Reset to default execution mode

#### Utility Methods
- `getName()` - Get registry name
- `isDebugEnabled()` - Check if debug mode is enabled
- `destroy()` - Begin terminal cleanup without waiting
- `destroyAsync()` - Resolve after started handlers settle and cleanup completes

### Configuration Interfaces

```typescript
interface HandlerConfig {
  priority?: number;           // Handler priority (higher = first)
  id?: string;                // Unique handler identifier
  blocking?: boolean;          // Wait for async completion
  once?: boolean;             // Remove after first execution  
  debounce?: number;          // Debounce delay in ms
  throttle?: number;          // Throttle delay in ms
  replaceExisting?: boolean;   // Replace handler with same ID
}

interface DispatchOptions {
  debounce?: number;
  throttle?: number;
  executionMode?: 'sequential' | 'parallel' | 'race';
  signal?: AbortSignal;
  immediate?: boolean;         // Bypass an enabled queue
  queuePriority?: number;      // Priority within an enabled queue
  timeout?: number;           // Non-negative finite wall-clock timeout
  
  retryOnError?: {
    maxAttempts: number;
    delay: number;
  };
  
  filter?: {
    handlerIds?: string[];
    excludeHandlerIds?: string[];
    priority?: { min?: number; max?: number };
    custom?: (config: HandlerConfig) => boolean;
  };
  
  result?: {
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    merger?: <R>(results: R[]) => R;
    collect?: boolean;
    maxResults?: number;
    includeErrors?: boolean;
  };
}
```

## TypeScript Support

Full type safety with excellent IntelliSense support:

```typescript
interface AppActions {
  // Void actions
  reset: void;
  logout: void;
  
  // Actions with payloads
  setUser: { id: string; name: string; email: string };
  updatePreferences: { theme: 'light' | 'dark'; language: string };
  
  // Union type payloads
  navigate: { route: string } | { url: URL };
}

const actions = new ActionRegister<AppActions>();

// ✅ Type-safe - all good
await actions.dispatch('reset');
await actions.dispatch('setUser', { id: '1', name: 'John', email: 'john@example.com' });

// ❌ TypeScript errors
await actions.dispatch('setUser');              // Missing required payload
await actions.dispatch('setUser', { id: '1' }); // Missing required fields
await actions.dispatch('invalidAction');        // Unknown action
```

## Migration from v0.3.x

Most existing code works without changes. New features are opt-in:

```typescript
// v0.3.x code - still works
const actions = new ActionRegister();
actions.register('myAction', handler);
await actions.dispatch('myAction', payload);

// v0.4.x - new features available
actions.register('myAction', handler, { 
  replaceExisting: true  // New option
});

await actions.dispatch('myAction', payload, {
  filter: { priority: { min: 10 } }  // New filtering
});

// Clean up when done (recommended)
actions.destroy();
```

## Performance Tips

1. **Use handler IDs** for better debugging and filtering
2. **Enable replaceExisting** for React components to prevent duplicates
3. **Enable `useConcurrencyQueue` only** when independent dispatches must be ordered
4. **Await destroyAsync()** when shutdown completion must be guaranteed
5. **Use priority filtering** instead of excludeHandlerIds for better performance
6. **Cache ActionRegister instances** - don't create new ones frequently

## License

Apache-2.0

## Links

- [Main Repository](https://github.com/mineclover/context-action)
- [Documentation](https://mineclover.github.io/context-action/)
- [Vanilla JS Guide](../../docs/en/guide/vanilla-js-guide.md) - Complete vanilla JavaScript guide
- [Vanilla JS Examples](../../examples/vanilla-js/) - Interactive examples (counter, todo app)
- [React Package](../react/README.md) - React integration
- [Examples](../../example/README.md) - React example application
