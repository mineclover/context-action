# ActionRegister API

The `ActionRegister` class is the core of Context-Action's action pipeline system, providing centralized action processing with priority-based handler execution.

## Import

```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
```

## Constructor

### `new ActionRegister<T>(config?)`

Creates a new ActionRegister instance.

**Type Parameters:**
- `T extends ActionPayloadMap` - Action type definitions

**Parameters:**
- `config?` - Optional configuration object

```typescript
interface ActionRegisterConfig {
  name?: string;                    // Instance name for debugging
  registry?: {
    debug?: boolean;               // Enable debug logging
    defaultExecutionMode?: 'sequential' | 'parallel' | 'race';
    maxHandlers?: number;          // Maximum handlers per action
    autoCleanup?: boolean;         // Automatic cleanup on unmount
  };
}
```

**Example:**
```typescript
interface MyActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  processData: { data: any };
}

const actionRegister = new ActionRegister<MyActions>({
  name: 'MyAppActions',
  registry: {
    debug: false,
    defaultExecutionMode: 'sequential',
    maxHandlers: 10
  }
});
```

## Registration Methods

### `register(action, handler, config?)`

Register an action handler with optional configuration.

**Parameters:**
- `action: keyof T` - Action name
- `handler: ActionHandler<T[action]>` - Handler function
- `config?: HandlerConfig` - Handler configuration

**Returns:** `() => void` - Unregister function

```typescript
interface HandlerConfig {
  id?: string;                     // Unique handler identifier
  priority?: number;               // Execution priority (default: 1000)
  once?: boolean;                  // Execute only once (default: false)
  blocking?: boolean;              // Block until completion (default: true)
  condition?: (payload) => boolean; // Conditional execution
  metadata?: Record<string, any>;  // Custom metadata
}

type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: PipelineController
) => any | Promise<any>;
```

**Example:**
```typescript
// Basic registration
const unregister = actionRegister.register('authenticate', async (payload) => {
  return await authService.login(payload.username, payload.password);
});

// Registration with configuration
actionRegister.register('authenticate', validateInput, {
  id: 'input-validator',
  priority: 100,
  once: false,
  condition: (payload) => payload.username.length > 0
});

// Unregister handler
unregister();
```

### `hasHandlers(action)`

Check if an action has registered handlers.

**Parameters:**
- `action: keyof T` - Action name

**Returns:** `boolean`

```typescript
const hasAuthHandlers = actionRegister.hasHandlers('authenticate');
// Returns: true if handlers exist, false otherwise
```

### `getHandlerCount(action)`

Get the number of handlers registered for an action.

**Parameters:**
- `action: keyof T` - Action name  

**Returns:** `number`

```typescript
const handlerCount = actionRegister.getHandlerCount('authenticate');
// Returns: number of registered handlers
```

### `getRegisteredActions()`

Get list of all registered action names.

**Returns:** `Array<keyof T>`

```typescript
const actions = actionRegister.getRegisteredActions();
// Returns: ['authenticate', 'processData', ...]
```

### `clearAll()`

Remove all registered handlers for all actions.

**Returns:** `void`

```typescript
actionRegister.clearAll();
```

## Dispatch Methods

### `dispatch(action, payload?, options?)`

Dispatch an action with optional payload and options.

**Parameters:**
- `action: keyof T` - Action name
- `payload?: T[action]` - Action payload
- `options?: DispatchOptions` - Dispatch options

**Returns:** `Promise<any>` - Result from last executed handler

```typescript
interface DispatchOptions {
  executionMode?: 'sequential' | 'parallel' | 'race';
  timeout?: number;              // Timeout in milliseconds
  signal?: AbortSignal;          // Abort signal
}
```

**Example:**
```typescript
// Basic dispatch
await actionRegister.dispatch('authenticate', {
  username: 'john',
  password: 'secret123'
});

// Dispatch with options
await actionRegister.dispatch('processData', { data: 'test' }, {
  executionMode: 'parallel',
  timeout: 5000
});
```

### `dispatchWithResult(action, payload?, options?)`

Dispatch an action and get detailed execution results.

**Parameters:**
- `action: keyof T` - Action name
- `payload?: T[action]` - Action payload  
- `options?: DispatchResultOptions` - Dispatch options with result collection

**Returns:** `Promise<DispatchResult>` - Detailed execution result

```typescript
interface DispatchResultOptions extends DispatchOptions {
  result?: {
    collect?: boolean;           // Collect results from all handlers
  };
}

interface DispatchResult {
  success: boolean;              // Overall execution success
  aborted: boolean;              // Pipeline was aborted
  terminated: boolean;           // Pipeline was terminated early
  result?: any;                  // Final result
  results?: any[];              // All collected results
  abortReason?: string;          // Abort reason if aborted
  execution: {
    handlersExecuted: number;    // Number of handlers executed
    startTime: number;           // Start timestamp
    endTime: number;             // End timestamp
    duration: number;            // Execution duration in ms
  };
}
```

**Example:**
```typescript
const result = await actionRegister.dispatchWithResult('authenticate', {
  username: 'john',
  password: 'secret123'
}, {
  result: { collect: true }
});

console.log(result);
// {
//   success: true,
//   aborted: false,
//   terminated: false,
//   results: [
//     { step: 'validation', valid: true },
//     { step: 'authentication', user: { id: 1, username: 'john' } },
//     { step: 'audit', logged: true }
//   ],
//   execution: {
//     handlersExecuted: 3,
//     startTime: 1640995200000,
//     endTime: 1640995200500,
//     duration: 500
//   }
// }
```

## Execution Mode Methods

### `setActionExecutionMode(action, mode)`

Set execution mode for a specific action.

**Parameters:**
- `action: keyof T` - Action name
- `mode: 'sequential' | 'parallel' | 'race'` - Execution mode

**Returns:** `void`

```typescript
actionRegister.setActionExecutionMode('processData', 'parallel');
```

### `getActionExecutionMode(action)`

Get execution mode for a specific action.

**Parameters:**
- `action: keyof T` - Action name

**Returns:** `'sequential' | 'parallel' | 'race'`

```typescript
const mode = actionRegister.getActionExecutionMode('processData');
// Returns: 'parallel'
```

### `removeActionExecutionMode(action)`

Remove execution mode override, reverting to default.

**Parameters:**
- `action: keyof T` - Action name

**Returns:** `void`

```typescript
actionRegister.removeActionExecutionMode('processData');
// Reverts to default execution mode
```

## Statistics Methods

### `getActionStats(action)`

Get detailed statistics for a specific action.

**Parameters:**
- `action: keyof T` - Action name

**Returns:** `ActionStats | null`

```typescript
interface ActionStats {
  action: keyof T;
  handlerCount: number;
  handlersByPriority: Array<{
    priority: number;
    handlers: Array<{
      id?: string;
      metadata?: Record<string, any>;
    }>;
  }>;
}
```

**Example:**
```typescript
const stats = actionRegister.getActionStats('authenticate');
// Returns: { action: 'authenticate', handlerCount: 3, handlersByPriority: [...] }
```

## Pipeline Controller

The `PipelineController` is provided to each handler for advanced pipeline control:

### `controller.abort(reason?)`

Abort pipeline execution with optional reason.

**Parameters:**
- `reason?: string` - Abort reason

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!payload.username) {
    controller.abort('Username is required');
    return;
  }
});
```

### `controller.modifyPayload(modifier)`

Modify payload for subsequent handlers.

**Parameters:**
- `modifier: (current) => T[action]` - Payload modifier function

```typescript
actionRegister.register('processData', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    processed: true
  }));
});
```

### `controller.getPayload()`

Get current payload (including modifications).

**Returns:** `T[action]` - Current payload

```typescript
actionRegister.register('processData', (payload, controller) => {
  const currentPayload = controller.getPayload();
  console.log(currentPayload); // Includes any modifications
});
```

### `controller.setResult(result)`

Set intermediate result accessible to subsequent handlers.

**Parameters:**
- `result: any` - Result value

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  controller.setResult({ step: 'validation', success: true });
  return { step: 'upload', fileId: 'file-123' };
});
```

### `controller.getResults()`

Get all results from previous handlers.

**Returns:** `any[]` - Array of previous results

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  const previousResults = controller.getResults();
  // Access results from all previous handlers
});
```

### `controller.return(value)`

Terminate pipeline execution early with return value.

**Parameters:**
- `value: any` - Return value

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (isAlreadyAuthenticated()) {
    controller.return({ alreadyAuthenticated: true });
    return; // Subsequent handlers won't execute
  }
});
```

## Error Handling

ActionRegister provides graceful error handling:

- **Handler Errors**: Individual handler failures don't stop the pipeline
- **Pipeline Continuation**: Remaining handlers continue executing
- **Error Collection**: Errors are logged but don't appear in results
- **Success Status**: Pipeline succeeds if at least one handler succeeds

```typescript
actionRegister.register('processData', () => {
  throw new Error('This handler fails');
}, { priority: 100 });

actionRegister.register('processData', () => {
  return { success: true }; // This handler succeeds
}, { priority: 50 });

const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });
// result.success: true (pipeline succeeds despite one handler failing)
```

## TypeScript Integration

ActionRegister provides full TypeScript support:

```typescript
interface AppActions extends ActionPayloadMap {
  // Void action (no payload)
  logout: void;
  
  // Object payload
  updateUser: { id: string; name: string; email: string };
  
  // Primitive payload
  setTheme: 'light' | 'dark';
  
  // Optional properties
  trackEvent: { event: string; data?: any };
}

const register = new ActionRegister<AppActions>();

// Type checking enforced
register.dispatch('updateUser', {
  id: '123',
  name: 'John',
  email: 'john@example.com'
}); // ✅ Valid

register.dispatch('updateUser', {
  id: '123'
  // Missing name and email
}); // ❌ TypeScript error

register.dispatch('setTheme', 'blue'); // ❌ TypeScript error - invalid theme
```

## Examples

See the [Examples section](../../examples/action-only) for complete working examples of ActionRegister usage patterns.

## Related

- **[PipelineController API](./pipeline-controller)** - Pipeline control methods
- **[Action Context](../react/action-context)** - React integration
- **[Action Pipeline Guide](../../guide/action-pipeline)** - Detailed usage guide