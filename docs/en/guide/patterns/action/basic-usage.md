# Action Basic Usage

Fundamental Action Only pattern with type-safe dispatching and handler registration.

## Import
```typescript
import { createActionContext } from '@context-action/react';
```

## Features
- ✅ Type-safe action dispatching
- ✅ Action handler registration
- ✅ Abort support
- ✅ Result handling
- ✅ Lightweight (no store overhead)

## Prerequisites

For complete setup instructions including type definitions, context creation, and provider configuration, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

This document uses the `EventActions` pattern from the setup guide:
- Type definitions → [Event Actions Pattern](../setup/basic-action-setup.md#common-action-patterns)
- Context creation → [Single Domain Context](../setup/basic-action-setup.md#single-domain-context)
- Provider setup → [Single Provider Setup](../setup/basic-action-setup.md#single-provider-setup)

## Basic Usage
```tsx
// Component implementation using the configured context
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  // Register action handlers (properly memoized)
  const userClickHandler = useCallback((payload, controller) => {
    console.log('User clicked at:', payload.x, payload.y);
    // Pure side effects, no state management
  }, []);

  const analyticsHandler = useCallback(async (payload) => {
    await fetch('/analytics', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }, []);
  
  useEventActionHandler('userClick', userClickHandler);
  useEventActionHandler('analytics', analyticsHandler);
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
    dispatch('analytics', { event: 'click', data: { timestamp: Date.now() } });
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}
```

## Advanced Features
```tsx
// Use the renamed context hooks for advanced features
const { useActionDispatchWithResult: useEventActionWithResult } = createActionContext<EventActions>('Events');

function AdvancedComponent() {
  const { 
    dispatch, 
    dispatchWithResult, 
    abortAll 
  } = useEventActionWithResult();
  
  const handleAsyncAction = async () => {
    try {
      const result = await dispatchWithResult('analytics', {
        event: 'complex-operation',
        data: { userId: 123 }
      });
      console.log('Action result:', result);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };
  
  const handleAbortAll = () => {
    abortAll(); // Abort all pending actions
  };
  
  return (
    <div>
      <button onClick={handleAsyncAction}>Async Action</button>
      <button onClick={handleAbortAll}>Abort All</button>
    </div>
  );
}
```

## Available Hooks
- `useActionDispatch()` - Basic action dispatcher
- `useActionHandler(action, handler, config?)` - Register action handlers
- `useActionDispatchWithResult()` - Advanced dispatcher with results/abort
- `useActionRegister()` - Access raw ActionRegister for delegation
- `useActionContext()` - Access raw context

## Real-World Examples

### Live Examples in Codebase
- **[Todo List Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx)** - UI Actions for form interactions
- **[Chat Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx)** - Real-time message handling
- **[User Profile Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)** - User action management
- **[Mouse Events Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/MouseEventsPage.tsx)** - High-frequency event handling
- **[Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx)** - Abortable search actions
- **[API Blocking Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ApiBlockingPage.tsx)** - Blocking action patterns

## Best Practices

### ✅ Best Practices
1. **Always Use useCallback**: Wrap all handler functions with `useCallback` to prevent infinite re-registration
2. **Handle Side Effects**: Perfect for analytics, logging, API calls
3. **Keep Lightweight**: No state management overhead
4. **Error Handling**: Use controller.abort() for error cases
5. **Async Operations**: Handle async operations with proper error boundaries

> **Important**: For detailed handler registration patterns, see the [Handler Registration Guide](../../conventions.md#handler-registration)