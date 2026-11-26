# @context-action/core

Type-safe action pipeline management library for **vanilla JavaScript/TypeScript** applications with advanced filtering, performance optimizations, and optional React integration support.

> **✨ Framework-Agnostic**: Works with vanilla JavaScript, React, Vue, Svelte, or any JavaScript environment. No framework dependencies required!

> Local candidate: optional `/element` DOM bindings and `/element/react` host bridge.
> The default Action entry stays DOM/React-free. See [ownership, lifecycle and release limits](docs/element-interop.md).
> These exports are not in the current registry release.

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

For production pipelines, prefer the explicit role-based contract ([`#v20-pipeline-contract`](#v20-pipeline-contract)): `registerGuard`, `registerCommand`, `registerResult`, and `registerObserver`.

## Tool protocol boundary

MCP, JSON Schema, provider conversion, action schemas, and approval queues are
owned by [`@context-action/tool-protocol`](../tool-protocol/README.md). Core
only owns action registration and execution. This keeps the runtime usable
without a tool-calling or Zod dependency.

Install the protocol package separately when an integration needs it:

```bash
npm install @context-action/tool-protocol zod
```

The action execution and state-management boundaries are documented in
[Action contracts](docs/action-contracts.md). Core owns dispatch control flow;
Store snapshots and time-travel history belong to the React store layer.

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
    import { createStateStore } from 'https://esm.sh/@context-action/store-core@latest';

    // Zero-dependency state container + action pipeline
    const counterStore = createStateStore('counter', { count: 0 });
    const actions = new ActionRegister({ name: 'Counter' });

    // Register handler
    actions.register('increment', () => {
      const current = counterStore.getValue();
      counterStore.setValue({ count: current.count + 1 });
    });

    // Subscribe to updates
    counterStore.subscribe(() => {
      document.getElementById('counter').textContent = String(counterStore.getValue().count);
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

## v2.0 Pipeline Contract

### Phase-specific registration

New pipelines should make their role explicit: guards decide admission,
void command handlers (`registerCommand`) mutate state or run side effects
without publishing results, result handlers contribute typed results, and
observers run after the terminal result.

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface AppActions extends ActionPayloadMap {
  save: { id: string; valid: boolean };
  reset: void;
}

interface AppResults {
  save: { persisted: true };
}

const registry = new ActionRegister<AppActions, AppResults>({ name: 'App' });

registry.registerGuard('save', payload => {
  if (!payload.valid) throw new Error('Save requires valid input');
}, { id: 'validate-save' });

registry.registerCommand('reset', (_payload, controller) => {
  if (controller.signal?.aborted) return;
}, { id: 'reset-state' });

registry.registerResult('save', async payload => {
  await Promise.resolve(payload);
  return { persisted: true };
}, {
  id: 'persist-save',
  scheduling: 'await-before-next',
  errorPolicy: 'fatal',
});

registry.registerObserver('save', event => {
  console.info(event.outcome);
}, { when: 'always' });
```

`register()` and `HandlerConfig.blocking` remain supported compatibility APIs
in 1.x. Prefer the phase-specific methods plus explicit `scheduling` and
`errorPolicy` for new code.

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
  scheduling: 'await-before-next',
  errorPolicy: 'fatal',
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

### Per-Action Policies, Proxy Dispatching & Dispatch Tracing

Define queue and timeout defaults once in `ActionRegisterConfig.actions`, call
actions ergonomically via cached `actions` / `actionsWithResult` proxies, and
observe dispatch lifecycles with `subscribeDispatchTrace()`:

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  isActionTimeoutError,
  type ActionPayloadMap,
  type ActionResultMap,
} from '@context-action/core';

interface ServiceActions extends ActionPayloadMap {
  save: { id: string };
  ping: void;
}

interface ServiceResults extends ActionResultMap<ServiceActions> {
  save: { id: string };
}

const registry = new ActionRegister<ServiceActions, ServiceResults>({
  name: 'ServiceActions',
  actions: {
    save: { lane: 'orchestrated', queue: 'serial', timeout: 5000 },
    ping: { lane: 'fast' },
  },
  registry: {
    errorHandler: (error, context) => {
      console.error('Unhandled dispatch error:', error.message, context);
    },
  },
});

const unsubscribeTrace = registry.subscribeDispatchTrace(
  event => {
    console.info(event.dispatchId, event.action, event.phase, event.status);
  },
  { actions: ['save'] },
);

registry.registerCommand('ping', () => {
  // Stays on the fast sequential path even while 'save' is traced
});

registry.registerResult('save', async payload => {
  await Promise.resolve();
  return { id: payload.id };
});

async function runExample() {
  try {
    await registry.actions.ping();
    const execution = await registry.actionsWithResult.save({ id: 'item-1' });
    console.info(execution.outcome, execution.result);
  } catch (error) {
    if (isActionTimeoutError(error)) {
      console.warn(`Timed out "${error.action}" after ${error.timeout}ms`);
    }
  } finally {
    unsubscribeTrace();
    await registry.destroyAsync();
  }
}

void runExample;
```

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
  createActionContext,
  ReactDevUtils,
} from '@context-action/react';

// `useActionHandler` and `useActionRegister` are returned by the action
// context factory from `@context-action/react`; the core package is framework-agnostic.
const { useActionHandler, useActionRegister } = createActionContext<MyActions>('MyActions');

// React hook pattern
function MyComponent() {
  const registry = useActionRegister();
  
  // Auto-cleanup on unmount, HMR support
  useActionHandler(
    'userAction',
    async (payload) => {
      // Handler logic
    },
    { priority: 10 }
  );
  
  // Direct registry dispatch with error handling
  const handleDispatch = useCallback(async (action, payload) => {
    if (!registry) return;
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
- **Compiled Pipeline Cache** — Lazily compiles per-action `CompiledActionPipeline` snapshots (guards, non-guards, result handlers, observers, timing limits, `once` flags) and invalidates only on registration, replacement, removal, or clear mutations
- **2-Tier Dispatch Engine** — Default sequential `dispatch()` calls without active trace listeners, per-call options, queues, schemas, guards, observers, timing guards, or `once` handlers run on a low-allocation fast sequential path with seamless sync-to-async continuation (`await-before-next` and `start-and-continue`) while maintaining semantic parity with `dispatchWithResult()` (cooperative abort/shutdown cancellation, normalized errors, original-payload `errorHandler` delivery, role controller surfaces, and safe `.then` getter handling)
- **Single-Attempt & Timeout Scope Bypass** — Skips `AbortController` / `AbortSignal.any()` and timer/outcome wrapper allocations when `maxAttempts === 1` and neither `timeout` nor caller `signal` is specified
- **Explicit debug mode** — logs are emitted only with `registry.debug: true`
- **Optimized handler ID generation** without random numbers
- **Lazy execution-mode allocations** — defers controller, error array, and non-blocking promise tracking allocations until needed
- **Automatic memory cleanup** with idle guard state cleanup
- **Opt-in concurrency queue** for explicit ordering (`useConcurrencyQueue` or per-action `actions[key].queue: 'serial'`)

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

### One-time handler lifecycle

`once: true` means at most one invocation per registration, including concurrent
dispatches and retries. A skipped condition does not consume the registration.
In parallel/race mode, all handler conditions are evaluated before execution;
if a condition throws, no result handler starts and uninvoked once handlers
remain available. Sequential mode evaluates conditions as it reaches each handler,
so previously executed handlers are not rolled back.

Once observers also run at most once, even when concurrent dispatches wait for
an earlier observer. Cleanup runs once after started work settles. This is an
in-memory registration guarantee, not persistent or cross-process deduplication.

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
}
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

// Close admission now but defer user cleanup until the next microtask.
await registry.destroyAsync({ deferCleanup: true });
```

## Element Transport & Sync UI Pipeline (`@context-action/core/element`)

Framework-neutral synchronous UI pipeline and DOM host transport live in `@context-action/core/element` (and the optional injected-runtime React bridge in `@context-action/core/element/react`), keeping the package root (`@context-action/core`) free of DOM and React dependencies. Headless ARIA interaction engines (`createRovingFocusController`, `createPointerGestureSession`, `createDismissLayer`) live in the separate Foundation package [`@context-action/interactions`](../interactions/README.md):

- `createElementBinding(element, config, options?)`: Reconciles complete input snapshots onto an `HTMLElement` in deterministic `events -> attributes -> styles -> properties` order, tracking per-binding ownership so omitted attributes, CSS custom properties (`--*`), inline styles, and properties are cleaned up once without touching host-owned state.
- `createElementFacade(allowlist)`: Creates a frozen, lazily bound imperative facade over a mounted host element.
- `createSyncActionPipeline(name)`: Three-phase synchronous UI pipeline (`registerGuard` with `abort`/`modifyPayload` -> `register` with `setResult` -> `registerObserver` with `when: 'success' | 'failure' | 'always'`, `priority`, and `once`) for DOM pointer and keyboard events.
- `toReactPartProps(partProps, config)` & `@context-action/core/element/react` (`createReactElementBridge`): Projects headless part props and config onto React 18/19 hosts without adding a package-level React dependency.

See [element transport and host lifecycle adapters](docs/element-interop.md) for ownership rules, host framework patterns, and release boundary details.

## API Reference

### ActionRegister<T, TResultMap>

#### Registration Methods
- `registerGuard<K>(action, handler, config?)` - Register preflight admission/normalization guard (`await-before-next`, `errorPolicy: 'fatal'`)
- `registerCommand<K>(action, handler, config?)` - Register Phase 2 void command handler (cannot publish results)
- `registerResult<K>(action, handler, config?)` - Register a typed result handler participating in `TResultMap`
- `registerObserver<K>(action, handler, config?)` - Register a terminal observer receiving immutable `ActionObserverEvent`
- `registerEffect<K>(action, handler, config)` - Dynamic 1.x compatibility helper for `'guard' | 'observer'` effects
- `register<K>(action, handler, config?)` - Legacy 1.x compatibility registration API
- `clearAction(action)` - Remove all handlers and invalidate compiled cache for an action
- `clearAll()` - Remove all handlers, guards, observers, and compiled caches

#### Dispatch & Proxy Methods
- `dispatch<K>(action, payload?, options?)` - Dispatch action (routes eligible default sequential pipelines through the fast path)
- `dispatchWithResult<K>(action, payload?, options?)` - Dispatch with full orchestration, validation, retry telemetry, and `ExecutionResult<R>`
- `actions` - Cached Proxy exposing each action key as a typed `dispatch()` function
- `actionsWithResult` - Cached Proxy exposing each action key as a typed `dispatchWithResult()` function
- `cancelPendingDispatches()` - Reject queued operations waiting in `OperationQueue` without unregistering handlers

#### Tracing, Inspection & Execution Mode Methods
- `subscribeDispatchTrace(listener, options?)` - Subscribe to `'started'` / `'settled'` `ActionDispatchTrace` lifecycle events, optionally scoped via `{ actions: [...] }` so unrelated fast-lane actions keep bypassing trace hooks
- `getActionPolicy(action)` - Inspect resolved contract-level `ActionPolicyConfig` (`lane`, `queue`, `timeout`, `trace`)
- `getHandlerCount(action)` / `hasHandlers(action)` / `getRegisteredActions()` - Inspect registered actions and handler counts
- `getRegistryInfo()` / `getActionStats(action)` / `getAllActionStats()` - Inspect registry configuration and priority groupings
- `getUnregisterFunctionCount()` / `hasUnregisterFunction(handlerId)` - Track active unregister leases
- `setExecutionMode(mode)` / `setActionExecutionMode(action, mode)` / `getActionExecutionMode(action)` / `removeActionExecutionMode(action)` - Configure global or per-action execution modes (`'sequential' | 'parallel' | 'race'`)
- `getName()` / `getRegistryConfig()` / `isDebugEnabled()` - Inspect instance identity and configuration
- `destroy()` / `destroyAsync({ deferCleanup? })` - Reject new work immediately and drain active dispatches/handlers before running cleanup

#### Role-Scoped Controller Surfaces

| Role | Controller Interface | Exposed Members |
|---|---|---|
| `guard` | `ActionGuardController<T>` | `signal`, `getPayload()`, `modifyPayload()`, `abort()` |
| `command` | `ActionCommandController<T>` | `signal`, `getPayload()`, `abort()` |
| `result` | `ActionResultController<T, R>` | `signal`, `getPayload()`, `abort()`, `return()`, `setResult()`, `getResults()`, `mergeResult()` |
| `legacy` | `PipelineController<T, R>` | `signal`, `getPayload()`, `modifyPayload()`, `abort()`, `jumpToPriority()`, `return()`, `setResult()`, `getResults()`, `mergeResult()` |
| `observer` | *(No controller)* | Receives frozen `ActionObserverEvent<T, R>` (`action`, `payload`, `outcome`, `result`, `errors`, `signal`) |

### Configuration & Result Interfaces

```typescript
interface ActionRegisterConfig<T extends ActionPayloadMap = ActionPayloadMap> {
  name?: string;
  actions?: Partial<Record<ActionNames<T>, {
    lane?: 'fast' | 'orchestrated';
    queue?: 'serial' | 'immediate';
    timeout?: number;
    trace?: boolean;
  }>>;
  registry?: {
    debug?: boolean;
    autoCleanup?: boolean;
    defaultExecutionMode?: 'sequential' | 'parallel' | 'race';
    useConcurrencyQueue?: boolean;
    maxHandlersPerAction?: number;
    maxJumps?: number;
    errorHandler?: (error: Error, context: unknown) => void | Promise<void>;
    schema?: Record<string, ActionSchemaLike>;
    validateOnDispatch?: boolean;
    validationMode?: 'strict' | 'warn' | 'silent';
  };
}

interface HandlerConfig<T = unknown> {
  priority?: number;           // Handler priority (higher = first). Default: 0
  id?: string;                 // Unique handler identifier
  blocking?: boolean;          // Compatibility 1.x shorthand
  scheduling?: 'await-before-next' | 'start-and-continue';
  errorPolicy?: 'fatal' | 'collect';
  once?: boolean;              // At most once per registration. Default: false
  debounce?: number;           // Debounce delay in ms
  throttle?: number;           // Throttle delay in ms
  replaceExisting?: boolean;   // Replace handler with same ID. Default: true
  cleanup?: () => void;        // Teardown callback on unregister / destroy
  condition?: (payload: T) => boolean;
  metadata?: Record<string, unknown>;
  when?: 'success' | 'failure' | 'always'; // Used by registerObserver()
}

interface DispatchOptions {
  trace?: {
    transactionId?: string;
    origin?: 'user' | 'system' | 'network' | 'undo' | 'redo' | 'reset';
    label?: string;
  };
  debounce?: number;
  throttle?: number;
  executionMode?: 'sequential' | 'parallel' | 'race';
  signal?: AbortSignal;
  immediate?: boolean;         // Bypass an enabled queue
  queuePriority?: number;      // Priority within an enabled queue
  timeout?: number;            // Non-negative finite wall-clock timeout
  retryOnError?: {
    maxAttempts: number;
    delay: number;
    attemptBarrier?: 'abort-and-drain' | 'abort-and-overlap';
  };
  autoAbort?: {
    enabled: boolean;
    onControllerCreated?: (controller: AbortController) => void;
    allowHandlerAbort?: boolean;
  };
  filter?: {
    handlerIds?: string[];
    excludeHandlerIds?: string[];
    priority?: { min?: number; max?: number };
    custom?: (config: Readonly<ResolvedHandlerConfig>) => boolean;
  };
  result?: {
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    merger?: <R>(results: Array<R | undefined>) => R;
    collect?: boolean;
    maxResults?: number;
  };
}
```

`ExecutionResult<R>` returned by `dispatchWithResult()` includes:
- `outcome`: `'completed' | 'completed_with_errors' | 'failed' | 'cancelled' | 'debounced' | 'throttled'`
- `success`, `aborted`, `abortReason`, `terminated`, `validation`
- `result`, `successResults`, `results`, `failedResults`, `handlers`, `errors`, `raceDiagnostics`
- `execution`: `{ duration, admissionDuration, queueWaitDuration, pipelineDuration, retryDelayDuration?, resultProcessingDuration?, attempts?, handlersExecuted, handlersSkipped, handlersFailed, startTime, endTime }`

#### Errors & Type Guards
- `ActionValidationError` / `isActionValidationError(err)`
- `ActionTimeoutError` / `isActionTimeoutError(err)`
- `ActionRegisterDestroyedError` / `isActionRegisterDestroyedError(err)`
- `ActionResultProcessingError` / `isActionResultProcessingError(err)`
- `ActionAttemptSupersededError`

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

## Registration compatibility

Existing `register()` calls remain supported in 1.x. Migrate individual
pipelines to explicit phase registration when you need typed results,
admission guards, or terminal observers:

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  type ActionPayloadMap,
  type ActionResultMap,
} from '@context-action/core';

interface AppActions extends ActionPayloadMap {
  myAction: { id: string };
}

interface AppResults extends ActionResultMap<AppActions> {
  myAction: { persisted: true };
}

const legacyActions = new ActionRegister<AppActions, AppResults>();
const handler = (_payload: AppActions['myAction']) => ({ persisted: true } as const);

// Existing registration — still supported
legacyActions.register('myAction', handler, { id: 'persist' });
await legacyActions.dispatch('myAction', { id: 'example' });

// Or replace that registration in your application with an explicit result phase.
const migratedActions = new ActionRegister<AppActions, AppResults>();
migratedActions.registerResult('myAction', handler, {
  id: 'persist',
  scheduling: 'await-before-next',
  errorPolicy: 'fatal',
});

// Add a guard or observer only when the pipeline needs that phase.
migratedActions.registerGuard('myAction', payload => {
  if (!payload.id) throw new Error('An id is required');
});
migratedActions.registerObserver('myAction', event => {
  console.info(event.outcome);
}, { when: 'always' });
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
