# Action Pipeline System

The **Action Pipeline System** is the core of Context-Action's ViewModel layer, providing centralized action processing with priority-based handler execution and sophisticated pipeline control.

## Core Concepts

### ActionRegister

The `ActionRegister` class is the heart of the action pipeline system:

```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface MyActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  processData: { data: any; options?: Record<string, any> };
  uploadFile: { filename: string; content: string };
}

const actionRegister = new ActionRegister<MyActions>({
  name: 'MyAppActions',
  registry: {
    debug: false,
    defaultExecutionMode: 'sequential'
  }
});
```

### Handler Registration

Register handlers with priority-based execution:

```typescript
// Higher priority handlers execute first (priority 100 > 50 > 10)
actionRegister.register('authenticate', validateCredentials, { priority: 100 });
actionRegister.register('authenticate', checkRateLimit, { priority: 90 });
actionRegister.register('authenticate', performAuth, { priority: 80 });
actionRegister.register('authenticate', logAudit, { priority: 70 });
```

### Pipeline Controller

Each handler receives a `PipelineController` for advanced pipeline management:

```typescript
actionRegister.register('authenticate', async (payload, controller) => {
  // 1. Validate input
  if (!payload.username) {
    controller.abort('Username is required');
    return;
  }
  
  // 2. Modify payload for subsequent handlers
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    validated: true
  }));
  
  // 3. Set intermediate results
  controller.setResult({ step: 'validation', success: true });
  
  // 4. Return final result
  return { validated: true, user: payload.username };
});
```

## Priority-Based Execution

### Execution Order

Handlers execute in **descending priority order** (highest first):

```typescript
const executionOrder: string[] = [];

actionRegister.register('processData', () => {
  executionOrder.push('low');    // Priority: 10
}, { priority: 10 });

actionRegister.register('processData', () => {
  executionOrder.push('high');   // Priority: 100  
}, { priority: 100 });

actionRegister.register('processData', () => {
  executionOrder.push('medium'); // Priority: 50
}, { priority: 50 });

await actionRegister.dispatch('processData', { data: 'test' });
// executionOrder: ['high', 'medium', 'low']
```

### Handler Configuration

```typescript
actionRegister.register('uploadFile', handler, {
  id: 'file-processor',           // Unique identifier
  priority: 50,                   // Execution priority
  once: false,                    // Execute multiple times
  blocking: true,                 // Wait for completion
  condition: (payload) => payload.filename.endsWith('.pdf'), // Conditional execution
  metadata: {                     // Custom metadata
    description: 'PDF file processor',
    version: '1.0.0'
  }
});
```

## Pipeline Control Methods

### controller.abort()

Stop pipeline execution with optional reason:

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!isValidUser(payload.username)) {
    controller.abort('Invalid user credentials');
    return;
  }
  // Subsequent handlers won't execute
});
```

### controller.modifyPayload()

Transform payload for subsequent handlers:

```typescript
actionRegister.register('processData', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    processed: true,
    timestamp: Date.now(),
    version: '2.0'
  }));
}, { priority: 100 });

actionRegister.register('processData', (payload) => {
  // payload now includes: processed, timestamp, version
  console.log(payload.processed); // true
}, { priority: 50 });
```

### controller.setResult() and getResults()

Manage intermediate results across handlers:

```typescript
actionRegister.register('uploadFile', (payload, controller) => {
  // Set intermediate result
  controller.setResult({ step: 'validation', fileSize: 1024 });
  
  return { step: 'upload', fileId: 'file-123' };
}, { priority: 100 });

actionRegister.register('uploadFile', (payload, controller) => {
  // Access previous results
  const previousResults = controller.getResults();
  console.log(previousResults); 
  // [{ step: 'validation', fileSize: 1024 }, { step: 'upload', fileId: 'file-123' }]
}, { priority: 50 });
```

## Execution Modes

### Sequential Mode (Default)

Handlers execute one after another:

```typescript
actionRegister.setActionExecutionMode('processData', 'sequential');

// Handler 1 completes → Handler 2 starts → Handler 3 starts
```

### Parallel Mode

All handlers execute simultaneously:

```typescript
actionRegister.setActionExecutionMode('processData', 'parallel');

// Handler 1, 2, 3 all start at the same time
```

### Race Mode

First handler to complete wins:

```typescript
actionRegister.setActionExecutionMode('processData', 'race');

// First handler to return stops the rest
```

## Result Collection

### Basic Dispatch

```typescript
const result = await actionRegister.dispatch('authenticate', {
  username: 'john',
  password: 'secret123'
});
```

### Dispatch with Result Collection

```typescript
const result = await actionRegister.dispatchWithResult('uploadFile', 
  { filename: 'document.pdf', content: 'pdf content' },
  { result: { collect: true } }
);

console.log(result);
// {
//   success: true,
//   aborted: false,
//   terminated: false,
//   results: [
//     { step: 'validation', success: true },
//     { step: 'upload', fileId: 'file-123' },
//     { step: 'notification', sent: true }
//   ],
//   execution: {
//     handlersExecuted: 3,
//     startTime: 1640995200000,
//     endTime: 1640995200500,
//     duration: 500
//   }
// }
```

## Error Handling

The pipeline continues execution even when individual handlers fail:

```typescript
actionRegister.register('processData', () => {
  throw new Error('Handler 1 failed');
}, { priority: 100 });

actionRegister.register('processData', () => {
  return { success: true, step: 'recovery' };
}, { priority: 50 });

const result = await actionRegister.dispatchWithResult('processData', 
  { data: 'test' },
  { result: { collect: true } }
);

// result.success: true (pipeline succeeds)
// result.results: [{ success: true, step: 'recovery' }] (only successful results)
```

## Real-World Example: Authentication Flow

```typescript
interface AuthActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
}

const authRegister = new ActionRegister<AuthActions>();

// 1. Input validation (Priority: 100)
authRegister.register('authenticate', (payload, controller) => {
  if (!payload.username || !payload.password) {
    controller.abort('Missing credentials');
    return;
  }
  return { step: 'validation', valid: true };
}, { priority: 100, id: 'validator' });

// 2. Rate limiting (Priority: 90)
authRegister.register('authenticate', (payload) => {
  // Check rate limiting
  return { step: 'rate-limiting', allowed: true };
}, { priority: 90, id: 'rate-limiter' });

// 3. Authentication (Priority: 80)
authRegister.register('authenticate', async (payload) => {
  const user = await authenticateUser(payload.username, payload.password);
  return { 
    step: 'authentication', 
    user: { id: user.id, username: user.username },
    token: generateJWT(user)
  };
}, { priority: 80, id: 'authenticator' });

// 4. Audit logging (Priority: 70)
authRegister.register('authenticate', (payload) => {
  logAuthAttempt(payload.username, true);
  return { step: 'audit', logged: true, timestamp: Date.now() };
}, { priority: 70, id: 'auditor' });

// Execute the complete authentication pipeline
const result = await authRegister.dispatchWithResult('authenticate', {
  username: 'john',
  password: 'secret123'
}, { result: { collect: true } });

// Result contains all steps: validation → rate-limiting → authentication → audit
```

## Integration with React

The Action Pipeline integrates seamlessly with React through the Action Context pattern:

```typescript
const { Provider, useActionDispatch, useActionHandler } = createActionContext<AuthActions>('Auth');

function AuthComponent() {
  const dispatch = useActionDispatch();
  
  // Register handlers in components
  useActionHandler('authenticate', async (payload) => {
    // Handle authentication
  });
  
  const handleLogin = async () => {
    await dispatch('authenticate', { username: 'john', password: 'secret' });
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

## Next Steps

- **[Main Patterns](./patterns)** - Learn about Action Only and Store Only patterns
- **[API Reference](../api/core/action-register)** - Detailed ActionRegister API documentation  
- **[Examples](../examples/action-only)** - See Action Only pattern in practice