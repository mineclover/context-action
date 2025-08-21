# Action Pipeline System

The **Action Pipeline System** is the core of Context-Action's ViewModel layer, providing centralized action processing with sophisticated pipeline control mechanisms.

## Overview

The Action Pipeline System enables complex business logic orchestration through:

- **🏆 Priority-based execution** - Critical operations run before optional ones
- **🚧 Blocking control** - Manage execution flow and performance  
- **🛑 Abort mechanisms** - Graceful pipeline termination for business rules
- **📊 Result collection** - Inter-handler communication and coordination
- **⚡ Multiple dispatch methods** - From simple fire-and-forget to comprehensive result collection

## Core Architecture

### ActionRegister

The `ActionRegister` class orchestrates the entire pipeline system:

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
    defaultExecutionMode: 'sequential',
    defaultBlocking: true
  }
});
```

### Pipeline Controller

Each handler receives a `PipelineController` for advanced pipeline management:

```typescript
actionRegister.register('authenticate', async (payload, controller) => {
  // 1. Validate and abort if needed
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
  
  // 3. Set intermediate results for other handlers
  controller.setResult({ step: 'validation', success: true });
  
  // 4. Return final result
  return { validated: true, user: payload.username };
});
```

## Quick Start Example

```typescript
interface AuthActions extends ActionPayloadMap {
  login: { username: string; password: string };
}

const authRegister = new ActionRegister<AuthActions>();

// Priority 100: Critical validation (blocking)
authRegister.register('login', (payload, controller) => {
  if (!payload.username || !payload.password) {
    controller.abort('Missing credentials');
    return;
  }
  return { step: 'validation', valid: true };
}, { priority: 100, blocking: true, id: 'validator' });

// Priority 80: Authentication (blocking)
authRegister.register('login', async (payload) => {
  const user = await authenticateUser(payload.username, payload.password);
  return { step: 'auth', user, token: generateJWT(user) };
}, { priority: 80, blocking: true, id: 'authenticator' });

// Priority 30: Analytics (non-blocking)
authRegister.register('login', (payload) => {
  analytics.track('login_attempt', { username: payload.username });
  return { step: 'analytics', tracked: true };
}, { priority: 30, blocking: false, id: 'analytics' });

// Execute pipeline with result collection
const result = await authRegister.dispatchWithResult('login', {
  username: 'john', 
  password: 'secret123'
}, { result: { collect: true } });

if (result.success) {
  console.log('Login successful:', result.results);
} else if (result.aborted) {
  console.log('Login failed:', result.abortReason);
}
```

## Pipeline Features

Explore each pipeline feature in detail:

### Core Features
- **[Pipeline Overview](./pipeline/)** - Complete pipeline system guide
- **[Priority System](./pipeline/priority.md)** - Priority-based execution order and best practices
- **[Blocking Operations](./pipeline/blocking.md)** - Control execution flow and performance
- **[Dispatch Methods](./pipeline/dispatch.md)** - Different ways to trigger pipelines
- **[Abort Mechanisms](./pipeline/abort.md)** - Graceful pipeline termination
- **[Result Handling](./pipeline/result-handling.md)** - Inter-handler communication

### Integration Patterns
- **[Action Patterns](./patterns/action/)** - Action Only pattern with pipeline features
- **[Store Integration](./patterns/store/)** - Combining pipelines with state management
- **[MVVM Architecture](./patterns/architecture/mvvm.md)** - Pipeline role in MVVM pattern

## React Integration

The Action Pipeline integrates seamlessly with React through the Action Context pattern:

```typescript
import { createActionContext } from '@context-action/react';

const { 
  Provider: AuthActionProvider, 
  useActionDispatch, 
  useActionHandler 
} = createActionContext<AuthActions>('Auth');

function AuthComponent() {
  const dispatch = useActionDispatch();
  
  // Register handlers with pipeline features
  const loginHandler = useCallback(async (payload, controller) => {
    // Use all pipeline features: priority, abort, results, etc.
    if (!payload.username) {
      controller.abort('Username required');
      return;
    }
    
    const user = await authenticateUser(payload.username, payload.password);
    controller.setResult({ step: 'auth', userId: user.id });
    
    return { success: true, user };
  }, []);
  
  useActionHandler('login', loginHandler, { priority: 80 });
  
  const handleLogin = async () => {
    await dispatch('login', { username: 'john', password: 'secret' });
  };
  
  return <button onClick={handleLogin}>Login</button>;
}

function App() {
  return (
    <AuthActionProvider>
      <AuthComponent />
    </AuthActionProvider>
  );
}
```

## Advanced Pipeline Patterns

### Multi-Domain Pipeline

```typescript
interface ComplexActions extends ActionPayloadMap {
  processTransaction: { 
    transaction: Transaction; 
    userId: string; 
    options: ProcessingOptions;
  };
}

const register = new ActionRegister<ComplexActions>();

// Security domain (Priority 100)
register.register('processTransaction', securityValidation, { 
  priority: 100, blocking: true, id: 'security' 
});

// Business domain (Priority 80-70)  
register.register('processTransaction', businessValidation, { 
  priority: 80, blocking: true, id: 'business' 
});
register.register('processTransaction', transactionProcessing, { 
  priority: 70, blocking: true, id: 'processor' 
});

// Integration domain (Priority 60-50)
register.register('processTransaction', updateExternalSystems, { 
  priority: 60, blocking: true, id: 'integration' 
});
register.register('processTransaction', updateLocalState, { 
  priority: 50, blocking: true, id: 'state-updater' 
});

// Monitoring domain (Priority 30-10, non-blocking)
register.register('processTransaction', trackAnalytics, { 
  priority: 30, blocking: false, id: 'analytics' 
});
register.register('processTransaction', auditLog, { 
  priority: 20, blocking: false, id: 'audit' 
});
register.register('processTransaction', cleanupResources, { 
  priority: 10, blocking: false, id: 'cleanup' 
});
```

## Pipeline vs Traditional Approaches

### Traditional Approach
```typescript
// ❌ Tightly coupled, hard to test, no error isolation
async function processOrder(order: Order) {
  validateOrder(order);           // If this fails, everything stops
  await chargePayment(order);     // Tightly coupled to validation
  await updateInventory(order);   // Must handle all errors manually
  sendConfirmation(order.email);  // Blocks response for email
  trackAnalytics(order);          // Analytics failure affects order
}
```

### Pipeline Approach
```typescript
// ✅ Decoupled, testable, resilient, configurable
actionRegister.register('processOrder', validateOrder, { priority: 100, blocking: true });
actionRegister.register('processOrder', chargePayment, { priority: 90, blocking: true });
actionRegister.register('processOrder', updateInventory, { priority: 80, blocking: true });
actionRegister.register('processOrder', sendConfirmation, { priority: 40, blocking: false });
actionRegister.register('processOrder', trackAnalytics, { priority: 30, blocking: false });

// Clean execution with automatic error isolation and result collection
await actionRegister.dispatch('processOrder', order);
```

## Related

- **[Pipeline Features](./pipeline/)** - Detailed pipeline feature documentation
- **[Action Patterns](./patterns/action/)** - Learn Action Only pattern implementation
- **[Store Patterns](./patterns/store/)** - Combine with state management
- **[API Reference](../api/core/action-register)** - Complete ActionRegister API